const pool = require("../config/database");

async function criarTurma(req, res) {
    const { nome, curso_id, classe_id } = req.body;

    if (!nome || !curso_id || !classe_id) {
        return res.status(400).json({
            erro: "Nome, curso_id e classe_id são obrigatórios."
        });
    }

    try {
        await pool.query(
            `INSERT INTO turmas (nome, curso_id, classe_id) VALUES (?, ?, ?)`,
            [nome, curso_id, classe_id]
        );

        res.status(201).json({
            mensagem: "Turma criada com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao criar turma."
        });
    }
}

async function listarTurmas(req, res) {
    try {
        const [turmas] = await pool.query(
            `SELECT turmas.id, turmas.nome, cursos.nome AS curso, classes.nome AS classe
             FROM turmas
             JOIN cursos ON turmas.curso_id = cursos.id
             JOIN classes ON turmas.classe_id = classes.id`
        );

        res.status(200).json(turmas);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar turmas."
        });
    }
}

async function buscarTurma(req, res) {
    const { id } = req.params;

    try {
        const [turmas] = await pool.query(
            `SELECT turmas.id, turmas.nome, cursos.nome AS curso, classes.nome AS classe
             FROM turmas
             JOIN cursos ON turmas.curso_id = cursos.id
             JOIN classes ON turmas.classe_id = classes.id
             WHERE turmas.id = ?`,
            [id]
        );

        if (turmas.length === 0) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        res.status(200).json(turmas[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar turma."
        });
    }
}

async function editarTurma(req, res) {
    const { id } = req.params;
    const { nome, curso_id, classe_id } = req.body;

    if (!nome || !curso_id || !classe_id) {
        return res.status(400).json({
            erro: "Nome, curso_id e classe_id são obrigatórios."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE turmas SET nome = ?, curso_id = ?, classe_id = ? WHERE id = ?`,
            [nome, curso_id, classe_id, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Turma atualizada com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar turma."
        });
    }
}

async function removerTurma(req, res) {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `DELETE FROM turmas WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Turma não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Turma removida com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover turma."
        });
    }
}

module.exports = {
    criarTurma,
    listarTurmas,
    buscarTurma,
    editarTurma,
    removerTurma
};