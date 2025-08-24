document.addEventListener('DOMContentLoaded', () => {
  const snippetsContainer = document.getElementById('snippets-container');
  const filtroInstrument = document.getElementById('filtro_instrument');
  const filtroFormat = document.getElementById('filtro_format');
  const filtroDescription = document.getElementById('filtro_description');
  const btnBuscar = document.getElementById('btn_buscar');
  const btnLimpar = document.getElementById('btn_limpar_filtro');
  const paginacaoContainer = document.getElementById('paginacao_container');
  const toggleFiltroTelescopios = document.getElementById('btn-toggle-telescopios');
  const contentFiltroTelescopios = document.getElementById('lista-telescopios');

  let snippetsData = [];
  let dadosFiltrados = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;
  let telescopeOptions = [];

  function initTelescopeDropdown() {
    if (toggleFiltroTelescopios && contentFiltroTelescopios) {
      toggleFiltroTelescopios.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = contentFiltroTelescopios.style.display === 'block';
        contentFiltroTelescopios.style.display = isOpen ? 'none' : 'block';
        toggleFiltroTelescopios.classList.toggle('active', !isOpen);
      });

      window.addEventListener('click', (e) => {
        if (contentFiltroTelescopios && !contentFiltroTelescopios.contains(e.target) && 
            toggleFiltroTelescopios && !toggleFiltroTelescopios.contains(e.target)) {
          contentFiltroTelescopios.style.display = 'none';
          toggleFiltroTelescopios.classList.remove('active');
        }
      });
    }
  }

  function getSelectedTelescopes() {
    if (!contentFiltroTelescopios) return [];
    const checkboxes = document.querySelectorAll('#lista-telescopios input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  async function loadTelescopeOptions() {
    try {
      const response = await fetch(`${BASE_URL}instruments`);
      if (!response.ok) throw new Error('Error loading telescopes');
      const result = await response.json();
      if (!result.success) throw new Error('Failed to obtain telescope data');
      
      telescopeOptions = result.data || [];
      populateTelescopeDropdown();
    } catch (error) {
      console.error('Error loading telescopes:', error);
    }
  }

  function populateTelescopeDropdown() {
    if (!contentFiltroTelescopios) return;
    contentFiltroTelescopios.innerHTML = '';
    telescopeOptions.forEach(telescope => {
      const label = document.createElement('label');
      label.style.display = 'block';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'telescopes';
      checkbox.value = telescope.name;

      label.appendChild(checkbox);
      label.append(` ${telescope.name}`);
      contentFiltroTelescopios.appendChild(label);
    });
  }

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

      const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;

      card.innerHTML = `
        <h3>Instrument: ${snippet.instrument}</h3>
        <p><strong>Format:</strong> ${snippet.format}</p>
        <p><strong>Description:</strong> ${snippet.description}</p>
        <div class="code-wrapper">
          <button class="copy-btn" data-target="${codeId}">
            <!-- Ícone copiar -->
            <svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
              <g transform="translate(1.4066 1.4066) scale(2.81 2.81)">
                <path d="M70.315 0H34.203c-6.852 0-12.425 5.574-12.425 12.425v2.093h-2.093c-6.852 0-12.425 5.574-12.425 12.425v50.632C7.259 84.426 12.833 90 19.685 90h36.112c6.852 0 12.426-5.574 12.426-12.425v-2.094h2.093c6.852 0 12.426-5.574 12.426-12.425V12.425C82.741 5.574 77.167 0 70.315 0zM64.223 77.575c0 4.646-3.78 8.425-8.426 8.425H19.685c-4.646 0-8.425-3.779-8.425-8.425V26.943c0-4.646 3.78-8.425 8.425-8.425h2.093v44.538c0 6.851 5.574 12.425 12.425 12.425h30.02V77.575zM78.741 63.057c0 4.646-3.78 8.425-8.426 8.425h-2.093h-34.02c-4.646 0-8.425-3.779-8.425-8.425V14.519v-2.093C25.778 7.78 29.558 4 34.203 4h36.112c4.646 0 8.426 3.78 8.426 8.425V63.057z" fill="black"/>
              </g>
            </svg>
            <!-- Ícone copiado -->
            <svg class="icon-done" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" style="display:none;">
              <g transform="translate(1.4066 1.4066) scale(2.81 2.81)">
                <path d="M65.456 81.712c0 4.57-3.717 8.288-8.288 8.288h-40.7c-4.57 0-8.288-3.717-8.288-8.288V24.65c0-4.57 3.718-8.288 8.288-8.288h1.152V65.35c0 8.387 6.823 15.211 15.211 15.211h32.624V81.712zM81.819 65.35c0 4.57-3.717 8.288-8.288 8.288h-1.152H32.832c-4.57 0-8.288-3.717-8.288-8.288V9.439V8.288c0-4.57 3.718-8.288 8.288-8.288h40.699c4.57 0 8.288 3.718 8.288 8.288V65.35z" fill="black"/>
              </g>
            </svg>
          </button>
          <pre><code id="${codeId}" class="language-python">
  ${Prism.highlight(snippet.code, Prism.languages.python, 'python')}
          </code></pre>
        </div>
      `;
      snippetsContainer.appendChild(card);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const codeElement = document.getElementById(targetId);
        if (!codeElement) return;

        navigator.clipboard.writeText(codeElement.textContent).then(() => {
          const copyIcon = btn.querySelector('.icon-copy');
          const doneIcon = btn.querySelector('.icon-done');
          if (copyIcon && doneIcon) {
            copyIcon.style.display = 'none';
            doneIcon.style.display = 'inline';
            setTimeout(() => {
              copyIcon.style.display = 'inline';
              doneIcon.style.display = 'none';
            }, 2000);
          }
        });
      });
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
    const selectedTelescopes = getSelectedTelescopes();
    const format = filtroFormat.value.trim();
    const description = filtroDescription.value.trim();
    
    if (selectedTelescopes.length > 0) {
      params.instrument = selectedTelescopes.join(',');
    }
    if (format) params.format = format;
    if (description) params.description = description;
    
    fetchSnippets(params);
  });

  btnLimpar.addEventListener('click', () => {
    filtroFormat.value = '';
    filtroDescription.value = '';
    if (contentFiltroTelescopios) {
      const checkboxes = document.querySelectorAll('#lista-telescopios input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
    }
    fetchSnippets();
  });

  initTelescopeDropdown();
  loadTelescopeOptions().then(() => fetchSnippets());
});