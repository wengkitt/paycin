# PayCin (俾錢)

A fully client-side group expense splitting app. No signups, no backend — all data stays in your browser's `localStorage`.

## Features

- **Groups** — Create groups for trips, dinners, roommates, or any shared expenses
- **Expenses** — Log expenses with title, amount, payer, date, category, notes, and split method
- **4 Split Methods** — Equal, Unequal (custom amounts), Percentage, or Shares
- **Dashboard** — See total spend, member balances, and category breakdowns with visual progress bars
- **Simplified Settlement** — Greedy algorithm calculates the minimum number of transactions needed to settle all debts
- **Settle Up** — One-click "Settle" records a payment and updates balances
- **Search & Filter** — Search expenses by title, filter by category
- **Export / Import** — Backup or transfer your data as JSON
- **Share** — Share split summaries via the Web Share API or clipboard
- **Demo Data** — Load example groups ("Ski Trip" and "Roommates") to explore the app
- **Dark Mode Ready** — Indigo/pink/green accent palette with clean, mobile-first design

## Tech Stack

| Category | Technology |
|---|---|
| Language | TypeScript (strict, `verbatimModuleSyntax`) |
| UI | React 19 |
| Build | Vite 8 + `@vitejs/plugin-react` (Oxc) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Animations | `motion` (formerly Framer Motion) |
| Icons | `lucide-react` |
| Linting | `oxlint` (Rust-based) |
| Deployment | Cloudflare Workers + Pages |
| Package Manager | pnpm (workspace) |

## Getting Started

```bash
# Prerequisites: Node.js (LTS) + pnpm 11.11+
corepack enable && corepack prepare pnpm@11.11.0 --activate

# Install dependencies
pnpm install

# Start dev server (HMR at localhost:5173)
pnpm dev

# Type-check and build for production
pnpm build

# Preview production build
pnpm preview
```

No `.env`, API keys, or external services required.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check (`tsc -b`) then build |
| `pnpm lint` | Run Oxlint |
| `pnpm preview` | Build then preview locally |
| `pnpm run deploy` | Build and deploy to Cloudflare Workers |
| `pnpm run cf-typegen` | Regenerate Cloudflare Worker types |

## Project Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Root component (state, navigation, localStorage)
├── index.css                   # Tailwind imports + custom animations
├── types.ts                    # TypeScript types (Group, Expense, Debt, etc.)
├── components/
│   ├── GroupList.tsx           # Home screen — group cards, import/export
│   ├── CreateGroup.tsx         # Create/edit group form
│   ├── GroupDetail.tsx         # Detail view with 4 tabs
│   └── AddExpenseModal.tsx     # Add/edit expense modal
└── utils/
    ├── splitCalculator.ts      # Balance & debt simplification algorithm
    └── demoData.ts             # Demo group data
```

## Deployment

```bash
pnpm run deploy
```

Requires a Cloudflare account. The static SPA is served via Cloudflare Pages with SPA fallback handling, and a minimal Worker stub handles `/api/` routes.

## License

MIT
