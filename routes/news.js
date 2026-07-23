const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get("/", async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview"
        });

        const prompt = `
Give me the latest AI breakthroughs from the past 24 hours.

Return ONLY JSON like this:

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

        const result = await model.generateContent(prompt);
        const response = await result.response;

        const text = response.text();
     res.json(JSON.parse(text));

    } catch (err) {
        console.error(err);
        res.status(500).send({
            error: err.message
        });
    }
});

module.exports = router;