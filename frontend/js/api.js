function verificarAcesso(tipoEsperado) {
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipo");

    if (!token || tipo !== tipoEsperado) {
        window.location.href = "/";
    }
}

async function api(url, metodo = "GET", corpo = null) {
    const opcoes = {
        method: metodo,
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    };

    if (corpo) {
        opcoes.headers["Content-Type"] = "application/json";
        opcoes.body = JSON.stringify(corpo);
    }

    const resposta = await fetch(url, opcoes);

    // token inválido ou expirado: volta ao login
    if (resposta.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
    }

    const dados = await resposta.json();
    return { ok: resposta.ok, dados };
}

function sair() {
    localStorage.clear();
    window.location.href = "/";
}