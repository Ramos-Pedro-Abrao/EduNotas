const pool = require("../config/database");

async function criarLecao(req, res) {
    const { professor_id, turma_id, disciplina_id } = req.body;

    if (!professor_id || !turma_id || !disciplina_id) {
        return res.status(400).json({
            erro: "professor_id, turma_id e disciplina_id são obrigatórios."
        });
    }

    try {
        const [atribuicoes] = await pool.query(
            `SELECT id FROM lecoes
             WHERE professor_id = ? AND turma_id = ? AND disciplina_id = ?
             LIMIT 1`,
            [professor_id, turma_id, disciplina_id]
        );

        if (atribuicoes.length > 0) {
            return res.status(409).json({
                erro: "Esta atribuição já existe."
            });
        }

        await pool.query(
            `INSERT INTO lecoes (professor_id, turma_id, disciplina_id) VALUES (?, ?, ?)`,
            [professor_id, turma_id, disciplina_id]
        );

        res.status(201).json({
            mensagem: "Lecao criada com sucesso!"
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Esta atribuição já existe."
            });
        }

        console.error(error);
        res.status(500).json({
            erro: "Erro ao criar lecao."
        });
    }
}

async function listarLecoes(req, res) {
    try {
        const [lecoes] = await pool.query(
            `SELECT lecoes.id, lecoes.professor_id, lecoes.turma_id, lecoes.disciplina_id,
                    professores.nome AS professor,
                    turmas.nome AS turma,
                    disciplinas.nome AS disciplina
             FROM lecoes
             JOIN professores ON lecoes.professor_id = professores.id
             JOIN turmas ON lecoes.turma_id = turmas.id
             JOIN disciplinas ON lecoes.disciplina_id = disciplinas.id`
        );

        res.status(200).json(lecoes);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar lecoes."
        });
    }
}

async function buscarLecao(req, res) {
    const { id } = req.params;

    try {
        const [lecoes] = await pool.query(
            `SELECT lecoes.id, lecoes.professor_id, lecoes.turma_id, lecoes.disciplina_id,
                    professores.nome AS professor,
                    turmas.nome AS turma,
                    disciplinas.nome AS disciplina
             FROM lecoes
             JOIN professores ON lecoes.professor_id = professores.id
             JOIN turmas ON lecoes.turma_id = turmas.id
             JOIN disciplinas ON lecoes.disciplina_id = disciplinas.id
             WHERE lecoes.id = ?`,
            [id]
        );

        if (lecoes.length === 0) {
            return res.status(404).json({
                erro: "Lecao não encontrada."
            });
        }

        res.status(200).json(lecoes[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar lecao."
        });
    }
}

async function editarLecao(req, res) {
    const { id } = req.params;
    const { professor_id, turma_id, disciplina_id } = req.body;

    if (!professor_id || !turma_id || !disciplina_id) {
        return res.status(400).json({
            erro: "professor_id, turma_id e disciplina_id são obrigatórios."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE lecoes SET professor_id = ?, turma_id = ?, disciplina_id = ? WHERE id = ?`,
            [professor_id, turma_id, disciplina_id, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Lecao não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Lecao atualizada com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar lecao."
        });
    }
}

async function removerLecao(req, res) {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `DELETE FROM lecoes WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Lecao não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Lecao removida com sucesso!"
        });

    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                erro: "Esta atribuição já tem notas lançadas e não pode ser removida."
            });
        }

        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover lecao."
        });
    }
}

module.exports = {
    criarLecao,
    listarLecoes,
    buscarLecao,
    editarLecao,
    removerLecao
};