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
    const painelAtribuicoes = document.getElementById("painel-atribuicoes");
    const tituloAtribuicoes = document.getElementById("titulo-atribuicoes");
    const mensagemAtribuicoes = document.getElementById("mensagem-atribuicoes");
    const estadoAtribuicoes = document.getElementById("estado-atribuicoes");
    const tabelaAtribuicoes = document.getElementById("tabela-atribuicoes");
    const formularioAtribuicao = document.getElementById("form-atribuicao");
    const selectTurma = document.getElementById("atribuicao-turma");
    const selectDisciplina = document.getElementById("atribuicao-disciplina");
    const botaoAtribuir = document.getElementById("guardar-atribuicao");
    let professores = [];
    let avisoTimer;
    let professorSelecionado = null;
    let atribuicoes = [];
    let turmasDisponiveis = [];
    let disciplinasGlobais = [];

    document.getElementById("botao-sair").addEventListener("click", sair);
    document.getElementById("novo-professor").addEventListener("click", () => abrirFormulario());
    document.getElementById("fechar-dialogo").addEventListener("click", fecharFormulario);
    document.getElementById("cancelar-dialogo").addEventListener("click", fecharFormulario);
    document.getElementById("fechar-atribuicoes").addEventListener("click", fecharAtribuicoes);
    pesquisa.addEventListener("input", renderizarProfessores);
    dialogo.addEventListener("click", (evento) => {
        if (evento.target === dialogo) fecharFormulario();
    });
    form.addEventListener("submit", guardarProfessor);
    formularioAtribuicao.addEventListener("submit", guardarAtribuicao);
    selectTurma.addEventListener("change", carregarDisciplinasDaTurma);
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
        const atribuicoes = document.createElement("button");
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

        atribuicoes.className = "row-action assignment-action";
        atribuicoes.type = "button";
        atribuicoes.textContent = "Atribuições";
        atribuicoes.setAttribute("aria-label", `Gerir atribuições de ${professor.nome}`);
        atribuicoes.addEventListener("click", () => abrirAtribuicoes(professor));

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

        acoes.append(atribuicoes, editar, remover);
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
            if (!id && resposta.dados?.id != null) {
                const professorCriado = professores.find((professor) =>
                    String(professor.id) === String(resposta.dados.id)
                ) || { id: resposta.dados.id, nome: corpo.nome };
                await abrirAtribuicoes(professorCriado);
            }
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
            if (professorSelecionado && String(professorSelecionado.id) === String(professor.id)) {
                fecharAtribuicoes();
            }
            await carregarProfessores();
        } catch (error) {
            mostrarAviso("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

        async function abrirAtribuicoes(professor) {
            professorSelecionado = professor;
            painelAtribuicoes.hidden = false;
            tituloAtribuicoes.textContent = `Atribuições de ${professor.nome}`;
            mensagemAtribuicoes.textContent = "";
            limparEstadoAtribuicoes();
            formularioAtribuicao.hidden = true;
            tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("A carregar atribuições..."));
            painelAtribuicoes.scrollIntoView({ behavior: "smooth", block: "start" });

            try {
                const [respostaTurmas, respostaDisciplinas, respostaLecoes] = await Promise.all([
                    api("/api/turmas"),
                    api("/api/disciplinas"),
                    api("/api/lecoes")
                ]);

                if (!respostaTurmas?.ok || !Array.isArray(respostaTurmas.dados)) {
                    mostrarErroAtribuicoes(erroDaResposta(respostaTurmas, "Não foi possível carregar as turmas."));
                    tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Não foi possível carregar as atribuições."));
                    return;
                }
                if (!respostaDisciplinas?.ok || !Array.isArray(respostaDisciplinas.dados)) {
                    mostrarErroAtribuicoes(erroDaResposta(respostaDisciplinas, "Não foi possível carregar as disciplinas."));
                    tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Não foi possível carregar as atribuições."));
                    return;
                }
                if (!respostaLecoes?.ok || !Array.isArray(respostaLecoes.dados)) {
                    mostrarErroAtribuicoes(erroDaResposta(respostaLecoes, "Não foi possível carregar as atribuições."));
                    tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Não foi possível carregar as atribuições."));
                    return;
                }

                turmasDisponiveis = respostaTurmas.dados;
                disciplinasGlobais = respostaDisciplinas.dados;
                preencherOpcoes(selectTurma, turmasDisponiveis, (turma) =>
                    `${turma.nome || ""} - ${turma.curso || ""} - ${turma.classe || ""}`
                );
                atribuicoes = respostaLecoes.dados.filter((lecao) =>
                    String(lecao.professor_id) === String(professor.id)
                );
                renderizarAtribuicoes();

                if (turmasDisponiveis.length === 0 || disciplinasGlobais.length === 0) {
                    mostrarFaltaDeOpcoes();
                    return;
                }
                limparEstadoAtribuicoes();
                formularioAtribuicao.hidden = false;
                await carregarDisciplinasDaTurma();
            } catch (error) {
                mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
                tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Não foi possível carregar as atribuições."));
            }
        }

        function preencherOpcoes(select, itens, obterRotulo) {
            select.replaceChildren();
            for (const item of itens) {
                const opcao = document.createElement("option");
                opcao.value = String(item.id);
                opcao.textContent = obterRotulo(item);
                select.append(opcao);
            }
        }

        function renderizarAtribuicoes() {
            if (atribuicoes.length === 0) {
                tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Ainda não existem atribuições para este professor."));
                return;
            }

            tabelaAtribuicoes.replaceChildren(...atribuicoes.map(criarLinhaAtribuicao));
        }

        function criarLinhaAtribuicao(atribuicao) {
            const linha = document.createElement("tr");
            const turma = document.createElement("td");
            const disciplina = document.createElement("td");
            const acoes = document.createElement("td");
            const remover = document.createElement("button");

            turma.textContent = atribuicao.turma || "—";
            disciplina.textContent = atribuicao.disciplina || "—";
            acoes.className = "actions-cell";
            remover.className = "row-action delete";
            remover.type = "button";
            remover.textContent = "Remover";
            remover.addEventListener("click", () => removerAtribuicao(atribuicao));
            acoes.append(remover);
            linha.append(turma, disciplina, acoes);
            return linha;
        }

        function criarEstadoAtribuicoes(texto) {
            const linha = document.createElement("tr");
            const celula = document.createElement("td");
            celula.className = "table-state";
            celula.colSpan = 3;
            celula.textContent = texto;
            linha.append(celula);
            return linha;
        }

        function mostrarFaltaDeOpcoes(turma = null) {
            estadoAtribuicoes.replaceChildren(document.createTextNode("Cria primeiro "));
            const link = document.createElement("a");
            if (turmasDisponiveis.length === 0) {
                link.href = "/cursos.html";
                link.textContent = "classes e turmas num curso";
            } else if (disciplinasGlobais.length === 0) {
                link.href = "/disciplinas.html";
                link.textContent = "disciplinas";
            } else {
                link.href = `/curso.html?id=${encodeURIComponent(turma?.curso_id || turmasDisponiveis[0].curso_id)}`;
                link.textContent = "associar disciplinas ao curso desta turma";
            }
            estadoAtribuicoes.append(link, document.createTextNode("."));
            estadoAtribuicoes.hidden = false;
            formularioAtribuicao.hidden = turmasDisponiveis.length === 0 || disciplinasGlobais.length === 0;
        }

        async function carregarDisciplinasDaTurma() {
            const turma = turmasDisponiveis.find((item) => String(item.id) === selectTurma.value);
            if (!turma) {
                preencherOpcoes(selectDisciplina, [], () => "");
                return;
            }

            try {
                const resposta = await api(`/api/cursos/${encodeURIComponent(turma.curso_id)}/disciplinas`);
                if (!resposta?.ok || !Array.isArray(resposta.dados)) {
                    mostrarErroAtribuicoes(erroDaResposta(resposta, "Não foi possível carregar as disciplinas deste curso."));
                    return;
                }
                preencherOpcoes(selectDisciplina, resposta.dados, (disciplina) => disciplina.nome || "");
                if (resposta.dados.length === 0) {
                    mostrarFaltaDeOpcoes(turma);
                } else {
                    limparEstadoAtribuicoes();
                    formularioAtribuicao.hidden = false;
                }
            } catch (error) {
                mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
            }
        }

        async function guardarAtribuicao(evento) {
            evento.preventDefault();
            if (!professorSelecionado) return;

            botaoAtribuir.disabled = true;
            botaoAtribuir.textContent = "A atribuir...";
            limparEstadoAtribuicoes();

            try {
                const resposta = await api("/api/lecoes", "POST", {
                    professor_id: professorSelecionado.id,
                    turma_id: selectTurma.value,
                    disciplina_id: selectDisciplina.value
                });
                if (!resposta?.ok) {
                    mostrarErroAtribuicoes(erroDaResposta(resposta, "Não foi possível criar a atribuição."));
                    return;
                }
                mensagemAtribuicoes.textContent = resposta.dados?.mensagem || "Atribuição criada com sucesso.";
                mensagemAtribuicoes.className = "notice success";
                await carregarAtribuicoesDoProfessor();
            } catch (error) {
                mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
            } finally {
                botaoAtribuir.disabled = false;
                botaoAtribuir.textContent = "Atribuir";
            }
        }

        async function carregarAtribuicoesDoProfessor() {
            const resposta = await api("/api/lecoes");
            if (!resposta?.ok || !Array.isArray(resposta.dados)) {
                mostrarErroAtribuicoes(erroDaResposta(resposta, "Não foi possível carregar as atribuições."));
                return;
            }
            atribuicoes = resposta.dados.filter((lecao) =>
                String(lecao.professor_id) === String(professorSelecionado.id)
            );
            renderizarAtribuicoes();
        }

        async function removerAtribuicao(atribuicao) {
            if (!window.confirm("Remover esta atribuição?")) return;

            try {
                const resposta = await api(`/api/lecoes/${encodeURIComponent(atribuicao.id)}`, "DELETE");
                if (!resposta?.ok) {
                    mostrarErroAtribuicoes(erroDaResposta(resposta, "Não foi possível remover a atribuição."));
                    return;
                }
                mensagemAtribuicoes.textContent = resposta.dados?.mensagem || "Atribuição removida com sucesso.";
                mensagemAtribuicoes.className = "notice success";
                await carregarAtribuicoesDoProfessor();
            } catch (error) {
                mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
            }
        }

        function mostrarErroAtribuicoes(texto) {
            estadoAtribuicoes.textContent = texto;
            estadoAtribuicoes.className = "notice error";
            estadoAtribuicoes.hidden = false;
        }

        function limparEstadoAtribuicoes() {
            estadoAtribuicoes.textContent = "";
            estadoAtribuicoes.hidden = true;
        }

        function fecharAtribuicoes() {
            painelAtribuicoes.hidden = true;
            professorSelecionado = null;
            atribuicoes = [];
            turmasDisponiveis = [];
            disciplinasGlobais = [];
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
