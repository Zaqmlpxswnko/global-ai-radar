const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
require("./services/cacheNews");
const newsRoute = require("./routes/news");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/news", newsRoute);

// Serve static files from PUBLIC folder
app.use(express.static(path.join(__dirname, "PUBLIC")));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "PUBLIC", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});