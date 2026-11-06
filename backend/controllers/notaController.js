const pool = require("../config/database");

async function lancarNota(req, res) {
    const { aluno_id, lecao_id, av1, av2, av3, prova_professor, prova_trimestral } = req.body;

    const camposNota = { av1, av2, av3, prova_professor, prova_trimestral };
    const notaInvalida = Object.values(camposNota).some((valor) =>
        valor !== undefined && valor !== null && valor !== "" &&
        (!Number.isFinite(Number(valor)) || Number(valor) < 0 || Number(valor) > 20)
    );
    const semNotas = Object.values(camposNota).every((valor) =>
        valor === undefined || valor === null || valor === ""
    );

    if (!aluno_id || !lecao_id || notaInvalida || semNotas) {
        return res.status(400).json({
            erro: "aluno_id e lecao_id são obrigatórios; as notas devem estar entre 0 e 20 valores."
        });
    }

    const valoresNota = Object.fromEntries(
        Object.entries(camposNota).map(([campo, valor]) => [
            campo,
            valor === undefined || valor === null || valor === "" ? null : Number(valor)
        ])
    );

    try {
        // 1. Confirmar que o utilizador logado é um professor
        const [professores] = await pool.query(
            `SELECT id FROM professores WHERE utilizador_id = ?`,
            [req.usuario.id]
        );

        if (professores.length === 0) {
            return res.status(403).json({
                erro: "Apenas professores podem lançar notas."
            });
        }

        const professorId = professores[0].id;

        // 2. Confirmar que a Lecao pertence a este professor
        const [lecoes] = await pool.query(
            `SELECT id FROM lecoes WHERE id = ? AND professor_id = ?`,
            [lecao_id, professorId]
        );

        if (lecoes.length === 0) {
            return res.status(403).json({
                erro: "Você não tem permissão para lançar notas nesta lição."
            });
        }

        const [alunos] = await pool.query(
            `SELECT id FROM alunos WHERE id = ? AND turma_id = (
                SELECT turma_id FROM lecoes WHERE id = ?
             )`,
            [aluno_id, lecao_id]
        );

        if (alunos.length === 0) {
            return res.status(400).json({
                erro: "O aluno não está inscrito na turma desta disciplina."
            });
        }

        // 3. Criar ou atualizar a nota
        await pool.query(
            `INSERT INTO notas (aluno_id, lecao_id, av1, av2, av3, prova_professor, prova_trimestral)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                av1 = COALESCE(?, av1),
                av2 = COALESCE(?, av2),
                av3 = COALESCE(?, av3),
                prova_professor = COALESCE(?, prova_professor),
                prova_trimestral = COALESCE(?, prova_trimestral)`,
            [
                aluno_id, lecao_id, valoresNota.av1, valoresNota.av2, valoresNota.av3,
                valoresNota.prova_professor, valoresNota.prova_trimestral,
                valoresNota.av1, valoresNota.av2, valoresNota.av3,
                valoresNota.prova_professor, valoresNota.prova_trimestral
            ]
        );

        res.status(200).json({
            mensagem: "Nota lançada/atualizada com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao lançar nota."
        });
    }
}

// Aluno consulta as PRÓPRIAS notas (todas as disciplinas)
async function minhasNotas(req, res) {
    try {
        const [alunos] = await pool.query(
            `SELECT id FROM alunos WHERE utilizador_id = ?`,
            [req.usuario.id]
        );

        if (alunos.length === 0) {
            return res.status(403).json({
                erro: "Apenas alunos podem consultar as próprias notas."
            });
        }

        const alunoId = alunos[0].id;

        const [notas] = await pool.query(
            `SELECT notas.av1, notas.av2, notas.av3, notas.prova_professor, notas.prova_trimestral,
                    disciplinas.nome AS disciplina, turmas.nome AS turma
             FROM notas
             JOIN lecoes ON notas.lecao_id = lecoes.id
             JOIN disciplinas ON lecoes.disciplina_id = disciplinas.id
             JOIN turmas ON lecoes.turma_id = turmas.id
             WHERE notas.aluno_id = ?`,
            [alunoId]
        );

        const notasComMedia = notas.map(nota => {
            const { av1, av2, av3 } = nota;
            let media = null;

            if (av1 !== null && av2 !== null && av3 !== null) {
                media = ((Number(av1) + Number(av2) + Number(av3)) / 3).toFixed(2);
            }

            return { ...nota, media_avaliacoes: media };
        });

        res.status(200).json(notasComMedia);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao consultar notas."
        });
    }
}

// Professor (dono) ou Admin consultam as notas de uma Lecao (todos os alunos)
async function notasPorLecao(req, res) {
    const { lecao_id } = req.params;

    try {
        if (req.usuario.tipo === "professor") {
            const [professores] = await pool.query(
                `SELECT id FROM professores WHERE utilizador_id = ?`,
                [req.usuario.id]
            );

            const professorId = professores[0]?.id;

            const [lecoes] = await pool.query(
                `SELECT id FROM lecoes WHERE id = ? AND professor_id = ?`,
                [lecao_id, professorId]
            );

            if (lecoes.length === 0) {
                return res.status(403).json({
                    erro: "Você não tem permissão para ver notas desta lição."
                });
            }
        }

        const [notas] = await pool.query(
            `SELECT notas.id, alunos.nome AS aluno,
                    notas.av1, notas.av2, notas.av3, notas.prova_professor, notas.prova_trimestral
             FROM notas
             JOIN alunos ON notas.aluno_id = alunos.id
             WHERE notas.lecao_id = ?`,
            [lecao_id]
        );

        res.status(200).json(notas);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao consultar notas."
        });
    }
}

module.exports = {
    lancarNota,
    minhasNotas,
    notasPorLecao
};