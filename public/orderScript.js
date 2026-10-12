let isLoggedIn = false;

function toggleDropdown() {
	const dropdown = document.getElementById("profileDropdown");
	dropdown.classList.toggle("show");
}

function handleRegister() {
	// Simulate registration process
	isLoggedIn = true;
	updateProfileDropdown();
	toggleDropdown(); // Close dropdown after action
}

function handleRegisterOrSignOut() {
	// Remove authToken if present (sign out)
	localStorage.removeItem("authToken");
	// Redirect to register.html
	window.location.href = "register.html";
}

function updateProfileDropdown() {
	const dropdown = document.getElementById("profileDropdown");
	const authToken = localStorage.getItem("authToken");
	if (authToken) {
		dropdown.innerHTML =
			'<a href="#" onclick="handleRegisterOrSignOut()">Sign Out</a>';
	} else {
		dropdown.innerHTML =
			'<a href="#" onclick="handleRegisterOrSignOut()">Register</a>';
	}
}

// Call updateProfileDropdown on page load
document.addEventListener("DOMContentLoaded", function () {
	updateProfileDropdown();
	fetchAndRenderOrder();

	// If confirmation is visible, update step indicator
	if (
		document.getElementById("orderConfirmation") &&
		document.getElementById("orderConfirmation").style.display !== "none"
	) {
		document
			.querySelectorAll(".step")
			.forEach((step) => step.classList.remove("active"));
		document.querySelectorAll(".step")[2].classList.add("active", "completed");
	}
});

// Payment method selection
document.querySelectorAll(".payment-method").forEach((method) => {
	method.addEventListener("click", function () {
		document
			.querySelectorAll(".payment-method")
			.forEach((m) => m.classList.remove("selected"));
		this.classList.add("selected");

		const selectedMethod = this.dataset.method;
		const cardDetails = document.getElementById("cardDetails");
		const cardFields = cardDetails.querySelectorAll("input");

		if (selectedMethod === "card") {
			cardDetails.style.display = "block";
			cardFields.forEach((input) => input.setAttribute("required", "required"));
		} else {
			cardDetails.style.display = "none";
			cardFields.forEach((input) => input.removeAttribute("required"));
		}
	});
});

// Card number formatting
document.getElementById("cardNumber").addEventListener("input", function (e) {
	let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
	let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
	if (formattedValue !== e.target.value) {
		e.target.value = formattedValue;
	}
});

// Expiry date formatting
document.getElementById("expiryDate").addEventListener("input", function (e) {
	let value = e.target.value.replace(/\D/g, "");
	if (value.length >= 2) {
		value = value.substring(0, 2) + "/" + value.substring(2, 4);
	}
	e.target.value = value;
});

// CVV formatting
document.getElementById("cvv").addEventListener("input", function (e) {
	e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
});

// Form validation
function validateForm() {
	const requiredFields = [
		"firstName",
		"lastName",
		"email",
		"phone",
		"address",
		"city",
		"province",
		"zipCode",
	];

	const selectedPaymentMethod = document.querySelector(
		".payment-method.selected"
	).dataset.method;

	if (selectedPaymentMethod === "card") {
		requiredFields.push("cardNumber", "expiryDate", "cvv", "cardName");
	}

	for (let fieldId of requiredFields) {
		const field = document.getElementById(fieldId);
		if (!field.value.trim()) {
			field.focus();
			field.style.borderColor = "#ff6b6b";
			setTimeout(() => {
				field.style.borderColor = "#555555";
			}, 3000);
			return false;
		}
	}

	// Email validation
	const email = document.getElementById("email").value;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		document.getElementById("email").focus();
		return false;
	}

	return true;
}

// Place order
document.getElementById("orderForm").addEventListener("submit", function (e) {
	e.preventDefault();
	placeOrder();
});

