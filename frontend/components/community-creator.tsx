"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Users, Sparkles, Plus } from 'lucide-react'
import { AI_AGENTS, type Agent } from '@/lib/agents'

interface CommunityCreatorProps {
  onClose: () => void
  onCreateCommunity: (community: {
    name: string
    description: string
    icon: string
    invitedAgents: string[]
  }) => void
}

const COMMUNITY_TEMPLATES = [
  {
    name: "Study Buddies",
    description: "AI companions to help with learning and motivation",
    icon: "📚",
    suggestedAgents: ["Confidence_Coach", "Honest_Harry"]
  },
  {
    name: "Creative Collective",
    description: "Brainstorm ideas and get creative feedback",
    icon: "🎨",
    suggestedAgents: ["Wingman_Will", "Smooth_Sam"]
  },
  {
    name: "Wellness Warriors",
    description: "Mental health support and positive vibes",
    icon: "🌱",
    suggestedAgents: ["Confidence_Coach", "Anxiety_Andy"]
  },
  {
    name: "Tech Talk",
    description: "Discuss coding, startups, and technology",
    icon: "💻",
    suggestedAgents: ["Honest_Harry", "Relationship_Rick"]
  },
  {
    name: "Life Advice Circle",
    description: "Get guidance on life decisions and relationships",
    icon: "💭",
    suggestedAgents: ["Relationship_Rick", "Confidence_Coach", "Honest_Harry"]
  }
]

const EMOJI_OPTIONS = ["📚", "🎨", "🌱", "💻", "💭", "🚀", "🎮", "🎵", "🍕", "⚽", "🌟", "💡", "🔥", "💎", "🌈"]

export function CommunityCreator({ onClose, onCreateCommunity }: CommunityCreatorProps) {
  const [communityName, setCommunityName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('🌟')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [useTemplate, setUseTemplate] = useState(false)

  const handleTemplateSelect = (template: typeof COMMUNITY_TEMPLATES[0]) => {
    setCommunityName(template.name)
    setDescription(template.description)
    setSelectedIcon(template.icon)
    setSelectedAgents(template.suggestedAgents)
    setUseTemplate(true)
  }

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  const handleCreate = () => {
    if (!communityName.trim()) return

    onCreateCommunity({
      name: communityName,
      description: description || `A community for ${communityName.toLowerCase()}`,
      icon: selectedIcon,
      invitedAgents: selectedAgents
    })
    onClose()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create New Community
          </h2>
          <p className="text-muted-foreground mt-1">
            Build your perfect AI community with the right personalities
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {COMMUNITY_TEMPLATES.map((template, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-all hover:bg-accent/50"
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Community Details */}
        <Card>
          <CardHeader>
            <CardTitle>Community Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="Enter community name..."
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this community about?"
                className="w-full min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Community Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={selectedIcon === emoji ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedIcon(emoji)}
                    className="w-10 h-10 p-0"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite AI Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Invite AI Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which AI personalities to invite to your community
            </p>
            
            <div className="space-y-3">
              {AI_AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={agent.id}
                    checked={selectedAgents.includes(agent.id)}
                    onCheckedChange={() => handleAgentToggle(agent.id)}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    {/* <div className="text-lg">{agent.avatar}</div> */}
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={agent.id} className="text-sm font-medium cursor-pointer">
                        {agent.name}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.personality}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedAgents.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Selected ({selectedAgents.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {selectedAgents.map((agentId) => {
                    const agent = AI_AGENTS.find(a => a.id === agentId)
                    return agent ? (
                      <Badge key={agentId} variant="secondary" className="text-xs">
                        {agent.avatar} {agent.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreate}
          disabled={!communityName.trim()}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>
      </div>
    </div>
  )
}
