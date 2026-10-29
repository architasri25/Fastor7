import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true
});

try {
  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  await connection.query(schema);
  console.log("CRM database and tables are ready.");
} catch (error) {
  console.error("Could not create the CRM database and tables:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
