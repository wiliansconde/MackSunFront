document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  const nameElement = document.getElementById("name");
  const storedName = localStorage.getItem("name");

  if (storedName && nameElement) {
    nameElement.textContent = storedName;
    nameElement.href = "/updateprofiledata.html";
  }

  const menu = document.getElementById('access_menu'); // elemento certo para o menu
  const perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario'));

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

  const elementoConta = document.getElementById('conta');
  const accessProfile = document.getElementById('access_profile');

  elementoConta.addEventListener('mouseenter', () => {
    menu.style.display = 'block';
  });

  elementoConta.addEventListener('mouseleave', () => {
    menu.style.display = 'none';
  });

  const leave = document.getElementById("leavebutton");
  if (leave) {
    leave.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      window.location.href = "/index.html";
    });
  }
});