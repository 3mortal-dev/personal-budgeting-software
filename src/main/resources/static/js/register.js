(function () {
    'use strict';

    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const termsCheckbox = document.getElementById('terms');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmError = document.getElementById('confirmError');

    const eyeOpen = togglePassword.querySelector('.eye-open');
    const eyeClosed = togglePassword.querySelector('.eye-closed');

    function showError(inputEl, errorEl, message) {
        inputEl.closest('.field-input-wrap').classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }

    function clearError(inputEl, errorEl) {
        inputEl.closest('.field-input-wrap').classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }

    function isValidEmail(val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }

    function checkFormValidity() {
        const nameValue = nameInput.value.trim();
        const emailValue = emailInput.value.trim();
        const passValue = passwordInput.value;
        const confirmValue = confirmInput.value;

        const isNameValid = nameValue.length > 2;
        const isEmailValid = isValidEmail(emailValue);
        const isPassValid = passValue.length >= 8;
        const isMatch = passValue === confirmValue && confirmValue !== '';
        const isTermsAccepted = termsCheckbox.checked;

        return isNameValid && isEmailValid && isPassValid && isMatch && isTermsAccepted;
    }

    // Live validation
    nameInput.addEventListener('input', function () {
        if (this.value.trim() && this.value.trim().length <= 2) {
            showError(this, nameError, 'Name must be at least 3 characters.');
        } else if (this.value.trim()) {
            clearError(this, nameError);
        } else {
            clearError(this, nameError);
        }
        checkFormValidity();
    });

    emailInput.addEventListener('input', function () {
        if (this.value.trim() && !isValidEmail(this.value)) {
            showError(this, emailError, 'Please enter a valid email address.');
        } else if (this.value.trim()) {
            clearError(this, emailError);
        } else {
            clearError(this, emailError);
        }
        checkFormValidity();
    });

    passwordInput.addEventListener('input', function () {
        if (this.value && this.value.length < 8) {
            showError(this, passwordError, 'Password must be at least 8 characters.');
        } else if (this.value) {
            clearError(this, passwordError);
            if (confirmInput.value && passwordInput.value !== confirmInput.value) {
                showError(confirmInput, confirmError, 'Passwords do not match.');
            } else if (confirmInput.value) {
                clearError(confirmInput, confirmError);
            }
        } else {
            clearError(this, passwordError);
        }
        checkFormValidity();
    });

    confirmInput.addEventListener('input', function () {
        if (this.value && passwordInput.value !== this.value) {
            showError(this, confirmError, 'Passwords do not match.');
        } else if (this.value) {
            clearError(this, confirmError);
        } else {
            clearError(this, confirmError);
        }
        checkFormValidity();
    });

    termsCheckbox.addEventListener('change', checkFormValidity);

    // Password toggle
    togglePassword.addEventListener('pointerdown', function () {
        passwordInput.type = 'text';
        confirmInput.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    });

    togglePassword.addEventListener('pointerup', function () {
        passwordInput.type = 'password';
        confirmInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    });

    togglePassword.addEventListener('pointerleave', function () {
        passwordInput.type = 'password';
        confirmInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!checkFormValidity()) return;

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                showError(emailInput, emailError, err.message || 'Registration failed. Try again.');
                return;
            }

            window.location.href = '/login';
        } catch (err) {
            console.error(err);
            showError(passwordInput, passwordError, 'Server error. Please try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
})();