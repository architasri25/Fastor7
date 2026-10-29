import "dotenv/config";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a secret of at least 32 characters");
}

const { app } = await import("./app.js");
const { pool } = await import("./db.js");
const port = Number(process.env.PORT) || 3000;

try {
  await pool.query("SELECT 1");
  app.listen(port, () => {
    console.log(`CRM API listening on port ${port}`);
  });
} catch (error) {
  console.error("Could not connect to PostgreSQL:", error);
  process.exitCode = 1;
  await pool.end();
}
