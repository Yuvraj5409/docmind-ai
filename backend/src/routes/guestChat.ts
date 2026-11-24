
import { Router } from "express";
import { gemini, GEMINI_MODEL } from "../gemini.js";

const router = Router();

// Guest Chat API with conversation history
router.post("/", async (req, res) => {
    try {
        const { messages } = req.body;

        // Validate conversation history
        if (
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > 30
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid conversation history.",
            });
        }

        // Validate individual messages
        const validMessages = messages.every(
            (msg) =>
                msg &&
                ["user", "model"].includes(msg.role) &&
                typeof msg.content === "string" &&
                msg.content.trim().length > 0 &&
                msg.content.length <= 10000
        );

        if (!validMessages || messages[messages.length - 1].role !== "user") {
            return res.status(400).json({
                success: false,
                error: "Please provide valid messages.",
            });
        }

        // Convert messages into Gemini conversation format
        const contents = messages.map(
            (msg: { role: "user" | "model"; content: string }) => ({
                role: msg.role,
                parts: [{ text: msg.content.trim() }],
            })
        );

        // Send conversation history to Gemini
        const response = await gemini.models.generateContent({
            model: GEMINI_MODEL,
            contents,
        });

        return res.status(200).json({
            success: true,
            reply: response.text,
        });

    } catch (error) {
        console.error("Guest chat error:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to process your message. Please try again.",
        });
    }
});

export default router;
