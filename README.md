# 777 - Lucky Sevens 🎰

A Farcaster Mini App slot machine game built on Base. Spin daily, climb the leaderboard, and chase the jackpot!

## Features

- **Daily Free Spin**: Every user gets 1 free spin per day
- **Authentic Slot Machine**: Realistic 777 slot machine mechanics with weighted symbol odds
- **Points System**: Casino-style payouts based on symbol combinations
- **Global Leaderboard**: Compete with other players for the top spot
- **Profile Stats**: Track your performance, win rate, and spin history
- **Farcaster Integration**: Connect with your Farcaster wallet

## Payouts

| Combination | Points |
|-------------|--------|
| 7 7 7 (JACKPOT!) | 777 |
| 💎 💎 💎 | 200 |
| 🍀 🍀 🍀 | 100 |
| ⭐ ⭐ ⭐ | 75 |
| 🔔 🔔 🔔 | 50 |
| 🍋 🍋 🍋 | 30 |
| 🍒 🍒 🍒 | 20 |
| Any 2 matching | 2-25 |
| Single 7 | 5 |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS with custom properties (no frameworks)
- **Wallet**: wagmi + Farcaster Mini App SDK
- **State**: React hooks + localStorage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ConnectWallet.tsx    # Wallet connection button
│   ├── Leaderboard.tsx      # Rankings display
│   ├── Loader.tsx           # Loading screen
│   ├── Profile.tsx          # User profile & stats
│   └── SlotMachine.tsx      # Main game component
├── config/
│   └── farcaster.ts         # Farcaster SDK init
├── hooks/
│   ├── useGameState.ts      # Game logic & state management
│   └── useWallet.ts         # Wallet connection hook
├── pages/
│   ├── GamePage.tsx         # Main game screen with tabs
│   └── LandingPage.tsx      # Pre-login landing page
├── App.tsx                  # Root component
├── main.tsx                 # Entry point
├── wagmi.ts                 # Wagmi config
└── index.css                # Global styles
```

## Game Logic

The slot machine uses weighted random selection for symbol generation:
- 🍒 Cherry: 25% (most common)
- 🍋 Lemon: 22%
- 🔔 Bell: 18%
- ⭐ Star: 15%
- 🍀 Clover: 12%
- 💎 Diamond: 6%
- 7 Seven: 2% (rarest - jackpot symbol)

## License

MIT
