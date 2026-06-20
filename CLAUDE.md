# WC 2026 Match Tracker

## Product Vision
A real-time FIFA World Cup 2026 tracker that always reflects the latest match results across every view, with zero manual intervention required from the user.

## UX Principles
- **Accuracy is non-negotiable.** Every score, record, and probability must reflect actual match results. If data is stale or wrong, the app is useless.
- **Every view must show actual results.** When a match is completed, its score must appear in Team View, Bracket View, Venue View, Round View — everywhere the match or its teams are referenced.
- **Mobile-first.** The primary user is on an iPhone. All layouts must work well on phone screens before desktop.
- **No manual steps.** Simulations auto-run. Results auto-update. The user should never need to click "run" or "refresh" to see current data.
- **Show records everywhere.** Next to every team name, show their W-D-L record if they've played any games.

## Technical Notes
- Next.js 14 (pages router), TypeScript, React 18, single-file app in `pages/index.tsx`
- Poisson Goal Model (Maher 1982 / Dixon-Coles 1997), Monte Carlo simulation (10,000 iterations)
- Live results fetched from `/api/results` (ESPN API with hardcoded fallback)
- Live ratings fetched from `/api/fivethirtyeight` (FIFA API with fallback)
- Deploy: Vercel from `main` branch. Feature work on `claude/wc2026-tracker-app-709pM`, merge via GitHub PR.
- Cannot push directly to `main` from Claude Code environment (403). Always provide direct GitHub merge links.

## QA Checklist (apply to every change)
- Does every view that shows team names also show their current W-D-L record?
- Does every view that shows a match also show its result if completed?
- Does the simulation incorporate all actual results?
- Does the bracket reflect clinched positions?
- Does the app render correctly on mobile (375px width)?
