const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");

const { criarProfessor } = require("../controllers/professorController");

router.post(
    "/",
    autenticar,
    autorizar("admin"),
    criarProfessor
);

module.exports = router;