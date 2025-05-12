document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    const successMessage = document.getElementById('success_change_password');
    const errorMessage = document.getElementById('error_wrong_password');
    const matchErrorMessage = document.getElementById('error_match');

    // Esconde todas as mensagens no início
    const hideAllMessages = () => {
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        matchErrorMessage.style.display = 'none';
    };

    hideAllMessages();

    if (!token || !email) {
        console.error('Token ou email não encontrados no localStorage.');
        return;
    }

    try {
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

        document.getElementById('username').value = data.data.username || '';
        document.getElementById('fullname').value = data.data.fullName || '';
        document.getElementById('email').value = data.data.email || '';
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }

    const changePasswordButton = document.querySelector('.btn-change-password');
    changePasswordButton.addEventListener('click', async (event) => {
        event.preventDefault();
        hideAllMessages();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return;
        }

        if (newPassword !== confirmPassword) {
            matchErrorMessage.style.display = 'block';
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

            successMessage.style.display = 'block';
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (error) {
            console.error('Erro ao mudar senha:', error);
            errorMessage.style.display = 'block';
        }
    });
});