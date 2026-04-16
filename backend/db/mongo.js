import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/curalink_ai";

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
};
