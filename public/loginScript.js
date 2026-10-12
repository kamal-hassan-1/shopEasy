document
	.getElementById("loginForm")
	.addEventListener("submit", async function (e) {
		e.preventDefault();

		const email = document.getElementById("email").value.trim();
		const password = document.getElementById("password").value.trim();
		const errorMessage = document.getElementById("errorMessage");
		const loginButton = document.getElementById("loginButton");

		// Clear previous error messages
		hideError();

		// Validation
		if (!email || !password) {
			showError("Email and password are required");
			return;
		}

		if (!isValidEmail(email)) {
			showError("Please enter a valid email address");
			return;
		}

		// Show loading state
		loginButton.disabled = true;
		loginButton.innerHTML = '<span class="loading"></span>Logging in...';

		try {
			const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
			const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: email,
					password: password,
				}),
			});

			const data = await response.json();

			if (response.status === 200) {
				// Store the token in localStorage
				localStorage.setItem("authToken", data.token);

				// Show success and redirect
				loginButton.innerHTML = "✓ Success!";
				setTimeout(() => {
					window.location.href = "home.html"; // Change this to your desired page
				}, 500);
			} else {
				// Handle different error cases
				let errorMsg = "Login failed. Please try again.";

				switch (response.status) {
					case 400:
						errorMsg = "Email and password are required";
						break;
					case 404:
						errorMsg = "Account not found. Please check your email or sign up.";
						break;
					case 401:
						errorMsg = "Invalid email or password. Please try again.";
						break;
					case 500:
						errorMsg = "Server error. Please try again in a moment.";
						break;
					default:
						errorMsg = data.error || "Login failed. Please try again.";
				}

				showError(errorMsg);
			}
		} catch (error) {
			console.error("Login error:", error);
			showError("Connection error. Please check your internet and try again.");
		} finally {
			// Reset button state (only if not successful)
			if (loginButton.innerHTML.includes("Logging in")) {
				loginButton.disabled = false;
				loginButton.innerHTML = "Log In";
			}
		}
	});

function showError(message) {
	const errorMessage = document.getElementById("errorMessage");
	errorMessage.textContent = message;
	errorMessage.style.display = "block";

	// Scroll error into view if needed
	errorMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
	const errorMessage = document.getElementById("errorMessage");
	errorMessage.style.display = "none";
}

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Clear error message when user starts typing
document.getElementById("email").addEventListener("input", hideError);
document.getElementById("password").addEventListener("input", hideError);

// Handle Enter key in password field
document.getElementById("password").addEventListener("keypress", function (e) {
	if (e.key === "Enter") {
		document.getElementById("loginForm").dispatchEvent(new Event("submit"));
	}
});
