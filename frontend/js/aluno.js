if (verificarAcesso("aluno")) {
    const tabelaNotas = document.getElementById("tabela-notas");
    const tabelaNotasWrap = document.getElementById("tabela-notas-wrap");
    const estadoVazio = document.getElementById("estado-vazio");
    const mensagem = document.getElementById("mensagem");

    document.getElementById("botao-sair").addEventListener("click", sair);
    carregarNotas();

    async function carregarNotas() {
        mensagem.textContent = "";
        mensagem.className = "notice";
        estadoVazio.hidden = true;
        tabelaNotasWrap.hidden = true;

        try {
            const resposta = await api("/api/notas/minhas");

            if (!resposta || !resposta.ok) {
                mostrarErro(resposta?.dados?.erro || "Não foi possível carregar as tuas notas.");
                return;
            }

            if (!Array.isArray(resposta.dados)) {
                mostrarErro("O servidor devolveu uma lista de notas inválida.");
                return;
            }

            if (resposta.dados.length === 0) {
                estadoVazio.textContent = "Ainda não tens notas lançadas.";
                estadoVazio.hidden = false;
                return;
            }

            const disciplinas = new Map();
            resposta.dados.forEach((nota) => {
                let disciplina = disciplinas.get(nota.disciplina);
                if (!disciplina) {
                    disciplina = { nome: nota.disciplina, notas: [] };
                    disciplinas.set(nota.disciplina, disciplina);
                }
                disciplina.notas.push(nota);
            });

            tabelaNotas.replaceChildren(...[...disciplinas.values()].map(criarLinhaDisciplina));
            tabelaNotasWrap.hidden = false;
        } catch (error) {
            mostrarErro("Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.");
        }
    }

    function criarLinhaDisciplina(disciplina) {
        const fragmento = document.createDocumentFragment();
        const linhaResumo = document.createElement("tr");
        linhaResumo.className = "grade-summary-row";
        const celulaResumo = document.createElement("td");
        const detalheId = `notas-disciplina-${encodeURIComponent(disciplina.nome)}`;
        const botaoDisciplina = document.createElement("button");
        botaoDisciplina.type = "button";
        botaoDisciplina.className = "grade-subject-toggle";
        botaoDisciplina.textContent = disciplina.nome;
        botaoDisciplina.setAttribute("aria-controls", detalheId);
        botaoDisciplina.setAttribute("aria-expanded", "false");
        celulaResumo.append(botaoDisciplina);
        linhaResumo.append(celulaResumo);

        const linhaDetalhe = document.createElement("tr");
        linhaDetalhe.id = detalheId;
        linhaDetalhe.className = "grade-detail-row";
        linhaDetalhe.hidden = true;
        const celulaDetalhe = document.createElement("td");
        celulaDetalhe.className = "grade-detail-cell";
        const detalhe = document.createElement("div");
        detalhe.className = "grade-detail-wrap";
        const tabelaTrimestres = document.createElement("table");
        tabelaTrimestres.className = "grade-period-table";

        const cabecalho = document.createElement("thead");
        const linhaCabecalho = document.createElement("tr");
        [
            "Turma",
            "Trimestre",
            "Avaliação 1",
            "Avaliação 2",
            "Avaliação 3",
            "Prova do professor",
            "Prova trimestral / final",
            "Média das avaliações",
            "Média final"
        ].forEach((rotulo) => {
            const coluna = document.createElement("th");
            coluna.scope = "col";
            coluna.textContent = rotulo;
            linhaCabecalho.append(coluna);
        });
        cabecalho.append(linhaCabecalho);

        const corpo = document.createElement("tbody");
        corpo.append(...disciplina.notas.map(criarLinhaNota));
        tabelaTrimestres.append(cabecalho, corpo);
        detalhe.append(tabelaTrimestres);
        celulaDetalhe.append(detalhe);
        linhaDetalhe.append(celulaDetalhe);

        botaoDisciplina.addEventListener("click", () => {
            const abrir = botaoDisciplina.getAttribute("aria-expanded") !== "true";
            botaoDisciplina.setAttribute("aria-expanded", String(abrir));
            linhaDetalhe.hidden = !abrir;
        });

        fragmento.append(linhaResumo, linhaDetalhe);
        return fragmento;
    }

    function criarLinhaNota(nota) {
        const linha = document.createElement("tr");
        const trimestre = Number(nota.trimestre);
        const campos = [
            nota.turma,
            `${trimestre}.º trimestre`,
            nota.av1,
            nota.av2,
            nota.av3,
            nota.prova_professor,
            trimestre === 3 ? nota.prova_final : nota.prova_trimestral,
            nota.media_avaliacoes,
            nota.media_final
        ];

        campos.forEach((valor, indice) => {
            const celula = document.createElement("td");
            celula.textContent = indice < 2 ? (valor ?? "-") : formatarNota(valor);
            linha.append(celula);
        });

        return linha;
    }

    function formatarNota(valor) {
        if (valor === null || valor === undefined || valor === "") return "-";

        const texto = String(valor);
        const correspondencia = texto.match(/^(-?\d+)(?:\.(\d{1,2}))?$/);
        if (!correspondencia) return texto;

        const casasDecimais = correspondencia[2] || "";
        return `${correspondencia[1]}.${casasDecimais.padEnd(2, "0")}`;
    }

    function mostrarErro(texto) {
        mensagem.textContent = texto;
        mensagem.className = "notice error";
    }
}
