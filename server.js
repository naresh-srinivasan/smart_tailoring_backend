// Local development server: Express + Socket.IO + table sync.
// On Vercel this file is NOT used; see api/index.js.
import http from "http";
import { Server } from "socket.io";
import app, { allowedOrigins } from "./app.js";
import sequelize from "./config/database.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST", "PUT"], credentials: true },
});

// Track connected users for real-time notifications
const connectedUsers = {};
io.on("connection", (socket) => {
  socket.on("register-user", (userId) => {
    connectedUsers[userId] = socket.id;
  });
  socket.on("disconnect", () => {
    for (const [userId, sId] of Object.entries(connectedUsers)) {
      if (sId === socket.id) delete connectedUsers[userId];
    }
  });
});
app.set("io", io);
app.set("connectedUsers", connectedUsers);

sequelize
  .query("CREATE SCHEMA IF NOT EXISTS smart_schema")
  .then(() => sequelize.sync({ alter: true }))
  .then(() => {
    console.log("Tables synced successfully");
    const port = process.env.PORT || 5000;
    server.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((err) => console.error("Failed to sync tables:", err));
