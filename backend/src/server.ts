import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(currentDirectory, "../../.env"),
});

import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import cors from "cors";
import guestChatRouter from "./routes/guestChat.js";
import documentRouter from "./routes/document.js";
import chatsRouter from "./routes/chats.js";

const app = express();

const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:3000"
)
    .split(",")
    .map((origin) => origin.trim());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

const PORT = Number(process.env.PORT) || 4000;

// Better Auth routes — must come before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON for our other API routes
app.use(express.json());
app.use("/api/guest-chat", guestChatRouter);
app.use("/api/document", documentRouter);
app.use("/api/chats", chatsRouter);

// Health-check API
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DocMind AI backend is running!",
    });
});

// Start Express server
app.listen(PORT, () => {
    console.log(`DocMind AI backend running on port ${PORT}`);
});
