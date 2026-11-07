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

            tabelaNotas.replaceChildren(...resposta.dados.map(criarLinhaNota));
            tabelaNotasWrap.hidden = false;
        } catch (error) {
            mostrarErro("Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.");
        }
    }

    function criarLinhaNota(nota) {
        const linha = document.createElement("tr");
        const campos = [
            nota.disciplina,
            nota.turma,
            nota.av1,
            nota.av2,
            nota.av3,
            nota.prova_professor,
            nota.prova_trimestral,
            nota.media_avaliacoes
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

        const casasDecimais = correspondencia[2];
        return casasDecimais ? texto : `${texto}.0`;
    }

    function mostrarErro(texto) {
        mensagem.textContent = texto;
        mensagem.className = "notice error";
    }
}
