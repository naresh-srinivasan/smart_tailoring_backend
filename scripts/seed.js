// Usage (from the backend folder): node scripts/seed.js
// Fills every table with demo data so the whole app can be exercised end to end.
// Safe to re-run: it does nothing if the demo admin already exists.
import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Measurement from "../models/Measurement.js";
import Inventory from "../models/Inventory.js";
import MaterialUsageLog from "../models/MaterialUsageLog.js";
import Notification from "../models/Notifications.js";
import PromoCode from "../models/PromoCode.js";

const DEMO_PASSWORD = "Demo@1234";
const day = 24 * 60 * 60 * 1000;
const ago = (d) => new Date(Date.now() - d * day);
const ahead = (d) => new Date(Date.now() + d * day);

try {
  await sequelize.query("CREATE SCHEMA IF NOT EXISTS smart_schema");
  await sequelize.sync({ alter: true });

  if (await User.findOne({ where: { email: "admin@weavenest.com" } })) {
    console.log("Demo data already present (admin@weavenest.com exists). Nothing to do.");
    process.exit(0);
  }

  /* ---------------- Users ---------------- */
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await User.create({
    name: "Demo Admin", email: "admin@weavenest.com", phone: "9000000001",
    password, address: "Weave Nest HQ, 123 Tailor St, Chennai", role: "Admin", isAdmin: true,
  });
  const [priya, arjun, meena] = await Promise.all([
    User.create({ name: "Priya Sharma", email: "priya@example.com", phone: "9000000002", password, address: "12 Lake View Road, Chennai 600001", role: "Customer" }),
    User.create({ name: "Arjun Mehta", email: "arjun@example.com", phone: "9000000003", password, address: "45 MG Road, Bengaluru 560001", role: "Customer" }),
    User.create({ name: "Meena Iyer", email: "meena@example.com", phone: "9000000004", password, address: "8 Temple Street, Madurai 625001", role: "Customer" }),
  ]);

  /* ---------------- Inventory (price is per metre) ---------------- */
  const inv = {};
  const stock = [
    ["cotton_blue", "Cotton", "fabric", "Blue", "#3B82F6", "Plain", 120, 200],
    ["cotton_white", "Cotton", "fabric", "White", "#FFFFFF", "Striped", 90, 220],
    ["linen_beige", "Linen", "fabric", "Beige", "#D8C3A5", "Plain", 60, 350],
    ["silk_maroon", "Silk", "fabric", "Maroon", "#800000", "Plain", 40, 650],
    ["poly_black", "Polyester", "fabric", "Black", "#111111", "Checked", 150, 150],
    ["velvet_green", "Velvet", "fabric", "Green", "#166534", "Plain", 25, 800],
    ["chiffon_pink", "Chiffon", "fabric", "Pink", "#F9A8D4", "Floral", 18, 450],
  ];
  for (const [key, material_name, material_type, color, color_code, pattern, total_quantity, price] of stock) {
    inv[key] = await Inventory.create({ material_name, material_type, color, color_code, pattern, total_quantity, price });
    await MaterialUsageLog.create({
      inventory_id: inv[key].id, quantity_used: total_quantity, action_type: "addition",
      notes: "Initial stock", created_at: ago(30),
    });
  }

  /* ---------------- Measurement profiles ---------------- */
  const shirtM = { Neck: 38, Shoulder: 45, Chest: 100, Waist: 90, "Sleeve Length": 60, "Shirt Length": 75 };
  const pantM = { Waist: 86, Hip: 98, Inseam: 80, Outseam: 104 };
  const kurtaM = { Shoulder: 38, Bust: 92, Waist: 78, Hip: 96, "Kurta Length": 105, "Sleeve Length": 55 };
  const lehengaM = { Waist: 72, Hip: 94, "Lehenga Length": 100 };
  await Measurement.bulkCreate([
    { userId: arjun.id, person_name: "Arjun (Shirt)", gender: "Men", data: shirtM },
    { userId: arjun.id, person_name: "Arjun (Pant)", gender: "Men", data: pantM },
    { userId: priya.id, person_name: "Priya (Kurta)", gender: "Women", data: kurtaM },
    { userId: priya.id, person_name: "Priya (Lehenga)", gender: "Women", data: lehengaM },
    { userId: meena.id, person_name: "Meena (Kurta)", gender: "Women", data: kurtaM },
  ]);

  /* ---------------- Promo codes ---------------- */
  await PromoCode.bulkCreate([
    { code: "WELCOME10", discountPercentage: 10, validFrom: ago(10), validTo: ahead(180), isActive: true, description: "10% off your first order", usageLimit: 100, usedCount: 1 },
    { code: "FESTIVE20", discountPercentage: 20, validFrom: ago(5), validTo: ahead(30), isActive: true, description: "Festive season offer", usageLimit: 50, usedCount: 0 },
    { code: "EXPIRED5", discountPercentage: 5, validFrom: ago(90), validTo: ago(30), isActive: false, description: "Expired demo code", usageLimit: null, usedCount: 12 },
  ]);

  /* ---------------- Orders (one per status) ---------------- */
  const LABOUR = 100, DELIVERY = 50, HANDLING = 30;
  const makeOrder = ({ user, gender, dressType, invItem, metres, base, extras = [], measurements, status, created, extra = {} }) => {
    const material = inv[invItem];
    const materialCost = material.price * metres;
    const extrasCost = extras.reduce((s, e) => s + e.cost, 0);
    const total = base + materialCost + extrasCost + LABOUR + DELIVERY + HANDLING;
    return {
      userId: user.id,
      items: {
        gender, dress_type: dressType, material: material.material_name, color: material.color, pattern: material.pattern,
        material_needed: metres, material_price_per_meter: material.price, total_material_cost: materialCost,
        extras, measurements, delivery_charge: DELIVERY,
      },
      totalAmount: total,
      status,
      delivery_address: user.address,
      expected_delivery: ahead(7),
      pendingAt: created,
      createdAt: created,
      updatedAt: created,
      ...extra,
    };
  };

  const orders = await Order.bulkCreate([
    makeOrder({ user: arjun, gender: "Men", dressType: "Shirt", invItem: "cotton_blue", metres: 2.6, base: 50, extras: [{ name: "Embroidery", cost: 15 }], measurements: shirtM, status: "Pending", created: ago(1) }),
    makeOrder({ user: priya, gender: "Women", dressType: "Kurta", invItem: "silk_maroon", metres: 2.4, base: 60, extras: [{ name: "Side Slits", cost: 10 }], measurements: kurtaM, status: "Order Accepted", created: ago(3), extra: { orderAcceptedAt: ago(2) } }),
    makeOrder({ user: meena, gender: "Women", dressType: "Lehenga", invItem: "velvet_green", metres: 3.1, base: 120, extras: [{ name: "Border Design", cost: 25 }], measurements: lehengaM, status: "Shipped", created: ago(6), extra: { orderAcceptedAt: ago(5), shippedAt: ago(2) } }),
    makeOrder({ user: arjun, gender: "Men", dressType: "Pant", invItem: "poly_black", metres: 1.9, base: 40, extras: [{ name: "Belt Loops", cost: 5 }], measurements: pantM, status: "Out for Delivery", created: ago(8), extra: { orderAcceptedAt: ago(7), shippedAt: ago(4), outForDeliveryAt: ago(0.2), delivery_otp: "482915" } }),
    makeOrder({ user: priya, gender: "Men", dressType: "Shirt", invItem: "cotton_white", metres: 2.7, base: 50, extras: [], measurements: shirtM, status: "Delivered", created: ago(20),
      extra: { orderAcceptedAt: ago(19), shippedAt: ago(16), outForDeliveryAt: ago(14), deliveredAt: ago(14), otp_verified: true, delivery_otp: "135790", feedback_rating: 5, feedback_text: "Perfect fit and great fabric quality!" } }),
    makeOrder({ user: meena, gender: "Women", dressType: "Kurta", invItem: "chiffon_pink", metres: 2.2, base: 60, extras: [], measurements: kurtaM, status: "Cancelled", created: ago(12), extra: { cancelledAt: ago(11), cancelReason: "Ordered by mistake" } }),
  ], { returning: true });

  /* ---------------- Stock deductions for orders that consumed fabric ---------------- */
  const itemKeys = ["cotton_blue", "silk_maroon", "velvet_green", "poly_black", "cotton_white", "chiffon_pink"];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === "Cancelled" || orders[i].status === "Pending") continue;
    const item = inv[itemKeys[i]];
    const used = orders[i].items.material_needed;
    await MaterialUsageLog.create({
      inventory_id: item.id, order_id: orders[i].id, quantity_used: used,
      action_type: "deduction", notes: `Used for order #${orders[i].id}`, created_at: orders[i].createdAt,
    });
    await item.update({ total_quantity: item.total_quantity - used });
  }

  /* ---------------- Notifications ---------------- */
  const notes = {
    Pending: "has been placed and is waiting for confirmation.",
    "Order Accepted": "has been accepted and is being stitched.",
    Shipped: "has been shipped.",
    "Out for Delivery": "is out for delivery. Share your OTP with the delivery partner.",
    Delivered: "was delivered. Thank you for shopping with Weave Nest!",
    Cancelled: "was cancelled.",
  };
  await Notification.bulkCreate(
    orders.map((o, i) => ({
      userId: o.userId, orderId: o.id, title: "Order Status Update",
      message: `Your order #${o.id} ${notes[o.status]}`, read: i >= 4,
    })).concat([
      { userId: admin.id, orderId: orders[0].id, title: "New Order", message: `New order #${orders[0].id} placed by Arjun Mehta.`, read: false },
      { userId: admin.id, orderId: null, title: "Low Stock", message: "Chiffon (Pink) is running low on stock.", read: false },
    ])
  );

  const counts = {
    users: await User.count(), inventory: await Inventory.count(), measurements: await Measurement.count(),
    promo_codes: await PromoCode.count(), orders: await Order.count(),
    notifications: await Notification.count(), material_usage_log: await MaterialUsageLog.count(),
  };
  console.log("Seed complete. Row counts:", counts);
  console.log(`Demo logins (password for all: ${DEMO_PASSWORD}):`);
  console.log("  admin@weavenest.com  (Admin)\n  priya@example.com, arjun@example.com, meena@example.com  (Customers)");
} finally {
  await sequelize.close();
}
