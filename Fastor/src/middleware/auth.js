import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authorization = req.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    req.employee = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token" });
  }
}
