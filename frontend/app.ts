// AI Communities - TypeScript Version

interface Message {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: string;
    isAI?: boolean;
}

interface Community {
    id: string;
    name: string;
    icon: string;
    members: Member[];
    messages: Message[];
}

interface Member {
    id: string;
    name: string;
    avatar: string;
    isAI?: boolean;
}

interface AIPersonality {
    name: string;
    avatar: string;
    personality: string;
    backstory: string;
    responseStyle: string;
    relationships?: string[];
}

interface DMMessage {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
}

interface TypingIndicator {
    userId: string;
    username: string;
}

class AICommunities {
    private currentCommunity: string = 'late-night-coders';
    private username: string = '';
    private userId: string = '';
    private lastMessageCount: number = 0;
    private typingUsers: Set<string> = new Set();
    private dmHistories: Map<string, DMMessage[]> = new Map();
    private currentDMUser: string | null = null;
    private currentView: 'community' | 'dm' = 'community';

    private readonly avatarMap: Record<string, string> = {
        'confidence_coach': '💪',
        'wingman_will': '😎',
        'smooth_sam': '😏',
        'relationship_rick': '❤️',
        'honest_harry': '🤔',
        'anxiety_andy': '😰'
    };

    constructor() {
        this.initTheme();
        this.initializeEventListeners();
        this.initializeProfileAndDM();
        this.initializePersonalityCreator();
        this.showUsernameModal();
        this.startMessagePolling();
    }

