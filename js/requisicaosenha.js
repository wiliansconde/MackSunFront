document.addEventListener('DOMContentLoaded', () => {
    recuperarSenha();
});

function setEstadoDosBotoes(desejaDesabilitar = true) {
    const botoes = document.querySelectorAll('button, input[type="submit"]');
    botoes.forEach(botao => {
        botao.disabled = desejaDesabilitar;
    });

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        const tipo = input.type.toLowerCase();

        if (input.tagName.toLowerCase() === 'select') {
            input.disabled = desejaDesabilitar;
        } else if (tipo === 'checkbox' || tipo === 'radio') {
            input.disabled = desejaDesabilitar;
        } else {
            input.readOnly = desejaDesabilitar;
        }
    });
}

function recuperarSenha() {
    const btnRecuperar = document.getElementById('formulario_btn')
    const email_valido = document.getElementById('email_valido')
    const msgErro = document.querySelector('.invalid_message_error')
    const msgSucesso = document.querySelector('.valid_message_error')

    btnRecuperar.addEventListener('click', async (event) => {
        event.preventDefault();

        setEstadoDosBotoes(true);

        btnRecuperar.disabled = true;
        msgErro.style.display = 'none';
        msgSucesso.style.display = 'none';

        const email = email_valido.value.trim();

        if (!email || !email.includes('@')) {
            msgErro.style.display = 'inline-block';
            setEstadoDosBotoes(false);
            return;
        }
        try {
            const response = await fetch(BASE_URL + 'users/forgot-password', {
                method: 'PATCH',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            })

            const result = await response.json();
            console.log('Resposta da API', result)

            if (response.ok) {
                msgSucesso.style.display = 'inline-block'
                email_valido.value = '';
            } else {
                msgErro.style.display = 'inline-block'
            }

        } catch (error) {
            console.log('erro na requisição:', error)
        }
        setTimeout(() => {
            setEstadoDosBotoes(false)
        }, 2000);
    })
}
