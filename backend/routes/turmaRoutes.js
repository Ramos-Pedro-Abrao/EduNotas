const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    criarTurma,
    listarTurmas,
    buscarTurma,
    editarTurma,
    removerTurma
} = require("../controllers/turmaController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarTurma
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarTurmas
);

router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarTurma
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarTurma
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerTurma
);

module.exports = router;