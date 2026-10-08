import { runAudit } from "../src/run.js";
for (const s of process.argv.slice(2)) {
  const t = Date.now();
  const r = await runAudit(s);
  console.log(s, Date.now() - t + "ms", r.error || `score ${r.score} http ${r.httpStatus}${r.blocked ? " (robots-blocked)" : ""}${r.botWall ? " (bot wall?)" : ""}`);
  if (!r.error) console.log("  " + r.checks.map(c => `${c.id}:${c.status[0]}`).join(" ") + "  fixes: " + r.fixes.join(","));
}
