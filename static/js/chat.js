// Declare sidebarContentArea globally so it's accessible to all functions
let sidebarContentArea; 

document.addEventListener('DOMContentLoaded', () => {
    // Hide all modals at startup
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    // Initialize sidebarContentArea
    sidebarContentArea = document.getElementById('sidebar-content-area');

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
        const containerId = `${currentChatId}-messages`;
        console.log('Attempting to find messages container with ID:', containerId);
        const container = document.getElementById(containerId);
        console.log('Found container:', container);
        return container;
    }

    // Function to send message
    function sendMessage(message) {
        console.log('sendMessage called for chat ID:', currentChatId, 'Type:', currentChatType);
        if (!message.trim()) return;

        const messagesContainer = getActiveMessagesContainer();
        if (!messagesContainer) {
            console.error('Could not find the active messages container!');
            return;
        }

        console.log('Appending message to container:', messagesContainer.id);
        const messageElement = createMessageElement(message, true);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        inputBox.value = '';
        console.log('Message sent and input cleared.');

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

    // Global switchChat function to ensure it's available for dynamically created elements
    window.switchChat = function(chatId, chatType) {
        console.log('Switching chat to ID:', chatId, 'Type:', chatType);
        
        // Update current chat tracking
        window.currentChatId = chatId;
        window.currentChatType = chatType;
        
        // Find all message containers
        const messagesContainers = document.querySelectorAll('.messages-container');
        
        // Hide all message containers
        messagesContainers.forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none';
        });
        
        // Try to find the target container
        let targetContainer = document.getElementById(`${chatId}-messages`);
        
        // If the container doesn't exist, create it
        if (!targetContainer) {
            console.log('Creating new messages container for chat:', chatId);
            
            // Create a new message container
            targetContainer = document.createElement('div');
            targetContainer.className = 'messages-container';
            targetContainer.id = `${chatId}-messages`;
            targetContainer.style.display = 'flex';
            targetContainer.style.flexDirection = 'column';
            
            // Add empty state message
            targetContainer.innerHTML = `
                <div class="empty-chat-message">
                    <i class="fas fa-comments fa-3x"></i>
                    <p>Маек баштоо үчүн билдирүү жазыңыз</p>
                </div>
            `;
            
            // Get the main chat area and add the new container
            const mainChatArea = document.querySelector('.main-chat');
            if (mainChatArea) {
                // Find where to insert (after the last messages container)
                const lastContainer = mainChatArea.querySelector('.messages-container:last-child');
                if (lastContainer) {
                    lastContainer.insertAdjacentElement('afterend', targetContainer);
                } else {
                    // If no containers exist, insert after the header
                    const chatHeader = mainChatArea.querySelector('.chat-header');
                    if (chatHeader) {
                        chatHeader.insertAdjacentElement('afterend', targetContainer);
                    } else {
                        // Last resort - just append to main chat area
                        mainChatArea.appendChild(targetContainer);
                    }
                }
            } else {
                console.error('Main chat area not found');
                return;
            }
        }
        
        // Show and activate the target container
        targetContainer.classList.add('active');
        targetContainer.style.display = 'flex';
        targetContainer.scrollTop = targetContainer.scrollHeight; // Scroll to bottom
        
        // Update chat header
        updateChatHeader(chatId, chatType);
        
        // Close any open sidebars
        const groupProfileSidebar = document.getElementById('group-profile-sidebar');
        const contactProfileSidebar = document.getElementById('contact-profile-sidebar');
        
        if (groupProfileSidebar) groupProfileSidebar.classList.remove('active');
        if (contactProfileSidebar) contactProfileSidebar.classList.remove('active');
    }

    // Helper function to update the chat header
    function updateChatHeader(chatId, chatType) {
        // Find the chat item
        const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        if (!chatItem) {
            console.warn('Chat item not found for ID:', chatId);
            return;
        }
        
        // Get chat name from the item
        const chatName = chatItem.querySelector('.chat-name')?.textContent || 'Unknown Chat';
        
        // Update the header title
        const headerTitle = document.getElementById('current-chat-title');
        if (headerTitle) headerTitle.textContent = chatName;
        
        // Update subtitle based on chat type
        const subtitle = document.getElementById('current-chat-subtitle');
        if (subtitle) {
            if (chatType === 'group') {
                subtitle.textContent = 'Группа менен маек';
            } else {
                subtitle.textContent = 'Жеке маек';
            }
        }
        
        // Update avatar in header
        const chatAvatar = chatItem.querySelector('.chat-avatar img')?.src || '/static/images/contact_logo.png';
        const headerAvatar = document.getElementById('current-chat-avatar');
        if (headerAvatar) headerAvatar.src = chatAvatar;
        
        // Update sidebar profile elements based on chat type
        if (chatType === 'group') {
            const groupNameDisplay = document.getElementById('group-name-display');
            const groupAvatarImg = document.getElementById('group-avatar-img');
            
            if (groupNameDisplay) groupNameDisplay.textContent = chatName;
            if (groupAvatarImg) groupAvatarImg.src = chatAvatar;
        } else {
            const contactNameDisplay = document.getElementById('contact-name-display');
            const contactAvatarImg = document.getElementById('contact-avatar-img');
            
            if (contactNameDisplay) contactNameDisplay.textContent = chatName;
            if (contactAvatarImg) contactAvatarImg.src = chatAvatar;
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

    // --- Sidebar View Management --- //
    const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
    let currentSidebarView = 'chats'; // Default view

    // Function to load and display a sidebar view - make it globally accessible
    window.loadSidebarView = async function(viewName) {
        console.log(`Attempting to load sidebar view: ${viewName}`);
        if (!sidebarContentArea) {
            console.error('Sidebar content area not found!');
            return;
        }

        // Construct the URL for the template snippet
        const templateUrl = `/templates/_sidebar_${viewName.replace('-', '_')}.html`;
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
            } catch (listenerError) {
                console.error(`Error attaching listeners for view ${viewName}:`, listenerError);
                // Continue with rendering the view, even if some listeners failed
            }
        } catch (error) {
            console.error(`Could not load sidebar view '${viewName}':`, error);
            sidebarContentArea.innerHTML = `<p class="error-message">Error loading view: ${error.message}</p>`;
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
                attachCreateGroupListeners();
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
                loadSidebarView(viewToLoad);
                updateNavButtons(viewToLoad);
            }
        });
    });

    // --- Specific View Listener Attachments --- //

    function attachChatListListeners() {
        console.log('Attaching chat list listeners...');
        
        // Load contacts from server
        loadUserContacts();
        
        const searchInput = sidebarContentArea.querySelector('#chat-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleChatSearch);
        }
        const chatItems = sidebarContentArea.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                const chatType = item.dataset.chatType;
                switchChat(chatId, chatType);
            });
        });
         // Ensure the current chat remains visually active if it's in the list
        const activeChatItem = sidebarContentArea.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (activeChatItem) {
            sidebarContentArea.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
            activeChatItem.classList.add('active');
        }
    }

    function attachCreateGroupListeners() {
        console.log('Attaching create group listeners...');
        const memberItems = sidebarContentArea.querySelectorAll('.member-item');
        memberItems.forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
                 // Update selection indicator (visual toggle handled by CSS)
            });
        });

        const createBtn = sidebarContentArea.querySelector('#create-group-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const selectedMembers = sidebarContentArea.querySelectorAll('.member-item.selected');
                const memberIds = Array.from(selectedMembers).map(item => item.dataset.userId);
                console.log('Create group with members:', memberIds);
                // Add actual group creation logic here (e.g., API call)
                alert(`Group creation requested with members: ${memberIds.join(', ')}`);
                loadSidebarView('chats'); // Go back to chats after requesting creation
                updateNavButtons('chats');
            });
        }
        // Add search functionality if needed
        const searchInput = sidebarContentArea.querySelector('#create-group-search-input');
         if (searchInput) {
             // Add input event listener for search
         }
    }

    function attachSettingsListeners() {
        console.log('Attaching settings listeners...');
        const adminBtn = sidebarContentArea.querySelector('#admin-page-btn');
        const pwdBtn = sidebarContentArea.querySelector('#change-password-btn');
        const langSelect = sidebarContentArea.querySelector('#language-select');

        if (adminBtn) adminBtn.addEventListener('click', () => { alert('Админдик бетке өтүү clicked'); });
        if (pwdBtn) pwdBtn.addEventListener('click', () => { alert('Сыр сөздү өзгөртүү clicked'); });
        if (langSelect) langSelect.addEventListener('change', (e) => { alert(`Тил өзгөртүү: ${e.target.value}`); });
    }

    function attachAddContactListeners() {
        console.log('Attaching add contact listeners...');
        
        // Make sure modals are properly in the body
        moveModalToBody();
        
        // Elements for potential contacts view
        const searchInput = sidebarContentArea?.querySelector('#add-contact-search-input');
        const contactList = sidebarContentArea?.querySelector('#add-contact-list');
        const loadingMessage = sidebarContentArea?.querySelector('#loading-contacts');
        const emptyMessage = sidebarContentArea?.querySelector('#empty-users-message');
        const addContactBtn = sidebarContentArea?.querySelector('#add-selected-contact-btn');
        
        console.log('Add contact button found in sidebar:', !!addContactBtn);
        
        // Reset the disabled state of the button
        if (addContactBtn) {
            addContactBtn.disabled = true;
            console.log('Add contact button reset to disabled state');
            
            // Create a new clone of the button to remove existing listeners
            const newBtn = addContactBtn.cloneNode(true);
            addContactBtn.parentNode.replaceChild(newBtn, addContactBtn);
            
            // Add event listener to the add contact button
            newBtn.addEventListener('click', () => {
                console.log('Add contact button clicked');
                
                if (!contactList) {
                    console.error('Contact list element not found');
                    return;
                }
                
                const selectedContact = contactList.querySelector('.contact-item.selected');
                if (!selectedContact) {
                    showToast('Контакт тандалган жок');
                    return;
                }
                
                // Get the contact details
                const contactId = selectedContact.dataset.userId;
                const contactUsername = selectedContact.querySelector('.contact-name')?.textContent || 'Unknown';
                const avatarImg = selectedContact.querySelector('img');
                const avatarSrc = avatarImg ? avatarImg.src : '/static/images/contact_logo.png';
                
                console.log('Selected contact for adding:', contactId, contactUsername);
                
                // Create a direct HTML modal instead of using fancy functions
                const modalHtml = `
                <div id="direct-contact-modal" class="modal" style="display: flex !important; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999999; justify-content: center; align-items: center;">
                    <div class="modal-content" style="background: white; padding: 20px; border-radius: 8px; width: 80%; max-width: 400px;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                            <h4 style="margin: 0; font-size: 18px;">Контакт аты</h4>
                            <span class="close-btn" style="cursor: pointer; font-size: 24px;" onclick="document.getElementById('direct-contact-modal').remove();">&times;</span>
                        </div>
                        <div class="modal-body" style="margin-bottom: 15px;">
                            <p>Бул контакт үчүн атты киргизиңиз:</p>
                            <div style="display: flex; align-items: center; margin-bottom: 15px; gap: 10px;">
                                <img src="${avatarSrc}" alt="${contactUsername}" style="width: 50px; height: 50px; border-radius: 50%;">
                                <span>${contactUsername}</span>
                            </div>
                            <div style="margin-top: 15px;">
                                <input type="text" id="direct-contact-name" value="${contactUsername}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                                <small style="color: #666; font-size: 12px;">Бул колдонуучу үчүн жергиликтүү гана ат.</small>
                                <input type="hidden" id="direct-contact-id" value="${contactId}">
                            </div>
                        </div>
                        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                            <button style="padding: 8px 16px; background: #f1f1f1; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;" onclick="document.getElementById('direct-contact-modal').remove();">Жокко чыгаруу</button>
                            <button id="direct-confirm-btn" style="padding: 8px 16px; background: #128c7e; color: white; border: none; border-radius: 4px; cursor: pointer;">Кошуу</button>
                        </div>
                    </div>
                </div>
                `;
                
                // Remove any existing modals
                const existingModal = document.getElementById('direct-contact-modal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                // Add the modal to the DOM
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                // Set up confirm button
                document.getElementById('direct-confirm-btn').addEventListener('click', async function() {
                    const modal = document.getElementById('direct-contact-modal');
                    const nameInput = document.getElementById('direct-contact-name');
                    const idInput = document.getElementById('direct-contact-id');
                    
                    const displayName = nameInput.value.trim();
                    const contactId = idInput.value;
                    
                    if (!displayName) {
                        showToast('Контакт аты бош боло албайт');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/add-contact', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                contact_id: contactId,
                                display_name: displayName
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                            showToast('Контакт ийгиликтүү кошулду');
                            modal.remove();
                            
                            // Remove the added contact from the list
                            selectedContact.remove();
                            
                            // Reset button
                            newBtn.disabled = true;
                            
                            // Refresh contacts
                            loadUserContacts();
                        } else {
                            showToast(`Ката: ${result.message}`);
                        }
                    } catch (error) {
                        console.error('Error adding contact:', error);
                        showToast('Контакт кошууда ката кетти');
                    }
                });
            });
        }
        
        // Initialize UI - Only if required elements exist
        if (contactList && loadingMessage) {
            initializePotentialContacts();
        } else {
            console.warn('Missing required DOM elements for the contact list');
        }
        
        // Set up event listeners for search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => handleContactSearch(e.target.value));
        }
    }

    // Helper function to show toast messages
    function showToast(message) {
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

    // --- Search Handlers --- //
    function handleChatSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const chatItems = sidebarContentArea.querySelectorAll('#chat-list .chat-item');
        chatItems.forEach(item => {
            const name = item.querySelector('.chat-name')?.textContent.toLowerCase() || '';
            const lastMessage = item.querySelector('.last-message')?.textContent.toLowerCase() || '';
            if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // --- Initial Load --- //
    // Load the default view (chats) when the page loads
    // loadSidebarView('chats'); // Load chats initially - OR keep pre-rendered HTML
    attachChatListListeners(); // Attach listeners to the pre-rendered chat list
    attachModalListeners(); // Attach listeners for any existing modals

    // Re-attach main chat functionality listeners (if they were in DOMContentLoaded)
    // Example:
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
         chatForm.addEventListener('submit', sendMessage);
     }

    // Find references to kg_flag_icon.png and update them
    const flagIconPath = '/static/images/contact_logo.png';  // Use contact logo as a fallback
    // Update any DOM elements that reference this icon
    if (document.querySelectorAll) {  // Check if document.querySelectorAll is available
        const flagImages = document.querySelectorAll('img[src*="kg_flag_icon.png"]');
        if (flagImages) {  // Ensure the collection exists
            flagImages.forEach(img => {
                if (img && typeof img === 'object' && 'src' in img) {  // Ensure img is a valid object with src property
                    img.src = flagIconPath;
                }
            });
        }
    }

    // Move modals to body to ensure they display properly
    moveModalToBody();

}); // End DOMContentLoaded 