    private initializeEventListeners(): void {
        // Username modal
        const joinButton = document.getElementById('join-button') as HTMLButtonElement;
        joinButton?.addEventListener('click', (e: Event) => {
            e.preventDefault();
            this.setUsername();
        });
        
        // Also handle Enter key in username input
        const usernameInput = document.getElementById('username-input') as HTMLInputElement;
        usernameInput?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.setUsername();
            }
        });

        // Message form
        const messageForm = document.getElementById('message-form') as HTMLFormElement;
        messageForm?.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Community switching
        document.querySelectorAll('.community-item').forEach((item: Element) => {
            item.addEventListener('click', () => {
                const communityId = (item as HTMLElement).dataset.community;
                if (communityId) {
                    this.switchCommunity(communityId);
                }
            });
        });
    }

    private initializeProfileAndDM(): void {
        // Make member items clickable
        document.querySelectorAll('.member-item').forEach((item: Element) => {
            item.addEventListener('click', () => {
                const memberId = (item as HTMLElement).dataset.memberId;
                if (memberId) {
                    this.showProfile(memberId);
                }
            });
        });

        // Profile modal close
        const profileModal = document.getElementById('profile-modal') as HTMLElement;
        const profileClose = document.querySelector('.profile-close') as HTMLElement;
        
        profileClose?.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });

        profileModal?.addEventListener('click', (e: Event) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });

        // DM modal functionality
        const dmModal = document.getElementById('dm-modal') as HTMLElement;
        const dmClose = document.querySelector('.dm-close') as HTMLElement;
        const dmSendBtn = document.getElementById('dm-send') as HTMLButtonElement;
        const dmInput = document.getElementById('dm-input') as HTMLInputElement;

        dmClose?.addEventListener('click', () => {
            this.closeDM();
        });

        dmModal?.addEventListener('click', (e: Event) => {
            if (e.target === dmModal) {
                this.closeDM();
            }
        });

        dmSendBtn?.addEventListener('click', () => {
            this.sendDMMessage();
        });

        dmInput?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.sendDMMessage();
            }
        });

        // Send DM button in profile modal
        const sendDMBtn = document.getElementById('send-dm-btn') as HTMLButtonElement;
        sendDMBtn?.addEventListener('click', () => {
            const profileModal = document.getElementById('profile-modal') as HTMLElement;
            const memberId = profileModal.dataset.memberId;
            if (memberId) {
                profileModal.style.display = 'none';
                this.openDM(memberId);
            }
        });

        // DM section toggle
        const dmToggle = document.getElementById('dm-toggle') as HTMLButtonElement;
        const dmList = document.getElementById('dm-list') as HTMLElement;
        dmToggle?.addEventListener('click', () => {
            const isCollapsed = dmList.style.display === 'none';
            dmList.style.display = isCollapsed ? 'block' : 'none';
            const icon = dmToggle.querySelector('i') as HTMLElement;
            if (icon) {
                icon.className = isCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            }
        });

        // DM item clicks
        document.querySelectorAll('.dm-item').forEach((item: Element) => {
            item.addEventListener('click', () => {
                const memberId = (item as HTMLElement).dataset.memberId;
                if (memberId) {
                    this.openDM(memberId);
                    // Remove unread indicator
                    const unreadBadge = item.querySelector('.dm-unread') as HTMLElement;
                    if (unreadBadge) {
                        unreadBadge.style.display = 'none';
                    }
                }
            });
        });
    }

    private showUsernameModal(): void {
        const modal = document.getElementById('username-modal') as HTMLElement;
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    private setUsername(): void {
        const input = document.getElementById('username-input') as HTMLInputElement;
        const username = input?.value.trim();
        
        if (username) {
            this.username = username;
            this.userId = `user_${Date.now()}`;
            
            const modal = document.getElementById('username-modal') as HTMLElement;
            if (modal) {
                modal.style.display = 'none';
            }
            
            this.loadCommunity();
        }
    }

    private async loadCommunity(): Promise<void> {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}`);
            const community: Community = await response.json();
            
            this.updateUI(community);
            this.loadMessages();
        } catch (error) {
            console.error('Error loading community:', error);
        }
    }

    private updateUI(community: Community): void {
        // Update community name
        const communityNameEl = document.getElementById('community-name') as HTMLElement;
        if (communityNameEl) {
            communityNameEl.textContent = community.name;
        }

        // Update members count
        const totalMembersEl = document.getElementById('total-members') as HTMLElement;
        if (totalMembersEl) {
            totalMembersEl.textContent = (community.members.length + 1).toString(); // +1 for user
        }

        // Update members list
        const membersList = document.querySelector('.members-list') as HTMLElement;
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

    private attachMemberClickListeners(): void {
        document.querySelectorAll('.member-item[data-member-id]').forEach((item: Element) => {
            item.addEventListener('click', () => {
                const memberId = (item as HTMLElement).dataset.memberId;
                if (memberId) {
                    this.showProfile(memberId);
                }
            });
        });
    }

    private async loadMessages(): Promise<void> {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
            const messages: Message[] = await response.json();
            
            this.displayMessages(messages);
            this.lastMessageCount = messages.length;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    private displayMessages(messages: Message[]): void {
        const messagesContainer = document.getElementById('messages-container') as HTMLElement;
        if (!messagesContainer) return;

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
        document.querySelectorAll('.message-author[data-member-id]').forEach((author: Element) => {
            author.addEventListener('click', () => {
                const memberId = (author as HTMLElement).dataset.memberId;
                if (memberId && memberId !== this.userId) {
                    this.showProfile(memberId);
                }
            });
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    private formatTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    private async sendMessage(): Promise<void> {
        const input = document.getElementById('message-input') as HTMLInputElement;
        const content = input?.value.trim();
        
        if (!content) return;

        // Handle DM context
        if (this.currentView === 'dm' && this.currentDMUser) {
            this.sendDMMessageInMain(content);
            input.value = '';
            return;
        }

        // Handle community context
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
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    private startMessagePolling(): void {
        setInterval(async () => {
            await this.checkForNewMessages();
            await this.checkTypingIndicators();
        }, 2000);
    }

    private async checkForNewMessages(): Promise<void> {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/messages`);
            const messages: Message[] = await response.json();
            
            if (messages.length > this.lastMessageCount) {
                this.displayMessages(messages);
                this.lastMessageCount = messages.length;
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }

    private async checkTypingIndicators(): Promise<void> {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/typing`);
            const typingUsers: TypingIndicator[] = await response.json();
            
            this.updateTypingIndicators(typingUsers);
        } catch (error) {
            console.error('Error checking typing indicators:', error);
        }
    }

    private updateTypingIndicators(typingUsers: TypingIndicator[]): void {
        const typingContainer = document.getElementById('typing-indicators') as HTMLElement;
        if (!typingContainer) return;

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

    private switchCommunity(communityId: string): void {
        this.currentCommunity = communityId;
        this.lastMessageCount = 0;
        this.loadCommunity();

        // Update active community in sidebar
        document.querySelectorAll('.community-item').forEach((item: Element) => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-community="${communityId}"]`);
        activeItem?.classList.add('active');
    }

    private async showProfile(memberId: string): Promise<void> {
        try {
            const response = await fetch(`/api/communities/${this.currentCommunity}/personalities`);
            const personalities: Record<string, AIPersonality> = await response.json();
            const personality = personalities[memberId];

            if (!personality) {
                console.error('Personality not found:', memberId);
                return;
            }

            // Update profile modal content
            const profileModal = document.getElementById('profile-modal') as HTMLElement;
            const profileAvatar = document.getElementById('profile-avatar') as HTMLElement;
            const profileName = document.getElementById('profile-name') as HTMLElement;
            const profilePersonality = document.getElementById('profile-personality') as HTMLElement;
            const profileBackstory = document.getElementById('profile-backstory') as HTMLElement;
            const profileStyle = document.getElementById('profile-style') as HTMLElement;

            if (profileAvatar) profileAvatar.textContent = personality.avatar;
            if (profileName) profileName.textContent = personality.name;
            if (profilePersonality) profilePersonality.textContent = personality.personality;
            if (profileBackstory) profileBackstory.textContent = personality.backstory;
            if (profileStyle) profileStyle.textContent = personality.responseStyle;

            // Store member ID for DM functionality
            profileModal.dataset.memberId = memberId;

            // Show modal
            profileModal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    private openDM(memberId: string): void {
        this.currentDMUser = memberId;
        this.currentView = 'dm';
        
        // Update chat header to show DM info
        const channelName = document.getElementById('current-channel') as HTMLElement;
        const channelDescription = document.getElementById('channel-description') as HTMLElement;
        const channelIcon = document.querySelector('.channel-icon') as HTMLElement;
        
        if (channelName) channelName.textContent = this.getMemberName(memberId);
        if (channelDescription) channelDescription.textContent = `Direct message with ${this.getMemberName(memberId)}`;
        if (channelIcon) channelIcon.textContent = this.avatarMap[memberId] || '🤖';

        // Clear main messages area and show DM messages
        const messagesContainer = document.getElementById('messages-container') as HTMLElement;
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="dm-header-info">
                    <div class="dm-avatar-large">${this.avatarMap[memberId] || '🤖'}</div>
                    <h3>This is the beginning of your direct message history with ${this.getMemberName(memberId)}</h3>
                    <p>Only you and ${this.getMemberName(memberId)} can see these messages.</p>
                </div>
                <div id="dm-messages-main"></div>
            `;
        }

        // Load and display DM messages
        this.loadDMMessages(memberId);
        this.displayDMMessagesInMain(memberId);
        
        // Update input placeholder
        const messageInput = document.getElementById('message-input') as HTMLInputElement;
        if (messageInput) {
            messageInput.placeholder = `Message ${this.getMemberName(memberId)}...`;
        }
    }

    private closeDM(): void {
        const dmModal = document.getElementById('dm-modal') as HTMLElement;
        dmModal.style.display = 'none';
        this.currentDMUser = null;
    }

    private getMemberName(memberId: string): string {
        // This would typically come from the member data
        const nameMap: Record<string, string> = {
            'confidence_coach': 'Confidence_Coach',
            'wingman_will': 'Wingman_Will',
            'smooth_sam': 'Smooth_Sam',
            'relationship_rick': 'Relationship_Rick',
            'honest_harry': 'Honest_Harry',
            'anxiety_andy': 'Anxiety_Andy'
        };
        return nameMap[memberId] || 'Unknown';
    }

    private loadDMMessages(memberId: string): void {
        const messages = this.dmHistories.get(memberId) || [];
        this.displayDMMessages(messages);
    }

    private displayDMMessages(messages: DMMessage[]): void {
        const dmMessages = document.getElementById('dm-messages') as HTMLElement;
        if (!dmMessages) return;

        dmMessages.innerHTML = messages.map(message => `
            <div class="dm-message ${message.isUser ? 'user' : 'ai'}">
                <div class="dm-message-content">${message.content}</div>
                <div class="dm-message-time">${this.formatTimestamp(message.timestamp)}</div>
            </div>
        `).join('');

        // Scroll to bottom
        dmMessages.scrollTop = dmMessages.scrollHeight;
    }

    private displayDMMessagesInMain(memberId: string): void {
        const messages = this.dmHistories.get(memberId) || [];
        const dmMessagesMain = document.getElementById('dm-messages-main') as HTMLElement;
        if (!dmMessagesMain) return;

        dmMessagesMain.innerHTML = messages.map(message => {
            const avatar = message.isUser ? '👤' : this.avatarMap[memberId] || '🤖';
            const messageClass = message.isUser ? 'user-message' : 'ai-message';
            const username = message.isUser ? this.username : this.getMemberName(memberId);
            
            return `
                <div class="message ${messageClass}">
                    <div class="message-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="message-header">
                            <span class="message-author">${username}</span>
                            <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                        </div>
                        <div class="message-text">${message.content}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        const messagesContainer = document.getElementById('messages-container') as HTMLElement;
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    private sendDMMessage(): void {
        const dmInput = document.getElementById('dm-input') as HTMLInputElement;
        const content = dmInput?.value.trim();
        
        if (!content || !this.currentDMUser) return;

        // Add user message
        const userMessage: DMMessage = {
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
            this.generateDMResponse(this.currentDMUser!, content);
        }, 1500 + Math.random() * 2000);
    }

    private showDMTyping(): void {
        const dmMessages = document.getElementById('dm-messages') as HTMLElement;
        if (!dmMessages) return;

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

    private generateDMResponse(memberId: string, userMessage: string): void {
        const responses: Record<string, string[]> = {
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
        const aiMessage: DMMessage = {
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

    private sendDMMessageInMain(content: string): void {
        if (!this.currentDMUser) return;

        // Add user message
        const userMessage: DMMessage = {
            id: `dm_${Date.now()}`,
            content,
            timestamp: new Date().toISOString(),
            isUser: true
        };

        const messages = this.dmHistories.get(this.currentDMUser) || [];
        messages.push(userMessage);
        this.dmHistories.set(this.currentDMUser, messages);

        // Update main screen display
        this.displayDMMessagesInMain(this.currentDMUser);

        // Show typing indicator and generate AI response
        this.showDMTypingInMain();
        setTimeout(() => {
            this.generateDMResponseInMain(this.currentDMUser!, content);
        }, 1500 + Math.random() * 2000);
    }

    private showDMTypingInMain(): void {
        if (!this.currentDMUser) return;
        
        const dmMessagesMain = document.getElementById('dm-messages-main') as HTMLElement;
        if (!dmMessagesMain) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'dm-typing-main';
        typingDiv.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">${this.avatarMap[this.currentDMUser] || '🤖'}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${this.getMemberName(this.currentDMUser)}</span>
                    </div>
                    <div class="message-text">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        dmMessagesMain.appendChild(typingDiv);
        
        // Scroll to bottom
        const messagesContainer = document.getElementById('messages-container') as HTMLElement;
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    private generateDMResponseInMain(memberId: string, userMessage: string): void {
        const responses: Record<string, string[]> = {
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
        const typingEl = document.querySelector('.dm-typing-main');
        typingEl?.remove();

        // Add AI response
        const aiMessage: DMMessage = {
            id: `dm_ai_${Date.now()}`,
            content: response,
            timestamp: new Date().toISOString(),
            isUser: false
        };

        const messages = this.dmHistories.get(memberId) || [];
        messages.push(aiMessage);
        this.dmHistories.set(memberId, messages);

        // Update main screen display
        this.displayDMMessagesInMain(memberId);
    }

    // Theme Management
    private initTheme(): void {
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Set up theme toggle event listener when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupThemeToggle();
            });
        } else {
            this.setupThemeToggle();
        }
    }

    private setupThemeToggle(): void {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    private setTheme(theme: string): void {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    private toggleTheme(): void {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Personality Creator Modal
    private initializePersonalityCreator(): void {
        const createAiTrigger = document.getElementById('create-ai-trigger');
        const personalityCreatorModal = document.getElementById('personality-creator-modal');
        const closePersonalityCreator = document.getElementById('close-personality-creator');
        const randomOption = document.getElementById('random-option');
        const customOption = document.getElementById('custom-option');
        const customCreator = document.getElementById('custom-creator');
        const createAiBtn = document.getElementById('create-ai-btn');
        const cancelCreatorBtn = document.getElementById('cancel-creator-btn');

        if (createAiTrigger && personalityCreatorModal) {
            createAiTrigger.addEventListener('click', () => {
                personalityCreatorModal.style.display = 'flex';
            });
        }

        if (closePersonalityCreator && personalityCreatorModal) {
            closePersonalityCreator.addEventListener('click', () => {
                personalityCreatorModal.style.display = 'none';
                this.resetPersonalityCreator();
            });
        }

        if (cancelCreatorBtn && personalityCreatorModal) {
            cancelCreatorBtn.addEventListener('click', () => {
                personalityCreatorModal.style.display = 'none';
                this.resetPersonalityCreator();
            });
        }

        if (randomOption && customOption && customCreator) {
            randomOption.addEventListener('click', () => {
                randomOption.classList.add('selected');
                customOption.classList.remove('selected');
                customCreator.style.display = 'none';
            });

            customOption.addEventListener('click', () => {
                customOption.classList.add('selected');
                randomOption.classList.remove('selected');
                customCreator.style.display = 'block';
            });
        }

        // Initialize emoji picker
        this.initializeEmojiPicker();
        
        // Initialize sliders
        this.initializeSliders();
        
        // Initialize form inputs for preview
        this.initializePreviewUpdates();

        if (createAiBtn) {
            createAiBtn.addEventListener('click', () => {
                this.createAIPersonality();
            });
        }
    }

    private initializeEmojiPicker(): void {
        const emojiOptions = document.querySelectorAll('.emoji-option');
        const avatarInput = document.getElementById('ai-avatar') as HTMLInputElement;
        const previewAvatar = document.getElementById('preview-avatar');

        emojiOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                emojiOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update input and preview
                const emoji = option.textContent || '🤖';
                if (avatarInput) avatarInput.value = emoji;
                if (previewAvatar) previewAvatar.textContent = emoji;
            });
        });
    }

    private initializeSliders(): void {
        const sliders = document.querySelectorAll('.slider-item input[type="range"]');
        
        sliders.forEach(slider => {
            const valueDisplay = slider.parentElement?.querySelector('.slider-value');
            
            slider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                if (valueDisplay) {
                    valueDisplay.textContent = target.value;
                }
            });
        });
    }

    private initializePreviewUpdates(): void {
        const nameInput = document.getElementById('ai-name') as HTMLInputElement;
        const personalityInput = document.getElementById('ai-personality') as HTMLTextAreaElement;
        const previewName = document.getElementById('preview-name');
        const previewPersonality = document.getElementById('preview-personality');

        if (nameInput && previewName) {
            nameInput.addEventListener('input', () => {
                previewName.textContent = nameInput.value || 'AI Name';
            });
        }

        if (personalityInput && previewPersonality) {
            personalityInput.addEventListener('input', () => {
                previewPersonality.textContent = personalityInput.value || 'Personality preview...';
            });
        }
    }

    private resetPersonalityCreator(): void {
        // Reset option selection
        const randomOption = document.getElementById('random-option');
        const customOption = document.getElementById('custom-option');
        const customCreator = document.getElementById('custom-creator');
        
        if (randomOption) randomOption.classList.remove('selected');
        if (customOption) customOption.classList.remove('selected');
        if (customCreator) customCreator.style.display = 'none';

        // Reset form inputs
        const form = document.getElementById('personality-creator-modal');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    if (input.type !== 'range') {
                        input.value = '';
                    } else {
                        input.value = '5';
                        const valueDisplay = input.parentElement?.querySelector('.slider-value');
                        if (valueDisplay) valueDisplay.textContent = '5';
                    }
                }
            });
        }

        // Reset emoji selection
        const emojiOptions = document.querySelectorAll('.emoji-option');
        emojiOptions.forEach(option => option.classList.remove('selected'));

        // Reset preview
        const previewName = document.getElementById('preview-name');
        const previewPersonality = document.getElementById('preview-personality');
        const previewAvatar = document.getElementById('preview-avatar');
        
        if (previewName) previewName.textContent = 'AI Name';
        if (previewPersonality) previewPersonality.textContent = 'Personality preview...';
        if (previewAvatar) previewAvatar.textContent = '🤖';
    }

    private async createAIPersonality(): Promise<void> {
        const randomOption = document.getElementById('random-option');
        const isRandom = randomOption?.classList.contains('selected');

        if (isRandom) {
            await this.createRandomPersonality();
        } else {
            await this.createCustomPersonality();
        }
    }

    private async createRandomPersonality(): Promise<void> {
        try {
            const response = await fetch('/api/personalities/random', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    communityId: this.currentCommunity
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Random AI personality created:', result);
                this.closePersonalityCreatorModal();
                // Show success message
                alert('AI personality created successfully!');
            } else {
                console.error('Failed to create random personality');
            }
        } catch (error) {
            console.error('Error creating random personality:', error);
        }
    }

    private async createCustomPersonality(): Promise<void> {
        const nameInput = document.getElementById('ai-name') as HTMLInputElement;
        const avatarInput = document.getElementById('ai-avatar') as HTMLInputElement;
        const personalityInput = document.getElementById('ai-personality') as HTMLTextAreaElement;
        const backstoryInput = document.getElementById('ai-backstory') as HTMLTextAreaElement;
        const responseStyleInput = document.getElementById('ai-response-style') as HTMLTextAreaElement;
        
        const responseFrequency = document.getElementById('response-frequency') as HTMLInputElement;
        const responseSpeed = document.getElementById('response-speed') as HTMLInputElement;
        const chattiness = document.getElementById('chattiness') as HTMLInputElement;
        const empathy = document.getElementById('empathy') as HTMLInputElement;

        if (!nameInput?.value || !personalityInput?.value) {
            alert('Please fill in at least the name and personality fields.');
            return;
        }

        const personalityData = {
            name: nameInput.value,
            avatar: avatarInput?.value || '🤖',
            personality: personalityInput.value,
            backstory: backstoryInput?.value || '',
            responseStyle: responseStyleInput?.value || '',
            behaviorSettings: {
                responseFrequency: parseInt(responseFrequency?.value || '5'),
                responseSpeed: parseInt(responseSpeed?.value || '5'),
                chattiness: parseInt(chattiness?.value || '5'),
                empathy: parseInt(empathy?.value || '5')
            },
            communityId: this.currentCommunity
        };

        try {
            const response = await fetch('/api/personalities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(personalityData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Custom AI personality created:', result);
                this.closePersonalityCreatorModal();
                // Show success message
                alert('AI personality created successfully!');
            } else {
                console.error('Failed to create custom personality');
            }
        } catch (error) {
            console.error('Error creating custom personality:', error);
        }
    }

    private closePersonalityCreatorModal(): void {
        const modal = document.getElementById('personality-creator-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetPersonalityCreator();
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new AICommunities();
});
