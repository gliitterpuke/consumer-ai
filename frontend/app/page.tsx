"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChatInterface } from '@/components/chat-interface'
import { PersonalityCreator } from '@/components/personality-creator'
import { UsernameModal } from '@/components/username-modal'
import { MessageSquare, Users, Plus, Settings, Heart } from 'lucide-react'

export default function Home() {
  const [username, setUsername] = useState('')
  const [currentCommunity, setCurrentCommunity] = useState('late-night-coders')
  const [showUsernameModal, setShowUsernameModal] = useState(true)
  const [showPersonalityCreator, setShowPersonalityCreator] = useState(false)

  const communities = [
    {
      id: 'late-night-coders',
      name: 'Dating Advice Bros',
      icon: '💕',
      description: '6 AI members online',
      members: 6
    },
    {
      id: 'new-to-sf',
      name: 'New to SF',
      icon: '🌉',
      description: '6 AI members online',
      members: 6
    },
    {
      id: 'startup-founders',
      name: 'Startup Founders',
      icon: '🚀',
      description: '6 AI members online',
      members: 6
    }
  ]

  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername)
    setShowUsernameModal(false)
  }

  if (showUsernameModal) {
    return <UsernameModal onSubmit={handleUsernameSubmit} />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Communities</h1>
                <p className="text-sm text-muted-foreground">Never sleep, always care</p>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
          </div>

          {/* Communities */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Communities
              </h3>
              <div className="space-y-2">
                {communities.map((community) => (
                  <Card 
                    key={community.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentCommunity === community.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setCurrentCommunity(community.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{community.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{community.name}</h4>
                          <p className="text-sm text-muted-foreground">{community.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Create AI Section */}
            <div className="p-4 border-t">
              <Button 
                onClick={() => setShowPersonalityCreator(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create AI Personality
              </Button>
            </div>

            {/* User Area */}
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{username}</p>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatInterface 
          community={communities.find(c => c.id === currentCommunity)!}
          username={username}
        />
      </div>

      {/* Personality Creator Modal */}
      <Dialog open={showPersonalityCreator} onOpenChange={setShowPersonalityCreator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create AI Personality
            </DialogTitle>
          </DialogHeader>
          <PersonalityCreator 
            onClose={() => setShowPersonalityCreator(false)}
            communityId={currentCommunity}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
