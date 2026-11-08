if (verificarAcesso("admin")) {
    const configuracao = document.body.dataset;
    const formulario = document.getElementById("form-entidade");
    const mensagem = document.getElementById("mensagem");
    const corpoTabela = document.getElementById("tabela-entidade");
    const botaoGuardar = document.getElementById("guardar-entidade");
    const botaoCancelar = document.getElementById("cancelar-edicao");
    const tituloFormulario = document.getElementById("titulo-formulario");
    let registos = [];
    let idEmEdicao = null;
    let avisoTimer;

    document.getElementById("botao-sair").addEventListener("click", sair);
    formulario.addEventListener("submit", guardarRegisto);
    botaoCancelar.addEventListener("click", limparFormulario);

    const campos = [...formulario.querySelectorAll("[name]")];
    carregarRegistos();

    async function carregarRegistos() {
        corpoTabela.replaceChildren(criarEstado(`A carregar ${configuracao.plural.toLocaleLowerCase("pt")}...`));
        try {
            const resposta = await api(configuracao.endpoint);
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(resposta?.dados?.erro || `Não foi possível carregar ${configuracao.plural.toLocaleLowerCase("pt")}.`, "error");
                corpoTabela.replaceChildren(criarEstado(`Não foi possível carregar ${configuracao.plural.toLocaleLowerCase("pt")}.`));
                return;
            }
            registos = resposta.dados;
            renderizarRegistos();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.", "error");
            corpoTabela.replaceChildren(criarEstado(`Não foi possível carregar ${configuracao.plural.toLocaleLowerCase("pt")}.`));
        }
    }

    function renderizarRegistos() {
        if (registos.length === 0) {
            corpoTabela.replaceChildren(criarEstado(`Ainda não existem ${configuracao.plural.toLocaleLowerCase("pt")} registados.`));
            return;
        }
        corpoTabela.replaceChildren(...registos.map(criarLinha));
    }

    function criarLinha(registo) {
        const linha = document.createElement("tr");
        configuracao.colunas.split(",").forEach((coluna) => {
            const celula = document.createElement("td");
            celula.textContent = registo[coluna] ?? "—";
            linha.append(celula);
        });

        const acoes = document.createElement("td");
        acoes.className = "actions-cell";
        const editar = document.createElement("button");
        editar.className = "row-action";
        editar.type = "button";
        editar.textContent = "✎";
        editar.setAttribute("aria-label", `Editar ${configuracao.singular.toLocaleLowerCase("pt")} ${registo.nome}`);
        editar.addEventListener("click", () => iniciarEdicao(registo));

        const remover = document.createElement("button");
        remover.className = "row-action delete";
        remover.type = "button";
        remover.textContent = "⌫";
        remover.setAttribute("aria-label", `Remover ${configuracao.singular.toLocaleLowerCase("pt")} ${registo.nome}`);
        remover.addEventListener("click", () => removerRegisto(registo));

        acoes.append(editar, remover);
        linha.append(acoes);
        return linha;
    }

    function criarEstado(texto) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.className = "table-state";
        celula.colSpan = Number(configuracao.colspan);
        celula.textContent = texto;
        linha.append(celula);
        return linha;
    }

    function iniciarEdicao(registo) {
        idEmEdicao = registo.id;
        campos.forEach((campo) => {
            campo.value = registo[campo.name] ?? "";
        });
        tituloFormulario.textContent = `Editar ${configuracao.singular.toLocaleLowerCase("pt")}`;
        botaoGuardar.textContent = "Guardar alterações";
        botaoCancelar.hidden = false;
        document.getElementById("nome").focus();
    }

    function limparFormulario() {
        formulario.reset();
        idEmEdicao = null;
        tituloFormulario.textContent = `Novo ${configuracao.singular.toLocaleLowerCase("pt")}`;
        botaoGuardar.textContent = `Criar ${configuracao.singular.toLocaleLowerCase("pt")}`;
        botaoCancelar.hidden = true;
    }

    async function guardarRegisto(evento) {
        evento.preventDefault();
        mensagem.textContent = "";
        const dados = Object.fromEntries(campos.map((campo) => [
            campo.name,
            campo.tagName === "SELECT" ? Number(campo.value) : campo.value.trim()
        ]));
        if (Object.hasOwn(dados, "descricao") && !dados.descricao) dados.descricao = null;

        botaoGuardar.disabled = true;
        try {
            const resposta = await api(
                idEmEdicao ? `${configuracao.endpoint}/${encodeURIComponent(idEmEdicao)}` : configuracao.endpoint,
                idEmEdicao ? "PUT" : "POST",
                dados
            );
            if (!resposta || !resposta.ok) {
                mostrarAviso(resposta?.dados?.erro || "Não foi possível guardar o registo.", "error");
                return;
            }
            mostrarAviso(resposta.dados?.mensagem || "Registo guardado com sucesso.", "success");
            limparFormulario();
            await carregarRegistos();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            botaoGuardar.disabled = false;
        }
    }

    async function removerRegisto(registo) {
        if (!window.confirm(`Tens a certeza de que queres remover ${configuracao.singular.toLocaleLowerCase("pt")} "${registo.nome}"?`)) return;
        try {
            const resposta = await api(`${configuracao.endpoint}/${encodeURIComponent(registo.id)}`, "DELETE");
            if (!resposta || !resposta.ok) {
                mostrarAviso(resposta?.dados?.erro || "Não foi possível remover o registo.", "error");
                return;
            }
            mostrarAviso(resposta.dados?.mensagem || "Registo removido com sucesso.", "success");
            await carregarRegistos();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    function mostrarAviso(texto, tipo) {
        window.clearTimeout(avisoTimer);
        mensagem.textContent = texto;
        mensagem.className = `notice ${tipo}`;
        avisoTimer = window.setTimeout(() => {
            mensagem.textContent = "";
            mensagem.className = "notice";
        }, 6000);
    }
}
