import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'
import { Message, SendMessagePayload } from '@/lib/types'
import { POLLING_CONFIG, USER_CONFIG } from '@/lib/constants'

interface UseMessagesProps {
  communityId: string
  username: string
  enabled?: boolean
}

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  refreshMessages: () => Promise<void>
  isPolling: boolean
  connectionStatus: 'connected' | 'disconnected' | 'error'
}

export function useMessages({ 
  communityId, 
  username, 
  enabled = true 
}: UseMessagesProps): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTime = useRef<Date>(new Date())
  const consecutiveErrors = useRef(0)
  const userId = useRef<string>('')

  // Generate or retrieve user ID
  useEffect(() => {
    const stored = localStorage.getItem(USER_CONFIG.STORAGE_KEY)
    if (stored) {
      userId.current = stored
    } else {
      const newId = USER_CONFIG.ID_PREFIX + Math.random().toString(36).substr(2, USER_CONFIG.ID_LENGTH)
      userId.current = newId
      localStorage.setItem(USER_CONFIG.STORAGE_KEY, newId)
    }
  }, [])

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!enabled || !communityId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const fetchedMessages = await apiClient.getMessages(communityId)
      setMessages(fetchedMessages)
      setConnectionStatus('connected')
      consecutiveErrors.current = 0
      
      console.log(`📥 Loaded ${fetchedMessages.length} messages for ${communityId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      setConnectionStatus('error')
      consecutiveErrors.current++
      
      console.error('❌ Failed to load messages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [communityId, enabled])

  // Send message function
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !username || !communityId) return

    const payload: SendMessagePayload = {
      content: content.trim(),
      userId: userId.current,
      username
    }

    try {
      setError(null)
      
      // Optimistically add user message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: payload.content,
        author: username,
        timestamp: new Date().toISOString(),
        isAI: false,
        avatar: '/avatars/default-user.png',
        userId: userId.current
      }
      
      setMessages(prev => [...prev, optimisticMessage])
      lastMessageTime.current = new Date()

      // Send to backend
      const response = await apiClient.sendMessage(communityId, payload)
      
      if (response.success) {
        console.log(`✅ Message sent successfully: ${response.messageId}`)
        // The actual message will be picked up by polling
      } else {
        throw new Error(response.error || 'Failed to send message')
      }
      
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      
      // Don't block the UI for timeouts - just log and continue
      if (errorMessage.includes('timeout') || errorMessage.includes('signal')) {
        console.warn('⚠️ Message send timeout (agent may still respond):', err)
        setError('Message sent - some agents may be slow to respond')
        // Clear error after a few seconds
        setTimeout(() => setError(null), 5000)
      } else {
        setError(errorMessage)
        console.error('❌ Failed to send message:', err)
      }
    }
  }, [communityId, username])

  // Polling function
  const pollForUpdates = useCallback(async () => {
    if (!enabled || !communityId || consecutiveErrors.current >= POLLING_CONFIG.MAX_ERRORS) {
      return
    }

    try {
      const fetchedMessages = await apiClient.getMessages(communityId)
      
      // Only update if we have new messages
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(fetchedMessages)) {
          console.log(`🔄 Messages updated: ${fetchedMessages.length} total`)
          return fetchedMessages
        }
        return prev
      })
      
      setConnectionStatus('connected')
      consecutiveErrors.current = 0
      setError(null) // Clear any previous errors
      
    } catch (err) {
      consecutiveErrors.current++
      
      if (consecutiveErrors.current >= POLLING_CONFIG.MAX_ERRORS) {
        setConnectionStatus('error')
        setError('Connection lost - but conversation continues!')
        console.error('❌ Max polling errors reached, but allowing conversation to continue')
      } else {
        // Don't set error state for individual timeouts - keep conversation flowing
        setConnectionStatus('connected') // Keep showing as connected
        console.warn(`⚠️ Polling error ${consecutiveErrors.current}/${POLLING_CONFIG.MAX_ERRORS} (continuing):`, err)
      }
    }
  }, [communityId, enabled])

  // Start/stop polling
  useEffect(() => {
    if (!enabled || !communityId) return

    // Determine polling interval based on recent activity
    const timeSinceLastMessage = Date.now() - lastMessageTime.current.getTime()
    const isActive = timeSinceLastMessage < POLLING_CONFIG.ACTIVE_WINDOW
    const interval = isActive ? POLLING_CONFIG.ACTIVE_INTERVAL : POLLING_CONFIG.IDLE_INTERVAL

    // Set up polling
    setIsPolling(true)
    pollingInterval.current = setInterval(pollForUpdates, interval)

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
        pollingInterval.current = null
      }
      setIsPolling(false)
    }
  }, [pollForUpdates, enabled, communityId])

  // Load initial messages when community changes
  useEffect(() => {
    if (enabled && communityId) {
      loadMessages()
    }
  }, [loadMessages, communityId, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages: loadMessages,
    isPolling,
    connectionStatus
  }
}