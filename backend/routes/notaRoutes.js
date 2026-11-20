const express = require("express");
const router = express.Router();

const autenticar = require("../middlewares/authMiddleware");
const autorizar = require("../middlewares/autorizar");
const {
    obterConfiguracaoLancamento,
    atualizarConfiguracaoLancamento
} = require("../controllers/configuracaoNotaController");

const {
    lancarNota,
    minhasNotas,
    notasPorLecao
} = require("../controllers/notaController");

router.get(
    "/configuracao",
    autenticar,
    autorizar("admin"),
    obterConfiguracaoLancamento
);

router.put(
    "/configuracao",
    autenticar,
    autorizar("admin"),
    atualizarConfiguracaoLancamento
);

// Professor lança/atualiza nota
router.post(
    "/",
    autenticar,
    lancarNota
);

// Aluno consulta as próprias notas
router.get(
    "/minhas",
    autenticar,
    minhasNotas
);

// Professor (dono) ou Admin consultam notas de uma Lecao
router.get(
    "/lecao/:lecao_id",
    autenticar,
    notasPorLecao
);

module.exports = router;