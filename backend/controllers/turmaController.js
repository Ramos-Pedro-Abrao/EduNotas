const pool = require("../config/database");

function validarId(valor) {
    return Number.isInteger(Number(valor)) && Number(valor) > 0;
}

async function criarTurma(req, res) {
    const { nome, classe_id } = req.body;

    if (!nome || !validarId(classe_id)) {
        return res.status(400).json({ erro: "Nome e classe_id são obrigatórios." });
    }

    try {
        const [classes] = await pool.query(`SELECT id FROM classes WHERE id = ?`, [classe_id]);
        if (classes.length === 0) {
            return res.status(404).json({ erro: "Classe não encontrada." });
        }

        await pool.query(`INSERT INTO turmas (nome, classe_id) VALUES (?, ?)`, [nome, classe_id]);
        res.status(201).json({ mensagem: "Turma criada com sucesso!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe uma turma com este nome nesta classe." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao criar turma." });
    }
}

async function listarTurmas(req, res) {
    const { curso_id, classe_id } = req.query;
    const filtros = [];
    const valores = [];

    if (curso_id !== undefined) {
        if (!validarId(curso_id)) {
            return res.status(400).json({ erro: "curso_id inválido." });
        }
        filtros.push("classes.curso_id = ?");
        valores.push(curso_id);
    }
    if (classe_id !== undefined) {
        if (!validarId(classe_id)) {
            return res.status(400).json({ erro: "classe_id inválido." });
        }
        filtros.push("turmas.classe_id = ?");
        valores.push(classe_id);
    }

    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
    try {
        const [turmas] = await pool.query(
            `SELECT turmas.id, turmas.nome, turmas.classe_id,
                    classes.nome AS classe, classes.curso_id, cursos.nome AS curso
             FROM turmas
             JOIN classes ON turmas.classe_id = classes.id
             JOIN cursos ON classes.curso_id = cursos.id
             ${where}
             ORDER BY classes.nome, turmas.nome`,
            valores
        );
        res.status(200).json(turmas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao listar turmas." });
    }
}

async function buscarTurma(req, res) {
    try {
        const [turmas] = await pool.query(
            `SELECT turmas.id, turmas.nome, turmas.classe_id,
                    classes.nome AS classe, classes.curso_id, cursos.nome AS curso
             FROM turmas
             JOIN classes ON turmas.classe_id = classes.id
             JOIN cursos ON classes.curso_id = cursos.id
             WHERE turmas.id = ?`,
            [req.params.id]
        );
        if (turmas.length === 0) {
            return res.status(404).json({ erro: "Turma não encontrada." });
        }
        res.status(200).json(turmas[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar turma." });
    }
}

async function editarTurma(req, res) {
    const { nome, classe_id } = req.body;

    if (!nome || !validarId(classe_id)) {
        return res.status(400).json({ erro: "Nome e classe_id são obrigatórios." });
    }

    try {
        const [classes] = await pool.query(`SELECT id FROM classes WHERE id = ?`, [classe_id]);
        if (classes.length === 0) {
            return res.status(404).json({ erro: "Classe não encontrada." });
        }

        const [resultado] = await pool.query(
            `UPDATE turmas SET nome = ?, classe_id = ? WHERE id = ?`,
            [nome, classe_id, req.params.id]
        );
        if (resultado.affectedRows === 0) {
            const [turmas] = await pool.query(`SELECT id FROM turmas WHERE id = ?`, [req.params.id]);
            if (turmas.length === 0) {
                return res.status(404).json({ erro: "Turma não encontrada." });
            }
        }
        res.status(200).json({ mensagem: "Turma atualizada com sucesso!" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ erro: "Já existe uma turma com este nome nesta classe." });
        }
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ erro: "Esta turma tem alunos ou lições associadas e não pode mudar de classe." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar turma." });
    }
}

async function removerTurma(req, res) {
    try {
        const [resultado] = await pool.query(`DELETE FROM turmas WHERE id = ?`, [req.params.id]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "Turma não encontrada." });
        }
        res.status(200).json({ mensagem: "Turma removida com sucesso!" });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ erro: "Esta turma tem lições ou alunos associados. Remove-os primeiro." });
        }
        console.error(error);
        res.status(500).json({ erro: "Erro ao remover turma." });
    }
}

module.exports = {
    criarTurma,
    listarTurmas,
    buscarTurma,
    editarTurma,
    removerTurma
};
