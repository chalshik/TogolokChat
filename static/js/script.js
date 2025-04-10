function togglePasswordVisibility(button) {
    console.log('Toggle password visibility clicked');
    
    // Find the input field - it's within the same container as the button
    let input;
    
    // Check if we're in the forgot password modal
    if (button.closest('#forgot-password-modal')) {
        input = button.closest('.input-wrapper').querySelector('input[type="password"], input[type="text"]');
        if (!input) {
            // Fallback to password-field if input-wrapper doesn't contain the input
            input = button.closest('.password-field').querySelector('input[type="password"], input[type="text"]');
        }
    } else {
        // For login and register forms
        input = button.closest('.password-field').querySelector('input[type="password"], input[type="text"]');
    }
    
    const icon = button.querySelector('i');
    
    console.log('Input found:', input);
    console.log('Icon found:', icon);
    
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            console.log('Password now visible');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            console.log('Password now hidden');
        }
    } else {
        console.error('Could not find input or icon');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Remove old toggle password event listeners since we're using onclick in HTML
    const oldToggleButtons = document.querySelectorAll('.toggle-password');
    oldToggleButtons.forEach(button => {
        // Remove any existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

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
            
            // Use the togglePasswordVisibility function directly
            togglePasswordVisibility(button);
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
                    // Remove any existing event listeners
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    
                    newButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Toggle button clicked (re-attached)');
                        
                        // Use the same approach as the main togglePasswordVisibility function
                        const input = newButton.closest('.input-wrapper').querySelector('input[type="password"], input[type="text"]');
                        const icon = newButton.querySelector('i');
                        
                        console.log('Input found:', input);
                        console.log('Icon found:', icon);
                        
                        if (input && icon) {
                            if (input.type === 'password') {
                                input.type = 'text';
                                icon.classList.remove('fa-eye');
                                icon.classList.add('fa-eye-slash');
                                console.log('Password now visible');
                            } else {
                                input.type = 'password';
                                icon.classList.remove('fa-eye-slash');
                                icon.classList.add('fa-eye');
                                console.log('Password now hidden');
                            }
                        } else {
                            console.error('Could not find input or icon');
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
        if (!newPasswordInput || !newPasswordIndicator) {
            console.error('Missing elements for new password validation:', {
                newPasswordInput: !!newPasswordInput,
                newPasswordIndicator: !!newPasswordIndicator
            });
            return false;
        }

        const newPasswordMessage = document.querySelector('#new-password-message');
        const password = newPasswordInput.value;
        let isValid = true;

        // Check password requirements
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*]/.test(password);

        isValid = hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

        // Update the new password indicator
        if (password) {
            newPasswordIndicator.style.cssText = 'display: block !important;';
            newPasswordIndicator.classList.remove('valid', 'invalid');
            newPasswordIndicator.classList.add(isValid ? 'valid' : 'invalid');

            if (newPasswordMessage) {
                newPasswordMessage.style.cssText = 'display: block !important;';
                newPasswordMessage.textContent = isValid ? 'Password is valid' : 'Password does not meet requirements';
            }
        } else {
            newPasswordIndicator.style.display = 'none';
            if (newPasswordMessage) {
                newPasswordMessage.style.display = 'none';
            }
        }

        return isValid;
    }

    // Add event listeners for password fields in forgot password modal
    document.addEventListener('DOMContentLoaded', () => {
        const forgotPasswordModal = document.getElementById('forgot-password-modal');
        if (forgotPasswordModal) {
            const newPasswordInput = forgotPasswordModal.querySelector('input.new-password');
            const confirmPasswordInput = forgotPasswordModal.querySelector('input.confirm-password');
            
            if (newPasswordInput) {
                newPasswordInput.addEventListener('input', () => {
                    validateForgotPassword();
                    if (confirmPasswordInput.value) {
                        validatePasswordMatch();
                    }
                });
            }
            
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', validatePasswordMatch);
            }
        }
    });

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
            
            // Reset validation indicators
            const confirmPasswordIndicator = document.querySelector('#forgot-password-modal .confirm-password-indicator');
            const confirmPasswordMessage = document.querySelector('#forgot-password-modal .confirm-password-message');
            
            if (confirmPasswordIndicator) {
                confirmPasswordIndicator.classList.remove('valid', 'invalid');
            }
            
            if (confirmPasswordMessage) {
                confirmPasswordMessage.textContent = '';
                confirmPasswordMessage.classList.remove('show');
            }
            
            // Hide password requirements
            const requirements = document.querySelector('#forgot-password-modal .password-requirements');
            if (requirements) {
                requirements.classList.remove('show');
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
                
                // Reset validation indicators
                const confirmPasswordIndicator = document.querySelector('#forgot-password-modal .confirm-password-indicator');
                const confirmPasswordMessage = document.querySelector('#forgot-password-modal .confirm-password-message');
                
                if (confirmPasswordIndicator) {
                    confirmPasswordIndicator.classList.remove('valid', 'invalid');
                }
                
                if (confirmPasswordMessage) {
                    confirmPasswordMessage.textContent = '';
                    confirmPasswordMessage.classList.remove('show');
                }
                
                // Hide password requirements
                const requirements = document.querySelector('#forgot-password-modal .password-requirements');
                if (requirements) {
                    requirements.classList.remove('show');
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
            const isPasswordMatch = validatePasswordMatch();

            if (!isPasswordValid) {
                const requirements = document.querySelector('#forgot-password-modal .password-requirements');
                if (requirements) {
                    requirements.classList.add('show');
                }
                return;
            }

            if (!isPasswordMatch) {
                const confirmPasswordMessage = document.querySelector('#forgot-password-modal .confirm-password-message');
                if (confirmPasswordMessage) {
                    confirmPasswordMessage.classList.add('show');
                }
                return;
            }

            const email = resetEmailInput.value.trim();
            const secretWord = secretAnswerInput.value.trim();
            const newPassword = newPasswordInput.value;
            const confirmPassword = document.querySelector('#forgot-password-modal .confirm-password').value;

            if (!email || !secretWord || !newPassword || !confirmPassword) {
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

    // Add event listeners for validation indicators in register form
    if (registerForm) {
        const validationIndicators = registerForm.querySelectorAll('.validation-indicator');
        const validationMessages = registerForm.querySelectorAll('.validation-message');
        
        // Add click event listeners to validation indicators
        validationIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                // Toggle the corresponding validation message
                if (validationMessages[index]) {
                    validationMessages[index].classList.toggle('show');
                }
            });
        });
        
        // Add input event listeners to form fields
        const formInputs = registerForm.querySelectorAll('input');
        formInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                // Show validation indicator when input has value
                if (input.value.trim() !== '') {
                    if (validationIndicators[index]) {
                        validationIndicators[index].classList.add('show');
                    }
                } else {
                    if (validationIndicators[index]) {
                        validationIndicators[index].classList.remove('show');
                    }
                    if (validationMessages[index]) {
                        validationMessages[index].classList.remove('show');
                    }
                }
            });
        });
        
        // Add specific validation for password fields
        const passwordInput = registerForm.querySelector('input[type="password"]');
        const confirmPasswordInput = registerForm.querySelector('input[name="confirm-password"]');
        const passwordIndicator = registerForm.querySelector('.password-indicator');
        const confirmPasswordIndicator = registerForm.querySelector('.confirm-password-indicator');
        
        if (passwordInput && confirmPasswordInput && passwordIndicator && confirmPasswordIndicator) {
            // Validate password match
            function validatePasswordMatch() {
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword) {
                    if (password === confirmPassword) {
                        confirmPasswordIndicator.classList.remove('invalid');
                        confirmPasswordIndicator.classList.add('valid');
                    } else {
                        confirmPasswordIndicator.classList.remove('valid');
                        confirmPasswordIndicator.classList.add('invalid');
                    }
                }
            }
            
            // Add event listeners for password validation
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.trim() !== '') {
                    passwordIndicator.classList.add('show');
                } else {
                    passwordIndicator.classList.remove('show');
                }
                validatePasswordMatch();
            });
            
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        }
    }

    // Add event listeners for forgot password modal
    document.addEventListener('DOMContentLoaded', function() {
        const forgotPasswordModal = document.getElementById('forgot-password-modal');
        if (!forgotPasswordModal) return;

        const newPasswordInput = forgotPasswordModal.querySelector('#new-password');
        const confirmPasswordInput = forgotPasswordModal.querySelector('#confirm-password');
        const newPasswordIndicator = forgotPasswordModal.querySelector('#new-password-indicator');
        const confirmPasswordIndicator = forgotPasswordModal.querySelector('#confirm-password-indicator');
        const newPasswordMessage = forgotPasswordModal.querySelector('#new-password-message');
        const confirmPasswordMessage = forgotPasswordModal.querySelector('#confirm-password-message');

        console.log('Elements found:', {
            newPasswordInput,
            confirmPasswordInput,
            newPasswordIndicator,
            confirmPasswordIndicator,
            newPasswordMessage,
            confirmPasswordMessage
        });

        if (!newPasswordInput || !confirmPasswordInput || !newPasswordIndicator || !confirmPasswordIndicator) {
            console.error('Missing elements for password validation');
            return;
        }

        // Initialize indicators as hidden
        newPasswordIndicator.style.display = 'none';
        confirmPasswordIndicator.style.display = 'none';
        newPasswordMessage.style.display = 'none';
        confirmPasswordMessage.style.display = 'none';

        function validateNewPassword() {
            const password = newPasswordInput.value;
            const hasLength = password.length >= 8;
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
            
            newPasswordIndicator.style.display = 'block';
            newPasswordIndicator.classList.toggle('valid', isValid);
            newPasswordIndicator.classList.toggle('invalid', !isValid);
            
            if (newPasswordMessage) {
                let message = '';
                if (!hasLength) message = 'Password must be at least 8 characters long';
                else if (!hasUpper) message = 'Password must contain an uppercase letter';
                else if (!hasLower) message = 'Password must contain a lowercase letter';
                else if (!hasNumber) message = 'Password must contain a number';
                else if (!hasSpecial) message = 'Password must contain a special character';
                else message = 'Password is valid';
                
                newPasswordMessage.textContent = message;
            }
            
            return isValid;
        }

        function validatePasswordMatch() {
            const isMatching = newPasswordInput.value === confirmPasswordInput.value && confirmPasswordInput.value !== '';
            
            confirmPasswordIndicator.style.display = 'block';
            confirmPasswordIndicator.classList.toggle('valid', isMatching);
            confirmPasswordIndicator.classList.toggle('invalid', !isMatching);
            
            if (confirmPasswordMessage) {
                confirmPasswordMessage.textContent = isMatching ? 'Passwords match' : 'Passwords do not match';
            }
            
            return isMatching;
        }

        newPasswordInput.addEventListener('input', function() {
            validateNewPassword();
            if (confirmPasswordInput.value) {
                validatePasswordMatch();
            }
        });

        confirmPasswordInput.addEventListener('input', validatePasswordMatch);

        newPasswordIndicator.addEventListener('mouseenter', () => {
            newPasswordMessage.style.display = 'block';
        });

        newPasswordIndicator.addEventListener('mouseleave', () => {
            newPasswordMessage.style.display = 'none';
        });

        confirmPasswordIndicator.addEventListener('mouseenter', () => {
            confirmPasswordMessage.style.display = 'block';
        });

        confirmPasswordIndicator.addEventListener('mouseleave', () => {
            confirmPasswordMessage.style.display = 'none';
        });

        // Handle form submission
        const forgotPasswordForm = forgotPasswordModal.querySelector('form');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', function(e) {
                const isPasswordValid = validateNewPassword();
                const isMatchValid = validatePasswordMatch();
                
                if (!isPasswordValid || !isMatchValid) {
                    e.preventDefault();
                    alert('Please ensure both passwords are valid and matching.');
                }
            });
        }
    });
}); 