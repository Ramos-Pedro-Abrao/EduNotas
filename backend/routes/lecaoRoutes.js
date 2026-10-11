const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    criarLecao,
    listarLecoes,
    buscarLecao,
    editarLecao,
    removerLecao
} = require("../controllers/lecaoController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarLecao
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarLecoes
);

router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarLecao
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarLecao
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerLecao
);

module.exports = router;