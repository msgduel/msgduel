# ⚔️ MsgDuel

**1v1 Strategy Battles on Base — XMTP × x402 × Supabase**

MsgDuel is a competitive 1v1 strategy game where players (or AI fighters) battle using a 5-move extended game theory system. Matches are played over XMTP encrypted messaging, entry fees and prizes are settled in USDC on Base via x402, and real-time PvP matchmaking is powered by Supabase Realtime.

🔗 **Live:** [msgduel.com](https://msgduel.com)

---

## How It Works

### The Game

MsgDuel is **not** rock-paper-scissors. It's an extended 5-move strategy system where every move beats exactly 2 others and loses to exactly 2 others:

| Move | Beats | Loses To |
|------|-------|----------|
| 🪨 Rock | Scissors, Feint | Paper, Shield |
| 📄 Paper | Rock, Shield | Scissors, Feint |
| ✂️ Scissors | Paper, Feint | Rock, Shield |
| 🛡️ Shield | Rock, Scissors | Paper, Feint |
| 👻 Feint | Paper, Shield | Rock, Scissors |

Matches are **best of 5 rounds**. Each round, both players simultaneously choose a move. The player who wins 3 rounds first takes the match.

### Match Flow

```
1. Connect Wallet
   └─ Player connects MetaMask or any wallet to Base chain

2. Pay Entry Fee
   └─ $1 USDC transferred to arena wallet via x402

3. Choose Mode
   ├─ ⚔️ Fight AI — Instant match against an evolving AI opponent
   └─ 🤺 PvP Match — Join matchmaking queue, fight a real player

4. Battle (Best of 5 Rounds)
   ├─ Select move (Rock/Paper/Scissors/Shield/Feint)
   ├─ [PvP] Commit-reveal: hash sent first, then revealed
   ├─ Round resolves → score updates
   └─ Repeat until winner determined

5. Settlement
   ├─ Winner receives prize pool ($1.90 USDC after 5% house fee)
   ├─ Fighter stats updated in database
   └─ Fighter style evolves based on opponent patterns
```

### Commit-Reveal Anti-Cheat (PvP)

In PvP matches, a commit-reveal scheme prevents cheating:

```
Round Start
    │
    ▼
┌─────────────────┐     ┌─────────────────┐
│    Player 1     │     │    Player 2     │
│  Picks "Rock"   │     │  Picks "Shield" │
│                 │     │                 │
│  hash = SHA256  │     │  hash = SHA256  │
│  ("rock:salt")  │     │  ("shield:salt")│
│                 │     │                 │
│  Sends hash ────┼─────┼── Sends hash    │
└────────┬────────┘     └────────┬────────┘
         │    Both committed?    │
         │         YES           │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Reveals "rock"  │     │ Reveals "shield"│
│  + salt          │     │ + salt          │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
   ┌──────────────────────────────────┐
   │     Verify hashes match          │
   │     Resolve: Shield beats Rock   │
   │     Player 2 wins the round      │
   └──────────────────────────────────┘
```

Neither player can see the other's move until both have committed. The hash ensures moves can't be changed after submission.

### AI Evolution

AI fighters are not static — they evolve after every match:

```
Match Ends
    │
    ▼
┌──────────────────────────┐
│  Analyze opponent moves  │
│  Count frequency of each │
│  move used by opponent   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Boost counter-moves     │
│  If opponent used Rock   │
│  often → boost Paper &   │
│  Shield weights           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Apply random mutation   │
│  Small random shifts to  │
│  prevent predictability  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Detect archetype        │
│  🥊 Brawler (Rock heavy) │
│  🧠 Tactician (Paper)    │
│  🗡️ Assassin (Scissors)  │
│  🐢 Turtle (Shield)      │
│  🃏 Trickster (Feint)    │
│  ⚖️ Balanced (even)      │
└──────────────────────────┘
```

Over time, each fighter develops a unique personality and play style.

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js)                     │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Wagmi  │  │  Game UI │  │  XMTP   │  │  Supabase    │  │
│  │ Wallet  │  │  Battle  │  │  Client  │  │  Realtime    │  │
│  │ Connect │  │  Arena   │  │  Hook   │  │  Subscriber  │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └──────┬───────┘  │
│       │            │             │               │           │
└───────┼────────────┼─────────────┼───────────────┼───────────┘
        │            │             │               │
        ▼            ▼             ▼               ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌──────────────┐
  │  Base    │ │ Vercel   │ │  XMTP    │  │  Supabase    │
  │  Chain   │ │ API      │ │  Network │  │  Cloud       │
  │          │ │ Routes   │ │          │  │              │
  │  • USDC  │ │ • /match │ │  • E2E   │  │  • Postgres  │
  │  • Entry │ │ • /pay   │ │  encrypt │  │  • Realtime  │
  │  • Prize │ │ • /leader│ │  • Group │  │  • Matches   │
  │          │ │          │ │  chat    │  │  • Rounds    │
  └──────────┘ └──────────┘ └──────────┘  │  • Fighters  │
                                          │  • Queue     │
                                          └──────────────┘
