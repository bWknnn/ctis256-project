async function updateQuantity(productId, change) {
    const res = await fetch("/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ productId, change })
    });

    const data = await res.json();
    const cart = document.querySelector(".cart")   
    const stockMsg = document.getElementById("stock-out");
    stockMsg.innerText = "";

    if (data.maxReached) {
        stockMsg.innerText = "Sorry, you've reached the maximum stock available for this item.";
        return; 
    }

    const itemCard = document.getElementById("item" + productId);

    if (data.quantity <= 0) {
    if (itemCard) {
        itemCard.style.transition = "0.4s";
        itemCard.style.opacity = "0";
        itemCard.style.transform = "translateX(-10px)";

        setTimeout(() => {
            itemCard.remove();

            if (document.querySelectorAll(".card").length === 0) {
                const footer = document.querySelector(".footer");
                const stockMsg = document.getElementById("stock-out");
                const loading = document.getElementById("cart-loading");
                const cart = document.querySelector(".cart");

                footer.style.display = "none";
                stockMsg.style.display = "none";
                loading.style.display = "block";

                setTimeout(() => {
                    cart.innerHTML = `<p class="empty">Your cart is empty</p>`;
                }, 2000);
            }
            }, 400);
        }
        } else {
        const qtyEl = document.getElementById("qty" + productId); 
        const subtotalEl = document.getElementById("subtotal" + productId); 
        
        if (qtyEl) qtyEl.innerText = data.quantity;
        if (subtotalEl) subtotalEl.innerText = data.itemSubtotal + " TL";
        
        const plusBtn = document.querySelector("#item" + productId + " .qty-btn:last-of-type");
        if (plusBtn) plusBtn.disabled = data.maxReached;
    }

    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.innerText = data.grandTotal + " TL";
}

async function processPurchase() {
    const msgDiv = document.getElementById("msg");
    const btn = document.querySelector(".purchase");

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
            msgDiv.className = "msg success";
            msgDiv.style.display = "block";
            setTimeout(() => {
                window.location.href = "/consumerpage";
            }, 2000);
        } else {
            throw new Error(data.error || "Purchase failed");
        }
    } catch (err) {
        msgDiv.innerText = err.message;
        msgDiv.className = "msg error";
        msgDiv.style.display = "block";
        
        // Re-enable button
        btn.disabled = false;
        btn.innerText = "Proceed to Checkout";
    }
}