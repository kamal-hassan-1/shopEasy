const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

module.exports = (db) => {
	const customerCollections = db.collection("customer");
	const subscriberCollections = db.collection("subscribers");

	router.post("/signup", async (req, res) => {
		const { fullName, email, password } = req.body;

		function areDetailsValid(fullName, email, password) {
			if (!fullName || !email || !password) {
				return false;
			}
			const passwordPattern =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d\W\s]{8,}$/;

			if (!passwordPattern.test(password)) {
				return false;
			}
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return false;
			}
			return true;
		}
		if (!areDetailsValid(fullName, email, password)) {
			return res.status(400).json({ error: "Invalid customer details" });
		}

		try {
			const existingCustomer = await customerCollections.findOne({ email });
			if (existingCustomer) {
				return res.status(409).json({ error: "Email already registered" });
			}
			const hashedPassword = await bcrypt.hash(password, 10);

			const newCustomer = {
				fullName,
				email,
				password: hashedPassword,
			};

			await customerCollections.insertOne(newCustomer);
			res.status(201).json({ message: "User registered successfully" });
		} catch (error) {
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.post("/login", async (req, res) => {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		try {
			const customer = await customerCollections.findOne({ email });
			if (!customer) {
				return res.status(404).json({ error: "Customer not found" });
			}
			const isMatch = await bcrypt.compare(password, customer.password);
			if (!isMatch) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			const token = jwt.sign({ customerId: customer._id }, jwtSecret, {
				expiresIn: "1h",
			});
			res.status(200).json({ message: "Login successful", token });
		} catch (error) {
			console.error("Login error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

	router.post("/subscribe", async (req, res) => {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}
		try {
			const customer = await customerCollections.findOne({ email });
			const subscriber = await subscriberCollections.findOne({ email });
			if (customer || subscriber) {
				return res
					.status(400)
					.json({ error: "The customer is already registered" });
			}

			const newSubscriber = {
				email,
				createdAt: new Date(),
			};

			await subscriberCollections.insertOne(newSubscriber);
			res.status(201).json({ message: "User subscribed successfully" });
		} catch (error) {
			console.error("Error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});
	return router;
};
