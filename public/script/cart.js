async function updateQuantity(productId, change) {
    const res = await fetch("/cart/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId, change })
    });

    const data = await res.json();

    if (data.quantity <= 0) {
        document.getElementById("item-" + productId).remove();
    } else {
        document.getElementById("qty-" + productId).innerText = data.quantity;
    }
}
