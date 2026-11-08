const pool = require("../config/database");
const responderErroBanco = require("../utils/responderErroBanco");

async function criarClasse(req, res) {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome da classe é obrigatório."
        });
    }

    try {
        await pool.query(
            `INSERT INTO classes (nome) VALUES (?)`,
            [nome]
        );

        res.status(201).json({
            mensagem: "Classe criada com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao criar classe.");
    }
}

async function listarClasses(req, res) {
    try {
        const [classes] = await pool.query(`SELECT * FROM classes`);
        res.status(200).json(classes);

    } catch (error) {
        responderErroBanco(res, error, "Erro ao listar classes.");
    }
}

async function buscarClasse(req, res) {
    const { id } = req.params;

    try {
        const [classes] = await pool.query(
            `SELECT * FROM classes WHERE id = ?`,
            [id]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                erro: "Classe não encontrada."
            });
        }

        res.status(200).json(classes[0]);

    } catch (error) {
        responderErroBanco(res, error, "Erro ao buscar classe.");
    }
}

async function editarClasse(req, res) {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome da classe é obrigatório."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE classes SET nome = ? WHERE id = ?`,
            [nome, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Classe não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Classe atualizada com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao atualizar classe.");
    }
}

async function removerClasse(req, res) {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `DELETE FROM classes WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Classe não encontrada."
            });
        }

        res.status(200).json({
            mensagem: "Classe removida com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao remover classe.", "Esta classe tem turmas associadas. Remove-as primeiro.");
    }
}

module.exports = {
    criarClasse,
    listarClasses,
    buscarClasse,
    editarClasse,
    removerClasse
};