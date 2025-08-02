"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'

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
}

export function ChatInterface({ community, username, onShowProfile, onStartDM }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const aiPersonalities = {
    'confidence_coach': { name: 'Confidence_Coach', avatar: '💪' },
    'wingman_will': { name: 'Wingman_Will', avatar: '😎' },
    'smooth_sam': { name: 'Smooth_Sam', avatar: '🕺' },
    'relationship_rick': { name: 'Relationship_Rick', avatar: '❤️' },
    'honest_harry': { name: 'Honest_Harry', avatar: '🤔' },
    'anxiety_andy': { name: 'Anxiety_Andy', avatar: '😰' }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load initial messages for the community
    const initialMessages: Message[] = [
      {
        id: '1',
        content: "Hey everyone! Welcome to our supportive community. Feel free to share what's on your mind - we're all here to help each other out! 😊",
        author: 'Confidence_Coach',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        isAI: true,
        avatar: '💪'
      },
      {
        id: '2',
        content: "Absolutely! This is a judgment-free zone where we can all learn and grow together. What's everyone up to today?",
        author: 'Wingman_Will',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        isAI: true,
        avatar: '😎'
      }
    ]
    setMessages(initialMessages)
  }, [community.id])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      author: username,
      timestamp: new Date().toISOString(),
      isAI: false,
      avatar: '👤'
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI responses
    setTimeout(() => {
      const aiPersonalityKeys = Object.keys(aiPersonalities)
      const randomAI = aiPersonalityKeys[Math.floor(Math.random() * aiPersonalityKeys.length)]
      const aiPersonality = aiPersonalities[randomAI as keyof typeof aiPersonalities]
      
      const responses = [
        "I hear you, and I want you to know that what you're feeling is completely normal. I've been exactly where you are.",
        "You know what? I used to think I'd never figure this out either. But here's what changed everything for me...",
        "I'm really glad you came to me with this. Building confidence isn't about pretending - it's about being genuinely yourself.",
        "That takes courage to share! I remember feeling the same way. Here's what helped me...",
        "I appreciate you being real with us. That vulnerability is actually a strength, not a weakness."
      ]

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        author: aiPersonality.name,
        timestamp: new Date().toISOString(),
        isAI: true,
        avatar: aiPersonality.avatar
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000 + Math.random() * 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="message-enter">
            <Card className={cn(
              "max-w-[80%] transition-all",
              message.isAI 
                ? "mr-auto bg-card hover:shadow-md" 
                : "ml-auto bg-primary text-primary-foreground"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-lg flex-shrink-0">{message.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button 
                        onClick={() => onShowProfile({
                          name: message.author,
                          avatar: message.avatar,
                          isAI: message.isAI,
                          personality: message.isAI ? aiPersonalities[message.author.toLowerCase().replace('_', '_')]?.personality : undefined,
                          backstory: message.isAI ? aiPersonalities[message.author.toLowerCase().replace('_', '_')]?.backstory : undefined,
                          responseStyle: message.isAI ? aiPersonalities[message.author.toLowerCase().replace('_', '_')]?.responseStyle : undefined
                        })}
                        className="font-semibold text-sm hover:underline hover:text-primary transition-colors cursor-pointer"
                      >
                        {message.author}
                      </button>
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
                <div className="text-lg">🤖</div>
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
            placeholder={`Message ${community.name}...`}
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
