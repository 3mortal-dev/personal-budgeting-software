// Budget - login page

(function () {
    'use strict';

    /* ── DOM refs ── */
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const pwInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const pwError = document.getElementById('passwordError');
    const togglePwBtn = document.getElementById('togglePw');
    const submitBtn = document.getElementById('submitBtn');
    const eyeOpen = togglePwBtn.querySelector('.eye-open');
    const eyeClosed = togglePwBtn.querySelector('.eye-closed');

    /* ── Helpers ── */

    function showError(inputEl, errorEl, message) {
        inputEl.closest('.input-wrap').classList.add('error');
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }

    function clearError(inputEl, errorEl) {
        inputEl.closest('.input-wrap').classList.remove('error');
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }

    function isValidEmail(val) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    }

    /* ── Live validation (on blur) ── */

    emailInput.addEventListener('blur', function () {
        if (!this.value.trim()) {
            showError(this, emailError, 'Email address is required.');
        } else if (!isValidEmail(this.value)) {
            showError(this, emailError, 'Please enter a valid email address.');
        } else {
            clearError(this, emailError);
        }
    });

    emailInput.addEventListener('input', function () {
        if (isValidEmail(this.value)) clearError(this, emailError);
    });

    pwInput.addEventListener('blur', function () {
        if (!this.value) {
            showError(this, pwError, 'Password is required.');
        } else if (this.value.length < 6) {
            showError(this, pwError, 'Password must be at least 6 characters.');
        } else {
            clearError(this, pwError);
        }
    });

    pwInput.addEventListener('input', function () {
        if (this.value.length >= 6) clearError(this, pwError);
    });

    /* ── Toggle password visibility ── */

    togglePwBtn.addEventListener('click', function () {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
        eyeOpen.classList.toggle('hidden', isPassword);
        eyeClosed.classList.toggle('hidden', !isPassword);
    });

    /* ── Form submit ── */

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        let valid = true;

        /* Validate email */
        if (!emailInput.value.trim()) {
            showError(emailInput, emailError, 'Email address is required.');
            valid = false;
        } else if (!isValidEmail(emailInput.value)) {
            showError(emailInput, emailError, 'Please enter a valid email address.');
            valid = false;
        } else {
            clearError(emailInput, emailError);
        }

        /* Validate password */
        if (!pwInput.value) {
            showError(pwInput, pwError, 'Password is required.');
            valid = false;
        } else if (pwInput.value.length < 6) {
            showError(pwInput, pwError, 'Password must be at least 6 characters.');
            valid = false;
        } else {
            clearError(pwInput, pwError);
        }

        if (!valid) return;

        /* Simulate async login */
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: pwInput.value
                })

            });

            // setTimeout(function () {
            //   submitBtn.classList.remove('loading');
            //   submitBtn.disabled = false;

            //   /* ── Replace with real auth logic ── */
            //   alert('Login successful! Redirecting to dashboard…');
            // }, 1800);

            if (response.ok) {
                window.location.href = '/dashboard';

            } else if (response.status === 401 || response.status === 403) {
                showError(emailInput, emailError, 'Invalid email or password.');
                showError(pwInput, pwError, 'Invalid email or password.');

            } else {
                showError(pwInput, pwError, 'Something went wrong. Please try again.');
            }

        } catch (err) {
            console.error(err);
            showError(pwInput, pwError, 'Server error. Please try again.');

        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    /* Slide dots (decorative cycling) */

    const dots = document.querySelectorAll('.dot');
    let current = 0;

    setInterval(function () {
        dots[current].classList.remove('active');
        current = (current + 1) % dots.length;
        dots[current].classList.add('active');
    }, 3000);

})();