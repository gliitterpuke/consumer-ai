const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
      this.client = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    this.defaultConfig = {
      model: 'models/gemini-2.5-flash',
      temperature: 0.8,
      maxOutputTokens: 150,
      topP: 0.9,
      topK: 40
    };
    
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequest = 0;
    this.minRequestInterval = 100; // 100ms between requests
  }

  async generateResponse(systemPrompt, userMessage, config = {}) {
    if (!this.genAI) {
      throw new Error('Gemini client not initialized - check API key');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    
    return this.queueRequest(async () => {
      return this.retryWithBackoff(async () => {
        try {
          // Get the model
          const model = this.genAI.getGenerativeModel({ 
            model: finalConfig.model,
            generationConfig: {
              temperature: finalConfig.temperature,
              maxOutputTokens: finalConfig.maxOutputTokens,
              topP: finalConfig.topP,
              topK: finalConfig.topK,
            }
          });

          // Combine system prompt and user message for Gemini
          const prompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;

          const result = await model.generateContent(prompt);
          const response = result.response;
          const content = response.text()?.trim();

          console.log(`🤖 Raw Gemini response:`, {
            hasResult: !!result,
            hasResponse: !!response,
            rawContent: content,
            contentLength: content?.length,
            contentType: typeof content
          });

          if (!content) {
            console.log(`❌ Empty response from Gemini - response object:`, response);
            throw new Error('Empty response from Gemini');
          }

          return content;
        } catch (error) {
          console.error('❌ Gemini API Error:', error.message);
          console.error('❌ Full error:', error);
          if (error.response) {
            console.error('❌ Response status:', error.response.status);
            console.error('❌ Response data:', error.response.data);
          }
          throw error;
        }
      });
    });
  }

  async retryWithBackoff(requestFn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await requestFn();
        if (attempt > 0) {
          console.log(`✅ Retry successful on attempt ${attempt + 1}`);
        }
        return result;
      } catch (error) {
        const isRetryableError = this.isRetryableError(error);
        
        if (attempt === maxRetries - 1 || !isRetryableError) {
          console.log(`❌ Final attempt failed or non-retryable error: ${error.message}`);
          throw error;
        }
        
        const backoffDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.log(`🔄 Retry ${attempt + 1}/${maxRetries} after ${Math.round(backoffDelay)}ms due to: ${error.message}`);
        await this.sleep(backoffDelay);
      }
    }
  }

  isRetryableError(error) {
    const retryablePatterns = [
      /rate limit/i,
      /quota/i,
      /timeout/i,
      /429/,
      /503/,
      /502/,
      /network/i,
      /temporarily unavailable/i
    ];
    
    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || 
      (error.response && pattern.test(error.response.status?.toString()))
    );
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
    return this.genAI !== null;
  }
}

module.exports = GeminiProvider;