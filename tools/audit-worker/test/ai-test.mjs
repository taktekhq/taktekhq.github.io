// node test/ai-test.mjs : logic tests for the AI check with mocked model APIs (no keys needed).
import assert from "node:assert/strict";
import { mentions, extractNames, cleanInput, runAiCheck, pickFixes } from "../src/ai.js";

assert.ok(mentions("Try **Barbar Restaurant** in Hamra", "Barbar"));
assert.ok(mentions("1. Café Younes – great coffee", "Cafe Younes"));
assert.ok(mentions("I recommend Smile Dental Clinic Beirut", "Smile Dental Clinic"));
assert.ok(!mentions("Smile is common", "Smile Dental Clinic"));
assert.ok(!mentions("Kahwet Leila is lovely", "Leila Bakery Aley"));
assert.deepEqual(extractNames("Here are some:\n1. **Kahwet Leila** – cozy\n2. Barbar: open late\n- Abu Elie (Jounieh)\nNote: hours vary"), ["Kahwet Leila", "Barbar", "Abu Elie"]);
assert.equal(cleanInput({ name: "x", city: "Aley", category: "dentist" }), null);
assert.equal(cleanInput({ name: "Smile <b>", city: "Aley", category: "dentist", website: "http://10.0.0.1" }).website, "");
assert.deepEqual(pickFixes({ audit: null, website: "", mentionedBest: false, known: false }), ["website", "gbp", "directories"]);

const fake = async (url, init) => {
  const body = JSON.parse(init.body);
  if (url.includes("googleapis")) {
    const p = body.contents[0].parts[0].text;
    const t = p.startsWith("What do you know") ? "I don't have specific information about Smile Dental in Aley." : "1. **Aley Dental Center** – modern\n2. **Dr. Haddad Clinic** – friendly\n3. Smile Dental – good reviews";
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] }));
  }
  if (url.includes("anthropic")) {
    assert.equal(body.model, "claude-haiku-5-5");
    return new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: "- **Aley Dental Center**\n- **Mountain Smiles**" }] }));
  }
  return new Response("<html><head><title>x</title></head><body>hi</body></html>");
};
const r = await runAiCheck(cleanInput({ name: "Smile Dental", city: "Aley", category: "dentists" }), { GEMINI_API_KEY: "k", ANTHROPIC_API_KEY: "k" }, { fetchImpl: fake, country: "LB" });
assert.equal(r.ok, true);
assert.equal(r.answers.length, 6);
assert.equal(r.summary.asked, 4);
assert.equal(r.summary.recommended, 2);
assert.equal(r.summary.known, false); // neither "know" answer shows knowledge
assert.equal(r.competitors[0].name, "Aley Dental Center");
assert.equal(r.competitors[0].n, 4);
assert.equal(r.fixes.length, 3);
const none = await runAiCheck(cleanInput({ name: "Smile Dental", city: "Aley", category: "dentists" }), {}, { fetchImpl: fake });
assert.equal(none.error, "no_models");
console.log("ai tests ok", JSON.stringify({ summary: r.summary, fixes: r.fixes, competitors: r.competitors }));
