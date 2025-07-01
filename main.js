const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

module.exports = (db) => {
	const productsCollection = db.collection("products");
	const cartCollection = db.collection("cart");
	const ordersCollection = db.collection("Orders");
	const completedOrdersCollection = db.collection("completedOrders");

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

			// Try to increment quantity if product exists, else insert new
			const result = await cartCollection.updateOne(
				{ customerId, "product.name": product.name }, // match by product name (or use a unique product ID if available)
				{
					$setOnInsert: {
						customerId,
						product,
						addedAt: new Date(),
					},
					$inc: { quantity: 1 },
				},
				{ upsert: true }
			);

			if (result.upsertedCount > 0 || result.modifiedCount > 0) {
				res.status(201).json({ message: "Added or updated quantity!" });
			} else {
				res.status(500).json({ message: "Failed to add to cart" });
			}
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
					quantity: 1,
				})
				.toArray();

			const products = cartItems.map((item) => ({
				name: item.product.name,
				category: item.product.category,
				price: item.product.price,
				imageUrl: item.product.imageUrl,
				quantity: item.quantity,
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

	router.post("/placeOrder", async (req, res) => {
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

			// Check if the client already has an order
			const existingOrder = await ordersCollection.findOne({ customerId });
			if (existingOrder) {
				return res
					.status(400)
					.json({ error: "You already have an active order." });
			}

			const { totalTax, shipping, subTotal, total } = req.body;
			if (
				typeof totalTax !== "number" ||
				typeof shipping !== "number" ||
				typeof subTotal !== "number" ||
				typeof total !== "number"
			) {
				return res.status(400).json({ error: "Invalid order amounts" });
			}

			// Fetch products from cart, including quantity
			const cartItems = await cartCollection
				.find({ customerId })
				.project({ _id: 0, product: 1, quantity: 1 })
				.toArray();

			if (!cartItems.length) {
				return res.status(400).json({ error: "Cart is empty" });
			}

			const products = cartItems.map((item) => ({
				...item.product,
				quantity: item.quantity || 1,
			}));

			const totalQuantity = products.reduce(
				(sum, p) => sum + (p.quantity || 1),
				0
			);

			const order = {
				customerId,
				products,
				totalTax,
				shipping,
				subTotal,
				total,
				totalQuantity,
				date: new Date(),
			};

			await ordersCollection.insertOne(order);

			await cartCollection.deleteMany({ customerId });

			res
				.status(201)
				.json({ message: "Order placed successfully", orderId: order._id });
		} catch (error) {
			console.error("Error placing order:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.get("/fetchOrder", async (req, res) => {
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

			const order = await ordersCollection.findOne({ customerId });
			if (!order) {
				return res.status(404).json({ error: "No active order found" });
			}

			res.status(200).json({
				products: order.products,
				subTotal: order.subTotal,
				shipping: order.shipping,
				totalTax: order.totalTax,
				total: order.total,
			});
		} catch (error) {
			console.error("Error fetching order:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.post("/orderPayment", async (req, res) => {
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

			const {
				firstName,
				lastName,
				email,
				phone,
				address,
				city,
				province,
				zip,
				specialInstructions,
				deliveryInstructions,
			} = req.body;

			if (
				!firstName ||
				!lastName ||
				!email ||
				!phone ||
				!address ||
				!city ||
				!province ||
				!zip
			) {
				return res.status(400).json({ error: "Missing required fields" });
			}

			// Fetch the latest order for this customer
			const order = await ordersCollection.findOne({ customerId });
			if (!order) {
				return res.status(404).json({ error: "No active order found" });
			}

			const completedOrder = {
				customerId,
				shippingInfo: {
					firstName,
					lastName,
					email,
					phone,
					address,
					city,
					province,
					zip,
				},
				specialInstructions: specialInstructions || "",
				deliveryInstructions: deliveryInstructions || "",
				orderSummary: {
					products: order.products,
					subTotal: order.subTotal,
					shipping: order.shipping,
					totalTax: order.totalTax,
					total: order.total,
					totalQuantity: order.totalQuantity,
					date: order.date,
				},
				createdAt: new Date(),
			};

			await completedOrdersCollection.insertOne(completedOrder);

			// Delete the order from Orders collection after completion
			await ordersCollection.deleteOne({ _id: order._id });

			res.status(201).json({ message: "Order payment completed and stored." });
		} catch (error) {
			console.error("Error storing completed order:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	return router;
};
