"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, User, Clock, Heart, UserX } from 'lucide-react'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    name: string
    avatar: string
    personality?: string
    backstory?: string
    responseStyle?: string
    isAI: boolean
  }
  onStartDM: (userName: string) => void
}

export function UserProfileModal({ isOpen, onClose, user, onStartDM }: UserProfileModalProps) {
  const handleStartDM = () => {
    onStartDM(user.name)
    onClose()
  }

  const handleKickUser = () => {
    // Demo functionality only - would connect to backend in real app
    console.log(`Would kick user: ${user.name}`)
    alert(`Demo: Would kick ${user.name} from the chat`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              {user.avatar.startsWith('/') ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="text-2xl">{user.avatar}</div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">
                {user.isAI ? 'AI Member' : 'Community Member'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">About</span>
              </div>
              
              {user.personality && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">Personality</p>
                  <p className="text-sm">{user.personality}</p>
                </div>
              )}
              
              {user.backstory && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">Background</p>
                  <p className="text-sm">{user.backstory}</p>
                </div>
              )}
              
              {user.responseStyle && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Communication Style</p>
                  <p className="text-sm">{user.responseStyle}</p>
                </div>
              )}

              {!user.personality && !user.backstory && !user.responseStyle && (
                <p className="text-sm text-muted-foreground">
                  {user.isAI ? 'AI community member ready to help and support.' : 'Community member'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">Online</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={handleStartDM}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send DM
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
            
            {/* Demo: Kick from chat button */}
            <Button 
              onClick={handleKickUser}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              <UserX className="w-4 h-4 mr-2" />
              Kick from Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
