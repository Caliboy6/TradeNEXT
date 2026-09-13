import "./phase1-interactions.js?v=opennext-20260913-1";
import { navigatePhase } from "./phase1-router.js?v=opennext-20260913-1";

await import("./release.js?v=opennext-20260913-1");
navigatePhase(location.hash.slice(1) || "overview", { keepHash: true, keepScroll: true, instant: true });

console.info("OpenNEXT Native Capacity RFQ MVP ready");
