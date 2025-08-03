# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- **Install dependencies**: 
  - Root: `npm install`
  - Frontend: `cd frontend && npm install`
- **Start both servers**: `npm run dev:both` (runs backend and frontend concurrently)
- **Backend only**: `npm run dev:backend` (runs on port 3000 with nodemon)
- **Frontend only**: `cd frontend && npm run dev` (runs on port 3001)
- **Build frontend**: `cd frontend && npm run build`
- **Lint frontend**: `cd frontend && npm run lint`
- **TypeScript check**: `cd frontend && npm run build-ts`

### Environment Setup
- Create `.env` file in root directory
- Required: `GEMINI_API_KEY=your_key_here` for Gemini 2.5 Flash LLM responses
- Optional: `OPENAI_API_KEY=your_key_here` (for future OpenAI integration)
- Backend runs on port 3000, frontend on port 3001

## Architecture Overview

This is an AI-powered community chat platform where users interact with AI personalities in Discord-style communities. Built with Next.js 14, shadcn/ui, and Gemini 2.5 Flash for advanced AI responses.

### Core Components

**Backend (`backend/server.js`)**
- Express.js server with CORS enabled
- Gemini 2.5 Flash integration via LLMService class
- ConfigManager for hot-reloadable agent configurations
- JSON-based memory system with AIMemory class
- MessageQueue for realistic response timing
- Agent chatter control to prevent spam
- DM (Direct Message) system with separate history tracking

**Frontend (`frontend/`)**
- Next.js 14 with TypeScript and App Router
- shadcn/ui components with Radix UI primitives
- Tailwind CSS with glass morphism effects
- Dark/light theme support via next-themes
- Real-time polling for messages
- Profile modal system for AI details
- Community switching interface

**Memory System (`backend/memory-store/`)**
- Persistent JSON storage per AI/community
- Tracks user profiles, conversations, relationships
- Format: `{communityId}_{aiId}.json`
- Includes recent conversations and user interaction history

### Key Classes and Systems

**LLMService (`backend/llm.js`)**
- Manages Gemini 2.5 Flash API integration
- Handles response generation with personality context
- Configurable temperature, topP, topK, maxOutputTokens per agent

**AIMemory Class (`backend/server.js:183-252`)**
- Persistent memory management per AI personality
- Tracks user interactions and conversation context
- Auto-saves to JSON files with error handling

**MessageQueue Class (`backend/server.js:254-307`)**
- Realistic response delays (1-12 seconds)
- Staggered responses for natural conversation flow
- Async processing with priority handling

**Agent Behavior System**
- Response probability gates (55-85% chance)
- Cooldown periods to prevent spam (20-90 seconds)
- Chattiness levels (1-10 scale)
- Human inactivity detection (30 second threshold)
- Maximum consecutive agent messages limit (8)

### AI Personality Configuration

Each AI has:
- **Identity**: name, avatar (image path), personality, backstory
- **Behavior**: responseStyle, relationships with other AIs
- **LLM Config**: model, temperature, maxOutputTokens, topP, topK
- **Behavior Config**: response_probability, delays, chattiness_level, cooldown

### API Endpoints

- `GET /api/communities` - List all communities
- `GET /api/communities/:id/messages` - Get community messages with pagination
- `POST /api/communities/:id/messages` - Send message (user or AI)
- `GET /api/communities/:id/dms/:userId` - Get DM history
- `POST /api/communities/:id/dms` - Send DM to AI
- `POST /api/personalities` - Create new AI personality
- `GET /api/communities/:communityId/personalities` - List AIs in community
- `DELETE /api/personalities/:communityId/:aiId` - Remove AI personality
- `GET /api/communities/:id` - Get community details
- `PUT /api/communities/:id` - Update community name

### Frontend Architecture

**Pages (App Router)**
- `app/page.tsx` - Main chat interface
- `app/personality-creator/page.tsx` - AI creation tool
- `app/layout.tsx` - Root layout with theme provider

**Components**
- `ChatInterface` - Main chat UI with message handling
- `Sidebar` - Community/DM navigation
- `MessageList` - Scrollable message display
- `MessageInput` - User input with send functionality
- `ProfileModal` - AI personality details viewer
- `PersonalityCreator` - AI creation form with random generation

**Styling**
- Tailwind CSS with custom theme
- Glass morphism effects
- Smooth animations via Framer Motion
- Responsive design for all screen sizes

### Development Notes

- Gemini 2.5 Flash provides contextual AI responses
- Frontend proxy rewrites `/api/*` to `http://localhost:8000/api/*`
- No authentication - users identified by localStorage IDs
- Polling-based updates (1 second interval)
- Agent avatars stored in `frontend/public/avatars/`