export function loadHTML(id, file, callback) {
  fetch(file)
    .then((response) => {
      if (!response.ok) throw new Error(`Erro ao carregar ${file}`);
      return response.text();
    })
    .then((data) => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = data;
        if (callback) callback();
      } else {
        console.warn(`Elemento com id "${id}" não encontrado.`);
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
