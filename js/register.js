document.addEventListener('DOMContentLoaded', function() {
    
    function showMessage(message, type) {
     
      const existingMessage = document.getElementById('form-message');
      if (existingMessage) {
        existingMessage.remove();
      }
      
      const messageElement = document.createElement('div');
      messageElement.id = 'form-message';
      messageElement.textContent = message;
      messageElement.style.padding = '0px';
      messageElement.style.marginTop = '10px';
      messageElement.style.borderRadius = '4px';
      messageElement.style.textAlign = 'center';
     
      if (type === 'error') {
        messageElement.style.backgroundColor = '#ffebee';
        messageElement.style.color = '#d32f2f';
        messageElement.style.border = '1px solid #f5c6cb';
      } else if (type === 'success') {
        messageElement.style.backgroundColor = '#e8f5e9';
        messageElement.style.color = '#2e7d32';
        messageElement.style.border = '1px solid #c3e6cb';
      }
      
      const form = document.getElementById('registrationForm');
      form.appendChild(messageElement);
      
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  
    document.getElementById('registrationForm').addEventListener('submit', function(event) {
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
      
     //Validações:
      if (!name) {
        showMessage('Please fill in the Name field.', 'error');
        document.getElementById('name').focus();
        return;
      }
      
      if (!email) {
        showMessage('Please fill in the Email field.', 'error');
        document.getElementById('email').focus();
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        document.getElementById('email').focus();
        return;
      }
      
      if (!password) {
        showMessage('Please fill in the Password field.', 'error');
        document.getElementById('password').focus();
        return;
      }
      
      if (password.length < 8) {
        showMessage('Password must be at least 8 characters long.', 'error');
        document.getElementById('password').focus();
        return;
      }
      
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
      if (!passwordRegex.test(password)) {
        showMessage('Password must contain at least one letter and one number.', 'error');
        document.getElementById('password').focus();
        return;
      }
      
      if (!requestedProfile) {
        showMessage('Please select a profile.', 'error');
        return;
      }
      
      if (!justification) {
        showMessage('Please fill in the Justification field.', 'error');
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
      
      showMessage('Processing your request...', 'success');
      
      //Enviar dados para o endpoint:
      fetch(BASE_URL + 'access-requests',{
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
        showMessage('Request sent! Please wait while we review it.', 'success');
        document.getElementById('registrationForm').reset();
      })
      .catch(error => {
        console.error('Error:', error);
        showMessage('Error submitting form. Please try again.', 'error');
      });
    });
  });