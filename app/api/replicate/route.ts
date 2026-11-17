import { NextResponse } from "next/server";
import Replicate from "replicate";
import { z } from "zod";
import {
  DESIGN_THEMES,
  MAX_IMAGE_DATA_URL_LENGTH,
  ROOM_TYPES,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
} from "@/lib/constants";
import { buildPrompt, QUALITY_PROMPT, NEGATIVE_PROMPT } from "@/lib/prompts";

const requestSchema = z.object({
  image: z
    .string()
    .max(MAX_IMAGE_DATA_URL_LENGTH)
    .regex(/^data:image\/(?:png|jpeg);base64,/),
  theme: z.enum(DESIGN_THEMES),
  room: z.enum(ROOM_TYPES),
  scale: z.number().min(SCALE_MIN).max(SCALE_MAX).optional(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid request. Upload a JPEG or PNG photo and pick a listed theme and room.",
      },
      { status: 400 }
    );
  }

  try {
    const { image, theme, room } = parsed.data;
    const scale = parsed.data.scale ?? SCALE_DEFAULT;

    const prompt = buildPrompt(theme, room);
    console.log("Prompt:", prompt);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN as string,
      // Return plain output URLs. By default the SDK wraps each output in a
      // FileOutput stream that starts downloading the image straight away,
      // which this route never reads.
      useFileOutput: false,
    });

    const model =
      "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b";

    const output = await replicate.run(model, {
      input: {
        image,
        prompt,
        a_prompt: QUALITY_PROMPT,
        n_prompt: NEGATIVE_PROMPT,
        scale,
      },
    });

    const outputUrls = Array.isArray(output)
      ? output.map((item) =>
          typeof item === "string" ? item : item.toString()
        )
      : [];

    if (outputUrls.length === 0) {
      return NextResponse.json(
        { error: "No output received from the model." },
        { status: 502 }
      );
    }

    console.log("Output:", outputUrls);
    return NextResponse.json({ output: outputUrls }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    console.error("Replicate API error:", message);

    // Replicate's ApiError carries the failed HTTP response. Branch on its
    // status instead of searching the message, which embeds arbitrary model
    // and response text.
    const status = (err as { response?: { status?: number } } | null)?.response
      ?.status;

    if (status === 401) {
      return NextResponse.json(
        { error: "Invalid or missing Replicate API token." },
        { status: 401 }
      );
    }
    if (status === 402) {
      return NextResponse.json(
        { error: "Replicate account has insufficient credits." },
        { status: 402 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
