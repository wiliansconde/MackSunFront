<<<<<<< HEAD
import { loadHTML } from './loaders.js'; 
import {verifyToken, loadUserData, inicializarLoginPopup, submit} from './login.js';   

document.addEventListener('DOMContentLoaded', () => {   
  console.log("DOM completamente carregado. Chamando loadHTML.");    
  
  if (document.getElementById('header')) {     
    // loadHTML('header', 'header.html');      
    loadHTML("header", "header.html", () => {       
      const menuHamburger = document.getElementById('menu_hamburger');       
      const menu = document.querySelector('.menu');        
      
      const user = loadUserData()       
      let nomeUsuario = user !== null ? user.fullName : ''       
      let userActionsElement = document.getElementById('userActions')       
      const loginButtons = ' <li><button class="botaoLoginMenu">Login</button></li> <li class="cadastro"><a href="/register.html">Register</a></li>'       
      const userAccount = `           
        <div class="divconta nome_usuario" id="conta">             
          <a class="nome_logado" id="name" href="#">${nomeUsuario}</a>             
          <ul class="access_profile menu_suspenso" id="access_profile">               
            <li><a href="/updateprofiledata.html">Acessar Perfil</a></li>               
            <li><a href="#" id="botao-sair">Sair</a></li>             
          </ul>           
        </div>           
        <div>           
          <li><button class="sair" id="leave">Leave</button></li>         
        </div>         
      `.trim();          
      
      userActionsElement.innerHTML = verifyToken() ? userAccount : loginButtons       
      console.log("Token verificado:", verifyToken())       
      
      // Inicializar eventos do popup de login
      inicializarLoginPopup();       
      submit();       
      
      // Adicionar funcionalidade ao botão "Leave"
      const leaveButton = document.getElementById('leave');
      if (leaveButton) {
        console.log("Botão Leave encontrado, adicionando evento de clique");
        leaveButton.addEventListener('click', handleLogout);
      } else {
        console.log("Botão Leave não encontrado");
=======
function loadHTML(id, file, callback) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = data;
        if (typeof callback === 'function') {
          callback();
        }
>>>>>>> 1d78d0bf14477d15a201d76205b8d7c7cf251404
      }
      
      // Adicionar também ao botão-sair do menu suspenso
      const botaoSair = document.getElementById('botao-sair');
      if (botaoSair) {
        console.log("Botão Sair encontrado, adicionando evento de clique");
        botaoSair.addEventListener('click', (e) => {
          e.preventDefault();
          handleLogout();
        });
      }
      
      // Função para lidar com o logout
      function handleLogout() {
        console.log("Função de logout chamada");
        // Limpar dados do localStorage
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        
        // Opcional: você pode querer limpar outros dados também
        localStorage.removeItem('lembrarSenha');
        localStorage.removeItem('salvarEmail');
        localStorage.removeItem('salvarSenha');
        
        console.log("Dados de login removidos, redirecionando para index.html");
        
        // Redirecionar para a página inicial
        window.location.href = '/index.html';
      }
      
      // if (menuHamburger && menu) {       
      //     menuHamburger.addEventListener('click', () => {       
      //         menu.classList.toggle('active');       
      //     });       
      // } else {       
      //     console.error('menuHamburger ou menu não encontrado!');       
      // }   
    });   
  }     
  
  if (document.getElementById('footer')) {     
    loadHTML('footer', 'footer.html');   
  }   
});    

<<<<<<< HEAD
// loadHTML("header", "./header.html"); 
// loadHTML("footer", "./footer.html"); 
// loadHTML("headersimple", "./headersimple.html");
=======
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('header')) {
    loadHTML('header', 'header.html');
  }

  if (document.getElementById('footer')) {
    loadHTML('footer', 'footer.html');
  }

  if (document.getElementById('headersimple')) {
    loadHTML('headersimple', 'headersimple.html', () => {
      const script = document.createElement("script");
      script.src = "/js/name_leavebutton.js";
      script.defer = true;
      document.body.appendChild(script);
    });
  }
});
>>>>>>> 1d78d0bf14477d15a201d76205b8d7c7cf251404
