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

async function buscarAluno(req, res) {
    const { id } = req.params;

    try {
        const [alunos] = await pool.query(
            `SELECT alunos.id, alunos.nome, alunos.matricula, alunos.telefone, utilizadores.email
             FROM alunos
             JOIN utilizadores ON alunos.utilizador_id = utilizadores.id
             WHERE alunos.id = ?`,
            [id]
        );

        if (alunos.length === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado."
            });
        }

        res.status(200).json(alunos[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar aluno."
        });
    }
}

async function editarAluno(req, res) {
    const { id } = req.params;
    const { nome, telefone, matricula } = req.body;

    if (!nome || !telefone || !matricula) {
        return res.status(400).json({
            erro: "Nome, telefone e matrícula são obrigatórios."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE alunos
             SET nome = ?, telefone = ?, matricula = ?
             WHERE id = ?`,
            [nome, telefone, matricula, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado."
            });
        }

        res.status(200).json({
            mensagem: "Aluno atualizado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar aluno."
        });
    }
}

async function removerAluno(req, res) {
    const { id } = req.params;

    const conexao = await pool.getConnection();

    try {
        const [alunos] = await conexao.query(
            `SELECT utilizador_id FROM alunos WHERE id = ?`,
            [id]
        );

        if (alunos.length === 0) {
            return res.status(404).json({
                erro: "Aluno não encontrado."
            });
        }

        const utilizadorId = alunos[0].utilizador_id;

        await conexao.query(
            `DELETE FROM utilizadores WHERE id = ?`,
            [utilizadorId]
        );

        res.status(200).json({
            mensagem: "Aluno removido com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover aluno."
        });
    } finally {
        conexao.release();
    }
}

module.exports = {
    criarAluno,
    listarAlunos,
    buscarAluno,
    editarAluno,
    removerAluno
};