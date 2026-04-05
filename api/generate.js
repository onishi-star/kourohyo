export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.content) {
      return res.status(500).json({ error: data });
    }

    const text = data.content.map(c => c.text || "").join("");

    res.json({ text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
