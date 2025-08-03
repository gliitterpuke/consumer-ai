const GeminiProvider = require('./gemini');
const PromptManager = require('./prompt');

class LLMService {
  constructor() {
    this.provider = new GeminiProvider();
    this.responseCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Performance monitoring
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      errors: 0,
      averageResponseTime: 0,
      totalTokens: 0
    };
  }

  async generateAgentResponse(agent, userMessage, context = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      // Check cache first
      const cacheKey = this.createCacheKey(agent.id, userMessage);
      const cachedResponse = this.getFromCache(cacheKey);
      if (cachedResponse) {
        this.stats.cacheHits++;
        console.log(`📦 Cache hit for ${agent.name} (${this.getCacheHitRate()}% hit rate)`);
        return cachedResponse;
      }

      // Generate system prompt
      const systemPrompt = PromptManager.createSystemPrompt(agent, context);
      
      // Add user context if available
      const memoryContext = context.aiMemory ? 
        PromptManager.createContextFromMemory(context.aiMemory, context.userId) : '';
      
      const enhancedMessage = PromptManager.enhanceUserMessage(userMessage, memoryContext);


      // Generate response with retry logic
      const llmConfig = agent.llm_config || {};
      let response;
      let attempts = 0;
      const maxAttempts = 2;
      
      while (attempts < maxAttempts) {
        try {
          response = await this.provider.generateResponse(
            systemPrompt, 
            enhancedMessage, 
            llmConfig
          );
          
          // Validate response
          if (!PromptManager.validateResponse(response)) {
            attempts++;
            if (attempts < maxAttempts) {
              console.log(`⚠️ Invalid response attempt ${attempts}/${maxAttempts}, retrying...`);
              continue;
            }
            throw new Error(`Invalid response after ${maxAttempts} attempts`);
          }
          
          break; // Success!
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          console.log(`🔄 LLM attempt ${attempts}/${maxAttempts} failed: ${error.message}`);
        }
      }

      // Cache the response
      this.setCache(cacheKey, response);
      
      // Update performance stats
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, response.length);
      
      console.log(`✨ ${agent.name} responded with LLM (${responseTime}ms): ${response.substring(0, 50)}...`);
      return response;

    } catch (error) {
      this.stats.errors++;
      console.error(`❌ LLM Error for ${agent.name} after retries:`, error.message);
      
      // Fallback to template response
      console.log(`🔄 Using fallback response for ${agent.name}`);
      return this.getFallbackResponse(agent, userMessage);
    }
  }

  getFallbackResponse(agent, userMessage) {
    // Simple fallback responses based on agent type
    const fallbacks = {
      confidence_coach: [
        "You've got this! Confidence comes from taking action, even when you're nervous.",
        "Remember, everyone feels nervous sometimes. The key is to push through and be authentic.",
        "Focus on being the best version of yourself. Confidence is attractive!"
      ],
      wingman_will: [
        "Bro, just be yourself and have fun with it! Dating should be enjoyable.",
        "Here's the thing - genuine interest goes a long way. Ask questions and listen.",
        "Don't overthink it, man. Sometimes the best conversations happen naturally."
      ],
      smooth_sam: [
        "It's all about the subtle charm. A genuine compliment can work wonders.",
        "Timing is everything. Know when to be playful and when to be sincere.",
        "Smooth doesn't mean fake - authenticity with style is the winning combo."
      ]
    };

    const agentFallbacks = fallbacks[agent.id] || [
      "That's an interesting point. What do you think about approaching it differently?",
      "I hear you. Sometimes the best advice is to trust your instincts.",
      "Thanks for sharing that. Every situation is unique, so consider what feels right for you."
    ];

    const randomResponse = agentFallbacks[Math.floor(Math.random() * agentFallbacks.length)];
    console.log(`🔄 Fallback response for ${agent.name}: ${randomResponse}`);
    return randomResponse;
  }

  createCacheKey(agentId, message) {
    // Create a more sophisticated cache key
    const normalizedMessage = message.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .substring(0, 50);
    
    // Simple hash function for better cache distribution
    let hash = 0;
    for (let i = 0; i < normalizedMessage.length; i++) {
      const char = normalizedMessage.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${agentId}_${Math.abs(hash)}`;
  }

  getFromCache(key) {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.response;
    }
    this.responseCache.delete(key);
    return null;
  }

  setCache(key, response) {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  isLLMAvailable() {
    return this.provider.isAvailable();
  }

  updateStats(responseTime, responseLength) {
    // Update average response time
    const total = this.stats.totalRequests;
    this.stats.averageResponseTime = 
      ((this.stats.averageResponseTime * (total - 1)) + responseTime) / total;
    
    // Estimate tokens (rough approximation)
    this.stats.totalTokens += Math.ceil(responseLength / 4);
  }

  getCacheHitRate() {
    if (this.stats.totalRequests === 0) return 0;
    return Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100);
  }

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.getCacheHitRate(),
      cacheSize: this.responseCache.size
    };
  }

  clearCache() {
    this.responseCache.clear();
    console.log('🧹 LLM cache cleared');
  }

  logStats() {
    const stats = this.getStats();
    console.log('📊 LLM Service Stats:', {
      requests: stats.totalRequests,
      cacheHits: `${stats.cacheHits}/${stats.totalRequests} (${stats.cacheHitRate}%)`,
      avgResponseTime: `${Math.round(stats.averageResponseTime)}ms`,
      errors: stats.errors,
      estimatedTokens: stats.totalTokens
    });
  }
}

module.exports = LLMService;