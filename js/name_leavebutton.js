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

  const perfilUsuario = JSON.parse(localStorage.getItem('perfilUsuario'));

  function initializeAccessMenu() {
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

      const elementoConta = document.getElementById('conta');
      const accessProfile = document.getElementById('access_profile');

      elementoConta.addEventListener('mouseenter', () => {
        menu.style.display = 'block';
      });

      elementoConta.addEventListener('mouseleave', () => {
        menu.style.display = 'none';
      });
    }
  }

  const leaveButton = document.getElementById("leave");
  if (leaveButton) {
    leaveButton.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      localStorage.removeItem("perfilUsuario");
      window.location.href = "/index.html";
    });
  }
});