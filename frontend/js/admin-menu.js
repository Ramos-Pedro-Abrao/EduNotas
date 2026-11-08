const menuAdmin = document.getElementById("menu-admin");

if (menuAdmin) {
    const secoesAdmin = [
        ["professores", "Professores", "/admin.html", "♙"],
        ["cursos", "Cursos", "/cursos.html", "▤"],
        ["classes", "Classes", "/classes.html", "▦"],
        ["disciplinas", "Disciplinas", "/disciplinas.html", "▥"],
        ["turmas", "Turmas", "/turmas.html", "▧"]
    ];

    secoesAdmin.forEach(([id, titulo, url, icone]) => {
        const link = document.createElement("a");
        const simbolo = document.createElement("span");
        link.className = "nav-link";
        link.href = url;
        link.textContent = ` ${titulo}`;
        simbolo.className = "nav-icon";
        simbolo.setAttribute("aria-hidden", "true");
        simbolo.textContent = icone;
        link.prepend(simbolo);

        if (menuAdmin.dataset.active === id) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }

        menuAdmin.append(link);
    });
}
