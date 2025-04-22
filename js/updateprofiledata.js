document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');

    if (!token || !email) {
        console.error('Token ou email não encontrados no localStorage.');
        return;
    }

    try {
        const response = await fetch(`https://macksunback.azurewebsites.net/users/${email}`, {
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

        // Acessando os dados dentro de 'data.data'
        document.getElementById('username').value = data.data.username || '';
        document.getElementById('fullname').value = data.data.fullName || '';
        document.getElementById('email').value = data.data.email || '';
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
});