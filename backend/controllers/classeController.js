const pool = require("../config/database");

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
        console.error(error);
        res.status(500).json({
            erro: "Erro ao criar classe."
        });
    }
}

async function listarClasses(req, res) {
    try {
        const [classes] = await pool.query(`SELECT * FROM classes`);
        res.status(200).json(classes);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar classes."
        });
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
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar classe."
        });
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
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar classe."
        });
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
        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover classe."
        });
    }
}

module.exports = {
    criarClasse,
    listarClasses,
    buscarClasse,
    editarClasse,
    removerClasse
};