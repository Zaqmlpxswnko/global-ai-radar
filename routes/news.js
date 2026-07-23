const express = require("express");
const fs = require("fs");
const path = require("path");

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

module.exports = router;