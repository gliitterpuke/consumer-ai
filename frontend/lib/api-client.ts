import { 
  Message, 
  SendMessageResponse, 
  MessagesResponse, 
  LLMStats, 
  SendMessagePayload 
} from './types'
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from './constants'

class APIClient {
  private baseURL: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS
    this.retryDelay = API_CONFIG.RETRY_DELAY
  }

  // Generic HTTP request method with retry logic
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout),
      ...options
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, defaultOptions)
      
      if (!response.ok) {
        throw new APIClientError({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        })
      }

      const data = await response.json()
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data)
      
      return data
    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${url}`, error)
      
      // Retry logic for network errors
      if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${this.retryAttempts}) in ${this.retryDelay}ms`)
        
        await this.delay(this.retryDelay * (retryCount + 1)) // Exponential backoff
        return this.request<T>(endpoint, options, retryCount + 1)
      }

      throw this.handleError(error)
    }
  }

  // Error handling helper
  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      (error.status && error.status >= 500)
    )
  }

  private handleError(error: any): APIClientError {
    if (error instanceof APIClientError) {
      return error
    }

    if (error.name === 'AbortError') {
      return new APIClientError({ message: 'Request timeout' })
    }

    if (error.name === 'TypeError') {
      return new APIClientError({ message: 'Network error - backend may be offline' })
    }

    return new APIClientError({ 
      message: error.message || 'Unknown API error',
      status: error.status
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Message API methods
  async sendMessage(
    communityId: string, 
    payload: SendMessagePayload
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      API_ENDPOINTS.SEND_MESSAGE(communityId),
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    )
  }

  async getMessages(communityId: string): Promise<Message[]> {
    const response = await this.request<Message[]>(
      API_ENDPOINTS.GET_MESSAGES(communityId)
    )
    
    // Transform backend message format to frontend format if needed
    return this.transformMessages(response)
  }

  // Debug API methods
  async getLLMStats(): Promise<LLMStats> {
    return this.request<LLMStats>(API_ENDPOINTS.LLM_STATS)
  }

  async clearCache(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      API_ENDPOINTS.CLEAR_CACHE,
      { method: 'POST' }
    )
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.getLLMStats()
      return true
    } catch {
      return false
    }
  }

  // Message transformation helper
  private transformMessages(messages: any[]): Message[] {
    if (!Array.isArray(messages)) {
      return []
    }

    return messages.map(msg => ({
      id: msg.id || Date.now().toString(),
      content: msg.content || '',
      author: msg.author || msg.username || 'Unknown',
      timestamp: msg.timestamp || new Date().toISOString(),
      isAI: msg.isAI || this.isAIAuthor(msg.author || msg.username),
      avatar: msg.avatar || this.getAuthorAvatar(msg.author || msg.username),
      userId: msg.userId
    }))
  }

    // Helper to detect AI authors
  private isAIAuthor(author: string): boolean {
    const aiAgents = [
      // Backend sends these lowercase underscore names
      'confidence_coach',
      'wingman_will',
      'smooth_sam',
      'relationship_rick',
      'honest_harry',
      'anxiety_andy',
      // Also support title case variants for compatibility
      'Confidence_Coach',
      'Wingman_Will',
      'Smooth_Sam',
      'Relationship_Rick',
      'Honest_Harry',
      'Anxiety_Andy'
    ]
    return aiAgents.includes(author)
  }

  // Helper to get author avatar
  private getAuthorAvatar(author: string): string {
    const avatarMap: Record<string, string> = {
      // Backend sends these lowercase underscore names
      'confidence_coach': '/avatars/confidence-coach.png',
      'wingman_will': '/avatars/wingman-will.png',
      'smooth_sam': '/avatars/smooth-sam.png', 
      'relationship_rick': '/avatars/relationship-rick.png',
      'honest_harry': '/avatars/honest-harry.png',
      'anxiety_andy': '/avatars/anxiety-andy.png',
      // Also support title case variants for compatibility
      'Confidence_Coach': '/avatars/confidence-coach.png',
      'Wingman_Will': '/avatars/wingman-will.png',
      'Smooth_Sam': '/avatars/smooth-sam.png', 
      'Relationship_Rick': '/avatars/relationship-rick.png',
      'Honest_Harry': '/avatars/honest-harry.png',
      'Anxiety_Andy': '/avatars/anxiety-andy.png'
    }
    return avatarMap[author] || '/avatars/default-user.png'
  }
}

// Custom error class
class APIClientError extends Error {
  status?: number
  code?: string

  constructor({ message, status, code }: { message: string; status?: number; code?: string }) {
    super(message)
    this.name = 'APIClientError'
    this.status = status
    this.code = code
  }
}

// Export singleton instance
export const apiClient = new APIClient()
export { APIClientError }