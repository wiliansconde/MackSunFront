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

  const acessarElemntoPerfil = document.getElementById('access_profile');
  const perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario'))

  if (perfilUsuario && perfilUsuario.accessiblePages) {
    const menu = acessarElemntoPerfil;
    menu.innerHTML = '';

    perfilUsuario.accessiblePages.forEach(page => {
      const listItem = document.createElement('li')
      const link = document.createElement('a')
      link.href = page.url;
      link.textContent = page.name;
      listItem.appendChild(link);
      menu.appendChild(listItem)
    });
  }

  const elementoConta = document.getElementById('conta')

  elementoConta.addEventListener('mouseenter', () => {
    acessarElemntoPerfil.classList.add('visivel');
  })

  elementoConta.addEventListener('mouseleave', () => {
    acessarElemntoPerfil.classList.remove('visivel');
  })

  const leaveButton = document.getElementById("leave");
  if (leaveButton) {
    leaveButton.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      window.location.href = "/index.html";
    });
  }
});
