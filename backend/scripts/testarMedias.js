const assert = require("node:assert/strict");
const { calcularMedias } = require("../services/mediaService");

const casoCompleto = calcularMedias({
    av1: "10.00",
    av2: "14.00",
    av3: "12.00",
    prova_professor: "13.00",
    prova_trimestral: "15.00"
});

assert.deepEqual(casoCompleto, {
    media_avaliacoes: 12,
    media_final: 13.33
});

const notaCompleta = {
    av1: "10.00",
    av2: "14.00",
    av3: "12.00",
    prova_professor: "13.00",
    prova_trimestral: "15.00"
};

for (const campo of ["av1", "av2", "av3"]) {
    const medias = calcularMedias({ ...notaCompleta, [campo]: null });
    assert.equal(medias.media_avaliacoes, null, `${campo} em falta deve invalidar a média das avaliações`);
    assert.equal(medias.media_final, null, `${campo} em falta deve invalidar a média final`);
}

for (const campo of ["prova_professor", "prova_trimestral"]) {
    const medias = calcularMedias({ ...notaCompleta, [campo]: null });
    assert.equal(medias.media_avaliacoes, 12, "média das avaliações deve continuar disponível");
    assert.equal(medias.media_final, null, `${campo} em falta deve invalidar a média final`);
}

assert.deepEqual(calcularMedias({
    av1: 0,
    av2: 0,
    av3: 0,
    prova_professor: 0,
    prova_trimestral: 0
}), {
    media_avaliacoes: 0,
    media_final: 0
});

console.log("Todos os testes de médias passaram.");
