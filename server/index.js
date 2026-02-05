import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./aiRoutes.js";

dotenv.config(); // ต้องอยู่บน

console.log("GEMINI_API_KEY =", process.env.GEMINI_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", aiRoutes);

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});