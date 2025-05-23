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
    const password = document.getElementById('password').value;
    const justification = document.getElementById('justification').value.trim();

    let requestedProfile = '';
    const profileOptions = document.getElementsByName('requestedProfile');
    for (const option of profileOptions) {
      if (option.checked) {
        requestedProfile = option.value;
        break;
      }
    }

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

    if (!password) {
      showMessageById('error_password');
      document.getElementById('password').focus();
      return;
    }

    if (password.length < 8) {
      showMessageById('error_password_length');
      document.getElementById('password').focus();
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      showMessageById('error_password_format');
      document.getElementById('password').focus();
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
      password: password,
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
          throw new Error('Error sending form');
        }
        return response.json();
      })
      .then(data => {
        showMessageById('success_submission');
        document.getElementById('registrationForm').reset();
      })
      .catch(error => {
        console.error('Error:', error);
        showMessageById('error_submission');
      });
  });
});