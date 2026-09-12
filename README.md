# OpenNEXT — Public site & procurement demo

## September 2026 UI update

The public site and procurement workspace now have separate entry points with the approved monochrome OpenNEXT identity, editorial typography, engineering illustrations and fine-rule tables.

- `/` or `#home`: full public landing page, model / GPU rental / physical hardware listing previews, buyer and supplier paths.
- `#login`: account/password, email-code, Google, GitHub, Lark and wallet sign-in demonstrations with an explicit policy checkbox.
- `#signup`: demo organization registration.
- `#models`, `#gpus`, `#rfq`, `#supply`, `#data`, `#docs`, `#scheduler`: existing procurement workspace after demo sign-in.
- A protected deep link returns to the requested market after sign-in. Sign-out clears the tab session and agent conversation. This release defaults to English and hides language switching, including for returning visitors.
- The landing page includes a pausable GPU price ticker. Values and changes match the supplied design reference and are explicitly demo prices, not a live feed.
- Workspace navigation lives in the top bar. The collapsible Master Agent panel uses the synthetic GPU catalog for sourcing, quote estimates and a prefilled RFQ handoff; a user must submit the RFQ explicitly.
- Saved offers, quote cart, comparison, supplier review, physical hardware, RFQ workflows, messages, ratings and scheduler simulations remain available.

### Demo authentication

GitHub Pages serves static files. Authentication is a **demonstration only**, using a tab-scoped session that expires after eight hours. Any sample account/password works; password values are never stored or transmitted. The email-code flow uses `123456`; no email is sent. Third-party and wallet buttons open a demo confirmation without connecting accounts or requesting signatures. Every entry requires the demo policy checkbox. Do not enter real credentials or confidential data. Production sign-in requires a backend identity provider, server-side sessions and route/API authorization.

### Run and validate

```sh
npm start
npm run build
npm run check
npm test
```

Open `http://127.0.0.1:4173`. The optional `docs/responsive-preview.html` harness renders the same application at mobile and tablet widths.

The full landing page is prerendered into `index.html` by `npm run build`. Rebuild after editing public-page content or module URLs. Public navigation and demo sign-in initialize before the procurement modules; workspace startup failures show a retry/home choice instead of leaving the website on a loading placeholder. Module preloads remove the sequential network request chain during a fresh visit.

The public deployment uses the `gh-pages` branch. Both `main` and `gh-pages` contain the current source. This redesign preserves the existing model, rental and physical GPU procurement features.

---

OpenNEXT 是面向 AI 容量的价格发现、RFQ、验证、分配、交割与结算基础设施。这个版本将产品重心从“统一 API / 智能路由”调整为真实市场已经验证的需求：**找到便宜、稳定、马上可用且来源清晰的原厂 AI Capacity**。

![OpenNEXT Native Capacity Market](docs/screenshots/overview.png)

## Phase 1 核心

- 登录后的工作台默认是 Native Market 采购看板，集中展示大量合格供应信号、价格基准、可用配额、有效期和交付方式。`Post RFQ` 是全局唯一主按钮。
- Model Capacity 默认采用 provenance-first 展示，价格之前先显示供应来源与买方实际获得内容。
- RFQ 是首发成交机制。全局入口先选择 Native Model Capacity、GPU Capacity、Hosted Inference 或 Private OTC，再进入各自字段与风险通道。
- Private OTC 是独立风险通道，不进入公开库存或 Native benchmark。
- 供应商与买家采用已完成交易后的 5 分制双向评价：沟通态度、交付速度、使用质量与售后支持；只有结算完成且使用期结束后才开放，评价在双方提交或 14 天窗口结束前保持隐藏。
- GPU Market 含 10 类芯片、36 条需求加权合成挂单：H100/H200 密度最高，B200 次之，其他成熟与新旗舰芯片均保持多供应商可发现性。

### Supply provenance

