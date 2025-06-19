import { verifyToken, mostrarConteudoUsuarioLogado, inicializarLoginPopup } from './login.js'; 

document.addEventListener('DOMContentLoaded', () => {
    loadHTML("header", "header.html", () => {
        const menuHamburger = document.getElementById('menu_hamburger');
        const menu = document.querySelector('.menu');

        if (menuHamburger && menu) {
            menuHamburger.addEventListener('click', () => {
                menu.classList.toggle('active');
                // Se o menu hambúrguer for clicado e o popup de login estiver aberto, feche-o
                const estruturaLogin = document.querySelector('.estruturaLogin');
                if (estruturaLogin && estruturaLogin.style.display === 'flex') {
                    estruturaLogin.style.display = 'none';
                }
            });
        } else {
            console.error('menuHamburger ou menu não encontrado!');
        }

        if (verifyToken()) {
            mostrarConteudoUsuarioLogado();
        } else {
            inicializarLoginPopup();
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
                console.log(`HTML '${file}' carregado em #${id}`);
                if (callback) callback();
            } else {
                console.error(`Elemento com id '${id}' não encontrado.`);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}