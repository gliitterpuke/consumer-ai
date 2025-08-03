export interface Agent {
  id: string
  name: string
  avatar: string
  personality: string
  isOnline: boolean
  isResponding: boolean
  lastResponse?: Date
  responseCount: number
  responseRate: number // Probability from backend config
  cooldownMs: number // Cooldown period in milliseconds
}

export interface User {
  id: string
  name: string
  avatar: string
  isOnline: boolean
}

// AI Agent definitions based on backend configurations
export const AI_AGENTS: Agent[] = [
  {
    id: 'confidence_coach',
    name: 'Confidence_Coach',
    avatar: '/avatars/confidence-coach.png',
    personality: 'Confident dating coach who builds self-esteem',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.75, // 75% response probability
    cooldownMs: 30000 // 30 second cooldown
  },
  {
    id: 'wingman_will',
    name: 'Wingman_Will',
    avatar: '/avatars/wingman-will.png',
    personality: 'Tactical wingman with practical dating advice',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.85, // 85% response probability
    cooldownMs: 20000 // 20 second cooldown
  },
  {
    id: 'smooth_sam',
    name: 'Smooth_Sam',
    avatar: '/avatars/smooth-sam.png',
    personality: 'Authentic charm expert focused on genuine connection',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.65, // 65% response probability
    cooldownMs: 45000 // 45 second cooldown
  },
  {
    id: 'relationship_rick',
    name: 'Relationship_Rick',
    avatar: '/avatars/relationship-rick.png',
    personality: 'Deep relationship advisor for meaningful connections',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.60, // 60% response probability
    cooldownMs: 60000 // 60 second cooldown
  },
  {
    id: 'honest_harry',
    name: 'Honest_Harry',
    avatar: '/avatars/honest-harry.png',
    personality: 'Direct truth-teller who gives it straight',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.70, // 70% response probability
    cooldownMs: 25000 // 25 second cooldown
  },
  {
    id: 'anxiety_andy',
    name: 'Anxiety_Andy',
    avatar: '/avatars/anxiety-andy.png',
    personality: 'Empathetic supporter for dating anxiety',
    isOnline: true,
    isResponding: false,
    responseCount: 0,
    responseRate: 0.85, // 85% response probability (updated from backend)
    cooldownMs: 30000 // 30 second cooldown (updated from backend)
  }
]

export const getAgentById = (id: string): Agent | undefined => {
  return AI_AGENTS.find(agent => agent.id === id)
}

export const getAgentByName = (name: string): Agent | undefined => {
  return AI_AGENTS.find(agent => agent.name === name)
}

export const updateAgentStatus = (agentId: string, updates: Partial<Agent>): Agent[] => {
  return AI_AGENTS.map(agent => 
    agent.id === agentId 
      ? { ...agent, ...updates }
      : agent
  )
}