"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MessageSquare, Heart, Users, Plus, Sparkles } from 'lucide-react'
import { CommunityCreator } from './community-creator'

interface UsernameModalProps {
  onSubmit: (username: string) => void
  onCreateCommunity?: (community: {
    name: string
    description: string
    icon: string
    invitedAgents: string[]
  }) => void
}

export function UsernameModal({ onSubmit, onCreateCommunity }: UsernameModalProps) {
  const [username, setUsername] = useState('')
  const [showCommunityCreator, setShowCommunityCreator] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit(username.trim())
    }
  }

  const handleCreateCommunity = (newCommunity: {
    name: string
    description: string
    icon: string
    invitedAgents: string[]
  }) => {
    // First submit the username
    if (username.trim()) {
      onSubmit(username.trim())
    }
    // Then trigger the community creation in the main app with the community data
    if (onCreateCommunity) {
      onCreateCommunity(newCommunity)
    }
    setShowCommunityCreator(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-20 h-20 mb-6">
              <img 
                src="/logo.png" 
                alt="Rally Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 tracking-tight">
              Welcome to Rally
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground font-medium">
              Build your crew
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="username" className="block text-base font-semibold text-center text-gray-700 dark:text-gray-200">
                  What should your crew call you?
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name or nickname..."
                  className="text-center text-lg h-14 font-medium border-2 focus:border-purple-400 transition-colors"
                  autoFocus
                  required
                />
              </div>
              
              <div className="space-y-4 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!username.trim()}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Join a Rally
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-lg border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-500 dark:hover:bg-purple-950/30 font-semibold transition-all duration-200"
                  onClick={() => {
                    if (username.trim()) {
                      setShowCommunityCreator(true)
                    }
                  }}
                  disabled={!username.trim()}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Start Your Own Rally
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
      </div>
      
      {/* Community Creator Modal */}
      <Dialog open={showCommunityCreator} onOpenChange={setShowCommunityCreator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CommunityCreator 
            onClose={() => setShowCommunityCreator(false)}
            onCreateCommunity={handleCreateCommunity}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
