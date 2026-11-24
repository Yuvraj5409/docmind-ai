
import { Router, type Request, type Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { prisma } from "../db/prisma.js";
import { gemini, GEMINI_MODEL } from "../gemini.js";

const router = Router();

type PreviousMessage = {
    role: "USER" | "ASSISTANT";
    content: string;
};

// Verify the user's Better Auth session
async function getAuthenticatedUser(req: Request) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    return session?.user ?? null;
}

// Validate chat IDs from Express route parameters
function getChatId(req: Request): string | null {
    const chatId = req.params.chatId;
    return typeof chatId === "string" ? chatId : null;
}

// GET /api/chats — List the logged-in user's conversations
router.get("/", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to view your chat history.",
            });
        }

        const chats = await prisma.chat.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error("Get chats error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to load chat history.",
        });
    }
});

// GET /api/chats/:chatId — Load one conversation
router.get("/:chatId", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to open this conversation.",
            });
        }

        const chatId = getChatId(req);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: "Invalid conversation ID.",
            });
        }

        const chat = await prisma.chat.findFirst({
            where: { id: chatId, userId: user.id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found.",
            });
        }

        return res.status(200).json({ success: true, chat });
    } catch (error) {
        console.error("Get conversation error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to load this conversation.",
        });
    }
});

// PATCH /api/chats/:chatId — Rename a conversation
router.patch("/:chatId", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to rename this conversation.",
            });
        }

        const chatId = getChatId(req);
        const { title } = req.body;

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: "Invalid conversation ID.",
            });
        }

        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                error: "Title must contain between 1 and 100 characters.",
            });
        }

        const existingChat = await prisma.chat.findFirst({
            where: { id: chatId, userId: user.id },
            select: { id: true },
        });

        if (!existingChat) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found.",
            });
        }

        const chat = await prisma.chat.update({
            where: { id: chatId },
            data: {
                title: title.trim(),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                title: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            chat,
        });
    } catch (error) {
        console.error("Rename chat error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to rename this conversation.",
        });
    }
});

// DELETE /api/chats/:chatId — Delete a conversation
router.delete("/:chatId", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to delete this conversation.",
            });
        }

        const chatId = getChatId(req);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: "Invalid conversation ID.",
            });
        }

        const existingChat = await prisma.chat.findFirst({
            where: { id: chatId, userId: user.id },
            select: { id: true },
        });

        if (!existingChat) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found.",
            });
        }

        await prisma.chat.delete({
            where: { id: chatId },
        });

        return res.status(200).json({
            success: true,
            message: "Conversation deleted successfully.",
        });
    } catch (error) {
        console.error("Delete chat error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to delete this conversation.",
        });
    }
});

// POST /api/chats — Create a conversation and send its first message
router.post("/", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to start a saved conversation.",
            });
        }

        const { message } = req.body;

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 10000
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid message.",
            });
        }

        const firstMessage = message.trim();
        const title =
            firstMessage.length > 60
                ? `${firstMessage.slice(0, 57)}...`
                : firstMessage;

        const chat = await prisma.chat.create({
            data: {
                userId: user.id,
                title,
                messages: {
                    create: {
                        role: "USER",
                        content: firstMessage,
                    },
                },
            },
        });

        try {
            const response = await gemini.models.generateContent({
                model: GEMINI_MODEL,
                contents: [
                    {
                        role: "user",
                        parts: [{ text: firstMessage }],
                    },
                ],
            });

            const reply = response.text?.trim();

            if (!reply) {
                throw new Error("Gemini returned an empty response.");
            }

            await prisma.message.create({
                data: {
                    chatId: chat.id,
                    role: "ASSISTANT",
                    content: reply,
                },
            });

            return res.status(201).json({
                success: true,
                chatId: chat.id,
                title: chat.title,
                reply,
            });
        } catch (error) {
            console.error("First chat response error:", error);
            return res.status(502).json({
                success: false,
                chatId: chat.id,
                error: "Your message was saved, but AI could not respond. Please try again.",
            });
        }
    } catch (error) {
        console.error("Create chat error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to create your conversation.",
        });
    }
});

// POST /api/chats/:chatId/messages — Continue an existing conversation
router.post("/:chatId/messages", async (req: Request, res: Response) => {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Please sign in to continue this conversation.",
            });
        }

        const chatId = getChatId(req);

        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: "Invalid conversation ID.",
            });
        }

        const { message } = req.body;

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 10000
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid message.",
            });
        }

        const chat = await prisma.chat.findFirst({
            where: { id: chatId, userId: user.id },
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                error: "Conversation not found.",
            });
        }

        const newMessage = message.trim();

        const previousMessages = await prisma.message.findMany({
            where: { chatId: chat.id },
            orderBy: { createdAt: "asc" },
            select: {
                role: true,
                content: true,
            },
        });

        const contents = [
            ...previousMessages.map((msg: PreviousMessage) => ({
                role: msg.role === "USER" ? "user" : "model",
                parts: [{ text: msg.content }],
            })),
            {
                role: "user",
                parts: [{ text: newMessage }],
            },
        ];

        await prisma.message.create({
            data: {
                chatId: chat.id,
                role: "USER",
                content: newMessage,
            },
        });

        try {
            const response = await gemini.models.generateContent({
                model: GEMINI_MODEL,
                contents,
            });

            const reply = response.text?.trim();

            if (!reply) {
                throw new Error("Gemini returned an empty response.");
            }

            await prisma.message.create({
                data: {
                    chatId: chat.id,
                    role: "ASSISTANT",
                    content: reply,
                },
            });

            await prisma.chat.update({
                where: { id: chat.id },
                data: { updatedAt: new Date() },
            });

            return res.status(200).json({
                success: true,
                chatId: chat.id,
                reply,
            });
        } catch (error) {
            console.error("Continue chat response error:", error);
            return res.status(502).json({
                success: false,
                error: "Your message was saved, but AI could not respond. Please try again.",
            });
        }
    } catch (error) {
        console.error("Continue chat error:", error);
        return res.status(500).json({
            success: false,
            error: "Unable to continue this conversation.",
        });
    }
});

export default router;