// Add this missing function
function loadUserContacts() {
    console.log('Loading user contacts...');
    
    // First, check if we can locate the sidebar content area
    const sidebarContentArea = document.getElementById('sidebar-content-area');
    if (!sidebarContentArea) {
        console.error('Cannot find sidebar content area');
        return;
    }
    
    // Look for the chat list view
    let chatView = sidebarContentArea.querySelector('#chats-view');
    if (!chatView) {
        // If not present, we might need to load it
        console.log('Chat view not found, attempting to create a temporary one');
        chatView = document.createElement('div');
        chatView.id = 'chats-view';
        chatView.className = 'sidebar-view';
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
    
    // Make API call to get user contacts
    fetch('/api/contacts')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load contacts');
            }
            return response.json();
        })
        .then(data => {
            console.log('Contacts loaded:', data);
            // Process contacts data and update UI
            updateContactsList(data, chatList);
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            // Show error message or empty state
            showEmptyContactsState(chatList);
        });
}

function updateContactsList(contacts, providedChatList = null) {
    // Use the provided chat list or find it
    let chatList = providedChatList;
    
    if (!chatList) {
        // Try to find the chat list
        chatList = document.querySelector('#chat-list');
        
        if (!chatList) {
            console.error('Chat list element not found');
            return;
        }
    }
    
    if (!contacts || contacts.length === 0) {
        showEmptyContactsState(chatList);
        return;
    }

    // Clear any existing empty state messages
    const emptyState = chatList.querySelector('.empty-chat-message');
    if (emptyState) {
        emptyState.remove();
    }

    // Process each contact and update or create chat items
    contacts.forEach(contact => {
        // Use existing chat items or create new ones as needed
        const existingItem = chatList.querySelector(`.chat-item[data-chat-id="${contact.id}"]`);
        if (existingItem) {
            // Update existing item if needed
            updateChatItem(existingItem, contact);
        } else {
            // Create new chat item
            const newItem = createChatItem(contact);
            chatList.appendChild(newItem);
        }
    });
}

