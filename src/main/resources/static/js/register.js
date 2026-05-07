lucide.createIcons();

const form = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const termsCheckbox = document.getElementById('terms');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const togglePassword = document.getElementById('togglePassword');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');

const showPassword = () => {
    passwordInput.type = 'text';
    confirmInput.type = 'text';
    togglePassword.innerHTML = '<i data-lucide="eye-off"></i>';
    lucide.createIcons();
};

const hidePassword = () => {
    passwordInput.type = 'password';
    confirmInput.type = 'password';
    togglePassword.innerHTML = '<i data-lucide="eye"></i>';
    lucide.createIcons();
};

togglePassword.addEventListener('pointerdown', showPassword);
togglePassword.addEventListener('pointerup', hidePassword);
togglePassword.addEventListener('pointerleave', hidePassword);

const checkFormStatus = () => {
    const emailValue = emailInput.value.trim();
    const nameValue = nameInput.value.trim();
    const passValue = passwordInput.value;
    const confirmValue = confirmInput.value;

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    const isNameValid = nameValue.length > 2;
    const isPassValid = passValue.length >= 8;
    const isMatch = passValue === confirmValue && confirmValue !== "";
    const isTermsAccepted = termsCheckbox.checked;

    // Toggle error layout for main password
    if (passValue.length > 0) {
        passwordInput.classList.toggle('invalid', !isPassValid);
    } else {
        passwordInput.classList.remove('invalid');
    }

    // Toggle error layout for confirm password
    if (confirmValue !== "") {
        confirmInput.classList.toggle('mismatch', !isMatch);
    } else {
        confirmInput.classList.remove('mismatch');
    }

    const isValid = isEmailValid && isNameValid && isPassValid && isMatch && isTermsAccepted;

    if (isValid) {
        submitBtn.classList.add('active');
        submitBtn.disabled = false;
    } else {
        submitBtn.classList.remove('active');
        submitBtn.disabled = true;
    }
};

form.addEventListener('input', checkFormStatus);
termsCheckbox.addEventListener('change', checkFormStatus);

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const request = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  if (request.password !== document.getElementById('confirmPassword').value) {
    alert("Passwords do not match");
    return;
  }

  submitBtn.disabled = true;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        showError(err.message || "Registration failed. Try again.");
        return;
    }

    const data = await response.json();

    alert("Account created successfully!");

    window.location.href = "/login";

  } catch (err) {
    console.error(err);
    alert("Error during registration");
  } finally {
    submitBtn.disabled = false;
  }
});