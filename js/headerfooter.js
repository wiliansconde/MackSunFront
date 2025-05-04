console.log("Iniciando headerfooter.js");

function loadHTML(id, file) {
  console.log(`Chamando loadHTML para id="${id}", file="${file}"`);
  fetch(file)
    .then(response => {
      console.log(`Resposta do fetch para ${file}:`, response.status);
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      if (element) {
        console.log(`Elemento encontrado: ${id}`);
        element.innerHTML = data;
      } else {
        console.warn(`Elemento com id "${id}" não encontrado.`);
      }
    })
    .catch(error => {
      console.error("Erro no loadHTML:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM completamente carregado. Chamando loadHTML.");
  if (document.getElementById('header')) {
    loadHTML('header', 'header.html');
  }
  if (document.getElementById('footer')) {
    loadHTML('footer', 'footer.html');
  }
  if (document.getElementById('headersimple')) {
    loadHTML('headersimple.html');
  }
});
