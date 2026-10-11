const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const path = require("path");

const auth = require("./auth.js");
const main = require("./main.js");

const port = Number(process.env.PORT || 5000);
const app = express();

app.use(express.json());

app.use(
  "/images",
  express.static(path.join(__dirname, "Images"))
);

async function startServer() {
  const db = await connectDB();

  app.use("/api/auth", auth(db));
  app.use("/api/main", main(db));

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  app.use(
    express.static(path.join(__dirname, "public"))
  );

  app.get("/", (req, res) => {
    res.redirect("/home.html");
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`ShopEasy listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
