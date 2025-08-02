// AI Communities - Frontend Application
class AICommunities {
    constructor() {
        this.currentCommunity = 'late-night-coders';
        this.username = '';
        this.userId = this.generateUserId();
        this.messages = [];
        this.typingUsers = new Set();
        this.lastMessageTime = 0;
        this.currentDMUser = null;
        this.dmMessages = {};
        
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

        // Profile and DM functionality
        this.initializeProfileAndDM();
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
        const typingAIs = ['Confidence_Coach', 'Wingman_Will', 'Smooth_Sam'];
        
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
            'Confidence_Coach': '💪',
            'Wingman_Will': '😎',
            'Smooth_Sam': '😏',
            'Relationship_Rick': '❤️',
            'Honest_Harry': '🤔',
            'Anxiety_Andy': '😰'
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
            'late-night-coders': 'Dating Advice Bros',
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

    initializeProfileAndDM() {
        // Make member items clickable
        document.querySelectorAll('.member-item').forEach(item => {
            item.addEventListener('click', () => {
                const memberId = item.dataset.member;
                if (memberId) {
                    this.showProfile(memberId);
                }
            });
        });

        // Make message author names clickable
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-author') && e.target.classList.contains('ai')) {
                const authorName = e.target.textContent;
                const memberId = this.getAIMemberIdFromName(authorName);
                if (memberId) {
                    this.showProfile(memberId);
                }
            }
        });

        // Profile modal events
        document.getElementById('close-profile').addEventListener('click', () => {
            this.hideProfile();
        });

        document.getElementById('dm-button').addEventListener('click', () => {
            this.openDM(this.currentProfileUser);
        });

        // DM events
        document.getElementById('close-dm').addEventListener('click', () => {
            this.closeDM();
        });

        document.getElementById('dm-send-button').addEventListener('click', () => {
            this.sendDM();
        });

        document.getElementById('dm-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendDM();
            }
        });

        // Close modals when clicking outside
        document.getElementById('profile-modal').addEventListener('click', (e) => {
            if (e.target.id === 'profile-modal') {
                this.hideProfile();
            }
        });

        document.getElementById('dm-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'dm-overlay') {
                this.closeDM();
            }
        });
    }

    getAIMemberIdFromName(name) {
        const nameToId = {
            'Confidence_Coach': 'confidence_coach',
            'Wingman_Will': 'wingman_will',
            'Smooth_Sam': 'smooth_sam',
            'Relationship_Rick': 'relationship_rick',
            'Honest_Harry': 'honest_harry',
            'Anxiety_Andy': 'anxiety_andy'
        };
        return nameToId[name];
    }

    showProfile(memberId) {
        const profiles = {
            'confidence_coach': {
                name: 'Confidence_Coach',
                avatar: '💪',
                personality: 'Former shy guy who learned confidence through practice. Gives practical advice on building self-esteem.',
                backstory: 'Used to be terrified of talking to girls. Now married with great social skills. Remembers the struggle.',
                responseStyle: 'Encouraging, shares transformation stories, focuses on building confidence step by step'
            },
            'wingman_will': {
                name: 'Wingman_Will',
                avatar: '😎',
                personality: 'Natural social butterfly who loves helping friends succeed with dating. Great at reading situations.',
                backstory: 'Always been the guy who helps his friends get dates. Genuinely wants everyone to find love.',
                responseStyle: 'Casual, bro-like but supportive, gives tactical advice, uses "dude" a lot'
            },
            'smooth_sam': {
                name: 'Smooth_Sam',
                avatar: '😏',
                personality: 'Charming guy who knows how to talk to women. Focuses on being genuine rather than pickup lines.',
                backstory: 'Learned that authenticity beats tricks. Had to unlearn a lot of bad dating advice.',
                responseStyle: 'Smooth but genuine, anti-pickup artist, emphasizes being yourself'
            },
            'relationship_rick': {
                name: 'Relationship_Rick',
                avatar: '❤️',
                personality: 'Focuses on building meaningful connections. Married his college sweetheart after asking her out nervously.',
                backstory: 'Believes in taking things slow and building real relationships. Very romantic at heart.',
                responseStyle: 'Thoughtful, romantic, focuses on emotional connection over tactics'
            },
            'honest_harry': {
                name: 'Honest_Harry',
                avatar: '🤔',
                personality: 'Gives brutally honest but caring advice. Calls out bad ideas but always offers better alternatives.',
                backstory: 'Learned from many dating mistakes. Now gives the advice he wishes he had gotten.',
                responseStyle: 'Direct, honest, sometimes tough love, but always constructive'
            },
            'anxiety_andy': {
                name: 'Anxiety_Andy',
                avatar: '😰',
                personality: 'Deals with social anxiety but has learned coping strategies. Very empathetic to nervousness.',
                backstory: 'Struggled with anxiety for years. Found ways to manage it and still date successfully.',
                responseStyle: 'Understanding, shares anxiety management tips, very relatable to nervous guys'
            }
        };

        const profile = profiles[memberId];
        if (!profile) return;

        this.currentProfileUser = memberId;

        // Update profile modal content
        document.getElementById('profile-avatar').textContent = profile.avatar;
        document.getElementById('profile-name').textContent = profile.name;
        document.getElementById('profile-personality').textContent = profile.personality;
        document.getElementById('profile-backstory').textContent = profile.backstory;
        document.getElementById('profile-style').textContent = profile.responseStyle;

        // Show modal
        document.getElementById('profile-modal').style.display = 'flex';
    }

    hideProfile() {
        document.getElementById('profile-modal').style.display = 'none';
        this.currentProfileUser = null;
    }

    openDM(memberId) {
        this.hideProfile();
        this.currentDMUser = memberId;

        const profiles = {
            'confidence_coach': { name: 'Confidence_Coach', avatar: '💪' },
            'wingman_will': { name: 'Wingman_Will', avatar: '😎' },
            'smooth_sam': { name: 'Smooth_Sam', avatar: '😏' },
            'relationship_rick': { name: 'Relationship_Rick', avatar: '❤️' },
            'honest_harry': { name: 'Honest_Harry', avatar: '🤔' },
            'anxiety_andy': { name: 'Anxiety_Andy', avatar: '😰' }
        };

        const profile = profiles[memberId];
        if (!profile) return;

        // Update DM interface
        document.getElementById('dm-avatar').textContent = profile.avatar;
        document.getElementById('dm-name').textContent = profile.name;
        document.getElementById('dm-welcome-avatar').textContent = profile.avatar;
        document.getElementById('dm-welcome-name').textContent = profile.name;
        document.getElementById('dm-input').placeholder = `Message ${profile.name}...`;

        // Load existing DM messages
        this.loadDMMessages(memberId);

        // Show DM interface
        document.getElementById('dm-overlay').style.display = 'flex';
        document.getElementById('dm-input').focus();
    }

    closeDM() {
        document.getElementById('dm-overlay').style.display = 'none';
        this.currentDMUser = null;
    }

    loadDMMessages(memberId) {
        const messagesContainer = document.getElementById('dm-messages');
        const welcomeMsg = messagesContainer.querySelector('.dm-welcome');
        
        // Clear existing messages but keep welcome
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeMsg);

        // Load existing DM messages for this user
        const userDMs = this.dmMessages[memberId] || [];
        userDMs.forEach(message => {
            this.addDMMessageToUI(message);
        });

        this.scrollDMToBottom();
    }

    async sendDM() {
        const input = document.getElementById('dm-input');
        const content = input.value.trim();
        
        if (!content || !this.currentDMUser) return;

        // Clear input immediately
        input.value = '';

        // Add user message to UI
        const userMessage = {
            id: Date.now(),
            author: this.username,
            content: content,
            timestamp: new Date().toISOString(),
            type: 'user'
        };

        this.addDMMessageToUI(userMessage);
        this.saveDMMessage(this.currentDMUser, userMessage);

        // Show typing indicator
        this.showDMTyping();

        // Generate AI response
        setTimeout(() => {
            this.hideDMTyping();
            const aiResponse = this.generateDMResponse(this.currentDMUser, content);
            const aiMessage = {
                id: Date.now() + 1,
                author: this.getProfileName(this.currentDMUser),
                content: aiResponse,
                timestamp: new Date().toISOString(),
                type: 'ai'
            };
            this.addDMMessageToUI(aiMessage);
            this.saveDMMessage(this.currentDMUser, aiMessage);
        }, 1500 + Math.random() * 2000);
    }

    addDMMessageToUI(message) {
        const messagesContainer = document.getElementById('dm-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'dm-message';
        
        const isAI = message.type === 'ai';
        const avatar = isAI ? this.getAvatarForUser(message.author, true) : '👤';
        
        messageDiv.innerHTML = `
            <div class="dm-message-avatar">${avatar}</div>
            <div class="dm-message-content">
                <div class="dm-message-header">
                    <span class="dm-message-author ${isAI ? '' : 'user'}">${message.author}</span>
                    <span class="dm-message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="dm-message-text">${this.formatMessageContent(message.content)}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollDMToBottom();
    }

    showDMTyping() {
        const messagesContainer = document.getElementById('dm-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'dm-message';
        typingDiv.id = 'dm-typing-indicator';
        
        const avatar = this.getAvatarForUser(this.getProfileName(this.currentDMUser), true);
        
        typingDiv.innerHTML = `
            <div class="dm-message-avatar">${avatar}</div>
            <div class="dm-message-content">
                <div class="dm-message-text" style="font-style: italic; color: #72767d;">
                    ${this.getProfileName(this.currentDMUser)} is typing
                    <div class="typing-dots" style="display: inline-flex; margin-left: 8px;">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollDMToBottom();
    }

    hideDMTyping() {
        const typingIndicator = document.getElementById('dm-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollDMToBottom() {
        const messagesContainer = document.getElementById('dm-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    saveDMMessage(memberId, message) {
        if (!this.dmMessages[memberId]) {
            this.dmMessages[memberId] = [];
        }
        this.dmMessages[memberId].push(message);
    }

    getProfileName(memberId) {
        const names = {
            'confidence_coach': 'Confidence_Coach',
            'wingman_will': 'Wingman_Will',
            'smooth_sam': 'Smooth_Sam',
            'relationship_rick': 'Relationship_Rick',
            'honest_harry': 'Honest_Harry',
            'anxiety_andy': 'Anxiety_Andy'
        };
        return names[memberId] || 'AI';
    }

    generateDMResponse(memberId, userMessage) {
        const responses = {
            'confidence_coach': [
                "I hear you, and I want you to know that what you're feeling is completely normal. When I was in your shoes, I felt the exact same way.",
                "You know what? The fact that you're reaching out shows you're already taking the first step. That takes courage, even if it doesn't feel like it.",
                "Let me share something with you - confidence isn't about never feeling scared. It's about feeling scared and doing it anyway. What's one small thing you could try today?"
            ],
            'wingman_will': [
                "Yo, I'm glad you came to me with this! That's what I'm here for, dude. Let's figure this out together.",
                "Bro, you're being way too hard on yourself. I've seen guys with way less going for them than you succeed. What's really holding you back?",
                "Dude, here's the thing - every girl is different, but they all appreciate genuine interest and respect. Tell me more about the situation."
            ],
            'smooth_sam': [
                "I appreciate you being real with me. Authenticity is already putting you ahead of 90% of guys out there.",
                "You know what's actually smooth? Being honest about your feelings. Vulnerability is attractive when it comes from a place of strength.",
                "Let me tell you something - the best conversations I've had with women started with me just being myself. What's your natural personality like?"
            ],
            'relationship_rick': [
                "Thank you for sharing that with me. Building real connections takes time, and it sounds like you're looking for something meaningful.",
                "I remember feeling exactly like that before I met my wife. The right person will appreciate your genuine approach. What kind of relationship are you hoping for?",
                "You know, the best relationships start with friendship and mutual respect. Focus on getting to know her as a person first. What draws you to her?"
            ],
            'honest_harry': [
                "Alright, I'm going to give it to you straight because that's what you need right now. But I'm saying this because I care.",
                "Look, I've been where you are, and I made every mistake in the book. The good news? You're asking for help, which means you're already smarter than I was.",
                "Here's the truth - rejection is part of the process. The sooner you accept that, the sooner you can focus on becoming the best version of yourself. What are you working on personally?"
            ],
            'anxiety_andy': [
                "Oh man, I totally get it. My anxiety used to be so bad that I'd rehearse conversations for hours and still mess them up.",
                "You're not alone in feeling this way. Social anxiety around dating is super common, and there are definitely ways to manage it.",
                "I've found that taking deep breaths and reminding myself that the other person is probably nervous too really helps. What specific situations make you most anxious?"
            ]
        };

        const memberResponses = responses[memberId] || responses['confidence_coach'];
        return memberResponses[Math.floor(Math.random() * memberResponses.length)];
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
