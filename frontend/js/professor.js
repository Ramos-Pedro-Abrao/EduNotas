if (verificarAcesso("professor")) {
    const listaLecoes = document.getElementById("lista-lecoes");
    const painelPauta = document.getElementById("painel-pauta");
    const tabelaPauta = document.getElementById("tabela-pauta");
    const mensagem = document.getElementById("mensagem");
    const mensagemPauta = document.getElementById("mensagem-pauta");
    const tabelaAlunos = document.getElementById("tabela-alunos");
    const filtroTurma = document.getElementById("filtro-turma");
    const pesquisaAlunos = document.getElementById("pesquisa-alunos");
    const mensagemAlunos = document.getElementById("mensagem-alunos");
    const dialogoAluno = document.getElementById("dialogo-aluno");
    const formAluno = document.getElementById("form-aluno");
    const erroFormularioAluno = document.getElementById("erro-formulario-aluno");
    const campoIdAluno = document.getElementById("aluno-id");
    const campoTurmaAluno = document.getElementById("aluno-turma");
    let lecaoSelecionada = null;
    let turmasProfessor = [];
    let alunosProfessor = [];
    let avisoTimer;
    let pautaTimer;
    let alunosTimer;

    document.getElementById("botao-sair").addEventListener("click", sair);
    document.getElementById("atualizar-pauta").addEventListener("click", carregarPauta);
    document.getElementById("novo-aluno").addEventListener("click", () => abrirFormularioAluno());
    document.getElementById("fechar-dialogo-aluno").addEventListener("click", fecharFormularioAluno);
    document.getElementById("cancelar-dialogo-aluno").addEventListener("click", fecharFormularioAluno);
    filtroTurma.addEventListener("change", renderizarAlunos);
    pesquisaAlunos.addEventListener("input", renderizarAlunos);
    formAluno.addEventListener("submit", guardarAluno);
    dialogoAluno.addEventListener("click", (evento) => {
        if (evento.target === dialogoAluno) fecharFormularioAluno();
    });
    carregarLecoes();
    carregarTurmasProfessor();
    carregarAlunosProfessor();

    async function carregarTurmasProfessor() {
        try {
            const resposta = await api("/api/professores/minhas/turmas");
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(mensagemAlunos, erroDaResposta(resposta, "Não foi possível carregar as tuas turmas."), "error");
                filtroTurma.replaceChildren(new Option("Não foi possível carregar turmas", ""));
                campoTurmaAluno.replaceChildren(new Option("Não foi possível carregar turmas", ""));
                return;
            }

            turmasProfessor = resposta.dados;
            const opcoes = turmasProfessor.map((turma) =>
                new Option(`${turma.nome} · ${turma.classe} · ${turma.curso}`, String(turma.id))
            );
            filtroTurma.replaceChildren(new Option("Todas as minhas turmas", ""), ...opcoes);
            campoTurmaAluno.replaceChildren(new Option("Seleciona uma turma", ""), ...opcoes.map((opcao) => opcao.cloneNode(true)));
            renderizarAlunos();
        } catch (error) {
            mostrarAviso(mensagemAlunos, "Não foi possível ligar ao servidor para carregar as tuas turmas.", "error");
        }
    }

    async function carregarAlunosProfessor() {
        tabelaAlunos.replaceChildren(criarEstadoTabelaAlunos("A carregar alunos..."));
        try {
            const resposta = await api("/api/alunos");
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(mensagemAlunos, erroDaResposta(resposta, "Não foi possível carregar os alunos."), "error");
                tabelaAlunos.replaceChildren(criarEstadoTabelaAlunos("Não foi possível carregar os alunos."));
                return;
            }
            alunosProfessor = resposta.dados;
            renderizarAlunos();
        } catch (error) {
            mostrarAviso(mensagemAlunos, "Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.", "error");
            tabelaAlunos.replaceChildren(criarEstadoTabelaAlunos("Não foi possível carregar os alunos."));
        }
    }

    function renderizarAlunos() {
        if (!Array.isArray(alunosProfessor)) return;
        const turmaId = filtroTurma.value;
        const termo = pesquisaAlunos.value.trim().toLocaleLowerCase("pt");
        const filtrados = alunosProfessor.filter((aluno) => {
            const correspondeTurma = !turmaId || String(aluno.turma_id) === turmaId;
            const correspondePesquisa = [aluno.nome, aluno.matricula, aluno.turma, aluno.email]
                .some((valor) => String(valor || "").toLocaleLowerCase("pt").includes(termo));
            return correspondeTurma && correspondePesquisa;
        });

        if (filtrados.length === 0) {
            tabelaAlunos.replaceChildren(criarEstadoTabelaAlunos(
                alunosProfessor.length ? "Não foram encontrados alunos com estes filtros." : "Ainda não há alunos nas tuas turmas."
            ));
            return;
        }

        tabelaAlunos.replaceChildren(...filtrados.map(criarLinhaAluno));
    }

    function criarLinhaAluno(aluno) {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        const matricula = document.createElement("td");
        const turma = document.createElement("td");
        const email = document.createElement("td");
        const acoes = document.createElement("td");
        const badge = document.createElement("span");
        const editar = document.createElement("button");
        const remover = document.createElement("button");

        nome.textContent = aluno.nome;
        badge.className = "enrollment-badge";
        badge.textContent = aluno.matricula || "—";
        matricula.append(badge);
        turma.textContent = aluno.turma || "—";
        email.textContent = aluno.email || "—";
        acoes.className = "actions-cell";

        editar.className = "row-action";
        editar.type = "button";
        editar.textContent = "✎";
        editar.setAttribute("aria-label", `Editar ${aluno.nome}`);
        editar.addEventListener("click", () => abrirFormularioAluno(aluno));

        remover.className = "row-action delete";
        remover.type = "button";
        remover.textContent = "⌫";
        remover.setAttribute("aria-label", `Remover ${aluno.nome}`);
        remover.addEventListener("click", () => removerAluno(aluno));

        acoes.append(editar, remover);
        linha.append(nome, matricula, turma, email, acoes);
        return linha;
    }

    function abrirFormularioAluno(aluno = null) {
        formAluno.reset();
        erroFormularioAluno.textContent = "";
        campoIdAluno.value = aluno ? String(aluno.id) : "";
        document.getElementById("dialogo-aluno-titulo").textContent = aluno ? "Editar aluno" : "Novo aluno";
        document.getElementById("guardar-aluno").textContent = aluno ? "Guardar alterações" : "Guardar aluno";
        document.querySelectorAll("#dialogo-aluno .create-only").forEach((campo) => {
            campo.hidden = Boolean(aluno);
        });
        document.getElementById("aluno-nome").value = aluno?.nome || "";
        document.getElementById("aluno-matricula").value = aluno?.matricula || "";
        campoTurmaAluno.value = aluno?.turma_id ? String(aluno.turma_id) : (filtroTurma.value || "");
        document.getElementById("aluno-telefone").value = aluno?.telefone || "";
        document.getElementById("aluno-email").required = !aluno;
        document.getElementById("aluno-senha").required = !aluno;
        dialogoAluno.showModal();
        document.getElementById("aluno-nome").focus();
    }

    function fecharFormularioAluno() {
        dialogoAluno.close();
        formAluno.reset();
        erroFormularioAluno.textContent = "";
    }

    async function guardarAluno(evento) {
        evento.preventDefault();
        erroFormularioAluno.textContent = "";
        const id = campoIdAluno.value;
        const corpo = {
            nome: document.getElementById("aluno-nome").value.trim(),
            matricula: document.getElementById("aluno-matricula").value.trim(),
            turma_id: Number(campoTurmaAluno.value),
            telefone: document.getElementById("aluno-telefone").value.trim()
        };
        if (!id) {
            corpo.email = document.getElementById("aluno-email").value.trim();
            corpo.senha = document.getElementById("aluno-senha").value;
        }

        const botao = document.getElementById("guardar-aluno");
        botao.disabled = true;
        botao.textContent = "A guardar...";
        try {
            const resposta = await api(
                id ? `/api/alunos/${encodeURIComponent(id)}` : "/api/alunos",
                id ? "PUT" : "POST",
                corpo
            );
            if (!resposta || !resposta.ok) {
                erroFormularioAluno.textContent = erroDaResposta(resposta, "Não foi possível guardar os dados do aluno.");
                return;
            }
            fecharFormularioAluno();
            mostrarAviso(mensagemAlunos, resposta.dados?.mensagem || "Aluno guardado com sucesso.", "success");
            await carregarAlunosProfessor();
        } catch (error) {
            erroFormularioAluno.textContent = "Não foi possível ligar ao servidor. Tenta novamente.";
        } finally {
            botao.disabled = false;
            botao.textContent = id ? "Guardar alterações" : "Guardar aluno";
        }
    }

    async function removerAluno(aluno) {
        if (!window.confirm(`Tens a certeza de que queres remover ${aluno.nome}? Esta ação não pode ser anulada.`)) return;
        try {
            const resposta = await api(`/api/alunos/${encodeURIComponent(aluno.id)}`, "DELETE");
            if (!resposta || !resposta.ok) {
                mostrarAviso(mensagemAlunos, erroDaResposta(resposta, "Não foi possível remover o aluno."), "error");
                return;
            }
            mostrarAviso(mensagemAlunos, resposta.dados?.mensagem || "Aluno removido com sucesso.", "success");
            await carregarAlunosProfessor();
        } catch (error) {
            mostrarAviso(mensagemAlunos, "Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    async function carregarLecoes() {
        listaLecoes.replaceChildren(criarEstado("A carregar as tuas disciplinas..."));

        try {
            const resposta = await api("/api/professores/minhas/lecoes");
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(mensagem, erroDaResposta(resposta, "Não foi possível carregar as tuas disciplinas."), "error");
                listaLecoes.replaceChildren(criarEstado("Não foi possível carregar as disciplinas."));
                return;
            }

            if (resposta.dados.length === 0) {
                listaLecoes.replaceChildren(criarEstado("Ainda não tens disciplinas atribuídas."));
                return;
            }

            listaLecoes.replaceChildren(...resposta.dados.map(criarCartaoLecao));
        } catch (error) {
            mostrarAviso(mensagem, "Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.", "error");
            listaLecoes.replaceChildren(criarEstado("Não foi possível carregar as disciplinas."));
        }
    }

    function criarCartaoLecao(lecao) {
        const botao = document.createElement("button");
        const icone = document.createElement("span");
        const texto = document.createElement("span");
        const disciplina = document.createElement("strong");
        const detalhe = document.createElement("small");

        botao.className = "lesson-card";
        botao.type = "button";
        botao.setAttribute("aria-pressed", "false");
        icone.className = "lesson-icon";
        icone.textContent = "▤";
        icone.setAttribute("aria-hidden", "true");
        disciplina.textContent = lecao.disciplina;
        detalhe.textContent = `${lecao.turma} · ${lecao.classe} · ${lecao.curso}`;
        texto.append(disciplina, detalhe);
        botao.append(icone, texto);
        botao.addEventListener("click", () => selecionarLecao(lecao, botao));
        return botao;
    }

    async function selecionarLecao(lecao, cartao) {
        lecaoSelecionada = lecao;
        document.querySelectorAll(".lesson-card").forEach((item) => item.setAttribute("aria-pressed", String(item === cartao)));
        document.getElementById("pauta-titulo").textContent = `${lecao.disciplina} · ${lecao.turma}`;
        document.getElementById("pauta-contexto").textContent = `${lecao.classe} · ${lecao.curso}`;
        painelPauta.hidden = false;
        painelPauta.scrollIntoView({ behavior: "smooth", block: "start" });
        await carregarPauta();
    }

    async function carregarPauta() {
        if (!lecaoSelecionada) return;
        tabelaPauta.replaceChildren(criarEstadoTabela("A carregar a pauta..."));

        try {
            const resposta = await api(`/api/professores/minhas/lecoes/${encodeURIComponent(lecaoSelecionada.id)}/alunos`);
            if (!resposta || !resposta.ok || !Array.isArray(resposta.dados)) {
                mostrarAviso(mensagemPauta, erroDaResposta(resposta, "Não foi possível carregar a pauta."), "error");
                tabelaPauta.replaceChildren(criarEstadoTabela("Não foi possível carregar a pauta."));
                return;
            }

            if (resposta.dados.length === 0) {
                tabelaPauta.replaceChildren(criarEstadoTabela("Ainda não há alunos inscritos nesta turma."));
                return;
            }

            tabelaPauta.replaceChildren(...resposta.dados.map(criarLinhaPauta));
        } catch (error) {
            mostrarAviso(mensagemPauta, "Não foi possível ligar ao servidor. Tenta novamente.", "error");
            tabelaPauta.replaceChildren(criarEstadoTabela("Não foi possível carregar a pauta."));
        }
    }

    function criarLinhaPauta(aluno) {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        nome.textContent = aluno.nome;
        linha.append(nome);

        const campos = [
            ["av1", "Avaliação 1"],
            ["av2", "Avaliação 2"],
            ["av3", "Avaliação 3"],
            ["prova_professor", "Prova do professor"],
            ["prova_trimestral", "Prova trimestral"]
        ];

        campos.forEach(([chave, rotulo]) => {
            const celula = document.createElement("td");
            const campo = document.createElement("input");
            campo.className = "grade-input";
            campo.type = "number";
            campo.min = "0";
            campo.max = "20";
            campo.step = "0.01";
            campo.inputMode = "decimal";
            campo.placeholder = "—";
            campo.value = aluno[chave] === null ? "" : (aluno[chave] ?? "");
            campo.dataset.avaliacao = chave;
            campo.setAttribute("aria-label", `${rotulo} de ${aluno.nome}`);
            campo.addEventListener("input", () => campo.removeAttribute("aria-invalid"));
            celula.append(campo);
            linha.append(celula);
        });

        const mediaAvaliacoes = document.createElement("td");
        mediaAvaliacoes.textContent = formatarMedia(aluno.media_avaliacoes);
        linha.append(mediaAvaliacoes);

        const mediaFinal = document.createElement("td");
        mediaFinal.textContent = formatarMedia(aluno.media_final);
        linha.append(mediaFinal);

        const celulaAcao = document.createElement("td");
        const guardar = document.createElement("button");
        guardar.type = "button";
        guardar.className = "button button-primary grade-save";
        guardar.textContent = "Guardar";
        guardar.addEventListener("click", () => guardarNotas(aluno.id, linha, guardar));
        celulaAcao.append(guardar);
        linha.append(celulaAcao);
        return linha;
    }

    async function guardarNotas(alunoId, linha, botao) {
        const campos = [...linha.querySelectorAll(".grade-input")];
        let valido = true;
        const notas = {};

        campos.forEach((campo) => {
            campo.removeAttribute("aria-invalid");
            if (campo.value === "") return;

            const valor = Number(campo.value);
            if (!Number.isFinite(valor) || valor < 0 || valor > 20) {
                campo.setAttribute("aria-invalid", "true");
                valido = false;
                return;
            }
            notas[campo.dataset.avaliacao] = valor;
        });

        if (!valido) {
            mostrarAviso(mensagemPauta, "As notas devem estar entre 0 e 20 valores.", "error");
            return;
        }

        if (Object.keys(notas).length === 0) {
            mostrarAviso(mensagemPauta, "Preenche pelo menos uma nota antes de guardar.", "error");
            return;
        }

        botao.disabled = true;
        botao.textContent = "A guardar...";

        try {
            const resposta = await api("/api/notas", "POST", {
                aluno_id: alunoId,
                lecao_id: lecaoSelecionada.id,
                ...notas
            });

            if (!resposta || !resposta.ok) {
                mostrarAviso(mensagemPauta, erroDaResposta(resposta, "Não foi possível guardar as notas."), "error");
                return;
            }

            mostrarAviso(mensagemPauta, resposta.dados?.mensagem || "Notas guardadas com sucesso.", "success");
            await carregarPauta();
        } catch (error) {
            mostrarAviso(mensagemPauta, "Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            botao.disabled = false;
            botao.textContent = "Guardar";
        }
    }

    function criarEstado(texto) {
        const estado = document.createElement("p");
        estado.className = "lesson-state";
        estado.textContent = texto;
        return estado;
    }

    function criarEstadoTabela(texto) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.className = "table-state";
        celula.colSpan = 9;
        celula.textContent = texto;
        linha.append(celula);
        return linha;
    }

    function criarEstadoTabelaAlunos(texto) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.className = "table-state";
        celula.colSpan = 5;
        celula.textContent = texto;
        linha.append(celula);
        return linha;
    }

    function erroDaResposta(resposta, alternativa) {
        return resposta?.dados?.erro || resposta?.dados?.mensagem || alternativa;
    }

    function formatarMedia(valor) {
        if (valor === null || valor === undefined || valor === "") return "-";

        const texto = String(valor);
        const correspondencia = texto.match(/^(-?\d+)(?:\.(\d{1,2}))?$/);
        if (!correspondencia) return texto;

        const casasDecimais = correspondencia[2] || "";
        return `${correspondencia[1]}.${casasDecimais.padEnd(2, "0")}`;
    }

    function mostrarAviso(elemento, texto, tipo) {
        const temporizador = elemento === mensagem ? avisoTimer : elemento === mensagemPauta ? pautaTimer : alunosTimer;
        window.clearTimeout(temporizador);
        elemento.textContent = texto;
        elemento.className = `notice ${tipo}`;
        const novoTemporizador = window.setTimeout(() => {
            elemento.textContent = "";
            elemento.className = "notice";
        }, 6000);
        if (elemento === mensagem) avisoTimer = novoTemporizador;
        else if (elemento === mensagemPauta) pautaTimer = novoTemporizador;
        else alunosTimer = novoTemporizador;
    }
}
