const pool = require("../config/database");

async function obterConfiguracaoLancamento(req, res) {
    try {
        const [configuracoes] = await pool.query(
            `SELECT configuracao_notas.modo, configuracao_notas.professor_id,
                    professores.nome AS professor_nome
             FROM configuracao_notas
             LEFT JOIN professores ON professores.id = configuracao_notas.professor_id
             WHERE configuracao_notas.id = 1`
        );

        if (configuracoes.length === 0) {
            return res.status(500).json({ erro: "A configuração de lançamento de notas não existe." });
        }

        res.status(200).json(configuracoes[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao carregar a configuração de lançamento de notas." });
    }
}

async function atualizarConfiguracaoLancamento(req, res) {
    const { modo } = req.body;
    const professorId = Number(req.body.professor_id);
    const modosPermitidos = ["fechado", "todos", "professor"];

    if (!modosPermitidos.includes(modo)) {
        return res.status(400).json({ erro: "Seleciona uma configuração válida para o lançamento de notas." });
    }

    if (modo === "professor" && (!Number.isSafeInteger(professorId) || professorId < 1)) {
        return res.status(400).json({ erro: "Seleciona o professor autorizado a lançar notas." });
    }

    try {
        let professorNome = null;
        const professorConfigurado = modo === "professor" ? professorId : null;

        if (professorConfigurado !== null) {
            const [professores] = await pool.query(
                `SELECT id, nome FROM professores WHERE id = ?`,
                [professorConfigurado]
            );
            if (professores.length === 0) {
                return res.status(400).json({ erro: "O professor selecionado não existe." });
            }
            professorNome = professores[0].nome;
        }

        await pool.query(
            `UPDATE configuracao_notas
             SET modo = ?, professor_id = ?
             WHERE id = 1`,
            [modo, professorConfigurado]
        );

        res.status(200).json({
            mensagem: "Permissão de lançamento de notas atualizada.",
            modo,
            professor_id: professorConfigurado,
            professor_nome: professorNome
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar a configuração de lançamento de notas." });
    }
}

module.exports = { obterConfiguracaoLancamento, atualizarConfiguracaoLancamento };