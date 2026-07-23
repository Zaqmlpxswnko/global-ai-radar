const Parser = require("rss-parser");

const parser = new Parser();

const feeds = [
  "https://openai.com/news/rss.xml",
  "https://huggingface.co/blog/feed.xml",
  "https://venturebeat.com/category/ai/feed/",
  "https://techcrunch.com/category/artificial-intelligence/feed/"
];

async function fetchNews() {
  let articles = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed);

      rss.items.slice(0, 5).forEach(item => {
        articles.push({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.content || "",
          date: item.pubDate
        });
      });

    } catch (e) {
      console.log("RSS failed:", feed);
    }
  }

  return articles;
}

module.exports = { fetchNews };