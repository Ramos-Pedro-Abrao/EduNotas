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