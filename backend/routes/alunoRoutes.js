const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const { criarAluno, listarAlunos, buscarAluno, editarAluno, removerAluno } = require("../controllers/alunoController");

router.post(
    "/",
    autenticar,
    autorizar("professor"),
    criarAluno
);
router.get(
    "/",
    autenticar,
    autorizar("professor"),
    listarAlunos
);

router.get("/:id",
    autenticar,
    autorizar("professor"),
    buscarAluno
)

router.put(
    "/:id",
    autenticar,
    autorizar("professor"),
    editarAluno
);

router.delete(
    "/:id",
    autenticar,
    autorizar("professor"),
    removerAluno
);


module.exports = router;