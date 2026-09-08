const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CORS
// ========================================

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://prospekcoding.github.io",
    "https://mir-py-portfolio.onrender.com"
];
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin
            // such as Postman/server-side requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        }
    })
);

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json({ limit: "1mb" }));

// Only useful if you also run the frontend
// through this Express server locally.
app.use(express.static(__dirname));

// ========================================
// MIR SYSTEM PROMPT
// ========================================

const MIR_SYSTEM_PROMPT = `
You are MIR, Shahmir Baloch's personal AI assistant.

You are embedded directly inside Shahmir's portfolio website.

Your jobs are to:
- Help visitors understand Shahmir and his work.
- Answer programming and coding questions.
- Help debug HTML, CSS, JavaScript, Python and general software problems.
- Explain programming concepts clearly.
- Help visitors brainstorm projects and technical ideas.
- Talk naturally and conversationally.
- Be useful, friendly and concise.

Portfolio facts you can use:
- Name: Shahmir Baloch.
- Website identity: mir.py.
- Focus: AI, automation, Python and modern full-stack development.
- Experience: Independent Developer.
- He builds software, AI tools, automations, APIs, digital products and web experiences.

Important:
- Never claim to be Shahmir.
- You are MIR, his digital assistant.
- Do not invent personal information about Shahmir.
- If something about Shahmir isn't provided in the portfolio facts, say you don't know.
- For coding questions, provide practical answers and examples.
`;

// ========================================
// CLEAN CHAT HISTORY
// ========================================

function cleanHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(
            (item) =>
                item &&
                (item.role === "user" ||
                    item.role === "assistant") &&
                typeof item.content === "string"
        )
        .slice(-12)
        .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 4000)
        }));
}

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "MIR.PY AI Backend",
        ai: "OpenRouter"
    });
});

// ========================================
// CHAT API
// ========================================

app.post("/api/chat", async (req, res) => {
    try {
        const {
            message,
            history = []
        } = req.body;

        // ------------------------------
        // Validate message
        // ------------------------------

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Message is required."
            });
        }

        const cleanMessage = message.trim();

        if (!cleanMessage) {
            return res.status(400).json({
                error: "Message cannot be empty."
            });
        }

        if (cleanMessage.length > 2000) {
            return res.status(400).json({
                error: "Message is too long."
            });
        }

        // ------------------------------
        // Check API key
        // ------------------------------

        if (!process.env.OPENROUTER_API_KEY) {
            console.error(
                "OPENROUTER_API_KEY is missing."
            );

            return res.status(500).json({
                error: "AI backend is not configured."
            });
        }

        // ------------------------------
        // Build messages
        // ------------------------------

        const messages = [
            {
                role: "system",
                content: MIR_SYSTEM_PROMPT
            },

            ...cleanHistory(history),

            {
                role: "user",
                content: cleanMessage
            }
        ];

        // ------------------------------
        // OpenRouter request
        // ------------------------------

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        "https://prospekcoding.github.io/Mir.py-Portfolio/",

                    "X-Title":
                        "Shahmir Baloch - mir.py"
                },

                body: JSON.stringify({
                    model: "openrouter/free",
                    messages,
                    temperature: 0.7,
                    max_tokens: 700
                })
            }
        );

        // ------------------------------
        // Read OpenRouter response
        // ------------------------------

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "OpenRouter error:",
                {
                    status: response.status,
                    error: data?.error
                }
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "OpenRouter request failed."
            });
        }

        // ------------------------------
        // Extract reply
        // ------------------------------

        const reply =
            data?.choices?.[0]?.message?.content?.trim();

        if (!reply) {
            console.error(
                "No AI reply returned:",
                data
            );

            return res.status(500).json({
                error:
                    "The AI returned an empty response."
            });
        }

        // ------------------------------
        // Send reply
        // ------------------------------

        return res.json({
            reply
        });

    } catch (error) {
        console.error(
            "MIR backend error:",
            error
        );

        return res.status(500).json({
            error:
                "MIR could not connect to the AI service."
        });
    }
});

// ========================================
// START SERVER
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log("");
        console.log("=================================");
        console.log(" MIR.PY SERVER");
        console.log("=================================");
        console.log(
            ` Running on port: ${PORT}`
        );
        console.log(
            " AI: OpenRouter Free"
        );
        console.log("=================================");
        console.log("");
    }
);