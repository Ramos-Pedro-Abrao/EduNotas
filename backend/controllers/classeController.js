const pool = require("../config/database");

async function criarClasse(req, res) {
    const { nome, curso_id } = req.body;

    if (!nome || !Number.isInteger(Number(curso_id)) || Number(curso_id) < 1) {
        return res.status(400).json({
            erro: "Nome e curso_id são obrigatórios."
        });
    }

    try {
        const [cursos] = await pool.query(`SELECT id FROM cursos WHERE id = ?`, [curso_id]);
        if (cursos.length === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }

        await pool.query(
            `INSERT INTO classes (nome, curso_id) VALUES (?, ?)`,
            [nome, curso_id]
        );

        res.status(201).json({ mensagem: "Classe criada com sucesso!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe uma classe com este nome neste curso." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao criar classe." });
    }
}

async function listarClasses(req, res) {
    const { curso_id } = req.query;
    const valores = [];
    let filtro = "";

    if (curso_id !== undefined) {
        if (!Number.isInteger(Number(curso_id)) || Number(curso_id) < 1) {
            return res.status(400).json({ erro: "curso_id inválido." });
        }
        filtro = "WHERE classes.curso_id = ?";
        valores.push(curso_id);
    }

    try {
        const [classes] = await pool.query(
            `SELECT classes.id, classes.nome, classes.curso_id, cursos.nome AS curso
             FROM classes
             JOIN cursos ON classes.curso_id = cursos.id
             ${filtro}
             ORDER BY classes.nome`,
            valores
        );
        res.status(200).json(classes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao listar classes." });
    }
}

async function buscarClasse(req, res) {
    try {
        const [classes] = await pool.query(
            `SELECT classes.id, classes.nome, classes.curso_id, cursos.nome AS curso
             FROM classes
             JOIN cursos ON classes.curso_id = cursos.id
             WHERE classes.id = ?`,
            [req.params.id]
        );

        if (classes.length === 0) {
            return res.status(404).json({ erro: "Classe não encontrada." });
        }
        res.status(200).json(classes[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar classe." });
    }
}

async function editarClasse(req, res) {
    const { nome, curso_id } = req.body;

    if (!nome || !Number.isInteger(Number(curso_id)) || Number(curso_id) < 1) {
        return res.status(400).json({ erro: "Nome e curso_id são obrigatórios." });
    }

    try {
        const [cursos] = await pool.query(`SELECT id FROM cursos WHERE id = ?`, [curso_id]);
        if (cursos.length === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }

        const [resultado] = await pool.query(
            `UPDATE classes SET nome = ?, curso_id = ? WHERE id = ?`,
            [nome, curso_id, req.params.id]
        );
        if (resultado.affectedRows === 0) {
            const [classes] = await pool.query(`SELECT id FROM classes WHERE id = ?`, [req.params.id]);
            if (classes.length === 0) {
                return res.status(404).json({ erro: "Classe não encontrada." });
            }
        }
        res.status(200).json({ mensagem: "Classe atualizada com sucesso!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe uma classe com este nome neste curso." });
        }
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ erro: "Esta classe tem turmas associadas. Remove-as primeiro." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar classe." });
    }
}

async function removerClasse(req, res) {
    try {
        const [resultado] = await pool.query(`DELETE FROM classes WHERE id = ?`, [req.params.id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "Classe não encontrada." });
        }
        res.status(200).json({ mensagem: "Classe removida com sucesso!" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ erro: "Esta classe tem turmas associadas. Remove-as primeiro." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao remover classe." });
    }
}

module.exports = {
    criarClasse,
    listarClasses,
    buscarClasse,
    editarClasse,
    removerClasse
};
