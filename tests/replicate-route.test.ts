import {
  REPLICATE_TOKEN,
  jsonRequest,
  network,
  rawRequest,
  replicate,
  resetMocks,
} from "./setup";
import { beforeEach, describe, expect, test } from "bun:test";
import {
  ACCEPTED_FILE_TYPES,
  DESIGN_THEMES,
  MAX_IMAGE_DATA_URL_LENGTH,
  ROOM_TYPES,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_PRESETS,
} from "@/lib/constants";
import { buildPrompt, NEGATIVE_PROMPT, QUALITY_PROMPT } from "@/lib/prompts";
import { MAX_UPLOAD_BYTES } from "@/lib/upload";

const { POST } = await import("@/app/api/replicate/route");

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const JPEG_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
const OUTPUT = [
  "https://replicate.delivery/pbxt/abc/control.png",
  "https://replicate.delivery/pbxt/abc/out.png",
];
const INVALID_REQUEST =
  "Invalid request. Upload a JPEG or PNG photo and pick a listed theme and room.";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    image: PNG_DATA_URL,
    theme: "Scandinavian",
    room: "Kitchen",
    ...overrides,
  };
}

function generate(body: unknown) {
  return POST(jsonRequest("POST", "/api/replicate", body));
}

/** An error shaped like the Replicate SDK's ApiError. */
function apiError(
  status: number,
  message = `Request failed with status ${status}`
) {
  return Object.assign(new Error(message), {
    response: new Response(null, { status }),
  });
}

beforeEach(() => {
  resetMocks();
  replicate.result = OUTPUT;
});