```

### Request Flow by Feature

**Matchmaking (PvP):**
```
Player clicks "PvP Match"
  → payEntryFee() → USDC transfer on Base
  → joinQueue() → Insert into Supabase matchmaking table
  → Supabase checks for waiting opponent
  → If found: create match, notify both via Realtime
  → If not: wait, Realtime notifies when opponent joins
```

**Playing a Round (AI):**
```
Player selects move
  → Game engine resolves locally (AI move from weighted random)
  → Score updates in Zustand store
  → Round result broadcast over XMTP (if connected)
  → Fighter evolves after match ends
```

**Playing a Round (PvP):**
```
Player selects move
  → commitMove() → SHA256(move + salt)
  → Hash written to Supabase rounds table
  → Supabase Realtime notifies opponent of commit
  → Both committed → both reveal
  → Moves written to rounds table
  → Game engine resolves round
  → Match state updated in Supabase
  → Both clients receive update via Realtime
```

**Payment Settlement:**
```
Match ends → winner determined
  → API /payment route called
  → Prize = entry_fee × 2 × 0.95 (5% house fee)
  → USDC transfer from arena wallet to winner
  → Fighter earnings updated in Supabase
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, Tailwind | UI, game interface, animations |
| Wallet | Wagmi, ConnectKit | Wallet connection on Base chain |
| Messaging | XMTP Browser SDK | Encrypted match chat, protocol messages |
| Payments | x402, USDC on Base | Entry fees, prize payouts |
| Database | Supabase (Postgres) | Fighters, matches, rounds, leaderboard |
| Realtime | Supabase Realtime | PvP sync, matchmaking queue |
| State | Zustand | Client-side game state (AI mode) |
| Animation | Framer Motion | Battle UI transitions |

---

## Project Structure

```
msgduel-web/
├── public/
│   └── mascot.svg              # Robot gladiator mascot
├── supabase/
│   └── schema.sql              # Database schema (run in Supabase SQL Editor)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + Web3Provider
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Tailwind + arena theme
│   │   ├── game/page.tsx       # Arena — AI + PvP modes
│   │   ├── leaderboard/page.tsx# Rankings from Supabase
│   │   └── api/
│   │       ├── match/route.ts  # Match CRUD + move submission
│   │       ├── payment/route.ts# Entry fee verify + prize payout
│   │       └── leaderboard/route.ts
│   ├── components/
│   │   ├── layout/Navbar.tsx   # Nav + wallet connect + mascot
│   │   └── game/
│   │       ├── BattleArena.tsx # Main battle UI + scoreboard
│   │       ├── MoveSelector.tsx# 5-move picker with tooltips
│   │       ├── FighterCard.tsx # Leaderboard fighter card
│   │       ├── XmtpStatus.tsx  # XMTP connection indicator
│   │       └── MatchChat.tsx   # Encrypted in-match chat
│   ├── hooks/
│   │   ├── useXmtp.ts         # XMTP client — connect, send, stream
│   │   ├── useXmtpMatch.ts    # Match-specific XMTP messaging
│   │   ├── useMatchmaking.ts  # Supabase queue + Realtime matching
│   │   └── usePvpMatch.ts     # Real-time PvP game sync
│   ├── lib/
│   │   ├── game-engine.ts     # Move resolution, evolution, commit-reveal
│   │   ├── store.ts           # Zustand state (AI matches)
│   │   ├── supabase.ts        # Supabase client (browser + server)
│   │   ├── payments.ts        # USDC transfer helpers
│   │   └── web3.tsx           # Wagmi + ConnectKit config
│   └── types/index.ts         # TypeScript type definitions
├── .env.example                # Environment variables template
├── next.config.mjs             # COOP/COEP headers for XMTP
├── tailwind.config.js          # Arena theme colors + fonts
└── package.json
```

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/clawmart/msgduel.git
cd msgduel
echo "legacy-peer-deps=true" > .npmrc
npm install
```

### 2. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run
3. Go to **Settings** → **API** → copy the URL, anon key, and service role key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_ARENA_WALLET=0x_your_wallet
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
git add . && git commit -m "ready" && git push
```

Import repo on [vercel.com](https://vercel.com) → add env vars → deploy.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server only) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional | WalletConnect for wallet modal |
| `NEXT_PUBLIC_ARENA_WALLET` | Yes | Wallet to receive entry fees |
| `NEXT_PUBLIC_USDC_CONTRACT` | Optional | USDC address on Base (default included) |
| `NEXT_PUBLIC_ENTRY_FEE` | Optional | Entry fee in USDC (default: 1) |
| `NEXT_PUBLIC_ROUNDS` | Optional | Rounds per match (default: 5) |
| `NEXT_PUBLIC_HOUSE_FEE` | Optional | House fee percentage (default: 5) |
| `OPENAI_API_KEY` | Optional | For future AI strategy via GPT-4o |

---

## Roadmap

- [x] 5-move strategy game engine
- [x] AI opponent with evolution
- [x] XMTP encrypted match chat
- [x] x402 USDC payments on Base
- [x] Supabase database + Realtime PvP
- [x] Matchmaking queue
- [x] Commit-reveal anti-cheat
- [ ] Tournament brackets
- [ ] Match replay viewer
- [ ] Fighter profile pages
- [ ] Spectator mode with live betting
- [ ] Mobile app (React Native)

---

## License

MIT
