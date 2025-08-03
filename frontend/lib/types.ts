// Core message types
export interface Message {
  id: string
  content: string
  author: string
  timestamp: string
  isAI: boolean
  avatar: string
  userId?: string
}

// API Response types
export interface SendMessageResponse {
  success: boolean
  messageId: string
  error?: string
}

export interface MessagesResponse {
  messages?: Message[]
  error?: string
}

// LLM Stats from backend debug endpoint
export interface LLMStats {
  llm_service: {
    totalRequests: number
    cacheHits: number
    errors: number
    averageResponseTime: number
    totalTokens: number
    cacheHitRate: number
    cacheSize: number
  }
  gemini_available: boolean
  uptime: number
  memory_usage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers: number
  }
}

// Agent status from backend
export interface BackendAgent {
  id: string
  name: string
  avatar?: string
  personality?: string
  isOnline: boolean
  lastResponse?: string
  responseCount?: number
}

// Community types
export interface Community {
  id: string
  name: string
  icon: string
  description: string
  members: number
}

// API Error types
export interface APIError {
  message: string
  status?: number
  code?: string
}

// Request payload types
export interface SendMessagePayload {
  content: string
  userId: string
  username: string
}

// Agent activity tracking
export interface AgentActivity {
  agentId: string
  isResponding: boolean
  lastSeen: Date
  estimatedResponseTime?: number
}