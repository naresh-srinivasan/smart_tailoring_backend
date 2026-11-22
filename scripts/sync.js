// Run once (and after model changes) to create/alter tables: npm run db:sync
// Serverless functions do not sync the schema themselves.
import sequelize from "../config/database.js";
import "../models/index.js";
import "../models/Inventory.js";
import "../models/MaterialUsageLog.js";
import "../models/Notifications.js";
import "../models/PromoCode.js";

try {
  await sequelize.query("CREATE SCHEMA IF NOT EXISTS smart_schema");
  await sequelize.sync({ alter: true });
  console.log("Tables synced successfully");
} finally {
  await sequelize.close();
}
