async function updateCartBadge() {
	const badge = document.getElementById("cartBadge");
	if (!badge) return;
	const token = localStorage.getItem("authToken");
	if (!token) {
		badge.textContent = "0";
		return;
	}
	try {
		const API_BASE_URL = window.API_BASE_URL || "http://localhost:5000";
		const res = await fetch(`${API_BASE_URL}/api/main/fetchCartItems`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) {
			badge.textContent = "0";
			return;
		}
		const products = await res.json();
		badge.textContent = products.length;
	} catch {
		badge.textContent = "0";
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", updateCartBadge);
} else {
	updateCartBadge();
}
