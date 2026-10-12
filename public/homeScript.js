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

function handleSignOut() {
	// Simulate sign out process
	isLoggedIn = false;
	updateProfileDropdown();
	toggleDropdown(); // Close dropdown after action
}

function updateProfileDropdown() {
	const dropdown = document.getElementById("profileDropdown");
	if (isLoggedIn) {
		dropdown.innerHTML =
			'<a href="#signout" onclick="handleSignOut()">Sign Out</a>';
	} else {
		dropdown.innerHTML =
			'<a href="#register" onclick="handleRegister()">Register</a>';
	}
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
	const dropdown = document.querySelector(".profile-dropdown");
	if (!dropdown.contains(event.target)) {
		document.getElementById("profileDropdown").classList.remove("show");
	}
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		e.preventDefault();
		const target = document.querySelector(this.getAttribute("href"));
		if (target) {
			target.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	});
});

// Header scroll effect
window.addEventListener("scroll", function () {
	const header = document.querySelector("header");
	if (window.scrollY > 100) {
		header.style.background = "rgba(34, 34, 34, 0.98)";
	} else {
		header.style.background = "rgba(34, 34, 34, 0.95)";
	}
});

// Add to cart functionality
document.querySelectorAll(".add-to-cart").forEach((button) => {
	button.addEventListener("click", function () {
		const cartBadge = document.querySelector(".cart-badge");
		let currentCount = parseInt(cartBadge.textContent);
		cartBadge.textContent = currentCount + 1;

		// Visual feedback
		this.textContent = "Added!";
		this.style.background = "#639FAB";
		setTimeout(() => {
			this.textContent = "Add to Cart";
			this.style.background = "#1C5D99";
		}, 1000);
	});
});

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
});

document
	.querySelector(".newsletter-form")
	.addEventListener("submit", async function (e) {
		e.preventDefault();
		const button = this.querySelector("button");
		const input = this.querySelector("input");
		const email = input.value.trim();

		if (!email) {
			button.textContent = "Enter email!";
			button.style.background = "#d9534f";
			setTimeout(() => {
				button.textContent = "Subscribe";
				button.style.background = "#222222";
			}, 2000);
			return;
		}

		button.textContent = "Subscribing...";
		button.disabled = true;

		try {
			const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
			const res = await fetch(`${API_BASE_URL}/api/auth/subscribe`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();

			if (res.ok) {
				button.textContent = "Subscribed!";
				button.style.background = "#639FAB";
				input.value = "";
			} else {
				button.textContent = data.error || "Error!";
				button.style.background = "#d9534f";
			}
		} catch (err) {
			button.textContent = "Server error!";
			button.style.background = "#d9534f";
		}

		setTimeout(() => {
			button.textContent = "Subscribe";
			button.style.background = "#222222";
			button.disabled = false;
		}, 2000);
	});
