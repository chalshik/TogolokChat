document.addEventListener('DOMContentLoaded', () => {
    // Chat functionality
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.querySelector('.chat-messages');
    const sidebarChats = document.querySelectorAll('.sidebar-chats .chat');
    
    // Handle chat selection
    sidebarChats.forEach(chat => {
        chat.addEventListener('click', () => {
            // Remove active class from all chats
            sidebarChats.forEach(c => c.classList.remove('active'));
            // Add active class to clicked chat
            chat.classList.add('active');
            
            // Update chat header
            const chatName = chat.querySelector('.chat-info h2').textContent;
            const chatHeader = document.querySelector('.chat-header-info h3');
            if (chatHeader) {
                chatHeader.textContent = chatName;
            }
        });
    });

    // Handle message submission
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = this.querySelector('input');
            const message = input.value.trim();
            
            if (message) {
                // Get current time
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const formattedHours = hours % 12 || 12;
                const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
                const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
                
                // Create and append new message
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
                
                // Simulate reply after a short delay
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
    }

    // Handle emoji button
    const emojiButton = document.querySelector('.chat-footer .icon:first-child');
    if (emojiButton) {
        emojiButton.addEventListener('click', () => {
            // Add emoji functionality here
            console.log('Emoji button clicked');
        });
    }

    // Handle attachment button
    const attachmentButton = document.querySelector('.chat-footer .icon:nth-child(2)');
    if (attachmentButton) {
        attachmentButton.addEventListener('click', () => {
            // Add attachment functionality here
            console.log('Attachment button clicked');
        });
    }

    // Handle voice message button
    const voiceButton = document.querySelector('.chat-footer .icon:last-child');
    if (voiceButton) {
        voiceButton.addEventListener('click', () => {
            // Add voice message functionality here
            console.log('Voice message button clicked');
        });
    }

    // Handle search functionality
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Filter chat list based on search term
            sidebarChats.forEach(chat => {
                const name = chat.querySelector('.chat-info h2').textContent.toLowerCase();
                const lastMessage = chat.querySelector('.chat-info p').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || lastMessage.includes(searchTerm)) {
                    chat.style.display = 'flex';
                } else {
                    chat.style.display = 'none';
                }
            });
        });
    }

    // Handle refresh button
    const refreshButton = document.querySelector('.sidebar-header-right .icon:first-child');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            // Add refresh functionality here
            console.log('Refresh button clicked');
        });
    }

    // Handle new message button
    const newMessageButton = document.querySelector('.sidebar-header-right .icon:nth-child(2)');
    if (newMessageButton) {
        newMessageButton.addEventListener('click', () => {
            // Add new message functionality here
            console.log('New message button clicked');
        });
    }

    // Handle menu button
    const menuButton = document.querySelector('.sidebar-header-right .icon:last-child');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            // Add menu functionality here
            console.log('Menu button clicked');
        });
    }
}); 