import { useState, useEffect, useCallback, useRef } from 'react'
import { Message } from '@/lib/types'
import { Agent } from '@/lib/agents'
import { POLLING_CONFIG } from '@/lib/constants'

interface AgentActivity {
  agentId: string
  isResponding: boolean
  lastSeen: Date
  estimatedResponseTime?: number
}

interface UseAgentActivityProps {
  messages: Message[]
  agents: Agent[]
}

interface UseAgentActivityReturn {
  agentActivities: Record<string, AgentActivity>
  respondingAgents: string[]
  updateAgentResponding: (agentId: string, isResponding: boolean) => void
}

export function useAgentActivity({ 
  messages, 
  agents 
}: UseAgentActivityProps): UseAgentActivityReturn {
  const [agentActivities, setAgentActivities] = useState<Record<string, AgentActivity>>({})
  const lastMessageCount = useRef(messages.length)
  const respondingTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // Get responding agents list
  const respondingAgents = Object.entries(agentActivities)
    .filter(([_, activity]) => activity.isResponding)
    .map(([agentId, _]) => agentId)

  // Initialize agent activities
  useEffect(() => {
    const initialActivities: Record<string, AgentActivity> = {}
    
    agents.forEach(agent => {
      // Find last message from this agent
      const lastMessage = messages
        .filter(msg => msg.author === agent.name)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      initialActivities[agent.id] = {
        agentId: agent.id,
        isResponding: false,
        lastSeen: lastMessage ? new Date(lastMessage.timestamp) : new Date(0),
        estimatedResponseTime: agent.cooldownMs / 2 // Rough estimate based on cooldown
      }
    })

    setAgentActivities(initialActivities)
  }, [agents]) // Only re-run when agents change

  // Detect when new messages arrive and predict agent responses
  useEffect(() => {
    const newMessageCount = messages.length
    
    // Only process if we have new messages
    if (newMessageCount > lastMessageCount.current) {
      const newMessages = messages.slice(lastMessageCount.current)
      lastMessageCount.current = newMessageCount

      // Process each new message
      newMessages.forEach(message => {
        if (message.isAI) {
          // AI agent responded - update their last seen time
          const agent = agents.find(a => a.name === message.author)
          if (agent) {
            setAgentActivities(prev => ({
              ...prev,
              [agent.id]: {
                ...prev[agent.id],
                isResponding: false,
                lastSeen: new Date(message.timestamp)
              }
            }))

            // Clear any responding timeout for this agent
            if (respondingTimeouts.current[agent.id]) {
              clearTimeout(respondingTimeouts.current[agent.id])
              delete respondingTimeouts.current[agent.id]
            }
          }
        } else {
          // Human message - predict which agents might respond
          predictAgentResponses(message, agents)
        }
      })

      // Force clear any stuck typing indicators after processing new messages
      setTimeout(() => {
        const stuckAgents = Object.entries(agentActivities).filter(([_, activity]) => 
          activity.isResponding && 
          Date.now() - (activity.lastSeen?.getTime() || 0) > POLLING_CONFIG.AGENT_RESPONSE_TIMEOUT
        )
        
        if (stuckAgents.length > 0) {
          console.log(`🧹 Clearing stuck typing indicators for: ${stuckAgents.map(([id]) => id).join(', ')}`)
          setAgentActivities(prev => {
            const updated = { ...prev }
            stuckAgents.forEach(([agentId]) => {
              updated[agentId] = {
                ...updated[agentId],
                isResponding: false
              }
              // Clear timeout if exists
              if (respondingTimeouts.current[agentId]) {
                clearTimeout(respondingTimeouts.current[agentId])
                delete respondingTimeouts.current[agentId]
              }
            })
            return updated
          })
        }
      }, 1000) // Check 1s after messages update
    }
  }, [messages, agents])

  // Predict which agents might respond based on behavioral patterns
  const predictAgentResponses = useCallback((message: Message, agents: Agent[]) => {
    // Don't predict if message is too short or generic
    if (message.content.trim().length < 10) return
    
    agents.forEach(agent => {
      // Check if agent is likely to respond based on:
      // 1. Response probability (but scaled down for predictions)
      // 2. Cooldown period since last response
      // 3. Message content relevance
      // 4. Don't predict if already responding

      const currentActivity = agentActivities[agent.id]
      if (currentActivity?.isResponding) return // Skip if already responding

      const lastResponse = currentActivity?.lastSeen || new Date(0)
      const timeSinceLastResponse = Date.now() - lastResponse.getTime()
      const isOffCooldown = timeSinceLastResponse > (agent.cooldownMs || 30000)

      // More conservative prediction: lower probability and require cooldown
      const predictionProbability = (agent.responseRate || 0.5) * 0.3 // Only 30% of normal rate for predictions
      const shouldPredict = isOffCooldown && Math.random() < predictionProbability

      if (shouldPredict) {
        console.log(`🔮 Predicting response from ${agent.name}`)
        
        // Shorter, more realistic response time predictions
        const minDelay = 3000 // 3 seconds minimum  
        const maxDelay = 8000 // 8 seconds maximum
        const estimatedDelay = minDelay + Math.random() * (maxDelay - minDelay)

        // Mark agent as responding
        setAgentActivities(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            isResponding: true,
            estimatedResponseTime: estimatedDelay
          }
        }))

        // Set timeout to stop showing "responding" if no actual response
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout: ${agent.name} prediction expired`)
          setAgentActivities(prev => ({
            ...prev,
            [agent.id]: {
              ...prev[agent.id],
              isResponding: false
            }
          }))
          delete respondingTimeouts.current[agent.id]
        }, POLLING_CONFIG.AGENT_RESPONSE_TIMEOUT) // Use consistent 20s timeout

        respondingTimeouts.current[agent.id] = timeoutId
      }
    })
  }, [agentActivities])

  // Manual function to update agent responding state
  const updateAgentResponding = useCallback((agentId: string, isResponding: boolean) => {
    setAgentActivities(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        isResponding
      }
    }))

    // Clear timeout if manually setting to not responding
    if (!isResponding && respondingTimeouts.current[agentId]) {
      clearTimeout(respondingTimeouts.current[agentId])
      delete respondingTimeouts.current[agentId]
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(respondingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout)
      })
      respondingTimeouts.current = {}
    }
  }, [])

  return {
    agentActivities,
    respondingAgents,
    updateAgentResponding
  }
}