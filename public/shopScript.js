let cartCount = 3;
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

async function addToCart(button) {
	// Find the product card
	const card = button.closest(".product-card");
	const product = {
		name: card.querySelector(".product-name").textContent,
		category: card.querySelector(".product-category").textContent,
		description: card.querySelector(".product-description").textContent,
		price: parseFloat(card.dataset.price),
		imageUrl: card.querySelector("img").src,
	};

	// Get JWT token from localStorage
	const token = localStorage.getItem("authToken");
	if (!token) {
		alert("Please log in to add items to your cart.");
		return;
	}

	// Send to API with Authorization header
	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const response = await fetch(`${API_BASE_URL}/api/main/addToCart`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(product),
		});

		if (response.ok) {
			// Visual feedback only on success
			button.textContent = "Added!";
			button.style.background = "#639FAB";
			setTimeout(() => {
				button.textContent = "Add to Cart";
				button.style.background = "#1C5D99";
			}, 1000);

			// Update cart badge (optional, if you have a badge)
			cartCount++;
			const badge = document.querySelector(".cart-badge");
			if (badge) badge.textContent = cartCount;
		} else {
			const errorData = await response.json();
			button.textContent = errorData.message || "Error!";
			button.style.background = "#d9534f";
			setTimeout(() => {
				button.textContent = "Add to Cart";
				button.style.background = "#1C5D99";
			}, 1000);
		}
	} catch (err) {
		console.error("Failed to add to cart:", err);
		button.textContent = "Error!";
		button.style.background = "#d9534f";
		setTimeout(() => {
			button.textContent = "Add to Cart";
			button.style.background = "#1C5D99";
		}, 1000);
	}
}

// Filter functionality
function filterProducts() {
	const searchTerm = document.getElementById("searchInput").value.toLowerCase();
	const categoryFilter = document.getElementById("categoryFilter").value;
	const priceFilter = document.getElementById("priceFilter").value;
	const products = document.querySelectorAll(".product-card");

	let visibleCount = 0;

	products.forEach((product) => {
		const name = product
			.querySelector(".product-name")
			.textContent.toLowerCase();
		const description = product
			.querySelector(".product-description")
			.textContent.toLowerCase();
		const category = product.dataset.category;
		const price = parseInt(product.dataset.price);

		let show = true;

		// Search filter
		if (
			searchTerm &&
			!name.includes(searchTerm) &&
			!description.includes(searchTerm)
		) {
			show = false;
		}

		// Category filter
		if (categoryFilter && category !== categoryFilter) {
			show = false;
		}

		// Price filter
		if (priceFilter && price > parseInt(priceFilter)) {
			show = false;
		}

		product.style.display = show ? "block" : "none";
		if (show) visibleCount++;
	});

	document.getElementById("resultCount").textContent = visibleCount;
}

// Sort functionality
function sortProducts() {
	const sortValue = document.getElementById("sortSelect").value;
	const grid = document.getElementById("productGrid");
	const products = Array.from(grid.children);

	products.sort((a, b) => {
		switch (sortValue) {
			case "price-low":
				return parseInt(a.dataset.price) - parseInt(b.dataset.price);
			case "price-high":
				return parseInt(b.dataset.price) - parseInt(a.dataset.price);
			case "name":
				return a
					.querySelector(".product-name")
					.textContent.localeCompare(
						b.querySelector(".product-name").textContent
					);
			default:
				return 0;
		}
	});

	products.forEach((product) => grid.appendChild(product));
}

// Pagination (placeholder functions)
function previousPage() {
	console.log("Previous page clicked");
}

function nextPage() {
	console.log("Next page clicked");
}

// Event listeners
document
	.getElementById("searchInput")
	.addEventListener("input", filterProducts);
document
	.getElementById("categoryFilter")
	.addEventListener("change", filterProducts);
document
	.getElementById("priceFilter")
	.addEventListener("change", filterProducts);
document.getElementById("sortSelect").addEventListener("change", sortProducts);

async function fetchAndDisplayProducts() {
	const grid = document.getElementById("productGrid");
	const resultCount = document.getElementById("resultCount");
	grid.innerHTML =
		'<div style="grid-column: 1/-1; text-align:center;">Loading...</div>';

	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/products`);
		const products = await res.json();

		if (!Array.isArray(products) || products.length === 0) {
			grid.innerHTML =
				'<div style="grid-column: 1/-1; text-align:center;">No products found.</div>';
			resultCount.textContent = 0;
			return;
		}

		grid.innerHTML = "";
		products.forEach((product) => {
			const card = document.createElement("div");
			card.className = "product-card";
			card.dataset.category = (product.category || "").toLowerCase();
			card.dataset.price = parseInt(product.price) || 0;

			const imgSrc = product.imageUrl
				? (product.imageUrl.startsWith("http")
					? product.imageUrl
					: `${API_BASE_URL}${product.imageUrl}`)
				: "";

			card.innerHTML = `
                <div class="product-image">
                    <img src="${imgSrc}" alt="${
				product.name
			}" style="max-width:100%;max-height:100%;">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${
											product.description
										}</div>
                    <div class="product-price">$${Number(product.price).toFixed(
											2
										)}</div>
                    <div class="product-actions">
                        <button class="btn-primary">Add to Cart</button>
                        <button class="btn-secondary">♡</button>
                    </div>
                </div>
            `;
			// Add to Cart button event
			card.querySelector(".btn-primary").onclick = function () {
				addToCart(this);
			};
			grid.appendChild(card);
		});
		resultCount.textContent = products.length;
	} catch (err) {
		grid.innerHTML =
			'<div style="grid-column: 1/-1; text-align:center;">Failed to load products.</div>';
		resultCount.textContent = 0;
	}
}

// Call on page load
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function () {
		fetchAndDisplayProducts();
		updateProfileDropdown();
	});
} else {
	fetchAndDisplayProducts();
	updateProfileDropdown();
}
