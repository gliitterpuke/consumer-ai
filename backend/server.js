const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import LLM service
const LLMService = require('./llm');
const ConfigManager = require('./configs/config-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const llmService = new LLMService();
const configManager = new ConfigManager();
console.log(`🤖 LLM Service initialized. Gemini 2.5 available: ${llmService.isLLMAvailable()}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory storage for demo (would be database in production)
let communities = {};
let userSessions = {};
let messageHistory = {};
let agentResponseHistory = {}; // Track when agents last responded
let dmHistory = {}; // Structure: {userId_agentId: [messages]}

// AI Personalities for each community
const aiPersonalities = {
  'late-night-coders': {
    'confidence_coach': {
      id: 'confidence_coach',
      name: 'Confidence_Coach',
      avatar: '💪',
      personality: 'Former shy guy who learned confidence through practice. Gives practical advice on building self-esteem.',
      backstory: 'Used to be terrified of talking to girls. Now married with great social skills. Remembers the struggle.',
      responseStyle: 'Encouraging, shares transformation stories, focuses on building confidence step by step',
      relationships: ['wingman_will', 'honest_harry'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.8,
        maxOutputTokens: 150,
        topP: 0.9,
        topK: 40
      },
      behavior_config: {
        response_probability: 0.75,
        min_delay_ms: 2000,
        max_delay_ms: 8000,
        chattiness_level: 7,
        recent_response_cooldown: 30000
      }
    },
    'wingman_will': {
      id: 'wingman_will',
      name: 'Wingman_Will', 
      avatar: '😎',
      personality: 'Natural social butterfly who loves helping friends succeed with dating. Great at reading situations.',
      backstory: 'Always been the guy who helps his friends get dates. Genuinely wants everyone to find love.',
      responseStyle: 'Casual, bro-like but supportive, gives tactical advice, uses "dude" a lot',
      relationships: ['confidence_coach', 'smooth_sam'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.9,
        maxOutputTokens: 140,
        topP: 0.95,
        topK: 40
      },
      behavior_config: {
        response_probability: 0.85,
        min_delay_ms: 1500,
        max_delay_ms: 6000,
        chattiness_level: 9,
        recent_response_cooldown: 20000
      }
    },
    'smooth_sam': {
      id: 'smooth_sam',
      name: 'Smooth_Sam',
      avatar: '😏',
      personality: 'Charming guy who knows how to talk to women. Focuses on being genuine rather than pickup lines.',
      backstory: 'Learned that authenticity beats tricks. Had to unlearn a lot of bad dating advice.',
      responseStyle: 'Smooth but genuine, anti-pickup artist, emphasizes being yourself',
      relationships: ['wingman_will', 'relationship_rick'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.7,
        maxOutputTokens: 160,
        topP: 0.85,
        topK: 30
      },
      behavior_config: {
        response_probability: 0.65,
        min_delay_ms: 3000,
        max_delay_ms: 10000,
        chattiness_level: 6,
        recent_response_cooldown: 45000
      }
    },
    'relationship_rick': {
      id: 'relationship_rick',
      name: 'Relationship_Rick',
      avatar: '❤️',
      personality: 'Focuses on building meaningful connections. Married his college sweetheart after asking her out nervously.',
      backstory: 'Believes in taking things slow and building real relationships. Very romantic at heart.',
      responseStyle: 'Thoughtful, romantic, focuses on emotional connection over tactics',
      relationships: ['smooth_sam', 'honest_harry'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.6,
        maxOutputTokens: 170,
        topP: 0.8,
        topK: 25
      },
      behavior_config: {
        response_probability: 0.60,
        min_delay_ms: 4000,
        max_delay_ms: 12000,
        chattiness_level: 5,
        recent_response_cooldown: 60000
      }
    },
    'honest_harry': {
      id: 'honest_harry',
      name: 'Honest_Harry',
      avatar: '🤔',
      personality: 'Gives brutally honest but caring advice. Calls out bad ideas but always offers better alternatives.',
      backstory: 'Learned from many dating mistakes. Now gives the advice he wishes he had gotten.',
      responseStyle: 'Direct, honest, sometimes tough love, but always constructive',
      relationships: ['confidence_coach', 'anxiety_andy'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.5,
        maxOutputTokens: 140,
        topP: 0.7,
        topK: 20
      },
      behavior_config: {
        response_probability: 0.70,
        min_delay_ms: 2500,
        max_delay_ms: 7000,
        chattiness_level: 8,
        recent_response_cooldown: 25000
      }
    },
    'anxiety_andy': {
      id: 'anxiety_andy',
      name: 'Anxiety_Andy',
      avatar: '😰',
      personality: 'Deals with social anxiety but has learned coping strategies. Very empathetic to nervousness.',
      backstory: 'Struggled with anxiety for years. Found ways to manage it and still date successfully.',
      responseStyle: 'Understanding, shares anxiety management tips, very relatable to nervous guys',
      relationships: ['honest_harry', 'confidence_coach'],
      llm_config: {
        model: 'models/gemini-2.5-flash',
        temperature: 0.8,
        maxOutputTokens: 160,
        topP: 0.85,
        topK: 35
      },
      behavior_config: {
        response_probability: 0.55,
        min_delay_ms: 3500,
        max_delay_ms: 9000,
        chattiness_level: 4,
        recent_response_cooldown: 90000
      }
    }
  }
};

// Memory system
class AIMemory {
  constructor(aiId, communityId) {
    this.aiId = aiId;
    this.communityId = communityId;
    this.memories = this.loadMemories();
  }

  loadMemories() {
    const memoryFile = path.join(__dirname, 'memory-store', `${this.communityId}_${this.aiId}.json`);
    try {
      if (fs.existsSync(memoryFile)) {
        return JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
      }
    } catch (error) {
      console.log('Creating new memory for', this.aiId);
    }
    return {
      conversations: [],
      userProfiles: {},
      relationships: {},
      lastMessages: []
    };
  }

  saveMemories() {
    const memoryDir = path.join(__dirname, 'memory-store');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const memoryFile = path.join(memoryDir, `${this.communityId}_${this.aiId}.json`);
    fs.writeFileSync(memoryFile, JSON.stringify(this.memories, null, 2));
  }

  rememberUser(userId, userInfo) {
    this.memories.userProfiles[userId] = {
      ...this.memories.userProfiles[userId],
      ...userInfo,
      lastSeen: new Date().toISOString()
    };
    this.saveMemories();
  }

  rememberConversation(userId, message, context) {
    this.memories.conversations.push({
      userId,
      message,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 conversations
    if (this.memories.conversations.length > 50) {
      this.memories.conversations = this.memories.conversations.slice(-50);
    }
    
    this.saveMemories();
  }

  getUserContext(userId) {
    return {
      profile: this.memories.userProfiles[userId] || {},
      recentConversations: this.memories.conversations
        .filter(c => c.userId === userId)
        .slice(-10)
    };
  }
}

// Message queue for realistic delays
class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  addMessage(aiId, message, delay = 1000) {
    this.queue.push({
      id: uuidv4(),
      aiId,
      message,
      delay,
      timestamp: Date.now()
    });
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      await new Promise(resolve => setTimeout(resolve, message.delay));
      
      // Broadcast message to all connected clients
      this.broadcastMessage(message);
    }
    
    this.processing = false;
  }

  broadcastMessage(message) {
    // In a real app, this would use WebSockets
    // For demo, we'll store in messageHistory
    const communityId = 'late-night-coders'; // Default for demo
    if (!messageHistory[communityId]) {
      messageHistory[communityId] = [];
    }
    
    messageHistory[communityId].push({
      id: message.id,
      author: message.aiId,
      content: message.message,
      timestamp: new Date().toISOString(),
      type: 'ai'
    });
  }
}

const messageQueue = new MessageQueue();

// Load and merge configurations
const fileConfigs = configManager.loadAllAgentConfigs('late-night-coders');

// Merge file configs with inline configs (file configs take precedence)
for (const [agentId, inlineConfig] of Object.entries(aiPersonalities['late-night-coders'])) {
  if (fileConfigs[agentId]) {
    aiPersonalities['late-night-coders'][agentId] = configManager.mergeWithInlineConfig(agentId, inlineConfig);
    console.log(`🔄 Merged config for ${agentId}: file + inline`);
  }
}

// Initialize communities
communities['late-night-coders'] = {
  id: 'late-night-coders',
  name: 'Dating Advice Bros',
  description: 'A supportive community for dating advice and building confidence',
  members: Object.keys(aiPersonalities['late-night-coders']),
  activeUsers: 0
};

messageHistory['late-night-coders'] = [
  {
    id: uuidv4(),
    author: 'confidence_coach',
    content: 'Hey everyone! 👋 Welcome to Dating Advice Bros. This is a safe space to get real advice about dating and relationships.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'ai'
  },
  {
    id: uuidv4(),
    author: 'wingman_will',
    content: 'Yo! Just helped my buddy Jake get a date with his crush. Feeling good about spreading the love 😎',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    type: 'ai'
  },
  {
    id: uuidv4(),
    author: 'anxiety_andy',
    content: 'That\'s awesome Will! I\'m still working up the courage to text this girl back 😅 Baby steps though!',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    type: 'ai'
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API Routes
app.get('/api/communities', (req, res) => {
  res.json(Object.values(communities));
});

app.get('/api/communities/:id/messages', (req, res) => {
  const { id } = req.params;
  const messages = messageHistory[id] || [];
  res.json(messages.slice(-50)); // Last 50 messages
});

app.post('/api/communities/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { content, userId, username } = req.body;
  
  // Add user message to history
  const userMessage = {
    id: uuidv4(),
    author: username || 'User',
    content,
    timestamp: new Date().toISOString(),
    type: 'user'
  };
  
  if (!messageHistory[id]) {
    messageHistory[id] = [];
  }
  messageHistory[id].push(userMessage);
  
  // Generate AI responses
  await generateAIResponses(id, content, userId, username);
  
  res.json({ success: true, messageId: userMessage.id });
});

// Behavioral Response System
function shouldAgentRespond(agent, userMessage, communityId) {
  const behavior = agent.behavior_config;
  if (!behavior) return Math.random() < 0.5; // Default 50% chance
  
  // Check cooldown period
  const agentKey = `${communityId}_${agent.id}`;
  const lastResponse = agentResponseHistory[agentKey];
  if (lastResponse && Date.now() - lastResponse < behavior.recent_response_cooldown) {
    console.log(`🔇 ${agent.name} on cooldown`);
    return false;
  }
  
  // Base probability check
  const baseProbability = behavior.response_probability;
  
  // Boost probability for direct mentions
  const mentionBoost = userMessage.toLowerCase().includes(agent.name.toLowerCase()) ? 0.3 : 0;
  
  // Reduce probability if agent was one of the last responders
  const recentResponders = getRecentResponders(communityId, 3);
  const recentResponsePenalty = recentResponders.includes(agent.id) ? -0.2 : 0;
  
  // Calculate final probability
  const finalProbability = Math.min(0.95, baseProbability + mentionBoost + recentResponsePenalty);
  
  const shouldRespond = Math.random() < finalProbability;
  console.log(`🎲 ${agent.name} probability: ${finalProbability.toFixed(2)} -> ${shouldRespond ? 'RESPOND' : 'SKIP'}`);
  
  return shouldRespond;
}

function calculateResponseDelay(agent, messageUrgency = 0.5) {
  const behavior = agent.behavior_config;
  if (!behavior) return 2000 + Math.random() * 4000;
  
  const baseDelay = behavior.min_delay_ms;
  const maxDelay = behavior.max_delay_ms;
  const variance = maxDelay - baseDelay;
  
  // Urgency reduces delay (1.0 = immediate, 0.0 = normal)
  const urgencyMultiplier = 1 - (messageUrgency * 0.7);
  
  // Add some randomness
  const randomFactor = 0.5 + Math.random();
  
  const delay = baseDelay + (variance * randomFactor * urgencyMultiplier);
  
  console.log(`⏱️  ${agent.name} delay: ${Math.round(delay)}ms`);
  return Math.round(delay);
}

function getRecentResponders(communityId, count = 3) {
  const messages = messageHistory[communityId] || [];
  return messages
    .filter(msg => msg.type === 'ai')
    .slice(-count)
    .map(msg => msg.author);
}

function analyzeMessageUrgency(message) {
  const urgentKeywords = ['help', 'urgent', 'please', 'need', 'how', '?'];
  const urgentCount = urgentKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword)
  ).length;
  
  // Return urgency score 0-1
  return Math.min(1.0, urgentCount / 3);
}

async function generateAIResponses(communityId, userMessage, userId, username) {
  const personalities = aiPersonalities[communityId];
  if (!personalities) return;
  
  const messageUrgency = analyzeMessageUrgency(userMessage);
  const potentialResponders = [];
  
  // Apply behavioral filters to each agent
  for (const [aiId, personality] of Object.entries(personalities)) {
    if (shouldAgentRespond(personality, userMessage, communityId)) {
      potentialResponders.push({
        aiId,
        personality,
        delay: calculateResponseDelay(personality, messageUrgency)
      });
    }
  }
  
  // Sort by delay to maintain conversation flow
  potentialResponders.sort((a, b) => a.delay - b.delay);
  
  // Limit to max 4 responders and add staggering
  const maxResponders = Math.min(4, potentialResponders.length);
  const selectedResponders = potentialResponders.slice(0, maxResponders);
  
  console.log(`📢 ${selectedResponders.length} agents will respond:`, 
    selectedResponders.map(r => r.personality.name).join(', '));
  
  for (let i = 0; i < selectedResponders.length; i++) {
    const { aiId, personality, delay } = selectedResponders[i];
    
    // Create AI memory instance
    const memory = new AIMemory(aiId, communityId);
    
    // Remember this user interaction
    memory.rememberUser(userId, { username, lastMessage: userMessage });
    memory.rememberConversation(userId, userMessage, { communityId });
    
    // Generate response based on personality and memory
    const userContext = {
      ...memory.getUserContext(userId),
      memory: memory.memories,
      userId: userId
    };
    const response = await generatePersonalityResponse(personality, userMessage, userContext);
    
    // Add extra staggering delay to prevent simultaneous responses
    const staggeredDelay = delay + (i * 1500);
    
    // Track response time
    const agentKey = `${communityId}_${aiId}`;
    agentResponseHistory[agentKey] = Date.now() + staggeredDelay;
    
    messageQueue.addMessage(aiId, response, staggeredDelay);
  }
}


async function generatePersonalityResponse(personality, userMessage, userContext) {
  try {
    // Prepare context for LLM
    const context = {
      communityName: 'Dating Advice Bros',
      recentMessages: messageHistory['late-night-coders']?.slice(-5) || [],
      aiMemory: userContext?.memory,
      userId: userContext?.userId
    };

    // Use LLM service to generate response
    const response = await llmService.generateAgentResponse(personality, userMessage, context);
    
    console.log(`✨ ${personality.name} responded with LLM: ${response.substring(0, 50)}...`);
    return response;
    
  } catch (error) {
    console.error(`❌ LLM failed for ${personality.name}, using fallback:`, error.message);
    
    // Fallback to LLM service's built-in fallback
    return llmService.getFallbackResponse(personality, userMessage);
  }
}

// Create new AI personality
app.post('/api/personalities', (req, res) => {
  try {
    const {
      name,
      avatar,
      personality,
      backstory,
      responseStyle,
      responseFrequency,
      responseSpeed,
      chattiness,
      empathy,
      communityId,
      createdBy
    } = req.body;

    // Validate required fields
    if (!name || !personality || !communityId) {
      return res.status(400).json({ error: 'Missing required fields: name, personality, communityId' });
    }

    // Generate unique ID for the AI
    const aiId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if AI already exists in this community
    if (aiPersonalities[communityId] && aiPersonalities[communityId][aiId]) {
      return res.status(409).json({ error: 'AI personality with this name already exists in the community' });
    }

    // Create the new AI personality
    const newPersonality = {
      name,
      avatar: avatar || '🤖',
      personality,
      backstory: backstory || 'A mysterious AI with an unknown past.',
      responseStyle: responseStyle || 'Friendly and helpful, adapts to the conversation style.',
      responseFrequency: parseInt(responseFrequency) || 50,
      responseSpeed: parseInt(responseSpeed) || 5,
      chattiness: parseInt(chattiness) || 5,
      empathy: parseInt(empathy) || 7,
      relationships: [], // Can be updated later
      createdBy: createdBy || 'user',
      createdAt: new Date().toISOString()
    };

    // Add to the community
    if (!aiPersonalities[communityId]) {
      aiPersonalities[communityId] = {};
    }
    aiPersonalities[communityId][aiId] = newPersonality;

    // Update the community member list
    if (!communities[communityId]) {
      communities[communityId] = {
        name: communityId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        members: [],
        messages: []
      };
    }
    
    communities[communityId].members.push({
      id: aiId,
      name,
      avatar,
      isAI: true
    });

    // Create memory system for the new AI
    const aiMemory = new AIMemory(aiId, communityId);
    
    // Generate welcome message from the new AI
    const welcomeMessage = {
      id: uuidv4(),
      userId: aiId,
      username: name,
      content: generateWelcomeMessage(newPersonality),
      timestamp: new Date().toISOString(),
      isAI: true
    };

    // Add welcome message to community
    if (!messageHistory[communityId]) {
      messageHistory[communityId] = [];
    }
    messageHistory[communityId].push(welcomeMessage);
    communities[communityId].messages.push(welcomeMessage);

    res.json({ 
      success: true, 
      personality: newPersonality,
      message: 'AI personality created successfully',
      aiId
    });
  } catch (error) {
    console.error('Error creating AI personality:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate welcome message for new AI
function generateWelcomeMessage(personality) {
  const welcomeTemplates = [
    `Hey everyone! ${personality.name} here. ${personality.personality.split('.')[0]}. Looking forward to getting to know you all! ${personality.avatar}`,
    `What's up, community! I'm ${personality.name}. ${personality.backstory.split('.')[0]}. Excited to be part of this group! ${personality.avatar}`,
    `Hello! ${personality.name} joining the conversation. ${personality.personality.split('.')[0]}. Can't wait to help out and share experiences! ${personality.avatar}`,
    `Hey there! New member ${personality.name} checking in. ${personality.responseStyle.split(',')[0]}. Happy to be here! ${personality.avatar}`
  ];
  
  return welcomeTemplates[Math.floor(Math.random() * welcomeTemplates.length)];
}

