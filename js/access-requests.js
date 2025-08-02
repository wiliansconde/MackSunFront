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
      const query = buildQuery();
      const res = await fetch(`https://macksunback.azurewebsites.net/access-requests${query}`, {
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

  const buildQuery = () => {
    const name = document.getElementById('filtro_nome').value.trim();
    const email = document.getElementById('filtro_email')?.value.trim();
    const status = document.getElementById('filtro_status')?.value;
    const params = new URLSearchParams();

    if (name) params.append('name', name);
    if (email) params.append('email', email);
    if (status) params.append('status', status);

    return `?${params.toString()}`;
  };

  const applyFrontendFilters = (list) => {
    const requested = document.getElementById('filtro_requested').value;
    if (requested) {
      return list.filter(req => req.requestedProfile === requested);
    }
    return list;
  };

  const renderTable = () => {
    tbody.innerHTML = '';
    const filtered = applyFrontendFilters(requests);
    const start = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);

    paginated.forEach(req => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="tdname">${req.name}</td>
        <td>${req.email}</td>
        <td>${req.requestedProfile}</td>
        <td class="status-cell status-${req.status.toLowerCase()}">${req.status}</td>
        <td><button class="btnGray btnSizeHeightLimited learn-more-btn" data-id="${req.id}">Learn More</button></td>
      `;
      tbody.appendChild(row);
    });

    addLearnMoreListeners();
  };

  const renderPagination = () => {
    const filtered = applyFrontendFilters(requests);
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    pagContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const createButton = (text, page, isActive = false, isDisabled = false) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      if (isActive) btn.classList.add('active');
      if (isDisabled) {
        btn.disabled = true;
        btn.classList.add('disabled');
      } else {
        btn.onclick = () => {
          currentPage = page;
          renderTable();
          renderPagination();
        };
      }
      return btn;
    };

    pagContainer.appendChild(createButton('Previous', currentPage - 1, false, currentPage === 1));

    const addEllipsis = () => {
      const span = document.createElement('span');
      span.textContent = '...';
      span.classList.add('reticencias');
      pagContainer.appendChild(span);
    };

    const showRange = (start, end) => {
      for (let i = start; i <= end; i++) {
        pagContainer.appendChild(createButton(i, i, i === currentPage));
      }
    };

    const showStart = () => {
      pagContainer.appendChild(createButton(1, 1, currentPage === 1));
    };

    const showEnd = () => {
      pagContainer.appendChild(createButton(totalPages, totalPages, currentPage === totalPages));
    };

    if (totalPages <= 7) {
      showRange(1, totalPages);
    } else {
      if (currentPage <= 4) {
        showRange(1, 5);
        addEllipsis();
        showEnd();
      } else if (currentPage >= totalPages - 3) {
        showStart();
        addEllipsis();
        showRange(totalPages - 4, totalPages);
      } else {
        showStart();
        addEllipsis();
        showRange(currentPage - 1, currentPage + 1);
        addEllipsis();
        showEnd();
      }
    }

    pagContainer.appendChild(createButton('Next', currentPage + 1, false, currentPage === totalPages));
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
        <h2 class="titulo_padrao">Access Request Details</h2>
        <p class="tdname"><strong>Name:</strong> ${request.name}</p>
        <p><strong>Email:</strong> ${request.email}</p>
        <p><strong>Requested Profile:</strong> ${request.requestedProfile}</p>
        <p><strong>Status:</strong> ${request.status}</p>
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

    if (request.status !== 'PENDING') {
      modal.querySelector('#approve-btn').style.display = 'none';
      modal.querySelector('#reject-btn').style.display = 'none';
      modal.querySelector('#close-btn').classList.add('btnPositionRight');
    } else {
      modal.querySelector('#close-btn').classList.remove('btnPositionRight');
    }

    modal.querySelector('#approve-btn').onclick = async () => {
      hideMessages();
      try {
        const res = await fetch(`https://macksunback.azurewebsites.net/access-requests/${request.id}/approve`, {
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

        fetch(`https://macksunback.azurewebsites.net/access-requests/${request.id}/reject`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ comment })
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
    document.getElementById('filtro_requested').value = '';
    document.getElementById('filtro_status').value = '';
    currentPage = 1;
    fetchRequests();
  };

  fetchRequests();
});
