// Função para verificar status de login e atualizar o cabeçalho
function atualizarCabecalhoAposLogin() {
  // Verificar se o usuário está logado (você precisará implementar sua lógica de autenticação)
  const estaLogado = verificarStatusLogin();
  
  if (estaLogado) {
      // Obter elementos de botão de login e link de registro
      const botaoLogin = document.querySelector('.botaoLoginMenu');
      const linkCadastro = document.querySelector('.cadastro');
      
      // Criar div de conta de usuário
      const divContaUsuario = document.createElement('div');
      divContaUsuario.className = 'divconta nome_usuario';
      divContaUsuario.id = 'conta';
      
      // Criar link de nome de usuário
      const linkNomeUsuario = document.createElement('a');
      linkNomeUsuario.className = 'nome_logado';
      linkNomeUsuario.id = 'name';
      linkNomeUsuario.href = '#';
      
      // Obter nome de usuário (você precisará recuperar isso do seu sistema de autenticação)
      const nomeUsuario = obterNomeUsuario();
      linkNomeUsuario.textContent = nomeUsuario;
      
      // Criar menu suspenso de perfil de acesso
      const menuSuspenso = document.createElement('ul');
      menuSuspenso.className = 'access_profile menu_suspenso';
      menuSuspenso.id = 'access_profile';
      menuSuspenso.innerHTML = `
          <li><a href="/updateprofiledata.html">Acessar Perfil</a></li>
          <li><a href="#" id="botao-sair">Sair</a></li>
      `;
      
      // Adicionar elementos
      divContaUsuario.appendChild(linkNomeUsuario);
      divContaUsuario.appendChild(menuSuspenso);
      
      // Encontrar menu de navegação
      const menuNavegacao = document.querySelector('.menu');
      
      // Remover elementos de login existentes
      if (botaoLogin) botaoLogin.remove();
      if (linkCadastro) linkCadastro.remove();
      
      // Adicionar nova div de conta de usuário ao menu
      menuNavegacao.appendChild(divContaUsuario);
      
      // Adicionar funcionalidade de logout
      const botaoSair = document.getElementById('botao-sair');
      if (botaoSair) {
          botaoSair.addEventListener('click', tratarLogout);
      }
  }
}

// Função para verificar status de login (você precisa implementar baseado no seu método de autenticação)
function verificarStatusLogin() {
  // Exemplo de implementação - substitua pela sua verificação real de login
  // Isso pode ser verificar um token no localStorage, sessão, etc.
  const token = localStorage.getItem('tokenUsuario');
  return !!token; // Retorna true se o token existir
}

// Função para obter nome de usuário (você precisa implementar)
function obterNomeUsuario() {
  // Exemplo de implementação - substitua pelo seu método real de obter nome de usuário
  return localStorage.getItem('nomeUsuario') || 'Usuário';
}

// Função para tratar logout
function tratarLogout() {
  // Implementar lógica de logout
  localStorage.removeItem('tokenUsuario');
  localStorage.removeItem('nomeUsuario');
  
  // Redirecionar para página de login ou atualizar
  window.location.href = '/login.html';
}

// Executar quando a página carregar
document.addEventListener('DOMContentLoaded', atualizarCabecalhoAposLogin);