# Chekin — Dashboard Preview

Live preview: **https://carloslagares.github.io/chekin-dashboard-preview/** (redirects to `dashboard/`)

## Repository layout

```
dashboard/            ← THE APP. Self-contained, exportable as-is.
  index.html          variant switcher (default: V8 Fable home) — deep-links via ?view=
  onboarding.html     adaptive onboarding wizard (5 steps)
  bookings.html       bookings list
  properties.html     properties feature-matrix
  variants/           home variants (v1…v7 legacy, v8_fable, v9_firstrun)
  ds/                 design system: tokens, shared sidebar, agent, assets
  guest-crm/          ← GUEST CRM. A capability inside the dashboard, but a
                        self-contained module: its own pages (guests, campaigns,
                        segments, deals, automation, consent), data/, services/,
                        agent/ and ds/_crm.*. It only consumes ../ds/ (shared
                        design system) and links back via ../index.html.

docs/                 ← documentation only — NOT needed to run anything
  ONBOARDING_PRD.md   onboarding + first-run PRD (frontend)
  Chekin_Onboarding_PRD.pdf
  screenshots/        captures used by the PRDs
  guest-crm/          Guest CRM PRD + roadmaps (md, pdf, html)

_archive/             ← legacy prototypes kept for reference (not linked from the app):
                        Welcome.html (old switcher), guestapp/, website/, uploads/,
                        referral-banner-demo.html
```

## How to run locally

Any static server from the repo root:

```bash
python3 -m http.server 8080
# open http://localhost:8080/dashboard/
```

## How to export for developers

- **Dashboard team:** ship the `dashboard/` folder (includes `guest-crm/`).
- **Guest CRM team only:** ship `dashboard/guest-crm/` + `dashboard/ds/` (the CRM
  imports the shared design system via `../ds/`).
- Docs for both live in `docs/`.

## Useful deep-links

| URL | What you get |
|---|---|
| `dashboard/index.html` | V8 Fable home (default) |
| `dashboard/index.html?view=onboarding` | Onboarding wizard |
| `dashboard/index.html?view=firstrun` | First-run home (post-onboarding) |
| `dashboard/onboarding.html?demo=ops&go=1` | Preset demo → personalized first-run (also: compliance, cleaning, manual, multi, all) |
| `dashboard/guest-crm/index.html` | Guest CRM |

These are prototypes (HTML/CSS/JS), not production code — recreate in the product
stack; match the visual output, not the internal structure.
