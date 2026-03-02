// auth.js - Interactive login & signup logic

document.addEventListener('DOMContentLoaded', () => {

    // 1. Show/Hide Password Toggle Factory
    function setupPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggle && input) {
            toggle.addEventListener('click', () => {
                const icon = toggle.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }

    // Attach togglers
    setupPasswordToggle('toggle-pwd', 'password');
    setupPasswordToggle('toggle-confirm-pwd', 'confirm-password');

    // 2. Form Submission with Error Simulation & Animation (LOGIN)
    const loginForm = document.getElementById('centered-login-form');
    if (loginForm) {
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
        const errorToast = document.getElementById('auth-error-msg');

        const emailInputWrap = document.querySelector('#email').parentElement;
        const pwdInputWrap = document.querySelector('#password').parentElement;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (errorToast) errorToast.style.display = 'none';
            emailInputWrap.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            pwdInputWrap.style.borderColor = 'rgba(255, 255, 255, 0.1)';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            submitBtn.classList.add('loading');
            btnText.textContent = 'Authenticating';

            fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error((await res.json()).error || 'Login failed');
                }
                submitBtn.classList.remove('loading');
                submitBtn.classList.add('success');
                submitBtn.innerHTML = '<span class="btn-text">Success!</span> <i class="fas fa-check btn-icon" style="display:inline-block;"></i>';
                setTimeout(() => { window.location.href = '/app'; }, 600);
            }).catch(err => {
                submitBtn.classList.remove('loading');
                btnText.textContent = 'Sign In';
                if (errorToast) {
                    document.getElementById('error-text').textContent = err.message;
                    errorToast.style.display = 'flex';
                    errorToast.style.animation = 'none';
                    errorToast.offsetHeight;
                    errorToast.style.animation = null;
                    emailInputWrap.style.borderColor = '#EF4444';
                    pwdInputWrap.style.borderColor = '#EF4444';
                }
            });
        });
    }

    // 3. Password Strength Indicator (SIGNUP)
    const pwdInput = document.getElementById('password');
    const meterContainer = document.querySelector('.pwd-strength-meter');
    const strengthText = document.getElementById('strength-text');

    if (pwdInput && meterContainer && strengthText) {
        pwdInput.addEventListener('input', () => {
            const val = pwdInput.value;
            let strength = 0;

            if (val.length >= 8) strength += 1;
            if (val.match(/[A-Z]/)) strength += 1;
            if (val.match(/[0-9]/)) strength += 1;
            if (val.match(/[^A-Za-z0-9]/)) strength += 1;

            if (val.length === 0) strength = 0; // reset

            // Update DOM classes
            meterContainer.className = `pwd-strength-meter strength-${strength}`;
            strengthText.className = `strength-text strength-color-${strength}`;

            switch (strength) {
                case 0: strengthText.textContent = 'Weak'; break;
                case 1: strengthText.textContent = 'Weak'; break;
                case 2: strengthText.textContent = 'Fair'; break;
                case 3: strengthText.textContent = 'Good'; break;
                case 4: strengthText.textContent = 'Strong'; break;
            }
        });
    }

    // 4. Form Submission with Matching Validation (SIGNUP)
    const signupForm = document.getElementById('centered-signup-form');
    if (signupForm) {
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
        const errorToast = document.getElementById('auth-error-msg');
        const errorText = document.getElementById('error-text');

        const pwdWrap = document.querySelector('#password').parentElement;
        const confirmWrap = document.querySelector('#confirm-password').parentElement;

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (errorToast) errorToast.style.display = 'none';
            pwdWrap.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            confirmWrap.style.borderColor = 'rgba(255, 255, 255, 0.1)';

            const pwd1 = document.getElementById('password').value;
            const pwd2 = document.getElementById('confirm-password').value;
            const termsBox = document.getElementById('terms-agree');
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            if (pwd1 !== pwd2) {
                errorText.textContent = "Passwords do not match.";
                if (errorToast) {
                    errorToast.style.display = 'flex';
                    errorToast.style.animation = 'none';
                    errorToast.offsetHeight;
                    errorToast.style.animation = null;
                }
                pwdWrap.style.borderColor = '#EF4444';
                confirmWrap.style.borderColor = '#EF4444';
                return;
            }

            if (!termsBox.checked) {
                // Should be caught by HTML5 'required' but serving as fallback
                return;
            }

            // Begin Success Animation
            submitBtn.classList.add('loading');
            btnText.textContent = 'Creating Account';

            fetch('/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name, email, password: pwd1 })
            }).then(async (res) => {
                if (!res.ok) {
                    throw new Error((await res.json()).error || 'Signup failed');
                }
                submitBtn.classList.remove('loading');
                submitBtn.classList.add('success');
                submitBtn.innerHTML = '<span class=\"btn-text\">Account Created!</span> <i class=\"fas fa-check btn-icon\" style=\"display:inline-block;\"></i>';
                setTimeout(() => { window.location.href = '/app'; }, 600);
            }).catch(err => {
                submitBtn.classList.remove('loading');
                btnText.textContent = 'Sign Up';
                if (errorToast) {
                    errorText.textContent = err.message;
                    errorToast.style.display = 'flex';
                    errorToast.style.animation = 'none';
                    errorToast.offsetHeight;
                    errorToast.style.animation = null;
                }
            });
        });
    }

});
