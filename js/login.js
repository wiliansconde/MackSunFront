document.querySelector('#loginButton').addEventListener('click', async () => {
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#senha').value.trim();
  
    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }
  
    try {
      const response = await fetch('https://macksunback.azurewebsites.net/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: email, password })
      });
  
      const result = await response.json();
  
      if (result.success) {
        localStorage.setItem('token', result.data.token);
        window.location.href = 'home.html';
      } else {
        alert(result.message || 'Login denied.');
      }
  
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong. Please try again later.');
    }
  });  