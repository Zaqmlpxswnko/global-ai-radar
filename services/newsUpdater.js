require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const Parser = require("rss-parser");


const parser = new Parser();





const NEWS_FILE = path.join(__dirname, "../PUBLIC/news.json");

const feeds = [
  "https://huggingface.co/blog/feed.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://openai.com/news/rss.xml",
];

async function updateNews() {
  console.log("=== NEW VERSION ===");
console.log("Updating AI news...");

  try {
    let articles = [];
    let aiNews = [];

    for (const feed of feeds) {
      try {
        const rss = await parser.parseURL(feed);
        console.log(`${rss.title}: ${rss.items.length} articles found`);
console.log(JSON.stringify(rss.items[0], null, 2));
        rss.items.slice(0, 2).forEach(item => {
         articles.push({
    id: articles.length,
    title: item.title,
    description: (item.contentSnippet || "").slice(0, 80),
    source: rss.title,
    link: item.link,
    image:
        item.enclosure?.url ||
        item["media:content"]?.$.url ||
        item["media:thumbnail"]?.$.url ||
        ""
});
});

      } catch (e) {
        console.log("RSS failed:", feed);
      }
    }
    
console.log(articles);
    const prompt = `
Summarize these AI news articles.

Return ONLY JSON.

Format:

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

Articles:

${JSON.stringify(articles)}
`;
console.log("Calling OpenRouter...");


try {
    const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
        model: "openrouter/free",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    },
    {
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        timeout: 300000
    }
);

    console.log("OpenRouter finished.");

   const rawText = response.data.choices[0].message.content;

console.log("OPENROUTER RAW RESPONSE:");
console.log(rawText);

// Remove markdown code fences
const cleanedText = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

// Find the actual JSON array
const jsonStart = cleanedText.indexOf("[");
const jsonEnd = cleanedText.lastIndexOf("]");

if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("OpenRouter did not return a valid JSON array.");
}

const jsonText = cleanedText.slice(jsonStart, jsonEnd + 1);

aiNews = JSON.parse(jsonText);

console.log("Parsed AI news successfully:");
console.log(aiNews);

} catch (err) {
    console.error("OPENROUTER ERROR");
    console.error(err.message);

    if (err.response) {
        console.error(err.response.data);
    }

    return;
}


console.log(aiNews);
  

   const finalNews = aiNews.map((item, index) => ({
  ...item,
  image: articles[index]?.image || "",
  link: articles[index]?.link || ""
}));

// Create Top 5 highest-scoring stories
const top5 = [...finalNews]
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

// Save all news
fs.writeFileSync(
  NEWS_FILE,
  JSON.stringify(finalNews, null, 2)
);

// Save Top 5 news
fs.writeFileSync(
  path.join(__dirname, "../PUBLIC/top5.json"),
  JSON.stringify(top5, null, 2)
);
console.log("News cache updated.");

  } catch (err) {
    console.error(err);
  }
}

// Run immediately
updateNews();

// Then every 30 minutes
cron.schedule("*/30 * * * *", updateNews);

module.exports = { updateNews };