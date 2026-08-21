import "./procurement-workflows.js";
import "./procurement-interactions.js";
import { navigateProcurement } from "./procurement-router.js";

await import("./release.js");

const requested = location.hash.slice(1);
navigateProcurement(requested && requested !== "overview" ? requested : "models", { scroll: false });
console.info("OpenNEXT procurement MVP ready");