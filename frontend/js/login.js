const form = document.getElementById("form-login");
const erro = document.getElementById("erro");

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    erro.textContent = "";

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const resposta = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            erro.textContent = dados.erro || dados.mensagem || "Erro ao fazer login.";
            return;
        }

        localStorage.setItem("token", dados.token);
        localStorage.setItem("tipo", dados.tipo);

        window.location.href = `/${dados.tipo}.html`;

    } catch (error) {
        erro.textContent = "Não foi possível ligar ao servidor.";
    }
});