export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        error: "AI backend is not configured"
      });
    }

    /*
     * Keep the conversation reasonably small.
     * This prevents the browser from sending an enormous history.
     */
    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
          )
          .slice(-12)
      : [];

    const systemPrompt = `
You are MIR, the personal AI assistant built into Shahmir Baloch's portfolio website.

Your personality:
- Friendly
- Smart
- Direct
- Slightly futuristic
- Helpful
- Never overly formal
- Give practical answers rather than generic motivational text

Your main jobs are:

1. Help visitors understand Shahmir and his portfolio.
2. Answer questions about his projects, skills, experience and website.
3. Help visitors with programming and technical problems.
4. Explain HTML, CSS, JavaScript, Python, APIs, debugging, Git, web development,
   UI/UX and general software engineering.
5. Help debug code when visitors paste code.
6. Explain difficult technical concepts in simple language.
7. Help brainstorm project ideas.
8. Help visitors navigate and understand this portfolio.

Important rules about Shahmir:
- Do not invent personal facts about Shahmir.
- If you do not have information about Shahmir, say you don't have that information.
- Never pretend that you are Shahmir.
- You are MIR, his website's AI assistant.

Coding behavior:
- When debugging, explain the actual problem.
- Give corrected code when useful.
- Prefer concise, working examples.
- If there are multiple possible solutions, explain the best one first.
- Do not unnecessarily rewrite an entire project when a small fix is enough.

Conversation behavior:
- Remember relevant context from the conversation.
- Don't repeat questions the visitor already answered.
- Keep normal answers reasonably concise.
- For complicated technical questions, give structured step-by-step help.
- You can use markdown when it improves readability.

You are embedded directly inside a developer portfolio, so make MIR feel like
a polished personal AI assistant rather than a generic customer-support bot.
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...safeHistory,
      {
        role: "user",
        content: message.trim()
      }
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",

          // Optional OpenRouter metadata
          "HTTP-Referer": "https://your-domain.com",
          "X-Title": "Shahmir Baloch Portfolio"
        },

        body: JSON.stringify({
          model: "openrouter/free",

          messages,

          temperature: 0.7,

          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "The AI service returned an error."
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Unexpected OpenRouter response:", data);

      return res.status(500).json({
        error: "MIR did not return a response."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("MIR backend error:", error);

    return res.status(500).json({
      error: "Something went wrong while contacting MIR."
    });
  }
}