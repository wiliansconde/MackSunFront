document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('userData'));
  const fullName = userData?.fullName || 'Unknown';

  if (!token) return;

  const tbody = document.getElementById('tbody_wiki');
  const btnSearch = document.getElementById('btn_buscar');
  const btnClearFilters = document.getElementById('btn_limpar_filtro');
  const btnAddWiki = document.getElementById('btn_adicionar_wiki');
  const paginacaoContainer = document.getElementById('paginacao_container');

  const inputFilterInstrument = document.getElementById('filtro_instrument');
  const inputFilterFormat = document.getElementById('filtro_format');
  const inputFilterAuthor = document.getElementById('filtro_author');
  const inputFilterDescription = document.getElementById('filtro_description');

  let wikiData = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;
  let dadosFiltrados = [];

  async function fetchWikis(query = '') {
    try {
      const response = await fetch(`https://macksunback.azurewebsites.net/wiki${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      wikiData = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
      dadosFiltrados = wikiData;
      paginaAtual = 1;
      renderizarPagina();
    } catch (error) {
      console.error('Error fetching wikis:', error);
    }
  }

  function renderTable(data) {
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No results found for the selected filters.</td></tr>`;
      return;
    }
    data.forEach(wiki => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${wiki.instrument}</td>
        <td>${wiki.format}</td>
        <td>${wiki.author || ''}</td>
        <td>${wiki.description || ''}</td>
        <td>
          <button class="btnGray_table btn_gap btn-edit" data-id="${wiki.id}">Edit</button>
          <button class="btnGray_table btn_gap btn-delete" data-id="${wiki.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    addActionListeners();
  }

  function renderizarPagina() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const dadosPagina = dadosFiltrados.slice(inicio, fim);
    renderTable(dadosPagina);
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

  function montarQueryParams() {
    const params = new URLSearchParams();
    const instrument = inputFilterInstrument.value.trim();
    const format = inputFilterFormat.value.trim();
    const author = inputFilterAuthor.value.trim();
    const description = inputFilterDescription.value.trim();
    if (instrument) params.append('instrument', instrument);
    if (format) params.append('format', format);
    if (author) params.append('author', author);
    if (description) params.append('description', description);
    return params.toString() ? `?${params.toString()}` : '';
  }

  
  function clearFilters() {
    inputFilterInstrument.value = '';
    inputFilterFormat.value = '';
    inputFilterAuthor.value = '';
    inputFilterDescription.value = '';
    fetchWikis();
  }

  function addActionListeners() {
    document.querySelectorAll('.btn-edit').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const wiki = wikiData.find(w => w.id === id);
        if (wiki) {
          document.getElementById('editar_instrument').value = wiki.instrument;
          document.getElementById('editar_format').value = wiki.format;
          document.getElementById('editar_description').value = wiki.description;
          document.getElementById('editar_code').value = wiki.code;
          document.getElementById('modal_editar_wiki').classList.remove('esconder');
        }
      });
    });
    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        document.getElementById('modal_excluir_wiki').classList.remove('esconder');
        document.getElementById('confirmar_exclusao_wiki').onclick = async () => {
          try {
            const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              wikiData = wikiData.filter(w => w.id !== id);
              dadosFiltrados = wikiData;
              renderizarPagina();
              document.getElementById('modal_excluir_wiki').classList.add('esconder');
            }
          } catch {}
        };
      });
    });
  }

  document.getElementById('form_nova_wiki').addEventListener('submit', async (e) => {
    e.preventDefault();
    const instrument = document.getElementById('input_instrument').value;
    const format = document.getElementById('input_format').value;
    const description = document.getElementById('input_description').value;
    const code = document.getElementById('input_code').value;
    try {
      const response = await fetch('https://macksunback.azurewebsites.net/wiki', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instrument, format, description, code, author: fullName })
      });
      if (response.ok) {
        document.getElementById('modal_nova_wiki').classList.add('esconder');
        await fetchWikis();
      }
    } catch {}
  });

  document.getElementById('form_editar_wiki').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = wikiData.find(w => w.instrument === document.getElementById('editar_instrument').value)?.id;
    const format = document.getElementById('editar_format').value;
    const description = document.getElementById('editar_description').value;
    const code = document.getElementById('editar_code').value;
    try {
      const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instrument: document.getElementById('editar_instrument').value, format, description, code, author: fullName })
      });
      if (response.ok) {
        document.getElementById('modal_editar_wiki').classList.add('esconder');
        await fetchWikis();
      }
    } catch {}
  });

  document.getElementById('cancelar_nova_wiki').addEventListener('click', () => {
    document.getElementById('modal_nova_wiki').classList.add('esconder');
  });

  document.getElementById('cancelar_editar_wiki').addEventListener('click', () => {
    document.getElementById('modal_editar_wiki').classList.add('esconder');
  });

  document.getElementById('cancelar_exclusao_wiki').addEventListener('click', () => {
    document.getElementById('modal_excluir_wiki').classList.add('esconder');
  });

  btnSearch.addEventListener('click', () => {
    const query = montarQueryParams();
    fetchWikis(query);
  });

  btnClearFilters.addEventListener('click', clearFilters);

  btnAddWiki.addEventListener('click', () => {
    document.getElementById('modal_nova_wiki').classList.remove('esconder');
  });

  await fetchWikis();
});
