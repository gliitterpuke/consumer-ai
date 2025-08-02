// AI Personality Creator
class PersonalityCreator {
    constructor() {
        this.selectedOption = null;
        this.currentPersonality = null;
        this.randomPersonalities = this.generateRandomPersonalityPool();
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Option selection
        document.getElementById('random-option').addEventListener('click', () => {
            this.selectOption('random');
        });

        document.getElementById('custom-option').addEventListener('click', () => {
            this.selectOption('custom');
        });

        // Random generation
        document.getElementById('generate-random').addEventListener('click', () => {
            this.generateRandomPersonality();
        });

        // Custom form inputs
        document.getElementById('ai-name').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('ai-personality').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('ai-backstory').addEventListener('input', () => {
            this.updatePreview();
        });

        document.getElementById('ai-response-style').addEventListener('input', () => {
            this.updatePreview();
        });

        // Emoji picker
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('ai-avatar').value = btn.dataset.emoji;
                this.updatePreview();
            });
        });

        // Sliders
        document.getElementById('response-frequency').addEventListener('input', (e) => {
            document.getElementById('freq-value').textContent = e.target.value + '%';
        });

        document.getElementById('response-speed').addEventListener('input', (e) => {
            const speeds = ['Instant', 'Very Fast', 'Fast', 'Quick', 'Medium', 'Slow', 'Relaxed', 'Thoughtful', 'Deliberate', 'Very Slow'];
            document.getElementById('speed-value').textContent = speeds[e.target.value - 1];
        });

        document.getElementById('chattiness').addEventListener('input', (e) => {
            const levels = ['Minimal', 'Brief', 'Concise', 'Moderate', 'Medium', 'Talkative', 'Chatty', 'Verbose', 'Very Chatty', 'Extremely Chatty'];
            document.getElementById('chat-value').textContent = levels[e.target.value - 1];
        });

        document.getElementById('empathy').addEventListener('input', (e) => {
            const levels = ['Cold', 'Distant', 'Reserved', 'Neutral', 'Caring', 'Warm', 'Supportive', 'Very Empathetic', 'Extremely Caring', 'Deeply Compassionate'];
            document.getElementById('empathy-value').textContent = levels[e.target.value - 1];
        });

        // Create personality button
        document.getElementById('create-personality').addEventListener('click', () => {
            this.createPersonality();
        });
    }

    selectOption(option) {
        this.selectedOption = option;
        
        // Update UI
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.getElementById(`${option}-option`).classList.add('selected');
        
        // Show/hide appropriate sections
        if (option === 'random') {
            document.getElementById('custom-form').style.display = 'none';
            document.getElementById('random-preview').style.display = 'block';
            document.getElementById('preview-card').style.display = 'none';
            this.generateRandomPersonality();
        } else {
            document.getElementById('random-preview').style.display = 'none';
            document.getElementById('custom-form').style.display = 'block';
            document.getElementById('preview-card').style.display = 'block';
            this.updatePreview();
        }
    }

    generateRandomPersonalityPool() {
        const names = [
            'Wise_Owl', 'Chill_Vibe', 'Energy_Boost', 'Deep_Thinker', 'Social_Spark',
            'Calm_Waters', 'Fire_Spirit', 'Gentle_Soul', 'Bold_Move', 'Creative_Mind',
            'Steady_Rock', 'Free_Bird', 'Bright_Star', 'Cool_Breeze', 'Warm_Heart',
            'Sharp_Wit', 'Kind_Eyes', 'Strong_Will', 'Soft_Voice', 'Quick_Smile'
        ];

        const avatars = ['🦉', '😌', '⚡', '🧠', '✨', '🌊', '🔥', '😇', '💪', '🎨', '🗿', '🕊️', '⭐', '🌬️', '❤️', '🧐', '👁️', '💎', '🤫', '😊'];

        const personalityTraits = [
            'Wise and thoughtful, always considers multiple perspectives before giving advice',
            'Laid-back and chill, helps people relax and see the lighter side of situations',
            'High-energy motivator who pumps people up and encourages action',
            'Deep philosophical thinker who asks profound questions',
            'Social butterfly who connects people and builds community',
            'Calm and centered, provides stability in chaotic moments',
            'Passionate and intense, inspires people to pursue their dreams',
            'Gentle and nurturing, creates safe spaces for vulnerability',
            'Bold risk-taker who pushes people out of their comfort zones',
            'Creative problem-solver who thinks outside the box'
        ];

        const backstories = [
            'Former therapist who learned that sometimes the best advice comes from lived experience',
            'Traveled the world and learned that every culture has wisdom to offer',
            'Overcame major personal challenges and now helps others do the same',
            'Was once extremely introverted but learned to connect with others authentically',
            'Former corporate executive who left it all behind to focus on what really matters',
            'Grew up in a chaotic household and learned the value of inner peace',
            'Started from nothing and built something amazing through persistence',
            'Lost everything once and discovered what true resilience means',
            'Was always the friend people came to for advice, now it\'s their calling',
            'Struggled with the same issues they now help others overcome'
        ];

        const responseStyles = [
            'Thoughtful and measured, often starts with "I\'ve been thinking about what you said..."',
            'Casual and friendly, uses lots of "dude" and "honestly" in conversations',
            'Enthusiastic and encouraging, frequently uses exclamation points and motivational language',
            'Asks probing questions, responds with "That\'s interesting, have you considered..."',
            'Warm and inclusive, always tries to connect people with similar experiences',
            'Calm and reassuring, speaks in a soothing tone with gentle suggestions',
            'Direct and passionate, doesn\'t sugarcoat but always comes from a place of love',
            'Soft-spoken and empathetic, validates feelings before offering guidance',
            'Challenging but supportive, pushes people while believing in them completely',
            'Creative and metaphorical, explains things through stories and analogies'
        ];

        return { names, avatars, personalityTraits, backstories, responseStyles };
    }

    generateRandomPersonality() {
        const { names, avatars, personalityTraits, backstories, responseStyles } = this.randomPersonalities;
        
        const randomPersonality = {
            name: names[Math.floor(Math.random() * names.length)],
            avatar: avatars[Math.floor(Math.random() * avatars.length)],
            personality: personalityTraits[Math.floor(Math.random() * personalityTraits.length)],
            backstory: backstories[Math.floor(Math.random() * backstories.length)],
            responseStyle: responseStyles[Math.floor(Math.random() * responseStyles.length)],
            responseFrequency: Math.floor(Math.random() * 60) + 30, // 30-90%
            responseSpeed: Math.floor(Math.random() * 8) + 2, // 2-10
            chattiness: Math.floor(Math.random() * 8) + 2, // 2-10
            empathy: Math.floor(Math.random() * 6) + 5 // 5-10 (tend toward empathetic)
        };

        this.currentPersonality = randomPersonality;
        this.updateRandomPreview();
    }

    updateRandomPreview() {
        if (!this.currentPersonality) return;

        document.getElementById('random-avatar').textContent = this.currentPersonality.avatar;
        document.getElementById('random-name').textContent = this.currentPersonality.name;
        document.getElementById('random-description').textContent = this.currentPersonality.personality;
    }

    updatePreview() {
        if (this.selectedOption !== 'custom') return;

        const name = document.getElementById('ai-name').value || 'Unnamed_AI';
        const avatar = document.getElementById('ai-avatar').value || '🤖';
        const personality = document.getElementById('ai-personality').value || 'No personality defined yet...';
        const backstory = document.getElementById('ai-backstory').value || 'No backstory defined yet...';
        const responseStyle = document.getElementById('ai-response-style').value || 'No response style defined yet...';

        document.getElementById('preview-avatar').textContent = avatar;
        document.getElementById('preview-name').textContent = name;
        document.getElementById('preview-summary').textContent = personality.substring(0, 100) + (personality.length > 100 ? '...' : '');
        document.getElementById('preview-backstory').textContent = backstory.substring(0, 150) + (backstory.length > 150 ? '...' : '');
        document.getElementById('preview-style').textContent = responseStyle.substring(0, 150) + (responseStyle.length > 150 ? '...' : '');

        this.currentPersonality = {
            name,
            avatar,
            personality,
            backstory,
            responseStyle,
            responseFrequency: document.getElementById('response-frequency').value,
            responseSpeed: document.getElementById('response-speed').value,
            chattiness: document.getElementById('chattiness').value,
            empathy: document.getElementById('empathy').value
        };
    }

    async createPersonality() {
        if (!this.currentPersonality) {
            alert('Please create a personality first!');
            return;
        }

        // Validate required fields for custom personalities
        if (this.selectedOption === 'custom') {
            if (!this.currentPersonality.name.trim()) {
                alert('Please enter a name for your AI personality!');
                return;
            }
            if (!this.currentPersonality.personality.trim()) {
                alert('Please describe the personality!');
                return;
            }
        }

        try {
            // Send to backend
            const response = await fetch('/api/personalities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...this.currentPersonality,
                    communityId: 'late-night-coders', // Default community for now
                    createdBy: 'user',
                    createdAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Show success message
                this.showSuccessMessage();
                
                // Redirect after a moment
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error('Failed to create personality');
            }
        } catch (error) {
            console.error('Error creating personality:', error);
            alert('Failed to create personality. Please try again.');
        }
    }

    showSuccessMessage() {
        // Create success overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="modal" style="text-align: center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #ffffff; margin-bottom: 16px;">Personality Created!</h2>
                <p style="color: #b9bbbe; margin-bottom: 20px;">
                    ${this.currentPersonality.name} has been added to your community and is ready to interact!
                </p>
                <div style="background-color: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                        <div style="font-size: 32px;">${this.currentPersonality.avatar}</div>
                        <div>
                            <h3 style="color: #ffffff; margin: 0;">${this.currentPersonality.name}</h3>
                            <p style="color: #b9bbbe; margin: 4px 0 0 0; font-size: 14px;">
                                ${this.currentPersonality.personality.substring(0, 80)}...
                            </p>
                        </div>
                    </div>
                </div>
                <p style="color: #72767d; font-size: 14px;">Redirecting to community...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
}

// Initialize the personality creator
document.addEventListener('DOMContentLoaded', () => {
    new PersonalityCreator();
});
