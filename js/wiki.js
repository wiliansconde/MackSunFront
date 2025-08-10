document.addEventListener('DOMContentLoaded', () => {
  const snippetsContainer = document.getElementById('snippets-container');
  const filtroInstrument = document.getElementById('filtro_instrument');
  const filtroFormat = document.getElementById('filtro_format');
  const filtroDescription = document.getElementById('filtro_description');
  const btnBuscar = document.getElementById('btn_buscar');
  const btnLimpar = document.getElementById('btn_limpar_filtro');
  const paginacaoContainer = document.getElementById('paginacao_container');

  let snippetsData = [];
  let dadosFiltrados = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;

  async function fetchSnippets(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `https://macksunback.azurewebsites.net/wiki${query ? `?${query}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar snippets: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      snippetsData = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
      dadosFiltrados = snippetsData;
      paginaAtual = 1;
      renderizarPagina();
    } catch (error) {
      snippetsContainer.innerHTML = `<p class="invalid_message_error">An error occurred while loading the snippets: ${error.message}</p>`;
      paginacaoContainer.innerHTML = '';
    }
  }

  function renderSnippets(data) {
    snippetsContainer.innerHTML = '';
    if (!data.length) {
      snippetsContainer.innerHTML = '<p>No results found for the selected filters.</p>';
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

  function renderizarPagina() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const dadosPagina = dadosFiltrados.slice(inicio, fim);
    renderSnippets(dadosPagina);
    renderizarPaginacao();
  }

  function renderizarPaginacao() {
    paginacaoContainer.innerHTML = '';
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
    if (totalPaginas <= 1) return;
    const criarBotao = (texto, pagina, isActive = false, isDisabled = false) => {
      const btn = document.createElement('button');
      btn.textContent = texto;
      if (isActive) btn.classList.add('active');
      if (isDisabled) {
        btn.disabled = true;
        btn.classList.add('disabled');
      } else {
        btn.addEventListener('click', () => {
          paginaAtual = pagina;
          renderizarPagina();
        });
      }
      return btn;
    };
    paginacaoContainer.appendChild(criarBotao('Previous', paginaAtual - 1, false, paginaAtual === 1));
    const adicionarReticencias = () => {
      const span = document.createElement('span');
      span.textContent = '...';
      span.classList.add('reticencias');
      paginacaoContainer.appendChild(span);
    };
    const mostrarIntervalo = (start, end) => {
      for (let i = start; i <= end; i++) {
        paginacaoContainer.appendChild(criarBotao(i, i, i === paginaAtual));
      }
    };
    const mostrarInicio = () => {
      paginacaoContainer.appendChild(criarBotao(1, 1, paginaAtual === 1));
    };
    const mostrarFim = () => {
      paginacaoContainer.appendChild(criarBotao(totalPaginas, totalPaginas, paginaAtual === totalPaginas));
    };
    if (totalPaginas <= 7) {
      mostrarIntervalo(1, totalPaginas);
    } else {
      if (paginaAtual <= 4) {
        mostrarIntervalo(1, 5);
        adicionarReticencias();
        mostrarFim();
      } else if (paginaAtual >= totalPaginas - 3) {
        mostrarInicio();
        adicionarReticencias();
        mostrarIntervalo(totalPaginas - 4, totalPaginas);
      } else {
        mostrarInicio();
        adicionarReticencias();
        mostrarIntervalo(paginaAtual - 1, paginaAtual + 1);
        adicionarReticencias();
        mostrarFim();
      }
    }
    paginacaoContainer.appendChild(criarBotao('Next', paginaAtual + 1, false, paginaAtual === totalPaginas));
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