"use client"

import { cn } from '@/lib/utils'

interface AgentStatusProps {
  status: 'online' | 'responding' | 'idle' | 'offline'
  isAI: boolean
  className?: string
}

export function AgentStatus({ status, isAI, className }: AgentStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'responding':
        return 'bg-blue-500 animate-pulse'
      case 'idle':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'online':
        return isAI ? 'AI Online' : 'Online'
      case 'responding':
        return 'Generating response...'
      case 'idle':
        return 'Recently active'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full border-2 border-card",
        getStatusColor(),
        className
      )}
      title={getStatusTitle()}
    />
  )
}