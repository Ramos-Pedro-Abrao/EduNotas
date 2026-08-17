const express = require("express");
const pool = require("./config/database");

require("dotenv").config();

const app = express();

app.get("/", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            mensagem: "EduNotas funcionando!",
            banco: "MySQL conectado!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            erro: "Erro ao conectar ao MySQL."
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});