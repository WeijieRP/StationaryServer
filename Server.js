const express = require("express");
const mysql2 = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* ===========================
   CORS CONFIG (SAFE VERSION)
=========================== */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.REACT_APP_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"));
      }
    },
  })
);

/* ===========================
   DATABASE CONNECTION
=========================== */
const DbConfig = mysql2.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
});

/* ===========================
   GET ALL STATIONARY
=========================== */
app.get("/stationary", async (req, res) => {
  try {
    const [rows] = await DbConfig.execute("SELECT * FROM stationary");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* ===========================
   CREATE STATIONARY
=========================== */
app.post("/stationary", async (req, res) => {
  try {
    const { name, price, category, qty } = req.body;

    if (!name || !price || !category || !qty) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [result] = await DbConfig.execute(
      "INSERT INTO stationary (name, price, category, qty) VALUES (?, ?, ?, ?)",
      [name, price, category, qty]
    );

    return res.status(201).json({
      message: "Item created successfully",
      insertId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* ===========================
   UPDATE STATIONARY
=========================== */
app.put("/stationary/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, price, category, qty } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [result] = await DbConfig.execute(
      "UPDATE stationary SET name=?, price=?, category=?, qty=? WHERE id=?",
      [name, price, category, qty, id]   // ✅ FIXED (was price before)
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json({ message: "Item updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* ===========================
   DELETE STATIONARY
=========================== */
app.delete("/stationary/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [result] = await DbConfig.execute(
      "DELETE FROM stationary WHERE id=?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* ===========================
   404 HANDLER
=========================== */
app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

/* ===========================
   START SERVER
=========================== */
app.listen(PORT, () => {
  console.log(`Server running at PORT ${PORT}`);
});