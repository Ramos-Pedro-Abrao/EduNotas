function responderErroBanco(res, error, mensagemErro, mensagemAssociado) {
    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            erro: "Já existe um registo com este nome."
        });
    }

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            erro: mensagemAssociado || "Este registo tem dados associados. Remove-os primeiro."
        });
    }

    console.error(error);
    return res.status(500).json({ erro: mensagemErro });
}

module.exports = responderErroBanco;
