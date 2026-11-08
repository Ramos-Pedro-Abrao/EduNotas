if (verificarAcesso("admin")) {
    const formulario = document.getElementById("form-curso");
    const tabela = document.getElementById("tabela-cursos");
    const mensagem = document.getElementById("mensagem");
    const nome = document.getElementById("nome");
    const descricao = document.getElementById("descricao");
    const tituloFormulario = document.getElementById("titulo-formulario");
    const botaoGuardar = document.getElementById("guardar-curso");
    const botaoCancelar = document.getElementById("cancelar-edicao");
    let cursos = [];
    let cursoEmEdicao = null;

    document.getElementById("botao-sair").addEventListener("click", sair);
    formulario.addEventListener("submit", guardarCurso);
    botaoCancelar.addEventListener("click", limparFormulario);
    carregarCursos();

    async function carregarCursos() {
        tabela.replaceChildren(criarEstado("A carregar cursos..."));
        try {
            const resposta = await api("/api/cursos");
            if (!resposta?.ok || !Array.isArray(resposta.dados)) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível carregar os cursos.", "error");
                tabela.replaceChildren(criarEstado("Não foi possível carregar os cursos."));
                return;
            }
            cursos = resposta.dados;
            renderizarCursos();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
            tabela.replaceChildren(criarEstado("Não foi possível carregar os cursos."));
        }
    }

    function renderizarCursos() {
        if (cursos.length === 0) {
            tabela.replaceChildren(criarEstado("Ainda não existem cursos registados."));
            return;
        }
        tabela.replaceChildren(...cursos.map(criarLinha));
    }

    function criarLinha(curso) {
        const linha = document.createElement("tr");
        const celulaNome = document.createElement("td");
        const celulaDescricao = document.createElement("td");
        const celulaGestao = document.createElement("td");
        const celulaAcoes = document.createElement("td");
        const gerir = document.createElement("a");
        const editar = document.createElement("button");
        const remover = document.createElement("button");

        celulaNome.textContent = curso.nome || "—";
        celulaDescricao.textContent = curso.descricao || "—";
        gerir.className = "button button-secondary row-link";
        gerir.href = `/curso.html?id=${encodeURIComponent(curso.id)}`;
        gerir.textContent = "Gerir";
        celulaGestao.append(gerir);
        celulaAcoes.className = "actions-cell";

        editar.className = "row-action";
        editar.type = "button";
        editar.textContent = "✎";
        editar.setAttribute("aria-label", `Editar curso ${curso.nome}`);
        editar.addEventListener("click", () => iniciarEdicao(curso));

        remover.className = "row-action delete";
        remover.type = "button";
        remover.textContent = "⌫";
        remover.setAttribute("aria-label", `Remover curso ${curso.nome}`);
        remover.addEventListener("click", () => removerCurso(curso));
        celulaAcoes.append(editar, remover);
        linha.append(celulaNome, celulaDescricao, celulaGestao, celulaAcoes);
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

    function iniciarEdicao(curso) {
        cursoEmEdicao = curso.id;
        nome.value = curso.nome || "";
        descricao.value = curso.descricao || "";
        tituloFormulario.textContent = "Editar curso";
        botaoGuardar.textContent = "Guardar alterações";
        botaoCancelar.hidden = false;
        nome.focus();
    }

    function limparFormulario() {
        formulario.reset();
        cursoEmEdicao = null;
        tituloFormulario.textContent = "Novo curso";
        botaoGuardar.textContent = "Criar curso";
        botaoCancelar.hidden = true;
    }

    async function guardarCurso(evento) {
        evento.preventDefault();
        mostrarMensagem("", "");
        botaoGuardar.disabled = true;
        try {
            const resposta = await api(
                cursoEmEdicao ? `/api/cursos/${encodeURIComponent(cursoEmEdicao)}` : "/api/cursos",
                cursoEmEdicao ? "PUT" : "POST",
                { nome: nome.value.trim(), descricao: descricao.value.trim() || null }
            );
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível guardar o curso.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Curso guardado com sucesso.", "success");
            limparFormulario();
            await carregarCursos();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            botaoGuardar.disabled = false;
        }
    }

    async function removerCurso(curso) {
        if (!window.confirm(`Tens a certeza de que queres remover o curso "${curso.nome}"?`)) return;
        try {
            const resposta = await api(`/api/cursos/${encodeURIComponent(curso.id)}`, "DELETE");
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível remover o curso.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Curso removido com sucesso.", "success");
            await carregarCursos();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    function mostrarMensagem(texto, tipo) {
        mensagem.textContent = texto;
        mensagem.className = tipo ? `notice ${tipo}` : "notice";
    }
}
