const pool = require("../config/database");

async function listarDisciplinasDoCurso(req, res) {
    try {
        const [cursos] = await pool.query(`SELECT id FROM cursos WHERE id = ?`, [req.params.id]);
        if (cursos.length === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }

        const [disciplinas] = await pool.query(
            `SELECT disciplinas.id, disciplinas.nome
             FROM curso_disciplinas
             JOIN disciplinas ON curso_disciplinas.disciplina_id = disciplinas.id
             WHERE curso_disciplinas.curso_id = ?
             ORDER BY disciplinas.nome`,
            [req.params.id]
        );
        res.status(200).json(disciplinas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao listar disciplinas do curso." });
    }
}

async function associarDisciplinaAoCurso(req, res) {
    const { disciplina_id } = req.body;
    if (!Number.isInteger(Number(disciplina_id)) || Number(disciplina_id) < 1) {
        return res.status(400).json({ erro: "disciplina_id é obrigatório." });
    }

    try {
        const [cursos] = await pool.query(`SELECT id FROM cursos WHERE id = ?`, [req.params.id]);
        if (cursos.length === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }
        const [disciplinas] = await pool.query(`SELECT id FROM disciplinas WHERE id = ?`, [disciplina_id]);
        if (disciplinas.length === 0) {
            return res.status(404).json({ erro: "Disciplina não encontrada." });
        }

        await pool.query(
            `INSERT INTO curso_disciplinas (curso_id, disciplina_id) VALUES (?, ?)`,
            [req.params.id, disciplina_id]
        );
        res.status(201).json({ mensagem: "Disciplina associada ao curso com sucesso!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Disciplina já associada a este curso." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao associar disciplina ao curso." });
    }
}

async function desassociarDisciplinaDoCurso(req, res) {
    const { id, disciplina_id } = req.params;

    try {
        const [atribuicoes] = await pool.query(
            `SELECT lecoes.id
             FROM lecoes
             JOIN turmas ON lecoes.turma_id = turmas.id
             JOIN classes ON turmas.classe_id = classes.id
             WHERE classes.curso_id = ? AND lecoes.disciplina_id = ?
             LIMIT 1`,
            [id, disciplina_id]
        );
        if (atribuicoes.length > 0) {
            return res.status(409).json({
                erro: "Existem atribuições de professores com esta disciplina neste curso."
            });
        }

        const [resultado] = await pool.query(
            `DELETE FROM curso_disciplinas WHERE curso_id = ? AND disciplina_id = ?`,
            [id, disciplina_id]
        );
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "A disciplina não está associada a este curso." });
        }
        res.status(200).json({ mensagem: "Disciplina desassociada do curso com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao desassociar disciplina do curso." });
    }
}

module.exports = {
    listarDisciplinasDoCurso,
    associarDisciplinaAoCurso,
    desassociarDisciplinaDoCurso
};
