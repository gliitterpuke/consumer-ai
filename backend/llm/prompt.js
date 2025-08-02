class PromptManager {
  static createSystemPrompt(agent, communityContext = {}) {
    const { name, personality, backstory, responseStyle, avatar } = agent;
    const { communityName = 'Dating Advice Community', recentMessages = [] } = communityContext;
    
    return `You are ${name}, an AI personality in the "${communityName}" community chat.

PERSONALITY:
${personality}

BACKSTORY:
${backstory}

RESPONSE STYLE:
${responseStyle}

COMMUNITY CONTEXT:
- You're one of several AI personalities who help users with dating advice
- Keep responses conversational, supportive, and true to your personality
- Reference your unique perspective and experiences when relevant
- Stay in character at all times

RESPONSE GUIDELINES:
- Keep responses under 150 words
- Be helpful but don't repeat what others just said
- Use natural, casual language
- Show your personality through your advice style
- If someone asks for help, give specific, actionable advice

${recentMessages.length > 0 ? `RECENT CONVERSATION:\n${this.formatRecentMessages(recentMessages)}` : ''}

Respond as ${name} would, staying true to your personality and expertise.`;
  }

  static formatRecentMessages(messages) {
    return messages
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');
  }

  static createContextFromMemory(aiMemory, userId) {
    if (!aiMemory || !aiMemory.userProfiles[userId]) {
      return '';
    }

    const userProfile = aiMemory.userProfiles[userId];
    const conversations = aiMemory.conversations || [];
    const recentConversations = conversations
      .filter(conv => conv.userId === userId)
      .slice(-5); // Last 5 conversations

    let context = '';
    
    // User profile information
    if (userProfile.preferences?.length > 0) {
      context += `User interests: ${userProfile.preferences.join(', ')}\n`;
    }
    
    if (userProfile.relationship_status) {
      context += `Relationship status: ${userProfile.relationship_status}\n`;
    }

    if (userProfile.personality_traits?.length > 0) {
      context += `User traits: ${userProfile.personality_traits.join(', ')}\n`;
    }

    // Previous conversation summaries
    if (recentConversations.length > 0) {
      context += `\nRecent conversation history:\n`;
      recentConversations.forEach((conv, index) => {
        const timeAgo = this.getTimeAgo(conv.timestamp);
        context += `${index + 1}. ${timeAgo}: ${conv.summary || conv.topic}\n`;
      });
    }

    // Interaction patterns
    const interactionCount = aiMemory.interactions?.filter(i => i.userId === userId).length || 0;
    if (interactionCount > 0) {
      context += `\nInteraction history: ${interactionCount} previous conversations\n`;
    }

    // Relationship with this AI
    if (aiMemory.relationships && aiMemory.relationships[userId]) {
      const relationship = aiMemory.relationships[userId];
      context += `Relationship level: ${relationship.relationship_type || 'new'} (trust: ${relationship.trust_level || 0.5})\n`;
    }

    return context.trim();
  }

  static getTimeAgo(timestamp) {
    if (!timestamp) return 'recently';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'recently';
  }

  static enhanceUserMessage(message, context = '') {
    if (!context) return message;
    
    return `${message}

CONTEXT ABOUT THIS USER:
${context}`;
  }

  static validateResponse(response) {
    if (!response || typeof response !== 'string') {
      return false;
    }
    
    // Basic validation
    if (response.length < 10 || response.length > 500) {
      return false;
    }
    
    // Check for common API errors
    const errorPatterns = [
      /I'm sorry, but I can't/i,
      /I cannot assist/i,
      /As an AI/i,
      /I'm an AI assistant/i
    ];
    
    return !errorPatterns.some(pattern => pattern.test(response));
  }
}

module.exports = PromptManager;