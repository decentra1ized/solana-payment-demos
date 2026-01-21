# Solana Payment Demos

Interactive demo website showcasing Solana-based payment solutions. Built to demonstrate Solana's advantages in stablecoin payments with real-world metrics and interactive demos.

## Features

### Performance Metrics
- Global stablecoin market statistics (Visa Onchain Analytics)
- Stablecoin transaction count by blockchain (stacked bar chart)

### Interactive Payment Demos
- **Basic SOL Payment**: Direct P2P SOL transfer with ~400ms confirmation
- **USDC Transfer**: SPL token transfer with automatic ATA creation
- **Payment with Memo**: Attach invoice/order IDs on-chain (SOL/USDC)
- **Solana Pay QR**: QR-based payment flow simulation (SOL/USDC)
- **Batch Payment**: Multiple transfers in a single atomic transaction (SOL/USDC)
- **Fee Abstraction**: Sponsor pays transaction fees on behalf of users (SOL/USDC)
- **Prepaid Card Top-up**: Deposit to charge prepaid card balance (SOL/USDC)

### Additional Features
- Test wallet management (Devnet)
- Dark/Light theme support
- Bilingual support (English/Korean)

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: wouter
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Blockchain**: Solana Web3.js (Devnet)

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

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── demos/           # Payment demo components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── Layout.tsx       # Main layout with navigation
│   └── WalletModal.tsx  # Test wallet management
├── data/
│   ├── metrics.ts       # Stablecoin & performance data
│   ├── useCases.ts      # Use case definitions
│   └── adopters.ts      # Industry adopters data
├── lib/
│   ├── useLanguage.ts   # i18n hook
│   └── useLocalWallet.ts # Local wallet state management
├── pages/
│   ├── Home.tsx         # Landing page
│   ├── Metrics.tsx      # Performance metrics dashboard
│   └── UseCases.tsx     # Interactive demos
└── App.tsx
```

## Network

This demo uses **Solana Devnet** only. Test wallets and transactions are for demonstration purposes.

## Faucet Setup

The airdrop feature (`/api/faucet.ts`) runs as a Vercel serverless function.

### Vercel Deployment

1. Deploy project to Vercel
2. Set Environment Variables:
   ```
   MASTER_WALLET_SECRET=123,45,67,89,...(secret key array)
   ```
3. Master wallet needs SOL and USDC (Devnet) balance

### Local Development

To test the faucet locally, use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Run Vercel environment locally
vercel dev
```

Or create `.env.local` file and run `vercel dev`:

```env
MASTER_WALLET_SECRET=123,45,67,89,...
```

### How Faucet Works

| Token | Airdrop Amount | Description |
|-------|----------------|-------------|
| SOL | 0.01 SOL | Transfer from master wallet |
| USDC | 0.05 USDC | Transfer from master wallet |

**Devnet USDC Mint:** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

Fund master wallet:
- Devnet SOL: https://faucet.solana.com/
- Devnet USDC: https://faucet.circle.com/

## License

MIT
