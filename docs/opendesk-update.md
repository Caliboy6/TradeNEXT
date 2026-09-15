# OpenDesk update

## Scope

- My OpenNEXT is the primary navigation entry. Successful sign-in opens My OpenDesk, before Profile. Legacy market routes remain available for existing procurement links, but are removed from the primary navigation.
- OpenDesk uses a line chart for indicative compute indices. Recent matches are scenario events, not executable bids or an order book.
- The agent sits on the right. Workspace appearance is switchable between paper and dark graphite/green-gray, without changing the public site's brand.
- No external accounts, funds, suppliers or infrastructure are contacted. Activity records are deterministic simulation steps, not internal model reasoning.
- The sourcing fee is $500, credited once against a completed order; it is not refunded if no order is placed. Optional one-month escrow is 50% of the monthly budget. Terms longer than six months use the first month plus 10% of the full budget. Two-to-six-month escrow terms are left for a separate agreement.

## GCI Index Factory

The original `OpenNEXT Index Factory.html` supplied on 2026-09-15 is embedded directly as its original continuous 1920 × 1080 composition. All eight stations remain on the same factory floor; the conveyor, tracked lot, duplicate-case escalation, shared-memory feedback, camera movement, opening title, release overlay and original playback controls are preserved. The standalone `gci-index-factory.html` is the same self-contained uploaded bundle, with only background/text colors and page metadata changed.

The scene uses Landing Page white/paper backgrounds and ink/muted text. Original accent graphics, fonts, geometry, timings and loop configuration remain intact. `scripts/theme-gci.mjs` applies the explicit palette-only transformations to the uploaded file; source-fidelity tests protect the original composition and bundled dependencies. Values inside the original animation remain scripted examples, not a live index feed.

## Verification

Run `npm test`, `npm run check`, and `npm run build`. Test the public sign-in, theme toggle, GPU/region/timeframe selectors, missing-parameter collection, RFQ review, guardrail states, separate fee/escrow consent, supplier rejection reasons, payment simulation, and the resulting reservation. The $500 credit and escrow must not be charged again at final checkout.

Browser acceptance on 2026-09-14 verified the default OpenDesk route, light/dark appearance, GPU/region/period chart selectors, all intake and approval stages, three supplier outcomes, a confirmed $198,000 reservation, and synchronization to My GPUs and Billing. With optional $105,000 escrow and a $500 fee credit, final checkout is $92,500. Externally settled Agent purchases leave workspace credit unchanged. The 390px and 768px layouts have no page-level horizontal overflow; the right-hand Agent opens and closes on mobile.

The final artwork uses native SVG `animateMotion` / `mpath` to avoid CSS motion-path offsets under SVG scaling. All 14 Landing packets move on their visible routes; the login artwork has six packets. A pause control hides moving packets, and reduced-motion preferences suppress the animation.
