(function () {

  function setMessage(elementId, message, isError) {
    var el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.style.color = isError ? '#e03b3b' : '#1f7fd6';
  }

  // ✅ Registration
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

  // ✅ Login
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setMessage('loginMessage', 'Signed in (demo mode).', false);
    });
  }

})();


// ✅ Forgot Password logic (FIXED)
document.addEventListener("DOMContentLoaded", function () {

  const forgotLink = document.getElementById("forgotLink");

  // ✅ check if element exists (important fix)
  if (forgotLink) {

    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();

      const emailInput = document.getElementById("loginEmail");
      const email = emailInput ? emailInput.value.trim() : "";

      const msg = document.getElementById("loginMessage"); // ✅ fixed id

      if (!email) {
        msg.style.color = "red";
        msg.textContent = "Please enter your email first ❗";
        return;
      }

      // ✅ success message
      msg.style.color = "green";
      msg.textContent = "Redirecting to reset page...";

      // ✅ Angular route navigation (IMPORTANT)
      setTimeout(() => {
        window.location.href = "/forgot-password";
      }, 1000);
    });

  }

});