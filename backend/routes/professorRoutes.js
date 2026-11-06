const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    minhasLecoes,
    minhasTurmas,
    alunosDaMinhaLecao,
    criarProfessor,
    listarProfessores,
    buscarProfessor,
    editarProfessor,
    removerProfessor
} = require("../controllers/professorController");

router.get(
    "/minhas/lecoes",
    autenticar,
    autorizar("professor"),
    minhasLecoes
);

router.get(
    "/minhas/turmas",
    autenticar,
    autorizar("professor"),
    minhasTurmas
);

router.get(
    "/minhas/lecoes/:lecao_id/alunos",
    autenticar,
    autorizar("professor"),
    alunosDaMinhaLecao
);

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarProfessor
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarProfessores
);
router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarProfessor
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarProfessor
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerProfessor
);

module.exports = router;