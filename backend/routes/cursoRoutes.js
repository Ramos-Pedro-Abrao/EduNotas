const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    criarCurso,
    listarCursos,
    buscarCurso,
    editarCurso,
    removerCurso
} = require("../controllers/cursoController");
const {
    listarDisciplinasDoCurso,
    associarDisciplinaAoCurso,
    desassociarDisciplinaDoCurso
} = require("../controllers/cursoDisciplinaController");

router.get(
    "/:id/disciplinas",
    autenticar,
    autorizar("admin"),
    listarDisciplinasDoCurso
);

router.post(
    "/:id/disciplinas",
    autenticar,
    autorizar("admin"),
    associarDisciplinaAoCurso
);

router.delete(
    "/:id/disciplinas/:disciplina_id",
    autenticar,
    autorizar("admin"),
    desassociarDisciplinaDoCurso
);

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarCurso
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarCursos
);

router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarCurso
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarCurso
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerCurso
);

module.exports = router;