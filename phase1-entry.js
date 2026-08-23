import "./phase1-interactions.js";
import { navigatePhase } from "./phase1-router.js";

await import("./release.js");
navigatePhase(location.hash.slice(1) || "overview", { keepHash: true, keepScroll: true, instant: true });

console.info("OpenNEXT Native Capacity RFQ MVP ready");
