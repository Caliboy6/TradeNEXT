import { state, presets, generatePlan } from "./demo-core.js?v=opennext-20260912-5";

Object.assign(presets.support, {
  label: "客服分析",
  text: "处理 2 万条客服记录：先进行隐私脱敏与语言识别，再完成主题分类、情绪识别和高风险投诉检测，最后生成中英双语管理层报告，并对关键结论做事实校验。",
});
Object.assign(presets.research, {
  label: "行业研究",
  text: "研究全球 AI 推理容量市场：检索近期资料，提取各地区 GPU 与模型容量价格，识别供需变化，计算趋势并生成带证据引用的投资委员会报告。",
});
Object.assign(presets.software, {
  label: "代码迁移",
  text: "分析大型 Python 服务，生成依赖图，识别安全风险，将核心模块迁移到 TypeScript，运行测试并输出逐模块审查报告与上线计划。",
});
Object.assign(presets.multimodal, {
  label: "多模态审核",
  text: "批量处理 5,000 条包含图片、语音和文本的商品内容，完成内容安全分类、OCR、语音转写、重复检测和高风险复核，并输出可审计结果。",
});

state.scheduler.text = presets.support.text;
state.scheduler.plan = null;
generatePlan();
await import("./demo-actions.js?v=opennext-20260912-5");
console.info("OpenNEXT standalone interactions ready");
