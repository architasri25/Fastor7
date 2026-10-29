import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePagination(req, res) {
  const limitValue = req.query.limit ?? "20";
  const offsetValue = req.query.offset ?? "0";
  const limit = Number(limitValue);
  const offset = Number(offsetValue);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100
      || !Number.isInteger(offset) || offset < 0) {
    res.status(400).json({ error: "limit must be 1-100 and offset must be a non-negative integer" });
    return null;
  }

  return { limit, offset };
}

router.post("/", async (req, res, next) => {
  const { name, email, courseInterest, phone, message } = req.body ?? {};

  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    return res.status(400).json({ error: "Name is required and must be at most 120 characters" });
  }
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (typeof courseInterest !== "string" || !courseInterest.trim() || courseInterest.trim().length > 160) {
    return res.status(400).json({ error: "Course interest is required and must be at most 160 characters" });
  }
  if (phone !== undefined && phone !== null
      && (typeof phone !== "string" || phone.length > 32)) {
    return res.status(400).json({ error: "Phone must be a string of at most 32 characters" });
  }
  if (message !== undefined && message !== null
      && (typeof message !== "string" || message.length > 5000)) {
    return res.status(400).json({ error: "Message must be a string of at most 5000 characters" });
  }

  try {
    const [insertResult] = await pool.execute(
      `INSERT INTO enquiries (name, email, course_interest, phone, message)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        courseInterest.trim(),
        phone?.trim() || null,
        message?.trim() || null
      ]
    );
    const [rows] = await pool.execute(
      `SELECT id, name, email, course_interest AS courseInterest,
              phone, message, created_at AS createdAt
       FROM enquiries WHERE id = ?`,
      [insertResult.insertId]
    );

    return res.status(201).json({ enquiry: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/public", requireAuth, async (req, res, next) => {
  const pagination = parsePagination(req, res);
  if (!pagination) return;

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, course_interest AS "courseInterest",
              phone, message, created_at AS createdAt
       FROM enquiries
       WHERE claimed_by IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [pagination.limit, pagination.offset]
    );
    return res.json({
      enquiries: rows,
      pagination: { ...pagination, count: rows.length }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/claim", requireAuth, async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(400).json({ error: "Enquiry id must be a positive integer" });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE enquiries
       SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND claimed_by IS NULL`,
      [req.employee.id, req.params.id]
    );

    if (result.affectedRows === 1) {
      const [rows] = await pool.execute(
        `SELECT id, name, email, course_interest AS courseInterest,
                phone, message, claimed_by AS claimedBy,
                claimed_at AS claimedAt, created_at AS createdAt
         FROM enquiries WHERE id = ?`,
        [req.params.id]
      );
      return res.json({ enquiry: rows[0] });
    }

    const [existing] = await pool.execute(
      "SELECT 1 FROM enquiries WHERE id = ?",
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    return res.status(409).json({ error: "Enquiry has already been claimed" });
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", requireAuth, async (req, res, next) => {
  const pagination = parsePagination(req, res);
  if (!pagination) return;

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, course_interest AS courseInterest,
              phone, message, claimed_at AS claimedAt,
              created_at AS createdAt
       FROM enquiries
       WHERE claimed_by = ?
       ORDER BY claimed_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [req.employee.id, pagination.limit, pagination.offset]
    );
    return res.json({
      enquiries: rows,
      pagination: { ...pagination, count: rows.length }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
