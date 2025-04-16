// Inject CSS for modals
(() => {
    const style = document.createElement('style');
    style.textContent = `
        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s;
        }
        
        .modal-content {
            background-color: #fff;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            position: relative;
            animation: slideIn 0.3s;
        }
        
        .modal-header {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        
        .close-modal-btn {
            font-size: 24px;
            cursor: pointer;
            color: #777;
        }
        
        .modal-body {
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .modal-footer {
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .group-avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .avatar-preview-container {
            margin-bottom: 15px;
        }
        
        .avatar-buttons {
            display: flex;
            gap: 10px;
        }
        
        .group-name-section {
            margin-top: 20px;
        }
        
        .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            margin-top: 5px;
        }
        
        .btn {
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            border: none;
        }
        
        .btn-primary {
            background-color: #2A9D8F;
            color: white;
        }
        
        .btn-secondary {
            background-color: #6c757d;
            color: white;
        }
        
        .btn-outline {
            background-color: transparent;
            border: 1px solid #2A9D8F;
            color: #2A9D8F;
        }
        
        .btn-outline-danger {
            background-color: transparent;
            border: 1px solid #dc3545;
            color: #dc3545;
        }
        
        /* Notification styles */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: #333;
            color: white;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateY(-50px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.info {
            background-color: #2A9D8F;
        }
        
        .notification.success {
            background-color: #28a745;
        }
        
        .notification.error {
            background-color: #dc3545;
        }
        
        .notification.warning {
            background-color: #ffc107;
            color: #333;
        }
        
        .notification.message {
            background-color: #007bff;
        }
        
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            padding: 10px 20px;
            background-color: #333;
            color: white;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();

// Declare sidebarContentArea globally so it's accessible to all functions
let sidebarContentArea;

// Global timestamp utility
window.getCurrentTimestamp = function() {
    const now = new Date();
    return now.toISOString();
};

// Global message cache for deduplication
window.messageCache = new Map();
const MESSAGE_CACHE_SIZE = 20; // Remember last 20 messages
const MESSAGE_CACHE_TIMEOUT = 10000; // 10 seconds

// Global variable to store user contacts
window.userContacts = [];

/**
 * Consolidated notification system 
 * Type can be: 'info', 'success', 'error', 'warning', 'message'
 */
window.showNotification = function(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Apply the notification type
    notification.className = `notification ${type}`;
    
    // Set the message
    notification.textContent = message;
    
    // Add animation class to show notification
    notification.classList.add('show');
    
    // Automatically hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
};

// Toast is just a specific type of notification
window.showToast = function(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// Global function for creating message elements
window.createMessageElement = function(message, isSent = true, senderName = 'Тоголоктакт(1)') {
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
    // Use a simple time format that doesn't depend on formatTime
    const now = new Date();
    timeSpan.textContent = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');

    if (isSent) {
        const statusSpan = document.createElement('span');
        statusSpan.className = 'message-status';
        const icon = document.createElement('i');
        icon.className = 'fas fa-check';
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
};

// Global function to load chat messages
window.loadChatMessages = function(chatId, chatType) {
    console.log('Loading messages for chat:', chatId, 'Type:', chatType);
    
    // Get the messages container
    const messagesContainer = document.getElementById(`${chatId}-messages`);
    if (!messagesContainer) {
        console.error('Messages container not found');
        return;
    }
    
    // Get current username
    const currentUsername = window.currentUsername || sessionStorage.getItem('username');
    if (!currentUsername) {
        console.error('Current username not found');
        return;
    }
    
    // Clear any loading or empty state messages
    const emptyMessage = messagesContainer.querySelector('.empty-chat-message');
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-messages';
    loadingDiv.innerHTML = '<p>Loading messages...</p>';
    messagesContainer.appendChild(loadingDiv);
    
    let fetchUrl;
    
    if (chatType === 'group') {
        // For group chats
        fetchUrl = getApiUrl(`get_group_messages?group_id=${chatId}&username=${currentUsername}`);
    } else {
        // For direct messages
        // Get the other user's username
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        const otherUsername = chatItem?.dataset?.username;
        
        if (!otherUsername) {
            console.error('Other username not found');
            loadingDiv.innerHTML = '<p>Error: Could not determine chat participant</p>';
            return;
        }
        
        fetchUrl = getApiUrl(`get_messages?user1=${currentUsername}&user2=${otherUsername}`);
    }
    
    // Fetch messages from the server
    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Messages loaded:', data);
            
            // Remove loading indicator
            messagesContainer.removeChild(loadingDiv);
            
            // Clear the container (except for the empty message)
            const existingMessages = messagesContainer.querySelectorAll('.message');
            existingMessages.forEach(msg => messagesContainer.removeChild(msg));
            
            if (chatType === 'group') {
                // Handle group messages
                if (!data.messages || data.messages.length === 0) {
                    // Show empty state if no messages
                    if (emptyMessage) emptyMessage.style.display = 'flex';
                    return;
                }
                
                // Hide empty state
                if (emptyMessage) emptyMessage.style.display = 'none';
                
                // Add each message to the container
                data.messages.forEach(msg => {
                    const isSent = msg.sender === currentUsername;
                    const messageEl = window.createMessageElement(msg.message, isSent, msg.sender);
                    messagesContainer.appendChild(messageEl);
                });
            } else {
                // Handle direct messages
                if (!data.messages || data.messages.length === 0) {
                    // Show empty state if no messages
                    if (emptyMessage) emptyMessage.style.display = 'flex';
                    return;
                }
                
                // Hide empty state
                if (emptyMessage) emptyMessage.style.display = 'none';
                
                // Add each message to the container
                data.messages.forEach(msg => {
                    const isSent = msg.sender === currentUsername;
                    const messageEl = window.createMessageElement(msg.message, isSent);
                    messagesContainer.appendChild(messageEl);
                });
            }
            
            // Scroll to the bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .catch(error => {
            console.error('Error loading messages:', error);
            loadingDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        });
};

// Utility function to get correct API URLs
function getApiUrl(endpoint) {
    // Handle both cases with and without leading slash
    if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1);
    }
    
    // For message endpoints and API endpoints, just use direct paths
    return `/${endpoint}`;
}

// Initialize socket connection
function initializeSocket() {
    console.log('Initializing Socket.IO connection...');
    try {
        // Create socket connection
        const socket = io();
        
        // Store socket globally so other functions can access it
        window.chatSocket = socket;
        
        // Set up event handlers
        setupSocketEventHandlers(socket);
        
        console.log('Socket.IO initialized successfully');
        return socket;
    } catch (error) {
        console.error('Failed to initialize socket:', error);
        showNotification('Could not connect to the chat server. Please refresh the page.', 'error');
        return null;
    }
}

// Set up socket event handlers
function setupSocketEventHandlers(socket) {
    if (!socket) return;
    
    // Connection events
    socket.on('connect', () => {
        console.log('Connected to the server');
        
        // Join user's personal room
        const userId = sessionStorage.getItem('user_id');
        if (userId) {
            socket.emit('join', { room: userId });
            console.log('Joined personal room:', userId);
        }
        
        // Show connection status
        showNotification('Connected to the chat server', 'success');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from the server');
        showNotification('Disconnected from the chat server', 'error');
    });
    
    socket.on('reconnect', () => {
        console.log('Reconnected to the server');
        showNotification('Reconnected to the chat server', 'success');
    });
    
    // Message events
    socket.on('new_message', (data) => {
        console.log('New message received:', data);
        receiveMessage(data);
    });
    
    socket.on('message_sent', (data) => {
        console.log('Message sent confirmation:', data);
        // Update UI to show message was sent
        const messagesContainer = document.getElementById(`${data.receiver_id}-messages`);
        if (messagesContainer) {
            // Find the most recent message with "sending" status
            const pendingMessages = messagesContainer.querySelectorAll('.message[data-status="sending"]');
            if (pendingMessages.length > 0) {
                const lastPendingMessage = pendingMessages[pendingMessages.length - 1];
                lastPendingMessage.setAttribute('data-status', 'sent');
                
                // Update the status icon
                const statusIcon = lastPendingMessage.querySelector('.message-status i');
                if (statusIcon) {
                    statusIcon.className = 'fas fa-check';
                }
            }
        }
    });
    
    // User status events
    socket.on('user_status', (data) => {
        console.log('User status update:', data);
        // Update UI to show user status (online/offline)
        const username = data.username;
        const status = data.status;
        
        // Update status in chat list
        const chatItems = document.querySelectorAll(`.chat-item[data-username="${username}"]`);
        chatItems.forEach(item => {
            const statusIndicator = item.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${status}`;
            }
        });
    });
    
    // Error events
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        showNotification('Error in chat connection', 'error');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Hide all modals at startup
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Initialize sidebarContentArea
    sidebarContentArea = document.getElementById('sidebar-content-area');

    // Get the username from the server or local storage
    window.currentUsername = sessionStorage.getItem('username') || '';
    if (!window.currentUsername) {
        // Try to get username from the UI if available
        const usernameElement = document.getElementById('current-username');
        if (usernameElement) {
            window.currentUsername = usernameElement.dataset.username || '';
            // Store it for future use
            if (window.currentUsername) {
                sessionStorage.setItem('username', window.currentUsername);
            }
        }
    }
    
    // Initialize socket connection for real-time messaging
    initializeSocket();
    
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

    // Function to toggle the profile sidebar
    function toggleProfileSidebar() {
        if (currentChatType === 'group') {
            contactProfileSidebar.classList.remove('active');
            groupProfileSidebar.classList.toggle('active');
        } else if (currentChatType === 'contact') {
            groupProfileSidebar.classList.remove('active');
            // Instead of just toggling, we need to show the contact profile with correct data
            const contactId = window.currentChatId;
            if (contactId) {
                showContactProfile(contactId);
            } else {
                contactProfileSidebar.classList.toggle('active');
            }
        } else {
            // Default fallback behavior
            groupProfileSidebar.classList.remove('active');
            contactProfileSidebar.classList.toggle('active');
        }
    }

    // Function to show contact profile sidebar with details
    function showContactProfile(contactId) {
        // Get contacts from global variable
        const userContacts = window.userContacts || [];
        
        // Fetch contact details if needed
        const contact = userContacts.find(c => c.id == contactId);
        
        // If contact not found, create a default one for display
        const defaultContact = {
            id: contactId,
            name: "User " + contactId,
            username: "user" + contactId,
            avatar: '/static/images/contact_logo.png',
            info: "No additional information available"
        };
        
        const contactToShow = contact || defaultContact;

        // Update profile sidebar content
        const profileSidebar = document.getElementById('contact-profile-sidebar');
        if (profileSidebar) {
            // Set profile image
            const profileImage = profileSidebar.querySelector('#contact-avatar-img');
            if (profileImage) {
                profileImage.src = contactToShow.avatar || '/static/images/contact_logo.png';
                profileImage.alt = contactToShow.name || 'Contact';
            }

            // Set contact name
            const contactName = profileSidebar.querySelector('#contact-name-display');
            if (contactName) {
                contactName.textContent = contactToShow.name || 'Unknown Contact';
            }

            // Set contact nickname
            const contactNickname = profileSidebar.querySelector('.contact-nickname');
            if (contactNickname) {
                contactNickname.textContent = contactToShow.username ? `@${contactToShow.username}` : '';
            }

            // Set contact info text if available
            const contactInfo = profileSidebar.querySelector('#contact-info-text');
            if (contactInfo && contactToShow.info) {
                contactInfo.textContent = contactToShow.info;
            }

            // Ensure the report button has the correct contact ID
            const reportButton = profileSidebar.querySelector('.report-contact');
            if (reportButton) {
                reportButton.setAttribute('data-contact-id', contactId);
            }

            // Show the sidebar
            profileSidebar.classList.add('active');
            
            // Hide the group profile sidebar
            const groupProfileSidebar = document.getElementById('group-profile-sidebar');
            if (groupProfileSidebar) {
                groupProfileSidebar.classList.remove('active');
            }
        }
    }

    // Event listeners for profile sidebar
    if (chatHeader) {
        // Add click handler for the entire header (excluding action buttons)
        chatHeader.addEventListener('click', (e) => {
            // Only open sidebar if clicking on the chat info part, not the action buttons
            if (!e.target.closest('.chat-actions')) {
                toggleProfileSidebar();
            }
        });
        
        // Add specific handler for the avatar in the header
        const headerAvatar = document.getElementById('current-chat-avatar');
        if (headerAvatar) {
            headerAvatar.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the chat header click
                
                const chatId = window.currentChatId;
                const chatType = window.currentChatType;
                
                if (chatType === 'contact') {
                    showContactProfile(chatId);
                } else if (chatType === 'group') {
                    toggleProfileSidebar();
                }
            });
        }
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

    // Function to get the active messages container
    function getActiveMessagesContainer() {
        const containerId = `${currentChatId}-messages`;
        console.log('Attempting to find messages container with ID:', containerId);
        const container = document.getElementById(containerId);
        console.log('Found container:', container);
        return container;
    }

    // Event listeners for sending messages
    sendButton.addEventListener('click', () => {
        window.sendMessage();
    });

    inputBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.sendMessage();
        }
    });

    // Search functionality
    // searchInput.addEventListener('input', (e) => {
    //     const searchTerm = e.target.value.toLowerCase();
    //     chatItems.forEach(item => {
    //         const name = item.querySelector('h3').textContent.toLowerCase();
    //         const lastMessage = item.querySelector('.last-message p').textContent.toLowerCase();
            
    //         if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
    //             item.style.display = 'flex';
    //         } else {
    //             item.style.display = 'none';
    //         }
    //     });
    // });

    // Function to switch to a different chat
    window.switchChat = function(chatId, chatType) {
        console.log(`Switching to chat ID: ${chatId}, type: ${chatType}`);
        
        // Ensure consistent ID type (string)
        chatId = String(chatId);
        
        // Store the current chat ID and type globally
        window.currentChatId = chatId;
        window.currentChatType = chatType;
        
        // Hide all message containers
        const allContainers = document.querySelectorAll('.messages-container');
        allContainers.forEach(container => {
            container.style.display = 'none';
        });
        
        // Show the selected chat's messages
        let messagesContainer = document.getElementById(`${chatId}-messages`);
        if (messagesContainer) {
            messagesContainer.style.display = 'block';
        } else {
            console.log(`Creating new messages container for ${chatId}`);
            // Create a new container if it doesn't exist
            messagesContainer = document.createElement('div');
            messagesContainer.id = `${chatId}-messages`;
            messagesContainer.className = 'messages-container';
            
            // Add container to the DOM
            const mainChat = document.querySelector('.main-chat');
            if (mainChat) {
                const inputContainer = mainChat.querySelector('.input-container');
                if (inputContainer) {
                    mainChat.insertBefore(messagesContainer, inputContainer);
                } else {
                    mainChat.appendChild(messagesContainer);
                }
                messagesContainer.style.display = 'block';
                
                // Add empty state message to the container
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-chat-message';
                emptyMessage.innerHTML = `
                    <i class="fas fa-comments fa-3x"></i>
                    <p>Чаттка кош келиңиз!</p>
                    <p class="sub-message">Бул маектин башталышы</p>
                `;
                messagesContainer.appendChild(emptyMessage);
                } else {
                console.error('Main chat container not found');
                return;
            }
        }
        
        // Update chat header with the selected chat's information
        updateChatHeader(chatId, chatType);
        
        // Update sidebar active class
        const chatItems = document.querySelectorAll('.chat-item');
        let chatItemFound = false;
        
        chatItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === chatId) {
                item.classList.add('active');
                chatItemFound = true;
            }
        });
        
        if (!chatItemFound) {
            console.warn(`Chat item not found for ID: ${chatId}, it might be a new chat`);
        }
    };

    // Function to update the chat header with the selected chat info
    function updateChatHeader(chatId, chatType) {
        console.log(`Updating chat header for ${chatId} (${chatType})`);
        
        // Ensure consistent ID type (string)
        chatId = String(chatId);
        
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader) {
            console.error('Chat header not found');
            return;
        }
        
        // Find the chat item in the sidebar
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        
        // Default values in case we don't find the chat item
        let chatName = chatType === 'group' ? 'New Group' : 'New Chat';
        let avatarSrc = chatType === 'group' ? '/static/images/group_icon.png' : '/static/images/contact_logo.png';
        let status = '';
        
        // If we found the chat item, get info from it
        if (chatItem) {
            const nameElem = chatItem.querySelector('.chat-name');
            const avatarElem = chatItem.querySelector('.chat-avatar img');
            const statusElem = chatItem.querySelector('.chat-status');
            
            if (nameElem) chatName = nameElem.textContent;
            if (avatarElem && avatarElem.src) avatarSrc = avatarElem.src;
            if (statusElem) status = statusElem.textContent;
            } else {
            console.warn(`Chat item not found for ID: ${chatId} when updating header, using default values`);
        }
        
        // Set the header HTML
        try {
            chatHeader.innerHTML = `
                <div class="chat-header-avatar">
                    <img id="current-chat-avatar" src="${avatarSrc}" alt="${chatName}">
                </div>
                <div class="chat-header-info">
                    <h3 id="current-chat-title">${chatName}</h3>
                    <p class="chat-status">${status}</p>
                </div>
                <div class="chat-header-actions">
                    ${chatType === 'group' ? 
                        '<button class="btn-icon" onclick="window.showGroupProfile(\'' + chatId + '\')"><i class="fas fa-info-circle"></i></button>' :
                        '<button class="btn-icon" onclick="window.showContactProfile(\'' + chatId + '\')"><i class="fas fa-user"></i></button>'
                    }
                </div>
            `;
        } catch (error) {
            console.error('Error updating chat header:', error);
        }
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
    
    // Report contact button
    if (reportContactBtn) {
        reportContactBtn.addEventListener('click', () => {
            if (confirm('Бул колдонуучуга даттануу керекпи?')) {
                console.log('User reported the contact');
                showNotification('Колдонуучуга даттануу катталды', 'info');
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

    // --- Sidebar View Management --- //
    const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
    let currentSidebarView = 'chats'; // Default view

    // Function to load and display a sidebar view - make it globally accessible
    window.loadSidebarView = async function(viewName) {
        console.log(`Attempting to load sidebar view: ${viewName}`);
        
        // Find the sidebar content area
        const sidebarContentArea = document.getElementById('sidebar-content-area');
        if (!sidebarContentArea) {
            console.error('Sidebar content area not found!');
            throw new Error('Sidebar content area not found');
        }
        
        // Debug current sidebar state
        console.log(`Current sidebar HTML before loading ${viewName}:`, sidebarContentArea.innerHTML.substring(0, 100) + '...');
        console.log(`Current sidebar children:`, sidebarContentArea.children.length);

        // Special handling for returning to chats view from create-group
        if (viewName === 'chats' && currentSidebarView === 'create-group') {
            console.log('Special handling for returning to chats view from create-group');
            
            // Hide the create-group view
            const createGroupView = sidebarContentArea.querySelector('#create-group-view');
            if (createGroupView) {
                createGroupView.style.display = 'none';
                createGroupView.classList.remove('active');
            }
            
            // Save existing chat list state to avoid replacing it with fresh data
            let existingChatList = null;
            const chatView = sidebarContentArea.querySelector('#chats-view');
            if (chatView) {
                const chatList = chatView.querySelector('#chat-list');
                if (chatList && chatList.children.length > 0) {
                    existingChatList = chatList.cloneNode(true);
                    console.log('Saved existing chat list with', existingChatList.children.length, 'items');
                }
            }
            
            // Always force loading the chats view
            const templateUrl = '/templates/_sidebar_chats.html';
            try {
                const response = await fetch(templateUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                sidebarContentArea.innerHTML = html;
                
                // Restore the existing chat list if we have one
                if (existingChatList) {
                    const newChatView = sidebarContentArea.querySelector('#chats-view');
                    if (newChatView) {
                        const newChatList = newChatView.querySelector('#chat-list');
                        if (newChatList) {
                            // Replace the empty chat list with our saved one
                            newChatList.parentNode.replaceChild(existingChatList, newChatList);
                            console.log('Restored existing chat list with', existingChatList.children.length, 'items');
                        }
                    }
                }
                
                // Update current sidebar view
                currentSidebarView = 'chats';
                
                // Attach chat list listeners
                attachChatListListeners(false); // Pass false to prevent reloading contacts
                
                return;
            } catch (error) {
                console.error(`Error loading chats view: ${error}`);
                // Fall back to normal flow if this fails
            }
        }

        // Check if we should use a local mock template first
        const mockTemplate = document.getElementById(`mock-${viewName}-template`);
        if (mockTemplate) {
            console.log(`Using mock template for ${viewName}`);
            sidebarContentArea.innerHTML = mockTemplate.innerHTML;
            
            // Update current sidebar view
            currentSidebarView = viewName;
            
            // Re-attach necessary event listeners for the new view's content
            try {
                attachSidebarViewListeners(viewName);
                
                // Make sure the logout button works if it exists
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    console.log('Attaching logout event listener to button after view load (mock):', logoutBtn);
                    logoutBtn.addEventListener('click', (e) => {
                        console.log('Logout button clicked');
                        e.preventDefault();
                        logout();
                    });
                }
            } catch (listenerError) {
                console.error(`Error attaching listeners for view ${viewName}:`, listenerError);
            }
            
            // If this is the chats view, load contacts
            if (viewName === 'chats') {
                loadUserContacts();
            }
            
            return;
        }

        // Special handling for create-group view
        let templateUrl;
        if (viewName === 'create-group') {
            // Use the version with underscores for consistency
            templateUrl = `/templates/_sidebar_create_group.html`;
        } else {
            // For other views, use the regular pattern
            templateUrl = `/templates/_sidebar_${viewName.replace('-', '_').split(':')[0]}.html`;
        }
        console.log("Requesting template from URL:", templateUrl);
        
        try {
            const response = await fetch(templateUrl);
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            console.log("Received HTML content:", html.substring(0, 50) + "...");  // Log a preview
            
            // Replace content
            sidebarContentArea.innerHTML = html;
            console.log(`Successfully loaded view: ${viewName}`);

            // Make the newly loaded view active
            const loadedView = sidebarContentArea.querySelector('.sidebar-view');
            if (loadedView) {
                console.log("Found sidebar view element:", loadedView.id);
                // Remove active from any previous sibling views if they existed
                const existingViews = sidebarContentArea.querySelectorAll('.sidebar-view');
                existingViews.forEach(v => v.classList.remove('active'));
                
                // Add active to the newly loaded view
                loadedView.classList.add('active');
                console.log(`Activated view: ${loadedView.id}`);
            } else {
                console.warn('Could not find .sidebar-view element within loaded HTML.');
                console.log("Full HTML content:", html);  // Log the full HTML for debugging
            }

            currentSidebarView = viewName;
            
            // Re-attach necessary event listeners for the new view's content
            try {
                attachSidebarViewListeners(viewName);
                
                // Make sure the logout button works if it exists
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    console.log('Attaching logout event listener to button after view load:', logoutBtn);
                    logoutBtn.addEventListener('click', (e) => {
                        console.log('Logout button clicked');
                        e.preventDefault();
                        logout();
                    });
                }
            } catch (listenerError) {
                console.error(`Error attaching listeners for view ${viewName}:`, listenerError);
                // Continue with rendering the view, even if some listeners failed
            }
            
            // If this is the profile view, ensure logout button works
            if (viewName === 'profile') {
                // Specifically handle the logout button in the profile view
                const profileLogoutBtn = document.getElementById('logout-btn');
                if (profileLogoutBtn) {
                    console.log('Profile view loaded - ensuring logout button works:', profileLogoutBtn);
                    // Remove any existing event listeners
                    profileLogoutBtn.replaceWith(profileLogoutBtn.cloneNode(true));
                    const newLogoutBtn = document.getElementById('logout-btn');
                    
                    // Add the event listener
                    newLogoutBtn.addEventListener('click', (e) => {
                        console.log('Profile logout button clicked');
                        e.preventDefault();
                        logout();
                    });
                }
            }
        } catch (error) {
            console.error(`Could not load sidebar view '${viewName}':`, error);
            
            // Fallback to built-in templates if the server call fails
            const mockTemplate = document.getElementById(`mock-${viewName}-template`);
            if (mockTemplate) {
                console.log(`Falling back to mock template for ${viewName}`);
                sidebarContentArea.innerHTML = mockTemplate.innerHTML;
                
                // If this is the chats view, load contacts
                if (viewName === 'chats') {
                    loadUserContacts();
                }
                
                // Update current sidebar view
                currentSidebarView = viewName;
                
                // Re-attach necessary event listeners for the new view's content
                try {
                    attachSidebarViewListeners(viewName);
                    
                    // Make sure the logout button works if it exists
                    const logoutBtn = document.getElementById('logout-btn');
                    if (logoutBtn) {
                        console.log('Attaching logout event listener to button (fallback):', logoutBtn);
                        logoutBtn.addEventListener('click', (e) => {
                            console.log('Logout button clicked');
                            e.preventDefault();
                            logout();
                        });
                    }
                } catch (listenerError) {
                    console.error(`Error attaching listeners for view ${viewName}:`, listenerError);
                }
            } else {
                sidebarContentArea.innerHTML = `<p class="error-message">Error loading view: ${error.message}</p>`;
                throw error; // Re-throw to allow catch handlers to work
            }
        }
    }

    // Function to attach event listeners specific to the loaded view
    function attachSidebarViewListeners(viewName) {
        console.log(`Attaching listeners for view: ${viewName}`);

        // Common listeners (close button)
        const closeButtons = sidebarContentArea.querySelectorAll('.close-sidebar-view-btn');
        closeButtons.forEach(button => {
            // Remove previous listener to prevent duplicates if any
            button.replaceWith(button.cloneNode(true));
            const newButton = sidebarContentArea.querySelector(`[data-target-view="${button.dataset.targetView}"]`); // Re-select the cloned button
            if (newButton) {
                 newButton.addEventListener('click', () => {
                    const targetView = newButton.dataset.targetView || 'chats'; // Default to chats
                    console.log(`Close button clicked, returning to view: ${targetView}`);
                    loadSidebarView(targetView);
                     // Update nav button active state
                     updateNavButtons(targetView);
                });
            }
        });

        // View-specific listeners
        switch (viewName) {
            case 'chats':
                // Re-attach chat list search and item click listeners
                attachChatListListeners();
                break;
            case 'create-group':
                console.log('Attaching create-group listeners from switch case');
                // Special handling for create-group view
                setTimeout(() => {
                    // Add a small delay to ensure DOM is ready
                attachCreateGroupListeners();
                }, 100);
                break;
            case 'settings':
                attachSettingsListeners();
                break;
            case 'add-contact':
                attachAddContactListeners();
                break;
            case 'profile':
                attachProfileListeners();
                break;
        }
         // Attach common modal listeners for any modals within the view
        attachModalListeners();

        // Set up listeners for contact details
        // Only call this function if the contact details modal exists
        if (document.getElementById('contact-details-modal')) {
            setUpContactDetailsListeners();
        } else {
            console.log('Contact details modal not found, skipping listener setup');
        }
    }

    // Function to update the active state of nav buttons
    function updateNavButtons(activeView) {
        navButtons.forEach(btn => {
            if (btn.dataset.view === activeView) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Initial setup - Add listeners to nav buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewToLoad = button.dataset.view;
            if (viewToLoad && viewToLoad !== currentSidebarView) {
                 console.log(`Nav button clicked for view: ${viewToLoad}`);
                
                // Special case for create-group
                if (viewToLoad === 'create-group') {
                    loadCreateGroupView();
                } else {
                loadSidebarView(viewToLoad);
                }
                
                updateNavButtons(viewToLoad);
            }
        });
    });
    
    // Function to load real contacts for create-group view
    async function loadRealContacts() {
        console.log('Attempting to load real contacts');
        
        const sidebarContentArea = document.getElementById('sidebar-content-area');
        if (!sidebarContentArea) {
            console.error('Sidebar content area not found!');
            throw new Error('Sidebar content area not found');
        }
        
        // Try the test-create-group endpoint which should provide real contacts
        try {
            const url = '/test-create-group';
            console.log('Fetching real contacts from:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            console.log('Successfully received real contacts, length:', html.length);
            
            sidebarContentArea.innerHTML = html;
            
            // Make sure the view is visible
            const createGroupView = sidebarContentArea.querySelector('#create-group-view');
            if (createGroupView) {
                createGroupView.classList.add('active');
                createGroupView.style.display = 'flex';
                createGroupView.style.flexDirection = 'column';
                createGroupView.style.height = '100%';
                createGroupView.style.opacity = '1';
                createGroupView.style.visibility = 'visible';
                console.log('Applied visibility styles to create-group view with real contacts');
            } else {
                console.error('Could not find create-group-view element after loading real contacts');
            }
            
            currentSidebarView = 'create-group';
            attachCreateGroupListeners();
            return true; // Success
        } catch (error) {
            console.error('Failed to load real contacts:', error);
            return false; // Failed
        }
    }
    
    // Special function to load create-group view
    async function loadCreateGroupView() {
        console.log('Loading create-group view with special handler');
        
        // First try to load real contacts
        try {
            const realContactsLoaded = await loadRealContacts();
            if (realContactsLoaded) {
                console.log('Successfully loaded real contacts');
                return;
            }
        } catch (e) {
            console.error('Error trying to load real contacts:', e);
        }
        
        // If real contacts failed, continue with original function
        const sidebarContentArea = document.getElementById('sidebar-content-area');
        if (!sidebarContentArea) {
            console.error('Sidebar content area not found!');
            return;
        }
        
        // Try to use the mock template first as a fallback
        const mockTemplate = document.getElementById('mock-create-group-template');
        if (mockTemplate) {
            console.log('Using mock template for create-group');
            sidebarContentArea.innerHTML = mockTemplate.innerHTML;
            
            // Make sure the view is visible with proper styling
            const createGroupView = sidebarContentArea.querySelector('#create-group-view');
            if (createGroupView) {
                createGroupView.classList.add('active');
                createGroupView.style.display = 'flex';
                createGroupView.style.flexDirection = 'column';
                createGroupView.style.height = '100%';
                console.log('Added visibility styles to create-group view');
            } else {
                console.error('Could not find create-group-view element after inserting template');
            }
            
            currentSidebarView = 'create-group';
            attachCreateGroupListeners();
            return;
        }
        
        // If no mock template, try to fetch the template from server
        const templateUrl = '/templates/_sidebar_create_group.html';
        console.log('Requesting create-group template from:', templateUrl);
        
        try {
            const response = await fetch(templateUrl);
            console.log('Create-group template response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            console.log('Received create-group template HTML:', html.substring(0, 100) + '...');
            
            sidebarContentArea.innerHTML = html;
            currentSidebarView = 'create-group';
            
            // Attach event listeners
            attachCreateGroupListeners();
        } catch (error) {
            console.error('Error loading create-group template:', error);
            
            // Try alternate URL
            try {
                const alternateUrl = '/test-create-group';
                console.log('Trying alternate URL for create-group:', alternateUrl);
                
                const response = await fetch(alternateUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error for alternate URL! status: ${response.status}`);
                }
                
                const html = await response.text();
                sidebarContentArea.innerHTML = html;
                currentSidebarView = 'create-group';
                
                // Attach event listeners
                attachCreateGroupListeners();
            } catch (altError) {
                console.error('Error loading from alternate URL:', altError);
                sidebarContentArea.innerHTML = `<p class="error-message">Error loading create-group view</p>`;
            }
        }
    }

    // --- Specific View Listener Attachments --- //

    function attachChatListListeners(shouldLoadContacts = true) {
        console.log('Attaching chat list listeners...', shouldLoadContacts ? 'Loading contacts' : 'Reusing existing contacts');
        
        // Load contacts from server only if requested
        if (shouldLoadContacts) {
        loadUserContacts();
        }
        
        const searchInput = sidebarContentArea.querySelector('#chat-search-input');
        if (searchInput) {
            // Remove previous listener to avoid duplicates
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            newSearchInput.addEventListener('input', handleChatSearch);
        }
        
        const chatItems = sidebarContentArea.querySelectorAll('.chat-item');
        console.log(`Found ${chatItems.length} chat items to attach listeners to`);
        
        chatItems.forEach(item => {
            // Remove any existing listeners to avoid duplicates
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Handle click on entire chat item (for opening chat)
            newItem.addEventListener('click', (e) => {
                // If clicking on the avatar, don't switch chat, just show profile
                if (e.target.closest('.chat-avatar')) {
                    return;
                }
                
                const chatId = newItem.dataset.chatId;
                const chatType = newItem.dataset.chatType;
                
                console.log(`Chat item clicked: ${chatId} (${chatType})`);
                
                // Call the global switchChat function
                window.switchChat(chatId, chatType);
                
                // Mark as active in UI
                document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
                newItem.classList.add('active');
            });
            
            // Add click handler for avatar to show profile
            const avatar = newItem.querySelector('.chat-avatar');
            if (avatar) {
                avatar.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the chat switch
                    
                    const chatId = newItem.dataset.chatId;
                    const chatType = newItem.dataset.chatType;
                    
                    console.log(`Avatar clicked for: ${chatId} (${chatType})`);
                    
                    if (chatType === 'contact') {
                        showContactProfile(chatId);
                    } else if (chatType === 'group') {
                        // Group profiles can be handled separately if needed
                        toggleProfileSidebar();
                    }
                });
            }
        });
        
        // Ensure the current chat remains visually active if it's in the list
        const currentChatId = window.currentChatId;
        if (currentChatId) {
            const activeChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (activeChatItem) {
                document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
            activeChatItem.classList.add('active');
            }
        }
    }

    function attachCreateGroupListeners() {
        console.log('Attaching create group listeners...');
        
        // Get the member list element
        const memberList = document.getElementById('create-group-member-list');
        if (!memberList) {
            console.error('Member list element not found in create-group view');
            return;
        }
        
        console.log('Found member list, adding click listeners to items');
        
        // Add click listeners to existing member items
        const memberItems = memberList.querySelectorAll('.member-item');
        console.log(`Found ${memberItems.length} member items to attach listeners to`);
        
        memberItems.forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
                const memberName = item.querySelector('.member-name').textContent;
                console.log(`Member ${memberName} ${item.classList.contains('selected') ? 'selected' : 'unselected'}`);
            });
        });

        // Add search functionality
        const searchInput = document.getElementById('create-group-search-input');
         if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                const memberItems = memberList.querySelectorAll('.member-item');
                
                memberItems.forEach(item => {
                    const name = item.querySelector('.member-name').textContent.toLowerCase();
                    if (name.includes(query)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        // Add back button functionality (additional check for back button)
        const backButton = document.querySelector('.close-sidebar-view-btn[data-target-view="chats"]');
        if (backButton) {
            console.log('Found back button in create-group view, adding click listener');
            backButton.addEventListener('click', () => {
                console.log('Back button clicked, returning to chats view');
                loadSidebarView('chats');
                updateNavButtons('chats');
            });
        } else {
            console.warn('Back button not found in create-group view');
        }

        // Add create button functionality
        const createBtn = document.getElementById('create-group-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const selectedMembers = document.querySelectorAll('.member-item.selected');
                const memberIds = Array.from(selectedMembers).map(item => item.dataset.userId);
                console.log('Selected group members:', memberIds);
                
                if (memberIds.length === 0) {
                    alert('Топ түзүү үчүн жок дегенде бир мүчөнү тандаңыз');
                    return;
                }
                
                // Show the group creation modal
                showGroupCreationModal(memberIds);
            });
        } else {
            console.error('Create group button not found');
        }
    }

    // Function to show the group creation modal
    function showGroupCreationModal(memberIds) {
        console.log('Showing group creation modal for members:', memberIds);
        
        // Get or create the modal element
        let modal = document.getElementById('create-group-modal');
        if (!modal) {
            // Create the modal if it doesn't exist
            modal = document.createElement('div');
            modal.id = 'create-group-modal';
            modal.className = 'modal';
            
            // Add Kyrgyz styled modal content
            modal.innerHTML = `
                <div class="modal-content group-creation-modal">
                    <div class="modal-header">
                        <h3>Жаңы тегерек үстөлдү түзүү</h3>
                        <span class="close-modal-btn">&times;</span>
                        </div>
                    <div class="modal-body">
                        <div class="group-avatar-section">
                            <div class="avatar-preview-container">
                                <img id="new-group-avatar-preview" src="/static/images/group_icon.png" alt="Group Avatar">
                            </div>
                            <div class="avatar-buttons">
                                <button id="select-image-btn" class="btn btn-outline">Сүрөт тандоо</button>
                                <button id="remove-new-group-avatar-btn" class="btn btn-outline-danger">Өчүрүү</button>
                            </div>
                            <input type="file" id="new-group-avatar-upload" accept="image/*" style="display:none">
                        </div>
                        <div class="group-name-section">
                            <label for="new-group-name-input">Тегерек үстөлдүн аты:</label>
                            <input type="text" id="new-group-name-input" placeholder="Тегерек үстөлдүн атын киргизиңиз" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-group-creation-btn" class="btn btn-secondary">Жокко чыгаруу</button>
                        <button id="save-group-creation-btn" class="btn btn-primary">Жаратуу</button>
                    </div>
                </div>
                `;
                
            // Add the modal to the body
            document.body.appendChild(modal);
        }
        
        // Apply proper styling to match the prototype
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.borderRadius = '10px';
            modalContent.style.maxWidth = '400px';
        }
        
        const avatarPreview = modal.querySelector('#new-group-avatar-preview');
        if (avatarPreview) {
            avatarPreview.style.width = '80px';
            avatarPreview.style.height = '80px';
            avatarPreview.style.borderRadius = '50%';
            avatarPreview.style.objectFit = 'cover';
            avatarPreview.style.border = '1px solid #ddd';
        }
        
        // Store selected member IDs in a data attribute of the modal
        modal.dataset.memberIds = JSON.stringify(memberIds);
        
        // Reset form
        const nameInput = document.getElementById('new-group-name-input');
        if (nameInput) {
            nameInput.value = '';
        }
        
        // Reset avatar preview
        if (avatarPreview) {
            avatarPreview.src = '/static/images/group_icon.png';
        }
        
        // Set up event listeners for the modal
        setupGroupCreationModalListeners();
        
        // Show the modal
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        // Focus on the name input
        if (nameInput) {
            nameInput.focus();
        }
    }

    // Function to set up event listeners for the group creation modal
    function setupGroupCreationModalListeners() {
        // Close button
        const closeBtn = document.querySelector('#create-group-modal .close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('create-group-modal').style.display = 'none';
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancel-group-creation-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('create-group-modal').style.display = 'none';
            });
        }
        
        // Create button
        const createBtn = document.getElementById('save-group-creation-btn');
        if (createBtn) {
            createBtn.addEventListener('click', createNewGroup);
        }
        
        // Select image button
        const selectImageBtn = document.getElementById('select-image-btn');
        if (selectImageBtn) {
            selectImageBtn.addEventListener('click', () => {
                // Trigger the file input click
                const fileInput = document.getElementById('new-group-avatar-upload');
                if (fileInput) {
                    fileInput.click();
                }
            });
        }
        
        // Avatar upload
        const avatarInput = document.getElementById('new-group-avatar-upload');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        document.getElementById('new-group-avatar-preview').src = event.target.result;
                    };
                    reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

        // Remove avatar button
        const removeAvatarBtn = document.getElementById('remove-new-group-avatar-btn');
        if (removeAvatarBtn) {
            removeAvatarBtn.addEventListener('click', () => {
                document.getElementById('new-group-avatar-preview').src = '/static/images/group_icon.png';
                // Clear the file input
                document.getElementById('new-group-avatar-upload').value = '';
            });
        }
    }

    // Make the function available globally
    window.setupGroupCreationModalListeners = setupGroupCreationModalListeners;

    // Function to create a new group
    async function createNewGroup() {
        const modal = document.getElementById('create-group-modal');
        const nameInput = document.getElementById('new-group-name-input');
        const avatarPreview = document.getElementById('new-group-avatar-preview');
        
        if (!nameInput || !modal) {
            console.error('Required elements not found');
            return;
        }
        
        const groupName = nameInput.value.trim();
        if (!groupName) {
            alert('Тегерек үстөлдүн атын киргизиңиз');
        return;
    }
    
    try {
            // Get member IDs from data attribute
            const memberIds = JSON.parse(modal.dataset.memberIds || '[]');
            
            // Show loading state
            const createBtn = document.getElementById('save-group-creation-btn');
            if (createBtn) {
                createBtn.textContent = 'Жүктөлүүдө...';
                createBtn.disabled = true;
            }
            
            // Prepare data for API
            const groupData = {
                group_name: groupName,
                member_ids: memberIds
            };
            
            console.log('Sending group creation request:', groupData);
            
            // Call API to create group
            const response = await fetch('/api/create-group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(groupData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Group created successfully:', result);
            
            // Hide modal
            modal.style.display = 'none';
            
            // Show success message
            window.showToast('Тегерек үстөл ийгиликтүү түзүлдү');
            
            // Get the group ID
            const groupId = result.group_id;
            
            // If no group ID returned, we can't proceed
            if (!groupId) {
                throw new Error('No group ID returned from server');
            }
            
            // Return to chats view first
            await loadSidebarView('chats');
            updateNavButtons('chats');
            
            // Add some delay to ensure the DOM is fully updated
            setTimeout(() => {
                try {
                    // Check if the group chat item was already added by the server response
                    let chatItem = document.querySelector(`.chat-item[data-chat-id="${groupId}"]`);
                    
                    // If not found, manually add the group to the chat list
                    if (!chatItem) {
                        console.log('Adding new group chat item to list', groupId);
                        
                        // Create a chat item for the new group
                        const newGroupChat = {
                            id: groupId,
                            type: 'group',
                            name: groupName,
                            last_message: 'Group created',
                            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                            avatar: avatarPreview.src || '/static/images/group_icon.png'
                        };
                        
                        // Get the chat list
                        const chatList = document.getElementById('chat-list');
                        if (chatList) {
                            // Create and add the chat item
                            chatItem = createChatItem(newGroupChat);
                            
                            // Add click event
                            chatItem.addEventListener('click', () => {
                                const chatId = chatItem.dataset.chatId;
                                const chatType = chatItem.dataset.chatType;
                                console.log(`New group chat item clicked: ${chatId} (${chatType})`);
                                window.switchChat(chatId, chatType);
                                document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
                                chatItem.classList.add('active');
                            });
                            
                            // Add avatar click event
                            const avatar = chatItem.querySelector('.chat-avatar');
                            if (avatar) {
                                avatar.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    console.log(`Avatar clicked for group: ${groupId}`);
                                    window.showGroupProfile(groupId);
                                });
                            }
                            
                            // Add to the beginning of the list
                            if (chatList.firstChild) {
                                chatList.insertBefore(chatItem, chatList.firstChild);
                            } else {
                                chatList.appendChild(chatItem);
                            }
                            
                            console.log('Successfully added new group to chat list');
                        } else {
                            console.error('Chat list element not found');
                        }
                    } else {
                        console.log('Group chat item already exists in the list');
                    }
                    
                    // Now switch to the new group chat
                    console.log(`Switching to newly created group ${groupId}`);
                    window.currentChatId = groupId;
                    window.currentChatType = 'group';
                    window.switchChat(groupId, 'group');
                    
                } catch (innerError) {
                    console.error('Error during post-creation handling:', innerError);
                    window.showNotification('Group created but encountered an error displaying it. Please refresh.', 'warning');
                }
            }, 500); // Increased delay for more reliability
            
        } catch (error) {
            console.error('Error creating group:', error);
            window.showNotification('Error creating group: ' + error.message, 'error');
            
            // Reset button state
            const createBtn = document.getElementById('save-group-creation-btn');
            if (createBtn) {
                createBtn.textContent = 'Жаратуу';
                createBtn.disabled = false;
            }
        }
    }

    async function logout() {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Clear any session data
                sessionStorage.removeItem('username');
                sessionStorage.removeItem('user_id');
                
                // Redirect to login page
                window.location.href = '/';
            } else {
                console.error('Logout failed');
                showToast('Чыгууда ката кетти');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showToast('Чыгууда ката кетти');
        }
    }

    async function getPotentialContacts() {
        try {
            const response = await fetch(getApiUrl('api/potential-contacts'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching potential contacts:', error);
            return [];
        }
    }

    // Update loadUserContacts function to use mock data when API fails
function loadUserContacts() {
    console.log('Loading user contacts...');
    
    // First, check if we can locate the sidebar content area
    sidebarContentArea = document.getElementById('sidebar-content-area');
    if (!sidebarContentArea) {
        console.error('Cannot find sidebar content area');
        return;
    }
    
    // Look for the chat list view
    let chatView = sidebarContentArea.querySelector('#chats-view');
    if (!chatView) {
        // If not present, we might need to load it
        console.log('Chat view not found, creating a temporary one');
        chatView = document.createElement('div');
        chatView.id = 'chats-view';
        chatView.className = 'sidebar-view active';
        
        // Add a header for the view
        const header = document.createElement('div');
        header.className = 'view-header';
        header.innerHTML = `
            <h2>Маектер</h2>
            <div class="search-box">
                <input type="text" id="chat-search-input" placeholder="Издөө...">
                <i class="fas fa-search"></i>
            </div>
        `;
        chatView.appendChild(header);
        
        sidebarContentArea.appendChild(chatView);
    }
    
    // Now try to find the chat list container
    let chatListContainer = chatView.querySelector('.chat-list-container');
    if (!chatListContainer) {
        // Create chat list container if it doesn't exist
        console.log('Creating chat list container');
        chatListContainer = document.createElement('div');
        chatListContainer.className = 'chat-list-container scrollable-list';
        chatView.appendChild(chatListContainer);
    }
    
    // Now find or create the chat list itself
    let chatList = chatListContainer.querySelector('#chat-list');
    if (!chatList) {
        // Create chat list if it doesn't exist
        console.log('Creating chat list element');
        chatList = document.createElement('div');
        chatList.id = 'chat-list';
        chatList.className = 'chat-list';
        chatListContainer.appendChild(chatList);
    }
    
    console.log('Chat list found or created:', !!chatList);
    
    // Show loading state
    chatList.innerHTML = '<div class="loading">Loading contacts...</div>';
    
        // Create mock data for contacts
        const mockContacts = [
            {
                id: 'group1',
                type: 'group',
                name: 'AIT-CS\'24',
                last_message: 'Классикага кошумча балл берилебү?',
                timestamp: '12:38',
                avatar: '/static/images/group_icon.png',
                members: ['Эмил Агай', 'Мурат Агай', 'Нурмухаммед', 'Акбар', 'Ынтымак']
            },
            {
                id: 'user1',
                type: 'contact',
                name: 'Нурмухаммед',
                username: 'nurmuhammad',
                last_message: 'Аа, мен да кеттам, тыгым экен бул жерлер',
                timestamp: '9:00',
                avatar: '/static/images/contact_logo.png'
            },
            {
                id: 'user2',
                type: 'contact',
                name: 'Мунара Эжеке',
                username: 'munara',
                last_message: 'Сабак кандай өттү?',
                timestamp: '8:45',
                avatar: '/static/images/contact_logo.png'
            },
            {
                id: 'user3',
                type: 'contact',
                name: 'Эмил Агай',
                username: 'emil',
                last_message: 'Тапшырманы баары аткардыбы?',
                timestamp: '7:30',
                avatar: '/static/images/contact_logo.png'
            }
        ];
        
        // Try to make API call first, fallback to mock data if it fails
    fetch(getApiUrl('api/contacts'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load contacts: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
                console.log('Contacts loaded from API:', data);
            // Process contacts data and update UI
                if (data && Array.isArray(data.contacts) && data.contacts.length > 0) {
                    updateContactsList(data.contacts, chatList);
                } else {
                    console.log('No contacts returned from API, using mock data');
                    updateContactsList(mockContacts, chatList);
                    showNotification('Using demo contacts - Connect to server for real contacts', 'warning');
                }
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
                
                // Use mock data instead
                console.log('Using mock data for contacts due to error');
                updateContactsList(mockContacts, chatList);
                
                // Show notification
                showNotification('Using demo contacts - Server unavailable', 'warning');
            });
        
        // Set a timeout to ensure we show something even if the fetch hangs
        setTimeout(() => {
            const loadingEl = chatList.querySelector('.loading');
            if (loadingEl) {
                console.log('Fetch taking too long, showing mock data');
                updateContactsList(mockContacts, chatList);
            }
        }, 3000);
    }

    function updateContactsList(contacts, providedChatList = null) {
        // Store contacts in global variable for future use
        window.userContacts = contacts || [];
        
        console.log('Updating contacts list with', contacts.length, 'contacts');
        
        // Get the chat list container
        const chatList = providedChatList || document.querySelector('#chat-list');
    if (!chatList) {
            console.error('Chat list container not found');
            return;
    }
    
    // Clear existing content
    chatList.innerHTML = '';
    
        // If no contacts, show empty state
        if (!contacts || contacts.length === 0) {
            showEmptyContactsState(chatList);
            return;
        }
        
        // Create and append chat items
        contacts.forEach(contact => {
            const chatItem = createChatItem(contact);
            chatList.appendChild(chatItem);
        });
        
        // Add click listeners to the newly created chat items
        const chatItems = chatList.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // If clicking on the avatar, don't switch chat, just show profile
                if (e.target.closest('.chat-avatar')) {
                return;
            }
            
                const chatId = item.dataset.chatId;
                const chatType = item.dataset.chatType;
                
                // Call the global switchChat function
                if (typeof window.switchChat === 'function') {
                    window.switchChat(chatId, chatType);
                    
                    // Mark as active in UI
                    chatList.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }
            });
            
            // Add click handler for avatar to show profile
            const avatar = item.querySelector('.chat-avatar');
            if (avatar) {
                avatar.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the chat switch
                    
                    const chatId = item.dataset.chatId;
                    const chatType = item.dataset.chatType;
                    
                    if (chatType === 'contact') {
                        showContactProfile(chatId);
                    } else if (chatType === 'group') {
                        // Group profiles can be handled separately if needed
                        toggleProfileSidebar();
                    }
                });
            }
        });
        
        console.log('Chat list updated with', chatItems.length, 'items');
    }

    // Function to create chat item from contact data
    function createChatItem(contact) {
        // Create chat item container
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = contact.id;
        chatItem.dataset.chatType = contact.type || 'contact';
        if (contact.username) {
            chatItem.dataset.username = contact.username;
        }
        
        // Create avatar element
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'chat-avatar';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = contact.avatar || '/static/images/contact_logo.png';
        avatarImg.alt = contact.name || 'Contact';
        
        avatarDiv.appendChild(avatarImg);
        
        // Create info container
        const infoDiv = document.createElement('div');
        infoDiv.className = 'chat-info';
        
        // Create header with name and time
        const headerDiv = document.createElement('div');
        headerDiv.className = 'chat-header';
        
        const nameH3 = document.createElement('h3');
        nameH3.className = 'chat-name';
        nameH3.textContent = contact.name || 'Unknown';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-timestamp';
        timeSpan.textContent = contact.timestamp || '';
        
        headerDiv.appendChild(nameH3);
        headerDiv.appendChild(timeSpan);
        
        // Create last message display
        const lastMessageDiv = document.createElement('div');
        lastMessageDiv.className = 'last-message';
        
        const messageP = document.createElement('p');
        messageP.textContent = contact.last_message || 'No messages yet';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'message-status';
        
        lastMessageDiv.appendChild(messageP);
        lastMessageDiv.appendChild(statusSpan);
        
        // Assemble the chat item
        infoDiv.appendChild(headerDiv);
        infoDiv.appendChild(lastMessageDiv);
        
        chatItem.appendChild(avatarDiv);
        chatItem.appendChild(infoDiv);
        
        return chatItem;
    }

    // Function to show empty state when no contacts
    function showEmptyContactsState(providedChatList = null) {
        // Get chat list container
        const chatList = providedChatList || document.querySelector('#chat-list');
        if (!chatList) {
            console.error('Chat list container not found');
            return;
        }
        
        // Create empty state message
        chatList.innerHTML = `
            <div class="empty-chat-message">
                <i class="fas fa-users fa-3x"></i>
                <p>Маектешүү жок</p>
                <p class="sub-message">Контактарыңызды кошуу үчүн "Контакт кошуу" баскычын басыңыз</p>
                        </div>
                    `;
    }

    // Initialize everything when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, initializing chat system...');
        
        // Move all modals to the body to ensure they're accessible
        moveModalToBody();
        
        // Initialize UI components and load user data
        try {
            // Initialize Socket.IO connections
            if (typeof initializeSocket === 'function') {
                initializeSocket();
            }
            
            // Load user contacts
                                    loadUserContacts();
            
            // Initialize chat UI components
            const sendButton = document.querySelector('.send-button');
            const inputBox = document.querySelector('.input-box input');
            
            // Add event listeners for sending messages
            if (sendButton) {
                sendButton.addEventListener('click', function() {
                    window.sendMessage();
                });
            }
            
            if (inputBox) {
                inputBox.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        window.sendMessage();
                    }
                });
            }
            
            // Attach listeners to the main UI components
            attachModalListeners();
            
            // Ensure the create-group-modal is properly configured
            const createGroupModal = document.getElementById('create-group-modal');
            if (createGroupModal) {
                console.log('Setting up create-group-modal during initialization');
                if (typeof setupGroupCreationModalListeners === 'function') {
                    setupGroupCreationModalListeners();
                } else if (typeof window.setupGroupCreationModalListeners === 'function') {
                    window.setupGroupCreationModalListeners();
        } else {
                    console.warn('setupGroupCreationModalListeners function not found');
                }
            } else {
                console.warn('create-group-modal not found during initialization');
            }
            
            // Initialize sidebar
            if (typeof loadSidebarView === 'function') {
                // Load default view if exists
                console.log('Initializing sidebar with default view');
                loadSidebarView('chats');
            }
            
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    });

    // Helper function to show toast messages - Make it global
    window.showToast = function(message) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Set message and show toast
        toast.textContent = message;
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Debug function that can be called from console
    window.debugSidebarViews = function() {
        const sidebarContentArea = document.getElementById('sidebar-content-area');
        if (!sidebarContentArea) {
            console.error('Sidebar content area not found!');
        return;
    }
    
        console.log('--- SIDEBAR DEBUG INFO ---');
        console.log('Current sidebar view:', currentSidebarView);
        console.log('Sidebar content area HTML:', sidebarContentArea.innerHTML.substring(0, 200) + '...');
        console.log('Child elements:', sidebarContentArea.children.length);
        
        // Check if create-group view exists
        const createGroupView = document.getElementById('create-group-view');
        if (createGroupView) {
            console.log('Create group view found:', createGroupView);
            console.log('Create group view classes:', createGroupView.className);
            console.log('Create group view style display:', createGroupView.style.display);
            console.log('Create group view computed style display:', window.getComputedStyle(createGroupView).display);
            console.log('Create group view computed style visibility:', window.getComputedStyle(createGroupView).visibility);
            console.log('Create group view computed style opacity:', window.getComputedStyle(createGroupView).opacity);
            
            // Check member list
            const memberList = createGroupView.querySelector('#create-group-member-list');
            if (memberList) {
                console.log('Member list found, contains', memberList.children.length, 'members');
                } else {
                console.error('Member list not found in create-group view');
            }
        } else {
            console.error('Create group view not found in DOM');
        }
        
        // Force show create-group view
        console.log('Attempting to force show create-group view...');
        loadCreateGroupView();
    };

    // Check all modals after a short delay to ensure they're properly set up
    setTimeout(function() {
        console.log('Running delayed modal check...');
        moveModalToBody();
        
        // Log all modals in the document
        const allModals = document.querySelectorAll('.modal');
        console.log(`Found ${allModals.length} modals in the document`);
        allModals.forEach(modal => {
            console.log(`Modal #${modal.id} is in ${modal.parentElement.tagName}`);
        });
    }, 1000);
});

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Use the globally defined function instead
    return window.showNotification(message, type);
}

// Function to handle incoming messages
window.receiveMessage = function(data) {
    console.log('Processing received message:', data);
    
    // Get necessary data from the message
    const senderId = data.sender_id;
    const senderUsername = data.sender_username;
    const message = data.message;
    const timestamp = data.timestamp || new Date().toISOString();
    const groupId = data.group_id;
    
    // Get current user info to determine if this is a sent or received message
    const currentUsername = window.currentUsername || sessionStorage.getItem('username');
    const isSent = senderUsername === currentUsername;
    
    // Determine the appropriate messages container ID
    let containerId;
    if (groupId) {
        // Group message
        containerId = `${groupId}-messages`;
    } else {
        // Direct message - container ID is sender's ID for received messages
        containerId = `${senderId}-messages`;
    }
    
    // Get the messages container
    let messagesContainer = document.getElementById(containerId);
    
    // Create the container if it doesn't exist
    if (!messagesContainer) {
        console.log(`Creating new messages container: ${containerId}`);
        
        messagesContainer = document.createElement('div');
        messagesContainer.id = containerId;
        messagesContainer.className = 'messages-container';
        
        // Add the container to the DOM
        const mainChat = document.querySelector('.main-chat');
        if (mainChat) {
            const chatHeader = mainChat.querySelector('.chat-header');
            const inputContainer = mainChat.querySelector('.input-container');
            
            if (chatHeader && inputContainer) {
                mainChat.insertBefore(messagesContainer, inputContainer);
            } else {
                mainChat.appendChild(messagesContainer);
            }
        } else {
            console.error('Main chat container not found, cannot add messages container');
        return;
        }
    }
    
    // Create a message element
    const messageElement = window.createMessageElement(message, isSent, senderUsername);
    
    // Add the message to the container
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom of the container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Show a notification if the message is not from the current user
    // and the chat is not currently active
    if (!isSent && window.currentChatId !== (groupId || senderId)) {
        // Determine chat name for notification
        let chatName = senderUsername;
        
        // For groups, get the group name if possible
        if (groupId) {
            const groupItem = document.querySelector(`.chat-item[data-chat-id="${groupId}"]`);
            if (groupItem) {
                const groupNameElement = groupItem.querySelector('.chat-name');
                if (groupNameElement) {
                    chatName = groupNameElement.textContent;
                }
            }
        }
        
        // Show the notification
        window.showNotification(`${chatName}: ${message}`, 'message');
        
        // Update the unread count for the chat
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${groupId || senderId}"]`);
        if (chatItem) {
            // Find or create the unread badge
            let unreadBadge = chatItem.querySelector('.unread-badge');
            if (!unreadBadge) {
                unreadBadge = document.createElement('span');
                unreadBadge.className = 'unread-badge';
                chatItem.appendChild(unreadBadge);
            }
            
            // Get current unread count and increment
            const currentCount = parseInt(unreadBadge.textContent) || 0;
            unreadBadge.textContent = currentCount + 1;
            unreadBadge.style.display = 'flex';
        }
    }
    
    // Update the last message in the chat list
    updateChatLastMessage(groupId || senderId, message);
};

// Function to update the last message shown in chat list
function updateChatLastMessage(chatId, message) {
    // Find the chat item in the list
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (!chatItem) {
        console.warn(`Chat item not found for ID: ${chatId}`);
        return;
    }
    
    // Find the last message element
            const lastMessageEl = chatItem.querySelector('.last-message p');
            if (lastMessageEl) {
        // Truncate message if too long
        const truncatedMessage = message.length > 30 ? message.substring(0, 27) + '...' : message;
        lastMessageEl.textContent = truncatedMessage;
            }
            
            // Update timestamp
    const timestampEl = chatItem.querySelector('.chat-timestamp');
    if (timestampEl) {
        const now = new Date();
        const timeString = formatTimeForDisplay(now);
        timestampEl.textContent = timeString;
    }
    
    // Move chat to top of list if not already there
    const chatList = chatItem.parentElement;
    if (chatList && chatList.firstChild !== chatItem) {
        chatList.removeChild(chatItem);
                chatList.insertBefore(chatItem, chatList.firstChild);
    }
}

// Format time for display in chat list
function formatTimeForDisplay(timestamp) {
    let date;
    if (typeof timestamp === 'string') {
        // If timestamp is ISO string
        date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
        // If timestamp is Date object
        date = timestamp;
    } else {
        // Default to current time
        date = new Date();
    }
    
    const now = new Date();
    const todayDate = new Date().setHours(0, 0, 0, 0);
    const messageDate = new Date(date).setHours(0, 0, 0, 0);
    
    if (messageDate === todayDate) {
        // For today, just show time
        return date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
    } else {
        // For other days, show date
        return date.getDate().toString().padStart(2, '0') + '/' + 
               (date.getMonth() + 1).toString().padStart(2, '0');
    }
}

// Function to send a message
window.sendMessage = function() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Get current active chat
    const activeChatItem = document.querySelector('.chat-item.active');
    if (!activeChatItem) {
        console.error('No active chat selected');
        return;
    }
    
    const chatId = activeChatItem.dataset.chatId;
    const chatType = activeChatItem.dataset.chatType;
    
    // Ensure there's a message container for this chat
    let messagesContainer = document.getElementById(`${chatId}-messages`);
    if (!messagesContainer) {
        console.log(`Creating new messages container for chat ${chatId}`);
        messagesContainer = document.createElement('div');
        messagesContainer.id = `${chatId}-messages`;
        messagesContainer.className = 'messages-container';
        
        // Add container to the DOM
        const mainChat = document.querySelector('.main-chat');
        const inputContainer = document.querySelector('.input-container');
        if (mainChat && inputContainer) {
            mainChat.insertBefore(messagesContainer, inputContainer);
            messagesContainer.style.display = 'block';
        }
    }
    
    // Remove any empty state message
    const emptyMessage = messagesContainer.querySelector('.empty-chat-message');
    if (emptyMessage) {
        messagesContainer.removeChild(emptyMessage);
    }
    
    // Get current timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create message element with our utility function
    const messageElement = window.createMessageElement(message, true);
    
    // Add to UI
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Clear input
    messageInput.value = '';
    
    // Update the chat list to show this message
    updateChatLastMessage(chatId, message);
    
    // Send to server via API
    const formData = new FormData();
    formData.append('receiver', chatId);
    formData.append('message', message);
    formData.append('type', chatType);
    
    fetch('/api/send_message', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error sending message:', data.error);
            // Add error class to message
            messageElement.classList.add('error');
            const errorIcon = document.createElement('span');
            errorIcon.className = 'error-icon';
            errorIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            messageElement.appendChild(errorIcon);
            
            // Show error notification
            window.showNotification('Failed to send message: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        // Add error class to message
        messageElement.classList.add('error');
        
        // Show error notification
        window.showNotification('Failed to send message. Please check your connection.', 'error');
    });
};

