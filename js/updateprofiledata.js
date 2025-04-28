import { BASE_URL } from './const.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
        console.error('Token ou email não encontrados no localStorage.');
        return;
    }

    try {
        const response = await fetch(BASE_URL + 'users/${email}', {
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

        document.getElementById('username').value = data.data.username || '';
        document.getElementById('fullname').value = data.data.fullName || '';
        document.getElementById('email').value = data.data.email || '';
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }

    const changePasswordButton = document.querySelector('.btn-change-password');
    changePasswordButton.addEventListener('click', async () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Preencha todos os campos de senha.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('As novas senhas não coincidem.');
            return;
        }

        try {
            const updateResponse = await fetch(BASE_URL + 'users/update-password', {
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

            alert('Senha atualizada com sucesso!');
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (error) {
            console.error('Erro ao mudar senha:', error);
            alert('Erro ao mudar senha. Verifique sua senha atual.');
        }
    });
});