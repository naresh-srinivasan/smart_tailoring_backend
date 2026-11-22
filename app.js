// Express app only: no listen(), no Socket.IO, no table sync.
// Used by api/index.js (Vercel serverless) and server.js (local development).
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pkg from "pg";
import authRoutes from "./routes/authRoutes.js";
import { sendContactEmail } from "./utils/mailer.js";
import measurementsRoutes from "./routes/measurementRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import PromoCodeRoutes from "./routes/PromoCodeRoutes.js";

const { Pool } = pkg;
const app = express();

// Allowed browser origins: CLIENT_URL can hold several, comma separated.
export const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

// The frontend calls both /api/... and /api/api/...; accept both by collapsing the doubled prefix.
// /api/send-contact is also used by the contact form but is defined at the root.
app.use((req, res, next) => {
  if (req.url.startsWith("/api/api/")) req.url = req.url.slice(4);
  if (req.url === "/api/send-contact") req.url = "/send-contact";
  next();
});

// Small pool: every serverless instance opens its own connections.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 2,
});

app.get("/", (req, res) => res.json({ status: "ok", service: "weave-nest-api" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Contact form
app.post("/send-contact", async (req, res) => {
  try {
    await sendContactEmail(req.body);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email failed to send", error: error.message });
  }
});

// Update user info
app.put("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, address } = req.body;

  try {
    const result = await pool.query(
      'UPDATE smart_schema.users SET name=$1, email=$2, phone=$3, address=$4, "updatedAt"=NOW() WHERE id=$5 RETURNING *',
      [name, email, phone, address, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Routes
app.use("/api", authRoutes);
app.use("/api/me", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/measurements", measurementsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/promo", PromoCodeRoutes);

export default app;
