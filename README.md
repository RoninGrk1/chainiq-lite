# ChainIQ Lite

Lightweight AI chatbot for **blockchain, crypto and financial information**.

Read-only MVP — educational answers, market snapshots, and public on-chain lookups.  
**Not** a trading app. **Never** asks for private keys or seed phrases. **No** personalised investment advice.

## Stack

| Layer | Choice | Free-tier notes |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Vercel Hobby |
| AI | Cloudflare Workers AI via API routes | Workers AI free tier |
| Backend | Next.js Route Handlers | same deploy |
| DB / Auth | Supabase (schema + client stubs) | Supabase free tier — auth UI in Phase 2 |
| Prices | CoinGecko Demo API | demo key optional |
| Ethereum | Etherscan API | free API key |
| DeFi | DefiLlama | public, no key |
| Hosting | Vercel | Hobby £0 target |

**£0 cost target caveats:** free tiers have rate limits and fair-use caps. Heavy traffic, Workers AI overages, or Supabase beyond free quotas can incur cost. Keep keys server-side and monitor dashboards.

## Local run

```bash
cp .env.example .env.local
# fill any keys you have — app runs in offline/demo mode without them
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve production build
```

## What works without API keys

| Feature | Without keys | With keys |
| --- | --- | --- |
| Chat UI + terminology offline stub | Yes | Cloudflare Workers AI live replies |
| Markets page (BTC/ETH majors) | CoinGecko public demo* | Higher limits with `COINGECKO_API_KEY` |
| Conversion widget | Yes* | same |
| DefiLlama TVL API | Yes (no key) | — |
| Etherscan tx lookup | Needs `ETHERSCAN_API_KEY` | Yes |
| Conversation history persistence | UI shell only | Supabase URL + anon (+ migration) |
| Auth | stubbed | Phase 2 |

\*CoinGecko may rate-limit anonymous traffic; a free demo key is recommended.

## Environment variables

See [`.env.example`](./.env.example). Never commit `.env` / `.env.local`.

- `CF_ACCOUNT_ID` / `CF_API_TOKEN` — Workers AI  
- `CF_AI_MODEL` — default `@cf/meta/llama-3.1-8b-instruct`  
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`  
- `COINGECKO_API_KEY` (optional)  
- `ETHERSCAN_API_KEY`  
- `NEXT_PUBLIC_APP_URL`

## Supabase migration

Apply [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql) in the Supabase SQL editor (tables: `user_preferences`, `chat_sessions`, `chat_messages` + RLS).

## Safety

- Server-only secrets; basic input validation; simple in-memory rate limits on API routes  
- System prompt refuses personalised advice and seed phrases  
- Sources + timestamps shown for market data where available  

## Licence

MIT — use at your own risk. Informational software only.
