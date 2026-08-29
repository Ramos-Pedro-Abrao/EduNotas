const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const {
    criarClasse,
    listarClasses,
    buscarClasse,
    editarClasse,
    removerClasse
} = require("../controllers/classeController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarClasse
);

router.get(
    "/",
    autenticar,
    autorizar("admin"),
    listarClasses
);

router.get(
    "/:id",
    autenticar,
    autorizar("admin"),
    buscarClasse
);

router.put(
    "/:id",
    autenticar,
    autorizar("admin"),
    editarClasse
);

router.delete(
    "/:id",
    autenticar,
    autorizar("admin"),
    removerClasse
);

module.exports = router;