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

module.exports = {
    criarProfessor,
    listarProfessores
};