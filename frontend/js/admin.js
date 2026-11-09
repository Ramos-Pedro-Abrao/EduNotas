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
    const atribuicoesIniciais = document.getElementById("atribuicoes-iniciais");
    const cursoInicial = document.getElementById("curso-inicial");
    const turmasIniciais = document.getElementById("turmas-iniciais");
    const disciplinasIniciais = document.getElementById("disciplinas-iniciais");
    const estadoInicial = document.getElementById("estado-inicial");
    const blocosPendentes = document.getElementById("blocos-pendentes");
    const painelAtribuicoes = document.getElementById("painel-atribuicoes");
    const tituloAtribuicoes = document.getElementById("titulo-atribuicoes");
    const mensagemAtribuicoes = document.getElementById("mensagem-atribuicoes");
    const estadoAtribuicoes = document.getElementById("estado-atribuicoes");
    const tabelaAtribuicoes = document.getElementById("tabela-atribuicoes");
    const formularioAtribuicao = document.getElementById("form-atribuicao");
    const cursoAtribuicao = document.getElementById("curso-atribuicao");
    const turmasAtribuicao = document.getElementById("turmas-atribuicao");
    const disciplinasAtribuicao = document.getElementById("disciplinas-atribuicao");
    const botaoAtribuir = document.getElementById("guardar-atribuicao");
    let professores = [];
    let avisoTimer;
    let professorSelecionado = null;
    let atribuicoes = [];
    let cursos = [];
    let turmasDoCurso = [];
    let disciplinasDoCurso = [];
    let todasTurmas = [];
    let blocos = [];

    document.getElementById("botao-sair").addEventListener("click", sair);
    document.getElementById("novo-professor").addEventListener("click", () => abrirFormulario());
    document.getElementById("fechar-dialogo").addEventListener("click", fecharFormulario);
    document.getElementById("cancelar-dialogo").addEventListener("click", fecharFormulario);
    document.getElementById("fechar-atribuicoes").addEventListener("click", fecharAtribuicoes);
    document.getElementById("adicionar-bloco").addEventListener("click", adicionarBlocoInicial);
    pesquisa.addEventListener("input", renderizarProfessores);
    dialogo.addEventListener("click", (evento) => {
        if (evento.target === dialogo) fecharFormulario();
    });
    form.addEventListener("submit", guardarProfessor);
    cursoInicial.addEventListener("change", () =>
        carregarOpcoesDoCurso(cursoInicial, turmasIniciais, disciplinasIniciais, estadoInicial)
    );
    formularioAtribuicao.addEventListener("submit", guardarAtribuicoesExistentes);
    cursoAtribuicao.addEventListener("change", () =>
        carregarOpcoesDoCurso(cursoAtribuicao, turmasAtribuicao, disciplinasAtribuicao, estadoAtribuicoes)
    );
    carregarProfessores();

    async function carregarProfessores() {
        tabela.replaceChildren(criarEstado("A carregar professores..."));
        try {
            const resposta = await api("/api/professores");
            if (!resposta?.ok || !Array.isArray(resposta.dados)) {
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
            tabela.replaceChildren(criarEstado(termo
                ? "Não foram encontrados professores para esta pesquisa."
                : "Ainda não existem professores registados."));
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
        const gerir = criarBotao("Atribuições", "row-action assignment-action", () => abrirAtribuicoes(professor));
        const editar = criarBotao("✎", "row-action", () => abrirFormulario(professor));
        const remover = criarBotao("⌫", "row-action delete", () => removerProfessor(professor));

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
        gerir.setAttribute("aria-label", `Gerir atribuições de ${professor.nome}`);
        editar.setAttribute("aria-label", `Editar ${professor.nome}`);
        remover.setAttribute("aria-label", `Remover ${professor.nome}`);
        acoes.append(gerir, editar, remover);
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
        atribuicoesIniciais.hidden = Boolean(professor);
        document.getElementById("nome").value = professor?.nome || "";
        document.getElementById("telefone").value = professor?.telefone || "";
        document.getElementById("email").required = !professor;
        document.getElementById("senha").required = !professor;
        blocos = [];
        renderizarBlocos();
        cursoInicial.replaceChildren();
        limparCaixas(turmasIniciais, disciplinasIniciais);
        estadoInicial.textContent = "";
        dialogo.showModal();
        document.getElementById("nome").focus();
        if (!professor) carregarCursosIniciais();
    }

    function fecharFormulario() {
        dialogo.close();
        form.reset();
        blocos = [];
        renderizarBlocos();
        erroFormulario.textContent = "";
    }

    async function carregarCursosIniciais() {
        estadoInicial.textContent = "A carregar cursos...";
        try {
            const resposta = await api("/api/cursos");
            if (!resposta?.ok || !Array.isArray(resposta.dados)) {
                estadoInicial.textContent = erroDaResposta(resposta, "Não foi possível carregar os cursos.");
                return;
            }
            cursos = resposta.dados;
            preencherSelectCursos(cursoInicial);
            if (cursos.length === 0) {
                estadoInicial.replaceChildren(document.createTextNode("Cria primeiro um "));
                const link = document.createElement("a");
                link.href = "/cursos.html";
                link.textContent = "curso";
                estadoInicial.append(link, document.createTextNode("."));
            } else {
                estadoInicial.textContent = "";
                await carregarOpcoesDoCurso(cursoInicial, turmasIniciais, disciplinasIniciais, estadoInicial);
            }
        } catch (error) {
            estadoInicial.textContent = "Não foi possível ligar ao servidor para carregar cursos.";
        }
    }

    function preencherSelectCursos(select) {
        select.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Seleciona um curso";
        select.append(placeholder);
        for (const curso of cursos) {
            const option = document.createElement("option");
            option.value = String(curso.id);
            option.textContent = curso.nome;
            select.append(option);
        }
    }

    async function carregarOpcoesDoCurso(select, caixaTurmas, caixaDisciplinas, estado) {
        const cursoId = select.value;
        limparCaixas(caixaTurmas, caixaDisciplinas);
        if (!cursoId) return;
        estado.hidden = false;
        estado.textContent = "A carregar turmas e disciplinas...";
        try {
            const [respostaTurmas, respostaDisciplinas] = await Promise.all([
                api(`/api/turmas?curso_id=${encodeURIComponent(cursoId)}`),
                api(`/api/cursos/${encodeURIComponent(cursoId)}/disciplinas`)
            ]);
            if (!respostaTurmas?.ok || !Array.isArray(respostaTurmas.dados)) {
                estado.textContent = erroDaResposta(respostaTurmas, "Não foi possível carregar as turmas.");
                return;
            }
            if (!respostaDisciplinas?.ok || !Array.isArray(respostaDisciplinas.dados)) {
                estado.textContent = erroDaResposta(respostaDisciplinas, "Não foi possível carregar as disciplinas.");
                return;
            }
            renderizarCaixas(caixaTurmas, respostaTurmas.dados, (turma) =>
                `${turma.nome || ""} - ${turma.classe || ""}`
            );
            renderizarCaixas(caixaDisciplinas, respostaDisciplinas.dados, (disciplina) => disciplina.nome || "");

            if (respostaTurmas.dados.length === 0 || respostaDisciplinas.dados.length === 0) {
                estado.replaceChildren(document.createTextNode("Este curso ainda não tem turmas/disciplinas. "));
                const link = document.createElement("a");
                link.href = `/curso.html?id=${encodeURIComponent(cursoId)}`;
                link.textContent = "Gerir este curso";
                estado.append(link, document.createTextNode("."));
            } else {
                estado.textContent = "";
                estado.hidden = true;
            }
        } catch (error) {
            estado.textContent = "Não foi possível ligar ao servidor para carregar turmas e disciplinas.";
        }
    }

    function renderizarCaixas(conteudo, itens, obterRotulo) {
        conteudo.replaceChildren();
        for (const item of itens) {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.value = String(item.id);
            const texto = document.createTextNode(obterRotulo(item));
            label.className = "checkbox-option";
            label.append(input, texto);
            conteudo.append(label);
        }
    }

    function limparCaixas(...caixas) {
        for (const caixa of caixas) caixa.replaceChildren();
    }

    function valoresMarcados(conteudo) {
        return [...conteudo.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
    }

    function adicionarBlocoInicial() {
        const curso = cursos.find((item) => String(item.id) === cursoInicial.value);
        const turmaIds = valoresMarcados(turmasIniciais);
        const disciplinaIds = valoresMarcados(disciplinasIniciais);
        if (!curso || turmaIds.length === 0 || disciplinaIds.length === 0) {
            estadoInicial.textContent = "Seleciona um curso, pelo menos uma turma e uma disciplina.";
            return;
        }
        const turmasSelecionadas = [...turmasIniciais.querySelectorAll('input[type="checkbox"]:checked')]
            .map((input) => {
                const turma = input.closest("label");
                return { id: input.value, nome: turma.textContent.trim() };
            });
        const disciplinasSelecionadas = [...disciplinasIniciais.querySelectorAll('input[type="checkbox"]:checked')]
            .map((input) => ({ id: input.value, nome: input.parentElement.textContent.trim() }));
        blocos.push({ curso, turmas: turmasSelecionadas, disciplinas: disciplinasSelecionadas });
        estadoInicial.textContent = "";
        renderizarBlocos();
    }

    function renderizarBlocos() {
        blocosPendentes.replaceChildren();
        blocos.forEach((bloco, indice) => {
            const article = document.createElement("article");
            const detalhes = document.createElement("div");
            const cursoNome = document.createElement("strong");
            const resumo = document.createElement("span");
            const remover = criarBotao("Remover", "row-action delete", () => {
                blocos.splice(indice, 1);
                renderizarBlocos();
            });
            cursoNome.textContent = bloco.curso.nome;
            resumo.textContent = `${bloco.turmas.map((turma) => turma.nome).join(", ")} × ${bloco.disciplinas.map((disciplina) => disciplina.nome).join(", ")} · ${bloco.turmas.length * bloco.disciplinas.length} lição(ões)`;
            detalhes.append(cursoNome, resumo);
            article.className = "pending-assignment";
            article.append(detalhes, remover);
            blocosPendentes.append(article);
        });
    }

    function obterParesPendentes() {
        const pares = new Map();
        for (const bloco of blocos) {
            for (const turma of bloco.turmas) {
                for (const disciplina of bloco.disciplinas) {
                    pares.set(`${turma.id}:${disciplina.id}`, {
                        turma_id: Number(turma.id),
                        disciplina_id: Number(disciplina.id)
                    });
                }
            }
        }
        return [...pares.values()];
    }

    async function guardarProfessor(evento) {
        evento.preventDefault();
        erroFormulario.textContent = "";
        const id = campoId.value;
        const dados = {
            nome: document.getElementById("nome").value.trim(),
            telefone: document.getElementById("telefone").value.trim()
        };
        if (id) {
            dados.telefone = dados.telefone || null;
        } else {
            dados.email = document.getElementById("email").value.trim();
            dados.senha = document.getElementById("senha").value;
            dados.atribuicoes = obterParesPendentes();
        }

        const botao = document.getElementById("guardar-professor");
        botao.disabled = true;
        botao.textContent = "A guardar...";
        try {
            const resposta = await api(
                id ? `/api/professores/${encodeURIComponent(id)}` : "/api/professores",
                id ? "PUT" : "POST",
                dados
            );
            if (!resposta?.ok) {
                erroFormulario.textContent = erroDaResposta(resposta, "Não foi possível guardar os dados do professor.");
                return;
            }
            fecharFormulario();
            mostrarAviso(resposta.dados?.mensagem || "Professor guardado com sucesso.", "success");
            await carregarProfessores();
        } catch (error) {
            erroFormulario.textContent = "Não foi possível ligar ao servidor. Tenta novamente.";
        } finally {
            botao.disabled = false;
            botao.textContent = id ? "Guardar alterações" : "Guardar professor";
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
            const [respostaCursos, respostaTurmas, respostaLecoes] = await Promise.all([
                api("/api/cursos"),
                api("/api/turmas"),
                api("/api/lecoes")
            ]);
            for (const [resposta, alternativa] of [
                [respostaCursos, "Não foi possível carregar os cursos."],
                [respostaTurmas, "Não foi possível carregar as turmas."],
                [respostaLecoes, "Não foi possível carregar as atribuições."]
            ]) {
                if (!resposta?.ok || !Array.isArray(resposta.dados)) {
                    mostrarErroAtribuicoes(erroDaResposta(resposta, alternativa));
                    tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Não foi possível carregar as atribuições."));
                    return;
                }
            }

            cursos = respostaCursos.dados;
            todasTurmas = respostaTurmas.dados;
            atribuicoes = respostaLecoes.dados.filter((lecao) =>
                String(lecao.professor_id) === String(professor.id)
            );
            preencherSelectCursos(cursoAtribuicao);
            renderizarAtribuicoes();
            formularioAtribuicao.hidden = cursos.length === 0;
            if (cursos.length === 0) {
                mostrarErroAtribuicoesComLink("Cria primeiro um ", "curso", "/cursos.html");
            } else {
                await carregarOpcoesDoCurso(cursoAtribuicao, turmasAtribuicao, disciplinasAtribuicao, estadoAtribuicoes);
            }
        } catch (error) {
            mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
        }
    }

    function renderizarAtribuicoes() {
        if (atribuicoes.length === 0) {
            tabelaAtribuicoes.replaceChildren(criarEstadoAtribuicoes("Ainda não existem atribuições para este professor."));
            return;
        }
        tabelaAtribuicoes.replaceChildren(...atribuicoes.map((atribuicao) => {
            const linha = document.createElement("tr");
            const percurso = document.createElement("td");
            const disciplina = document.createElement("td");
            const acoes = document.createElement("td");
            const turma = todasTurmas.find((item) => String(item.id) === String(atribuicao.turma_id));
            percurso.textContent = turma
                ? `${turma.curso} / ${turma.classe} / ${turma.nome}`
                : atribuicao.turma || "—";
            disciplina.textContent = atribuicao.disciplina || "—";
            acoes.className = "actions-cell";
            acoes.append(criarBotao("Remover", "row-action delete", () => removerAtribuicao(atribuicao)));
            linha.append(percurso, disciplina, acoes);
            return linha;
        }));
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

    async function guardarAtribuicoesExistentes(evento) {
        evento.preventDefault();
        if (!professorSelecionado) return;
        const turmaIds = valoresMarcados(turmasAtribuicao);
        const disciplinaIds = valoresMarcados(disciplinasAtribuicao);
        if (turmaIds.length === 0 || disciplinaIds.length === 0) {
            mostrarErroAtribuicoes("Seleciona pelo menos uma turma e uma disciplina.");
            return;
        }

        botaoAtribuir.disabled = true;
        const paresExistentes = new Set(atribuicoes.map((item) => `${item.turma_id}:${item.disciplina_id}`));
        const pares = [];
        for (const turmaId of turmaIds) {
            for (const disciplinaId of disciplinaIds) {
                const chave = `${turmaId}:${disciplinaId}`;
                if (!paresExistentes.has(chave)) {
                    paresExistentes.add(chave);
                    pares.push({ turma_id: Number(turmaId), disciplina_id: Number(disciplinaId) });
                }
            }
        }
        if (pares.length === 0) {
            mensagemAtribuicoes.textContent = "As atribuições selecionadas já existem.";
            mensagemAtribuicoes.className = "notice success";
            botaoAtribuir.disabled = false;
            return;
        }

        let criadas = 0;
        const erros = [];
        try {
            for (const par of pares) {
                const resposta = await api("/api/lecoes", "POST", {
                    professor_id: professorSelecionado.id,
                    ...par
                });
                if (resposta?.ok) {
                    criadas += 1;
                } else if (resposta?.ok === false && resposta.dados?.erro === "Esta atribuição já existe.") {
                    continue;
                } else {
                    erros.push(erroDaResposta(resposta, "Não foi possível criar uma atribuição."));
                }
            }
            if (criadas > 0) {
                mensagemAtribuicoes.textContent = `${criadas} atribuição(ões) criada(s) com sucesso.`;
                mensagemAtribuicoes.className = "notice success";
                await carregarListaAtribuicoes();
            }
            if (erros.length > 0) mostrarErroAtribuicoes(erros.join(" "));
            else limparEstadoAtribuicoes();
        } catch (error) {
            mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
        } finally {
            botaoAtribuir.disabled = false;
        }
    }

    async function carregarListaAtribuicoes() {
        const resposta = await api("/api/lecoes");
        if (!resposta?.ok || !Array.isArray(resposta.dados)) {
            mostrarErroAtribuicoes(erroDaResposta(resposta, "Não foi possível atualizar as atribuições."));
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
            await carregarListaAtribuicoes();
        } catch (error) {
            mostrarErroAtribuicoes("Não foi possível ligar ao servidor. Tenta novamente.");
        }
    }

    function mostrarErroAtribuicoes(texto) {
        estadoAtribuicoes.textContent = texto;
        estadoAtribuicoes.className = "notice error";
        estadoAtribuicoes.hidden = false;
    }

    function mostrarErroAtribuicoesComLink(inicio, texto, href) {
        estadoAtribuicoes.replaceChildren(document.createTextNode(inicio));
        const link = document.createElement("a");
        link.href = href;
        link.textContent = texto;
        estadoAtribuicoes.append(link, document.createTextNode("."));
        estadoAtribuicoes.hidden = false;
    }

    function limparEstadoAtribuicoes() {
        estadoAtribuicoes.replaceChildren();
        estadoAtribuicoes.hidden = true;
    }

    function fecharAtribuicoes() {
        painelAtribuicoes.hidden = true;
        professorSelecionado = null;
        atribuicoes = [];
        todasTurmas = [];
    }

    function criarBotao(texto, classe, acao) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = classe;
        botao.textContent = texto;
        botao.addEventListener("click", acao);
        return botao;
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
