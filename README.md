# 🍸 Nightlife Icebreaker — Digital Human Bingo

A real-time, gamified in-person networking web application designed for nightlife mixers, nightclub events, promoter parties, and corporate social events.

Guests scan a door QR code, answer a rapid 60-second survey, and receive a customized 5×5 Human Bingo Card. Attendees mingle in real life, perform mutual 2-sided QR/PIN handshakes, stamp matching squares, and compete for live prizes on the venue's projector wall.

---

## 🌟 Core Features

### 📱 1. Guest Experience (Zero-App Friction)
- **Frictionless Door Check-in**: 1-tap age verification and optional marketing opt-in (`/e/[code]`).
- **60-Second Rapid Survey**: 8 high-energy icebreaker prompts across Music, Travel, Drinks, Roots, Quirks, and Vibes.
- **Dynamic 5×5 Human Bingo Card**: Balanced feasibility algorithm ensuring solvable bingo lines.
- **Guest Pass**: High-contrast QR code + 4-character fallback PIN (`K7M2`) for low-light nightclub environments.
- **Mutual Two-Sided Handshake**: 60-second synchronized confirmation window preventing false claims.
- **1-Person-1-Square Rule**: Each attendee can only be stamped on at most **one** square per card. If multiple challenges match, an interactive picker modal lets the player choose their single strategic square.
- **Celebration Modal**: Instant confetti animations and conversation starters to deepen connections.
- **Safety & Moderation**: 1-tap blocking and anonymous incident reporting with automatic square masking.

### 🎛️ 2. Promoter & Host Suite
- **Event Setup Wizard**: Customizable game duration, 5×5 or 4×4 card size, scoring models, and prize packages (`/promoter/new`).
- **Live Host Command Console**: Real-time attendee counts, active matches, game pause/resume, clock extensions, and broadcast announcements (`/promoter/[eventId]`).
- **Fullscreen Projector Arena**: High-contrast TV wall display showing podium standings, live stats, and a scrolling marquee of recent connections (`/promoter/[eventId]/projector`).
- **Printable Door Flyers**: 1-click printable high-res QR code flyers and bar table tents (`/promoter/[eventId]/qr`).
- **Post-Event Analytics**: CSV export of consented marketing leads and winner breakdown (`/promoter/[eventId]/report`).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with high-contrast nightclub dark mode
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) on [Supabase](https://supabase.com/) with [Prisma ORM](https://www.prisma.io/)
- **Real-Time Layer**: Server-Sent Events (SSE) Hub with automatic fallback polling
- **Security**: Database-level compound constraints, 60-second expirations, and anti-fraud duplicate detection

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/brockandrews/nightlife-icebreaker.git
cd nightlife-icebreaker
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed
```bash
# Push schema to database
npx prisma db push

# Seed standard questions and default pilot event (PILOT-2026)
node prisma/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Multi-Player Game Simulation

Test full-scale games with 20 to 500+ concurrent players in seconds:

```bash
# Run default 25-player simulation
npm run test:simulation

# Or customize player count (e.g. 50 players)
npx tsx scripts/simulate-full-game.ts --players=50
```

---

## 📦 Production Deployment (Vercel)

1. Import the repository on [Vercel](https://vercel.com/new).
2. Set the 4 Environment Variables (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Click **Deploy**!

---

## 📄 License
MIT License