function createChatItem(contact) {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.dataset.chatId = contact.id;
    item.dataset.chatType = contact.is_group ? 'group' : 'contact';
    
    const avatarSrc = contact.avatar_url || '/static/images/contact_logo.png';
    const lastMessage = contact.last_message || 'No messages yet';
    const lastMessageTime = contact.last_message_time || '';
    
    item.innerHTML = `
        <div class="chat-avatar">
            <img src="${avatarSrc}" alt="${contact.name}">
        </div>
        <div class="chat-info">
            <div class="chat-header">
                <h3 class="chat-name">${contact.name}</h3>
                <span class="time">${lastMessageTime}</span>
            </div>
            <div class="last-message">
                <p>${lastMessage}</p>
                ${contact.unread_count ? `<div class="message-status unread">${contact.unread_count}</div>` : ''}
            </div>
        </div>
    `;
    
    // Add click event listener
    item.addEventListener('click', () => {
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        switchChat(contact.id, contact.is_group ? 'group' : 'contact');
    });
    
    return item;
}

function updateChatItem(item, contact) {
    // Update relevant properties of an existing chat item
    const nameElement = item.querySelector('.chat-name');
    if (nameElement) nameElement.textContent = contact.name;
    
    const lastMessageElement = item.querySelector('.last-message p');
    if (lastMessageElement && contact.last_message) {
        lastMessageElement.textContent = contact.last_message;
    }
    
    const timeElement = item.querySelector('.time');
    if (timeElement && contact.last_message_time) {
        timeElement.textContent = contact.last_message_time;
    }
    
    // Update unread count if applicable
    const unreadElement = item.querySelector('.message-status');
    if (contact.unread_count) {
        if (unreadElement) {
            unreadElement.textContent = contact.unread_count;
        } else {
            const newUnread = document.createElement('div');
            newUnread.className = 'message-status unread';
            newUnread.textContent = contact.unread_count;
            item.querySelector('.last-message').appendChild(newUnread);
        }
    } else if (unreadElement) {
        unreadElement.remove();
    }
}

