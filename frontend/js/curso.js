if (verificarAcesso("admin")) {
    const cursoId = new URLSearchParams(window.location.search).get("id");
    const tituloCurso = document.getElementById("curso-titulo");
    const descricaoCurso = document.getElementById("curso-descricao");
    const mensagem = document.getElementById("mensagem-curso");
    const formularioClasse = document.getElementById("form-classe");
    const campoClasseId = document.getElementById("classe-id");
    const campoClasseNome = document.getElementById("classe-nome");
    const guardarClasse = document.getElementById("guardar-classe");
    const cancelarClasse = document.getElementById("cancelar-classe");
    const tabelaClasses = document.getElementById("tabela-classes");
    const turmasPorClasse = document.getElementById("turmas-por-classe");
    const formularioDisciplina = document.getElementById("form-disciplina");
    const selectDisciplina = document.getElementById("disciplina-id");
    const associarDisciplina = document.getElementById("associar-disciplina");
    const estadoDisciplinas = document.getElementById("estado-disciplinas");
    const tabelaDisciplinas = document.getElementById("tabela-disciplinas");
    let classes = [];
    let turmas = [];
    let disciplinasAssociadas = [];
    let disciplinasDisponiveis = [];

    document.getElementById("botao-sair").addEventListener("click", sair);
    formularioClasse.addEventListener("submit", guardarClasseCurso);
    cancelarClasse.addEventListener("click", limparFormularioClasse);
    formularioDisciplina.addEventListener("submit", associarDisciplinaCurso);

    if (!cursoId || !/^[1-9]\d*$/.test(cursoId)) {
        mostrarMensagem("O identificador do curso é inválido.", "error");
        tituloCurso.textContent = "Curso não encontrado";
    } else {
        carregarPagina();
    }

    async function carregarPagina() {
        try {
            const [respostaCurso, respostaClasses, respostaTurmas, respostaAssociadas, respostaDisciplinas] = await Promise.all([
                api(`/api/cursos/${encodeURIComponent(cursoId)}`),
                api(`/api/classes?curso_id=${encodeURIComponent(cursoId)}`),
                api(`/api/turmas?curso_id=${encodeURIComponent(cursoId)}`),
                api(`/api/cursos/${encodeURIComponent(cursoId)}/disciplinas`),
                api("/api/disciplinas")
            ]);

            const respostas = [
                [respostaCurso, "Não foi possível carregar o curso."],
                [respostaClasses, "Não foi possível carregar as classes."],
                [respostaTurmas, "Não foi possível carregar as turmas."],
                [respostaAssociadas, "Não foi possível carregar as disciplinas do curso."],
                [respostaDisciplinas, "Não foi possível carregar as disciplinas."]
            ];
            const falha = respostas.find(([resposta]) => !resposta?.ok);
            if (falha) {
                mostrarMensagem(falha[0]?.dados?.erro || falha[1], "error");
                return;
            }

            if (!Array.isArray(respostaClasses.dados) || !Array.isArray(respostaTurmas.dados) ||
                !Array.isArray(respostaAssociadas.dados) || !Array.isArray(respostaDisciplinas.dados)) {
                mostrarMensagem("O servidor devolveu dados inválidos.", "error");
                return;
            }

            tituloCurso.textContent = respostaCurso.dados.nome || "Curso";
            descricaoCurso.textContent = respostaCurso.dados.descricao || "";
            classes = respostaClasses.dados;
            turmas = respostaTurmas.dados;
            disciplinasAssociadas = respostaAssociadas.dados;
            disciplinasDisponiveis = respostaDisciplinas.dados;
            renderizarClasses();
            renderizarTurmas();
            renderizarDisciplinas();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    function renderizarClasses() {
        if (classes.length === 0) {
            tabelaClasses.replaceChildren(criarEstado("Ainda não existem classes neste curso.", 2));
            return;
        }
        tabelaClasses.replaceChildren(...classes.map((classe) => {
            const linha = document.createElement("tr");
            const nome = document.createElement("td");
            const acoes = document.createElement("td");
            nome.textContent = classe.nome || "—";
            acoes.className = "actions-cell";
            acoes.append(
                criarBotao("Editar", "row-action", () => iniciarEdicaoClasse(classe)),
                criarBotao("Remover", "row-action delete", () => removerClasse(classe))
            );
            linha.append(nome, acoes);
            return linha;
        }));
    }

    function renderizarTurmas() {
        if (classes.length === 0) {
            turmasPorClasse.replaceChildren(criarAvisoCartao("Cria primeiro uma classe neste curso."));
            return;
        }

        turmasPorClasse.replaceChildren(...classes.map((classe) => {
            const cartao = document.createElement("section");
            const cabecalho = document.createElement("div");
            const titulo = document.createElement("h3");
            const formulario = document.createElement("form");
            const rotulo = document.createElement("label");
            const entrada = document.createElement("input");
            const botao = document.createElement("button");
            const tabela = document.createElement("table");
            const cabecalhoTabela = document.createElement("thead");
            const linhaCabecalho = document.createElement("tr");
            const nomeCabecalho = document.createElement("th");
            const acoesCabecalho = document.createElement("th");
            const corpoTabela = document.createElement("tbody");

            cartao.className = "course-card";
            cabecalho.className = "course-card-heading";
            titulo.textContent = classe.nome;
            cabecalho.append(titulo);
            formulario.className = "course-turma-form";
            rotulo.textContent = "Nova turma";
            rotulo.htmlFor = `turma-nome-${classe.id}`;
            entrada.id = `turma-nome-${classe.id}`;
            entrada.name = "nome";
            entrada.placeholder = "Ex.: TI1";
            entrada.maxLength = 100;
            entrada.required = true;
            botao.className = "button button-primary";
            botao.type = "submit";
            botao.textContent = "Criar turma";
            formulario.append(rotulo, entrada, botao);
            formulario.addEventListener("submit", (evento) => criarTurma(evento, classe, entrada, botao));

            nomeCabecalho.textContent = "Turma";
            acoesCabecalho.textContent = "Ações";
            acoesCabecalho.className = "actions-heading";
            linhaCabecalho.append(nomeCabecalho, acoesCabecalho);
            cabecalhoTabela.append(linhaCabecalho);
            tabela.append(cabecalhoTabela, corpoTabela);
            tabela.className = "course-table";

            const turmasDaClasse = turmas.filter((turma) => String(turma.classe_id) === String(classe.id));
            if (turmasDaClasse.length === 0) {
                corpoTabela.append(criarEstado("Ainda não existem turmas nesta classe.", 2));
            } else {
                corpoTabela.replaceChildren(...turmasDaClasse.map((turma) => criarLinhaTurma(turma)));
            }
            cartao.append(cabecalho, formulario, tabela);
            return cartao;
        }));
    }

    function criarLinhaTurma(turma) {
        const linha = document.createElement("tr");
        const nome = document.createElement("td");
        const acoes = document.createElement("td");
        nome.textContent = turma.nome || "—";
        acoes.className = "actions-cell";
        acoes.append(
            criarBotao("Editar", "row-action", () => iniciarEdicaoTurma(turma)),
            criarBotao("Remover", "row-action delete", () => removerTurma(turma))
        );
        linha.append(nome, acoes);
        return linha;
    }

    function renderizarDisciplinas() {
        const associadasIds = new Set(disciplinasAssociadas.map((disciplina) => String(disciplina.id)));
        const disponiveis = disciplinasDisponiveis.filter((disciplina) => !associadasIds.has(String(disciplina.id)));
        selectDisciplina.replaceChildren();
        if (disponiveis.length === 0) {
            const opcao = document.createElement("option");
            opcao.value = "";
            opcao.textContent = "Não há disciplinas por associar";
            selectDisciplina.append(opcao);
            selectDisciplina.disabled = true;
            associarDisciplina.disabled = true;
            estadoDisciplinas.textContent = disciplinasDisponiveis.length === 0
                ? "Cria primeiro uma disciplina na página Disciplinas."
                : "Todas as disciplinas disponíveis já estão associadas.";
        } else {
            selectDisciplina.disabled = false;
            associarDisciplina.disabled = false;
            for (const disciplina of disponiveis) {
                const opcao = document.createElement("option");
                opcao.value = String(disciplina.id);
                opcao.textContent = disciplina.nome;
                selectDisciplina.append(opcao);
            }
            estadoDisciplinas.textContent = "";
        }

        if (disciplinasAssociadas.length === 0) {
            tabelaDisciplinas.replaceChildren(criarEstado("Ainda não existem disciplinas associadas a este curso.", 2));
            return;
        }
        tabelaDisciplinas.replaceChildren(...disciplinasAssociadas.map((disciplina) => {
            const linha = document.createElement("tr");
            const nome = document.createElement("td");
            const acoes = document.createElement("td");
            nome.textContent = disciplina.nome || "—";
            acoes.className = "actions-cell";
            acoes.append(criarBotao("Desassociar", "row-action delete", () => desassociarDisciplina(disciplina)));
            linha.append(nome, acoes);
            return linha;
        }));
    }

    async function guardarClasseCurso(evento) {
        evento.preventDefault();
        const editingId = campoClasseId.value;
        const corpo = { nome: campoClasseNome.value.trim(), curso_id: Number(cursoId) };
        const botao = guardarClasse;
        botao.disabled = true;
        try {
            const resposta = await api(
                editingId ? `/api/classes/${encodeURIComponent(editingId)}` : "/api/classes",
                editingId ? "PUT" : "POST",
                corpo
            );
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível guardar a classe.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Classe guardada com sucesso.", "success");
            limparFormularioClasse();
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            botao.disabled = false;
        }
    }

    function iniciarEdicaoClasse(classe) {
        campoClasseId.value = String(classe.id);
        campoClasseNome.value = classe.nome || "";
        document.querySelector("#form-classe label[for='classe-nome']").textContent = "Editar classe";
        guardarClasse.textContent = "Guardar alterações";
        cancelarClasse.hidden = false;
        campoClasseNome.focus();
    }

    function limparFormularioClasse() {
        formularioClasse.reset();
        campoClasseId.value = "";
        document.querySelector("#form-classe label[for='classe-nome']").textContent = "Nome da classe";
        guardarClasse.textContent = "Criar classe";
        cancelarClasse.hidden = true;
    }

    async function removerClasse(classe) {
        if (!window.confirm(`Remover a classe "${classe.nome}"?`)) return;
        try {
            const resposta = await api(`/api/classes/${encodeURIComponent(classe.id)}`, "DELETE");
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível remover a classe.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Classe removida com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    async function criarTurma(evento, classe, entrada, botao) {
        evento.preventDefault();
        botao.disabled = true;
        try {
            const resposta = await api("/api/turmas", "POST", {
                nome: entrada.value.trim(),
                classe_id: classe.id
            });
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível criar a turma.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Turma criada com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            botao.disabled = false;
        }
    }

    async function iniciarEdicaoTurma(turma) {
        const nome = window.prompt("Nome da turma:", turma.nome);
        if (nome === null || !nome.trim()) return;
        try {
            const resposta = await api(`/api/turmas/${encodeURIComponent(turma.id)}`, "PUT", {
                nome: nome.trim(),
                classe_id: turma.classe_id
            });
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível atualizar a turma.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Turma atualizada com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    async function removerTurma(turma) {
        if (!window.confirm(`Remover a turma "${turma.nome}"?`)) return;
        try {
            const resposta = await api(`/api/turmas/${encodeURIComponent(turma.id)}`, "DELETE");
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível remover a turma.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Turma removida com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    async function associarDisciplinaCurso(evento) {
        evento.preventDefault();
        associarDisciplina.disabled = true;
        try {
            const resposta = await api(`/api/cursos/${encodeURIComponent(cursoId)}/disciplinas`, "POST", {
                disciplina_id: Number(selectDisciplina.value)
            });
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível associar a disciplina.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Disciplina associada com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        } finally {
            associarDisciplina.disabled = selectDisciplina.disabled;
        }
    }

    async function desassociarDisciplina(disciplina) {
        if (!window.confirm(`Desassociar "${disciplina.nome}" deste curso?`)) return;
        try {
            const resposta = await api(
                `/api/cursos/${encodeURIComponent(cursoId)}/disciplinas/${encodeURIComponent(disciplina.id)}`,
                "DELETE"
            );
            if (!resposta?.ok) {
                mostrarMensagem(resposta?.dados?.erro || "Não foi possível desassociar a disciplina.", "error");
                return;
            }
            mostrarMensagem(resposta.dados?.mensagem || "Disciplina desassociada com sucesso.", "success");
            await carregarPagina();
        } catch (error) {
            mostrarMensagem("Não foi possível ligar ao servidor. Tenta novamente.", "error");
        }
    }

    function criarBotao(texto, classe, acao) {
        const botao = document.createElement("button");
        botao.className = classe;
        botao.type = "button";
        botao.textContent = texto;
        botao.addEventListener("click", acao);
        return botao;
    }

    function criarEstado(texto, colspan) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.className = "table-state";
        celula.colSpan = colspan;
        celula.textContent = texto;
        linha.append(celula);
        return linha;
    }

    function criarAvisoCartao(texto) {
        const aviso = document.createElement("p");
        aviso.className = "course-hint";
        aviso.textContent = texto;
        return aviso;
    }

    function mostrarMensagem(texto, tipo) {
        mensagem.textContent = texto;
        mensagem.className = tipo ? `notice ${tipo}` : "notice";
    }
}
