exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  try {
    const data = JSON.parse(event.body);

    // Chat mode: multi-turn conversation
    if (data.chatMode && data.chatHistory) {
      const messages = [
        { role: "user", content: data.systemCtx + "\n\nRemember all rules above. Now respond to the conversation:" },
        { role: "assistant", content: "Got it — I have the full financial picture and all rules. Ready to help." },
        ...data.chatHistory
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages
        })
      });

      if (!response.ok) {
        return { statusCode: 500, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "AI advisor is temporarily unavailable. Try again in a moment." }) };
      }

      const result = await response.json();
      const text = result.content.filter(i => i.type === "text").map(i => i.text).join("");
      return { statusCode: 200, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: text }) };
    }

    // Initial analysis mode (non-chat)
    const { income, expenses, debts, score, surplus, savingsRate, totalDebt, totalInterest } = data;

    const expenseLines = Object.entries(expenses)
      .filter(([_, v]) => v > 0)
      .map(([cat, val]) => `${cat}: $${val}/mo (${((val / income) * 100).toFixed(1)}%)`)
      .join("\n");

    const debtLines = debts && debts.length > 0
      ? debts.map(d => `${d.name}: $${d.bal} at ${d.apr}% APR`).join("\n")
      : "No debts.";

    const prompt = `You are a warm, direct financial advisor at Fundshore. Analyze this user's situation.

RULES: 6-10 sentences max. Specific dollar amounts and timelines. Start with biggest strength, then biggest risk. Give 2-3 concrete actions. Never recommend interest-based products — suggest: side business, productive assets, skills, ventures. Tone: smart friend. No markdown. Plain paragraphs.

DATA:
Income: $${income}/mo | Score: ${score}/100 | Surplus: $${Math.round(surplus)}/mo | Savings: ${savingsRate.toFixed(1)}%
Expenses: ${expenseLines}
Debts: ${debtLines} | Total: $${Math.round(totalDebt)} | Interest: $${Math.round(totalInterest)}/mo`;

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
      return { statusCode: 500, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "AI analysis unavailable right now." }) };
    }

    const result = await response.json();
    const text = result.content.filter(i => i.type === "text").map(i => i.text).join("");
    return { statusCode: 200, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis: text }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Something went wrong. Please try again." }) };
  }
};
