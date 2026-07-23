const express = require("express");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.get("/", async (req, res) => {
  try {
    const prompt = `
Give me the latest AI breakthroughs from the past 24 hours.

Return ONLY valid JSON in this format:

[
  {
    "title":"",
    "lab":"",
    "category":"",
    "region":"",
    "score":"",
    "desc":"",
    "significance":""
  }
]
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0].message.content;

    res.json(JSON.parse(text));

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;