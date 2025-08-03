"use client"

import { Users, Plus, Dot } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MemberItem } from './member-item'
import { cn } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  avatar: string
  personality: string
  isOnline: boolean
  isResponding: boolean
  lastResponse?: Date
  responseCount: number
}

interface User {
  id: string
  name: string
  avatar: string
  isOnline: boolean
}

interface MembersSidebarProps {
  aiAgents: Agent[]
  humanUsers: User[]
  onMemberClick: (member: Agent | User) => void
  className?: string
}

export function MembersSidebar({ 
  aiAgents, 
  humanUsers, 
  onMemberClick,
  className 
}: MembersSidebarProps) {
  const totalMembers = aiAgents.length + humanUsers.length

  return (
    <div className={cn("w-60 bg-card/50 backdrop-blur-sm border-l flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Members</span>
            <span className="text-xs text-muted-foreground">— {totalMembers}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Add AI Personality"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* AI Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                AI Members
              </span>
              <span className="text-xs text-muted-foreground">— {aiAgents.length}</span>
            </div>
            <div className="space-y-1">
              {aiAgents.map((agent) => (
                <MemberItem
                  key={agent.id}
                  member={{
                    id: agent.id,
                    name: agent.name,
                    avatar: agent.avatar,
                    isAI: true,
                    status: agent.isResponding ? 'responding' : agent.isOnline ? 'online' : 'offline',
                    lastActive: agent.lastResponse,
                    personality: agent.personality
                  }}
                  onClick={() => onMemberClick(agent)}
                />
              ))}
            </div>
          </div>

          {/* Human Members Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Humans
              </span>
              <span className="text-xs text-muted-foreground">— {humanUsers.length}</span>
            </div>
            <div className="space-y-1">
              {humanUsers.map((user) => (
                <MemberItem
                  key={user.id}
                  member={{
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    isAI: false,
                    status: user.isOnline ? 'online' : 'offline'
                  }}
                  onClick={() => onMemberClick(user)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}