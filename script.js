const API_URL = "http://localhost:3000/menu";

const TAX_RATE = 0.06625;
let selectedTipRate = 0;

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function calculateCartTotals() {
    const cart = getCart();

    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price;
    });

    let tax = subtotal * TAX_RATE;
    let tip = subtotal * selectedTipRate;
    let total = subtotal + tax + tip;

    return { subtotal, tax, tip, total };
}

function addToCart(name, price) {
    let cart = getCart();

    cart.push({ name, price });

    saveCart(cart);

    updateCartCount();
    alert(`${name} added to cart!`);
}

function removeFromCart(index) {
    let cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);

    updateCartCount();
    loadCart();
}

function loadCart() {
    const cart = getCart();

    const container = document.getElementById("cart-items");

    const subtotalEl = document.getElementById("subtotal");
    const taxEl = document.getElementById("tax");
    const tipEl = document.getElementById("tip");
    const totalEl = document.getElementById("total");

    if (!container) return;

    container.innerHTML = "";

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <p>${item.name} - $${item.price}</p>
            <button onclick="removeFromCart(${index})">Remove</button>
        `;

        container.appendChild(div);
    });

    const { subtotal, tax, tip, total } = calculateCartTotals();

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (taxEl) taxEl.textContent = tax.toFixed(2);
    if (tipEl) tipEl.textContent = tip.toFixed(2);
    if (totalEl) totalEl.textContent = total.toFixed(2);
}

function setTip(rate) {
    selectedTipRate = rate;
    loadCart(); 
}

async function loadMenu() {
    try {
        const res = await fetch(API_URL);
        const items = await res.json();

        const container = document.getElementById("menu-container");
        if (!container) return;

        container.innerHTML = "";

        const grouped = {};

        items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });

        for (let category in grouped) {
            const section = document.createElement("section");

            section.innerHTML = `
                <h2>${category}</h2>
                <div class="menu-container"></div>
            `;

            const innerContainer = section.querySelector(".menu-container");

            grouped[category].forEach(item => {
                const card = document.createElement("div");
                card.className = "card";

                card.innerHTML = `
                    <img src="images/${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>$${item.price}</p>
                    <button onclick="addToCart('${item.name}', ${item.price})">
                        Add
                    </button>
                `;

                innerContainer.appendChild(card);
            });

            container.appendChild(section);
        }

    } catch (err) {
        console.error("Menu load error:", err);
    }
}

function updateCartCount() {
    const cart = getCart();
    const countElement = document.getElementById("cart-count");

    if (countElement) {
        countElement.textContent = cart.length;
    }
}

function checkout() {
    const cart = getCart();

    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }

    const email = localStorage.getItem("email")?.trim().toLowerCase();

    let items = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: 1
    }));

    const { subtotal, tax, tip, total } = calculateCartTotals();

    fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            items,
            subtotal,
            tax,
            tip,
            total
        })
    })
    .then(async res => {
        const data = await res.json();

        if (!res.ok) {
            console.log(data);
            alert("Failed to place order");
            return;
        }

        alert("Order placed successfully!");

        localStorage.removeItem("cart");
        updateCartCount();
        window.location.href = "index.html";
    })
    .catch(err => {
        console.log(err);
        alert("Server error");
    });
}

function updateAuthUI() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const loginLink = document.getElementById("login-link");
    const accountLink = document.getElementById("account-link");
    const adminLink = document.getElementById("admin-link");

    if (!loginLink) return;

    if (token) {
        loginLink.innerText = "Logout";
        loginLink.href = "#";

        loginLink.onclick = () => {
            localStorage.clear();
            window.location.href = "index.html";
        };

        if (accountLink) accountLink.style.display = "inline-block";

        if (adminLink) {
            adminLink.style.display = role === "admin" ? "inline-block" : "none";
        }

    } else {
        loginLink.innerText = "Login";
        loginLink.href = "auth.html";
        loginLink.onclick = null;

        if (accountLink) accountLink.style.display = "none";
        if (adminLink) adminLink.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {

    updateAuthUI();
    updateCartCount();

    if (document.getElementById("menu-container")) {
        loadMenu();
    }

    if (document.getElementById("cart-items")) {
        loadCart();
    }

});