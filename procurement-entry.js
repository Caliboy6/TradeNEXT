import "./procurement-workflows.js?v=opennext-20260917-english-only-1";
import "./procurement-interactions.js?v=opennext-20260914-desk-1";
import { navigateProcurement } from "./procurement-router.js?v=opennext-20260914-desk-1";

await import("./release.js?v=opennext-20260914-desk-1");

const requested = location.hash.slice(1);
navigateProcurement(requested && requested !== "overview" ? requested : "models", { scroll: false });
console.info("OpenNEXT procurement MVP ready");