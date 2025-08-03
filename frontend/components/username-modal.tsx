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
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 mb-4">
              <img 
                src="/logo.png" 
                alt="Rally Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Rally
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Rally your confidence with AI friends who believe in you
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium">Your Team</p>
                <p className="text-xs text-muted-foreground">Rally together</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium">Encouragement</p>
                <p className="text-xs text-muted-foreground">Lift you up</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-medium">Confidence</p>
                <p className="text-xs text-muted-foreground">Find your strength</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  What should your team call you?
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name or nickname..."
                  className="text-center text-lg h-12"
                  autoFocus
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold"
                  disabled={!username.trim()}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join a Rally
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-lg border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:border-purple-700 dark:hover:border-purple-500 dark:hover:bg-purple-950/30"
                  onClick={() => {
                    if (username.trim()) {
                      setShowCommunityCreator(true)
                    }
                  }}
                  disabled={!username.trim()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start Your Own Rally
                </Button>
              </div>
            </form>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Rally your confidence and achieve your goals with AI teammates who champion your success
              </p>
            </div>
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
