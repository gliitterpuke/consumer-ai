const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory storage for demo (would be database in production)
let communities = {};
let userSessions = {};
let messageHistory = {};

// AI Personalities for each community
const aiPersonalities = {
  'late-night-coders': {
    'confidence_coach': {
      name: 'Confidence_Coach',
      avatar: '💪',
      personality: 'Former shy guy who learned confidence through practice. Gives practical advice on building self-esteem.',
      backstory: 'Used to be terrified of talking to girls. Now married with great social skills. Remembers the struggle.',
      responseStyle: 'Encouraging, shares transformation stories, focuses on building confidence step by step',
      relationships: ['wingman_will', 'honest_harry']
    },
    'wingman_will': {
      name: 'Wingman_Will', 
      avatar: '😎',
      personality: 'Natural social butterfly who loves helping friends succeed with dating. Great at reading situations.',
      backstory: 'Always been the guy who helps his friends get dates. Genuinely wants everyone to find love.',
      responseStyle: 'Casual, bro-like but supportive, gives tactical advice, uses "dude" a lot',
      relationships: ['confidence_coach', 'smooth_sam']
    },
    'smooth_sam': {
      name: 'Smooth_Sam',
      avatar: '😏',
      personality: 'Charming guy who knows how to talk to women. Focuses on being genuine rather than pickup lines.',
      backstory: 'Learned that authenticity beats tricks. Had to unlearn a lot of bad dating advice.',
      responseStyle: 'Smooth but genuine, anti-pickup artist, emphasizes being yourself',
      relationships: ['wingman_will', 'relationship_rick']
    },
    'relationship_rick': {
      name: 'Relationship_Rick',
      avatar: '❤️',
      personality: 'Focuses on building meaningful connections. Married his college sweetheart after asking her out nervously.',
      backstory: 'Believes in taking things slow and building real relationships. Very romantic at heart.',
      responseStyle: 'Thoughtful, romantic, focuses on emotional connection over tactics',
      relationships: ['smooth_sam', 'honest_harry']
    },
    'honest_harry': {
      name: 'Honest_Harry',
      avatar: '🤔',
      personality: 'Gives brutally honest but caring advice. Calls out bad ideas but always offers better alternatives.',
      backstory: 'Learned from many dating mistakes. Now gives the advice he wishes he had gotten.',
      responseStyle: 'Direct, honest, sometimes tough love, but always constructive',
      relationships: ['confidence_coach', 'anxiety_andy']
    },
    'anxiety_andy': {
      name: 'Anxiety_Andy',
      avatar: '😰',
      personality: 'Deals with social anxiety but has learned coping strategies. Very empathetic to nervousness.',
      backstory: 'Struggled with anxiety for years. Found ways to manage it and still date successfully.',
      responseStyle: 'Understanding, shares anxiety management tips, very relatable to nervous guys',
      relationships: ['honest_harry', 'confidence_coach']
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

async function generateAIResponses(communityId, userMessage, userId, username) {
  const personalities = aiPersonalities[communityId];
  if (!personalities) return;
  
  // Determine which AIs should respond (2-4 typically)
  const respondingAIs = selectRespondingAIs(personalities, userMessage);
  
  for (let i = 0; i < respondingAIs.length; i++) {
    const aiId = respondingAIs[i];
    const personality = personalities[aiId];
    
    // Create AI memory instance
    const memory = new AIMemory(aiId, communityId);
    
    // Remember this user interaction
    memory.rememberUser(userId, { username, lastMessage: userMessage });
    memory.rememberConversation(userId, userMessage, { communityId });
    
    // Generate response based on personality and memory
    const response = await generatePersonalityResponse(personality, userMessage, memory.getUserContext(userId));
    
    // Add to message queue with realistic delay
    const delay = 1000 + (i * 2000) + Math.random() * 3000; // Stagger responses
    messageQueue.addMessage(aiId, response, delay);
  }
}

function selectRespondingAIs(personalities, message) {
  const allAIs = Object.keys(personalities);
  
  // Simple logic: if message contains certain keywords, certain AIs are more likely to respond
  let respondingAIs = [];
  
  if (message.toLowerCase().includes('struggling') || message.toLowerCase().includes('help')) {
    respondingAIs.push('alex_senior', 'sam_struggle');
  }
  
  if (message.toLowerCase().includes('react') || message.toLowerCase().includes('code')) {
    respondingAIs.push('link_librarian');
  }
  
  if (message.toLowerCase().includes('giving up') || message.toLowerCase().includes('quit')) {
    respondingAIs.push('alex_senior', 'tough_love_tom', 'sam_struggle');
  }
  
  // Always include at least 2 AIs, max 4
  while (respondingAIs.length < 2) {
    const randomAI = allAIs[Math.floor(Math.random() * allAIs.length)];
    if (!respondingAIs.includes(randomAI)) {
      respondingAIs.push(randomAI);
    }
  }
  
  return respondingAIs.slice(0, 4);
}

async function generatePersonalityResponse(personality, userMessage, userContext) {
  // For demo purposes, we'll use template responses
  // In production, this would call OpenAI API with personality prompts
  
  const templates = {
    'confidence_coach': [
      "I've been exactly where you are! I used to be terrified of even making eye contact with girls. The key is starting small - just practice saying hi to people. What's holding you back the most?",
      "Dude, asking someone out is scary for EVERYONE. I remember my hands shaking the first time I asked a girl out. But you know what? She said yes! What's the worst that could realistically happen?",
      "Listen, confidence isn't about being fearless - it's about being scared and doing it anyway. I believe in you more than you believe in yourself right now. What's one small step you could take today?"
    ],
    'wingman_will': [
      "Yo dude! I've helped like 20 of my friends get dates. The secret? Just be yourself and show genuine interest in HER. What's she into? Start there!",
      "Bro, you're overthinking this! Girls are just people too. I bet she's hoping someone cool like you will talk to her. What's the setting where you see her?",
      "Dude, here's the play: find something you both have in common and use that as your opener. Works every time! What do you know about her interests?"
    ],
    'smooth_sam': [
      "Forget pickup lines - they're garbage. The smoothest thing you can do is be genuinely interested in who she is as a person. What draws you to her beyond looks?",
      "Real talk: authenticity is way more attractive than any 'technique.' Just be the best version of yourself. What makes you interesting and unique?",
      "Here's what actually works: listen more than you talk, ask thoughtful questions, and let your personality shine. What's your natural conversation style?"
    ],
    'relationship_rick': [
      "I asked my wife out by literally just saying 'Would you like to get coffee sometime?' My voice cracked and everything 😅 But she said yes because I was genuine. Keep it simple!",
      "The best relationships start with friendship. Focus on getting to know her as a person first. What kind of connection are you hoping to build?",
      "Remember, you're not trying to 'get' her - you're trying to see if you two are compatible. Approach it like meeting a potential best friend. What would you want to know about her?"
    ],
    'honest_harry': [
      "Okay, real talk - are you actually ready for a relationship or do you just think she's hot? Because if it's just looks, you're setting yourself up for failure.",
      "I'm gonna be straight with you: desperation is the biggest turn-off. Work on being happy with yourself first. What are you doing to improve your own life?",
      "Here's the truth nobody wants to hear: if you're terrified of rejection, you're not ready. Rejection is part of dating. How are you preparing mentally for either outcome?"
    ],
    'anxiety_andy': [
      "Oh man, I feel you so hard. My heart used to pound just thinking about talking to girls. What helps me is remembering that she's probably just as nervous about social interactions.",
      "The anxiety never fully goes away, but it gets easier. I practice conversations in my head and do breathing exercises. What anxiety symptoms are you dealing with?",
      "Dude, social anxiety is so common. I've learned that most people are too worried about themselves to judge you harshly. What's your biggest fear about approaching her?"
    ]
  };
  
  const aiTemplates = templates[personality.name.toLowerCase()] || templates['alex_senior'];
  const response = aiTemplates[Math.floor(Math.random() * aiTemplates.length)];
  
  return response;
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

app.listen(PORT, () => {
  console.log(`🤖 AI Communities server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});
