const express = require("express");
const router = express.Router();

module.exports = (db) => {
	const productsCollection = db.collection("products");

	router.get("/products", async (req, res) => {
		try {
			const products = await productsCollection.find({}, { projection: { _id: 0 } }).toArray();

			res.status(200).json(products);
		} catch (error) {
			console.error("Error fetching products:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	return router;
};
