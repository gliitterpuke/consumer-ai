# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm install` - Install dependencies
- `npm start` - Start the server (production mode using node)
- `npm run dev` - Start the server in development mode with auto-restart (using nodemon)
- Server runs on `http://localhost:3000` by default

### Environment Setup
- Create `.env` file in root directory
- Add `OPENAI_API_KEY=your_key_here` for AI personality responses
- No other environment variables required for basic functionality

## Architecture Overview

This is an AI-powered community chat platform where users interact with AI personalities in Discord-style communities.

### Core Components

**Backend (`backend/server.js`)**
- Express.js server handling API routes and static file serving
- AI personality system with configurable characteristics
- JSON-based memory system for persistent AI conversations
- Message queue system for realistic response delays
- RESTful API for communities, messages, and personality management

**Frontend (`frontend/`)**
- Vanilla JavaScript SPA with Discord-style UI
- Real-time message polling (no WebSockets currently implemented)
- AI personality creator interface
- DM (Direct Message) functionality
- Username modal and community switching

**Memory System (`backend/memory-store/`)**
- JSON files store AI memories per community/personality
- Tracks user profiles, conversations, and relationships
- Each AI maintains separate memory: `{communityId}_{aiId}.json`

### Key Classes and Systems

**AIMemory Class (`backend/server.js:76-143`)**
- Manages persistent memory for each AI personality
- Tracks user interactions and conversation history
- Automatically saves to JSON files in `memory-store/`

**MessageQueue Class (`backend/server.js:145-198`)**
- Simulates realistic AI response delays
- Staggers multiple AI responses to feel natural
- Processes messages asynchronously

**AI Personality System**
- Each AI has: name, avatar, personality, backstory, responseStyle, relationships
- Template-based responses (can be extended to use OpenAI API)
- Response selection based on keywords and context

### Current Communities

**Late Night Coders (Dating Advice)**
- 6 AI personalities with distinct roles: confidence_coach, wingman_will, smooth_sam, relationship_rick, honest_harry, anxiety_andy
- Each has specific personality traits and response patterns
- Default community loaded on startup

### API Endpoints

- `GET /api/communities` - List all communities
- `GET /api/communities/:id/messages` - Get community messages
- `POST /api/communities/:id/messages` - Send message to community
- `POST /api/personalities` - Create new AI personality
- `GET /api/communities/:communityId/personalities` - Get community AI personalities
- `DELETE /api/personalities/:communityId/:aiId` - Delete AI personality

### Frontend Structure

- `index.html` - Main community chat interface
- `personality-creator.html` - AI personality creation tool
- `app.js` - Main frontend application logic
- `personality-creator.js` - AI creation interface logic
- `styles.css` - Discord-inspired styling

### Memory and Data Flow

1. User sends message → stored in `messageHistory`
2. AI personalities analyze message and generate responses
3. Responses queued with realistic delays via `MessageQueue`
4. AI memories updated with user context and conversation history
5. Frontend polls for new messages every 1 second

### Development Notes

- Currently uses template responses, but structured for OpenAI API integration
- Memory system is file-based for simplicity (could be replaced with database)
- No authentication system - users identified by generated IDs
- No WebSocket implementation - uses polling for real-time updates
- AI personality creator allows dynamic creation of new community members