describe("POST /api/replicate", () => {
  describe("successful generation", () => {
    test("runs the model and returns its output URLs with 201", async () => {
      const response = await generate(validBody());

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ output: OUTPUT });
      expect(replicate.runs).toHaveLength(1);
    });

    test("sends the pinned model, the built prompt and the image", async () => {
      await generate(validBody({ scale: 14 }));

      const [run] = replicate.runs;
      expect(run.model).toMatch(/^jagilley\/controlnet-hough:[0-9a-f]{64}$/);
      expect(run.input).toEqual({
        image: PNG_DATA_URL,
        prompt: buildPrompt("Scandinavian", "Kitchen"),
        a_prompt: QUALITY_PROMPT,
        n_prompt: NEGATIVE_PROMPT,
        scale: 14,
      });
    });

    test("authenticates with REPLICATE_API_TOKEN", async () => {
      await generate(validBody());
      expect(replicate.constructed).toHaveLength(1);
      expect(replicate.constructed[0]).toMatchObject({ auth: REPLICATE_TOKEN });
    });

    test("does not let the SDK download the output images", async () => {
      // By default the SDK wraps every output URL in a FileOutput that starts
      // downloading the file at once; the route only needs the URLs.
      const response = await generate(validBody());

      expect(await response.json()).toEqual({ output: OUTPUT });
      expect(replicate.constructed[0].useFileOutput).toBe(false);
      expect(network.requests).toEqual([]);
    });

    test("uses the default scale when none is given", async () => {
      await generate(validBody());
      expect(replicate.runs[0].input.scale).toBe(SCALE_DEFAULT);
    });

    test("accepts JPEG data URLs and every listed theme and room", async () => {
      for (const theme of DESIGN_THEMES) {
        for (const room of ROOM_TYPES) {
          const response = await generate(
            validBody({ image: JPEG_DATA_URL, theme, room })
          );
          expect(response.status).toBe(201);
        }
      }
      expect(replicate.runs).toHaveLength(
        DESIGN_THEMES.length * ROOM_TYPES.length
      );
    });

    test("accepts the scale bounds and the UI presets", async () => {
      const presets = SCALE_PRESETS.map((preset) => preset.value);
      for (const scale of [SCALE_MIN, ...presets, SCALE_MAX]) {
        const response = await generate(validBody({ scale }));
        expect(response.status).toBe(201);
      }
    });

    test("converts FileOutput-like objects to URL strings", async () => {
      replicate.result = OUTPUT.map((url) => ({ toString: () => url }));

      const response = await generate(validBody());

      expect(await response.json()).toEqual({ output: OUTPUT });
    });

    test("accepts the largest image the browser is allowed to send", async () => {
      const base64 = "A".repeat(Math.ceil(MAX_UPLOAD_BYTES / 3) * 4);
      for (const prefix of [
        "data:image/png;base64,",
        "data:image/jpeg;base64,",
      ]) {
        const response = await generate(validBody({ image: prefix + base64 }));
        expect(response.status).toBe(201);
      }
    });
  });

  describe("request validation", () => {
    async function expectRejected(body: unknown) {
      const response = await generate(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: INVALID_REQUEST });
    }

    test("rejects images that are not PNG or JPEG base64 data URLs", async () => {
      const images = [
        "https://example.com/room.jpg",
        "https://replicate.delivery/pbxt/abc/out.png",
        "data:image/svg+xml;base64,PHN2Zy8+",
        "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        "data:image/webp;base64,UklGRg==",
        "data:text/html;base64,PGh0bWw+",
        "data:image/png,rawbytes",
        " data:image/png;base64,iVBORw0KGgo=",
        "DATA:IMAGE/PNG;BASE64,iVBORw0KGgo=",
        "",
        null,
        undefined,
        12345,
        { url: PNG_DATA_URL },
      ];
      for (const image of images) {
        await expectRejected(validBody({ image }));
      }
      expect(replicate.runs).toHaveLength(0);
    });

    test("rejects an image longer than the upload limit allows", async () => {
      const image =
        "data:image/png;base64," + "A".repeat(MAX_IMAGE_DATA_URL_LENGTH);
      await expectRejected(validBody({ image }));
      expect(replicate.runs).toHaveLength(0);
    });

    test("rejects unknown themes and rooms", async () => {
      const overrides = [
        { theme: "Art Deco" },
        { theme: "modern" },
        { theme: "" },
        { theme: null },
        { theme: ["Modern"] },
        { theme: undefined },
        { room: "Garage" },
        { room: "kitchen" },
        { room: "" },
        { room: 7 },
        { room: undefined },
      ];
      for (const override of overrides) {
        await expectRejected(validBody(override));
      }
      expect(replicate.runs).toHaveLength(0);
    });

    test("rejects scales outside the accepted range or of the wrong type", async () => {
      const scales = [
        0,
        -1,
        SCALE_MIN - 0.01,
        SCALE_MAX + 0.01,
        999,
        "9",
        null,
        [9],
      ];
      for (const scale of scales) {
        await expectRejected(validBody({ scale }));
      }
      expect(replicate.runs).toHaveLength(0);
    });

    test("rejects bodies that are not objects, and malformed JSON", async () => {
      for (const body of [null, [], "text", 42]) {
        await expectRejected(body);
      }

      const response = await POST(
        rawRequest("POST", "/api/replicate", "{not json")
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: INVALID_REQUEST });
      expect(replicate.runs).toHaveLength(0);
    });

    test("never constructs a Replicate client for an invalid request", async () => {
      await generate(validBody({ theme: "Art Deco" }));
      expect(replicate.constructed).toHaveLength(0);
    });
  });

  describe("model output", () => {
    test("returns 502 when the model returns nothing usable", async () => {
      for (const result of [null, undefined, [], "a string", { url: "x" }]) {
        replicate.result = result;

        const response = await generate(validBody());

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({
          error: "No output received from the model.",
        });
      }
    });
  });

  describe("Replicate errors", () => {
    test("maps the failed response status to a friendly error", async () => {
      const cases: [number, string][] = [
        [401, "Invalid or missing Replicate API token."],
        [402, "Replicate account has insufficient credits."],
        [429, "Rate limit reached. Please wait a moment and try again."],
      ];
      for (const [status, message] of cases) {
        replicate.error = apiError(status);

        const response = await generate(validBody());

        expect(response.status).toBe(status);
        expect(await response.json()).toEqual({ error: message });
      }
    });

    test("returns 500 for other failed response statuses", async () => {
      for (const status of [400, 403, 404, 422, 500, 503]) {
        replicate.error = apiError(status, `upstream ${status}`);

        const response = await generate(validBody());

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: `upstream ${status}` });
      }
    });

    test("does not guess a status from numbers or words in the message", async () => {
      const messages = [
        "Prediction failed: CUDA out of memory, tried to allocate 401 MiB",
        "Prediction failed: tensor of size 402 does not match 429",
        "Prediction failed: Payment of attention exceeded the rate limit",
        "Unauthenticated-looking text in a model error",
      ];
      for (const message of messages) {
        replicate.error = new Error(message);

        const response = await generate(validBody());

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: message });
      }
    });

    test("returns a generic message when something other than an Error is thrown", async () => {
      for (const thrown of ["boom", { code: 1 }, 42]) {
        replicate.error = thrown;

        const response = await generate(validBody());

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "An error occurred" });
      }
    });
  });

  describe("contract details", () => {
    test("runs exactly the pinned model version", async () => {
      await generate(validBody());

      expect(replicate.runs[0].model).toBe(
        "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b"
      );
    });

    test("accepts an image exactly at the length limit and rejects one character more", async () => {
      const prefix = "data:image/png;base64,";
      const atLimit =
        prefix + "A".repeat(MAX_IMAGE_DATA_URL_LENGTH - prefix.length);

      const accepted = await generate(validBody({ image: atLimit }));
      expect(accepted.status).toBe(201);

      const rejected = await generate(validBody({ image: atLimit + "A" }));
      expect(rejected.status).toBe(400);
      expect(await rejected.json()).toEqual({ error: INVALID_REQUEST });
      expect(replicate.runs).toHaveLength(1);
    });

    test("rejects near-miss PNG and JPEG data URL prefixes", async () => {
      const images = [
        // A non-standard MIME type the browser never produces.
        "data:image/jpg;base64,/9j/4AAQSkZJRgABAQ==",
        // The base64 marker without the comma that starts the data.
        "data:image/png;base64",
        "data:image/png;base64iVBORw0KGgo=",
      ];
      for (const image of images) {
        const response = await generate(validBody({ image }));
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: INVALID_REQUEST });
      }
      expect(replicate.runs).toHaveLength(0);
    });

    test("accepts a data URL of every type the upload dropzone accepts", async () => {
      // The dropzone and the API must agree, or uploads pass the client
      // check and then fail with a 400.
      expect([...ACCEPTED_FILE_TYPES].sort()).toEqual([
        "image/jpeg",
        "image/png",
      ]);
      for (const type of ACCEPTED_FILE_TYPES) {
        const response = await generate(
          validBody({ image: `data:${type};base64,iVBORw0KGgo=` })
        );
        expect(response.status).toBe(201);
      }
    });

    test("accepts the model's full guidance range, 0.1 to 30, and nothing beyond it", async () => {
      for (const scale of [0.1, 30]) {
        const response = await generate(validBody({ scale }));
        expect(response.status).toBe(201);
      }
      for (const scale of [0.09, 30.01]) {
        const response = await generate(validBody({ scale }));
        expect(response.status).toBe(400);
      }
      expect(replicate.runs.map((run) => run.input.scale)).toEqual([0.1, 30]);
    });

    test("ignores unknown fields and never forwards them to the model", async () => {
      const response = await generate(
        validBody({ scale: 14, num_samples: "4", image_resolution: "768" })
      );

      expect(response.status).toBe(201);
      expect(Object.keys(replicate.runs[0].input).sort()).toEqual([
        "a_prompt",
        "image",
        "n_prompt",
        "prompt",
        "scale",
      ]);
    });

    test("returns a single output image as-is", async () => {
      // The page shows output[1] when the model also returns its control map,
      // and falls back to output[0].
      replicate.result = [OUTPUT[1]];

      const response = await generate(validBody());

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ output: [OUTPUT[1]] });
    });

    test("returns a generic 500 when the SDK rejects with null", async () => {
      replicate.result = {
        then: (_resolve: unknown, reject: (reason: unknown) => void) =>
          reject(null),
      };

      const response = await generate(validBody());

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "An error occurred" });
    });
  });
});
