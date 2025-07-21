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

  async function fetchWikis() {
    try {
      const response = await fetch('https://macksunback.azurewebsites.net/wiki', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
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
      tbody.innerHTML = `<tr><td colspan="4">No results found.</td></tr>`;
      return;
    }
    data.forEach(wiki => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${wiki.instrument}</td>
        <td>${wiki.format}</td>
        <td>${wiki.author || ''}</td>
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

  let debounceTimeout;
  function applyFilters() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const filterInstrument = inputFilterInstrument.value.toLowerCase();
      const filterFormat = inputFilterFormat.value.toLowerCase();
      const filterAuthor = inputFilterAuthor.value.toLowerCase();
      const filterDescription = inputFilterDescription.value.toLowerCase();
      dadosFiltrados = wikiData.filter(wiki =>
        wiki.instrument.toLowerCase().includes(filterInstrument) &&
        wiki.format.toLowerCase().includes(filterFormat) &&
        (wiki.author?.toLowerCase() || '').includes(filterAuthor) &&
        wiki.description.toLowerCase().includes(filterDescription)
      );
      paginaAtual = 1;
      renderizarPagina();
    }, 300);
  }

  function clearFilters() {
    inputFilterInstrument.value = '';
    inputFilterFormat.value = '';
    inputFilterAuthor.value = '';
    inputFilterDescription.value = '';
    dadosFiltrados = wikiData;
    paginaAtual = 1;
    renderizarPagina();
  }

  function addActionListeners() {
    document.querySelectorAll('.btn-edit').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const wiki = wikiData.find(w => w.id === id);
        if (wiki) openEditModal(wiki);
      });
    });
    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        openDeleteModal(id);
      });
    });
  }

  btnSearch.addEventListener('click', applyFilters);
  inputFilterInstrument.addEventListener('input', applyFilters);
  inputFilterFormat.addEventListener('input', applyFilters);
  inputFilterAuthor.addEventListener('input', applyFilters);
  inputFilterDescription.addEventListener('input', applyFilters);
  btnClearFilters.addEventListener('click', clearFilters);
  btnAddWiki.addEventListener('click', () => {
    document.getElementById('modal_nova_wiki').classList.remove('esconder');
  });

  await fetchWikis();
});