// Function to show group profile
window.showGroupProfile = function(groupId) {
    console.log('Showing group profile for:', groupId);
    
    // Get group info from the chat item
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${groupId}"]`);
    let groupName = 'Group Chat';
    let avatarSrc = '/static/images/group_icon.png';
    
    if (chatItem) {
        const nameElem = chatItem.querySelector('.chat-name');
        const avatarElem = chatItem.querySelector('.chat-avatar img');
        
        if (nameElem) groupName = nameElem.textContent;
        if (avatarElem && avatarElem.src) avatarSrc = avatarElem.src;
    }
    
    // Update group profile sidebar content
    const profileSidebar = document.getElementById('group-profile-sidebar');
    if (profileSidebar) {
        // Set profile image
        const profileImage = profileSidebar.querySelector('#group-avatar-img');
        if (profileImage) {
            profileImage.src = avatarSrc;
            profileImage.alt = groupName;
        }

        // Set group name
        const groupNameDisplay = profileSidebar.querySelector('#group-name-display');
        if (groupNameDisplay) {
            groupNameDisplay.textContent = groupName;
        }

        // Set group ID for actions
        profileSidebar.dataset.groupId = groupId;

        // Show the sidebar
        profileSidebar.classList.add('active');
        
        // Hide the contact profile sidebar if it's open
        const contactProfileSidebar = document.getElementById('contact-profile-sidebar');
        if (contactProfileSidebar) {
            contactProfileSidebar.classList.remove('active');
        }
    } else {
        console.error('Group profile sidebar not found');
        toggleProfileSidebar(); // Fallback to generic toggle
    }
};