function showEmptyContactsState(providedChatList = null) {
    // Use the provided chat list or find it
    let chatList = providedChatList;
    
    if (!chatList) {
        // Try to find the chat list
        chatList = document.querySelector('#chat-list');
        
        if (!chatList) {
            console.error('Chat list element not found for empty state');
            return;
        }
    }
    
    // Clear existing content
    chatList.innerHTML = '';
    
    // Create empty state message
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-chat-message';
    emptyState.innerHTML = `
        <i class="fas fa-user-friends fa-3x"></i>
        <p>Контакт тизмеңиз бош</p>
        <p class="sub-message">Контакт кошуу үчүн "Контакт кошуу" баскычын басыңыз</p>
    `;
    
    chatList.appendChild(emptyState);
}

// Function to attach listeners for modals (generic close buttons)
function attachModalListeners() {
    console.log('Attaching modal listeners...');
    const modals = document.querySelectorAll('.modal'); // Find all modals
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal-btn');
        if (closeBtn) {
            // Clone to remove potential old listeners
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        // Optional: Close modal if clicking outside the content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Add cancel button listeners
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function attachProfileListeners() {
    console.log('Attaching profile listeners...');
    // Edit Name
    const editNameBtn = sidebarContentArea.querySelector('#edit-profile-name-btn');
    const editNameModal = document.getElementById('edit-profile-name-modal');
    const nameInput = document.getElementById('profile-name-input');
    const saveNameBtn = document.getElementById('save-profile-name-btn');
    const profileNameDisplay = sidebarContentArea.querySelector('#user-profile-name');

    if (editNameBtn && editNameModal) {
        editNameBtn.addEventListener('click', () => {
            nameInput.value = profileNameDisplay.textContent;
            editNameModal.style.display = 'flex';
        });
    }
    if (saveNameBtn && profileNameDisplay) {
        saveNameBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            if (newName) {
                profileNameDisplay.textContent = newName;
                // Add logic to save the name to the backend
                fetch('/api/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: newName })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast('Аты ийгиликтүү өзгөртүлдү');
                    } else {
                        showToast('Ат өзгөртүүдө ката кетти');
                    }
                })
                .catch(error => {
                    console.error('Error updating profile name:', error);
                    showToast('Ат өзгөртүүдө ката кетти');
                });
            }
            editNameModal.style.display = 'none';
        });
    }

    // Edit Info
    const editInfoBtn = sidebarContentArea.querySelector('#edit-profile-info-btn');
    const editInfoModal = document.getElementById('edit-profile-info-modal');
    const infoInput = document.getElementById('profile-info-input');
    const saveInfoBtn = document.getElementById('save-profile-info-btn');
    const profileInfoDisplay = sidebarContentArea.querySelector('#user-profile-info');

    if (editInfoBtn && editInfoModal) {
        editInfoBtn.addEventListener('click', () => {
            infoInput.value = profileInfoDisplay.textContent;
            editInfoModal.style.display = 'flex';
        });
    }
    if (saveInfoBtn && profileInfoDisplay) {
        saveInfoBtn.addEventListener('click', () => {
            const newInfo = infoInput.value.trim();
            profileInfoDisplay.textContent = newInfo || 'Маалымат жок'; // Display placeholder if empty
            
            // Add logic to save the info to the backend
            fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ info: newInfo })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Маалымат ийгиликтүү өзгөртүлдү');
                } else {
                    showToast('Маалымат өзгөртүүдө ката кетти');
                }
            })
            .catch(error => {
                console.error('Error updating profile info:', error);
                showToast('Маалымат өзгөртүүдө ката кетти');
            });
            
            editInfoModal.style.display = 'none';
        });
    }

    // Edit Avatar
    const avatarUploadInput = document.getElementById('profile-avatar-upload');
    const avatarDisplay = sidebarContentArea.querySelector('#user-profile-avatar');
    if (avatarUploadInput && avatarDisplay) {
        avatarUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarDisplay.src = e.target.result;
                    
                    // Add logic to upload the avatar to the backend
                    const formData = new FormData();
                    formData.append('avatar', file);
                    
                    fetch('/api/update-profile-avatar', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            showToast('Сүрөт ийгиликтүү өзгөртүлдү');
                        } else {
                            showToast('Сүрөт өзгөртүүдө ката кетти');
                        }
                    })
                    .catch(error => {
                        console.error('Error updating profile avatar:', error);
                        showToast('Сүрөт өзгөртүүдө ката кетти');
                    });
                }
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Logout
    const logoutBtn = sidebarContentArea.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
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
        });
    }
}

