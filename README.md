# OpenNEXT · AI capacity procurement demo

A public website and a separate, signed-in procurement workspace with a shared monochrome identity, editorial typography, engineering illustrations and precise market tables.

## Public website

- Full, prerendered landing page with distinct chapter sections and gradual tonal transitions.
- GPU price ticker and two engineering illustrations with independently pausable capacity-flow animations. Reduced-motion preferences are respected.
- Account, email-code, Google, GitHub, Lark and wallet sign-in demonstrations, with an explicit demo-policy checkbox.
- All interface copy is English, including validation messages, legacy workflows and returning users' preferences.

## Navigation

Primary: **Models / GPUs / Market Data / My OpenNEXT / More**. The workspace does not expose a return-to-homepage link. The collapsible AI Agent remains on the left, with a drawer on mobile.

My OpenNEXT contains:

| Page | Demo features |
| --- | --- |
| Profile | Running GPUs, remaining capacity, upcoming expirations, recent purchases and next actions |
| My Tokens | Expandable allocations, per-model usage, input/output details, remaining entitlement, weighted acquisition price and reminders |
| My GPUs | Reservation status, elapsed and remaining time, expiration, renewal reminders and reviewed extensions |
| My Supplies | Supplier review, supply publication and responses to buyer requirements |
| My RFQs | Saved new requirements, quote comparison and the sample procurement workflow |
| Messages | Counterparty threads and local demo replies |
| Billing | Transactions, monthly statements, invoice previews, unsigned contract samples and exports |
| Account | Demo security controls, connected methods, sample access history, preferences and API/SSH key previews |

## Demonstration paths

1. Open the landing page and use **Explore capacity**. Accept the demo policy checkbox, then choose **Explore demo workspace**; no credentials are needed.
2. Open **My OpenNEXT → My Tokens** and expand a model family to inspect usage, entitlement and acquisition rates. Change a reminder preference.
3. Open **My GPUs → Extend term**, review the cost and confirm the demo extension. Check the updated expiry and matching transaction in **Billing**.
4. Reserve available inventory in **GPUs**. The receipt links to the new scheduled reservation in **My GPUs**.
5. Submit an RFQ from the AI Agent or the global **Post RFQ** entry. The new record appears in **My RFQs** and survives a reload of the tab.
6. Use the seeded Claude request to compare a quote, review evidence, confirm an explicit sample token bundle and view it in **My Tokens**. Token counts are never inferred from the request's API-equivalent budget.
7. Preview an invoice, download a CSV or unsigned terms, review access history and save account preferences. No supplier message, credential, payment or legal document is sent externally.

## Run and validate

Requires Node.js 18 or newer. No third-party dependencies are required.

```sh
npm start
npm run build
npm run check
npm test
```

Open `http://127.0.0.1:4173`. `docs/responsive-preview.html` renders the application at mobile, tablet and desktop widths.

`npm run build` prerenders the complete homepage into `index.html` and generates module preloads. Rebuild after changing public content or module URLs. The public shell initializes before procurement modules; startup failures offer a connection retry and a return to sign-in.

## Storage, authentication and commercial boundaries

GitHub Pages serves a static demonstration. The eight-hour tab session is a UI gate, not production authentication or authorization. Passwords are not stored or transmitted. The email-code sample uses `123456`; no email is sent. Provider and wallet buttons do not connect external accounts or request signatures.

RFQs and messages are tab-scoped. Capacity, reminder and account preferences are saved in local browser storage, with an in-memory fallback when storage is unavailable. Data is synthetic and generic. The security controls do not grant real access. Documents are clearly marked demo or unsigned; invoice previews are not tax invoices. The ledger illustrates transactions and does not hold funds.

Model procurement distinguishes **Native Direct**, **Native Allocated**, **Enterprise Partner**, optional **Managed Gateway**, and **Hosted Inference**. Private OTC remains a separate review path and is excluded from public inventory and Native benchmarks. Technical testing does not establish resale authorization. Undisclosed closed-model hardware remains labelled as provider-managed.

The optional **Capacity Optimizer** in More demonstrates task planning, routing and fallback using purchased capacity. It does not handle production traffic.

Both `main` and `gh-pages` hold the deployed source. See [console design notes](docs/console-design-notes.md) for references and design decisions.
