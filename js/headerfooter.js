import { loadHTML } from './loaders.js';
import { verifyToken, loadUserData, inicializarLoginPopup, submit } from './login.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM completamente carregado. Chamando loadHTML.");
  
  // Primeiro, carregamos o header
  if (document.getElementById('header')) {
    loadHTML("header", "../../../header.html", () => {
      console.log("Header carregado com sucesso, configurando elementos");
      
      // Carregamos os dados do usuário
      const user = loadUserData();
      let nomeUsuario = user !== null ? user.fullName : '';
      let userActionsElement = document.getElementById('userActions');
      
      // Conteúdo para usuários não logados
      const loginButtons = `
        <li><button class="botaoLoginMenu">Login</button></li>
        <li class="cadastro"><a href="/register.html">Register</a></li>
      `;
      
      const featureList = user?.profile?.accessiblePages


      // Conteúdo para usuários logados
     const userAccount = `
  <div class="divconta nome_usuario" id="conta">
    <a class="nome_logado" id="name" href="#">${nomeUsuario}</a>
    <ul class="access_profile menu_suspenso" id="access_profile">
      ${featureList?.map(item => 
        `<li><a href="/pages${item.url}">${item.name || 'Atualizar perfil'}</a></li>`
      ).join('')}
      <li><a href="#" id="botao-sair">Leave</a></li>
    </ul>
  </div>
  <ul>
    <li><button class="sair" id="leave">Leave</button></li>
  </ul>
`.trim();

      // Verificamos se o token existe antes de decidir o que mostrar
      const isLoggedIn = verifyToken();
      console.log("Token verificado:", isLoggedIn);
      
      // Atualizamos o HTML com base no status de login
      if (userActionsElement) {
        userActionsElement.innerHTML = isLoggedIn ? userAccount : loginButtons;
        
        // IMPORTANTE: Só adicionamos os event listeners DEPOIS de inserir o HTML
        if (isLoggedIn) {
          setupLogoutButtons();
          setupAccessMenu();
        }
      } else {
        console.error("Elemento userActions não encontrado!");
      }
      
      // Inicializar eventos do popup de login
      inicializarLoginPopup();
      submit();
      
      // Configurar o menu hamburguer, se existir
      const menuHamburger = document.getElementById('menu_hamburger');
      const menu = document.querySelector('.menu');
      
      if (menuHamburger && menu) {
        menuHamburger.addEventListener('click', () => {
          menu.classList.toggle('active');
        });
      }
    });
  }
  
  // Carregamos o footer, se existir
  if (document.getElementById('footer')) {
    loadHTML('footer', 'footer.html');
  }
});

// Função para configurar os botões de logout
function setupLogoutButtons() {
  // Configurar botão Leave
  const leaveButton = document.getElementById('leave');
  if (leaveButton) {
    console.log("Botão Leave encontrado, adicionando evento de clique");
    leaveButton.addEventListener('click', handleLogout);
  } else {
    console.error("Botão Leave não encontrado após renderização!");
  }
  
  // Configurar botão Sair no menu suspenso
  const botaoSair = document.getElementById('botao-sair');
  if (botaoSair) {
    console.log("Botão Sair encontrado, adicionando evento de clique");
    botaoSair.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  } else {
    console.error("Botão botao-sair não encontrado após renderização!");
  }
}

// Função para mostrar/ocultar menu suspenso do perfil
function setupAccessMenu() {
  const elementoConta = document.getElementById('conta');
  const accessProfile = document.getElementById('access_profile');
  
  if (elementoConta && accessProfile) {
    console.log("Configurando eventos para o menu suspenso do perfil");
    
    elementoConta.addEventListener('mouseenter', () => {
      accessProfile.style.display = 'block';
    });
    
    elementoConta.addEventListener('mouseleave', () => {
      accessProfile.style.display = 'none';
    });
  }
}

// Função para carregar o menu de acesso personalizado do usuário
function setupUserAccessMenu() {
  const perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario'));
  const menu = document.getElementById('access_menu');
  
  if (perfilUsuario && perfilUsuario.accessiblePages && menu) {
    menu.innerHTML = '';
    
    perfilUsuario.accessiblePages.forEach(page => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = page.url;
      link.textContent = page.name;
      listItem.appendChild(link);
      menu.appendChild(listItem);
    });
  }
}

// Função para lidar com o logout
function handleLogout() {
  console.log("Função de logout chamada");
  
  // Limpar todos os dados relevantes do localStorage
  localStorage.removeItem('userData');
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  localStorage.removeItem('email');
  localStorage.removeItem('perfilUsuario');
  localStorage.removeItem('lembrarSenha');
  localStorage.removeItem('salvarEmail');
  localStorage.removeItem('salvarSenha');
  
  console.log("Dados de login removidos, redirecionando para index.html");
  
  // Redirecionar para a página inicial
  window.location.href = '/index.html';
}