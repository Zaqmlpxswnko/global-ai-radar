const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const Parser = require("rss-parser");
const Groq = require("groq-sdk");

const parser = new Parser();



const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});   

const NEWS_FILE = path.join(__dirname, "../PUBLIC/news.json");

const feeds = [
  "https://huggingface.co/blog/feed.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://venturebeat.com/category/ai/feed/"
];

async function updateNews() {
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
    description: (item.contentSnippet || item.content || "").slice(0, 200),
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
const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "user",
      content: prompt
    }
  ],
  temperature: 0.2
});


    let text = completion.choices[0].message.content;
    text = text.replace(/```json|```/g, "").trim();

const aiNews = JSON.parse(text);

    text = text.replace(/```json|```/g, "").trim();

   const finalNews = aiNews.map((item, index) => ({
  ...item,
  image: articles[index]?.image || "",
  link: articles[index]?.link || ""
}));
fs.writeFileSync(
  NEWS_FILE,
  JSON.stringify(finalNews, null, 2)
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