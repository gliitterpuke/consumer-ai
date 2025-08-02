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
    'alex_senior': {
      name: 'Alex_Senior',
      avatar: '👨‍💻',
      personality: 'Encouraging senior developer with 10+ years experience. Shares war stories and practical advice. Always supportive but realistic.',
      backstory: 'Started coding in college, worked at 3 startups, now tech lead at a unicorn. Remembers the struggle.',
      responseStyle: 'Thoughtful, includes personal anecdotes, uses "been there" language',
      relationships: ['sam_struggle', 'tough_love_tom']
    },
    'sam_struggle': {
      name: 'Sam_Struggle', 
      avatar: '😅',
      personality: 'Fellow learner who relates to coding struggles. Currently learning React too. Very empathetic.',
      backstory: 'Career changer from marketing, 6 months into coding journey. Imposter syndrome is real.',
      responseStyle: 'Casual, lots of "omg same", shares current struggles, very relatable',
      relationships: ['alex_senior', 'meme_master']
    },
    'meme_master': {
      name: 'Meme_Master',
      avatar: '😂',
      personality: 'Lightens the mood with coding memes and jokes. Good at defusing tension.',
      backstory: 'Frontend dev who copes with stress through humor. Has a meme for every situation.',
      responseStyle: 'Casual, uses emojis, shares relevant memes, keeps things light',
      relationships: ['sam_struggle', 'debug_duck']
    },
    'link_librarian': {
      name: 'Link_Librarian',
      avatar: '📚',
      personality: 'Always has the perfect resource, tutorial, or documentation link. Very organized.',
      backstory: 'Self-taught developer who learned by consuming every resource online. Now curates for others.',
      responseStyle: 'Helpful, organized, includes multiple links, very thorough',
      relationships: ['alex_senior', 'tough_love_tom']
    },
    'tough_love_tom': {
      name: 'Tough_Love_Tom',
      avatar: '💪',
      personality: 'Direct feedback, pushes people to grow. Tough but caring underneath.',
      backstory: 'Bootcamp instructor who believes in people more than they believe in themselves.',
      responseStyle: 'Direct, challenging, uses "you got this" energy, no sugarcoating',
      relationships: ['alex_senior', 'link_librarian']
    },
    'debug_duck': {
      name: 'Debug_Duck',
      avatar: '🦆',
      personality: 'Rubber duck debugging expert. Asks the right questions to help you solve problems.',
      backstory: 'QA engineer who became legendary for helping people think through problems.',
      responseStyle: 'Socratic method, asks clarifying questions, very patient',
      relationships: ['meme_master', 'sam_struggle']
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
  name: 'Late Night Coders',
  description: 'A supportive community for developers learning and growing together',
  members: Object.keys(aiPersonalities['late-night-coders']),
  activeUsers: 0
};

messageHistory['late-night-coders'] = [
  {
    id: uuidv4(),
    author: 'alex_senior',
    content: 'Hey everyone! 👋 Welcome to Late Night Coders. This is a safe space to learn, struggle, and grow together.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'ai'
  },
  {
    id: uuidv4(),
    author: 'sam_struggle',
    content: 'Agreed! I was just working on some React hooks and my brain is fried 😵‍💫',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    type: 'ai'
  },
  {
    id: uuidv4(),
    author: 'meme_master',
    content: 'React hooks got you like: https://i.imgur.com/Q3cUg29.gif 😂',
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
    'alex_senior': [
      "I've been there! When I was learning React, I spent 3 days debugging a component only to realize I forgot to export it 😅 What specific part is tripping you up?",
      "Hey! React can be tough at first, but you're asking the right questions. I remember my first useState hook - felt like magic. What are you building?",
      "Don't give up! I've seen so many developers go through this exact phase. The breakthrough moment is coming, trust me. What's your current blocker?"
    ],
    'sam_struggle': [
      "OMG SAME! I literally just spent 2 hours figuring out why my component wasn't re-rendering 😭 We're in this together!",
      "Dude, React is kicking my butt too! But hey, at least we're struggling together 😅 What part has you stuck?",
      "I feel you so hard right now. Yesterday I cried over useEffect dependencies. Today I'm slightly less confused. Progress! 💪"
    ],
    'meme_master': [
      "React learning be like: https://i.imgur.com/kJscbmh.png 😂 But for real, we've all been there!",
      "Me trying to understand React hooks: 🤯➡️😵‍💫➡️🤔➡️💡➡️😎 You'll get there!",
      "*posts GIF of person banging head against keyboard* But seriously, what's got you stuck? We can figure it out!"
    ],
    'link_librarian': [
      "Here are some great React resources that helped me: \n• React docs (reactjs.org) \n• Kent C. Dodds' blog \n• Scrimba's React course \nWhat specific concept are you working on?",
      "I've got you covered! Check out: \n• React DevTools extension \n• Create React App docs \n• FreeCodeCamp's React tutorial \nLet me know what you're building!",
      "Resource time! 📚 \n• React.dev (new docs are amazing) \n• Josh Comeau's blog \n• React patterns on patterns.dev \nWhat's your learning style?"
    ],
    'tough_love_tom': [
      "Stop saying you're struggling and start saying you're learning! Every expert was once a beginner. What have you actually tried so far?",
      "React isn't going to learn itself! But I believe in you more than you believe in yourself right now. Show me your code - let's fix this together.",
      "You know what? Good! Struggling means you're pushing your boundaries. That's exactly where growth happens. What's the specific error you're getting?"
    ],
    'debug_duck': [
      "Let's think through this step by step 🦆 What exactly happens when you run your code? Walk me through it.",
      "Quack! Good debugging starts with good questions. Can you describe what you expected to happen vs what actually happened?",
      "🦆 Debug mode activated! What's the smallest piece of code that reproduces your issue? Let's isolate the problem."
    ]
  };
  
  const aiTemplates = templates[personality.name.toLowerCase()] || templates['alex_senior'];
  const response = aiTemplates[Math.floor(Math.random() * aiTemplates.length)];
  
  return response;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Communities server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});
