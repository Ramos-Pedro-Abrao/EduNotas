const pool = require("../config/database");
const responderErroBanco = require("../utils/responderErroBanco");

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
        responderErroBanco(res, error, "Erro ao criar curso.");
    }
}

async function listarCursos(req, res) {
    try {
        const [cursos] = await pool.query(`SELECT * FROM cursos`);
        res.status(200).json(cursos);

    } catch (error) {
        responderErroBanco(res, error, "Erro ao listar cursos.");
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
        responderErroBanco(res, error, "Erro ao buscar curso.");
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
            const [cursos] = await pool.query(`SELECT id FROM cursos WHERE id = ?`, [id]);
            if (cursos.length === 0) {
                return res.status(404).json({
                    erro: "Curso não encontrado."
                });
            }
        }

        res.status(200).json({
            mensagem: "Curso atualizado com sucesso!"
        });

    } catch (error) {
        responderErroBanco(res, error, "Erro ao atualizar curso.");
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
        responderErroBanco(res, error, "Erro ao remover curso.", "Este curso tem classes ou disciplinas associadas. Remove-as primeiro.");
    }
}

module.exports = {
    criarCurso,
    listarCursos,
    buscarCurso,
    editarCurso,
    removerCurso
};