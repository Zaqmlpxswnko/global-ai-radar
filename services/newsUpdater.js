const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const Parser = require("rss-parser");
const axios = require("axios");

const parser = new Parser();





const NEWS_FILE = path.join(__dirname, "../PUBLIC/news.json");

const feeds = [
  "https://huggingface.co/blog/feed.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://venturebeat.com/category/ai/feed/"
];

async function updateNews() {
  console.log("=== NEW VERSION ===");
console.log("Updating AI news...");

  try {
    let articles = [];

    for (const feed of feeds) {
      try {
        const rss = await parser.parseURL(feed);
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
console.log("Calling Ollama...");
let aiNews;
try {
  const response = await axios.post(
    "http://127.0.0.1:11434/api/generate",
    {
      model: "qwen2.5:3b",
      prompt: prompt,
      stream: false
    },
    {
      timeout: 300000
    }
  );

  console.log("Ollama finished.");
console.dir(response.data, { depth: null });

let text = response.data.response;
text = text.replace(/```json|```/g, "").trim();

 aiNews = JSON.parse(text);

console.log(aiNews);

} catch (err) {
  console.error("OLLAMA ERROR");
  console.error(err.message);
  console.error(err.code);
  console.error(err.response?.data);
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