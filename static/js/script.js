document.addEventListener('DOMContentLoaded', () => {
    // Form switching
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Password visibility toggle
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            console.log('Toggle button clicked');
            const input = button.parentElement.querySelector('input');
            const type = input.getAttribute('type');
            const img = button.querySelector('img');
            
            console.log('Current input type:', type);
            
            if (type === 'password') {
                input.setAttribute('type', 'text');
                img.style.opacity = '1';
            } else {
                input.setAttribute('type', 'password');
                img.style.opacity = '0.6';
            }
        });
    });

    // Get modal elements
    const keywordModal = document.getElementById('keyword-modal');
    const keywordInput = document.getElementById('keyword-input');
    const saveKeywordBtn = document.getElementById('save-keyword');
    
    // Form submission
    const loginFormElement = document.getElementById('login-form-element');
    const registerFormElement = document.getElementById('register-form-element');
    const rememberCheckbox = document.getElementById('remember');
    
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const loginData = {
            username: formData.get('username') || null,
            email: formData.get('email') || null,
            password: formData.get('password')
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store credentials if remember me is checked
                if (rememberCheckbox.checked) {
                    localStorage.setItem('username', loginData.username || loginData.email);
                    localStorage.setItem('password', loginData.password);
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                }
                
                // Switch to chat interface
                authContainer.style.display = 'none';
                chatContainer.style.display = 'block';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('An error occurred during login. Please try again.');
            console.error('Login error:', error);
        }
    });
    
    // Get all elements
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    const passwordRequirements = document.getElementById('password-requirements');
    const passwordIndicator = document.getElementById('password-indicator');
    const confirmPasswordIndicator = document.getElementById('confirm-password-indicator');
    const emailIndicator = document.getElementById('email-indicator');
    const usernameIndicator = document.getElementById('username-indicator');
    const securityModal = document.getElementById('security-setup-modal');

    // Password validation rules
    const passwordValidationRules = {
        length: password => password.length >= 8,
        uppercase: password => /[A-Z]/.test(password),
        lowercase: password => /[a-z]/.test(password),
        number: password => /[0-9]/.test(password),
        special: password => /[!@#$%^&*]/.test(password)
    };

    // Validate password
    function validatePassword() {
        const password = passwordInput.value;
        let isValid = true;
        
        Object.entries(passwordValidationRules).forEach(([type, rule]) => {
            const requirement = document.querySelector(`[data-requirement="${type}"]`);
            const meetsRequirement = rule(password);
            if (requirement) {
                requirement.classList.toggle('valid', meetsRequirement);
                if (!meetsRequirement) isValid = false;
            }
        });

        passwordIndicator.style.display = password && !isValid ? 'block' : 'none';
        return isValid;
    }

    // Validate password match
    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const matchValidation = document.getElementById('password-match-validation');
        const isValid = password === confirmPassword;
        
        if (confirmPassword) {
            confirmPasswordIndicator.style.display = !isValid ? 'block' : 'none';
            matchValidation.style.display = !isValid ? 'block' : 'none';
        }
        
        return isValid;
    }

    // Event listeners for password validation
    passwordInput.addEventListener('input', () => {
        validatePassword();
        if (confirmPasswordInput.value) {
            validatePasswordMatch();
        }
    });

    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    // Register form submission
    document.getElementById('register-form-element').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const isPasswordValid = validatePassword();
        const isPasswordMatch = validatePasswordMatch();
        
        if (!isPasswordValid) {
            passwordRequirements.classList.add('show');
            return;
        }
        
        if (!isPasswordMatch) {
            document.getElementById('password-match-validation').style.display = 'block';
            return;
        }

        // Show security setup modal if validations pass
        securityModal.classList.add('show');
    });

    // Hide validation messages when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.validation-indicator') && 
            !e.target.closest('.password-requirements') && 
            !e.target.closest('.validation-message')) {
            passwordRequirements.classList.remove('show');
            document.querySelectorAll('.validation-message').forEach(msg => {
                msg.style.display = 'none';
            });
        }
    });

    // Show validation messages when clicking indicators
    passwordIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        passwordRequirements.classList.add('show');
        document.querySelectorAll('.validation-message').forEach(msg => {
            msg.style.display = 'none';
        });
    });

    confirmPasswordIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        const matchValidation = document.getElementById('password-match-validation');
        matchValidation.style.display = 'block';
        passwordRequirements.classList.remove('show');
    });

    // Email validation
    document.getElementById('register-email').addEventListener('blur', async function() {
        if (this.value) {
            const isUnique = await checkEmailUniqueness(this.value);
            emailIndicator.style.display = !isUnique ? 'block' : 'none';
            this.setCustomValidity(!isUnique ? 'Email already exists' : '');
        }
    });

    // Username validation
    document.getElementById('register-username').addEventListener('blur', async function() {
        if (this.value) {
            const isUnique = await checkUsernameUniqueness(this.value);
            usernameIndicator.style.display = !isUnique ? 'block' : 'none';
            this.setCustomValidity(!isUnique ? 'Username already exists' : '');
        }
    });

    // Get modal elements
    const saveSecurityBtn = document.getElementById('save-security');
    const cancelSecurityBtn = document.getElementById('cancel-security');
    const securityQuestion = document.getElementById('security-question');
    const secretWord = document.getElementById('secret-word');

    // Email and username uniqueness check functions
    async function checkEmailUniqueness(email) {
        try {
            const response = await fetch('/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            // If response is ok (200), it means email exists (not unique)
            return !response.ok;
        } catch (error) {
            console.error('Email check error:', error);
            return true; // Allow registration to proceed if check fails
        }
    }

    async function checkUsernameUniqueness(username) {
        try {
            const response = await fetch('/check-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
            // If response is ok (200), it means username exists (not unique)
            return !response.ok;
        } catch (error) {
            console.error('Username check error:', error);
            return true; // Allow registration to proceed if check fails
        }
    }

    // Handle security setup save
    if (saveSecurityBtn) {
        console.log('Save security button found');
        saveSecurityBtn.addEventListener('click', async () => {
            console.log('Save button clicked');
            const question = securityQuestion.value.trim();
            const secret = secretWord.value.trim();
            
            console.log('Security question:', question);
            console.log('Secret word:', secret);
            
            if (!question || !secret) {
                alert('Сураныч, бардык талааларды толтуруңуз');
                return;
            }

            // Get form data
            const formElement = document.getElementById('register-form-element');
            if (!formElement) {
                console.error('Register form element not found');
                alert('Форма табылган жок');
                return;
            }

            const formData = new FormData(formElement);
            
            // Log all form data
            console.log('Form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            try {
                const registerData = {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    security_question: question,
                    secret_word: secret
                };

                console.log('Sending registration data:', {
                    ...registerData,
                    password: '[HIDDEN]'
                });

                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries(response.headers));

                const responseText = await response.text();
                console.log('Raw server response:', responseText);

                let data;
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                    console.log('Parsed response data:', data);
                } catch (e) {
                    console.error('Failed to parse response:', e);
                    throw new Error('Серверден жооп алууда ката кетти');
                }

                if (response.ok) {
                    console.log('Registration successful');
                    securityModal.classList.remove('show');
                    alert('Каттоо ийгиликтүү аяктады! Кирүүгө өтүңүз.');
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    formElement.reset();
                    securityQuestion.value = '';
                    secretWord.value = '';
                } else {
                    console.error('Server returned error:', response.status);
                    if (data.message) {
                        throw new Error(data.message);
                    } else if (response.status === 409) {
                        throw new Error('Бул колдонуучу аты же электрондук почта мурунтан эле катталган');
                    } else if (response.status === 400) {
                        throw new Error('Туура эмес маалыматтар');
                    } else {
                        throw new Error('Каттоодо ката кетти');
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'Каттоодо ката кетти. Сураныч, кайра аракет кылыңыз.');
            }
        });
    } else {
        console.error('Save security button not found');
    }

    // Handle security setup cancel
    cancelSecurityBtn.addEventListener('click', () => {
        securityModal.classList.remove('show');
        securityQuestion.value = '';
        secretWord.value = '';
    });

    // Close modal when clicking outside
    securityModal.addEventListener('click', (e) => {
        if (e.target === securityModal) {
            securityModal.classList.remove('show');
            securityQuestion.value = '';
            secretWord.value = '';
        }
    });

    // Check for remembered credentials
    const rememberedUsername = localStorage.getItem('username');
    const rememberedPassword = localStorage.getItem('password');
    
    if (rememberedUsername && rememberedPassword) {
        const usernameInput = loginFormElement.querySelector('input[name="username"]');
        const passwordInput = loginFormElement.querySelector('input[name="password"]');
        rememberCheckbox.checked = true;
        
        usernameInput.value = rememberedUsername;
        passwordInput.value = rememberedPassword;
    }

    // Chat functionality
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.querySelector('.chat-messages');
    
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const input = this.querySelector('input');
        const message = input.value.trim();
        
        if (message) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
            const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
            
            const newMessage = document.createElement('div');
            newMessage.classList.add('chat-message', 'chat-receiver');
            newMessage.innerHTML = `
                <span class="chat-name">You</span>
                ${message}
                <span class="chat-timestamp">${timeString}</span>
            `;
            
            chatMessages.appendChild(newMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            input.value = '';
            
            // Add a simulated reply after a short delay
            setTimeout(() => {
                const reply = document.createElement('div');
                reply.classList.add('chat-message');
                
                reply.innerHTML = `
                    <span class="chat-name">John</span>
                    I'll get back to you on that soon.
                    <span class="chat-timestamp">${timeString}</span>
                `;
                
                chatMessages.appendChild(reply);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 1500);
        }
    });

    // Forgot password functionality
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotPasswordLink = document.querySelector('a.forgot-password');
    const cancelForgotPassword = document.getElementById('cancel-forgot-password');
    const resetEmailInput = document.getElementById('reset-email');
    const securityQuestionDisplay = document.getElementById('security-question-display');
    const secretAnswerInput = document.getElementById('secret-answer');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const forgotPasswordMatchValidation = document.getElementById('forgot-password-match-validation');
    const newPasswordIndicator = document.getElementById('new-password-indicator');
    const forgotPasswordConfirmIndicator = document.getElementById('confirm-password-indicator');

    // Password visibility toggle for forgot password modal
    const forgotPasswordToggleButtons = document.querySelectorAll('#forgot-password-modal .toggle-password');
    console.log('Found toggle buttons:', forgotPasswordToggleButtons.length);

    // Add specific event listeners for forgot password toggle buttons
    forgotPasswordToggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            console.log('Forgot password toggle button clicked');
            const input = button.parentElement.querySelector('input');
            const type = input.getAttribute('type');
            const img = button.querySelector('img');
            
            console.log('Current input type:', type);
            
            if (type === 'password') {
                input.setAttribute('type', 'text');
                img.style.opacity = '1';
            } else {
                input.setAttribute('type', 'password');
                img.style.opacity = '0.6';
            }
        });
    });

    // Also add event listeners for the toggle buttons when the modal is shown
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Forgot password link clicked');
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.add('show');
                // Reset form and validation state
                if (forgotPasswordForm) {
                    forgotPasswordForm.reset();
                }
                if (forgotPasswordMatchValidation) {
                    forgotPasswordMatchValidation.style.display = 'none';
                }
                if (forgotPasswordConfirmIndicator) {
                    forgotPasswordConfirmIndicator.style.display = 'none';
                }
                if (securityQuestionDisplay) {
                    securityQuestionDisplay.textContent = 'Коопсуздук суроосу көрсөтүлөт';
                    securityQuestionDisplay.classList.add('show');
                }
                
                // Re-attach event listeners to toggle buttons
                const toggleButtons = document.querySelectorAll('#forgot-password-modal .toggle-password');
                console.log('Re-attaching event listeners to toggle buttons:', toggleButtons.length);
                
                toggleButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Toggle button clicked (re-attached)');
                        const input = button.parentElement.querySelector('input');
                        const type = input.getAttribute('type');
                        const img = button.querySelector('img');
                        
                        console.log('Current input type:', type);
                        
                        if (type === 'password') {
                            input.setAttribute('type', 'text');
                            img.style.opacity = '1';
                        } else {
                            input.setAttribute('type', 'password');
                            img.style.opacity = '0.6';
                        }
                    });
                });
            }
        });
    }

    // Password validation rules for forgot password modal
    const forgotPasswordValidationRules = {
        length: password => password.length >= 8,
        uppercase: password => /[A-Z]/.test(password),
        lowercase: password => /[a-z]/.test(password),
        number: password => /[0-9]/.test(password),
        special: password => /[!@#$%^&*]/.test(password)
    };

    // Validate new password in forgot password modal
    function validateForgotPassword() {
        const password = newPasswordInput.value;
        let isValid = true;
        
        Object.entries(forgotPasswordValidationRules).forEach(([type, rule]) => {
            const requirement = document.querySelector(`#forgot-password-modal [data-requirement="${type}"]`);
            const meetsRequirement = rule(password);
            if (requirement) {
                requirement.classList.toggle('valid', meetsRequirement);
                if (!meetsRequirement) isValid = false;
            }
        });

        if (newPasswordIndicator) {
            newPasswordIndicator.style.display = password && !isValid ? 'block' : 'none';
        }
        return isValid;
    }

    // Validate password match in forgot password modal
    function validateForgotPasswordMatch() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;
        
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                forgotPasswordMatchValidation.style.display = 'block';
                forgotPasswordConfirmIndicator.style.display = 'block';
                return false;
            }
        }
        forgotPasswordMatchValidation.style.display = 'none';
        forgotPasswordConfirmIndicator.style.display = 'none';
        return true;
    }

    // Add event listener for new password validation
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            validateForgotPassword();
            validateForgotPasswordMatch();
        });
    }

    // Show validation message when clicking indicator
    if (newPasswordIndicator) {
        newPasswordIndicator.addEventListener('click', (e) => {
            e.stopPropagation();
            const requirements = document.querySelector('#forgot-password-modal .password-requirements');
            if (requirements) {
                // Position the requirements box next to the indicator
                const indicatorRect = newPasswordIndicator.getBoundingClientRect();
                const modalContent = document.querySelector('#forgot-password-modal .modal-content');
                const modalRect = modalContent.getBoundingClientRect();
                
                // Calculate position relative to the modal
                const top = indicatorRect.top - modalRect.top;
                const left = indicatorRect.right - modalRect.left + 10; // 10px offset
                
                requirements.style.top = `${top}px`;
                requirements.style.left = `${left}px`;
                
                requirements.classList.add('show');
            }
        });
    }

    // Hide validation messages when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.validation-indicator') && 
            !e.target.closest('.password-requirements') && 
            !e.target.closest('.validation-message')) {
            document.querySelectorAll('.password-requirements').forEach(req => {
                req.classList.remove('show');
            });
            document.querySelectorAll('.validation-message').forEach(msg => {
                msg.style.display = 'none';
            });
        }
    });

    // Hide modal when clicking cancel
    if (cancelForgotPassword) {
        cancelForgotPassword.addEventListener('click', () => {
            if (forgotPasswordModal) {
                forgotPasswordModal.classList.remove('show');
            }
            if (forgotPasswordForm) {
                forgotPasswordForm.reset();
            }
            if (securityQuestionDisplay) {
                securityQuestionDisplay.textContent = 'Коопсуздук суроосу көрсөтүлөт';
            }
            if (forgotPasswordMatchValidation) {
                forgotPasswordMatchValidation.style.display = 'none';
            }
            if (forgotPasswordConfirmIndicator) {
                forgotPasswordConfirmIndicator.style.display = 'none';
            }
        });
    }

    // Close modal when clicking outside
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.classList.remove('show');
                if (forgotPasswordForm) {
                    forgotPasswordForm.reset();
                }
                if (securityQuestionDisplay) {
                    securityQuestionDisplay.textContent = 'Коопсуздук суроосу көрсөтүлөт';
                }
                if (forgotPasswordMatchValidation) {
                    forgotPasswordMatchValidation.style.display = 'none';
                }
                if (forgotPasswordConfirmIndicator) {
                    forgotPasswordConfirmIndicator.style.display = 'none';
                }
            }
        });
    }

    // Handle email input to fetch security question
    if (resetEmailInput) {
        resetEmailInput.addEventListener('blur', async () => {
            const email = resetEmailInput.value.trim();
            if (email) {
                try {
                    console.log('Fetching security question for email:', email);
                    const response = await fetch('/get-security-question', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });

                    console.log('Response status:', response.status);
                    const responseText = await response.text();
                    console.log('Raw response:', responseText);

                    let data;
                    try {
                        data = responseText ? JSON.parse(responseText) : {};
                    } catch (e) {
                        console.error('Failed to parse response:', e);
                        data = {};
                    }

                    if (response.ok && data.security_question) {
                        console.log('Security question found:', data.security_question);
                        securityQuestionDisplay.textContent = data.security_question;
                        securityQuestionDisplay.classList.add('show');
                    } else {
                        console.log('No security question found for email');
                        securityQuestionDisplay.textContent = 'Электрондук почта табылган жок';
                        securityQuestionDisplay.classList.add('show');
                    }
                } catch (error) {
                    console.error('Error fetching security question:', error);
                    securityQuestionDisplay.textContent = 'Коопсуздук суроосу алууда ката кетти';
                    securityQuestionDisplay.classList.add('show');
                }
            }
        });
    }

    // Handle password reset form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submission attempted');

            const isPasswordValid = validateForgotPassword();
            const isPasswordMatch = validateForgotPasswordMatch();

            if (!isPasswordValid) {
                const requirements = document.querySelector('#forgot-password-modal .password-requirements');
                if (requirements) {
                    requirements.classList.add('show');
                }
                return;
            }

            if (!isPasswordMatch) {
                forgotPasswordMatchValidation.style.display = 'block';
                return;
            }

            const email = resetEmailInput.value.trim();
            const secretWord = secretAnswerInput.value.trim();
            const newPassword = newPasswordInput.value;

            if (!email || !secretWord || !newPassword) {
                alert('Бардык талааларды толтуруңуз');
                return;
            }

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        keyword: secretWord,
                        new_password: newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Сырсөз ийгиликтүү өзгөртүлдү!');
                    forgotPasswordModal.classList.remove('show');
                    forgotPasswordForm.reset();
                } else {
                    alert(data.message || 'Сырсөздү өзгөртүүдө ката кетти');
                }
            } catch (error) {
                console.error('Error resetting password:', error);
                alert('Сырсөздү өзгөртүүдө ката кетти. Кайра аракет кылыңыз.');
            }
        });
    }
}); 