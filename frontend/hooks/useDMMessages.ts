import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api-client'

interface DMMessage {
  id: string
  content: string
  author: string
  timestamp: string
  isAI: boolean
  avatar: string
}

interface UseDMMessagesProps {
  agentId: string
  userId: string
  username: string
  enabled?: boolean
}

export function useDMMessages({ agentId, userId, username, enabled = true }: UseDMMessagesProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const lastMessageCountRef = useRef(0)

  // Fetch DM history from backend
  const fetchDMHistory = useCallback(async () => {
    if (!enabled || !agentId || !userId) return

    try {
      setConnectionStatus('connected')
      const response = await apiClient.get(`/api/dms/${agentId}/${userId}`)
      
      if (response?.messages) {
        setMessages(response.messages)
        lastMessageCountRef.current = response.messages.length
        setError(null)
      }
    } catch (err) {
      console.error('💀 Failed to fetch DM history:', err)
      setError('Failed to load messages')
      setConnectionStatus('error')
    }
  }, [agentId, userId, enabled])

  // Send a new DM message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !agentId || !userId || !username) return

    setIsLoading(true)
    setError(null)

    try {
      // Send message to backend
      await apiClient.post(`/api/dms/${agentId}/${userId}`, {
        content: content.trim(),
        username,
        userId
      })
      
      console.log(`💬 Sent DM to ${agentId}: ${content.substring(0, 30)}...`)
      
      // Show AI typing indicator after message is sent
      setIsTyping(true)
      
      // Wait briefly for AI response, then refresh
      setTimeout(async () => {
        await fetchDMHistory()
        setIsTyping(false)
      }, 1500)
      
    } catch (err) {
      console.error('💀 Failed to send DM:', err)
      setError('Failed to send message')
      setIsTyping(false)
    } finally {
      // Allow user to type immediately after sending
      setIsLoading(false)
    }
  }, [agentId, userId, username, fetchDMHistory])

  // Start polling for new messages
  useEffect(() => {
    if (!enabled || !agentId || !userId) {
      setConnectionStatus('disconnected')
      return
    }

    // Initial fetch
    fetchDMHistory()

    // Set up polling for new messages every 2 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchDMHistory()
    }, 2000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [agentId, userId, enabled, fetchDMHistory])

  // Log message updates for debugging
  useEffect(() => {
    console.log(`🔄 DM Messages updated: ${messages.length} total (${agentId})`)
  }, [messages, agentId])

  return {
    messages,
    sendMessage,
    isLoading,
    isTyping,
    error,
    connectionStatus,
    refreshMessages: fetchDMHistory
  }
}