const express = require("express");
const fs = require("fs");
const path = require("path");
const { updateNews } = require("../services/newsUpdater");
const router = express.Router();

router.get("/", (req, res) => {

    try {

        const data = fs.readFileSync(
            path.join(__dirname, "../PUBLIC/news.json"),
            "utf8"
        );

        res.json(JSON.parse(data));

    } catch (err) {

        res.status(500).json({
            error: "News cache unavailable"
        });

    }

});
router.post("/refresh", async (req, res) => {
  try {
    // Fetch the latest news
    await updateNews();

    // Read the updated cache
    const data = fs.readFileSync(
      path.join(__dirname, "../PUBLIC/news.json"),
      "utf8"
    );

    res.json(JSON.parse(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to refresh news"
    });
  }
});
module.exports = router;