| 产品形态 | 买方实际获得 | OpenNEXT 角色 | 产品地位 |
|---|---|---|---|
| Native Direct | 原厂项目、账户或直接访问 | 来源验证、撮合、RFQ、结算 | 核心 |
| Native Allocated | 企业协议下隔离的原厂配额 | 容量验证、分配与履约记录 | 核心 |
| Enterprise Partner | 经验证合作方交付的企业配额 | 合作关系与交付条件验证 | 核心补充 |
| Managed Gateway | OpenNEXT 托管 endpoint / key | 可选托管交付、计量与结算 | 可选 |
| Hosted Inference | Provider endpoint | 开放或兼容模型的补充市场 | 补充 |

Native 不等于公开出售裸 Key。Demo 强调合同与授权证据、容量测试、交付边界、期限、速率、区域、SLA 和撤销条件；秘密凭证不会出现在商品页或报价中。

## 可选能力：Capacity Optimizer

AI 智能调度作为 Phase 1 的锦上添花保留在 More 菜单。它在已经采购或接入的容量上：

- 将复杂任务拆成带依赖关系的子任务；
- 为每一步比较模型、交付路线、成本、质量、延迟和可用容量；
- 对开放 / 自托管模型展示已披露的 H100、H200、B200、L40S 或 Cerebras 路线；
- 对 Claude、GPT、Gemini 等闭源模型坚持显示 `Provider-managed / hardware undisclosed`，不虚构底层芯片；
- 演示人工覆盖、故障切换、Plan vs Actual 和脱敏 Trace 回执。

该能力标记为 Optional Preview / Simulation，不是首页采购入口，也不会默认接管生产流量。

![OpenNEXT Capacity Optimizer](docs/screenshots/orchestrator-receipt.png)

## 快速启动

要求 Node.js 18 或更高版本，不需要安装第三方依赖。

```bash
npm start
```

然后打开 `http://127.0.0.1:4173`。

检查所有 JavaScript 模块：

```bash
npm run check
```

## 推荐 Demo 路线

1. 从公开 Landing Page 进入登录页，点击演示入口后打开模型容量市场，展示多模型、多供应商供应信号与 Demand Tape。
2. 打开任意 Provenance Passport，区分上游授权转售、企业配额、合作方交付与技术验证第三方交付。
3. 点击全局 `Post RFQ`，依次展示 Native Model、GPU、Hosted Inference 与 Private OTC 四种交易类型。
4. 进入 My RFQs，比较标准化报价，并展示价格、容量、期限、交付方式与履约记录的沉淀链路。
5. 进入 GPU Market，展示需求评级控制挂单密度，以及 Instant Reserve、Request Quote、Private Cluster RFQ、Managed Slot Inquiry 四种动作。
6. 最后从 More 打开 Capacity Optimizer，作为可选能力演示任务拆解与“模型 + 芯片”调度。

## 数据与合规边界

本仓库是产品 Demo，不是生产交易系统。

- 所有行情、供应商、库存、SLA、RFQ、报价、指数和执行结果均为 **synthetic / illustrative demo data**。
- 不包含、不接收、不展示也不交易任何真实 API Key、账户凭证或秘密材料。
- 页面不使用笼统的 `OpenNEXT Verified` 代替授权判断；来源档案分别记录授权类别、已审核证据与技术测试，且不代表原模型厂商背书。
- Native、Managed Gateway 与 Hosted Inference 不混标；Private OTC 不进入公开库存或 Native benchmark。
- 闭源模型未披露底层硬件时统一显示 `Provider-managed / hardware undisclosed`。
- 真实上线需要完成供应权利、法律结构、支付托管、KYB、数据保护和各厂商政策审核。

## 当前范围

该 Demo 包含：Native Market 采购看板、统一四类型 RFQ、My RFQs、供应方响应工作区、Supply Provenance Passport、匿名 Demand Tape、需求加权 GPU Market、Market Data，以及可选的 Capacity Optimizer。

运行 `npm run check` 可验证当前全部 JavaScript 模块。浏览器端行情与成交均为合成演示。
