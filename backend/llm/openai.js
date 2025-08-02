const OpenAI = require('openai');

class OpenAIProvider {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
      this.client = null;
      return;
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.defaultConfig = {
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 150
    };
    
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequest = 0;
    this.minRequestInterval = 100; // 100ms between requests
  }

  async generateResponse(systemPrompt, userMessage, config = {}) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - check API key');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    
    return this.queueRequest(async () => {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ];

        const response = await this.client.chat.completions.create({
          model: finalConfig.model,
          messages: messages,
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.max_tokens
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return content;
      } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        throw error;
      }
    });
  }

  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.sleep(this.minRequestInterval - timeSinceLastRequest);
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await requestFn();
        this.lastRequest = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isAvailable() {
    return this.client !== null;
  }
}

module.exports = OpenAIProvider;