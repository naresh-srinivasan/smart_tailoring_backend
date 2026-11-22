// Usage (from the backend folder): node scripts/addFabrics.js
// Adds the fabric photo column, attaches photos to matching inventory rows and adds any missing catalogue fabrics.
// Safe to re-run; it never changes stock or price of rows that already exist.
import sequelize from "../config/database.js";
import Inventory from "../models/Inventory.js";
import { FABRICS, imagePath } from "./fabricCatalog.js";

try {
  await sequelize.query("CREATE SCHEMA IF NOT EXISTS smart_schema");
  await sequelize.sync({ alter: true });
  let updated = 0, created = 0;
  for (const [material_name, material_type, color, color_code, pattern, total_quantity, price, slug] of FABRICS) {
    const rows = await Inventory.findAll({ where: { material_name, color, pattern } });
    if (rows.length) {
      for (const r of rows) { r.image_url = imagePath(slug); await r.save(); updated++; }
    } else {
      await Inventory.create({ material_name, material_type, color, color_code, pattern, total_quantity, price, image_url: imagePath(slug) });
      created++;
    }
  }
  console.log(`Photos attached to ${updated} existing rows, ${created} new fabrics added.`);
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
