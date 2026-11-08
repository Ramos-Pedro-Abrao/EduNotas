const bcrypt = require("bcrypt");
const pool = require("../config/database");
const { calcularMedias } = require("../services/mediaService");

async function minhasLecoes(req, res) {
    try {
        const [lecoes] = await pool.query(
            `SELECT lecoes.id, turmas.nome AS turma, classes.nome AS classe,
                    cursos.nome AS curso, disciplinas.nome AS disciplina
             FROM lecoes
             JOIN professores ON lecoes.professor_id = professores.id
             JOIN turmas ON lecoes.turma_id = turmas.id
             JOIN classes ON turmas.classe_id = classes.id
             JOIN cursos ON turmas.curso_id = cursos.id
             JOIN disciplinas ON lecoes.disciplina_id = disciplinas.id
             WHERE professores.utilizador_id = ?
             ORDER BY turmas.nome, disciplinas.nome`,
            [req.usuario.id]
        );

        res.status(200).json(lecoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao consultar as disciplinas atribuídas." });
    }
}

async function minhasTurmas(req, res) {
    try {
        const [turmas] = await pool.query(
            `SELECT DISTINCT turmas.id, turmas.nome, classes.nome AS classe, cursos.nome AS curso
             FROM lecoes
             JOIN professores ON lecoes.professor_id = professores.id
             JOIN turmas ON lecoes.turma_id = turmas.id
             JOIN classes ON turmas.classe_id = classes.id
             JOIN cursos ON turmas.curso_id = cursos.id
             WHERE professores.utilizador_id = ?
             ORDER BY turmas.nome`,
            [req.usuario.id]
        );
        res.status(200).json(turmas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao consultar as tuas turmas." });
    }
}

async function alunosDaMinhaLecao(req, res) {
    const { lecao_id } = req.params;

    try {
        const [lecoes] = await pool.query(
            `SELECT id, turma_id FROM lecoes
             WHERE id = ? AND professor_id = (
                 SELECT id FROM professores WHERE utilizador_id = ?
             )`,
            [lecao_id, req.usuario.id]
        );

        if (lecoes.length === 0) {
            return res.status(404).json({ erro: "Disciplina não encontrada nas tuas turmas." });
        }

        const [alunos] = await pool.query(
            `SELECT alunos.id, alunos.nome, alunos.matricula,
                    notas.av1, notas.av2, notas.av3,
                    notas.prova_professor, notas.prova_trimestral
             FROM alunos
             LEFT JOIN notas
                ON notas.aluno_id = alunos.id AND notas.lecao_id = ?
             WHERE alunos.turma_id = ?
             ORDER BY alunos.nome`,
            [lecao_id, lecoes[0].turma_id]
        );

        res.status(200).json(alunos.map((aluno) => ({
            ...aluno,
            ...calcularMedias(aluno)
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao consultar os alunos da disciplina." });
    }
}

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

        const [professor] = await conexao.query(
            `INSERT INTO professores (nome, telefone, utilizador_id)
             VALUES (?, ?, ?)`,
            [nome, telefone, utilizador.insertId]
        );

        await conexao.commit();

        res.status(201).json({
            mensagem: "Professor criado com sucesso!",
            id: professor.insertId
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

    if (!nome) {
        return res.status(400).json({
            erro: "Nome é obrigatório."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE professores
             SET nome = ?, telefone = ?
             WHERE id = ?`,
            [nome, telefone || null, id]
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
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                erro: "Este professor tem atribuições. Remove-as primeiro."
            });
        }

        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover professor."
        });
    } finally {
        conexao.release();
    }
}

module.exports = {
    minhasLecoes,
    minhasTurmas,
    alunosDaMinhaLecao,
    criarProfessor,
    listarProfessores,
    buscarProfessor,
    editarProfessor,
    removerProfessor
};