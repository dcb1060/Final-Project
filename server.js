const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/sushiDB")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB error:", err));

const Menu = mongoose.model("Menu", {
    name: String,
    price: Number,
    category: String,
    image: String
}, "menuitems");

function verifyAdmin(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, "secretkey");

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Admin only" });
        }

        req.user = decoded;
        next();

    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}

app.get("/menu", async (req, res) => {
    try {
        const items = await Menu.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Failed to load menu" });
    }
});

app.post("/menu", verifyAdmin, async (req, res) => {
    try {
        const { name, price, category, image } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newItem = new Menu({
            name,
            price: Number(price),
            category,
            image
        });

        await newItem.save();

        res.json({ message: "Menu item added", item: newItem });

    } catch (err) {
        res.status(500).json({ error: "Failed to add menu item" });
    }
});

app.delete("/menu/:id", verifyAdmin, async (req, res) => {
    try {
        const deletedItem = await Menu.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: "Menu item deleted" });

    } catch (err) {
        res.status(500).json({ error: "Failed to delete menu item" });
    }
});

app.post("/register", async (req, res) => {
    try {
        let { name, email, password } = req.body;

        email = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: "customer"
        });

        await user.save();

        res.json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ message: "Wrong password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            "secretkey"
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role,
            email: user.email
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/orders", async (req, res) => {
    try {
        let { email, items, total } = req.body;

        email = email.trim().toLowerCase();

        if (!email || !items || !total) {
            return res.status(400).json({ error: "Missing order data" });
        }

        const order = new Order({
            email,
            items,
            total,
            status: "Pending",
            createdAt: new Date()
        });

        await order.save();

        res.json({ message: "Order placed successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error while placing order" });
    }
});

app.get("/orders", verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to load orders" });
    }
});

app.get("/my-orders", async (req, res) => {
    try {
        const email = (req.query.email || "").trim().toLowerCase();

        const orders = await Order.find({ email }).sort({ createdAt: -1 });

        res.json(orders);

    } catch (err) {
        res.status(500).json({ error: "Failed to load orders" });
    }
});

app.put("/orders/:id/status", verifyAdmin, async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        res.json({ message: "Order updated", order: updated });

    } catch (err) {
        res.status(500).json({ error: "Failed to update order" });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});