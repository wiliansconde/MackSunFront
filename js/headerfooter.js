function loadHTML(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then(data => {
      document.getElementById(id).innerHTML = data;
    })
    .catch(error => {
      console.error(error);
    });
}

loadHTML("header", "header.html");
loadHTML("footer", "footer.html");
loadHTML("headersimple", "headersimple.html")