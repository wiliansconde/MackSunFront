import { loadUserData } from './login.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script de atualização de perfil carregado');

    const token = localStorage.getItem('token');
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    const email = storedUserData.email || '';

    console.log(email);
    console.log("tessseettre");

    console.log('Token disponível:', !!token);
    console.log('Email disponível:', !!email);

    const userData = loadUserData();
    console.log('Dados do usuário carregados:', userData);

    const successMessage = document.getElementById('success_change_password');
    const errorMessage = document.getElementById('error_wrong_password');
    const matchErrorMessage = document.getElementById('error_match');

    const hideAllMessages = () => {
        if (successMessage) successMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        if (matchErrorMessage) matchErrorMessage.style.display = 'none';
    };

    hideAllMessages();

    if (userData) {
        console.log('Usando dados do usuário do localStorage');

        const usernameField = document.getElementById('username');
        const fullnameField = document.getElementById('fullname');
        const emailField = document.getElementById('email');
        const profileField = document.getElementById('profile');

        if (usernameField) {
            usernameField.value = userData.username || '';
            console.log('Campo username preenchido do localStorage:', usernameField.value);
        } else {
            console.log('Campo username não encontrado no DOM');
        }

        if (fullnameField) {
            fullnameField.value = userData.fullName || '';
            console.log('Campo fullname preenchido do localStorage:', fullnameField.value);
        } else {
            console.log('Campo fullname não encontrado no DOM');
        }

        if (emailField) {
            emailField.value = userData.email || '';
            console.log('Campo email preenchido do localStorage:', emailField.value);
        } else {
            console.log('Campo email não encontrado no DOM');
        }

        if (profileField) {
            profileField.value = userData.profile?.type || '';
            console.log('Campo profile preenchido do localStorage:', profileField.value);
        } else {
            console.log('Campo perfil não encontrado no DOM');
        }
    } else if (!token || !email) {
        console.log('Token ou email não encontrados. Verificando se está na página de perfil...');

        const isProfilePage = document.getElementById('username') &&
            document.getElementById('fullname') &&
            document.getElementById('email') &&
            document.getElementById('profile');

        if (isProfilePage) {
            console.log('Estamos na página de perfil mas sem autenticação. Redirecionando...');

            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html';
            return;
        } else {
            console.log('Não estamos na página de perfil, continuando...');
            return;
        }
    } else {
        try {
            const BASE_URL = window.BASE_URL || localStorage.getItem('baseUrl') || 'https://api.exemplo.com/';

            console.log('Buscando dados do usuário na API:', `${BASE_URL}users/${email}`);

            const response = await fetch(`${BASE_URL}users/${email}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }

            const data = await response.json();
            console.log('Dados do usuário recebidos da API:', data);

            localStorage.setItem('userData', JSON.stringify(data.data));

            const usernameField = document.getElementById('username');
            const fullnameField = document.getElementById('fullname');
            const emailField = document.getElementById('email');

            if (usernameField) {
                usernameField.value = data.data.username || '';
                console.log('Campo username preenchido da API:', usernameField.value);
            } else {
                console.log('Campo username não encontrado no DOM');
            }

            if (fullnameField) {
                fullnameField.value = data.data.fullName || '';
                console.log('Campo fullname preenchido da API:', fullnameField.value);
            } else {
                console.log('Campo fullname não encontrado no DOM');
            }

            if (emailField) {
                emailField.value = data.data.email || '';
                console.log('Campo email preenchido da API:', emailField.value);
            } else {
                console.log('Campo email não encontrado no DOM');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
        }
    }

    const changePasswordButton = document.querySelector('.btn-change-password');
    if (changePasswordButton) {
        console.log('Botão de alterar senha encontrado, configurando evento');

        changePasswordButton.addEventListener('click', async (event) => {
            event.preventDefault();
            hideAllMessages();
            console.log('Botão de alterar senha clicado');

            const currentPassword = document.getElementById('current-password')?.value;
            const newPassword = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('confirm-password')?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                console.log('Campos de senha incompletos');
                if (errorMessage) {
                    errorMessage.textContent = 'Preencha todos os campos.';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            if (newPassword !== confirmPassword) {
                console.log('Senhas não conferem');
                if (matchErrorMessage) matchErrorMessage.style.display = 'block';
                return;
            }

            try {
                const BASE_URL = window.BASE_URL || localStorage.getItem('baseUrl') || 'https://macksunback.azurewebsites.net/';
                console.log('Enviando solicitação para atualizar senha');

                const updateResponse = await fetch(`${BASE_URL}users/update-password`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });

                const responseData = await updateResponse.json();
                console.log('Resposta da atualização de senha:', responseData);

                if (!updateResponse.ok || responseData.success === false) {
                    if (errorMessage) {
                        errorMessage.textContent = responseData.message || 'Erro ao atualizar senha.';
                        errorMessage.style.display = 'block';
                    }
                    return;
                }

                console.log('Senha atualizada com sucesso');
                if (successMessage) successMessage.style.display = 'block';

                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            } catch (error) {
                console.error('Erro ao mudar senha:', error);
                if (errorMessage) {
                    errorMessage.textContent = 'Erro ao mudar senha. Tente novamente.';
                    errorMessage.style.display = 'block';
                }
            }
        });
    } else {
        console.log('Botão de alterar senha não encontrado');
    }
});
    