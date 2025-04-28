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

<<<<<<< HEAD

loadHTML("header", "./header.html");
loadHTML("footer", "footer.html");
loadHTML("headersimple", "headersimple.html")

document.addEventListener('DOMContentLoaded', () => {
  loadHTML("header", "header.html");
  loadHTML("footer", "footer.html");
  loadHTML("headersimple", "headersimple.html");
});

=======
loadHTML("header", "./header.html");
loadHTML("footer", "footer.html");
loadHTML("headersimple", "headersimple.html")
>>>>>>> 6440d3419513bda6287910f86043d48ff4e33c3d
