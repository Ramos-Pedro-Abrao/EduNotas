const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const { criarAluno, listarAlunos } = require("../controllers/alunoController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarAluno
);
router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarAlunos
);

module.exports = router;