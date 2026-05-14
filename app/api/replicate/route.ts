import { NextResponse } from "next/server";
import Replicate from "replicate";
import { buildPrompt, QUALITY_PROMPT, NEGATIVE_PROMPT } from "@/lib/prompts";
import type { DesignTheme, RoomType } from "@/types";

// Stable picsum seeds so the same "mock output" is returned every run.
const MOCK_OUTPUT = [
  "https://picsum.photos/seed/interior-edge/800/600",
  "https://picsum.photos/seed/interior-result/800/600",
];

export async function POST(request: Request) {
  try {
    const req = await request.json();

    const image: string = req.image;
    const theme: DesignTheme = req.theme;
    const room: RoomType = req.room;

    const prompt = buildPrompt(theme, room);
    console.log("Prompt:", prompt);

    if (process.env.REPLICATE_MOCK === "true") {
      console.log("[mock] Skipping Replicate call, returning mock output.");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json({ output: MOCK_OUTPUT }, { status: 201 });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN as string,
    });

    const model =
      "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b";

    const output = await replicate.run(model, {
      input: {
        image,
        prompt,
        a_prompt: QUALITY_PROMPT,
        n_prompt: NEGATIVE_PROMPT,
      },
    });

    if (!output) {
      return NextResponse.json(
        { error: "No output received from the model." },
        { status: 500 }
      );
    }

    const outputUrls = Array.isArray(output)
      ? output.map((item) =>
          typeof item === "string" ? item : item.toString()
        )
      : [];

    console.log("Output:", outputUrls);
    return NextResponse.json({ output: outputUrls }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    console.error("Replicate API error:", message);

    if (message.includes("401") || message.includes("Unauthenticated")) {
      return NextResponse.json(
        { error: "Invalid or missing Replicate API token." },
        { status: 401 }
      );
    }
    if (message.includes("402") || message.includes("Payment")) {
      return NextResponse.json(
        { error: "Replicate account has insufficient credits." },
        { status: 402 }
      );
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
