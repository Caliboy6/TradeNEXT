import "./procurement-workflows.js?v=opennext-20260912-7";
import "./procurement-interactions.js?v=opennext-20260912-7";
import { navigateProcurement } from "./procurement-router.js?v=opennext-20260912-7";

await import("./release.js?v=opennext-20260912-7");

const requested = location.hash.slice(1);
navigateProcurement(requested && requested !== "overview" ? requested : "models", { scroll: false });
console.info("OpenNEXT procurement MVP ready");