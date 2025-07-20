  document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));
    const fullName = userData?.fullName || 'Unknown';

    if (!token) {
      console.error('Token not found in localStorage.');
      return;
    }

    const tbody = document.getElementById('tbody_wiki');
    const btnSearch = document.getElementById('btn_buscar');
    const btnClearFilters = document.getElementById('btn_limpar_filtro');
    const btnAddWiki = document.getElementById('btn_adicionar_wiki');

    const inputFilterInstrument = document.getElementById('filtro_instrument');
    const inputFilterFormat = document.getElementById('filtro_format');
    const inputFilterAuthor = document.getElementById('filtro_author');
    const inputFilterDescription = document.getElementById('filtro_description');

    let wikiData = [];

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
        renderTable(wikiData);
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

    let debounceTimeout;
    function applyFilters() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const filterInstrument = inputFilterInstrument.value.toLowerCase();
        const filterFormat = inputFilterFormat.value.toLowerCase();
        const filterAuthor = inputFilterAuthor.value.toLowerCase();
        const filterDescription = inputFilterDescription.value.toLowerCase();

        const filtered = wikiData.filter(wiki =>
          wiki.instrument.toLowerCase().includes(filterInstrument) &&
          wiki.format.toLowerCase().includes(filterFormat) &&
          (wiki.author?.toLowerCase() || '').includes(filterAuthor) &&
          wiki.description.toLowerCase().includes(filterDescription)
        );

        renderTable(filtered);
      }, 300);
    }

    function clearFilters() {
      inputFilterInstrument.value = '';
      inputFilterFormat.value = '';
      inputFilterAuthor.value = '';
      inputFilterDescription.value = '';
      renderTable(wikiData);
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

    function openEditModal(wiki) {
      const modal = document.getElementById('modal_editar_wiki');
      modal.classList.remove('esconder');

      document.getElementById('editar_instrument').value = wiki.instrument;
      document.getElementById('editar_format').value = wiki.format;
      document.getElementById('editar_description').value = wiki.description;
      document.getElementById('editar_code').value = wiki.code;

      document.getElementById('cancelar_editar_wiki').onclick = () => {
        modal.classList.add('esconder');
        document.getElementById('form_editar_wiki').reset();
      };

      const formEdit = document.getElementById('form_editar_wiki');
      formEdit.onsubmit = async (e) => {
        e.preventDefault();

        const instrument = document.getElementById('editar_instrument').value.trim();
        const format = document.getElementById('editar_format').value.trim();
        const description = document.getElementById('editar_description').value.trim();
        const code = document.getElementById('editar_code').value.trim();

        if (!instrument || !format || !description || !code) {
          alert('Fill in all required fields.');
          return;
        }

        try {
          const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${wiki.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ instrument, format, description, code, author: fullName })
          });

          if (!response.ok) throw new Error();

          modal.classList.add('esconder');
          formEdit.reset();
          await fetchWikis();
        } catch (error) {
          console.error('Error editing wiki:', error);
        }
      };
    }

    function openDeleteModal(id) {
      const modal = document.getElementById('modal_excluir_wiki');
      modal.classList.remove('esconder');

      document.getElementById('cancelar_exclusao_wiki').onclick = () => {
        modal.classList.add('esconder');
      };

      document.getElementById('confirmar_exclusao_wiki').onclick = async () => {
        try {
          const response = await fetch(`https://macksunback.azurewebsites.net/wiki/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) throw new Error();

          const msg = document.getElementById('mensagem_sucesso_excluir');
          msg.textContent = 'Successfully deleted.';
          msg.classList.remove('esconder');

          setTimeout(() => {
            msg.classList.add('esconder');
            modal.classList.add('esconder');
            fetchWikis();
          }, 1500);

        } catch {
          const msg = document.getElementById('mensagem_erro_excluir');
          msg.textContent = 'Failed to delete.';
          msg.classList.remove('esconder');
          setTimeout(() => msg.classList.add('esconder'), 3000);
        }
      };
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

    document.getElementById('cancelar_nova_wiki').addEventListener('click', () => {
      document.getElementById('modal_nova_wiki').classList.add('esconder');
      document.getElementById('form_nova_wiki').reset();
    });

    document.getElementById('form_nova_wiki').addEventListener('submit', async (e) => {
      e.preventDefault();

      const instrument = document.getElementById('input_instrument').value.trim();
      const format = document.getElementById('input_format').value.trim();
      const description = document.getElementById('input_description').value.trim();
      const code = document.getElementById('input_code').value.trim();

      if (!instrument || !format || !description || !code) {
        alert('Fill in all required fields.');
        return;
      }

      try {
        const response = await fetch('https://macksunback.azurewebsites.net/wiki', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ instrument, format, description, code, author: fullName })
        });

        if (!response.ok) throw new Error();

        const msg = document.getElementById('mensagem_sucesso');
        msg.classList.remove('esconder');
        document.getElementById('mensagem_erro').classList.add('esconder');

        setTimeout(() => {
          document.getElementById('modal_nova_wiki').classList.add('esconder');
          document.getElementById('form_nova_wiki').reset();
          msg.classList.add('esconder');
          fetchWikis();
        }, 1500);

      } catch {
        const msg = document.getElementById('mensagem_erro');
        msg.classList.remove('esconder');
        document.getElementById('mensagem_sucesso').classList.add('esconder');
        setTimeout(() => msg.classList.add('esconder'), 3000);
      }
    });

    await fetchWikis();
  });
