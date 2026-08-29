const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function criarProfessor(req, res) {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            erro: "Nome, email e senha são obrigatórios."
        });
    }

    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const senhaHash = await bcrypt.hash(senha, 10);

        const [utilizador] = await conexao.query(
            `INSERT INTO utilizadores (email, senha, tipo)
             VALUES (?, ?, 'professor')`,
            [email, senhaHash]
        );

        await conexao.query(
            `INSERT INTO professores (nome, telefone, utilizador_id)
             VALUES (?, ?, ?)`,
            [nome, telefone, utilizador.insertId]
        );

        await conexao.commit();

        res.status(201).json({
            mensagem: "Professor criado com sucesso!"
        });

    } catch (error) {

        await conexao.rollback();

        console.error(error);

        res.status(500).json({
            erro: "Erro ao criar professor."
        });

    } finally {
        conexao.release();
    }
}

async function listarProfessores(req, res) {
    try {
        const [professores] = await pool.query(
            `SELECT professores.id, professores.nome, professores.telefone, utilizadores.email
             FROM professores
             JOIN utilizadores ON professores.utilizador_id = utilizadores.id`
        );

        res.status(200).json(professores);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar professores."
        });
    }
}

async function buscarProfessor(req, res) {
    const { id } = req.params;

    try {
        const [professores] = await pool.query(
            `SELECT professores.id, professores.nome, professores.telefone, utilizadores.email
             FROM professores
             JOIN utilizadores ON professores.utilizador_id = utilizadores.id
             WHERE professores.id = ?`,
            [id]
        );

        if (professores.length === 0) {
            return res.status(404).json({
                erro: "Professor não encontrado."
            });
        }

        res.status(200).json(professores[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar professor."
        });
    }
}

async function editarProfessor(req, res) {
    const { id } = req.params;
    const { nome, telefone } = req.body;

    if (!nome || !telefone) {
        return res.status(400).json({
            erro: "Nome e telefone são obrigatórios."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE professores
             SET nome = ?, telefone = ?
             WHERE id = ?`,
            [nome, telefone, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Professor não encontrado."
            });
        }

        res.status(200).json({
            mensagem: "Professor atualizado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar professor."
        });
    }
}

async function removerProfessor(req, res) {
    const { id } = req.params;

    const conexao = await pool.getConnection();

    try {
        const [professores] = await conexao.query(
            `SELECT utilizador_id FROM professores WHERE id = ?`,
            [id]
        );

        if (professores.length === 0) {
            return res.status(404).json({
                erro: "Professor não encontrado."
            });
        }

        const utilizadorId = professores[0].utilizador_id;

        await conexao.query(
            `DELETE FROM utilizadores WHERE id = ?`,
            [utilizadorId]
        );

        res.status(200).json({
            mensagem: "Professor removido com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover professor."
        });
    } finally {
        conexao.release();
    }
}

module.exports = {
    criarProfessor,
    listarProfessores,
    buscarProfessor,
    editarProfessor,
    removerProfessor
};