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
      }
    })
    .catch(error => {
      console.error("Erro no loadHTML:", error);
    });
}

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