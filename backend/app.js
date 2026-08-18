const express = require("express");
const pool = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const autenticar = require("./middlewares/authMiddleware");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);

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

app.get("/api/teste-protegido", autenticar, (req, res) => {
    res.json({
        mensagem: "Você está autenticado!",
        usuario: req.usuario
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});