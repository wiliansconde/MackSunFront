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
  const inputFilterFormat = document.getElementById('filtro_format');
  const inputFilterAuthor = document.getElementById('filtro_author');
  const inputFilterDescription = document.getElementById('filtro_description');
  const toggleFiltroTelescopios = document.getElementById('btn-toggle-telescopios');
  const contentFiltroTelescopios = document.getElementById('lista-telescopios');
  const toggleAddTelescopios = document.getElementById('dropdownToggleTelescopios');
  const contentAddTelescopios = document.getElementById('dropdownContentTelescopiosNovo');
  const toggleEditTelescopios = document.getElementById('dropdownAlternarTelescopiosEditar');
  const contentEditTelescopios = document.getElementById('dropdownContentTelescopiosEditar');
  const mensagemSucesso = document.getElementById('mensagem_sucesso');
  const mensagemErro = document.getElementById('mensagem_erro');
  const mensagemSucessoEditar = document.getElementById('mensagem_sucesso_editar');
  const mensagemErroEditar = document.getElementById('mensagem_erro_editar');
  const mensagemSucessoExcluir = document.getElementById('mensagem_sucesso_excluir');
  const mensagemErroExcluir = document.getElementById('mensagem_erro_excluir');

  let wikiData = [];
  let paginaAtual = 1;
  const itensPorPagina = 10;
  let dadosFiltrados = [];
  let telescopeOptions = [];
  let currentEditId = null;

  function initTelescopeDropdowns() {
    if (toggleFiltroTelescopios && contentFiltroTelescopios) {
      toggleFiltroTelescopios.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(contentFiltroTelescopios, toggleFiltroTelescopios);
      });
    }

    if (toggleAddTelescopios && contentAddTelescopios) {
      toggleAddTelescopios.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(contentAddTelescopios, toggleAddTelescopios);
      });
    }

    if (toggleEditTelescopios && contentEditTelescopios) {
      toggleEditTelescopios.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(contentEditTelescopios, toggleEditTelescopios);
      });
    }

    window.addEventListener('click', (e) => {
      if (contentFiltroTelescopios && !contentFiltroTelescopios.contains(e.target) && 
          toggleFiltroTelescopios && !toggleFiltroTelescopios.contains(e.target)) {
        contentFiltroTelescopios.style.display = 'none';
        toggleFiltroTelescopios.classList.remove('active');
      }
      
      if (contentAddTelescopios && !contentAddTelescopios.contains(e.target) && 
          toggleAddTelescopios && !toggleAddTelescopios.contains(e.target)) {
        contentAddTelescopios.style.display = 'none';
        toggleAddTelescopios.classList.remove('active');
      }
      
      if (contentEditTelescopios && !contentEditTelescopios.contains(e.target) && 
          toggleEditTelescopios && !toggleEditTelescopios.contains(e.target)) {
        contentEditTelescopios.style.display = 'none';
        toggleEditTelescopios.classList.remove('active');
      }
    });
  }

  function toggleDropdown(content, toggle) {
    const isOpen = content.style.display === 'block';
    content.style.display = isOpen ? 'none' : 'block';
    toggle.classList.toggle('active', !isOpen);
  }

  function getSelectedTelescopes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  async function loadTelescopeOptions() {
    try {
      const response = await fetch(`${BASE_URL}instruments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error loading telescopes');
      const result = await response.json();
      if (!result.success) throw new Error('Failed to obtain telescope data');
      
      telescopeOptions = result.data || [];
      populateTelescopeDropdown('lista-telescopios');
      populateTelescopeDropdown('dropdownContentTelescopiosNovo');
      populateTelescopeDropdown('dropdownContentTelescopiosEditar');
    } catch (error) {
      console.error('Error loading telescopes:', error);
      showMessage(mensagemErro, 'Error loading telescope options', false);
    }
  }

  function populateTelescopeDropdown(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    telescopeOptions.forEach(telescope => {
      const label = document.createElement('label');
      label.style.display = 'block';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'telescopes';
      checkbox.value = telescope.name;

      label.appendChild(checkbox);
      label.append(` ${telescope.name}`);
      container.appendChild(label);
    });
  }

  function hideMessages() {
    const messages = [
      mensagemSucesso, mensagemErro, 
      mensagemSucessoEditar, mensagemErroEditar,
      mensagemSucessoExcluir, mensagemErroExcluir
    ];
    messages.forEach(msg => {
      if (msg) {
        msg.classList.add('esconder');
        msg.textContent = '';
      }
    });
  }

  function showMessage(element, message, isSuccess) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('esconder');
    if (isSuccess) {
      element.classList.remove('invalid_message_error');
      element.classList.add('valid_message_error');
    } else {
      element.classList.remove('valid_message_error');
      element.classList.add('invalid_message_error');
    }
  }

  async function fetchWikis(query = '') {
    try {
      const response = await fetch(`https://macksunback.azurewebsites.net/wiki${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch wikis');
      const result = await response.json();
      wikiData = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
      dadosFiltrados = wikiData;
      paginaAtual = 1;
      renderizarPagina();
    } catch (error) {
      console.error('Error fetching wikis:', error);
      showMessage(mensagemErro, 'Error loading wiki data', false);
    }
  }

  function renderTable(data) {
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No results found for the selected filters.</td></tr>`;
      return;
    }
    data.forEach(wiki => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${wiki.instrument}</td>
        <td>${wiki.format}</td>
        <td class="texto-longo" title="${wiki.description}">${wiki.description || ''}</td>
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
    
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginacaoContainer.appendChild(criarBotao(i, i, i === paginaAtual));
      }
    } else {
      if (paginaAtual <= 4) {
        for (let i = 1; i <= 5; i++) {
          paginacaoContainer.appendChild(criarBotao(i, i, i === paginaAtual));
        }
        paginacaoContainer.appendChild(document.createElement('span')).textContent = '...';
        paginacaoContainer.appendChild(criarBotao(totalPaginas, totalPaginas, paginaAtual === totalPaginas));
      } else if (paginaAtual >= totalPaginas - 3) {
        paginacaoContainer.appendChild(criarBotao(1, 1, paginaAtual === 1));
        paginacaoContainer.appendChild(document.createElement('span')).textContent = '...';
        for (let i = totalPaginas - 4; i <= totalPaginas; i++) {
          paginacaoContainer.appendChild(criarBotao(i, i, i === paginaAtual));
        }
      } else {
        paginacaoContainer.appendChild(criarBotao(1, 1, paginaAtual === 1));
        paginacaoContainer.appendChild(document.createElement('span')).textContent = '...';
        for (let i = paginaAtual - 1; i <= paginaAtual + 1; i++) {
          paginacaoContainer.appendChild(criarBotao(i, i, i === paginaAtual));
        }
        paginacaoContainer.appendChild(document.createElement('span')).textContent = '...';
        paginacaoContainer.appendChild(criarBotao(totalPaginas, totalPaginas, paginaAtual === totalPaginas));
      }
    }
    paginacaoContainer.appendChild(criarBotao('Next', paginaAtual + 1, false, paginaAtual === totalPaginas));
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    const selectedTelescopes = getSelectedTelescopes('lista-telescopios');
    const format = inputFilterFormat.value.trim();
    const author = inputFilterAuthor.value.trim();
    const description = inputFilterDescription.value.trim();

    if (selectedTelescopes.length > 0) {
      params.append('instrument', selectedTelescopes.join(','));
    }
    if (format) params.append('format', format);
    if (author) params.append('author', author);
    if (description) params.append('description', description);

    return params.toString() ? `?${params.toString()}` : '';
  }

  function clearFilters() {
    inputFilterFormat.value = '';
    inputFilterAuthor.value = '';
    inputFilterDescription.value = '';
    const checkboxes = document.querySelectorAll('#lista-telescopios input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    fetchWikis();
  }

  function addActionListeners() {
    document.querySelectorAll('.btn-edit').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const wiki = wikiData.find(w => w.id === id);
        if (wiki) {
          currentEditId = id;
          document.getElementById('editar_format').value = wiki.format;
          document.getElementById('editar_description').value = wiki.description;
          document.getElementById('editar_code').value = wiki.code;
          
          const checkboxes = document.querySelectorAll('#dropdownContentTelescopiosEditar input[type="checkbox"]');
          checkboxes.forEach(cb => cb.checked = false);
          
          if (wiki.instrument) {
            const instruments = wiki.instrument.split(',');
            checkboxes.forEach(cb => {
              if (instruments.includes(cb.value)) {
                cb.checked = true;
              }
            });
          }
          
          document.getElementById('modal_editar_wiki').classList.remove('esconder');
          hideMessages();
        }
      });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        document.getElementById('modal_excluir_wiki').classList.remove('esconder');
        hideMessages();
      });
    });
  }

  document.getElementById('form_nova_wiki').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    const submitBtn = document.querySelector('#form_nova_wiki button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const selectedTelescopes = getSelectedTelescopes('dropdownContentTelescopiosNovo');
    const format = document.getElementById('input_format').value.trim();
    const description = document.getElementById('input_description').value.trim();
    const code = document.getElementById('input_code').value.trim();

    if (selectedTelescopes.length === 0 || !format || !description || !code) {
      showMessage(mensagemErro, 'Please fill all required fields', false);
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      const response = await fetch('https://macksunback.azurewebsites.net/wiki', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          instrument: selectedTelescopes.join(','), 
          format, 
          description, 
          code, 
          author: fullName 
        })
      });

      if (response.ok) {
        showMessage(mensagemSucesso, 'Wiki added successfully', true);
        setTimeout(() => {
          document.getElementById('modal_nova_wiki').classList.add('esconder');
          document.getElementById('form_nova_wiki').reset();
          fetchWikis();
        }, 1500);
      } else {
        throw new Error('Failed to add wiki');
      }
    } catch (error) {
      showMessage(mensagemErro, 'Error adding wiki', false);
    } finally {
      setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
    }
  });

  document.getElementById('form_editar_wiki').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    const submitBtn = document.querySelector('#form_editar_wiki button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const selectedTelescopes = getSelectedTelescopes('dropdownContentTelescopiosEditar');
    const format = document.getElementById('editar_format').value.trim();
    const description = document.getElementById('editar_description').value.trim();
    const code = document.getElementById('editar_code').value.trim();

    if (!currentEditId || selectedTelescopes.length === 0 || !format || !description || !code) {
      showMessage(mensagemErroEditar, 'Please fill all required fields', false);
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${currentEditId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          instrument: selectedTelescopes.join(','), 
          format, 
          description, 
          code, 
          author: fullName 
        })
      });

      if (response.ok) {
        showMessage(mensagemSucessoEditar, 'Wiki updated successfully', true);
        setTimeout(() => {
          document.getElementById('modal_editar_wiki').classList.add('esconder');
          fetchWikis();
        }, 1500);
      } else {
        throw new Error('Failed to update wiki');
      }
    } catch (error) {
      showMessage(mensagemErroEditar, 'Error updating wiki', false);
    } finally {
      setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
    }
  });

  document.getElementById('confirmar_exclusao_wiki').addEventListener('click', async () => {
    hideMessages();
    const button = document.querySelector('.btn-delete[data-id]');
    if (!button) return;

    const id = button.dataset.id;
    const confirmBtn = document.getElementById('confirmar_exclusao_wiki');
    if (confirmBtn) confirmBtn.disabled = true;

    try {
      const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showMessage(mensagemSucessoExcluir, 'Wiki deleted successfully', true);
        setTimeout(() => {
          document.getElementById('modal_excluir_wiki').classList.add('esconder');
          fetchWikis();
        }, 1500);
      } else {
        throw new Error('Failed to delete wiki');
      }
    } catch (error) {
      showMessage(mensagemErroExcluir, 'Error deleting wiki', false);
    } finally {
      setTimeout(() => { if (confirmBtn) confirmBtn.disabled = false; }, 2000);
    }
  });

  document.getElementById('cancelar_nova_wiki').addEventListener('click', () => {
    document.getElementById('modal_nova_wiki').classList.add('esconder');
    hideMessages();
  });

  document.getElementById('cancelar_editar_wiki').addEventListener('click', () => {
    document.getElementById('modal_editar_wiki').classList.add('esconder');
    hideMessages();
  });

  document.getElementById('cancelar_exclusao_wiki').addEventListener('click', () => {
    document.getElementById('modal_excluir_wiki').classList.add('esconder');
    hideMessages();
  });

  btnSearch.addEventListener('click', () => {
    const query = buildQueryParams();
    fetchWikis(query);
  });

  btnClearFilters.addEventListener('click', clearFilters);

  btnAddWiki.addEventListener('click', () => {
    document.getElementById('modal_nova_wiki').classList.remove('esconder');
    document.getElementById('form_nova_wiki').reset();
    const checkboxes = document.querySelectorAll('#dropdownContentTelescopiosNovo input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    hideMessages();
  });

  initTelescopeDropdowns();
  await loadTelescopeOptions();
  await fetchWikis();
});