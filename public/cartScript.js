let cartItems = [];
let isLoggedIn = false;
let appliedDiscount = 0;

// Fetch cart items from backend
async function fetchCartItems() {
	const token = localStorage.getItem("authToken");
	if (!token) {
		showEmptyCart();
		return;
	}
	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/fetchCartItems`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		if (!res.ok) {
			showEmptyCart();
			return;
		}
		const products = await res.json();
		// Use quantity from backend, default to 1 if missing
		cartItems = products.map((p, idx) => ({
			id: idx + 1,
			name: p.name,
			category: p.category,
			price: p.price,
			imageUrl: p.imageUrl,
			quantity: p.quantity || 1,
		}));
		renderCartItems();
		updateCartBadge();
		updateCartSummary();
	} catch (err) {
		console.error("Failed to fetch cart items:", err);
		showEmptyCart();
	}
}

// Render cart items in the DOM (no increment/decrement)
function renderCartItems() {
	const list = document.getElementById("cartItemsList");
	list.innerHTML = "";
	if (cartItems.length === 0) {
		showEmptyCart();
		return;
	}
	cartItems.forEach((item) => {
		const div = document.createElement("div");
		div.className = "cart-item";
		div.dataset.id = item.id;
		div.dataset.price = item.price;
		div.innerHTML = `
            <div class="item-image"><img src="${item.imageUrl}" alt="${
			item.name
		}" style="width:60px;height:60px;border-radius:8px;"></div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-category">${item.category}</div>
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <div class="item-quantity">Quantity: <span>${
									item.quantity
								}</span></div>
            </div>
        `;
		list.appendChild(div);
	});
}

// Update quantity
function updateQuantity(itemId, change) {
	// No-op: quantity is managed from backend only
}

function handleRegister() {
	// Simulate registration process
	isLoggedIn = true;
	updateProfileDropdown();
	toggleDropdown(); // Close dropdown after action
}
// Remove item from cart
function removeItem(itemId) {
	cartItems = cartItems.filter((item) => item.id !== itemId);

	// Remove from UI
	const cartItem = document.querySelector(`[data-id="${itemId}"]`);
	cartItem.remove();

	updateCartBadge();
	updateCartSummary();

	// Show empty cart if no items
	if (cartItems.length === 0) {
		showEmptyCart();
	}
}

function toggleDropdown() {
	const dropdown = document.getElementById("profileDropdown");
	dropdown.classList.toggle("show");
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

// Clear entire cart
async function clearCart() {
	if (!confirm("Are you sure you want to clear your cart?")) return;

	const token = localStorage.getItem("authToken");
	if (!token) {
		alert("You must be logged in to clear your cart.");
		return;
	}

	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/clearCart`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		if (res.ok) {
			cartItems = [];
			showEmptyCart();
			alert("Cart cleared successfully!");
		} else {
			const data = await res.json();
			alert(data.error || "Failed to clear cart.");
		}
	} catch (err) {
		console.error("Error clearing cart:", err);
		alert("Server error. Please try again.");
	}
}

// Show empty cart state
function showEmptyCart() {
	document.getElementById("cartContent").style.display = "none";
	document.getElementById("emptyCart").style.display = "block";
	document.getElementById("cartBadge").textContent = "0";
}

// Update cart badge
function updateCartBadge() {
	const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
	document.getElementById("cartBadge").textContent = totalItems;
}

// Update cart summary
function updateCartSummary() {
	const subtotal = cartItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0
	);
	const shipping = subtotal > 100 ? 0 : 15.99; // Free shipping over $100
	const tax = subtotal * 0.1; // 10% tax
	const discount = subtotal * (appliedDiscount / 100);
	const total = subtotal + shipping + tax - discount;

	document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
	document.getElementById("shipping").textContent = `$${shipping.toFixed(2)}`;
	document.getElementById("tax").textContent = `$${tax.toFixed(2)}`;
	document.getElementById("total").textContent = `$${total.toFixed(2)}`;

	if (appliedDiscount > 0) {
		document.getElementById("discount").textContent = `-$${discount.toFixed(
			2
		)}`;
		document.getElementById("discountRow").style.display = "flex";
	}
}

// Apply coupon code
function applyCoupon() {
	const couponCode = document
		.getElementById("couponCode")
		.value.trim()
		.toUpperCase();
	const button = document.querySelector(".apply-coupon");

	// Sample coupon codes
	const validCoupons = {
		SAVE10: 10,
		WELCOME15: 15,
		LUXE20: 20,
	};

	if (validCoupons[couponCode]) {
		appliedDiscount = validCoupons[couponCode];
		updateCartSummary();

		button.textContent = "Applied!";
		button.style.background = "#639FAB";
		document.getElementById("couponCode").disabled = true;

		setTimeout(() => {
			button.textContent = "Applied";
		}, 1000);
	} else {
		button.textContent = "Invalid";
		button.style.background = "#ff6b6b";

		setTimeout(() => {
			button.textContent = "Apply";
			button.style.background = "#1C5D99";
		}, 2000);
	}
}

// Proceed to checkout
async function proceedToCheckout() {
	if (cartItems.length === 0) {
		alert("Your cart is empty!");
		return;
	}

	const token = localStorage.getItem("authToken");
	if (!token) {
		alert("You must be logged in to place an order.");
		return;
	}

	// Gather order summary values from the DOM
	const subTotal = parseFloat(
		document.getElementById("subtotal").textContent.replace(/[^0-9.]/g, "")
	);
	const shipping = parseFloat(
		document.getElementById("shipping").textContent.replace(/[^0-9.]/g, "")
	);
	const totalTax = parseFloat(
		document.getElementById("tax").textContent.replace(/[^0-9.]/g, "")
	);
	const total = parseFloat(
		document.getElementById("total").textContent.replace(/[^0-9.]/g, "")
	);

	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/placeOrder`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				items: cartItems.map((item) => ({
					id: item.id,
					quantity: item.quantity,
				})),
				subTotal,
				shipping,
				totalTax,
				total,
				discount: appliedDiscount,
			}),
		});

		if (res.ok) {
			// Order placed successfully
			const data = await res.json();
			alert(`Order placed successfully! Order ID: ${data.orderId}`);
			// Clear cart and update UI
			cartItems = [];
			showEmptyCart();
			updateCartBadge();
		} else {
			const data = await res.json();
			alert(data.error || "Failed to place order.");
		}
	} catch (err) {
		console.error("Error placing order:", err);
		alert("Server error. Please try again.");
	}
}

// Initialize cart on page load
document.addEventListener("DOMContentLoaded", function () {
	fetchCartItems();
	updateProfileDropdown();
});
