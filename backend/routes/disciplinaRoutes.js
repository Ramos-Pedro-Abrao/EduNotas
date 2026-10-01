const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    criarDisciplina,
    listarDisciplinas,
    buscarDisciplina,
    editarDisciplina,
    removerDisciplina
} = require("../controllers/disciplinaController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarDisciplina
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarDisciplinas
);

router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarDisciplina
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarDisciplina
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerDisciplina
);

module.exports = router;