// Function to handle the contact details listeners
function setUpContactDetailsListeners() {
    try {
        console.log('Setting up contact details listeners');
        // Check if required elements exist
        const detailsModal = document.getElementById('contact-details-modal');
        
        if (!detailsModal) {
            console.log('Contact details modal not found, skipping listener setup');
            return; // Exit early if modal doesn't exist
        }
        
        // Start chat button
        const startChatBtn = detailsModal.querySelector('#start-chat-btn');
        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                const contactId = startChatBtn.dataset.contactId;
                
                console.log('Starting chat with contact ID:', contactId);
                
                // Switch to the chat view
                detailsModal.style.display = 'none';
                loadSidebarView('chats');
                updateNavButtons('chats');
                
                // Select the chat in the list
                const chatItem = document.querySelector(`.chat-item[data-chat-id="${contactId}"]`);
                if (chatItem) {
                    chatItem.click();
                } else {
                    // If chat item doesn't exist yet (new contact), create it dynamically
                    console.log('Chat item not found, refreshing contacts');
                    loadUserContacts();
                    
                    // Try to select the chat after contacts are loaded
                    setTimeout(() => {
                        const newChatItem = document.querySelector(`.chat-item[data-chat-id="${contactId}"]`);
                        if (newChatItem) newChatItem.click();
                    }, 500);
                }
            });
        }
        
        // Edit contact name button
        const editContactNameBtn = detailsModal.querySelector('#edit-details-contact-name-btn');
        if (editContactNameBtn) {
            editContactNameBtn.addEventListener('click', () => {
                const contactId = editContactNameBtn.dataset.contactId;
                const detailsName = detailsModal.querySelector('#details-contact-name');
                const currentName = detailsName ? detailsName.textContent : '';
                
                // Create or find the edit name modal
                let editNameModal = document.getElementById('edit-contact-name-modal');
                
                if (!editNameModal) {
                    // Create it dynamically
                    editNameModal = document.createElement('div');
                    editNameModal.id = 'edit-contact-name-modal';
                    editNameModal.className = 'modal';
                    
                    const modalContent = document.createElement('div');
                    modalContent.className = 'modal-content';
                    
                    // Add modal header
                    const modalHeader = document.createElement('div');
                    modalHeader.className = 'modal-header';
                    modalHeader.innerHTML = `
                        <h4>Контакт атын өзгөртүү</h4>
                        <span class="close-modal-btn">&times;</span>
                    `;
                    
                    // Add modal body
                    const modalBody = document.createElement('div');
                    modalBody.className = 'modal-body';
                    modalBody.innerHTML = `
                        <div class="form-group">
                            <label for="edit-contact-name-input">Жаңы ат:</label>
                            <input type="text" id="edit-contact-name-input" class="form-control" value="${currentName}">
                            <input type="hidden" id="edit-contact-id" value="${contactId}">
                        </div>
                    `;
                    
                    // Add modal footer
                    const modalFooter = document.createElement('div');
                    modalFooter.className = 'modal-footer';
                    modalFooter.innerHTML = `
                        <button class="btn btn-secondary cancel-btn">Жокко чыгаруу</button>
                        <button class="btn btn-primary" id="save-contact-name-btn">Сактоо</button>
                    `;
                    
                    // Assemble modal
                    modalContent.appendChild(modalHeader);
                    modalContent.appendChild(modalBody);
                    modalContent.appendChild(modalFooter);
                    editNameModal.appendChild(modalContent);
                    
                    // Add to document
                    document.body.appendChild(editNameModal);
                    
                    // Add event listeners
                    const closeBtn = editNameModal.querySelector('.close-modal-btn');
                    const cancelBtn = editNameModal.querySelector('.cancel-btn');
                    
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            editNameModal.style.display = 'none';
                        });
                    }
                    
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            editNameModal.style.display = 'none';
                        });
                    }
                    
                    // Save button functionality
                    const saveContactNameBtn = editNameModal.querySelector('#save-contact-name-btn');
                    if (saveContactNameBtn) {
                        saveContactNameBtn.addEventListener('click', async () => {
                            const editContactId = editNameModal.querySelector('#edit-contact-id');
                            const editNameInput = editNameModal.querySelector('#edit-contact-name-input');
                            
                            const contactId = editContactId ? editContactId.value : '';
                            const newName = editNameInput ? editNameInput.value.trim() : '';
                            
                            if (!newName) {
                                showToast('Контакт аты бош боло албайт');
                                return;
                            }
                            
                            try {
                                const response = await fetch('/api/update-contact-name', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        contact_id: contactId,
                                        display_name: newName
                                    })
                                });
                                
                                const result = await response.json();
                                
                                if (response.ok) {
                                    showToast('Контакт аты өзгөртүлдү');
                                    editNameModal.style.display = 'none';
                                    
                                    // Update detail modal name
                                    if (detailsName) detailsName.textContent = newName;
                                    
                                    // Update the contact name in UI
                                    const contactItem = document.querySelector(`.chat-item[data-chat-id="${contactId}"]`);
                                    if (contactItem) {
                                        const nameElement = contactItem.querySelector('.chat-name');
                                        if (nameElement) nameElement.textContent = newName;
                                    }
                                    
                                    // If this is the currently selected chat, update the header
                                    if (window.currentChatId === contactId) {
                                        const headerTitle = document.getElementById('current-chat-title');
                                        if (headerTitle) headerTitle.textContent = newName;
                                    }
                                    
                                    // Refresh contacts to ensure everything is updated
                                    loadUserContacts();
                                } else {
                                    showToast(`Ката: ${result.message}`);
                                }
                            } catch (error) {
                                console.error('Error updating contact name:', error);
                                showToast('Контакт атын өзгөртүүдө ката кетти');
                            }
                        });
                    }
                    
                    // Modal click outside to close
                    editNameModal.addEventListener('click', (event) => {
                        if (event.target === editNameModal) {
                            editNameModal.style.display = 'none';
                        }
                    });
                } else {
                    // Modal exists, update its content
                    const editContactId = editNameModal.querySelector('#edit-contact-id');
                    const editNameInput = editNameModal.querySelector('#edit-contact-name-input');
                    
                    if (editContactId) editContactId.value = contactId;
                    if (editNameInput) editNameInput.value = currentName;
                }
                
                // Hide details modal and show edit modal
                detailsModal.style.display = 'none';
                editNameModal.style.display = 'flex';
                
                // Focus the input field
                const input = editNameModal.querySelector('#edit-contact-name-input');
                if (input) setTimeout(() => input.focus(), 100);
            });
        }
        
        // Report contact button
        const reportContactBtn = detailsModal.querySelector('#report-contact-btn');
        if (reportContactBtn) {
            reportContactBtn.addEventListener('click', () => {
                if (confirm('Бул колдонуучуга даттануу керекпи?')) {
                    showToast('Колдонуучуга даттануuңuз ийгиликтүү жөнөтүлдү');
                    detailsModal.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error('Error setting up contact details listeners:', error);
    }
}

// Function to fetch potential contacts
async function initializePotentialContacts() {
    try {
        // Use the sidebar-specific elements
        const contactList = sidebarContentArea?.querySelector('#add-contact-list');
        const loadingMessage = sidebarContentArea?.querySelector('#loading-contacts');
        const emptyMessage = sidebarContentArea?.querySelector('#empty-users-message');
        const addContactBtn = sidebarContentArea?.querySelector('#add-selected-contact-btn');
        
        console.log('Initializing potential contacts with elements:', {
            contactList: !!contactList,
            loadingMessage: !!loadingMessage,
            emptyMessage: !!emptyMessage
        });
        
        if (!contactList || !loadingMessage) {
            console.error('Required DOM elements for contacts not found');
            return;
        }
        
        // Reset the add button to disabled state
        if (addContactBtn) {
            addContactBtn.disabled = true;
        }
        
        loadingMessage.style.display = 'block';
        if (emptyMessage) emptyMessage.style.display = 'none';
        
        console.log('Fetching potential contacts from API...');
        
        // Mock data for testing if needed
        // Uncomment this and comment out the fetch if you want to test with mock data
        /*
        const mockData = {
            users: [
                { id: '1', username: 'user1', email: 'user1@example.com', avatar: null },
                { id: '2', username: 'user2', email: 'user2@example.com', avatar: null },
                { id: '3', username: 'user3', email: 'user3@example.com', avatar: null }
            ]
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = mockData;
        */
        
        const response = await fetch('/api/potential-contacts');
        
        if (!response.ok) {
            throw new Error('Failed to fetch potential contacts');
        }
        
        const data = await response.json();
        console.log('Potential contacts loaded:', data);
        
        // Clear the contacts list except for loading and empty messages
        Array.from(contactList.children)
            .filter(child => !child.matches('#loading-contacts, #empty-users-message'))
            .forEach(child => child.remove());
        
        // Process the potential contacts
        if (data.users && data.users.length > 0) {
            data.users.forEach(user => {
                const contactItem = createContactItem(user);
                contactList.appendChild(contactItem);
            });
            
            console.log(`Added ${data.users.length} contact items to the list`);
            loadingMessage.style.display = 'none';
            
            // Add click listeners to contact items
            addContactItemListeners();
        } else {
            console.log('No users found');
            loadingMessage.style.display = 'none';
            if (emptyMessage) emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading potential contacts:', error);
        const loadingMessage = sidebarContentArea?.querySelector('#loading-contacts');
        const emptyMessage = sidebarContentArea?.querySelector('#empty-users-message');
        
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
            const messageP = emptyMessage.querySelector('p');
            if (messageP) messageP.textContent = 'Контакттерди жүктөөдө ката кетти';
        }
        
        // Create a mock contact for testing if needed (uncomment to use)
        /*
        const contactList = sidebarContentArea?.querySelector('#add-contact-list');
        if (contactList) {
            const mockUser = { id: '999', username: 'Test User', email: 'test@example.com', avatar: null };
            const contactItem = createContactItem(mockUser);
            contactList.appendChild(contactItem);
            addContactItemListeners();
        }
        */
    }
}

// Function to create a contact item element for potential contacts
function createContactItem(user) {
    const item = document.createElement('li');
    item.className = 'contact-item';
    item.dataset.userId = user.id;
    
    item.innerHTML = `
        <div class="contact-avatar">
            <img src="${user.avatar || '/static/images/contact_logo.png'}" alt="${user.username}">
        </div>
        <div class="contact-info">
            <span class="contact-name">${user.username}</span>
            <span class="contact-email">${user.email || ''}</span>
        </div>
    `;
    
    return item;
}

// Function to add click listeners to contact items
function addContactItemListeners() {
    const contactList = document.querySelector('#add-contact-list');
    if (!contactList) return;
    
    const contactItems = contactList.querySelectorAll('.contact-item');
    const addContactBtn = document.querySelector('#add-selected-contact-btn');
    
    console.log('Adding listeners to', contactItems.length, 'contact items');
    console.log('Add contact button found:', !!addContactBtn);
    
    contactItems.forEach(item => {
        // Single click for selection
        item.addEventListener('click', () => {
            console.log('Contact item clicked:', item.dataset.userId);
            // Toggle selection
            contactItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Enable the add button
            if (addContactBtn) {
                addContactBtn.disabled = false;
                console.log('Add button enabled');
            }
        });
        
        // Double click to show contact details
        item.addEventListener('dblclick', () => {
            const contactId = item.dataset.userId;
            const contactUsername = item.querySelector('.contact-name')?.textContent || 'Unknown';
            const avatarImg = item.querySelector('img');
            const avatarSrc = avatarImg ? avatarImg.src : '/static/images/contact_logo.png';
            
            console.log('Double-clicked on contact:', contactId);
            showContactDetailsModal(contactId, contactUsername, avatarSrc);
        });
    });
}

// Function to show contact details modal
function showContactDetailsModal(contactId, contactUsername, avatarSrc) {
    // Look for existing modal or create it
    let detailsModal = document.getElementById('contact-details-modal');
    
    if (!detailsModal) {
        // Create the modal if it doesn't exist
        detailsModal = document.createElement('div');
        detailsModal.id = 'contact-details-modal';
        detailsModal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Add modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h4>Контакт</h4>
            <span class="close-modal-btn">&times;</span>
        `;
        
        // Add modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.innerHTML = `
            <div class="contact-details">
                <img id="details-contact-avatar" src="${avatarSrc}" alt="Contact Avatar">
                <h3 id="details-contact-name">${contactUsername}</h3>
                <p id="details-contact-username" class="text-muted">${contactUsername}</p>
            </div>
            <div class="contact-actions">
                <button class="btn btn-primary" id="start-chat-btn" data-contact-id="${contactId}">
                    <i class="far fa-comment"></i> Маек баштоо
                </button>
                <button class="btn btn-outline-secondary" id="edit-details-contact-name-btn" data-contact-id="${contactId}">
                    <i class="fas fa-pencil-alt"></i> Атын өзгөртүү
                </button>
                <button class="btn btn-outline-danger" id="report-contact-btn">
                    <i class="fas fa-flag"></i> Даттануу
                </button>
            </div>
        `;
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        detailsModal.appendChild(modalContent);
        
        // Add to document
        document.body.appendChild(detailsModal);
        
        // Set up listeners for this modal
        const closeBtn = detailsModal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                detailsModal.style.display = 'none';
            });
        }
        
        // Modal click outside to close
        detailsModal.addEventListener('click', (event) => {
            if (event.target === detailsModal) {
                detailsModal.style.display = 'none';
            }
        });
        
        // Set up the contact details listeners
        setUpContactDetailsListeners();
    } else {
        // Update existing modal content
        const avatar = detailsModal.querySelector('#details-contact-avatar');
        const name = detailsModal.querySelector('#details-contact-name');
        const username = detailsModal.querySelector('#details-contact-username');
        const startChatBtn = detailsModal.querySelector('#start-chat-btn');
        const editNameBtn = detailsModal.querySelector('#edit-details-contact-name-btn');
        
        if (avatar) avatar.src = avatarSrc;
        if (name) name.textContent = contactUsername;
        if (username) username.textContent = contactUsername;
        if (startChatBtn) startChatBtn.dataset.contactId = contactId;
        if (editNameBtn) editNameBtn.dataset.contactId = contactId;
    }
    
    // Display the modal
    detailsModal.style.display = 'flex';
}

// Function to handle contact search
async function handleContactSearch(query) {
    console.log('Searching for contacts with query:', query);
    
    if (!query || query.length < 2) {
        // If query is empty or too short, reset to show all potential contacts
        initializePotentialContacts();
        return;
    }
    
    try {
        const loadingMessage = document.querySelector('#loading-contacts');
        const emptyMessage = document.querySelector('#empty-users-message');
        const contactList = document.querySelector('#add-contact-list');
        
        if (!contactList) {
            console.error('Contact list element not found');
            return;
        }
        
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (emptyMessage) emptyMessage.style.display = 'none';
        
        // Clear the contacts list except for loading and empty messages
        Array.from(contactList.children)
            .filter(child => !child.matches('#loading-contacts, #empty-users-message'))
            .forEach(child => child.remove());
        
        const response = await fetch(`/api/potential-contacts?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to search users: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Search results:', data);
        
        // Process the search results
        if (data.users && data.users.length > 0) {
            data.users.forEach(user => {
                const contactItem = createContactItem(user);
                contactList.appendChild(contactItem);
            });
            
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (emptyMessage) emptyMessage.style.display = 'none';
            addContactItemListeners();
        } else {
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
                const messageP = emptyMessage.querySelector('p');
                if (messageP) messageP.textContent = 'Колдонуучу табылган жок';
            }
        }
    } catch (error) {
        console.error('Error searching users:', error);
        
        const loadingMessage = document.querySelector('#loading-contacts');
        const emptyMessage = document.querySelector('#empty-users-message');
        
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
            const messageP = emptyMessage.querySelector('p');
            if (messageP) messageP.textContent = 'Издөөдө ката кетти';
        }
    }
}

