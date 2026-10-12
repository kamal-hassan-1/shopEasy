document
	.getElementById("signupform")
	.addEventListener("submit", async function (e) {
		e.preventDefault();

        const fullName = document.getElementById("name").value.trim();
		const email = document.getElementById("email").value.trim();
		const password = document.getElementById("password").value.trim();
		const errorMessage = document.getElementById("errorMessage");
		const signupbutton = document.getElementById("signupbutton");

		// Clear previous error messages
		hideError();

		// Validation
		if (!email || !password || !fullName) {
			showError("Name, Email and password are required");
			return;
		}

		if (!isValidEmail(email)) {
			showError("Please enter a valid email address");
			return;
		}

		// Show loading state
		signupbutton.disabled = true;
		signupbutton.innerHTML = '<span class="loading"></span>Logging in...';

		try {
			const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
			const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
                    fullName: fullName,
					email: email,
					password: password,
				}),
			});

			const data = await response.json();

			if (response.status === 201) {
				signupbutton.innerHTML = "✓ Success!";
				setTimeout(() => {
					window.location.href = "login.html"; // Change this to your desired page
				}, 500);
			} else {
				// Handle different error cases
				let errorMsg = "Sign up failed. Please try again.";

				switch (response.status) {
					case 400:
						errorMsg = "Name, Email and password are required";
						break;
					case 401:
						errorMsg = "Invalid name, email or password. Please try again.";
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
			console.error("Signup error:", error);
			showError("Connection error. Please check your internet and try again.");
		} finally {
			// Reset button state (only if not successful)
			if (signupbutton.innerHTML.includes("Logging in")) {
				signupbutton.disabled = false;
				signupbutton.innerHTML = "Log In";
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
		document.getElementById("signupform").dispatchEvent(new Event("submit"));
	}
});
