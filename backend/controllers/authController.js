const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

async function criarAdmin(req, res) {
    const { email, senha } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        await pool.query(
            "INSERT INTO utilizadores (email, senha, tipo) VALUES (?, ?, 'admin')",
            [email, senhaHash]
        );

        res.status(201).json({
            mensagem: "Administrador criado com sucesso!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao criar administrador."
        });
    }
}

async function login(req, res) {
    const { email, senha } = req.body;

    try {
        const [usuarios] = await pool.query(
            "SELECT * FROM utilizadores WHERE email = ?",
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        const usuario = usuarios[0];

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({
                erro: "Email ou senha incorretos."
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                tipo: usuario.tipo
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            mensagem: "Login realizado com sucesso!",
            token: token,
            tipo: usuario.tipo
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
}

module.exports = {
    criarAdmin,
    login
};
