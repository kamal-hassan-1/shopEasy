const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

module.exports = (db) => {
	const productsCollection = db.collection("products");
	const cartCollection = db.collection("cart");

	router.get("/products", async (req, res) => {
		try {
			const products = await productsCollection
				.find({}, { projection: { _id: 0 } })
				.toArray();

			res.status(200).json(products);
		} catch (error) {
			console.error("Error fetching products:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});
	router.post("/addToCart", async (req, res) => {
		try {
			const authHeader = req.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return res.status(401).json({ error: "Unauthorized" });
			}
			const token = authHeader.split(" ")[1];
			let customerId;
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				customerId = decoded.customerId;
			} catch (err) {
				return res.status(401).json({ error: "Invalid token" });
			}

			const product = req.body;
			if (!product || !customerId) {
				return res
					.status(400)
					.json({ error: "Product and user ID are required" });
			}
			await cartCollection.insertOne({
				customerId,
				product,
				addedAt: new Date(),
			});
			res.status(201).json({ message: "Product added to cart successfully" });
		} catch (error) {
			console.error("Error adding to cart:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.get("/fetchCartItems", async (req, res) => {
		try {
			const authHeader = req.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return res.status(401).json({ error: "Unauthorized" });
			}
			const token = authHeader.split(" ")[1];
			let customerId;
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				customerId = decoded.customerId;
			} catch (err) {
				return res.status(401).json({ error: "Invalid token" });
			}

			const cartItems = await cartCollection
				.find({ customerId })
				.project({
					_id: 0,
					"product.name": 1,
					"product.category": 1,
					"product.price": 1,
					"product.imageUrl": 1,
				})
				.toArray();

			const products = cartItems.map((item) => ({
				name: item.product.name,
				category: item.product.category,
				price: item.product.price,
				imageUrl: item.product.imageUrl,
			}));

			res.status(200).json(products);
		} catch (error) {
			console.error("Error fetching cart:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.delete("/clearCart", async (req, res) => {
		try {
			const authHeader = req.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return res.status(401).json({ error: "Unauthorized" });
			}
			const token = authHeader.split(" ")[1];
			let customerId;
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				customerId = decoded.customerId;
			} catch (err) {
				return res.status(401).json({ error: "Invalid token" });
			}

			const result = await cartCollection.deleteMany({ customerId });

			res.status(200).json({
				message: "Cart cleared successfully",
				deletedCount: result.deletedCount,
			});
		} catch (error) {
			console.error("Error clearing cart:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	return router;
};
