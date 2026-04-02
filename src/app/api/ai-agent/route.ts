import { clientOpenAI } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await clientOpenAI.responses.create({
      model: "gpt-5-mini",
      instructions: "You are a coding assistant that talks like a pirate",
      input: "Are semicolons optional in JavaScript?",
    });

    return Response.json({
      output: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI route error:", error);

    return Response.json(
      {
        error: "Failed to generate AI response",
      },
      { status: 500 },
    );
  }
}
