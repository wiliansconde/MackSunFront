import { loadHTML } from './loaders.js';

document.addEventListener('DOMContentLoaded', () => {
 
  if (verifyToken()) {
    mostrarConteudoUsuarioLogado();
  } else {
    inicializarLoginPopup();
  }
  
  // Inicializar o formulário de login
  submit();
});

// Função para mostrar conteúdo quando o usuário está logado
function mostrarConteudoUsuarioLogado() {
  // Obter dados do usuário
  const userData = loadUserData();
  const nomeUsuario = userData ? userData.nome || 'Usuário' : 'Usuário';
  
  // Obter os elementos a serem substituídos
  const botaoLogin = document.querySelector('.botaoLoginMenu');
  const linkCadastro = document.querySelector('.cadastro');
  
  // Verificar se os elementos existem para evitar erros
  if (!botaoLogin) {
    console.warn('Botão de login não encontrado');
    return;
  }
  
  // Criar elemento temporário para o HTML do perfil de usuário
  const elementoHTML = document.createElement('div');
  elementoHTML.innerHTML = `
    <div class="divconta nome_usuario" id="conta">
      <a class="nome_logado" id="name" href="#">${nomeUsuario}</a>
      <ul class="access_profile menu_suspenso" id="access_profile">
        <li><a href="/updateprofiledata.html">Acessar Perfil</a></li>
        <li><a href="#" id="botao-sair">Sair</a></li>
      </ul>
    </div>
  `.trim();
  
  // Obter a div de conta de usuário
  const divContaUsuario = elementoHTML.firstElementChild;
  
  // Obter o menu de navegação
  const menuNavegacao = document.querySelector('.menu');
  
  // Remover elementos de login existentes
  if (botaoLogin) botaoLogin.parentNode.removeChild(botaoLogin);
  if (linkCadastro) linkCadastro.parentNode.removeChild(linkCadastro);
  
  // Adicionar o elemento de usuário logado
  menuNavegacao.appendChild(divContaUsuario);
  
  // Adicionar evento de logout
  const botaoSair = document.getElementById('botao-sair');
  if (botaoSair) {
    botaoSair.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      window.location.reload(); // Recarregar a página
    });
  }
}

export function inicializarLoginPopup() {
  console.log('Inicializando popup de login...');
  
  // Primeiro, verificar se o elemento estruturaLogin já existe
  let estruturaLogin = document.querySelector('.estruturaLogin');
  
  // Se não existir, carregar o HTML do login
  if (!estruturaLogin) {
    console.log('Carregando HTML de login...');
    loadHTML('estruturaLogin', 'login.html', () => {
      console.log('HTML de login carregado');
      ativarBotaoLogin();
    });
  } else {
    ativarBotaoLogin();
  }
}

// Função para ativar o botão de login
function ativarBotaoLogin() {
  const botaoAbrirPopup = document.querySelector('.botaoLoginMenu');
  const estruturaLogin = document.querySelector('.estruturaLogin');
  const errorLogin = document.getElementById('error_login');
  const menu = document.querySelector('.menu');
  
  console.log('Botão de login:', botaoAbrirPopup);
  console.log('Estrutura de login:', estruturaLogin);
  
  if (botaoAbrirPopup && estruturaLogin) {
    // Remover qualquer event listener existente para evitar duplicações
    botaoAbrirPopup.removeEventListener('click', abrirPopup);
    
    // Adicionar novo event listener
    botaoAbrirPopup.addEventListener('click', abrirPopup);
    
    function abrirPopup() {
      console.log('Botão de login clicado!');
      estruturaLogin.style.display = 'flex';
      
      preencherCamposSalvos();
      
      if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
      }
    }
  } else {
    console.error('Elementos necessários não encontrados:');
    console.error('botaoAbrirPopup:', botaoAbrirPopup);
    console.error('estruturaLogin:', estruturaLogin);
  }
  
  const botaoFechar = document.querySelector('.botaoFechar');
  if (botaoFechar) {
    botaoFechar.addEventListener('click', () => {
      estruturaLogin.style.display = 'none';
      if (errorLogin) errorLogin.style.display = 'none';
      
      const emailInput = document.getElementById('input_email');
      const senhaInput = document.getElementById('input_senha');
      
      if (emailInput) emailInput.value = '';
      if (senhaInput) senhaInput.value = '';
    });
  }
}