// Add this function to move the modal to the document body
function moveModalToBody() {
    // Get all modals from the sidebar views
    document.querySelectorAll('.sidebar-view .modal').forEach(modal => {
        // Check if this modal is already in the body
        const modalId = modal.id;
        if (!document.querySelector(`body > #${modalId}`)) {
            // Clone the modal and append to body
            const clone = modal.cloneNode(true);
            document.body.appendChild(clone);
            console.log(`Moved modal ${modalId} to body`);
            
            // Hide the original
            modal.style.display = 'none';
        }
    });
}

// Function to create and show a modal directly in the body
function createAndShowModal(id, title, content, buttons) {
    console.log('Creating modal with ID:', id);
    
    // Remove any existing modal with same ID to avoid duplicates
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create the modal element
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.style.display = 'flex !important';
    modal.style.position = 'fixed';
    modal.style.zIndex = '99999';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Create the modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid #888';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '400px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
    modalContent.style.position = 'relative';
    modalContent.style.zIndex = '100000';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #eee';
    header.style.paddingBottom = '10px';
    
    const headerTitle = document.createElement('h4');
    headerTitle.textContent = title;
    headerTitle.style.margin = '0';
    headerTitle.style.color = '#333';
    headerTitle.style.fontSize = '18px';
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-modal-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.color = '#888';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    header.appendChild(headerTitle);
    header.appendChild(closeBtn);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = content;
    body.style.color = '#333';
    
    // Create footer with buttons
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '10px';
    footer.style.marginTop = '15px';
    footer.style.paddingTop = '10px';
    footer.style.borderTop = '1px solid #eee';
    
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = button.class;
        btn.textContent = button.text;
        btn.id = button.id;
        btn.style.padding = '8px 16px';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        
        if (button.class.includes('primary')) {
            btn.style.backgroundColor = '#128c7e';
            btn.style.color = 'white';
            btn.style.border = 'none';
        } else if (button.class.includes('secondary')) {
            btn.style.backgroundColor = '#f1f1f1';
            btn.style.color = '#333';
            btn.style.border = '1px solid #ddd';
        }
        
        footer.appendChild(btn);
    });
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    
    // Add to document body
    document.body.appendChild(modal);
    
    // Add the !important flag to display style after appending to DOM
    modal.setAttribute('style', 'display: flex !important; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.7); justify-content: center; align-items: center;');
    
    // Close when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Log the modal element to console to verify it's created
    console.log('Modal created and attached to DOM:', modal);
    
    return modal;
} 

