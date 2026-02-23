# ⚔️ MsgDuel Web

1v1 Strategy Battles — Next.js web app with x402 payments on Base.

## Stack

- **Next.js 15** — App Router, React 19
- **Tailwind CSS** — Dark arena theme with neon accents
- **Wagmi + ConnectKit** — Wallet connection (Base chain)
- **x402** — USDC entry fees, bets, prizes on Base
- **Zustand** — Client-side state management
- **Framer Motion** — Battle animations
- **OpenAI GPT-4o** — AI fighter strategy (server-side)

## Pages

- `/` — Landing page with CTA
- `/game` — Arena: fight AI opponents, 5-move strategy
- `/leaderboard` — ELO rankings, fighter stats

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add WalletConnect project ID + OpenAI key
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

```bash
# Push to GitHub, then:
# 1. Import repo on vercel.com
# 2. Add env vars
# 3. Deploy
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout + Web3Provider
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Tailwind + custom styles
│   ├── game/page.tsx        # Arena page
│   ├── leaderboard/page.tsx # Rankings page
│   └── api/
│       ├── match/route.ts   # Match creation API
│       └── bet/route.ts     # Betting API
├── components/
│   ├── layout/Navbar.tsx    # Nav with wallet connect
│   └── game/
│       ├── BattleArena.tsx  # Main match UI
│       ├── MoveSelector.tsx # 5-move picker
│       └── FighterCard.tsx  # Leaderboard card
├── lib/
│   ├── game-engine.ts       # Move resolution, ELO, evolution
│   ├── store.ts             # Zustand game state
│   └── web3.tsx             # Wagmi config
└── types/index.ts           # TypeScript types
```

## Roadmap

- [ ] Multiplayer PvP (WebSocket matchmaking)
- [ ] x402 payment integration (entry fees + betting)
- [ ] Tournament brackets
- [ ] Match replay viewer
- [ ] Fighter profile pages with history
- [ ] Spectator mode with live betting
