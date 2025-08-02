"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Shuffle, Sparkles, User, Heart, MessageCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PersonalityCreatorProps {
  onClose: () => void
  communityId: string
}

interface PersonalityData {
  name: string
  avatar: string
  personality: string
  backstory: string
  responseStyle: string
  frequency: number
  speed: number
  chattiness: number
  empathy: number
}

export function PersonalityCreator({ onClose, communityId }: PersonalityCreatorProps) {
  const [creationType, setCreationType] = useState<'random' | 'custom'>('random')
  const [personalityData, setPersonalityData] = useState<PersonalityData>({
    name: '',
    avatar: '🤖',
    personality: '',
    backstory: '',
    responseStyle: '',
    frequency: 50,
    speed: 50,
    chattiness: 50,
    empathy: 50
  })

  const emojiOptions = ['🤖', '😊', '🎯', '💪', '🧠', '❤️', '🌟', '🔥', '⚡', '🎨', '🚀', '💎', '🦄', '🌈', '✨', '🎭']

  const handleRandomGenerate = async () => {
    try {
      const response = await fetch('/api/personalities/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId })
      })
      
      if (response.ok) {
        alert('Random AI personality created successfully!')
        onClose()
      } else {
        alert('Failed to create random personality')
      }
    } catch (error) {
      console.error('Error creating random personality:', error)
      alert('Error creating personality')
    }
  }

  const handleCustomCreate = async () => {
    if (!personalityData.name.trim()) {
      alert('Please enter a name for the AI personality')
      return
    }

    try {
      const response = await fetch('/api/personalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          ...personalityData
        })
      })
      
      if (response.ok) {
        alert('Custom AI personality created successfully!')
        onClose()
      } else {
        alert('Failed to create custom personality')
      }
    } catch (error) {
      console.error('Error creating custom personality:', error)
      alert('Error creating personality')
    }
  }

  const updatePersonalityData = (field: keyof PersonalityData, value: any) => {
    setPersonalityData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Creation Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            creationType === 'random' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
          )}
          onClick={() => setCreationType('random')}
        >
          <CardContent className="p-6 text-center">
            <Shuffle className="w-8 h-8 mx-auto mb-3 text-purple-500" />
            <h3 className="font-semibold mb-2">Random Generation</h3>
            <p className="text-sm text-muted-foreground">
              Let AI create a unique personality with random traits and backstory
            </p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            creationType === 'custom' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/50'
          )}
          onClick={() => setCreationType('custom')}
        >
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-2">Custom Creation</h3>
            <p className="text-sm text-muted-foreground">
              Design your own AI with specific traits, backstory, and behavior
            </p>
          </CardContent>
        </Card>
      </div>

      {creationType === 'random' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-purple-500" />
              Random AI Generation
            </CardTitle>
            <CardDescription>
              Click the button below to generate a completely random AI personality with unique traits, backstory, and behavior patterns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRandomGenerate}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              size="lg"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Generate Random AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom Creation Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={personalityData.name}
                    onChange={(e) => updatePersonalityData('name', e.target.value)}
                    placeholder="e.g., Supportive_Sam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Avatar Emoji</label>
                  <div className="grid grid-cols-8 gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all hover:scale-110",
                          personalityData.avatar === emoji 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => updatePersonalityData('avatar', emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Personality Traits</label>
                  <Input
                    value={personalityData.personality}
                    onChange={(e) => updatePersonalityData('personality', e.target.value)}
                    placeholder="e.g., Empathetic, encouraging, great listener"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Backstory</label>
                  <Input
                    value={personalityData.backstory}
                    onChange={(e) => updatePersonalityData('backstory', e.target.value)}
                    placeholder="e.g., Former shy person who overcame social anxiety"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Response Style</label>
                  <Input
                    value={personalityData.responseStyle}
                    onChange={(e) => updatePersonalityData('responseStyle', e.target.value)}
                    placeholder="e.g., Warm, supportive, shares personal experiences"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Behavior Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Response Frequency</label>
                    <span className="text-sm text-muted-foreground">{personalityData.frequency}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personalityData.frequency}
                    onChange={(e) => updatePersonalityData('frequency', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Response Speed</label>
                    <span className="text-sm text-muted-foreground">{personalityData.speed}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personalityData.speed}
                    onChange={(e) => updatePersonalityData('speed', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Chattiness</label>
                    <span className="text-sm text-muted-foreground">{personalityData.chattiness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personalityData.chattiness}
                    onChange={(e) => updatePersonalityData('chattiness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Empathy Level</label>
                    <span className="text-sm text-muted-foreground">{personalityData.empathy}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={personalityData.empathy}
                    onChange={(e) => updatePersonalityData('empathy', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{personalityData.avatar}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {personalityData.name || 'AI Personality'}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {personalityData.personality || 'Personality traits will appear here...'}
                        </p>
                        <p className="text-sm mb-3">
                          {personalityData.backstory || 'Backstory will appear here...'}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Response Style: {personalityData.responseStyle || 'Not specified'}</p>
                          <div className="flex gap-4">
                            <span>Frequency: {personalityData.frequency}%</span>
                            <span>Speed: {personalityData.speed}%</span>
                          </div>
                          <div className="flex gap-4">
                            <span>Chattiness: {personalityData.chattiness}%</span>
                            <span>Empathy: {personalityData.empathy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Button 
              onClick={handleCustomCreate}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
              size="lg"
              disabled={!personalityData.name.trim()}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Custom AI
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
