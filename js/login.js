document.addEventListener('DOMContentLoaded', () => {
  loadHTML('estruturaLogin', 'login.html', () => {
    inicializarLoginPopup();
    submit();
  });
});

function loadHTML(id, file, callback) {
  fetch(file)
    .then((response) => {
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback();
    })
    .catch((error) => {
      console.error(error);
    });
}

function inicializarLoginPopup() {
  const botaoAbrirPopup = document.querySelector('.botaoLoginMenu');
  const estruturaLogin = document.querySelector('.estruturaLogin');

  if (botaoAbrirPopup && estruturaLogin) {
    botaoAbrirPopup.addEventListener('click', () => {
      estruturaLogin.style.display = 'flex';
    });
  }

  const botaoFechar = document.querySelector('.botaoFechar');
  if (botaoFechar) {
    botaoFechar.addEventListener('click', () => {
      estruturaLogin.style.display = 'none';
    });
  }
}

function submit() {
  const bt_login = document.getElementById('bt_login');

  if (!bt_login) return;

  bt_login.addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.getElementById('input_email').value.trim();
    const senha = document.getElementById('input_senha').value.trim();

    if (!email || !senha) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(
        'https://macksunback.azurewebsites.net/auth/login',
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
      );

      const result = await response.json();
      console.log('Resposta da API:', result);

      if (result.success) {
        const token = result.data.token;
        const name = result.data.user.fullName;
        console.log('Token recebido:', token);
        console.log('Nome recebido', name);
        localStorage.setItem('name', name);
        localStorage.setItem('token', token);
        console.log('Token salvo com sucesso!');

        window.location.href = '/html/homelogado.html';
      } else {
        alert(result.message || 'Login denied.');
      }
    } catch (error) {
      console.error('Erro ao fazer login', error);
      alert('Something went wrong. Please try again later.');
    }
  });
}
