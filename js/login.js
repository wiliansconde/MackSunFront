import { loadHTML } from './loaders.js';

const REMEMBER_EMAIL_KEY = 'rememberedEmail';

document.addEventListener('DOMContentLoaded', () => {
    if (verifyToken()) {
        mostrarConteudoUsuarioLogado();
        document.dispatchEvent(new CustomEvent('loginSuccess'));
    } else {
        inicializarLoginPopup();
        preencherEmailSalvo();
    }
    submit();
});

export function mostrarConteudoUsuarioLogado() {
    const userData = loadUserData();
    const nomeUsuario = userData ? userData.nome || 'Usuário' : 'Usuário';

    const botaoLogin = document.querySelector('.botaoLoginMenu');
    const linkCadastro = document.querySelector('.cadastro');
    const menuNavegacao = document.querySelector('.menu');

    if (!menuNavegacao) {
        console.warn('Menu de navegação não encontrado');
        return;
    }

    const elementoHTML = document.createElement('div');
    elementoHTML.innerHTML = `
        <div class="divconta nome_usuario" id="conta">
            <a class="nome_logado" id="name" href="#">${nomeUsuario}</a>
            <ul class="access_profile menu_suspenso" id="access_profile">
                <li><a href="/updateprofiledata.html">Acessar Perfil</a></li>
                <li><a href="#" id="botao-sair">Sair</a></li>
            </ul>
        </div>
    `.trim();

    const userActionsContainer = document.getElementById('userActions');
    if (userActionsContainer) {
        userActionsContainer.innerHTML = '';
        userActionsContainer.appendChild(elementoHTML);
    } else {
        if (botaoLogin) botaoLogin.parentNode.removeChild(botaoLogin);
        if (linkCadastro) linkCadastro.parentNode.removeChild(linkCadastro);
        menuNavegacao.appendChild(elementoHTML);
    }

    const botaoSair = document.getElementById('botao-sair');
    if (botaoSair) {
        botaoSair.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userData');
            localStorage.removeItem('token');
            sessionStorage.removeItem('userInfo');

            document.dispatchEvent(new CustomEvent('logoutSuccess'));

            window.location.reload();
        });
    }
}

export function inicializarLoginPopup() {
    let estruturaLogin = document.querySelector('.estruturaLogin');

    if (!estruturaLogin) {
        loadHTML('estruturaLogin', '/login.html', () => {
            ativarBotaoLogin();
            submit();
            preencherEmailSalvo();
        });
    } else {
        ativarBotaoLogin();
        preencherEmailSalvo();
    }
}

function ativarBotaoLogin() {
    const botaoAbrirPopup = document.querySelector('.botaoLoginMenu');
    const estruturaLogin = document.querySelector('.estruturaLogin');
    const errorLogin = document.getElementById('error_login');
    const menu = document.querySelector('.menu');

    if (!botaoAbrirPopup || !estruturaLogin) {
        console.warn('Login desativado neste contexto: botaoAbrirPopup ou estruturaLogin não encontrados.');
        return;
    }

    botaoAbrirPopup.removeEventListener('click', abrirPopup);
    botaoAbrirPopup.addEventListener('click', abrirPopup);

    function abrirPopup() {
        estruturaLogin.style.display = 'flex';
        preencherEmailSalvo();
        if (menu && menu.classList.contains('active')) {
            menu.classList.remove('active');
        }
    }

    const botaoFechar = document.querySelector('.botaoFechar');
    if (botaoFechar) {
        botaoFechar.addEventListener('click', () => {
            estruturaLogin.style.display = 'none';
            if (errorLogin) errorLogin.style.display = 'none';

            const senhaInput = document.getElementById('input_senha');
            if (senhaInput) senhaInput.value = '';
        });
    }
}

function preencherEmailSalvo() {
    const emailInput = document.getElementById('input_email');
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const rememberMeCheckbox = document.getElementById('remember_me_checkbox');

    if (emailInput && rememberedEmail) {
        emailInput.value = rememberedEmail;
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    } else if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = false;
    }
}

export function submit() {
    const bt_login = document.getElementById('bt_login');

    if (!bt_login) {
        console.warn('Botão de submit não encontrado, será inicializado quando o HTML for carregado');
        return;
    }

    bt_login.removeEventListener('click', handleSubmit);
    bt_login.addEventListener('click', handleSubmit);

    function handleSubmit(event) {
        event.preventDefault();

        const errorLogin = document.getElementById('error_login');
        const email = document.getElementById('input_email')?.value.trim();
        const senha = document.getElementById('input_senha')?.value.trim();
        const rememberMeCheckbox = document.getElementById('remember_me_checkbox');

        if (!email || !senha) {
            if (errorLogin) {
                errorLogin.textContent = 'Your email or password is incorrect.';
                errorLogin.style.display = 'flex';
            }
            return;
        }

        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        fetch(
            BASE_URL + 'auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: senha,
                }),
            }
        )
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || 'Unknown error when logging in.');
                    });
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    const user = result.data.user;
                    const token = result.data.token;
                    sessionStorage.setItem('userInfo', JSON.stringify(result));

                    localStorage.setItem('userData', JSON.stringify(user));
                    localStorage.setItem('token', token);

                    document.dispatchEvent(new CustomEvent('loginSuccess'));
                    console.log('Login manual bem-sucedido! Evento loginSuccess disparado.');

                    window.location.reload();
                } else {
                    if (errorLogin) {
                        errorLogin.textContent = 'Your email or password is incorrect';
                        errorLogin.style.display = 'flex';
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao fazer login', error);
                if (errorLogin) {
                    errorLogin.textContent = 'Your email or password is incorrect.';

                    errorLogin.style.display = 'flex';
                }
                const emailInput = document.getElementById('input_email');
                const senhaInput = document.getElementById('input_senha');

                if (emailInput && (!rememberMeCheckbox || !rememberMeCheckbox.checked)) {
                    emailInput.value = '';
                }
                if (senhaInput) senhaInput.value = '';
            });
    }
}

export function verifyToken() {
    return localStorage.getItem("token") !== null;
}

export function loadUserData() {
    const userDataStr = localStorage.getItem("userData");
    try {
        return userDataStr ? JSON.parse(userDataStr) : null;
    } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
        return null;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}