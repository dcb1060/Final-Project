function loadOrders() {

    fetch("http://localhost:3000/orders", {
        headers: {
            "Authorization": localStorage.getItem("token")
        }
    })
    .then(res => res.json())
    .then(data => {

        const container = document.getElementById("orders");

        if (!container) return;

        container.innerHTML = "";

        const normalizedOrders = data.map(order => ({
            ...order,
            status: order.status?.trim().toLowerCase()
        }));

        const totalOrders = normalizedOrders.length;

        const pendingOrders = normalizedOrders.filter(
            o => o.status === "pending"
        ).length;

        const completedOrders = normalizedOrders.filter(
            o => o.status === "completed"
        ).length;

        const totalEl = document.getElementById("total-orders");
        const pendingEl = document.getElementById("pending-orders");
        const completedEl = document.getElementById("completed-orders");

        if (totalEl) totalEl.textContent = totalOrders;
        if (pendingEl) pendingEl.textContent = pendingOrders;
        if (completedEl) completedEl.textContent = completedOrders;


        data.forEach(order => {

            const div = document.createElement("div");

            div.className = "order-card";

            div.innerHTML = `
                <p><strong>User:</strong> ${order.email}</p>

                <p><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>

                <p>
                    <strong>Status:</strong>

                    <span class="${
                        order.status?.trim().toLowerCase() === "completed"
                            ? "status-completed"
                            : "status-pending"
                    }">
                        ${order.status?.trim()}
                    </span>
                </p>

                <ul>
                    ${order.items.map(i => `
                        <li>${i.name} x${i.quantity}</li>
                    `).join("")}
                </ul>

                ${order.status?.trim().toLowerCase() !== "completed" ? `
                    <button onclick="completeOrder('${order._id}')">
                        Mark as Completed
                    </button>
                ` : `
                    <span>✅ Completed</span>
                `}
            `;

            container.appendChild(div);
        });

    })
    .catch(err => {
        console.log("Failed to load orders:", err);
    });

}


function completeOrder(id) {

    fetch(`http://localhost:3000/orders/${id}/status`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("token")
        },

        body: JSON.stringify({
            status: "Completed"
        })

    })
    .then(res => res.json())
    .then(data => {

        alert("Order marked as completed");

        loadOrders();

    })
    .catch(err => {

        console.log(err);

        alert("Failed to update order");

    });

}

function loadMenuAdmin() {

    fetch("http://localhost:3000/menu")
    .then(res => res.json())
    .then(data => {

        const container = document.getElementById("menu-admin-list");

        if (!container) return;

        container.innerHTML = "";

        data.forEach(item => {

            const div = document.createElement("div");

            div.className = "order-card";

            div.innerHTML = `
                <p><strong>${item.name}</strong></p>

                <p>$${item.price}</p>

                <p>${item.category}</p>

                <button onclick="deleteMenuItem('${item._id}')">
                    Delete
                </button>
            `;

            container.appendChild(div);

        });

    })
    .catch(err => {

        console.log("Failed to load menu:", err);

    });

}

function addMenuItem() {

    const name = document.getElementById("item-name").value;
    const price = document.getElementById("item-price").value;
    const category = document.getElementById("item-category").value;
    const image = document.getElementById("item-image").value;

    if (!name || !price || !category || !image) {

        alert("Please fill in all fields");

        return;
    }

    fetch("http://localhost:3000/menu", {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("token")
        },

        body: JSON.stringify({
            name,
            price,
            category,
            image
        })

    })
    .then(res => res.json())
    .then(data => {

        alert("Menu item added");

        document.getElementById("item-name").value = "";
        document.getElementById("item-price").value = "";
        document.getElementById("item-category").value = "";
        document.getElementById("item-image").value = "";

        loadMenuAdmin();

    })
    .catch(err => {

        console.log(err);

        alert("Failed to add item");

    });

}


function deleteMenuItem(id) {

    const confirmDelete = confirm("Delete this menu item?");

    if (!confirmDelete) return;

    fetch(`http://localhost:3000/menu/${id}`, {

        method: "DELETE",

        headers: {
            "Authorization": localStorage.getItem("token")
        }

    })
    .then(res => res.json())
    .then(data => {

        alert("Menu item deleted");

        loadMenuAdmin();

    })
    .catch(err => {

        console.log(err);

        alert("Failed to delete item");

    });

}

document.addEventListener("DOMContentLoaded", () => {

    loadOrders();

    loadMenuAdmin();

});