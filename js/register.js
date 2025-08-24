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

  document.getElementById('password').value = '12345678';

  document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const submitBtn = document.querySelector('#registrationForm button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

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
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (!email) {
      showMessageById('error_email');
      document.getElementById('email').focus();
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessageById('error_email_format');
      document.getElementById('email').focus();
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (!requestedProfile) {
      showMessageById('error_profile');
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    if (!justification) {
      showMessageById('error_justification');
      document.getElementById('justification').focus();
      if (submitBtn) submitBtn.disabled = false;
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
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        if (data.success === false) {
          console.log('API returned success: false, throwing error');
          throw new Error(data.message || 'Error sending form');
        }
        showMessageById('success_submission');
        document.getElementById('registrationForm').reset();
        document.getElementById('password').value = '12345678';
      })
      .catch(error => {
        console.error('Caught error:', error);
        console.log('Error message:', error.message);
        
        if (error.message && error.message.includes('email already exists')) {
          console.log('Showing email exists error');
          showMessageById('error_email');
          document.getElementById('email').focus();
        } else {
          console.log('Showing generic error');
          showMessageById('error_submission');
        }
      })
      .finally(() => {
        if (submitBtn) setTimeout(() => { submitBtn.disabled = false; }, 2000);
      });
  });
});