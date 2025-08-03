"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users, Hash, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { useMessages } from '@/hooks/useMessages'
import { useAgentActivity } from '@/hooks/useAgentActivity'
import { AI_AGENTS } from '@/lib/agents'
import { MentionDropdown } from '@/components/mention-dropdown'
import { highlightMentions } from '@/lib/mention-utils'

interface Message {
  id: string
  content: string
  author: string
  timestamp: string
  isAI: boolean
  avatar: string
}

interface Community {
  id: string
  name: string
  icon: string
  description: string
  members: number
}

interface ChatInterfaceProps {
  community: Community
  username: string
  onShowProfile: (user: any) => void
  onStartDM: (userName: string) => void
  aiAgents: typeof AI_AGENTS
  humanUsers: any[]
}

export function ChatInterface({ community, username, onShowProfile, onStartDM, aiAgents, humanUsers }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Mention dropdown state
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  // Real backend integration
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    connectionStatus 
  } = useMessages({
    communityId: community.id,
    username,
    enabled: true
  })

  // Agent activity tracking
  const { respondingAgents } = useAgentActivity({
    messages,
    agents: AI_AGENTS
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    
    setInputValue(value)
    
    // Check for @ mention
    const beforeCursor = value.slice(0, cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = beforeCursor.slice(lastAtIndex + 1)
      
      // Show mentions if @ is the start or preceded by whitespace, and no space after @
      const isAtStart = lastAtIndex === 0 || /\s/.test(beforeCursor[lastAtIndex - 1])
      const hasSpace = textAfterAt.includes(' ')
      
      if (isAtStart && !hasSpace) {
        setMentionQuery(textAfterAt)
        setMentionStartIndex(lastAtIndex)
        setShowMentions(true)
        
        // Calculate dropdown position
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect()
          setMentionPosition({
            top: rect.top - 200, // Position above input
            left: rect.left
          })
        }
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const handleMentionSelect = (member: any) => {
    if (mentionStartIndex === -1) return
    
    const beforeMention = inputValue.slice(0, mentionStartIndex)
    const afterMention = inputValue.slice(mentionStartIndex + 1 + mentionQuery.length)
    const newValue = `${beforeMention}@${member.name} ${afterMention}`
    
    setInputValue(newValue)
    setShowMentions(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus()
      const newCursorPos = beforeMention.length + member.name.length + 2
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Close mentions dropdown
  const closeMentions = () => {
    setShowMentions(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const messageContent = inputValue.trim()
    setInputValue('')

    try {
      await sendMessage(messageContent)
    } catch (err) {
      console.error('Failed to send message:', err)
      // Error handling is managed by useMessages hook
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // If mentions dropdown is open, let it handle navigation
    if (showMentions) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMentions()
      }
      // Don't send message when mentions are open and Enter is pressed
      // The MentionDropdown component will handle Enter for selection
      return
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{community.icon}</div>
            <div>
              <h2 className="text-xl font-semibold">{community.name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3" />
                general • {community.members} members
              </p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center gap-1 text-green-500">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Connected</span>
              </div>
            ) : connectionStatus === 'error' ? (
              <div className="flex items-center gap-1 text-red-500">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Disconnected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-500">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.author === username
          const isAIMessage = message.isAI || AI_AGENTS.some(agent => agent.name === message.author)
          
          return (
            <div key={message.id} className="message-enter">
              <Card className={cn(
                "max-w-[80%] transition-all",
                isMyMessage
                  ? "ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                  : "mr-auto bg-card border hover:shadow-md"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {!isMyMessage && (
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        {message.avatar.startsWith('/') ? (
                          <img 
                            src={message.avatar} 
                            alt={message.author}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-lg">{message.avatar}</div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button 
                          onClick={() => onShowProfile({
                            name: message.author,
                            avatar: message.avatar,
                            isAI: isAIMessage,
                            personality: isAIMessage ? AI_AGENTS.find(a => a.name === message.author)?.personality : undefined
                          })}
                          className={cn(
                            "font-semibold text-sm hover:underline transition-colors cursor-pointer",
                            isMyMessage 
                              ? "text-white/90 hover:text-white" 
                              : "hover:text-primary"
                          )}
                        >
                          {message.author}
                        </button>
                        <span className={cn(
                          "text-xs",
                          isMyMessage ? "text-white/70" : "text-muted-foreground"
                        )}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className={cn(
                        "text-sm leading-relaxed",
                        isMyMessage ? "text-white" : "text-foreground"
                      )}>
                        {highlightMentions(message.content)}
                      </div>
                    </div>
                    {isMyMessage && (
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        {message.avatar.startsWith('/') ? (
                          <img 
                            src={message.avatar} 
                            alt={message.author}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-lg">{message.avatar}</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}

        {/* Loading State */}
        {isLoading && messages.length === 0 && (
          <Card className="max-w-[80%] mr-auto bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-lg">📥</div>
                <div className="text-sm text-muted-foreground">Loading messages...</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Typing Indicators */}
        {respondingAgents.length > 0 && (
          <Card className="max-w-[80%] mr-auto bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex">
                  {respondingAgents.slice(0, 3).map(agentId => {
                    const agent = AI_AGENTS.find(a => a.id === agentId)
                    return agent ? (
                      <div key={agentId} className="w-6 h-6 mr-1 flex items-center justify-center">
                        {agent.avatar.startsWith('/') ? (
                          <img 
                            src={agent.avatar} 
                            alt={agent.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="text-lg">{agent.avatar}</div>
                        )}
                      </div>
                    ) : null
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {respondingAgents.length === 1 
                      ? `${AI_AGENTS.find(a => a.id === respondingAgents[0])?.name} is typing...`
                      : `${respondingAgents.slice(0, 3).map(agentId => 
                          AI_AGENTS.find(a => a.id === agentId)?.name
                        ).filter(Boolean).join(', ')}${respondingAgents.length > 3 ? ` +${respondingAgents.length - 3} more` : ''} are typing...`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="max-w-[80%] mr-auto bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-lg">⚠️</div>
                <div className="text-sm text-destructive">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4 relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${community.name}... (Type @ to mention someone)`}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line • Type @ to mention
        </p>
        
        {/* Mention Dropdown */}
        <MentionDropdown
          isOpen={showMentions}
          query={mentionQuery}
          aiAgents={aiAgents}
          humanUsers={humanUsers}
          onSelect={handleMentionSelect}
          onClose={closeMentions}
          position={mentionPosition}
        />
      </div>
    </div>
  )
}
