"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AgentStatus } from './agent-status'
import { cn } from '@/lib/utils'

interface Member {
  id: string
  name: string
  avatar: string
  isAI: boolean
  status: 'online' | 'responding' | 'idle' | 'offline'
  lastActive?: Date
  personality?: string
}

interface MemberItemProps {
  member: Member
  onClick: () => void
  className?: string
}

export function MemberItem({ member, onClick, className }: MemberItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full h-auto p-2 justify-start hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-lg overflow-hidden">
            {member.avatar.startsWith('/') ? (
              <img 
                src={member.avatar} 
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              member.avatar
            )}
          </div>
          
          {/* Status Indicator */}
          <AgentStatus 
            status={member.status}
            isAI={member.isAI}
            className="absolute -bottom-1 -right-1"
          />
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-foreground truncate">
            {member.name}
          </div>
          
          {/* AI Agent Additional Info */}
          {member.isAI && member.personality && isHovered && (
            <div className="text-xs text-muted-foreground truncate">
              {member.personality}
            </div>
          )}
          
          {/* Status Text for Responding */}
          {member.status === 'responding' && (
            <div className="text-xs text-blue-500 animate-pulse">
              typing...
            </div>
          )}
        </div>
      </div>
    </Button>
  )
}