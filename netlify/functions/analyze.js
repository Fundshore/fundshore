exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { income, expenses, debts, score, surplus, savingsRate, totalDebt, totalInterest } = data;

    // Build a clear financial picture for Claude
    const expenseLines = Object.entries(expenses)
      .filter(([_, v]) => v > 0)
      .map(([cat, val]) => `${cat}: $${val}/mo (${((val / income) * 100).toFixed(1)}%)`)
      .join("\n");

    const debtLines = debts.length > 0
      ? debts.map(d => `${d.name}: $${d.bal} balance at ${d.apr}% APR`).join("\n")
      : "No debts.";

    const prompt = `You are a warm, direct financial advisor at Fundshore. The user just completed a Financial X-Ray. Analyze their situation and give personalized advice.

RULES:
- Write 6-10 sentences max. Be specific with dollar amounts and timelines.
- Start with their biggest strength, then address the biggest risk.
- Give 2-3 concrete action steps with exact numbers.
- Never recommend interest-based investment products (no index funds, bonds, or anything with interest/returns). Instead suggest: building a side business, acquiring productive assets, learning high-value skills, or building equity in a venture.
- Tone: like a smart friend who happens to be a financial expert. Not formal, not preachy.
- End with one encouraging sentence.
- Do NOT use markdown formatting, bullet points, or headers. Just plain conversational paragraphs.

USER DATA:
Monthly income (after tax): $${income}
Health Score: ${score}/100
Monthly surplus: $${Math.round(surplus)}
Savings rate: ${savingsRate.toFixed(1)}%

EXPENSES:
${expenseLines}

DEBTS:
${debtLines}
Total debt: $${Math.round(totalDebt)}
Monthly interest cost: $${Math.round(totalInterest)}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API error:", err);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "AI analysis unavailable. Please try again." })
      };
    }

    const result = await response.json();
    const text = result.content
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis: text })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Something went wrong. Please try again." })
    };
  }
};
