async function updateQuantity(productId, change) {
    const res = await fetch("/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ productId, change })
    });

    const data = await res.json();

    if (data.quantity <= 0) {
        document.getElementById("item-" + productId).remove();
    } else {
        document.getElementById("qty-" + productId).innerText = data.quantity;
    }
}

async function processPurchase() {
    const msgDiv = document.getElementById("status-msg");
    const btn = document.querySelector(".purchase-btn");

    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        const res = await fetch("/cart/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (data.success) {
            msgDiv.innerText = "Success! Redirecting...";
            msgDiv.className = "status-msg success";
            msgDiv.style.display = "block";
            setTimeout(() => {
                window.location.href = "/userpage";
            }, 2000);
        } else {
            throw new Error(data.error || "Purchase failed");
        }
    } catch (err) {
        msgDiv.innerText = err.message;
        msgDiv.className = "status-msg error";
        msgDiv.style.display = "block";
        
        // Re-enable button
        btn.disabled = false;
        btn.innerText = "Proceed to Checkout";
    }
}