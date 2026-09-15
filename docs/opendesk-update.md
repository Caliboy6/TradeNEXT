# OpenDesk update

## Scope

- My OpenNEXT is the primary navigation entry. Successful sign-in opens My OpenDesk, before Profile. Legacy market routes remain available for existing procurement links, but are removed from the primary navigation.
- OpenDesk uses a line chart for indicative compute indices. Recent matches are scenario events, not executable bids or an order book.
- The agent sits on the right. Workspace appearance is switchable between paper and dark graphite/green-gray, without changing the public site's brand.
- No external accounts, funds, suppliers or infrastructure are contacted. Activity records are deterministic simulation steps, not internal model reasoning.
- The sourcing fee is $500, credited once against a completed order; it is not refunded if no order is placed. Optional one-month escrow is 50% of the monthly budget. Terms longer than six months use the first month plus 10% of the full budget. Two-to-six-month escrow terms are left for a separate agreement.

## GCI Index Factory

The original `OpenNEXT Index Factory.html` was supplied on 2026-09-15. The authored factory composition has been adapted into native HTML, CSS and SVG with **System Architecture** / **End-to-End Workflow** views, between the Landing procurement process and the buyer/supplier section. `gci-index-factory.html` offers a standalone view of the same component.

The presentation preserves the master orchestrator, shared SLM, eight processing stages, duplicate rejection, evidence ledger, dual human sign-off and reviewed-lesson feedback. The displayed price, venue/quote counts and cadence are illustrative values from the supplied animation, not a live index feed. The original spec-alias example is expressed as reviewed spec handling; HBM3 and HBM3e are not treated as interchangeable. The upload's editor, bundler, React/Babel and cross-frame host controls are not included in the public application.

## Verification

Run `npm test`, `npm run check`, and `npm run build`. Test the public sign-in, theme toggle, GPU/region/timeframe selectors, missing-parameter collection, RFQ review, guardrail states, separate fee/escrow consent, supplier rejection reasons, payment simulation, and the resulting reservation. The $500 credit and escrow must not be charged again at final checkout.

Browser acceptance on 2026-09-14 verified the default OpenDesk route, light/dark appearance, GPU/region/period chart selectors, all intake and approval stages, three supplier outcomes, a confirmed $198,000 reservation, and synchronization to My GPUs and Billing. With optional $105,000 escrow and a $500 fee credit, final checkout is $92,500. Externally settled Agent purchases leave workspace credit unchanged. The 390px and 768px layouts have no page-level horizontal overflow; the right-hand Agent opens and closes on mobile.

The final artwork uses native SVG `animateMotion` / `mpath` to avoid CSS motion-path offsets under SVG scaling. All 14 Landing packets move on their visible routes; the login artwork has six packets. A pause control hides moving packets, and reduced-motion preferences suppress the animation.
