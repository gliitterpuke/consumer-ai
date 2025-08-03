"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, User, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import { useDMMessages } from '@/hooks/useDMMessages'
import { highlightMentions } from '@/lib/mention-utils'

interface DMInterfaceProps {
  dmPartner: {
    id: string
    name: string
    avatar: string
    isAI: boolean
    personality?: string
  }
  username: string
  onBack: () => void
}

export function DMInterface({ dmPartner, username, onBack }: DMInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Real backend integration
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    error, 
    connectionStatus 
  } = useDMMessages({
    agentId: dmPartner.id,
    userId: username, // Using username as userId for now
    username,
    enabled: true
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const messageContent = inputValue.trim()
    setInputValue('')

    try {
      await sendMessage(messageContent)
    } catch (err) {
      console.error('Failed to send DM:', err)
      // Error handling is managed by useDMMessages hook
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* DM Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            {dmPartner.avatar.startsWith('/') ? (
              <img 
                src={dmPartner.avatar} 
                alt={dmPartner.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="text-2xl">{dmPartner.avatar}</div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{dmPartner.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : connectionStatus === 'error' ? (
                <WifiOff className="w-3 h-3 text-red-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-gray-400" />
              )}
              Direct Message • {dmPartner.isAI ? 'AI Member' : 'Member'}
              {dmPartner.personality && (
                <span className="text-xs">• {dmPartner.personality}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.author === username
          
          return (
            <div key={message.id} className="message-enter">
              <Card className={cn(
                "max-w-[80%] transition-all",
                isMyMessage 
                  ? "ml-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                  : "mr-auto bg-card hover:shadow-md"
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
                        <span className={cn(
                          "font-semibold text-sm",
                          isMyMessage ? "text-white/90" : "text-foreground"
                        )}>
                          {message.author}
                        </span>
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
                        {highlightMentions(message.content, isMyMessage)}
                      </div>
                    </div>
                    {isMyMessage && (
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <img 
                          src="/avatars/default-user.png" 
                          alt="You"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}

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
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${dmPartner.name} privately...`}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
          {isLoading && " • Sending..."}
        </p>
      </div>
    </div>
  )
}