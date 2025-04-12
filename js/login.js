// Carregar o Html do Login

document.addEventListener("DOMContentLoaded", () => {
    loadHTML("estruturaLogin", "login.html", () => {
        inicializarLoginPopup();
        submit()
    });
});

function loadHTML(id, file, callback) {
    fetch(file)
        .then(response => {
            if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
            return response.text();
        })
        .then(data => {
            document.getElementById(id).innerHTML = data;
            if (callback) callback();
        })
        .catch(error => {
            console.error(error);
        });
}

function inicializarLoginPopup() {
    const botaoAbrirPopup = document.querySelector(".botaoLoginMenu");
    const estruturaLogin = document.querySelector(".estruturaLogin");

    if (botaoAbrirPopup && estruturaLogin) {
        botaoAbrirPopup.addEventListener("click", () => {
            estruturaLogin.style.display = "flex";
        });
    } else {
        console.warn("Elemento(s) não encontrado(s) ao tentar adicionar o evento de popup.");
    }

    const botaoFechar = document.querySelector(".botaoFechar");
    if (botaoFechar) {
        botaoFechar.addEventListener("click", () => {
            estruturaLogin.style.display = "none";
        });
    }
}

function submit() {
    const bt_login = document.getElementById('bt_login')

    bt_login.addEventListener('click', async (event) => {
        event.preventDefault()
        const email = document.getElementById('input_email').value;
        const senha = document.getElementById('input_senha').value;

        try {
            const response = await fetch("https://macksunback.azurewebsites.net/auth/login", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: email,
                    password: senha
                })
            })
            const result = await response.json()
            const token = result.data.token
            localStorage.setItem('token')

        } catch (error) {
            console.error("Erro ao fazer login", error)
        }
    })
}

