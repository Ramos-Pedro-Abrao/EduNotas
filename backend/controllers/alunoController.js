const bcrypt = require("bcrypt");
const pool = require("../config/database");

async function criarAluno(req, res) {
    const { nome, email, telefone, matricula, senha, turma_id } = req.body;

    if (!nome || !email || !matricula || !senha || !Number.isInteger(Number(turma_id)) || Number(turma_id) < 1) {
        return res.status(400).json({
            erro: "Nome, email, matrícula, senha e turma são obrigatórios."
        });
    }

    const professorId = await obterProfessorId(req.usuario.id);
    if (!professorId || !(await professorGereTurma(professorId, Number(turma_id)))) {
        return res.status(403).json({ erro: "Só podes registar alunos nas tuas turmas." });
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
             (nome, matricula, turma_id, telefone, utilizador_id)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, matricula, Number(turma_id), telefone || null, utilizador.insertId]
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
        const [alunos] = await pool.query(
            `SELECT alunos.id, alunos.nome, alunos.matricula, alunos.turma_id,
                    turmas.nome AS turma, alunos.telefone, utilizadores.email
             FROM alunos
             JOIN utilizadores ON alunos.utilizador_id = utilizadores.id
             LEFT JOIN turmas ON alunos.turma_id = turmas.id
             WHERE EXISTS (
                 SELECT 1 FROM lecoes
                 JOIN professores ON lecoes.professor_id = professores.id
                 WHERE professores.utilizador_id = ? AND lecoes.turma_id = alunos.turma_id
             )`,
            [req.usuario.id]
        );
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
            `SELECT alunos.id, alunos.nome, alunos.matricula, alunos.turma_id,
                    turmas.nome AS turma, alunos.telefone, utilizadores.email
             FROM alunos
             JOIN utilizadores ON alunos.utilizador_id = utilizadores.id
             LEFT JOIN turmas ON alunos.turma_id = turmas.id
             WHERE alunos.id = ? AND EXISTS (
                 SELECT 1 FROM lecoes
                 JOIN professores ON lecoes.professor_id = professores.id
                 WHERE professores.utilizador_id = ? AND lecoes.turma_id = alunos.turma_id
             )`,
            [id, req.usuario.id]
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
    const { nome, telefone, matricula, turma_id } = req.body;

    if (!nome || !matricula || !Number.isInteger(Number(turma_id)) || Number(turma_id) < 1) {
        return res.status(400).json({
            erro: "Nome, matrícula e turma são obrigatórios."
        });
    }

    try {
        const professorId = await obterProfessorId(req.usuario.id);
        if (!professorId || !(await professorGereTurma(professorId, Number(turma_id)))) {
            return res.status(403).json({ erro: "Só podes transferir alunos para as tuas turmas." });
        }

        const [resultado] = await pool.query(
            `UPDATE alunos
             SET nome = ?, telefone = ?, matricula = ?, turma_id = ?
             WHERE id = ? AND EXISTS (
                 SELECT 1 FROM lecoes
                 JOIN professores ON lecoes.professor_id = professores.id
                 WHERE professores.utilizador_id = ? AND lecoes.turma_id = alunos.turma_id
             )`,
            [nome, telefone || null, matricula, Number(turma_id), id, req.usuario.id]
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
            `SELECT alunos.utilizador_id FROM alunos
             WHERE alunos.id = ? AND EXISTS (
                 SELECT 1 FROM lecoes
                 JOIN professores ON lecoes.professor_id = professores.id
                 WHERE professores.utilizador_id = ? AND lecoes.turma_id = alunos.turma_id
             )`,
            [id, req.usuario.id]
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
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
        erro: "Este aluno já tem notas lançadas e não pode ser removido."
        });
    }
        res.status(500).json({
            erro: "Erro ao remover aluno."
        });
    } finally {
        conexao.release();
    }
}

async function obterProfessorId(utilizadorId) {
    const [professores] = await pool.query(
        `SELECT id FROM professores WHERE utilizador_id = ?`,
        [utilizadorId]
    );
    return professores[0]?.id;
}

async function professorGereTurma(professorId, turmaId) {
    const [lecoes] = await pool.query(
        `SELECT id FROM lecoes WHERE professor_id = ? AND turma_id = ? LIMIT 1`,
        [professorId, turmaId]
    );
    return lecoes.length > 0;
}

module.exports = {
    criarAluno,
    listarAlunos,
    buscarAluno,
    editarAluno,
    removerAluno
};