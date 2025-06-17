const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const path = require("path");

const auth = require("./auth.js");
const main = require("./main.js");

const port = process.env.PORT;
const app = express();

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "Images")));
app.use(
	cors({
		origin: "*",
	})
);

async function startServer() {
	const db = await connectDB();
	app.use("/api/auth", auth(db));
	app.use("/api/main", main(db));
	app.listen(port);
}
startServer();
