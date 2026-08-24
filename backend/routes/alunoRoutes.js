const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const { criarAluno, listarAlunos, buscarAluno, editarAluno, removerAluno } = require("../controllers/alunoController");

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

router.get("/:id",
    autenticar,
    autorizar("admin"),
    buscarAluno
)

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarAluno
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerAluno
);


module.exports = router;