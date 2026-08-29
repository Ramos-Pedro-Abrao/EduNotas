const pool = require("../config/database");

async function criarCurso(req, res) {
    const { nome, descricao } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome do curso é obrigatório."
        });
    }

    try {
        await pool.query(
            `INSERT INTO cursos (nome, descricao) VALUES (?, ?)`,
            [nome, descricao || null]
        );

        res.status(201).json({
            mensagem: "Curso criado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao criar curso."
        });
    }
}

async function listarCursos(req, res) {
    try {
        const [cursos] = await pool.query(`SELECT * FROM cursos`);
        res.status(200).json(cursos);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao listar cursos."
        });
    }
}

async function buscarCurso(req, res) {
    const { id } = req.params;

    try {
        const [cursos] = await pool.query(
            `SELECT * FROM cursos WHERE id = ?`,
            [id]
        );

        if (cursos.length === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado."
            });
        }

        res.status(200).json(cursos[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao buscar curso."
        });
    }
}

async function editarCurso(req, res) {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    if (!nome) {
        return res.status(400).json({
            erro: "Nome do curso é obrigatório."
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE cursos SET nome = ?, descricao = ? WHERE id = ?`,
            [nome, descricao || null, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado."
            });
        }

        res.status(200).json({
            mensagem: "Curso atualizado com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao atualizar curso."
        });
    }
}

async function removerCurso(req, res) {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `DELETE FROM cursos WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Curso não encontrado."
            });
        }

        res.status(200).json({
            mensagem: "Curso removido com sucesso!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            erro: "Erro ao remover curso."
        });
    }
}

module.exports = {
    criarCurso,
    listarCursos,
    buscarCurso,
    editarCurso,
    removerCurso
};