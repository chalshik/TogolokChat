document.addEventListener('DOMContentLoaded', () => {
    // Hide all modals at startup
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

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

    // Function to switch chat
    function switchChat(chatId, chatType) {
        console.log('Switching chat to ID:', chatId, 'Type:', chatType);
        // Update current chat tracking
        currentChatId = chatId;
        currentChatType = chatType;
        
        // Hide all message containers and show the selected one
        messagesContainers.forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none'; // Explicitly hide
        });
        const targetContainer = document.getElementById(`${chatId}-messages`);
        if (targetContainer) {
            console.log('Activating messages container:', targetContainer.id);
            targetContainer.classList.add('active');
            targetContainer.style.display = 'flex'; // Explicitly show
            targetContainer.scrollTop = targetContainer.scrollHeight; // Scroll to bottom on switch
        } else {
            console.error('Target messages container not found:', `${chatId}-messages`);
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

    // --- Sidebar View Management --- //
    const sidebarContentArea = document.getElementById('sidebar-content-area');
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
            attachSidebarViewListeners(viewName);
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
        const addBtn = sidebarContentArea.querySelector('#add-selected-contact-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                // Add logic to get selected contact from the list if applicable
                console.log('Add contact button clicked');
                alert('Кошуу баскычы басылды');
                // Add actual contact adding logic here
            });
        }
         // Add search functionality
        const searchInput = sidebarContentArea.querySelector('#add-contact-search-input');
         if (searchInput) {
             searchInput.addEventListener('input', handleAddContactSearch);
         }
        // Add click listeners to contact items if needed for selection
        const contactItems = sidebarContentArea.querySelectorAll('#add-contact-list .contact-item');
        contactItems.forEach(item => {
            item.addEventListener('click', () => {
                console.log(`Clicked on potential contact: ${item.dataset.userId}`);
                // Implement selection logic if needed
            });
        });
    }

     function attachProfileListeners() {
         console.log('Attaching profile listeners...');
         // Edit Name
         const editNameBtn = sidebarContentArea.querySelector('#edit-profile-name-btn');
         const editNameModal = document.getElementById('edit-profile-name-modal'); // Assuming modals are outside the loaded content
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
                     console.log('New profile name saved (frontend):', newName);
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
                 console.log('New profile info saved (frontend):', newInfo);
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
                          console.log('New profile avatar selected (frontend)');
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
                     }
                 } catch (error) {
                     console.error('Error during logout:', error);
                 }
             });
         }

     }

     // Function to attach listeners for modals (generic close buttons)
    function attachModalListeners() {
        const modals = document.querySelectorAll('.modal'); // Find all modals (might be outside sidebarContentArea)
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

     function handleAddContactSearch(event) {
         const searchTerm = event.target.value.toLowerCase();
         const contactItems = sidebarContentArea.querySelectorAll('#add-contact-list .contact-item');
         contactItems.forEach(item => {
            const name = item.querySelector('.contact-name')?.textContent.toLowerCase() || '';
             if (name.includes(searchTerm)) {
                 item.style.display = '';
             } else {
                 item.style.display = 'none';
             }
         });
         // Add logic here to potentially fetch users from the backend based on search term
         console.log('Searching for contacts/users:', searchTerm);
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

}); // End DOMContentLoaded 

// Add this missing function
function loadUserContacts() {
    console.log('Loading user contacts...');
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
            // This can be expanded based on the actual API response format
            updateContactsList(data);
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            // Show error message or empty state
            showEmptyContactsState();
        });
}

function updateContactsList(contacts) {
    const chatList = document.querySelector('#chat-list');
    if (!chatList) {
        console.error('Chat list element not found');
        return;
    }
    
    if (contacts.length === 0) {
        showEmptyContactsState();
        return;
    }

    // Clear any existing empty state messages
    const emptyState = chatList.querySelector('.empty-chat-message');
    if (emptyState) {
        emptyState.remove();
    }

    // Process each contact and update or create chat items
    // This is a simple implementation that can be enhanced based on actual data structure
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

function showEmptyContactsState() {
    const chatList = document.querySelector('#chat-list');
    if (!chatList) return;
    
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