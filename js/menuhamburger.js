document.addEventListener('DOMContentLoaded', () => {
    loadHTML("header", "header.html", () => {
        const menuHamburger = document.getElementById('menu_hamburger');
        const menu = document.querySelector('.menu');

        menuHamburger.addEventListener('click', () => {
            menu.classList.toggle('active');
        })
    });
});

function loadHTML(id, file, callback) {
    fetch(file)
        .then((response) => {
            if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
            return response.text();
        })
        .then((data) => {
            document.getElementById(id).innerHTML = data;
            if (callback) callback();
        })
        .catch((error) => {
            console.error(error);
        });
}