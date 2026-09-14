// Netlify Function: generate-letter
// ------------------------------------------------------------------
// Holds ANTHROPIC_API_KEY server-side (set it in Netlify's site env vars,
// never commit it) and drafts the advocacy letter. The model is instructed
// to use ONLY the verified facts we pass in, never invent statistics,
// programs, or medical claims.

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { resultLabel, resultHeadline, target, tenure, kids, pregnant, address, verifiedFacts, language, stage, extra } = body;
  const outputLanguage = language === "Spanish" ? "Spanish" : "English";
  const isEscalation = stage === "escalation";

  const recipientDescriptions = {
    landlord: "the resident's landlord/property manager",
    alderman: "the resident's alderman (city council member)",
    complaint: "a formal complaint record to file with the City of Chicago's 311 service (not a named individual)",
  };
  const recipient = recipientDescriptions[target] || recipientDescriptions.landlord;

  const system = `You draft short, firm, respectful advocacy letters for Chicago residents about lead in their tap water.
RULES:
- Write the ENTIRE letter in ${outputLanguage}, including the signature line labels.
- Use ONLY the verified facts provided below. Do not invent statistics, laws, program names, or deadlines.
- Do not give medical advice or diagnoses. It is fine to note that lead exposure is a health concern, especially for young children and pregnant people.
- Keep it to roughly 180-260 words. Plain language, one clear ask, a firm but civil tone.
- If writing to a landlord: request testing and, if lead is found, replacement, and reference their responsibility for the building's plumbing.
- If writing to an alderman: request help accessing the city's testing/replacement programs and faster action in the neighborhood.
- If this is a 311 complaint record rather than a letter to a person: skip a "Dear ___" salutation, write it as a clear factual complaint report (what's happening, at what address, what's being requested), and still close with the resident's contact info as a signature block.
${isEscalation ? `- This is a FOLLOW-UP. An earlier request was already sent about two weeks ago and has NOT received a response. Say so plainly and firmly, without inventing specifics about what happened — only use what's in the resident's own note below, if anything. The tone should be noticeably firmer and more urgent than a first request, while staying respectful and factual.
- The resident's own note (if provided) may be written in English or Spanish regardless of the requested output language. Read it for meaning and incorporate it into the ${outputLanguage} letter naturally — never quote it in a different language than the rest of the letter.
- After the letter, on a new line, add exactly one short sentence recommending what the resident should do if THIS attempt also gets no response — e.g. escalating further, involving a tenant rights organization, or a formal 311 complaint. Base it only on the verified facts and the situation given, not invented specifics. The sentence content should be in ${outputLanguage}, but it MUST start with the literal marker text "NEXT STEP:" exactly as written here, in English, even when the rest of the letter is in Spanish — this marker is parsed by code, not read by the resident.` : ""}
- End with a signature line (translated into ${outputLanguage} if not English) as [Your name] / [Address] / [Date]. Output only the letter text${isEscalation ? " (plus the one NEXT STEP line described above)" : ""}, nothing else.

VERIFIED FACTS:
${verifiedFacts}`;

  const situation = [
    `Water service line result: ${resultLabel} (${resultHeadline})`,
    `Recipient: ${recipient}`,
    `The resident ${tenure === "rent" ? "RENTS" : "OWNS"} their home.`,
    kids ? "There are young children in the home." : "",
    pregnant ? "Someone in the home is pregnant." : "",
    `Address searched: ${address || "(Chicago address)"}`,
    isEscalation ? "This is a follow-up after roughly two weeks of no response to an earlier request." : "",
    extra ? `Resident's own note about what's happened since: ${extra}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: `Write the letter for this situation:\n${situation}` }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "Upstream error" }) };
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) {
      return { statusCode: 502, body: JSON.stringify({ error: "Empty response" }) };
    }

    // Pull the "NEXT STEP:" line (English or Spanish label) out of the
    // letter body so the UI can show it as a separate callout.
    let letterText = text;
    let suggestion = "";
    const nextStepMatch = text.match(/\n?(NEXT STEP:.*)$/is);
    if (nextStepMatch) {
      suggestion = nextStepMatch[1].replace(/^NEXT STEP:\s*/i, "").trim();
      letterText = text.slice(0, nextStepMatch.index).trim();
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter: letterText, suggestion }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
