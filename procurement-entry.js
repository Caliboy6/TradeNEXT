import "./procurement-workflows.js?v=opennext-20260912-6";
import "./procurement-interactions.js?v=opennext-20260912-6";
import { navigateProcurement } from "./procurement-router.js?v=opennext-20260912-6";

await import("./release.js?v=opennext-20260912-6");

const requested = location.hash.slice(1);
navigateProcurement(requested && requested !== "overview" ? requested : "models", { scroll: false });
console.info("OpenNEXT procurement MVP ready");