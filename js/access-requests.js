document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('Token não encontrado no localStorage.');
    return;
  }

  const tableBody = document.querySelector('.access-table tbody');

  try {
    const response = await fetch('https://macksunback.azurewebsites.net/profile-upgrades', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const result = await response.json();
    const pendingRequests = result.data.filter(req => req.status === 'PENDING');

    pendingRequests.forEach(req => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${req.fullName}</td>
        <td>${req.currentProfile}</td>
        <td>${req.requestedProfile}</td>
        <td><button class="btnGray btnSizeHeightLimited learn-more-btn" data-id="${req.id}">Learn More</button></td>
      `;
      tableBody.appendChild(row);
    });

    addLearnMoreListeners(pendingRequests);

  } catch (error) {
    console.error('Erro ao buscar solicitações de upgrade:', error);
  }

  function addLearnMoreListeners(requests) {
    document.querySelectorAll('.learn-more-btn').forEach(button => {
      button.addEventListener('click', () => {
        const reqId = button.dataset.id;
        const req = requests.find(r => r.id === reqId);
        if (req) showModal(req);
      });
    });
  }

  function showModal(request) {
    // Remove modal anterior, se houver
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

        <textarea id="reject-comment" placeholder="Rejection justification..." style="display:none;"></textarea>

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
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Erro ao aprovar.');
        successMessage.textContent = 'Solicitação aprovada com sucesso!';
        successMessage.style.display = 'block';
        setTimeout(() => {
          modal.remove();
          location.reload();
        }, 2000);
      } catch (err) {
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
          errorMessage.textContent = 'Você deve fornecer uma justificativa para rejeitar.';
          errorMessage.style.display = 'block';
          return;
        }

        fetch(`https://macksunback.azurewebsites.net/profile-upgrades/${request.id}/reject?comment=${encodeURIComponent(comment)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
  }
});