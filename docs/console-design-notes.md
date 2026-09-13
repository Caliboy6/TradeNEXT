# OpenNEXT console update · September 2026

The public site remains independent from the signed-in procurement workspace. The existing serif headings, fine rules, restrained palette and engineering drawings form the shared design system.

## Reference patterns

- [SF Compute](https://sfcompute.com/): one clear commercial narrative per section, generous spacing and product visuals.
- [Linear](https://linear.app/): progressive product storytelling and calm transitions between sections.
- [Runpod billing](https://docs.runpod.io/accounts-billing/billing): balances, transaction history and configurable notifications; notifications remain distinct from automatic payments.
- [Lambda console](https://docs.lambda.ai/public-cloud/console/): resource lifecycle, explicit state and configuration, with review before consequential operations.
- [Lambda access and security](https://docs.lambda.ai/public-cloud/access-security/): workspace access, credentials, resource permissions and activity records as distinct concerns.

These references inform information hierarchy and interaction patterns; OpenNEXT uses its own layouts and commercial model. All prices, identities, usage and transactions in the demo are synthetic.

## Navigation

Primary: Models / GPUs / Market Data / My OpenNEXT / More.

My OpenNEXT: Profile / My Tokens / My GPUs / My Supplies / My RFQs / Messages / Billing / Account.

Billing: Transactions / Statements / Invoices / Contracts. Account: Security / Access history / Settings.

The workspace brand does not link back to the public homepage. The AI sourcing panel remains available on the left and collapses into a drawer on smaller screens.

## Data and interaction boundaries

Token usage is shown per model and allocation, with remaining entitlement and explicit input/output rates. GPU time distinguishes elapsed wall-clock duration from purchased GPU-hours. Reminder switches do not authorize charges or renewals.

New requests are saved in the demo session. Completed sample purchases appear in the owned-resource views. Invoice and contract previews are illustrative records. Credential and MFA controls demonstrate a workflow without granting real access. Third-party sign-in is still a demo flow, and the GitHub Pages application is not a production authentication boundary.

The public artwork uses lightweight vector flow overlays over the existing drawings. Motion can be paused and respects reduced-motion preferences. The homepage remains prerendered so its initial display does not depend on workspace modules loading.
