document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  let requests = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  const tbody = document.getElementById('tbody_requests');
  const pagContainer = document.getElementById('paginacao_container');

  const fetchRequests = async () => {
    try {
      const status = document.getElementById('filtro_status').value;
      let url = 'https://macksunback.azurewebsites.net/profile-upgrades';
      if (status) url += `?status=${encodeURIComponent(status)}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      requests = data.data || [];
      renderTable();
      renderPagination();
    } catch (e) {
      console.error(e);
    }
  };

  const applyFilters = () => {
    const nome = document.getElementById('filtro_nome').value.toLowerCase();
    const current = document.getElementById('filtro_current').value;
    const requested = document.getElementById('filtro_requested').value;

    return requests.filter(req =>
      req.fullName.toLowerCase().includes(nome) &&
      (current === '' || req.currentProfile === current) &&
      (requested === '' || req.requestedProfile === requested)
    );
  };

  const renderTable = () => {
    tbody.innerHTML = '';
    const filtered = applyFilters();
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    if (filtered.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5">
          No results found for the selected filters.
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    paginated.forEach(req => {
      const row = document.createElement('tr');

      let statusClass = 'status-cell ';
      if (req.status === 'APPROVED') statusClass += 'status-approved';
      else if (req.status === 'REJECTED') statusClass += 'status-rejected';
      else statusClass += 'status-pending';

      row.innerHTML = `
        <td class="tdname">${req.fullName}</td>
        <td>${req.currentProfile}</td>
        <td>${req.requestedProfile}</td>
        <td class="${statusClass}">${req.status}</td>
        <td><button class="btnGray btnSizeHeightLimited learn-more-btn" data-id="${req.id}">Learn More</button></td>
      `;
      tbody.appendChild(row);
    });

    addLearnMoreListeners();
  };

  const renderPagination = () => {
    const filtered = applyFilters();
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    pagContainer.innerHTML = '';

    if (filtered.length === 0 || totalPages <= 1) return;

    const criarBotao = (texto, pagina, isActive = false, isDisabled = false) => {
      const btn = document.createElement('button');
      btn.textContent = texto;
      if (isActive) btn.classList.add('active');
      if (isDisabled) {
        btn.disabled = true;
        btn.classList.add('disabled');
      } else {
        btn.onclick = () => {
          currentPage = pagina;
          renderTable();
          renderPagination();
        };
      }
      return btn;
    };

    pagContainer.appendChild(criarBotao('Previous', currentPage - 1, false, currentPage === 1));

    const adicionarReticencias = () => {
      const span = document.createElement('span');
      span.textContent = '...';
      span.classList.add('reticencias');
      pagContainer.appendChild(span);
    };

    const mostrarIntervalo = (start, end) => {
      for (let i = start; i <= end; i++) {
        pagContainer.appendChild(criarBotao(i, i, i === currentPage));
      }
    };

    const mostrarInicio = () => {
      pagContainer.appendChild(criarBotao(1, 1, currentPage === 1));
    };

    const mostrarFim = () => {
      pagContainer.appendChild(criarBotao(totalPages, totalPages, currentPage === totalPages));
    };

    if (totalPages <= 7) {
      mostrarIntervalo(1, totalPages);
    } else {
      if (currentPage <= 4) {
        mostrarIntervalo(1, 5);
        adicionarReticencias();
        mostrarFim();
      } else if (currentPage >= totalPages - 3) {
        mostrarInicio();
        adicionarReticencias();
        mostrarIntervalo(totalPages - 4, totalPages);
      } else {
        mostrarInicio();
        adicionarReticencias();
        mostrarIntervalo(currentPage - 1, currentPage + 1);
        adicionarReticencias();
        mostrarFim();
      }
    }

    pagContainer.appendChild(criarBotao('Next', currentPage + 1, false, currentPage === totalPages));
  };

  const addLearnMoreListeners = () => {
    document.querySelectorAll('.learn-more-btn').forEach(button => {
      button.onclick = () => {
        const reqId = button.dataset.id;
        const req = requests.find(r => r.id === reqId);
        if (req) showModal(req);
      };
    });
  };

  const showModal = (request) => {
    const existing = document.getElementById('modal-overlay');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2 class="titulo_padrao">Request Details</h2>
        <p class="tdname"><strong>Username:</strong> ${request.username}</p>
        <p class="tdname"><strong>Full Name:</strong> ${request.fullName}</p>
        <p><strong>Email:</strong> ${request.email}</p>
        <p><strong>Current Profile:</strong> ${request.currentProfile}</p>
        <p><strong>Requested Profile:</strong> ${request.requestedProfile}</p>
        <p><strong>Justification:</strong> ${request.justification}</p>
        <p><strong>Status:</strong> ${request.status}</p>

        <textarea class="justificationLabel" id="reject-comment" placeholder="Rejection justification..." style="display:none;"></textarea>

        <div class="valid_message_error" id="success-message" style="display:none;"></div>
        <div class="invalid_message_error" id="error-message" style="display:none;"></div>

        <div class="modal-actions">
          <button id="approve-btn" class="btnGreen">Approve</button>
          <button id="reject-btn" class="btnRed">Reject</button>
          <button id="close-btn" class="btnGray">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const successMessage = modal.querySelector('#success-message');
    const errorMessage = modal.querySelector('#error-message');
    const rejectTextarea = modal.querySelector('#reject-comment');
    const approveBtn = modal.querySelector('#approve-btn');
    const rejectBtn = modal.querySelector('#reject-btn');
    const closeBtn = modal.querySelector('#close-btn');

    const hideMessages = () => {
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
    };

    if (request.status !== 'PENDING') {
      approveBtn.style.display = 'none';
      rejectBtn.style.display = 'none';
      closeBtn.classList.add('btnPositionRight');
    } else {
      closeBtn.classList.remove('btnPositionRight');
    }

    closeBtn.onclick = () => modal.remove();

    approveBtn.onclick = async () => {
      hideMessages();
      try {
        const res = await fetch(`https://macksunback.azurewebsites.net/profile-upgrades/${request.id}/approve`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        successMessage.textContent = 'Request approved successfully!';
        successMessage.style.display = 'block';
        setTimeout(() => {
          modal.remove();
          fetchRequests();
        }, 2000);
      } catch {
        errorMessage.textContent = 'Failed to approve the request.';
        errorMessage.style.display = 'block';
      }
    };

    rejectBtn.onclick = () => {
      hideMessages();
      if (rejectTextarea.style.display === 'none') {
        rejectTextarea.style.display = 'block';
      } else {
        const comment = rejectTextarea.value.trim();
        if (!comment) {
          errorMessage.textContent = 'You must provide a justification to reject.';
          errorMessage.style.display = 'block';
          return;
        }

        fetch(`https://macksunback.azurewebsites.net/profile-upgrades/${request.id}/reject?comment=${encodeURIComponent(comment)}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
          if (!res.ok) throw new Error();
          successMessage.textContent = 'Request rejected successfully!';
          successMessage.style.display = 'block';
          setTimeout(() => {
            modal.remove();
            fetchRequests();
          }, 2000);
        })
        .catch(() => {
          errorMessage.textContent = 'Failed to reject the request.';
          errorMessage.style.display = 'block';
        });
      }
    };
  };

  document.getElementById('btn_buscar').onclick = () => {
    currentPage = 1;
    fetchRequests();
  };

  document.getElementById('btn_limpar_filtro').onclick = () => {
    document.getElementById('filtro_nome').value = '';
    document.getElementById('filtro_current').value = '';
    document.getElementById('filtro_requested').value = '';
    document.getElementById('filtro_status').value = '';
    currentPage = 1;
    fetchRequests();
  };

  fetchRequests();
});