document.addEventListener('DOMContentLoaded', () => {
    recuperarSenha();
});

function recuperarSenha() {
    const btnRecuperar = document.getElementById('formulario_btn')
    const email_valido = document.getElementById('email_valido')
    const msgErro = document.querySelector('.email-invalido')
    const msgSucesso = document.querySelector('.recuperar-senha_sucesso')

    btnRecuperar.addEventListener('click', async (event) => {
        event.preventDefault();

        const email = email_valido.value.trim();

        if (!email || !email.includes('@')) {
            msgErro.style.display = 'block';
            return;
        }
        try {
            const response = await fetch('https://macksunback.azurewebsites.net/users/forgot-password', {
                method: 'PATCH',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            })

            const result = await response.json();
            console.log('Resposta da API', result)

            if (response.ok) {
                msgSucesso.style.display = 'block'
                email_valido.value = '';
            } else {
                msgErro.style.display = 'block'
            }

        } catch (error) {
            console.log('erro na requisição:', error)
        }
    })
}
