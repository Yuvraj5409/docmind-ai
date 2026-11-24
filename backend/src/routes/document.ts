
import { Router, Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import multer from "multer";
import { auth } from "../auth.js";
import { gemini, GEMINI_MODEL } from "../gemini.js";

const router = Router();

// Require a logged-in user before accepting document uploads.
async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({
                success: false,
                error: "Please log in to upload and analyze documents.",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}

const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            callback(new Error("Only PDF, JPG, and PNG files are supported."));
        }
    },
});

// Analyze an uploaded document using Gemini
router.post(
    "/analyze",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        upload.single("document")(req, res, (error) => {
            if (error instanceof multer.MulterError) {
                if (error.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({
                        success: false,
                        error: "File size must not exceed 10 MB.",
                    });
                }

                return res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }

            if (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }

            next();
        });
    },
    async (req: Request, res: Response) => {
        try {
            const file = req.file;
            const question =
                typeof req.body?.question === "string"
                    ? req.body.question.trim()
                    : "";

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: "Please upload a document.",
                });
            }

            if (!question) {
                return res.status(400).json({
                    success: false,
                    error: "Please enter a question about your document.",
                });
            }

            if (question.length > 5000) {
                return res.status(400).json({
                    success: false,
                    error: "Your question is too long.",
                });
            }

            const response = await gemini.models.generateContent({
                model: GEMINI_MODEL,
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    mimeType: file.mimetype,
                                    data: file.buffer.toString("base64"),
                                },
                            },
                            {
                                text: `You are DocMind AI, a document understanding assistant.

Analyze the uploaded document carefully. It may contain printed text, scanned pages, or handwriting.

Answer the user's question using the document as your primary source. Do not invent information. If the answer cannot be found in the document, clearly say so.

User's question:
${question}`,
                            },
                        ],
                    },
                ],
            });

            const reply = response.text;

            if (!reply) {
                return res.status(502).json({
                    success: false,
                    error: "Gemini could not generate a response. Please try again.",
                });
            }

            return res.status(200).json({
                success: true,
                fileName: file.originalname,
                reply,
            });
        } catch (error) {
            console.error("Document analysis error:", error);

            return res.status(500).json({
                success: false,
                error: "Unable to analyze this document. Please try again.",
            });
        }
    }
);

export default router;
