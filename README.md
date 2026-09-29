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
| DB / Auth | Supabase (`@supabase/ssr`) | Supabase free tier |
| Prices | CoinGecko Demo API | demo key optional |
| Ethereum | Etherscan API | free API key |
| DeFi | DefiLlama | public, no key |
| Hosting | Vercel | Hobby £0 target |

**£0 cost target caveats:** free tiers have rate limits and fair-use caps. Heavy traffic, Workers AI overages, or Supabase beyond free quotas can incur cost. Keep keys server-side and monitor dashboards.

## Local run

```bash
cp .env.example .env.local
# fill any keys you have — app runs in guest/demo mode without Supabase
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve production build
```

## Supabase setup (ChainIQ Lite project)

Use a **dedicated** Supabase project for this app (do not point at unrelated projects).

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy **Project URL** and the **anon public** key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. (Optional) copy the **service_role** key as `SUPABASE_SERVICE_ROLE_KEY` for trusted server jobs only — never ship it to the browser.
4. Open **SQL Editor**, paste and run [`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql).  
   This creates `profiles`, `user_preferences`, `chat_sessions`, `chat_messages`, RLS policies, and a signup trigger.
5. Under **Authentication → Providers**, enable **Email** (password and/or magic link).
6. Under **Authentication → URL configuration**, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your production origin + `/auth/callback`
7. Restart `npm run dev`.

Without these env vars the UI still works: chat is guest-only, Settings shows **Configure Supabase**, and History asks you to sign in after configuration.

## What works without API keys

| Feature | Without keys | With keys |
| --- | --- | --- |
| Chat UI + terminology offline stub | Yes | Cloudflare Workers AI live replies |
| Markets page (BTC/ETH majors) | CoinGecko public demo* | Higher limits with `COINGECKO_API_KEY` |
| Conversion widget | Yes* | same |
| DefiLlama TVL API | Yes (no key) | — |
| Etherscan tx lookup | Needs `ETHERSCAN_API_KEY` | Yes |
| Auth (email / magic link) | “Configure Supabase” UI | `NEXT_PUBLIC_SUPABASE_*` + migration |
| Conversation history | Guest local only | Signed-in sessions in Supabase |
| Preferences (fiat / theme) | Local defaults until signed in | Synced `user_preferences` |

\*CoinGecko may rate-limit anonymous traffic; a free demo key is recommended.

## Environment variables

See [`.env.example`](./.env.example). Never commit `.env` / `.env.local`.

- `CF_ACCOUNT_ID` / `CF_API_TOKEN` — Workers AI  
- `CF_AI_MODEL` — default `@cf/meta/llama-3.1-8b-instruct`  
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`  
- `COINGECKO_API_KEY` (optional)  
- `ETHERSCAN_API_KEY`  
- `NEXT_PUBLIC_APP_URL`

## Auth & data model

- **Guest chat** — allowed without login; not persisted to Supabase.
- **Signed-in chat** — creates `chat_sessions` + `chat_messages` (RLS: own rows only).
- **History** — lists sessions for the signed-in user; open via `/?session=<id>`.
- **Settings** — email/password or magic-link auth; load/save `user_preferences`.
- **Middleware** — refreshes the Supabase session cookie on matched routes.

## Safety

- Server-only secrets; basic input validation; simple in-memory rate limits on API routes  
- System prompt refuses personalised advice and seed phrases  
- Sources + timestamps shown for market data where available  

## Licence

MIT — use at your own risk. Informational software only.
