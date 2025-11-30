# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**fiscaal-ai-web** is a Dutch tax advice web application built as a minimal MVP. Users can ask tax-related questions in natural language and receive AI-powered responses. The planned architecture includes authentication, user profiles, and chat history persistence.

## Development Commands

### Essential Commands
```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Docker Development
The application is containerized with Docker. The development environment includes AI CLI tools and development dependencies.

```bash
# Start development container (accessible at http://localhost:3025)
docker-compose up

# The container includes:
# - Python 3 with AI SDKs (google-genai, openai, anthropic)
# - Gemini CLI (@google/gemini-cli)
# - Claude Code CLI (@anthropic-ai/claude-code)
# - Git, curl, gh CLI
```

### Database Commands (Planned)
When Prisma is added to the project:
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **React**: Version 19.2.0
- **Font Optimization**: next/font with Geist Sans and Geist Mono

### Current Structure
```
app/
├── layout.tsx       # Root layout with Geist fonts
├── page.tsx         # Landing page with centered content
├── globals.css      # Tailwind global styles
└── favicon.ico

public/              # Static assets (SVG icons)
```

### Planned Architecture (from docs/IMPLEMENTATION_PLAN.md)

The project will evolve into a full-featured application with:

**Pages**:
- `/` - Landing page with chat interface
- `/login` - Email magic link authentication
- `/profile` - User tax profile management

**Components** (to be created in `components/`):
- `Hero.tsx` - Landing hero section
- `Chat.tsx` - Main chat interface with message history
- `ProfileForm.tsx` - Tax profile form (employment, income, etc.)
- `AuthButton.tsx` - Login/logout button with session handling
- `Footer.tsx` - Legal disclaimer footer

**API Routes** (to be created in `app/api/`):
- `app/api/chat/route.ts` - Chat endpoint that proxies to tax service
- `app/api/profile/route.ts` - User profile CRUD
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler

**Database** (planned):
- Prisma ORM with SQLite for development
- Models: User, Profile, Chat, Account, Session, VerificationToken
- Production deployment will use Turso (SQLite edge database)

**Authentication** (planned):
- NextAuth.js with email magic links
- Prisma adapter for session storage
- Protected routes redirect to `/login`

**External Dependencies** (to be installed):
- `next-auth` + `@auth/prisma-adapter` - Authentication
- `prisma` + `@prisma/client` - Database ORM
- `better-sqlite3` - SQLite driver

### Path Aliases
TypeScript is configured with `@/*` alias pointing to the root directory:
```typescript
import { Component } from '@/components/Component'
import { db } from '@/lib/db'
```

### Environment Variables
Create `.env.local` for local development:

**Current**: None required yet

**Planned**:
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
EMAIL_SERVER=smtp://resend:<key>@smtp.resend.com:465
EMAIL_FROM=noreply@fiscaal.ai
SERVICE_URL=https://api.fiscaal.ai
SERVICE_API_KEY=<tax service API key>
```

## Code Patterns

### Next.js App Router
- Server components by default
- Use `'use client'` directive for client components (state, events, hooks)
- Server components can directly fetch data and access session
- API routes use Web Request/Response APIs

### Client-Side State
When implementing client components:
- Use `next-auth/react` for session management (`useSession`, `signIn`, `signOut`)
- Local state with `useState` for forms and UI interactions
- No global state library (Redux, Zustand) - keep it simple

### Database Access Pattern (Planned)
```typescript
// lib/db.ts - Singleton pattern for Prisma
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

Usage in server components and API routes:
```typescript
import { db } from '@/lib/db';

const user = await db.user.findUnique({ where: { id } });
```

### Authentication Pattern (Planned)
Server-side session check:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/login');
```

### API Integration
The chat API proxies requests to an external tax service:
```typescript
// Call external service with API key
const res = await fetch(process.env.SERVICE_URL + '/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.SERVICE_API_KEY!,
  },
  body: JSON.stringify({ message, history }),
});
```

## Implementation Notes

### MVP Philosophy
This project follows a strict "ship fast, add later" philosophy:
- Dutch language only (no i18n)
- Single light theme (no dark mode initially)
- No UI component library (Tailwind only)
- No streaming responses initially
- Features are added only after user validation

### Deferred Features
Do not proactively implement these unless explicitly requested:
- shadcn/ui or other component libraries
- Dark mode
- Streaming chat responses
- Chat history page (chats are saved but not displayed)
- Internationalization
- Analytics/monitoring

### Production Deployment
- Target platform: Vercel
- SQLite works for development but won't persist on Vercel
- Before production deploy, migrate to Turso (SQLite edge) or another hosted DB
- Environment variables must be set in Vercel dashboard

### Mobile Considerations
- Design should work on mobile (responsive)
- Test layout at small viewport sizes
- Use Tailwind responsive prefixes (`sm:`, `md:`, etc.)
