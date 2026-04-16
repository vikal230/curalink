import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import { connectToDatabase } from "./db/mongo.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config({
  path: fileURLToPath(new URL("./.env", import.meta.url)),
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "curalink-backend" });
});

app.use("/api", chatRoutes);

const startServer = async () => {
  try {
    await connectToDatabase();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error?.message || error);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
