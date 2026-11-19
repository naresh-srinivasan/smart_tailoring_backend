// Usage: node scripts/makeAdmin.js user@example.com
// Promotes an existing registered user to Admin (admins cannot self-register).
import sequelize from "../config/database.js";
import User from "../models/User.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

try {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Register first.`);
    process.exit(1);
  }
  user.role = "Admin";
  await user.save();
  console.log(`${email} is now an Admin.`);
} finally {
  await sequelize.close();
}