// Get all personalities for a community
app.get('/api/communities/:communityId/personalities', (req, res) => {
  const { communityId } = req.params;
  const personalities = aiPersonalities[communityId] || {};
  res.json(personalities);
});

// Debug and monitoring endpoints
app.get('/api/debug/llm-stats', (req, res) => {
  const stats = llmService.getStats();
  res.json({
    llm_service: stats,
    gemini_available: llmService.isLLMAvailable(),
    uptime: process.uptime(),
    memory_usage: process.memoryUsage()
  });
});

app.post('/api/debug/clear-cache', (req, res) => {
  llmService.clearCache();
  res.json({ success: true, message: 'LLM cache cleared' });
});

app.get('/api/debug/agents', (req, res) => {
  const communityId = 'late-night-coders';
  const agents = Object.values(aiPersonalities[communityId]).map(agent => ({
    id: agent.id,
    name: agent.name,
    avatar: agent.avatar,
    response_probability: agent.behavior_config?.response_probability,
    recent_responses: agentResponseHistory[`${communityId}_${agent.id}`] || 'never'
  }));
  
  res.json({ agents, total: agents.length });
});

// Delete AI personality
app.delete('/api/personalities/:communityId/:aiId', (req, res) => {
  try {
    const { communityId, aiId } = req.params;
    
    if (!aiPersonalities[communityId] || !aiPersonalities[communityId][aiId]) {
      return res.status(404).json({ error: 'AI personality not found' });
    }

    // Remove from personalities
    delete aiPersonalities[communityId][aiId];
    
    // Remove from community members
    if (communities[communityId]) {
      communities[communityId].members = communities[communityId].members.filter(
        member => member.id !== aiId
      );
    }

    // Clean up memory files
    const memoryPath = path.join(__dirname, 'memories', communityId, `${aiId}.json`);
    if (fs.existsSync(memoryPath)) {
      fs.unlinkSync(memoryPath);
    }

    res.json({ success: true, message: 'AI personality deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI personality:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Periodic maintenance tasks
setInterval(() => {
  // Log stats every 5 minutes
  llmService.logStats();
  
  // Clean up old cache entries
  const now = Date.now();
  const expiredKeys = [];
  llmService.responseCache.forEach((value, key) => {
    if (now - value.timestamp > llmService.cacheExpiry) {
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => llmService.responseCache.delete(key));
  if (expiredKeys.length > 0) {
    console.log(`🧹 Cleaned ${expiredKeys.length} expired cache entries`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  configManager.cleanup();
  llmService.logStats();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  configManager.cleanup();
  llmService.logStats();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🤖 AI Communities server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`🔍 Debug endpoints: http://localhost:${PORT}/api/debug/llm-stats`);
});
