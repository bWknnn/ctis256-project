async function updateQuantity(productId, change) {
    const res = await fetch("/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ productId, change })
    });

    const data = await res.json();
    
    const stockMsg = document.getElementById("stock-out");
    if (stockMsg) stockMsg.innerText = "";

    if (res.status === 400 && data.maxReached) {
        if (stockMsg) stockMsg.innerText = "Sorry, you've reached the maximum stock available for this item.";
        return; 
    }

    const itemCard = document.getElementById("item" + productId);

    if (data.quantity <= 0) {
        if (itemCard) {
            itemCard.style.opacity = "0";
            itemCard.style.transition = "0.5s";
            
            setTimeout(() => {
                itemCard.remove();
                
                if (document.querySelectorAll('.card').length === 0) {
                    setTimeout(() => {
                        location.reload(); 
                    }, 500);
                }
            }, 500);
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