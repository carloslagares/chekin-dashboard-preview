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
  local-network/      ← LOCAL EXPERIENCES (path kept for URL stability).
                        Supply-side residual programme inside the
                        AppSell marketplace: a host introduces a local supplier,
                        who then becomes bookable by every property in coverage,
                        and the introducing host earns an ongoing residual.
                        Same self-contained shape: pages (overview, supply book,
                        supplier detail, submit wizard, discover, bounties, admin
                        review), data/, services/, agent/ and ds/_ln.*.
                        All economics live in data/config.js.

docs/                 ← documentation only — NOT needed to run anything
  ONBOARDING_PRD.md   onboarding + first-run PRD (frontend)
  Chekin_Onboarding_PRD.pdf
  screenshots/        captures used by the PRDs
  guest-crm/          Guest CRM PRD + roadmaps (md, pdf, html)
  local-network/      Local Network technical architecture — layering, the
                      economics kernel, the claim state machine, determinism,
                      and where each invariant is enforced. ARCHITECTURE.md is
                      the source; the PDF is typeset in the AppSell document
                      format (Chekin_AppSell_Local_Network_Technical_
                      Architecture.pdf) as a companion to Docs 1 and 3.

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
| `dashboard/index.html?view=network` | Local Network inside the variant switcher |
| `dashboard/index.html?view=crm` | Guest CRM inside the variant switcher |
| `dashboard/local-network/index-fable.html` | **Local Experiences — the published landing.** What the programme is, with a live earnings calculator |
| `dashboard/local-network/supply-book-fable.html` | The supply book — the working view behind the landing's CTA |
| `dashboard/local-network/index.html` | The first-pass design, kept for comparison |
| `dashboard/local-network/index-fable.html?first_run=1` | Local Network before anything exists — the true empty state |

| `dashboard/local-network/submit-fable.html` | Submit-a-supplier wizard (5 steps) |
| `dashboard/local-network/submit-fable.html?bounty=bty_cad_transfer` | The wizard pre-filled from a bounty |
| `dashboard/local-network/supplier-detail-fable.html?supplier=sup_riera` | One supplier: claim stepper, roles, economics, quality |
| `dashboard/local-network/discover-fable.html` | Network supply available to my properties, with the veto |
| `dashboard/local-network/bounties-fable.html` | Bounty board — demand gaps with boosted rates |
| `dashboard/local-network/admin-review-fable.html` | Chekin admin: claim queue, flags, quality watch (Admin persona) |

These are prototypes (HTML/CSS/JS), not production code — recreate in the product
stack; match the visual output, not the internal structure.
