function autorizar(...tiposPermitidos) {
    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                erro: "Utilizador não autenticado."
            });
        }

        if (!tiposPermitidos.includes(req.usuario.tipo)) {
            return res.status(403).json({
                erro: "Você não tem permissão para realizar esta ação."
            });
        }

        next();
    };
}

module.exports = autorizar;
