# CoinScope

A modern cryptocurrency price tracker built for Base, featuring real-time market data from CoinMarketCap API.

## Features

- 📊 **Top 100 Cryptocurrencies**: Real-time prices, market cap, and 24h volume
- 📈 **Fear & Greed Index**: Visual indicator with color-coded sentiment
- 🎨 **Modern UI**: Dark theme with gradient stats cards and responsive design
- 🔄 **Auto-refresh**: Data updates automatically every 60 seconds
- 🖼️ **Coin Logos**: Automatic logo fetching and caching

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Farcaster MiniApp SDK**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- CoinMarketCap API key ([Get one here](https://coinmarketcap.com/api/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd base-price-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your environment variables to `.env.local`:
```env
NEXT_PUBLIC_URL=http://localhost:3000
CMC_API_KEY=your_coinmarketcap_api_key_here
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CMC_API_KEY` | CoinMarketCap API key | Yes |
| `NEXT_PUBLIC_URL` | Public URL of your app | Yes |
| `FARCASTER_HEADER` | Farcaster header (for mini-app) | Optional |
| `FARCASTER_PAYLOAD` | Farcaster payload (for mini-app) | Optional |
| `FARCASTER_SIGNATURE` | Farcaster signature (for mini-app) | Optional |

**⚠️ Important**: Never commit `.env.local` or expose your API keys. The `.gitignore` file is configured to exclude all `.env*` files except `.env.example`.

## Project Structure

```
base-price-tracker/
├── app/
│   ├── api/              # API routes (server-side)
│   │   ├── prices/       # CoinMarketCap listings
│   │   ├── fear-greed/    # Fear & Greed Index
│   │   └── logos/         # Coin logo fetching
│   ├── components/        # React components
│   │   └── StatsCard.tsx  # Stats card component
│   ├── .well-known/       # Farcaster manifest
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── public/                # Static assets
├── scripts/               # Utility scripts
└── .env.example           # Environment template
```

## API Routes

All API routes are server-side and use `process.env.CMC_API_KEY` securely:

- `/api/prices` - Fetches top 100 cryptocurrencies
- `/api/fear-greed` - Fetches Fear & Greed Index
- `/api/logos` - Fetches coin logos by ID

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Ensure you set all required environment variables in your hosting platform's dashboard.

## Security

- ✅ API keys are stored in environment variables only
- ✅ `.env.local` is gitignored
- ✅ No API keys in code or commits
- ✅ Server-side API routes protect sensitive data

## License

MIT
