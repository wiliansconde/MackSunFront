function loadHTML(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = data;
      } else {
        console.error(`Elemento com id "${id}" não encontrado.`);
      }
    })
    .catch(error => {
      console.error(error);
    });
}

loadHTML("header", "/header.html");
loadHTML("footer", "/footer.html");
loadHTML("headersimple", "/headersimple.html")