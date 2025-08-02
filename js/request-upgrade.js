import { loadUserData } from './login.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upgradeForm');
  const emailField = document.getElementById('email');
  const profileField = document.getElementById('currentProfile');

  const userData = loadUserData();
  if (userData) {
    emailField.value = userData.email || '';
    profileField.value = userData.profile?.type || '';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const justification = document.getElementById('justification').value.trim();
    const requestedProfileInput = document.querySelector('input[name="requestedProfile"]:checked');
    const requestedProfile = requestedProfileInput ? requestedProfileInput.value : '';
    const email = emailField.value;

    document.querySelectorAll('.invalid_message_error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.valid_message_error').forEach(el => el.style.display = 'none');

    let hasError = false;

    if (!email || !justification || !requestedProfile) {
      document.getElementById('error_all_fields').style.display = 'block';
      hasError = true;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      document.getElementById('error_email_format').style.display = 'block';
      hasError = true;
    }

    if (hasError) return;

    document.getElementById('success_processing').style.display = 'block';

    const requestData = {
      userEmail: email,
      requestedProfile: requestedProfile,
      justification: justification
    };

    const token = localStorage.getItem('token');
    const BASE_URL = "https://macksunback.azurewebsites.net/";

    fetch(`${BASE_URL}/profile-upgrades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    })
      .then(response => {
        document.getElementById('success_processing').style.display = 'none';

        if (response.ok) {
          document.getElementById('success_submission').style.display = 'block';
          form.reset();
          setTimeout(() => {
            window.location.href = '/index.html';
          }, 2000);
        } else {
          document.getElementById('error_submission').style.display = 'block';
          return response.json().then(err => {
            console.error('Erro na API:', err);
          });
        }
      })
      .catch(error => {
        document.getElementById('success_processing').style.display = 'none';
        document.getElementById('error_submission').style.display = 'block';
        console.error('Erro na requisição:', error);
      });
  });
});