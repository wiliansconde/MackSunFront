document.addEventListener('DOMContentLoaded', function () {

  function hideAllMessages() {
    const messages = document.querySelectorAll('.valid_message_error, .invalid_message_error');
    messages.forEach(msg => msg.style.display = 'none');
  }

  function showMessageById(id) {
    hideAllMessages();
    const messageEl = document.getElementById(id);
    if (messageEl) {
      messageEl.style.display = 'block';
      messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const justification = document.getElementById('justification').value.trim();

    let requestedProfile = '';
    const profileOptions = document.getElementsByName('requestedProfile');
    for (const option of profileOptions) {
      if (option.checked) {
        requestedProfile = option.value;
        break;
      }
    }

    // Validações do lado cliente
    if (!name) {
      showMessageById('error_name');
      document.getElementById('name').focus();
      return;
    }

    if (!email) {
      showMessageById('error_email');
      document.getElementById('email').focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessageById('error_email_format');
      document.getElementById('email').focus();
      return;
    }

    if (!requestedProfile) {
      showMessageById('error_profile');
      return;
    }

    if (!justification) {
      showMessageById('error_justification');
      document.getElementById('justification').focus();
      return;
    }

    const formData = {
      name: name,
      email: email,
      password: "SenhaExemplo@123",
      requestedProfile: requestedProfile,
      justification: justification
    };

    showMessageById('success_processing');

    fetch(BASE_URL + 'access-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => {
        if (!response.ok) {
          // Captura o erro específico do servidor
          return response.json().then(errorData => {
            throw new Error(errorData.message || 'Error sending form');
          });
        }
        return response.json();
      })
      .then(data => {
        showMessageById('success_submission');
        document.getElementById('registrationForm').reset();
      })
      .catch(error => {
        console.error('Error:', error);
        
        // Verifica se o erro é de email duplicado
        if (error.message && (
            error.message.includes('email já cadastrado') || 
            error.message.includes('email already exists') ||
            error.message.includes('duplicate email') ||
            error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('exists')
          )) {
          showMessageById('error_email_exists');
          document.getElementById('email').focus();
        } else {
          showMessageById('error_submission');
        }
      });
  });
});