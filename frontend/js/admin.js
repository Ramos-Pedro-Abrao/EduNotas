if (verificarAcesso("admin")) {
    const tabela = document.getElementById("tabela-professores");
    const form = document.getElementById("form-professor");
    const dialogo = document.getElementById("dialogo-professor");
    const pesquisa = document.getElementById("pesquisa-professores");
    const mensagem = document.getElementById("mensagem");
    const erroFormulario = document.getElementById("erro-formulario");
    const totalProfessores = document.getElementById("total-professores");
    const contadorResultados = document.getElementById("contador-resultados");
    const campoId = document.getElementById("professor-id");
    let professores = [];
    let avisoTimer;

    document.getElementById("botao-sair").addEventListener("click", sair);
    document.getElementById("novo-professor").addEventListener("click", () => abrirFormulario());
    document.getElementById("fechar-dialogo").addEventListener("click", fecharFormulario);
    document.getElementById("cancelar-dialogo").addEventListener("click", fecharFormulario);
    pesquisa.addEventListener("input", renderizarProfessores);
    dialogo.addEventListener("click", (evento) => {
        if (evento.target === dialogo) fecharFormulario();
    });
    form.addEventListener("submit", guardarProfessor);
    carregarProfessores();

    async function carregarProfessores() {
        tabela.replaceChildren(criarEstado("A carregar professores..."));

        try {
            const resposta = await api("/api/professores");
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(erroDaResposta(resposta, "Não foi possível carregar os professores."), "error");
                tabela.replaceChildren(criarEstado("Não foi possível carregar os professores."));
                return;
            }

            professores = resposta.dados;
            totalProfessores.textContent = String(professores.length);
            renderizarProfessores();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.", "error");
            tabela.replaceChildren(criarEstado("Não foi possível carregar os professores."));
        }
    }

    function renderizarProfessores() {
        const termo = pesquisa.value.trim().toLocaleLowerCase("pt");
        const filtrados = professores.filter((professor) =>
            [professor.nome, professor.telefone, professor.email]
                .some((valor) => String(valor || "").toLocaleLowerCase("pt").includes(termo))
        );

        contadorResultados.textContent = termo
            ? `${filtrados.length} de ${professores.length} professor(es)`
            : `${professores.length} professor(es)`;

        if (filtrados.length === 0) {
            tabela.replaceChildren(criarEstado(termo ? "Não foram encontrados professores para esta pesquisa." : "Ainda não existem professores registados."));
            return;
        }

        tabela.replaceChildren(...filtrados.map(criarLinhaProfessor));
    }

    function criarLinhaProfessor(professor) {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        const blocoNome = document.createElement("div");
        const avatar = document.createElement("span");
        const textoNome = document.createElement("span");
        const nomeCompleto = document.createElement("span");
        const identificador = document.createElement("small");
        const telefone = document.createElement("td");
        const email = document.createElement("td");
        const acoes = document.createElement("td");
        const editar = document.createElement("button");
        const remover = document.createElement("button");

        blocoNome.className = "student-name-cell";
        avatar.className = "student-avatar";
        avatar.textContent = String(professor.nome || "?").trim().charAt(0) || "?";
        avatar.setAttribute("aria-hidden", "true");
        nomeCompleto.textContent = professor.nome || "Sem nome";
        identificador.textContent = `ID ${professor.id}`;
        textoNome.append(nomeCompleto, identificador);
        blocoNome.append(avatar, textoNome);
        nome.append(blocoNome);
        telefone.textContent = professor.telefone || "—";
        email.textContent = professor.email || "—";
        acoes.className = "actions-cell";

        editar.className = "row-action";
        editar.type = "button";
        editar.textContent = "✎";
        editar.setAttribute("aria-label", `Editar ${professor.nome}`);
        editar.addEventListener("click", () => abrirFormulario(professor));

        remover.className = "row-action delete";
        remover.type = "button";
        remover.textContent = "⌫";
        remover.setAttribute("aria-label", `Remover ${professor.nome}`);
        remover.addEventListener("click", () => removerProfessor(professor));

        acoes.append(editar, remover);
        linha.append(nome, telefone, email, acoes);
        return linha;
    }

    function criarEstado(texto) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.className = "table-state";
        celula.colSpan = 4;
        celula.textContent = texto;
        linha.append(celula);
        return linha;
    }

    function abrirFormulario(professor = null) {
        form.reset();
        erroFormulario.textContent = "";
        campoId.value = professor ? String(professor.id) : "";
        document.getElementById("dialogo-titulo").textContent = professor ? "Editar professor" : "Novo professor";
        document.getElementById("guardar-professor").textContent = professor ? "Guardar alterações" : "Guardar professor";
        document.querySelectorAll(".create-only").forEach((campo) => {
            campo.hidden = Boolean(professor);
        });
        document.getElementById("nome").value = professor?.nome || "";
        document.getElementById("telefone").value = professor?.telefone || "";
        document.getElementById("email").required = !professor;
        document.getElementById("senha").required = !professor;
        dialogo.showModal();
        document.getElementById("nome").focus();
    }

    function fecharFormulario() {
        dialogo.close();
        form.reset();
        erroFormulario.textContent = "";
    }

    async function guardarProfessor(evento) {
        evento.preventDefault();
        erroFormulario.textContent = "";
        const id = campoId.value;
        const corpo = {
            nome: document.getElementById("nome").value.trim(),
            telefone: document.getElementById("telefone").value.trim()
        };
        const metodo = id ? "PUT" : "POST";
        const url = id ? `/api/professores/${encodeURIComponent(id)}` : "/api/professores";

        if (!id) {
            corpo.email = document.getElementById("email").value.trim();
            corpo.senha = document.getElementById("senha").value;
        }

        const botaoGuardar = document.getElementById("guardar-professor");
        botaoGuardar.disabled = true;
        botaoGuardar.textContent = "A guardar...";

        try {
            const resposta = await api(url, metodo, corpo);
            if (!resposta || !resposta.ok) {
                erroFormulario.textContent = erroDaResposta(resposta, "Não foi possível guardar os dados do professor.");
                return;
            }
            fecharFormulario();
            mostrarAviso(resposta.dados?.mensagem || "Professor guardado com sucesso.", "success");
            await carregarProfessores();
        } catch (error) {
            erroFormulario.textContent = "Não foi possível ligar ao servidor. Tenta novamente.";
        } finally {
            botaoGuardar.disabled = false;
            botaoGuardar.textContent = id ? "Guardar alterações" : "Guardar professor";
        }
    }

    async function removerProfessor(professor) {
        if (!window.confirm(`Tens a certeza de que queres remover ${professor.nome}? Esta ação não pode ser anulada.`)) return;

        try {
            const resposta = await api(`/api/professores/${encodeURIComponent(professor.id)}`, "DELETE");
            if (!resposta || !resposta.ok) {
                mostrarAviso(erroDaResposta(resposta, "Não foi possível remover o professor."), "error");
                return;
            }
            mostrarAviso(resposta.dados?.mensagem || "Professor removido com sucesso.", "success");
            await carregarProfessores();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    function erroDaResposta(resposta, alternativa) {
        return resposta?.dados?.erro || resposta?.dados?.mensagem || alternativa;
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
