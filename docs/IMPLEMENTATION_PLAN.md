# fiscaal-ai-web — Implementation Plan (Light Version)

A simple MVP. One main page + auth + profile. Ship in 5 days.

**Assumption:** Next.js 14 with Tailwind is already scaffolded.

---

## Philosophy

Keep it minimal but functional. Auth + persistence so users can return.

---

## MVP (5 Days)

### Pages

```
/                 # Landing + Chat (main experience)
/login            # Email magic link login
/profile          # User tax profile
```

### Repo Structure

```
fiscaal-ai-web/
├── app/
│   ├── page.tsx              # Landing + Chat
│   ├── layout.tsx            # Auth provider wrapper
│   ├── login/
│   │   └── page.tsx          # Login form
│   ├── profile/
│   │   └── page.tsx          # Tax profile form
│   └── api/
│       ├── chat/
│       │   └── route.ts      # Chat endpoint
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts  # NextAuth handler
├── components/
│   ├── Hero.tsx
│   ├── Chat.tsx
│   ├── ProfileForm.tsx
│   ├── AuthButton.tsx
│   └── Footer.tsx
├── lib/
│   ├── api.ts                # Fetch wrapper
│   ├── auth.ts               # NextAuth config
│   └── db.ts                 # SQLite connection
├── prisma/
│   └── schema.prisma         # Database schema
├── public/
│   └── og.png
└── package.json
```

### Tech Stack

| Choice | Why |
|--------|-----|
| Next.js 14 | Already scaffolded |
| Tailwind | Already included |
| NextAuth.js | Simple, email magic links |
| Prisma | Type-safe ORM |
| SQLite | Zero config, file-based, free |
| Vercel | Free deploy (SQLite works with Turso later) |

### Timeline: 5 days

| Day | Task |
|-----|------|
| 1 | Database schema + Prisma setup |
| 2 | NextAuth + login page |
| 3 | Profile page + form |
| 4 | Chat with history persistence |
| 5 | Polish, mobile, deploy |

---

## Database Schema

### Install Prisma

```bash
npm install prisma @prisma/client
npm install better-sqlite3
npx prisma init --datasource-provider sqlite
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  profile       Profile?
  chats         Chat[]
  sessions      Session[]
  accounts      Account[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Tax situation
  employmentType  String?  // zzp, employed, both
  yearlyIncome    Int?
  hasPartner      Boolean  @default(false)
  hasMortgage     Boolean  @default(false)
  hasCompany      Boolean  @default(false)
  companyType     String?  // eenmanszaak, bv, vof
  
  updatedAt       DateTime @updatedAt
}

model Chat {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  messages  String    // JSON string of messages
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Initialize DB

```bash
npx prisma db push
npx prisma generate
```

### lib/db.ts

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

---

## Authentication

### Install NextAuth

```bash
npm install next-auth @auth/prisma-adapter
```

### lib/auth.ts

```typescript
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import { db } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
```

### app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="file:./dev.db"

# Email (use Resend - free tier)
EMAIL_SERVER=smtp://resend:re_xxxxx@smtp.resend.com:465
EMAIL_FROM=noreply@fiscaal.ai

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here  # openssl rand -base64 32

# Tax Service
SERVICE_URL=https://api.fiscaal.ai
SERVICE_API_KEY=your_key
```

---

## Components

### components/AuthButton.tsx

```typescript
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="text-gray-400">...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile" className="text-gray-600 hover:text-gray-900">
          Profiel
        </Link>
        <button
          onClick={() => signOut()}
          className="text-gray-600 hover:text-gray-900"
        >
          Uitloggen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
    >
      Inloggen
    </button>
  );
}
```

### components/Hero.tsx

```typescript
export function Hero() {
  return (
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold">🇳🇱 Fiscaal.ai</h1>
      <p className="text-gray-600 mt-2">
        Stel je belastingvraag in gewone taal.
      </p>
    </div>
  );
}
```

### components/Chat.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Message = { role: 'user' | 'assistant'; content: string };

export function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          history: messages,
          chatId 
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      if (data.chatId) setChatId(data.chatId);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Er ging iets mis. Probeer opnieuw.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="space-y-4 mb-4 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            Stel je eerste vraag...
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block p-3 rounded-lg max-w-[80%] ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400">Denken...</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Welke belastingen moet ik betalen als zzp'er?"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          →
        </button>
      </div>
      
      {!session && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Log in om je gesprekken te bewaren.
        </p>
      )}
    </div>
  );
}
```

### components/ProfileForm.tsx

```typescript
'use client';

