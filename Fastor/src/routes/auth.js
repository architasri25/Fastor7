import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";

const router = Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." }
});

function validEmail(value) {
  return typeof value === "string"
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

router.post("/register", authRateLimit, async (req, res, next) => {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    return res.status(400).json({ error: "Name is required and must be at most 120 characters" });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Password must be between 8 and 72 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    const [result] = await pool.execute(
      `INSERT INTO employees (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );
    const [employees] = await pool.execute(
      `SELECT id, name, email, created_at AS "createdAt"
       FROM employees WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ employee: employees[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return next(error);
  }
});

router.post("/login", authRateLimit, async (req, res, next) => {
  const { email, password } = req.body ?? {};
  if (!validEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "A valid email and password are required" });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash
       FROM employees
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );
    const employee = rows[0];

    if (!employee || !(await bcrypt.compare(password, employee.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { sub: String(employee.id) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      token,
      tokenType: "Bearer",
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      employee: { id: employee.id, name: employee.name, email: employee.email }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
