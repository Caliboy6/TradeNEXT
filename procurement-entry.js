import "./procurement-workflows.js?v=opennext-20260912-2";
import "./procurement-interactions.js?v=opennext-20260912-2";
import { navigateProcurement } from "./procurement-router.js?v=opennext-20260912-2";

await import("./release.js?v=opennext-20260912-2");

const requested = location.hash.slice(1);
navigateProcurement(requested && requested !== "overview" ? requested : "models", { scroll: false });
console.info("OpenNEXT procurement MVP ready");