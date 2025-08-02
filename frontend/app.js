// AI Communities - Frontend Application
class AICommunities {
    constructor() {
        this.currentCommunity = 'late-night-coders';
        this.username = '';
        this.userId = this.generateUserId();
        this.messages = [];
        this.typingUsers = new Set();
        this.lastMessageTime = 0;
        
        this.initializeApp();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    initializeApp() {
        // Show username modal first
        this.showUsernameModal();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial messages
        this.loadMessages();
        
        // Start polling for new messages
        this.startMessagePolling();
    }

    initializeEventListeners() {
        // Username modal
        document.getElementById('join-button').addEventListener('click', () => {
            this.handleUsernameSubmit();
        });

        document.getElementById('username-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUsernameSubmit();
            }
        });

        // Suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('message-input').value = btn.textContent.replace(/"/g, '');
            });
        });

        // Message input
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.getElementById('send-button').addEventListener('click', () => {
            this.sendMessage();
        });

        // Community switching
        document.querySelectorAll('.community-item').forEach(item => {
            item.addEventListener('click', () => {
                const communityId = item.dataset.community;
                this.switchCommunity(communityId);
            });
        });
    }

    showUsernameModal() {
        document.getElementById('username-modal').style.display = 'flex';
        document.getElementById('username-input').focus();
    }

    hideUsernameModal() {
        document.getElementById('username-modal').style.display = 'none';
    }

    handleUsernameSubmit() {
        const usernameInput = document.getElementById('username-input');
        const username = usernameInput.value.trim();
        
        if (username.length < 2) {
            usernameInput.style.borderColor = '#ed4245';
            return;
        }
        
        this.username = username;
        document.getElementById('current-username').textContent = username;
        document.getElementById('user-member-name').textContent = username;
        
        this.hideUsernameModal();
        
        // Send welcome message
        setTimeout(() => {
            this.sendWelcomeMessage();
        }, 1000);
    }

    sendWelcomeMessage() {
        const welcomeMessages = [
            `Hey everyone! I'm ${this.username}, just joined the community 👋`,
            `Hi! I'm ${this.username}, excited to be here!`,
            `Hello! ${this.username} here, looking forward to connecting with you all`
        ];
        
        const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        document.getElementById('message-input').value = message;
        
        // Auto-send after a moment to simulate natural behavior
        setTimeout(() => {
            this.sendMessage();
        }, 2000);
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;
        
        // Clear input immediately
        input.value = '';
        
        // Add user message to UI immediately
        this.addMessageToUI({
            id: Date.now(),
            author: this.username,
            content: content,
            timestamp: new Date().toISOString(),
            type: 'user'
        });
        
        // Show typing indicators for AI responses
        this.showAITyping();
        
        try {
            // Send to backend
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content,
                    userId: this.userId,
                    username: this.username
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addSystemMessage('Failed to send message. Please try again.');
        }
    }

    showAITyping() {
        const typingContainer = document.getElementById('typing-indicators');
        
        // Simulate multiple AIs typing
        const typingAIs = ['Alex_Senior', 'Sam_Struggle', 'Meme_Master'];
        
        typingAIs.forEach((ai, index) => {
            setTimeout(() => {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'typing-indicator';
                typingDiv.id = `typing-${ai}`;
                typingDiv.innerHTML = `
                    <strong>${ai}</strong> is typing
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                `;
                typingContainer.appendChild(typingDiv);
                
                // Remove after AI responds
                setTimeout(() => {
                    const element = document.getElementById(`typing-${ai}`);
                    if (element) {
                        element.remove();
                    }
                }, 3000 + (index * 2000));
                
            }, index * 1000);
        });
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
            const messages = await response.json();
            
            this.messages = messages;
            this.renderMessages();
            
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    startMessagePolling() {
        setInterval(async () => {
            try {
                const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
                const messages = await response.json();
                
                // Check for new messages
                const newMessages = messages.filter(msg => 
                    new Date(msg.timestamp) > new Date(this.lastMessageTime)
                );
                
                if (newMessages.length > 0) {
                    newMessages.forEach(msg => {
                        if (msg.author !== this.username) { // Don't duplicate our own messages
                            this.addMessageToUI(msg);
                        }
                    });
                    
                    this.lastMessageTime = Math.max(...messages.map(m => new Date(m.timestamp)));
                }
                
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }, 2000);
    }

    renderMessages() {
        const container = document.getElementById('messages-container');
        
        // Keep welcome message, clear others
        const welcomeMsg = container.querySelector('.welcome-message');
        container.innerHTML = '';
        if (welcomeMsg) {
            container.appendChild(welcomeMsg);
        }
        
        this.messages.forEach(message => {
            this.addMessageToUI(message, false);
        });
        
        if (this.messages.length > 0) {
            this.lastMessageTime = Math.max(...this.messages.map(m => new Date(m.timestamp)));
        }
    }

    addMessageToUI(message, shouldScroll = true) {
        const container = document.getElementById('messages-container');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.dataset.messageId = message.id;
        
        const isAI = message.type === 'ai';
        const avatar = this.getAvatarForUser(message.author, isAI);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author ${isAI ? 'ai' : ''}">${message.author}</span>
                    <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-text">${this.formatMessageContent(message.content)}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        
        if (shouldScroll) {
            this.scrollToBottom();
        }
        
        // Add some visual flair for AI messages
        if (isAI) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    getAvatarForUser(username, isAI) {
        if (!isAI) return '👤';
        
        const avatars = {
            'Alex_Senior': '👨‍💻',
            'Sam_Struggle': '😅',
            'Meme_Master': '😂',
            'Link_Librarian': '📚',
            'Tough_Love_Tom': '💪',
            'Debug_Duck': '🦆'
        };
        
        return avatars[username] || '🤖';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    formatMessageContent(content) {
        // Simple formatting for links and mentions
        return content
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    switchCommunity(communityId) {
        // Update active community
        document.querySelectorAll('.community-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-community="${communityId}"]`).classList.add('active');
        
        this.currentCommunity = communityId;
        
        // Update UI
        const communityNames = {
            'late-night-coders': 'Late Night Coders',
            'new-to-sf': 'New to SF',
            'startup-founders': 'Startup Founders'
        };
        
        document.getElementById('current-channel').textContent = 'general';
        document.getElementById('channel-description').textContent = `Welcome to ${communityNames[communityId]}`;
        
        // Load messages for new community
        this.loadMessages();
    }

    addSystemMessage(content) {
        this.addMessageToUI({
            id: Date.now(),
            author: 'System',
            content: content,
            timestamp: new Date().toISOString(),
            type: 'system'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiCommunities = new AICommunities();
    
    // Add some demo magic - simulate AI side conversations
    setTimeout(() => {
        if (window.aiCommunities.username) {
            simulateAISideConversation();
        }
    }, 30000); // After 30 seconds
});

// Demo function to show AI members talking to each other
function simulateAISideConversation() {
    const sideConversation = [
        {
            author: 'Sam_Struggle',
            content: '@Meme_Master did you see that new React 18 feature? My mind is blown 🤯',
            delay: 1000
        },
        {
            author: 'Meme_Master', 
            content: '@Sam_Struggle React 18 be like: "Concurrent features go brrr" 😂',
            delay: 3000
        },
        {
            author: 'Alex_Senior',
            content: 'Haha you two are great. @Sam_Struggle the concurrent features are actually really elegant once you get the hang of it',
            delay: 5000
        }
    ];
    
    sideConversation.forEach(msg => {
        setTimeout(() => {
            window.aiCommunities.addMessageToUI({
                id: Date.now() + Math.random(),
                author: msg.author,
                content: msg.content,
                timestamp: new Date().toISOString(),
                type: 'ai'
            });
        }, msg.delay);
    });
}
