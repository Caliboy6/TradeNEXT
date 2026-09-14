# OpenDesk update

## Scope

- My OpenNEXT is the primary navigation entry. Successful sign-in opens My OpenDesk, before Profile. Legacy market routes remain available for existing procurement links, but are removed from the primary navigation.
- OpenDesk uses a line chart for indicative compute indices. Recent matches are scenario events, not executable bids or an order book.
- The agent sits on the right. Workspace appearance is switchable between paper and dark graphite/green-gray, without changing the public site's brand.
- No external accounts, funds, suppliers or infrastructure are contacted. Activity records are deterministic simulation steps, not internal model reasoning.
- The sourcing fee is $500, credited once against a completed order; it is not refunded if no order is placed. Optional one-month escrow is 50% of the monthly budget. Terms longer than six months use the first month plus 10% of the full budget. Two-to-six-month escrow terms are left for a separate agreement.

## Pending original GCI source

The requested Claude design URL was not readable in this environment. Its contents have not been reconstructed or substituted. The intended integration point is between the Landing procurement process and the buyer/supplier section, with a locally hosted, responsive HTML panel titled **OpenNEXT GCI Index Factory**, and **System Architecture** / **End-to-End Workflow** views matching the public typography and border system. Integration needs the original `Price Index Factory.dc.html` upload.

## Verification

Run `npm test`, `npm run check`, and `npm run build`. Test the public sign-in, theme toggle, GPU/region/timeframe selectors, missing-parameter collection, RFQ review, guardrail states, separate fee/escrow consent, supplier rejection reasons, payment simulation, and the resulting reservation. The $500 credit and escrow must not be charged again at final checkout.