function placeOrder() {
	if (!validateForm()) {
		alert("Please fill in all required fields correctly.");
		return;
	}

	const button = document.querySelector(".btn-primary[type='submit']");
	const originalText = button.innerHTML;
	button.innerHTML = "Processing... ⏳";
	button.disabled = true;

	const token = localStorage.getItem("authToken");
	if (!token) {
		alert("You must be logged in to place an order.");
		button.innerHTML = originalText;
		button.disabled = false;
		return;
	}

	// Gather form data
	const firstName = document.getElementById("firstName").value.trim();
	const lastName = document.getElementById("lastName").value.trim();
	const email = document.getElementById("email").value.trim();
	const phone = document.getElementById("phone").value.trim();
	const address = document.getElementById("address").value.trim();
	const city = document.getElementById("city").value.trim();
	const province = document.getElementById("province").value.trim();
	const zip = document.getElementById("zipCode").value.trim();
	const specialInstructions =
		document.getElementById("instructions")?.value.trim() || "";

	const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
	fetch(`${API_BASE_URL}/api/main/orderPayment`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			firstName,
			lastName,
			email,
			phone,
			address,
			city,
			province,
			zip,
			specialInstructions,
		}),
	})
		.then(async (res) => {
			const data = await res.json();
			if (res.status === 201) {
				// Update order steps
				document
					.querySelectorAll(".step")
					.forEach((step) => step.classList.remove("active"));
				document
					.querySelectorAll(".step")[2]
					.classList.add("active", "completed");

				// Update delivery address in confirmation
				const deliveryAddress = `${address}, ${city}, ${province} ${zip}`;
				document.getElementById("deliveryAddress").textContent =
					deliveryAddress;

				// Show confirmation
				document.getElementById("orderContent").style.display = "none";
				document.getElementById("orderConfirmation").style.display = "block";

				// Update cart badge
				document.getElementById("cartBadge").textContent = "0";

				// Scroll to top
				window.scrollTo({ top: 0, behavior: "smooth" });

				// Optionally show a toast or alert
				// alert("Order placed successfully!");
			} else {
				alert(data.error || "Failed to place order.");
			}
		})
		.catch((err) => {
			console.error("Order payment failed:", err);
			alert("Server error. Please try again.");
		})
		.finally(() => {
			button.innerHTML = originalText;
			button.disabled = false;
		});
}

// Auto-fill card name from shipping name
document.getElementById("firstName").addEventListener("input", updateCardName);
document.getElementById("lastName").addEventListener("input", updateCardName);

function updateCardName() {
	const firstName = document.getElementById("firstName").value;
	const lastName = document.getElementById("lastName").value;
	const cardName = document.getElementById("cardName");

	if (firstName || lastName) {
		cardName.value = `${firstName} ${lastName}`.trim();
	}
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
	// Focus first input
	document.getElementById("firstName").focus();
});

async function fetchAndRenderOrder() {
	const token = localStorage.getItem("authToken");
	if (!token) return;

	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/fetchOrder`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) return;

		const data = await res.json();
		const { products, subTotal, shipping, totalTax, total } = data;

		// Render products
		const orderItemsDiv = document.getElementById("orderItems");
		orderItemsDiv.innerHTML = "";
		products.forEach((product) => {
			orderItemsDiv.innerHTML += `
                <div class="order-item">
                    <div class="item-icon">🛍️</div>
                    <div class="item-info">
                        <div class="item-name">${product.name}</div>
                        <div class="item-details">Qty: ${
													product.quantity || 1
												} • ${product.category}</div>
                    </div>
                    <div class="item-price">$${Number(product.price).toFixed(
											2
										)}</div>
                </div>
            `;
		});

		// Render summary
		document.getElementById("orderSubtotal").textContent = `$${Number(
			subTotal
		).toFixed(2)}`;
		document.getElementById("orderShipping").textContent =
			shipping === 0 ? "FREE" : `$${Number(shipping).toFixed(2)}`;
		document.getElementById("orderTax").textContent = `$${Number(
			totalTax
		).toFixed(2)}`;
		document.getElementById("orderTotal").textContent = `$${Number(
			total
		).toFixed(2)}`;
	} catch (err) {
		console.error("Failed to fetch order:", err);
	}
}

// Call on page load
document.addEventListener("DOMContentLoaded", fetchAndRenderOrder);
