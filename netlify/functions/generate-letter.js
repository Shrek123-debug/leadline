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

  const { resultLabel, resultHeadline, target, tenure, kids, pregnant, address, verifiedFacts } = body;

  const system = `You draft short, firm, respectful advocacy letters for Chicago residents about lead in their tap water.
RULES:
- Use ONLY the verified facts provided below. Do not invent statistics, laws, program names, or deadlines.
- Do not give medical advice or diagnoses. It is fine to note that lead exposure is a health concern, especially for young children and pregnant people.
- Keep it to roughly 180-260 words. Plain language, one clear ask, a firm but civil tone.
- If writing to a landlord: request testing and, if lead is found, replacement, and reference their responsibility for the building's plumbing.
- If writing to an alderman: request help accessing the city's testing/replacement programs and faster action in the neighborhood.
- End with a signature line as [Your name] / [Address] / [Date]. Output only the letter text, nothing else.

VERIFIED FACTS:
${verifiedFacts}`;

  const situation = [
    `Water service line result: ${resultLabel} (${resultHeadline})`,
    `Recipient: ${target === "landlord" ? "the resident's landlord/property manager" : "the resident's alderman (city council member)"}`,
    `The resident ${tenure === "rent" ? "RENTS" : "OWNS"} their home.`,
    kids ? "There are young children in the home." : "",
    pregnant ? "Someone in the home is pregnant." : "",
    `Address searched: ${address || "(Chicago address)"}`,
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter: text }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
