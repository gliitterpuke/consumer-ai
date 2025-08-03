 class PromptManager {
  static createSystemPrompt(agent, communityContext = {}) {
    const { name, personality, backstory, responseStyle, llm_config } = agent;
    const { communityName = 'Dating Advice Community', recentMessages = [] } = communityContext;
    
    let systemPrompt = llm_config.system_prompt_template;

    systemPrompt = systemPrompt.replace('{name}', name);
    systemPrompt = systemPrompt.replace('{personality}', personality);
    systemPrompt = systemPrompt.replace('{backstory}', backstory);
    systemPrompt = systemPrompt.replace('{responseStyle}', responseStyle);

    const recentConvo = `\n\nRecent conversation:\n${this.formatRecentMessages(recentMessages)}`;
    
    return `${systemPrompt}${recentConvo}\n\nYour response must be very short, like a text message. 1-2 sentences max.`;
  }

  static formatRecentMessages(messages) {
    return messages
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.author}: ${msg.content}`)
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
    console.log(`🔍 Validating response: "${response}" (type: ${typeof response}, length: ${response?.length})`);
    
    if (!response || typeof response !== 'string') {
      console.log(`❌ Validation failed: Invalid type or empty response`);
      return false;
    }
    
    // Basic validation - 750 char limit with 400 char target
    if (response.length < 10 || response.length > 750) {
      console.log(`❌ Validation failed: Length ${response.length} (must be 10-750 chars, target <400)`);
      return false;
    }
    
    // Check for common API errors
    const errorPatterns = [
      /I'm sorry, but I can't/i,
      /I cannot assist/i,
      /As an AI/i,
      /I'm an AI assistant/i
    ];
    
    const hasErrorPattern = errorPatterns.some(pattern => pattern.test(response));
    if (hasErrorPattern) {
      console.log(`❌ Validation failed: Contains error pattern`);
      return false;
    }
    
    console.log(`✅ Validation passed for response`);
    return true;
  }
}

module.exports = PromptManager;
