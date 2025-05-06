
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
  const errorLogin = document.getElementById('error_login')
  const menu = document.querySelector('.menu')

  if (botaoAbrirPopup && estruturaLogin) {
    botaoAbrirPopup.addEventListener('click', () => {
      estruturaLogin.style.display = 'flex';

      preencherCamposSalvos();

      if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
      }
    });
  }


  const botaoFechar = document.querySelector('.botaoFechar');
  if (botaoFechar) {
    botaoFechar.addEventListener('click', () => {
      estruturaLogin.style.display = 'none';
      errorLogin.style.display = 'none'
      document.getElementById('input_email').value = '';
      document.getElementById('input_senha').value = '';
    });
  }
}

function submit() {
  const bt_login = document.getElementById('bt_login');
  const errorLogin = document.getElementById('error_login')

  document.getElementById('input_email').value = '';
  document.getElementById('input_senha').value = '';

  if (!bt_login) return;

  bt_login.addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.getElementById('input_email').value.trim();
    const senha = document.getElementById('input_senha').value.trim();

    if (!email || !senha) {
      errorLogin.style.display = 'flex';
      return;
    }

    try {
      const response = await fetch(
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
      );

      const result = await response.json();
      console.log('Resposta da API:', result);

      if (result.success) {
        const token = result.data.token;
        const name = result.data.user.fullName;
        const email = result.data.user.email;
        console.log('Token recebido:', token);
        console.log('Nome recebido', name);
        console.log('Email recebido', email)
        localStorage.setItem('name', name);
        localStorage.setItem('token', token);
        localStorage.setItem('email', email)
        console.log('Token salvo com sucesso!');

        const lembrarSenha = document.getElementById('lembrar_senha').querySelector('input').checked;

        if (lembrarSenha) {
          localStorage.setItem('lembrarSenha', 'true');
          localStorage.setItem('salvarEmail', email);
          localStorage.setItem('salvarSenha', senha);
        } else {
          localStorage.removeItem('lembrarSenha');
          localStorage.removeItem('salvarEmail');
          localStorage.removeItem('salvarSenha');
        }

        window.location.href = '/homelogado.html';
      } else {
        errorLogin.style.display = 'flex';
        document.getElementById('input_email').value = '';
        document.getElementById('input_senha').value = '';
      }
    } catch (error) {
      console.error('Erro ao fazer login', error);
      errorLogin.style.display = 'flex';
      document.getElementById('input_email').value = '';
      document.getElementById('input_senha').value = '';
    }
  });
}

function preencherCamposSalvos() {
  const lembrar = localStorage.getItem('lembrarSenha') === 'true';
  if (lembrar) {
    const salvarEmail = localStorage.getItem('salvarEmail');
    const salvarSenha = localStorage.getItem('salvarSenha');

    if (salvarEmail && salvarSenha) {
      document.getElementById('input_email').value = salvarEmail;
      document.getElementById('input_senha').value = salvarSenha;
      document.getElementById('lembrar_senha').querySelector('input').checked = true;
    }
  }
}
