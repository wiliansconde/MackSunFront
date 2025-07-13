document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  let requests = [];
  let currentPage = 1;
  const rowsPerPage = 5;

  const tbody = document.getElementById('tbody_requests');
  const pagContainer = document.getElementById('paginacao_container');

  const fetchRequests = async () => {
    try {
      const res = await fetch('https://macksunback.azurewebsites.net/profile-upgrades', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      requests = data.data.filter(r => r.status === 'PENDING') || [];
      renderTable();
      renderPagination();
    } catch (e) {
      console.error(e);
    }
  };

  const renderTable = () => {
    tbody.innerHTML = '';
    const filtered = applyFilters();
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    paginated.forEach(req => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${req.fullName}</td>
        <td>${req.current}</td>
        <td>${req.requestedProfile}</td>
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

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === currentPage ? 'btnGray_table active' : 'btnGray_table';
      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
      };
      pagContainer.appendChild(btn);
    }
  };

  const applyFilters = () => {
    const nome = document.getElementById('filtro_nome').value.toLowerCase();
    const current = document.getElementById('filtro_current').value.toLowerCase();
    const requested = document.getElementById('filtro_requested').value.toLowerCase();

    return requests.filter(req =>
      req.fullName.toLowerCase().includes(nome) &&
      req.currentProfile.toLowerCase().includes(current) &&
      req.requestedProfile.toLowerCase().includes(requested)
    );
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
        <p><strong>Username:</strong> ${request.username}</p>
        <p><strong>Full Name:</strong> ${request.fullName}</p>
        <p><strong>Email:</strong> ${request.email}</p>
        <p><strong>Current Profile:</strong> ${request.currentProfile}</p>
        <p><strong>Requested Profile:</strong> ${request.requestedProfile}</p>
        <p><strong>Justification:</strong> ${request.justification}</p>

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

    const hideMessages = () => {
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
    };

    modal.querySelector('#close-btn').onclick = () => modal.remove();

    modal.querySelector('#approve-btn').onclick = async () => {
      hideMessages();
      try {
        const res = await fetch(`https://macksunback.azurewebsites.net/profile-upgrades/${request.id}/approve`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        successMessage.textContent = 'Solicitação aprovada com sucesso!';
        successMessage.style.display = 'block';
        setTimeout(() => {
          modal.remove();
          location.reload();
        }, 2000);
      } catch {
        errorMessage.textContent = 'Erro ao aprovar a solicitação.';
        errorMessage.style.display = 'block';
      }
    };

    modal.querySelector('#reject-btn').onclick = () => {
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
          successMessage.textContent = 'Solicitação rejeitada com sucesso!';
          successMessage.style.display = 'block';
          setTimeout(() => {
            modal.remove();
            location.reload();
          }, 2000);
        })
        .catch(() => {
          errorMessage.textContent = 'Erro ao rejeitar a solicitação.';
          errorMessage.style.display = 'block';
        });
      }
    };
  };

  document.getElementById('btn_buscar').onclick = () => {
    currentPage = 1;
    renderTable();
    renderPagination();
  };

  document.getElementById('btn_limpar_filtro').onclick = () => {
    document.getElementById('filtro_nome').value = '';
    document.getElementById('filtro_current').value = '';
    document.getElementById('filtro_requested').value = '';
    currentPage = 1;
    renderTable();
    renderPagination();
  };

  fetchRequests();
});