/**
 * Handles moving modal elements to the document body
 * This ensures modals appear on top of everything else
 */
window.moveModalToBody = function() {
    console.log('Moving modals to body...');
    
    // Get all modals in the document
    const modals = document.querySelectorAll('.modal');
    console.log(`Found ${modals.length} modals to check`);
    
    // Create a map to track which modals we've already moved
    const processedModals = new Map();
    
    // Process each modal
    modals.forEach((modal, index) => {
        const modalId = modal.id || `unnamed-modal-${index}`;
        
        // Skip if already processed this ID
        if (processedModals.has(modalId)) {
        return;
    }
    
        // If modal is not a direct child of body, move it
        if (modal.parentElement !== document.body) {
            console.log(`Moving modal ${modalId} to document body`);
            
            try {
                document.body.appendChild(modal);
                processedModals.set(modalId, true);
            } catch (error) {
                console.error(`Failed to move modal ${modalId}:`, error);
            }
        } else {
            processedModals.set(modalId, true);
        }
    });
    
    // Set up event listeners for modals
    setupModalEventListeners();
};

/**
 * Setup event listeners for all modals
 */
function setupModalEventListeners() {
    // Close buttons
    document.querySelectorAll('.modal .close-modal-btn, .modal .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

/**
 * Handle chat search input
 */
window.handleChatSearch = function(event) {
    const query = event.target.value.toLowerCase().trim();
    console.log('Searching chats for:', query);
    
    // Get all chat items
    const chatItems = document.querySelectorAll('.chat-item');
    if (!chatItems.length) {
        console.log('No chat items found to search through');
        return;
    }
    
    let matchCount = 0;
    
    // Filter chat items based on search query
    chatItems.forEach(item => {
        // Get searchable content from the chat item
        const name = item.querySelector('.chat-name')?.textContent.toLowerCase() || '';
        const lastMessage = item.querySelector('.last-message p')?.textContent.toLowerCase() || '';
        
        // Check if the query matches any part of the chat item
        if (name.includes(query) || lastMessage.includes(query)) {
            item.style.display = 'flex'; // Show matching items
            matchCount++;
        } else {
            item.style.display = 'none'; // Hide non-matching items
        }
    });
    
    // Handle no results display
    const chatList = document.getElementById('chat-list');
    let noResultsMessage = document.getElementById('no-search-results');
    
    if (matchCount === 0 && query && chatList) {
        // Create no results message if it doesn't exist
        if (!noResultsMessage) {
            noResultsMessage = document.createElement('div');
            noResultsMessage.id = 'no-search-results';
            noResultsMessage.className = 'empty-chat-message';
            noResultsMessage.innerHTML = `
                <i class="fas fa-search fa-2x"></i>
                <p>Окшош маек табылган жок</p>
                <p class="sub-message">"${query}" боюнча натыйжа жок</p>
            `;
            chatList.appendChild(noResultsMessage);
        } else {
            // Update existing message with current query
            const subMessage = noResultsMessage.querySelector('.sub-message');
            if (subMessage) {
                subMessage.textContent = `"${query}" боюнча натыйжа жок`;
            }
            noResultsMessage.style.display = 'flex';
        }
    } else if (noResultsMessage) {
        // Hide no results message if there are results or query is empty
        noResultsMessage.style.display = 'none';
    }
};