function calcularMedias(nota) {
    const camposAvaliacao = [nota.av1, nota.av2, nota.av3];
    const avaliacoesCompletas = camposAvaliacao.every((valor) => valor !== null && valor !== undefined);
    const provaProfessorExiste = nota.prova_professor !== null && nota.prova_professor !== undefined;
    const provaPeriodo = Number(nota.trimestre) === 3 ? nota.prova_final : nota.prova_trimestral;
    const provaPeriodoExiste = provaPeriodo !== null && provaPeriodo !== undefined;

    let mediaAvaliacoes = null;
    let mediaFinal = null;

    if (avaliacoesCompletas) {
        mediaAvaliacoes = camposAvaliacao.reduce((soma, valor) => soma + Number(valor), 0) / 3;

        if (provaProfessorExiste && provaPeriodoExiste) {
            mediaFinal = (mediaAvaliacoes + Number(nota.prova_professor) + Number(provaPeriodo)) / 3;
        }
    }

    return {
        media_avaliacoes: mediaAvaliacoes === null ? null : Math.round(mediaAvaliacoes * 100) / 100,
        media_final: mediaFinal === null ? null : Math.round(mediaFinal * 100) / 100
    };
}

module.exports = { calcularMedias };
