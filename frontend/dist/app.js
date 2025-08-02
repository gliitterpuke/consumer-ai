"use strict";
// AI Communities - TypeScript Version
class AICommunities {
    constructor() {
        this.currentCommunity = 'late-night-coders';
        this.username = '';
        this.userId = '';
        this.lastMessageCount = 0;
        this.typingUsers = new Set();
        this.dmHistories = new Map();
        this.currentDMUser = null;
        this.avatarMap = {
            'confidence_coach': '💪',
            'wingman_will': '😎',
            'smooth_sam': '😏',
            'relationship_rick': '❤️',
            'honest_harry': '🤔',
            'anxiety_andy': '😰'
        };
        this.initializeEventListeners();
        this.initializeProfileAndDM();
        this.showUsernameModal();
        this.startMessagePolling();
    }
    initializeEventListeners() {
        // Username modal
        const usernameForm = document.getElementById('username-form');
        usernameForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.setUsername();
        });
        // Message form
        const messageForm = document.getElementById('message-form');
        messageForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        // Community switching
        document.querySelectorAll('.community-item').forEach((item) => {
            item.addEventListener('click', () => {
                const communityId = item.dataset.community;
                if (communityId) {
                    this.switchCommunity(communityId);
                }
            });
        });
    }
    initializeProfileAndDM() {
        // Make member items clickable
        document.querySelectorAll('.member-item').forEach((item) => {
            item.addEventListener('click', () => {
                const memberId = item.dataset.memberId;
                if (memberId) {
                    this.showProfile(memberId);
                }
            });
        });
        // Profile modal close
        const profileModal = document.getElementById('profile-modal');
        const profileClose = document.querySelector('.profile-close');
        profileClose?.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
        profileModal?.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
        // DM modal functionality
        const dmModal = document.getElementById('dm-modal');
        const dmClose = document.querySelector('.dm-close');
        const dmSendBtn = document.getElementById('dm-send');
        const dmInput = document.getElementById('dm-input');
        dmClose?.addEventListener('click', () => {
            this.closeDM();
        });
        dmModal?.addEventListener('click', (e) => {
            if (e.target === dmModal) {
                this.closeDM();
            }
        });
        dmSendBtn?.addEventListener('click', () => {
            this.sendDMMessage();
        });
        dmInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendDMMessage();
            }
        });
        // Send DM button in profile modal
        const sendDMBtn = document.getElementById('send-dm-btn');
        sendDMBtn?.addEventListener('click', () => {
            const profileModal = document.getElementById('profile-modal');
            const memberId = profileModal.dataset.memberId;
            if (memberId) {
                profileModal.style.display = 'none';
                this.openDM(memberId);
            }
        });
    }
    showUsernameModal() {
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    setUsername() {
        const input = document.getElementById('username-input');
        const username = input?.value.trim();
        if (username) {
            this.username = username;
            this.userId = `user_${Date.now()}`;
            const modal = document.getElementById('username-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            this.loadCommunity();
        }
    }
    async loadCommunity() {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}`);
            const community = await response.json();
            this.updateUI(community);
            this.loadMessages();
        }
        catch (error) {
            console.error('Error loading community:', error);
        }
    }
    updateUI(community) {
        // Update community name
        const communityNameEl = document.getElementById('community-name');
        if (communityNameEl) {
            communityNameEl.textContent = community.name;
        }
        // Update members count
        const totalMembersEl = document.getElementById('total-members');
        if (totalMembersEl) {
            totalMembersEl.textContent = (community.members.length + 1).toString(); // +1 for user
        }
        // Update members list
        const membersList = document.querySelector('.members-list');
        if (membersList) {
            membersList.innerHTML = `
                <div class="member-item user-member">
                    <div class="member-avatar">👤</div>
                    <span class="member-name">${this.username} (You)</span>
                </div>
                ${community.members.map(member => `
                    <div class="member-item" data-member-id="${member.id}">
                        <div class="member-avatar">${member.avatar}</div>
                        <span class="member-name">${member.name}</span>
                        <span class="ai-badge">AI</span>
                    </div>
                `).join('')}
            `;
            // Re-attach click listeners to new member items
            this.attachMemberClickListeners();
        }
    }
    attachMemberClickListeners() {
        document.querySelectorAll('.member-item[data-member-id]').forEach((item) => {
            item.addEventListener('click', () => {
                const memberId = item.dataset.memberId;
                if (memberId) {
                    this.showProfile(memberId);
                }
            });
        });
    }
    async loadMessages() {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
            const messages = await response.json();
            this.displayMessages(messages);
            this.lastMessageCount = messages.length;
        }
        catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    displayMessages(messages) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer)
            return;
        messagesContainer.innerHTML = messages.map(message => {
            const avatar = message.isAI ? this.avatarMap[message.userId] || '🤖' : '👤';
            const messageClass = message.isAI ? 'ai-message' : 'user-message';
            return `
                <div class="message ${messageClass}">
                    <div class="message-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author" data-member-id="${message.userId}">${message.username}</span>
                            <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                        </div>
                        <div class="message-text">${message.content}</div>
                    </div>
                </div>
            `;
        }).join('');
        // Make message authors clickable
        document.querySelectorAll('.message-author[data-member-id]').forEach((author) => {
            author.addEventListener('click', () => {
                const memberId = author.dataset.memberId;
                if (memberId && memberId !== this.userId) {
                    this.showProfile(memberId);
                }
            });
        });
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input?.value.trim();
        if (!content)
            return;
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    username: this.username,
                    content
                })
            });
            if (response.ok) {
                input.value = '';
                // Messages will be updated via polling
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
        }
    }
    startMessagePolling() {
        setInterval(async () => {
            await this.checkForNewMessages();
            await this.checkTypingIndicators();
        }, 2000);
    }
    async checkForNewMessages() {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
            const messages = await response.json();
            if (messages.length > this.lastMessageCount) {
                this.displayMessages(messages);
                this.lastMessageCount = messages.length;
            }
        }
        catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }
    async checkTypingIndicators() {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/typing`);
            const typingUsers = await response.json();
            this.updateTypingIndicators(typingUsers);
        }
        catch (error) {
            console.error('Error checking typing indicators:', error);
        }
    }
    updateTypingIndicators(typingUsers) {
        const typingContainer = document.getElementById('typing-indicators');
        if (!typingContainer)
            return;
        if (typingUsers.length === 0) {
            typingContainer.innerHTML = '';
            return;
        }
        const typingText = typingUsers.length === 1
            ? `${typingUsers[0]?.username || 'Someone'} is typing...`
            : `${typingUsers.map(u => u.username).join(', ')} are typing...`;
        typingContainer.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span>${typingText}</span>
            </div>
        `;
    }
    switchCommunity(communityId) {
        this.currentCommunity = communityId;
        this.lastMessageCount = 0;
        this.loadCommunity();
        // Update active community in sidebar
        document.querySelectorAll('.community-item').forEach((item) => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-community="${communityId}"]`);
        activeItem?.classList.add('active');
    }
    async showProfile(memberId) {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/personalities`);
            const personalities = await response.json();
            const personality = personalities[memberId];
            if (!personality) {
                console.error('Personality not found:', memberId);
                return;
            }
            // Update profile modal content
            const profileModal = document.getElementById('profile-modal');
            const profileAvatar = document.getElementById('profile-avatar');
            const profileName = document.getElementById('profile-name');
            const profilePersonality = document.getElementById('profile-personality');
            const profileBackstory = document.getElementById('profile-backstory');
            const profileStyle = document.getElementById('profile-style');
            if (profileAvatar)
                profileAvatar.textContent = personality.avatar;
            if (profileName)
                profileName.textContent = personality.name;
            if (profilePersonality)
                profilePersonality.textContent = personality.personality;
            if (profileBackstory)
                profileBackstory.textContent = personality.backstory;
            if (profileStyle)
                profileStyle.textContent = personality.responseStyle;
            // Store member ID for DM functionality
            profileModal.dataset.memberId = memberId;
            // Show modal
            profileModal.style.display = 'flex';
        }
        catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    openDM(memberId) {
        this.currentDMUser = memberId;
        // Update DM modal header
        const dmUserName = document.getElementById('dm-user-name');
        const dmUserAvatar = document.getElementById('dm-user-avatar');
        if (dmUserName)
            dmUserName.textContent = this.getMemberName(memberId);
        if (dmUserAvatar)
            dmUserAvatar.textContent = this.avatarMap[memberId] || '🤖';
        // Show DM modal
        const dmModal = document.getElementById('dm-modal');
        dmModal.style.display = 'flex';
        // Load DM messages
        this.loadDMMessages(memberId);
    }
    closeDM() {
        const dmModal = document.getElementById('dm-modal');
        dmModal.style.display = 'none';
        this.currentDMUser = null;
    }
    getMemberName(memberId) {
        // This would typically come from the member data
        const nameMap = {
            'confidence_coach': 'Confidence_Coach',
            'wingman_will': 'Wingman_Will',
            'smooth_sam': 'Smooth_Sam',
            'relationship_rick': 'Relationship_Rick',
            'honest_harry': 'Honest_Harry',
            'anxiety_andy': 'Anxiety_Andy'
        };
        return nameMap[memberId] || 'Unknown';
    }
    loadDMMessages(memberId) {
        const messages = this.dmHistories.get(memberId) || [];
        this.displayDMMessages(messages);
    }
    displayDMMessages(messages) {
        const dmMessages = document.getElementById('dm-messages');
        if (!dmMessages)
            return;
        dmMessages.innerHTML = messages.map(message => `
            <div class="dm-message ${message.isUser ? 'user' : 'ai'}">
                <div class="dm-message-content">${message.content}</div>
                <div class="dm-message-time">${this.formatTimestamp(message.timestamp)}</div>
            </div>
        `).join('');
        // Scroll to bottom
        dmMessages.scrollTop = dmMessages.scrollHeight;
    }
    sendDMMessage() {
        const dmInput = document.getElementById('dm-input');
        const content = dmInput?.value.trim();
        if (!content || !this.currentDMUser)
            return;
        // Add user message
        const userMessage = {
            id: `dm_${Date.now()}`,
            content,
            timestamp: new Date().toISOString(),
            isUser: true
        };
        const messages = this.dmHistories.get(this.currentDMUser) || [];
        messages.push(userMessage);
        this.dmHistories.set(this.currentDMUser, messages);
        // Clear input
        dmInput.value = '';
        // Display updated messages
        this.displayDMMessages(messages);
        // Show typing indicator and generate AI response
        this.showDMTyping();
        setTimeout(() => {
            this.generateDMResponse(this.currentDMUser, content);
        }, 1500 + Math.random() * 2000);
    }
    showDMTyping() {
        const dmMessages = document.getElementById('dm-messages');
        if (!dmMessages)
            return;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'dm-typing';
        typingDiv.innerHTML = `
            <div class="dm-message ai">
                <div class="dm-message-content">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        dmMessages.appendChild(typingDiv);
        dmMessages.scrollTop = dmMessages.scrollHeight;
    }
    generateDMResponse(memberId, userMessage) {
        const responses = {
            'confidence_coach': [
                "I hear you, and I want you to know that what you're feeling is completely normal. I've been exactly where you are.",
                "You know what? I used to think I'd never figure this out either. But here's what changed everything for me...",
                "I'm really glad you came to me with this. Building confidence isn't about pretending - it's about being genuinely yourself.",
                "Let me share something that took me years to learn: rejection isn't about you not being good enough."
            ],
            'wingman_will': [
                "Yo, I'm glad you came to me with this! That's what I'm here for, dude. Let's figure this out together.",
                "Alright, first things first - you're already doing better than most guys just by asking for help. That takes guts.",
                "I've helped tons of my friends with this exact situation. Here's what usually works...",
                "Dude, I can tell you're overthinking this. Let's break it down into simple steps."
            ],
            'smooth_sam': [
                "I appreciate you being real with me. Authenticity is already putting you ahead of 90% of guys out there.",
                "You know what I've learned? The smoothest thing you can do is just be genuinely interested in her as a person.",
                "I used to try all these tricks and lines, but honestly? Just being yourself works so much better.",
                "Here's the thing - confidence isn't about having all the answers. It's about being comfortable with who you are."
            ],
            'relationship_rick': [
                "Thank you for sharing that with me. Building real connections takes time, and I can help you with that.",
                "I've seen so many people rush into things. The best relationships start with genuine friendship and understanding.",
                "What you're feeling is exactly what someone who cares about doing this right would feel. That's actually beautiful.",
                "Let's talk about what really matters in building a connection with someone you care about."
            ],
            'honest_harry': [
                "Alright, I'm going to give it to you straight because that's what you need right now.",
                "I appreciate you being honest with me, so I'm going to be completely honest with you too.",
                "Look, I'm not going to sugarcoat this, but I'm also not going to let you give up on yourself.",
                "Here's the truth that most people won't tell you, but you need to hear..."
            ],
            'anxiety_andy': [
                "Oh man, I totally get it. My anxiety used to be so bad that I couldn't even make eye contact with girls.",
                "I know exactly how that feels - like your heart is going to beat out of your chest, right?",
                "You know what helped me? Realizing that she's probably just as nervous about social interactions as I am.",
                "I used to think everyone could see how anxious I was, but most people are too worried about themselves to notice."
            ]
        };
        const memberResponses = responses[memberId] || responses['confidence_coach'];
        if (!memberResponses || memberResponses.length === 0) {
            console.error('No responses found for member:', memberId);
            return;
        }
        const response = memberResponses[Math.floor(Math.random() * memberResponses.length)];
        if (!response) {
            console.error('Failed to generate response for member:', memberId);
            return;
        }
        // Remove typing indicator
        const typingEl = document.querySelector('.dm-typing');
        typingEl?.remove();
        // Add AI response
        const aiMessage = {
            id: `dm_ai_${Date.now()}`,
            content: response,
            timestamp: new Date().toISOString(),
            isUser: false
        };
        const messages = this.dmHistories.get(memberId) || [];
        messages.push(aiMessage);
        this.dmHistories.set(memberId, messages);
        // Display updated messages
        this.displayDMMessages(messages);
    }
}
// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new AICommunities();
});
//# sourceMappingURL=app.js.map