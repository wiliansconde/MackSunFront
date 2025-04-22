document.addEventListener('DOMContentLoaded', () => {
    const menuHamburger = document.getElementById('menu_hamburger');
    const menu = document.querySelector('.menu');

    menuHamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
    });
});