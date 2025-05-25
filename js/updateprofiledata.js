// Arquivo: updateprofiledata.js

// Importamos a função loadUserData do login.js
// Importante: Este arquivo precisa ter type="module" na tag script do HTML
import { loadUserData } from './login.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script de atualização de perfil carregado');
    
    // 1. Verificar autenticação usando a função loadUserData
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    
    console.log('Token disponível:', !!token);
    console.log('Email disponível:', !!email);

    // Carregar dados do usuário usando a função exportada
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

    // Se já temos os dados do usuário no localStorage, usamos diretamente
    if (userData) {
        console.log('Usando dados do usuário do localStorage');
        
        // Preencher os campos com os dados do localStorage
        const usernameField = document.getElementById('username');
        const fullnameField = document.getElementById('fullname');
        const emailField = document.getElementById('email');
        
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
    }
    // Se não temos dados no localStorage ou não temos token/email, verificamos se precisamos buscar da API
    else if (!token || !email) {
        console.log('Token ou email não encontrados. Verificando se está na página de perfil...');
        
        // Verificar se estamos na página de perfil (verificando a existência dos campos)
        const isProfilePage = document.getElementById('username') && 
                             document.getElementById('fullname') && 
                             document.getElementById('email');
        
        if (isProfilePage) {
            console.log('Estamos na página de perfil mas sem autenticação. Redirecionando...');
            // Redirecionar para a página de login ou exibir mensagem
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html'; // Ajuste conforme necessário
            return;
        } else {
            console.log('Não estamos na página de perfil, continuando...');
            return; // Se não estamos na página de perfil, não há problema em não ter autenticação
        }
    }
    // Se temos token e email mas não temos dados no localStorage, buscamos da API
    else {
        try {
            // Certifique-se que BASE_URL está definido e acessível
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
            
            // Salvar os dados no localStorage para uso futuro
            localStorage.setItem('userData', JSON.stringify(data.data));
            
            // Preencher os campos com os dados recebidos
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

    // 4. Configurar evento para o botão de alterar senha
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
                console.log(BASE_URL);
                
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

                if (!updateResponse.ok) {
                    throw new Error(`Erro ao atualizar senha: ${updateResponse.status}`);
                }

                console.log('Senha atualizada com sucesso');
                if (successMessage) successMessage.style.display = 'block';
                
                // Limpar os campos após sucesso
                if (document.getElementById('current-password')) document.getElementById('current-password').value = '';
                if (document.getElementById('new-password')) document.getElementById('new-password').value = '';
                if (document.getElementById('confirm-password')) document.getElementById('confirm-password').value = '';
            } catch (error) {
                console.error('Erro ao mudar senha:', error);
                if (errorMessage) errorMessage.style.display = 'block';
            }
        });
    } else {
        console.log('Botão de alterar senha não encontrado');
    }
});
