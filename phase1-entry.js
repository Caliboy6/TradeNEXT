import "./phase1-interactions.js?v=opennext-20260912-5";
import { navigatePhase } from "./phase1-router.js?v=opennext-20260912-5";

await import("./release.js?v=opennext-20260912-5");
navigatePhase(location.hash.slice(1) || "overview", { keepHash: true, keepScroll: true, instant: true });

console.info("OpenNEXT Native Capacity RFQ MVP ready");
