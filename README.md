# OpenNEXT Native AI Capacity Market — Demo MVP

OpenNEXT 是面向 AI 容量的价格发现、RFQ、验证、分配、交割与结算基础设施。这个版本将产品重心从“统一 API / 智能路由”调整为真实市场已经验证的需求：**找到便宜、稳定、马上可用且来源清晰的原厂 AI Capacity**。

![OpenNEXT Native Capacity Market](docs/screenshots/overview.png)

## Phase 1 核心

- 首页是双边流量入口：买方可直接描述需求并发布 Native RFQ，供应方可验证容量并响应需求。
- Model Capacity 默认采用 provenance-first 展示，价格之前先显示供应来源与买方实际获得内容。
- RFQ 是首发成交机制：结构化需求 → KYB / 来源验证 → 容量测试 → 标准化报价 → 比较与分配 → 履约记录 → 结算。
- Private OTC 是独立风险通道，不进入公开库存或 Native benchmark。
- GPU Capacity 保留为第二市场，标准卡时与长期集群 RFQ 使用独立的履约逻辑。

### Supply provenance

| 产品形态 | 买方实际获得 | OpenNEXT 角色 | 产品地位 |
|---|---|---|---|
| Native Direct | 原厂项目、账户或直接访问 | 来源验证、撮合、RFQ、结算 | 核心 |
| Native Allocated | 企业协议下隔离的原厂配额 | 容量验证、分配与履约记录 | 核心 |
| Enterprise Partner | 经验证合作方交付的企业配额 | 合作关系与交付条件验证 | 核心补充 |
| Managed Gateway | OpenNEXT 托管 endpoint / key | 可选托管交付、计量与结算 | 可选 |
| Hosted Inference | Provider endpoint | 开放或兼容模型的补充市场 | 补充 |

Native 不等于公开出售裸 Key。Demo 强调合同与授权证据、容量测试、交付边界、期限、速率、区域、SLA 和撤销条件；秘密凭证不会出现在商品页或报价中。

## 可选能力：Capacity Optimizer · Labs

AI 智能调度作为 Phase 1 的锦上添花保留在 Product Labs。它在已经采购或接入的容量上：

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

1. 首页输入 Claude / GPT 原厂容量需求，说明首页已成为获客和需求捕获入口。
2. 打开 Native Capacity，展示 Native Direct、Native Allocated、Enterprise Partner、Managed Gateway 与 Hosted Inference 的清晰区分。
3. 查看 Supply Provenance Passport，解释买方拿到什么、OpenNEXT 验证什么，以及哪些交易有指数资格。
4. 进入 Native RFQ Market，展示结构化需求、Demand Tape、标准化报价比较、分配和结算链路。
5. 打开 Private OTC，强调大额非标准需求与公开 Native 市场严格隔离。
6. 最后进入 Capacity Optimizer · Labs，作为可选技术能力演示任务拆解与“模型 + 芯片”调度。

## 数据与合规边界

本仓库是产品 Demo，不是生产交易系统。

- 所有行情、供应商、库存、SLA、RFQ、报价、指数和执行结果均为 **synthetic / illustrative demo data**。
- 不包含、不接收、不展示也不交易任何真实 API Key、账户凭证或秘密材料。
- `OpenNEXT Verified` 仅表示示例中的证据审查与容量测试状态，不代表原模型厂商背书。
- Native、Managed Gateway 与 Hosted Inference 不混标；Private OTC 不进入公开库存或 Native benchmark。
- 闭源模型未披露底层硬件时统一显示 `Provider-managed / hardware undisclosed`。
- 真实上线需要完成供应权利、法律结构、支付托管、KYB、数据保护和各厂商政策审核。

## 当前范围

该 Demo 包含：流量首页、Native Model Capacity、Supply Provenance Passport、Native RFQ、匿名 Demand Tape、报价比较、Private OTC、GPU Capacity、Market Data，以及可选的 Capacity Optimizer。

浏览器验收结果见 [`docs/qa-report.json`](docs/qa-report.json)。