// Add a function to send messages to any chat
window.sendMessage = function() {
    // Get the input field
    const inputField = document.querySelector('.input-box input');
    if (!inputField) {
        console.error('Message input field not found');
        return;
    }
    
    const messageText = inputField.value.trim();
    if (!messageText) return; // Don't send empty messages
    
    // Clear the input
    inputField.value = '';
    
    // Get the current active chat ID and type
    const chatId = window.currentChatId;
    const chatType = window.currentChatType;
    
    if (!chatId) {
        console.error('No active chat selected');
        return;
    }
    
    console.log(`Sending message to ${chatType} ${chatId}: ${messageText}`);
    
    // Create a message element
    const messageEl = createMessageElement(messageText, true);
    
    // Add the message to the chat
    const messagesContainer = document.getElementById(`${chatId}-messages`);
    if (messagesContainer) {
        // Check if this is the first message (remove empty state if present)
        const emptyState = messagesContainer.querySelector('.empty-chat-message');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Add the message
        messagesContainer.appendChild(messageEl);
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Update the chat list item with the last message
    updateChatLastMessage(chatId, messageText);
    
    // In a real app, we'd send this to the server here
}

// Function to create a message element
function createMessageElement(message, isSent = true, senderName = '') {
    const messageEl = document.createElement('div');
    messageEl.className = isSent ? 'message sent' : 'message received';
    
    // Current timestamp
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    if (isSent) {
        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-info">
                    <span class="message-time">${timeString}</span>
                    <span class="message-status">
                        <i class="fas fa-check"></i>
                    </span>
                </div>
                <p>${message}</p>
            </div>
        `;
    } else {
        messageEl.innerHTML = `
            <div class="message-avatar">
                <img src="/static/images/contact_logo.png" alt="User">
            </div>
            <div class="message-content">
                <div class="message-info">
                    <span class="sender-name">${senderName}</span>
                    <span class="message-time">${timeString}</span>
                </div>
                <p>${message}</p>
            </div>
        `;
    }
    
    return messageEl;
}

// Function to update the last message in a chat list item
function updateChatLastMessage(chatId, message) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
    if (!chatItem) return;
    
    // Update the last message text
    const lastMessageEl = chatItem.querySelector('.last-message p');
    if (lastMessageEl) lastMessageEl.textContent = message;
    
    // Update the time
    const timeEl = chatItem.querySelector('.time');
    if (timeEl) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    }
    
    // Move this chat to the top of the list
    const chatList = chatItem.parentElement;
    if (chatList) {
        chatList.prepend(chatItem);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for sending messages
    const sendButton = document.querySelector('.send-button');
    const inputField = document.querySelector('.input-box input');
    
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            window.sendMessage();
        });
    }
    
    if (inputField) {
        inputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                window.sendMessage();
            }
        });
    }
    
    // Other existing code...
});