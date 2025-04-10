document.addEventListener('DOMContentLoaded', () => {
    // Selectors for chat elements
    const messagesContainers = document.querySelectorAll('.messages-container');
    const inputBox = document.querySelector('.input-box input');
    const sendButton = document.querySelector('.send-button');
    const emojiButton = document.querySelector('.input-actions .fa-smile');
    const attachButton = document.querySelector('.input-actions .fa-paperclip');
    const searchInput = document.querySelector('.search-box input');
    const chatItems = document.querySelectorAll('.chat-item');
    const chatHeader = document.getElementById('chat-header');
    
    // Group profile elements
    const groupProfileSidebar = document.getElementById('group-profile-sidebar');
    const closeGroupProfileBtn = document.getElementById('close-group-profile');
    const editNameBtn = document.getElementById('edit-group-name');
    const editAvatarBtn = document.getElementById('edit-group-avatar');
    const editNameModal = document.getElementById('edit-name-modal');
    const editAvatarModal = document.getElementById('edit-avatar-modal');
    const groupNameInput = document.getElementById('group-name-input');
    const saveNameBtn = document.getElementById('save-name-btn');
    const saveAvatarBtn = document.getElementById('save-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    
    // Contact profile elements
    const contactProfileSidebar = document.getElementById('contact-profile-sidebar');
    const closeContactProfileBtn = document.getElementById('close-contact-profile');
    const editContactNameBtn = document.getElementById('edit-contact-name');
    const editContactNameModal = document.getElementById('edit-contact-name-modal');
    const contactNameInput = document.getElementById('contact-name-input');
    const saveContactNameBtn = document.getElementById('save-contact-name-btn');
    
    // Shared elements
    const modalCloseBtns = document.querySelectorAll('.modal-close, .cancel-btn');
    
    // Current active chat tracking
    let currentChatId = 'group1';
    let currentChatType = 'group';

    // Show the first message container by default
    document.getElementById('group1-messages').classList.add('active');

    // Toggle profile sidebar based on chat type
    function toggleProfileSidebar() {
        if (currentChatType === 'group') {
            contactProfileSidebar.classList.remove('active');
            groupProfileSidebar.classList.toggle('active');
        } else {
            groupProfileSidebar.classList.remove('active');
            contactProfileSidebar.classList.toggle('active');
        }
    }

    // Event listeners for profile sidebar
    if (chatHeader) {
        chatHeader.addEventListener('click', (e) => {
            // Only open sidebar if clicking on the chat info part, not the action buttons
            if (!e.target.closest('.chat-actions')) {
                toggleProfileSidebar();
            }
        });
    }

    // Close sidebar buttons
    if (closeGroupProfileBtn) {
        closeGroupProfileBtn.addEventListener('click', () => {
            groupProfileSidebar.classList.remove('active');
        });
    }

    if (closeContactProfileBtn) {
        closeContactProfileBtn.addEventListener('click', () => {
            contactProfileSidebar.classList.remove('active');
        });
    }
    
    // Open edit name modal for group
    if (editNameBtn) {
        editNameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentName = document.getElementById('group-name-display').textContent;
            groupNameInput.value = currentName;
            editNameModal.classList.add('active');
        });
    }
    
    // Open edit name modal for contact
    if (editContactNameBtn) {
        editContactNameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentName = document.getElementById('contact-name-display').textContent;
            contactNameInput.value = currentName;
            editContactNameModal.classList.add('active');
        });
    }
    
    // Open edit avatar modal
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            // Get current avatar src
            const currentAvatarSrc = document.getElementById('group-avatar-img').src;
            avatarPreviewImg.src = currentAvatarSrc;
            editAvatarModal.classList.add('active');
        });
    }
    
    // Close modals
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editNameModal.classList.remove('active');
            editAvatarModal.classList.remove('active');
            editContactNameModal.classList.remove('active');
        });
    });
    
    // Handle save group name
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            const newName = groupNameInput.value.trim();
            if (newName) {
                // Update group name in all places
                document.getElementById('group-name-display').textContent = newName;
                document.getElementById('current-chat-title').textContent = newName;
                
                // Find and update the chat item
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
                if (chatItem) {
                    const chatNameElement = chatItem.querySelector('h3');
                    if (chatNameElement) {
                        chatNameElement.textContent = newName;
                    }
                }
                
                // Close the modal
                editNameModal.classList.remove('active');
            }
        });
    }
    
    // Handle save contact name
    if (saveContactNameBtn) {
        saveContactNameBtn.addEventListener('click', () => {
            const newName = contactNameInput.value.trim();
            if (newName) {
                // Update contact name in all places
                document.getElementById('contact-name-display').textContent = newName;
                document.getElementById('current-chat-title').textContent = newName;
                
                // Find and update the chat item
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
                if (chatItem) {
                    const chatNameElement = chatItem.querySelector('h3');
                    if (chatNameElement) {
                        chatNameElement.textContent = newName;
                    }
                }
                
                // Close the modal
                editContactNameModal.classList.remove('active');
            }
        });
    }
    
    // Handle avatar upload preview
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    avatarPreviewImg.src = e.target.result;
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Handle remove avatar
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', () => {
            // Reset to default group avatar
            avatarPreviewImg.src = '/static/images/group_icon.png';
        });
    }
    
    // Handle save avatar
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', () => {
            const newAvatarSrc = avatarPreviewImg.src;
            
            // Update avatar in all places
            document.getElementById('group-avatar-img').src = newAvatarSrc;
            document.getElementById('current-chat-avatar').src = newAvatarSrc;
            
            // Find and update the chat item
            const chatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
            if (chatItem) {
                const avatarImg = chatItem.querySelector('.chat-avatar img');
                if (avatarImg) {
                    avatarImg.src = newAvatarSrc;
                }
            }
            
            // Close the modal
            editAvatarModal.classList.remove('active');
        });
    }

    // Function to format time
    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }

    // Function to create a new message element
    function createMessageElement(message, isSent = true, senderName = 'Тоголоктакт(1)') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        if (!isSent) {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'message-avatar';
            const avatarImg = document.createElement('img');
            avatarImg.src = '/static/images/contact_logo.png';
            avatarImg.alt = 'User';
            avatarDiv.appendChild(avatarImg);
            messageDiv.appendChild(avatarDiv);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'message-info';

        if (!isSent) {
            const senderNameSpan = document.createElement('span');
            senderNameSpan.className = 'sender-name';
            senderNameSpan.textContent = senderName;
            infoDiv.appendChild(senderNameSpan);
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = formatTime(new Date());

        if (isSent) {
            const statusSpan = document.createElement('span');
            statusSpan.className = 'message-status';
            const icon = document.createElement('i');
            icon.className = 'fas fa-check-double';
            statusSpan.appendChild(icon);
            infoDiv.appendChild(timeSpan);
            infoDiv.appendChild(statusSpan);
        } else {
            infoDiv.appendChild(timeSpan);
        }

        const messageText = document.createElement('p');
        
        // Check if message is a URL
        if (message.startsWith('http')) {
            const linkElem = document.createElement('a');
            linkElem.href = message;
            linkElem.className = 'message-link';
            linkElem.textContent = message;
            linkElem.target = '_blank';
            messageText.appendChild(linkElem);
        } else {
            messageText.textContent = message;
        }

        contentDiv.appendChild(infoDiv);
        contentDiv.appendChild(messageText);
        messageDiv.appendChild(contentDiv);

        return messageDiv;
    }

    // Function to get the active messages container
    function getActiveMessagesContainer() {
        return document.getElementById(`${currentChatId}-messages`);
    }

    // Function to send message
    function sendMessage(message) {
        if (!message.trim()) return;

        const messagesContainer = getActiveMessagesContainer();
        if (!messagesContainer) return;

        const messageElement = createMessageElement(message, true);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        inputBox.value = '';

        // Simulate received message after a delay (with different responses based on chat type)
        setTimeout(() => {
            let response;
            let senderName = currentChatType === 'group' ? 'Тоголоктакт(1)' : document.getElementById('contact-name-display').textContent;
            
            if (currentChatType === 'group') {
                const responses = [
                    'Бул жерде эмнерсе жазылбаптырго, ошондо билгениоизди кылабыз',
                    'Классика',
                    'https://meet.google.com/kvi-foaa-cwy',
                    'Бүгүн сабактар болбойт'
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            } else {
                const responses = [
                    'Аа, мен да кеттам, тыгым экен бул жерлер',
                    'Башталса мага жазып койчу',
                    'Биз эмне кылабыз?',
                    'Жок, азыр алар иш кылып атышат'
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            
            const responseElement = createMessageElement(response, false, senderName);
            messagesContainer.appendChild(responseElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    }

    // Event listeners for sending messages
    sendButton.addEventListener('click', () => {
        sendMessage(inputBox.value);
    });

    inputBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage(inputBox.value);
        }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        chatItems.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const lastMessage = item.querySelector('.last-message p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Function to switch chat
    function switchChat(chatId, chatType) {
        // Update current chat tracking
        currentChatId = chatId;
        currentChatType = chatType;
        
        // Hide all message containers and show the selected one
        messagesContainers.forEach(container => {
            container.classList.remove('active');
        });
        const targetContainer = document.getElementById(`${chatId}-messages`);
        if (targetContainer) {
            targetContainer.classList.add('active');
        }
        
        // Update chat header
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        if (chatItem) {
            const chatName = chatItem.querySelector('h3').textContent;
            const headerTitle = document.getElementById('current-chat-title');
            if (headerTitle) {
                headerTitle.textContent = chatName;
            }
            
            // Update subtitle based on chat type
            const subtitle = document.getElementById('current-chat-subtitle');
            if (subtitle) {
                if (chatType === 'group') {
                    subtitle.textContent = 'Эмил Агай, Мурат Агай, Нурмухаммед, Акбар, Ынтымак...';
                } else {
                    subtitle.textContent = '~Jaman_bala'; // For contact, show nickname
                }
            }
            
            // Update appropriate profile elements
            if (chatType === 'group') {
                document.getElementById('group-name-display').textContent = chatName;
            } else {
                document.getElementById('contact-name-display').textContent = chatName;
            }
            
            // Update avatar
            const chatAvatar = chatItem.querySelector('.chat-avatar img').src;
            document.getElementById('current-chat-avatar').src = chatAvatar;
            
            if (chatType === 'group') {
                document.getElementById('group-avatar-img').src = chatAvatar;
            } else {
                document.getElementById('contact-avatar-img').src = chatAvatar;
            }
        }
        
        // Close any open sidebar
        groupProfileSidebar.classList.remove('active');
        contactProfileSidebar.classList.remove('active');
    }

    // Chat item click handler
    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            chatItems.forEach(chat => chat.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get the chat ID and type
            const chatId = item.getAttribute('data-chat-id');
            const chatType = item.getAttribute('data-chat-type');
            
            // Switch to the selected chat
            switchChat(chatId, chatType);
        });
    });

    // Handle group action buttons
    const leaveGroupBtn = document.querySelector('.leave-group');
    const addMemberBtn = document.querySelector('.add-member');
    const reportContactBtn = document.querySelector('.report-contact');

    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', () => {
            if (confirm('Бул группадан чыккыңыз келеби?')) {
                console.log('User left the group');
                // Here you would add the actual functionality to leave the group
            }
        });
    }

    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            console.log('Add member button clicked');
            // Here you would add the functionality to add a new member
        });
    }
    
    if (reportContactBtn) {
        reportContactBtn.addEventListener('click', () => {
            if (confirm('Бул колдонуучуга даттануу керекпи?')) {
                console.log('User reported the contact');
                // Here you would add the actual functionality to report the contact
            }
        });
    }

    // Initialize emoji picker (you'll need to add emoji-picker library)
    if (emojiButton) {
        emojiButton.addEventListener('click', () => {
            // Add emoji picker functionality
            console.log('Emoji picker clicked');
        });
    }

    // Initialize file attachment
    if (attachButton) {
        attachButton.addEventListener('click', () => {
            // Add file attachment functionality
            console.log('Attachment button clicked');
        });
    }

    // Auto-scroll to bottom of messages
    const activeMessagesContainer = getActiveMessagesContainer();
    if (activeMessagesContainer) {
        activeMessagesContainer.scrollTop = activeMessagesContainer.scrollHeight;
    }
}); 