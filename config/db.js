const { MongoClient } = require("mongodb");
const dns = require("dns");

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
	dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (error) {
	console.warn("Could not set custom DNS servers:", error.message);
}

let db;
let client;

module.exports = async () => {
	const connString = process.env.MONGO_URI;
	if (!connString)
		throw new Error("mongodb connection string in .env is not set");
	if (!client) {
		client = new MongoClient(connString);
		await client.connect();
		console.log("Connected to MongoDB");
		db = client.db();
	}
	return db;
};