import { useState } from 'react';

type Profile = {
  employmentType: string | null;
  yearlyIncome: number | null;
  hasPartner: boolean;
  hasMortgage: boolean;
  hasCompany: boolean;
  companyType: string | null;
};

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const [profile, setProfile] = useState<Profile>(initial || {
    employmentType: null,
    yearlyIncome: null,
    hasPartner: false,
    hasMortgage: false,
    hasCompany: false,
    companyType: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wat is je werksituatie?
        </label>
        <select
          value={profile.employmentType || ''}
          onChange={(e) => setProfile({ ...profile, employmentType: e.target.value || null })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Selecteer...</option>
          <option value="employed">In loondienst</option>
          <option value="zzp">ZZP / Freelancer</option>
          <option value="both">Beide</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Geschat jaarinkomen (€)
        </label>
        <input
          type="number"
          value={profile.yearlyIncome || ''}
          onChange={(e) => setProfile({ ...profile, yearlyIncome: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="50000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasPartner}
            onChange={(e) => setProfile({ ...profile, hasPartner: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een fiscaal partner</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasMortgage}
            onChange={(e) => setProfile({ ...profile, hasMortgage: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een hypotheek</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasCompany}
            onChange={(e) => setProfile({ ...profile, hasCompany: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een bedrijf</span>
        </label>
      </div>

      {profile.hasCompany && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type bedrijf
          </label>
          <select
            value={profile.companyType || ''}
            onChange={(e) => setProfile({ ...profile, companyType: e.target.value || null })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Selecteer...</option>
            <option value="eenmanszaak">Eenmanszaak</option>
            <option value="vof">VOF</option>
            <option value="bv">BV</option>
          </select>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {saving ? 'Opslaan...' : saved ? '✓ Opgeslagen' : 'Opslaan'}
      </button>
    </div>
  );
}
```

### components/Footer.tsx

```typescript
export function Footer() {
  return (
    <footer className="text-center text-sm text-gray-500 py-8 mt-16 border-t">
      <p>
        Dit is geen juridisch advies. Raadpleeg een belastingadviseur
        voor officieel advies.
      </p>
    </footer>
  );
}
```

---

## Pages

### app/layout.tsx

```typescript
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { AuthButton } from '@/components/AuthButton';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <SessionProvider>
          <header className="flex justify-between items-center px-4 py-3 border-b">
            <a href="/" className="font-bold">🇳🇱 Fiscaal.ai</a>
            <AuthButton />
          </header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### app/page.tsx

```typescript
import { Hero } from '@/components/Hero';
import { Chat } from '@/components/Chat';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen px-4">
      <Hero />
      <Chat />
      <Footer />
    </main>
  );
}
```

### app/login/page.tsx

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('email', { email, callbackUrl: '/' });
    setSent(true);
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Check je email</h1>
          <p className="text-gray-600">
            We hebben een login link gestuurd naar {email}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Inloggen</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="je@email.nl"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            Stuur login link
          </button>
        </form>
      </div>
    </main>
  );
}
```

### app/profile/page.tsx

```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ProfileForm } from '@/components/ProfileForm';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await db.profile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Je belastingprofiel</h1>
        <p className="text-gray-600 mb-6">
          Vul je gegevens in voor persoonlijker advies.
        </p>
        <ProfileForm initial={profile} />
      </div>
    </main>
  );
}
```

---

## API Routes

### app/api/chat/route.ts

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { message, history, chatId } = await req.json();

  // Call tax service
  const res = await fetch(process.env.SERVICE_URL + '/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SERVICE_API_KEY!,
    },
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json();
  const response = data.response?.[0]?.text || data.response || 'Geen antwoord';

  // Save chat if user is logged in
  let savedChatId = chatId;
  if (session?.user?.id) {
    const messages = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }];
    
    if (chatId) {
      await db.chat.update({
        where: { id: chatId },
        data: { messages: JSON.stringify(messages) },
      });
    } else {
      const chat = await db.chat.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50),
          messages: JSON.stringify(messages),
        },
      });
      savedChatId = chat.id;
    }
  }

  return Response.json({ response, chatId: savedChatId });
}
```

### app/api/profile/route.ts

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  await db.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return Response.json({ success: true });
}
```

---

## What We Cut

| Feature | Status | Why |
|---------|--------|-----|
| shadcn/ui | ❌ Cut | Tailwind is enough |
| Dark mode | ❌ Cut | One theme |
| Streaming | ❌ Cut | Add later |
| Chat history page | ❌ Cut | Just save, view later |
| Pricing page | ❌ Cut | No monetization yet |
| i18n | ❌ Cut | Dutch only |

---

## Deployment Notes

### SQLite in Production

For Vercel, SQLite won't persist. Options:

1. **Turso** (SQLite edge) — Free tier, easy migration
2. **PlanetScale** — Switch to MySQL
3. **Supabase** — Switch to Postgres

For MVP, develop with SQLite locally, switch to Turso before deploy:

```bash
npm install @libsql/client
```

Update prisma to use Turso driver when ready.

---

## Environment Variables (.env.local)

```bash
# Database
DATABASE_URL="file:./dev.db"

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Email (Resend free tier)
EMAIL_SERVER=smtp://resend:re_xxxx@smtp.resend.com:465
EMAIL_FROM=noreply@fiscaal.ai

# Tax Service
SERVICE_URL=https://api.fiscaal.ai
SERVICE_API_KEY=your_key
```

---

## Success Criteria

MVP is done when:

- [ ] User can ask tax questions (no login)
- [ ] User can login with email
- [ ] Logged-in user's chats are saved
- [ ] User can fill tax profile
- [ ] Works on mobile
- [ ] Deployed

---

## Cost

| Item | Cost |
|------|------|
| Vercel | Free |
| Turso | Free (500 DBs, 9GB) |
| Resend | Free (100 emails/day) |
| Domain | €10/year |
| **Total** | **€10/year** |
    });
    
    const data = await res.json();
    setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    setLoading(false);
};

return (
<div className="max-w-xl mx-auto">
<div className="space-y-4 mb-4 min-h-[200px]">
{messages.map((m, i) => (
<div key={i} className={m.role === 'user' ? 'text-right' : ''}>
<span className={`inline-block p-3 rounded-lg ${
m.role === 'user'
? 'bg-blue-600 text-white'
: 'bg-gray-100'
}`}>
{m.content}
</span>
</div>
))}
{loading && <div className="text-gray-400">Denken...</div>}
</div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Stel je vraag..."
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          onClick={send}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          →
        </button>
      </div>
    </div>
);
}
```

### 3. Footer.tsx

```tsx
export function Footer() {
  return (
    <footer className="text-center text-sm text-gray-500 py-8 mt-16 border-t">
      <p>
        Dit is geen juridisch advies. Raadpleeg een belastingadviseur 
        voor officieel advies.
      </p>
    </footer>
  );
}
```

### 4. API Route (app/api/chat/route.ts)

```tsx
export async function POST(req: Request) {
  const { message, history } = await req.json();
  
  const res = await fetch(process.env.SERVICE_URL + '/api/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SERVICE_API_KEY
    },
    body: JSON.stringify({ message, history })
  });
  
  const data = await res.json();
  return Response.json(data);
}
```

---

## Main Page (app/page.tsx)

```tsx
import { Hero } from '@/components/Hero';
import { Chat } from '@/components/Chat';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen px-4">
      <Hero />
      <Chat />
      <Footer />
    </main>
  );
}
```

---

## Environment Variables

```bash
# .env.local
SERVICE_URL=https://api.fiscaal.ai
SERVICE_API_KEY=your_key
```

---

## Deployment

```bash
# Install
npx create-next-app@latest fiscaal-ai-web --typescript --tailwind --app

# Develop
npm run dev

# Deploy (connect GitHub to Vercel)
git push origin main
# Vercel auto-deploys
```

---

## Add Later (After Validation)

Only add these after real users ask for them:

| Feature | When to add |
|---------|-------------|
| Streaming | Users complain about wait time |
| Auth | You want to charge money |
| History | Users ask "where did my chat go?" |
| Pricing page | You have a price |
| Analytics | You have traffic to analyze |

---

## Cost

| Item | Cost |
|------|------|
| Vercel | Free |
| Domain | €10/year |
| **Total** | **€10/year** |

---

## Success Criteria

MVP is done when:

- [ ] User can type a tax question
- [ ] User gets an answer
- [ ] Works on mobile
- [ ] Deployed to fiscaal.ai

That's it. Everything else is scope creep.
