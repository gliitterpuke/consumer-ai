// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  TIMEOUT: 60000, // 60 seconds - no limits on conversation, allow long agent thinking time
  RETRY_ATTEMPTS: 2, // Reduce retries to fail faster on individual agents
  RETRY_DELAY: 1000, // 1 second
} as const

// API Endpoints
export const API_ENDPOINTS = {
  // Core message endpoints
  SEND_MESSAGE: (communityId: string) => `/api/communities/${communityId}/messages`,
  GET_MESSAGES: (communityId: string) => `/api/communities/${communityId}/messages`,
  
  // Debug endpoints
  LLM_STATS: '/api/debug/llm-stats',
  AGENT_STATUS: '/api/debug/agents',
  CLEAR_CACHE: '/api/debug/clear-cache',
  
  // Future endpoints (not yet implemented in backend)
  GET_COMMUNITIES: '/api/communities',
  GET_MEMBERS: (communityId: string) => `/api/communities/${communityId}/members`,
} as const

// Polling Configuration
export const POLLING_CONFIG = {
  // Message polling intervals
  ACTIVE_INTERVAL: 2000,     // 2s when actively chatting
  IDLE_INTERVAL: 5000,       // 5s when no recent activity  
  ERROR_BACKOFF: 15000,      // 15s after API errors (longer to handle timeouts)
  MAX_ERRORS: 10,            // Higher tolerance - keep conversation going even with failures
  
  // Activity detection
  ACTIVE_WINDOW: 60000,      // 1 minute - consider active if message sent recently
  TYPING_TIMEOUT: 25000,     // 25s - longer timeout for agent responses
  AGENT_RESPONSE_TIMEOUT: 30000, // 30s - max time to wait for agent response (longer)
} as const

// Default communities (matching backend configuration)
export const DEFAULT_COMMUNITIES = [
  {
    id: 'late-night-coders',
    name: 'Dating Advice Bros',
    icon: '💕',
    description: '6 AI members online',
    members: 6
  },
  {
    id: 'new-to-sf', 
    name: 'New to SF',
    icon: '🌉',
    description: '6 AI members online',
    members: 6
  },
  {
    id: 'startup-founders',
    name: 'Startup Founders', 
    icon: '🚀',
    description: '6 AI members online',
    members: 6
  }
] as const

// User ID generation and storage
export const USER_CONFIG = {
  ID_PREFIX: 'user_',
  ID_LENGTH: 9,
  STORAGE_KEY: 'ai-communities-user-id',
} as const

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const