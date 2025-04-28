document.addEventListener('DOMContentLoaded', () => {
    loadHTML("header", "header.html", () => {
        const menuHamburger = document.getElementById('menu_hamburger');
        const menu = document.querySelector('.menu');

        if (menuHamburger && menu) {
            menuHamburger.addEventListener('click', () => {
                menu.classList.toggle('active');
            });
        } else {
            console.error('menuHamburger ou menu não encontrado!');
        }
    });
});

function loadHTML(id, file, callback) {
    fetch(file)
        .then((response) => {
            if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
            return response.text();
        })
        .then((data) => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = data;
                if (callback) callback();
            } else {
                console.error(`Elemento com id '${id}' não encontrado.`);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}