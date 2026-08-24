const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function criarAluno(req, res) {
    const { nome, email, telefone, matricula, senha } = req.body;

    if (!nome || !email || !matricula || !senha) {
        return res.status(400).json({
            erro: "Nome, email, matrícula e senha são obrigatórios."
        });
    }

    const conexao = await pool.getConnection();

    
    try {
        await conexao.beginTransaction();

        const senhaHash = await bcrypt.hash(senha, 10);

        const [utilizador] = await conexao.query(
            `INSERT INTO utilizadores (email, senha, tipo)
             VALUES (?, ?, 'aluno')`,
            [email, senhaHash]
        );

        await conexao.query(
            `INSERT INTO alunos
             (nome, matricula, telefone, utilizador_id)
             VALUES (?, ?, ?, ?)`,
            [nome, matricula, telefone, utilizador.insertId]
        );

        await conexao.commit();

        res.status(201).json({
            mensagem: "Aluno criado com sucesso!"
        });

    } catch (error) {

        await conexao.rollback();

        console.error(error);

        res.status(500).json({
            erro: "Erro ao criar aluno."
        });

    } finally {
        conexao.release();
    }
}

async function listarAlunos(req, res) {
    try {
        const [alunos] = await pool.query(`SELECT alunos.id, alunos.nome, alunos.matricula, alunos.telefone, utilizadores.email FROM alunos
            JOIN utilizadores ON alunos.utilizador_id = utilizadores.id;`);
            res.status(200).json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar alunos."
        });
    }
}

module.exports = {
    criarAluno,
    listarAlunos
};