"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'

interface DMMessage {
  id: string
  content: string
  author: string
  timestamp: string
  isFromUser: boolean
}

interface DMInterfaceProps {
  dmPartner: {
    name: string
    avatar: string
    isAI: boolean
  }
  username: string
  onBack: () => void
}

export function DMInterface({ dmPartner, username, onBack }: DMInterfaceProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load initial DM messages
    const initialMessages: DMMessage[] = [
      {
        id: '1',
        content: `Hey ${username}! Thanks for reaching out. I'm here if you want to chat privately about anything. 😊`,
        author: dmPartner.name,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        isFromUser: false
      }
    ]
    setMessages(initialMessages)
  }, [dmPartner.name, username])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: DMMessage = {
      id: Date.now().toString(),
      content: inputValue,
      author: username,
      timestamp: new Date().toISOString(),
      isFromUser: true
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response in DM
    setTimeout(() => {
      const responses = [
        "I really appreciate you sharing that with me privately. It takes courage to open up.",
        "That's something I can definitely help you with. Let me share my thoughts...",
        "I'm glad you feel comfortable talking to me about this. Here's what I think...",
        "Thanks for trusting me with this. I've been in similar situations before.",
        "I hear you, and I want you to know that what you're feeling is completely valid."
      ]

      const aiResponse: DMMessage = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        author: dmPartner.name,
        timestamp: new Date().toISOString(),
        isFromUser: false
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500 + Math.random() * 2000)
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
          <div className="text-2xl">{dmPartner.avatar}</div>
          <div>
            <h2 className="text-xl font-semibold">{dmPartner.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              Direct Message • {dmPartner.isAI ? 'AI Member' : 'Member'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="message-enter">
            <Card className={cn(
              "max-w-[80%] transition-all",
              message.isFromUser 
                ? "ml-auto bg-primary text-primary-foreground" 
                : "mr-auto bg-card hover:shadow-md"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {message.isFromUser ? (
                      <img 
                        src="/avatars/default-user.png" 
                        alt="You"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : dmPartner.avatar.startsWith('/') ? (
                      <img 
                        src={dmPartner.avatar} 
                        alt={dmPartner.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="text-lg">{dmPartner.avatar}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{message.author}</span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <Card className="max-w-[80%] mr-auto bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {dmPartner.avatar.startsWith('/') ? (
                    <img 
                      src={dmPartner.avatar} 
                      alt={dmPartner.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-lg">{dmPartner.avatar}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot"></div>
                </div>
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
            placeholder={`Message ${dmPartner.name}...`}
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
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
