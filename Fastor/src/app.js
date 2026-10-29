import express from "express";
import authRoutes from "./routes/auth.js";
import enquiryRoutes from "./routes/enquiries.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/enquiries", enquiryRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must contain valid JSON" });
  }
  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: "Internal server error" });
});