export function submit() {
  console.log('Inicializando submit do login...');
  
  const bt_login = document.getElementById('bt_login');
  
  if (!bt_login) {
    console.log('Botão de submit não encontrado, será inicializado quando o HTML for carregado');
    return;
  }
  
  console.log('Botão de submit encontrado:', bt_login);
  
  // Remover qualquer event listener existente para evitar duplicações
  bt_login.removeEventListener('click', handleSubmit);
  
  // Adicionar novo event listener
  bt_login.addEventListener('click', handleSubmit);
  
  function handleSubmit(event) {
    event.preventDefault();
    
    const errorLogin = document.getElementById('error_login');
    const email = document.getElementById('input_email')?.value.trim();
    const senha = document.getElementById('input_senha')?.value.trim();
    
    if (!email || !senha) {
      if (errorLogin) errorLogin.style.display = 'flex';
      return;
    }
    
    // Aqui continua sua lógica de login existente...
    console.log('Tentando fazer login com:', email);
    
    // Exemplo: Chamada da API existente
    fetch(
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
    )
    .then(response => response.json())
    .then(result => {
      console.log('Resposta da API:', result);
      
      if (result.success) {
        const user = result.data.user;
        const token = result.data.token;
        const id = result.data.id;
        
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('email', email);
        localStorage.setItem('id', id);
        localStorage.setItem('token', token);
        console.log('Token salvo com sucesso!');
        
        const lembrarSenha = document.getElementById('lembrar_senha')?.querySelector('input')?.checked;
        
        if (lembrarSenha) {
          localStorage.setItem('lembrarSenha', 'true');
          localStorage.setItem('salvarEmail', email);
          localStorage.setItem('salvarSenha', senha);
        } else {
          localStorage.removeItem('lembrarSenha');
          localStorage.removeItem('salvarEmail');
          localStorage.removeItem('salvarSenha');
        }
        
        // Recarregar página para mostrar conteúdo de usuário logado
        window.location.reload();
      } else {
        if (errorLogin) errorLogin.style.display = 'flex';
        const emailInput = document.getElementById('input_email');
        const senhaInput = document.getElementById('input_senha');
        
        if (emailInput) emailInput.value = '';
        if (senhaInput) senhaInput.value = '';
      }
    })
    .catch(error => {
      console.error('Erro ao fazer login', error);
      if (errorLogin) errorLogin.style.display = 'flex';
      const emailInput = document.getElementById('input_email');
      const senhaInput = document.getElementById('input_senha');
      
      if (emailInput) emailInput.value = '';
      if (senhaInput) senhaInput.value = '';
    });
  }
}

export function preencherCamposSalvos() {
  const lembrar = localStorage.getItem('lembrarSenha') === 'true';
  if (lembrar) {
    const salvarEmail = localStorage.getItem('salvarEmail');
    const salvarSenha = localStorage.getItem('salvarSenha');
    
    const emailInput = document.getElementById('input_email');
    const senhaInput = document.getElementById('input_senha');
    const lembrarCheckbox = document.getElementById('lembrar_senha')?.querySelector('input');
    
    if (salvarEmail && salvarSenha && emailInput && senhaInput && lembrarCheckbox) {
      emailInput.value = salvarEmail;
      senhaInput.value = salvarSenha;
      lembrarCheckbox.checked = true;
    }
  }
}

export function verifyToken() {
  return localStorage.getItem("token") !== null;
}

export function loadUserData() {
  const userDataStr = localStorage.getItem("userData");
  try {
    return userDataStr ? JSON.parse(userDataStr) : null;
  } catch (e) {
    console.error("Erro ao carregar dados do usuário:", e);
    return null;
  }
}