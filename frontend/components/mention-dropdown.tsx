"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AI_AGENTS, type Agent, type User } from '@/lib/agents'

interface Member {
  id: string
  name: string
  avatar: string
  isAI: boolean
  type: 'ai' | 'human'
}

interface MentionDropdownProps {
  isOpen: boolean
  query: string
  aiAgents: Agent[]
  humanUsers: User[]
  onSelect: (member: Member) => void
  onClose: () => void
}

export function MentionDropdown({ 
  isOpen, 
  query, 
  aiAgents, 
  humanUsers, 
  onSelect, 
  onClose
}: MentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Combine all members and filter by query
  const allMembers: Member[] = [
    ...aiAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      isAI: true,
      type: 'ai' as const
    })),
    ...humanUsers.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isAI: false,
      type: 'human' as const
    }))
  ]

  const filteredMembers = (() => {
    if (query.trim() === '') {
      return allMembers  // Show all members when no query
    }
    
    const matches = allMembers.filter(member =>
      member.name.toLowerCase().includes(query.toLowerCase())
    )
    
    // If no matches found, show all members so user can see options
    return matches.length > 0 ? matches : allMembers
  })()

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredMembers.length, query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredMembers.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredMembers.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredMembers[selectedIndex]) {
            onSelect(filteredMembers[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredMembers, onSelect, onClose])

  if (!isOpen || filteredMembers.length === 0) {
    return null
  }

  return (
    <Card 
      className="absolute z-50 w-64 max-h-48 overflow-y-auto border shadow-lg"
      style={{
        bottom: '100%',
        left: 0,
        marginBottom: '8px'
      }}
    >
      <CardContent className="p-2">
        <div className="text-xs text-muted-foreground mb-2 px-2">
          {query.trim() === '' ? (
            'Mention someone'
          ) : allMembers.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).length === 0 ? (
            `No matches for "${query}" - showing all members`
          ) : (
            `Matches for "${query}"`
          )}
        </div>
        {filteredMembers.map((member, index) => (
          <Button
            key={member.id}
            variant="ghost"
            className={cn(
              "w-full h-auto p-2 justify-start hover:bg-accent/50",
              index === selectedIndex && "bg-accent"
            )}
            onClick={() => onSelect(member)}
          >
            <div className="flex items-center gap-3 w-full">
              {/* Avatar */}
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                {member.avatar.startsWith('/') ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="text-sm">{member.avatar}</div>
                )}
              </div>
              
              {/* Member Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-foreground truncate">
                  {member.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.isAI ? 'AI Agent' : 'User'}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}