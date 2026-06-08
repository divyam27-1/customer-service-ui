(function () {
  function setMessage(elementId, message, isError) {
    var el = document.getElementById(elementId);
    if (!el) {
      return;
    }

    el.textContent = message;
    el.style.color = isError ? '#e03b3b' : '#1f7fd6';
  }

  var registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    registrationForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var passwordInput = document.getElementById('password');
      var confirmInput = document.getElementById('confirmPassword');
      var password = passwordInput ? passwordInput.value : '';
      var confirmPassword = confirmInput ? confirmInput.value : '';

      if (password !== confirmPassword) {
        setMessage('formMessage', 'Passwords do not match.', true);
        return;
      }

      setMessage('formMessage', 'Account created (demo mode).', false);
      registrationForm.reset();
    });
  }

  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setMessage('loginMessage', 'Signed in (demo mode).', false);
    });
  }
})();
