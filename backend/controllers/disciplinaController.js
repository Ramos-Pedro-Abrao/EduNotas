const pool = require("../config/database");
const responderErroBanco = require("../utils/responderErroBanco");

async function criarDisciplina(req, res) {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome da disciplina é obrigatório."
        });
    }

    try {
        await pool.query(
            `INSERT INTO disciplinas (nome) VALUES (?)`,
            [nome]
        );

        res.status(201).json({
            mensagem: "Disciplina criada com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao criar disciplina.");
    }
}

async function listarDisciplinas(req, res) {
    try {
        const [disciplinas] = await pool.query(`SELECT * FROM disciplinas`);
        res.status(200).json(disciplinas);

    } catch (error) {
        responderErroBanco(res, error, "Erro ao listar disciplinas.");
    }
}

async function buscarDisciplina(req, res) {
    const { id } = req.params;

    try {
        const [disciplinas] = await pool.query(
            `SELECT * FROM disciplinas WHERE id = ?`,
            [id]
        );

        if (disciplinas.length === 0) {
            return res.status(404).json({
                erro: "Disciplina não encontrada."
            });
        }

        res.status(200).json(disciplinas[0]);

    } catch (error) {
        responderErroBanco(res, error, "Erro ao buscar disciplina.");
    }
}

async function editarDisciplina(req, res) {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome da disciplina é obrigatório."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE disciplinas SET nome = ? WHERE id = ?`,
            [nome, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Disciplina não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Disciplina atualizada com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao atualizar disciplina.");
    }
}

async function removerDisciplina(req, res) {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `DELETE FROM disciplinas WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Disciplina não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Disciplina removida com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao remover disciplina.", "Esta disciplina está atribuída a uma ou mais turmas. Remove essas atribuições primeiro.");
    }
}

module.exports = {
    criarDisciplina,
    listarDisciplinas,
    buscarDisciplina,
    editarDisciplina,
    removerDisciplina
};