import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectModule: pg,
    pool: { max: 2, min: 0, idle: 5000, acquire: 20000 },
    logging: false,
    dialectOptions: process.env.DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    define:{
      schema: "smart_schema",
      timestamps : false,
    }
  }
);

export default sequelize;
