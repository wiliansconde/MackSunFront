document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const snippetsContainer = document.getElementById('snippets-container');
  const filtroInstrument = document.getElementById('filtro_instrument');
  const filtroFormat = document.getElementById('filtro_format');
  const filtroDescription = document.getElementById('filtro_description');
  const btnBuscar = document.getElementById('btn_buscar');
  const btnLimpar = document.getElementById('btn_limpar_filtro');

  if (!token) {
    snippetsContainer.innerHTML = '<p class="invalid_message_error">Faça login para ver os snippets da wiki.</p>';
    return;
  }

  async function fetchSnippets(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `https://macksunback.azurewebsites.net/wiki${query ? `?${query}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar snippets: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      renderSnippets(result.data || []);
    } catch (error) {
      snippetsContainer.innerHTML = `<p class="invalid_message_error">Ocorreu um erro ao carregar os snippets: ${error.message}</p>`;
    }
  }

  function renderSnippets(data) {
    snippetsContainer.innerHTML = '';
    if (!data.length) {
      snippetsContainer.innerHTML = '<p>Nenhum snippet da wiki encontrado.</p>';
      return;
    }

    data.forEach(snippet => {
      const card = document.createElement('div');
      card.classList.add('snippet-card');
      card.innerHTML = `
        <h3>Instrument: ${snippet.instrument}</h3>
        <p><strong>Format:</strong> ${snippet.format}</p>
        <p><strong>Description:</strong> ${snippet.description}</p>
        <pre><code class="language-python">${Prism.highlight(snippet.code, Prism.languages.python, 'python')}</code></pre>
      `;
      snippetsContainer.appendChild(card);
    });
  }

  btnBuscar.addEventListener('click', () => {
    const params = {};
    const instrument = filtroInstrument.value.trim();
    const format = filtroFormat.value.trim();
    const description = filtroDescription.value.trim();
    if (instrument) params.instrument = instrument;
    if (format) params.format = format;
    if (description) params.description = description;
    fetchSnippets(params);
  });

  btnLimpar.addEventListener('click', () => {
    filtroInstrument.value = '';
    filtroFormat.value = '';
    filtroDescription.value = '';
    fetchSnippets();
  });

  fetchSnippets();
});
