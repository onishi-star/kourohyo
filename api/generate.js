export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ""command-r-08-2024"",
        message: prompt,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.text) {
      return res.status(500).json({ error: data });
    }

    res.json({ text: data.text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
