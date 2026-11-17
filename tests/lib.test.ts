import "./setup";
import { describe, expect, test } from "bun:test";
import {
  ACCEPTED_FILE_TYPES,
  DESIGN_THEMES,
  MAX_FILE_SIZE,
  MAX_IMAGE_DATA_URL_LENGTH,
  ROOM_TYPES,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_PRESETS,
} from "@/lib/constants";
import { generationErrorMessage, pickDesignImage } from "@/lib/generation";
import { buildPrompt, NEGATIVE_PROMPT, QUALITY_PROMPT } from "@/lib/prompts";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseStoredSettings,
  sanitizeSettings,
  type Settings,
} from "@/lib/settings";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_EDGE,
  fitWithin,
  validateUploadFile,
} from "@/lib/upload";
import type { DesignTheme, RoomType } from "@/types";

describe("constants", () => {
  test("themes and room types are non-empty lists without duplicates", () => {
    for (const list of [DESIGN_THEMES, ROOM_TYPES]) {
      expect(list.length).toBeGreaterThan(0);
      expect(new Set(list).size).toBe(list.length);
      for (const item of list) {
        expect(item.trim()).toBe(item);
        expect(item).not.toBe("");
      }
    }
  });

  test("theme and room names survive the gallery file name format", () => {
    // Gallery names are `<id>_<theme>_<room>.png`, split on the first two
    // underscores, so a theme containing "_" would be decoded wrongly.
    for (const theme of DESIGN_THEMES) {
      expect(encodeURIComponent(theme)).not.toContain("_");
    }
  });

  test("the default scale lies within the accepted bounds", () => {
    expect(SCALE_MIN).toBeLessThan(SCALE_MAX);
    expect(SCALE_DEFAULT).toBeGreaterThanOrEqual(SCALE_MIN);
    expect(SCALE_DEFAULT).toBeLessThanOrEqual(SCALE_MAX);
  });

  test("a generation request stays under Vercel's 4.5 MB body limit", () => {
    // The body is JSON: the image data URL plus theme, room and scale.
    const overhead = JSON.stringify({
      image: "",
      theme: "Mid-Century Modern",
      room: "Living Room",
      scale: 19,
    }).length;
    expect(MAX_IMAGE_DATA_URL_LENGTH + overhead).toBeLessThan(4_500_000);
    expect(MAX_IMAGE_DATA_URL_LENGTH).toBe(4_000_000);
  });
});

describe("buildPrompt", () => {
  test("describes every theme and room with their keywords", () => {
    for (const theme of DESIGN_THEMES) {
      for (const room of ROOM_TYPES) {
        const prompt = buildPrompt(theme, room);

        expect(prompt.startsWith(`A ${theme} ${room}, `)).toBe(true);
        expect(prompt).not.toContain("undefined");
        expect(prompt).not.toContain(", ,");
      }
    }
  });

  test("uses different keywords for different themes and rooms", () => {
    const byTheme = new Set(
      DESIGN_THEMES.map((theme) => buildPrompt(theme, ROOM_TYPES[0]))
    );
    const byRoom = new Set(
      ROOM_TYPES.map((room) => buildPrompt(DESIGN_THEMES[0], room))
    );
    expect(byTheme.size).toBe(DESIGN_THEMES.length);
    expect(byRoom.size).toBe(ROOM_TYPES.length);

    expect(buildPrompt("Industrial", "Bathroom")).toContain("Exposed Brick");
    expect(buildPrompt("Industrial", "Bathroom")).toContain("Vanity");
  });

  test("the quality and negative prompts are set", () => {
    expect(QUALITY_PROMPT.length).toBeGreaterThan(0);
    expect(NEGATIVE_PROMPT.length).toBeGreaterThan(0);
  });
});

describe("sanitizeSettings", () => {
  test("keeps valid values", () => {
    const stored: Settings = {
      theme: "Coastal",
      room: "Kids Room",
      scale: 14,
    };
    expect(sanitizeSettings(stored)).toEqual(stored);
  });

  test("keeps every theme, room and UI scale preset", () => {
    for (const theme of DESIGN_THEMES) {
      expect(sanitizeSettings({ theme })).toEqual({ theme });
    }
    for (const room of ROOM_TYPES) {
      expect(sanitizeSettings({ room })).toEqual({ room });
    }
    const presets = SCALE_PRESETS.map((preset) => preset.value);
    for (const scale of [...presets, SCALE_MIN, SCALE_MAX]) {
      expect(sanitizeSettings({ scale })).toEqual({ scale });
    }
  });

  test("drops themes and rooms the app no longer offers", () => {
    // "Vintage", "Professional" and "Office" were options in older versions.
    expect(sanitizeSettings({ theme: "Vintage", room: "Office" })).toEqual({});
    expect(
      sanitizeSettings({ theme: "Professional", room: "Bedroom" })
    ).toEqual({ room: "Bedroom" });
    expect(sanitizeSettings({ theme: "modern", room: 3 })).toEqual({});
  });

  test("drops scales the API would reject", () => {
    for (const scale of [0, -4, SCALE_MAX + 1, NaN, Infinity, "9", null, [9]]) {
      expect(sanitizeSettings({ scale })).toEqual({});
    }
  });

  test("ignores unknown keys and non-object input", () => {
    expect(sanitizeSettings({ theme: "Modern", extra: true })).toEqual({
      theme: "Modern",
    });
    for (const stored of [null, undefined, "Modern", 9, true]) {
      expect(sanitizeSettings(stored)).toEqual({});
    }
    expect(sanitizeSettings(["Modern", "Bedroom", 9])).toEqual({});
  });
});

describe("parseStoredSettings", () => {
  test("returns the defaults when nothing is stored", () => {
    expect(parseStoredSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseStoredSettings("")).toEqual(DEFAULT_SETTINGS);
  });

  test('treats a stored "__proto__" key as data, not as inherited settings', () => {
    const raw =
      '{"theme":"Coastal","extra":true,"__proto__":{"room":"Kitchen","scale":14}}';
    expect(parseStoredSettings(raw)).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "Coastal",
    });
  });

  test("returns the defaults for malformed JSON", () => {
    for (const raw of ["{not json", "undefined", "{", "nope"]) {
      expect(parseStoredSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  test("merges valid stored values over the defaults", () => {
    expect(parseStoredSettings(JSON.stringify({ room: "Kitchen" }))).toEqual({
      ...DEFAULT_SETTINGS,
      room: "Kitchen",
    });
    expect(
      parseStoredSettings(
        JSON.stringify({ theme: "Bohemian", room: "Bathroom", scale: 19 })
      )
    ).toEqual({ theme: "Bohemian", room: "Bathroom", scale: 19 });
  });

  test("falls back to the default for each invalid stored value", () => {
    const raw = JSON.stringify({
      theme: "Vintage",
      room: "Kitchen",
      scale: 500,
    });
    expect(parseStoredSettings(raw)).toEqual({
      ...DEFAULT_SETTINGS,
      room: "Kitchen",
    });
  });

  test("the defaults themselves are valid settings", () => {
    expect(sanitizeSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.scale).toBe(SCALE_DEFAULT);
  });
});

describe("pinned values", () => {
  test("the upload limit is the 5 MB the UI, help page and README state", () => {
    // hooks/use-dropzone.ts and components/image-dropzone.tsx hard-code "5MB".
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  test("the default scale is the Balanced preset", () => {
    // The settings page and DesignControls highlight the preset whose value
    // equals the current scale; 9 is "Balanced".
    expect(SCALE_DEFAULT).toBe(9);
  });

  test("offers exactly these themes and rooms, in this order", () => {
    expect(DESIGN_THEMES).toEqual([
      "Modern",
      "Minimalist",
      "Scandinavian",
      "Industrial",
      "Bohemian",
      "Traditional",
      "Coastal",
      "Mid-Century Modern",
    ]);
    expect(ROOM_TYPES).toEqual([
      "Living Room",
      "Bedroom",
      "Bathroom",
      "Kitchen",
      "Dining Room",
      "Home Office",
      "Kids Room",
    ]);
  });

  test("composes the full prompt for a theme and room", () => {
    expect(buildPrompt("Minimalist", "Home Office")).toBe(
      "A Minimalist Home Office, " +
        "White Walls, Natural Wood, Clutter-free, Functional, Simple Forms, Muted Tones, Sparse Decor, Zen, Negative Space, " +
        "Desk, Chair, Shelving, Productive, Focused, Well-lit, " +
        "Editorial Style Photo, Natural Light, 4k, Symmetry, Straight On"
    );
  });

  test("gives every theme and room its own keywords", () => {
    // One keyword unique to each table entry. The theme and room names are in
    // every prompt, so comparing whole prompts cannot catch swapped or
    // copy-pasted keyword lists.
    const themeMarkers: Record<DesignTheme, string> = {
      Modern: "Clean Lines",
      Minimalist: "Clutter-free",
      Scandinavian: "Hygge",
      Industrial: "Exposed Brick",
      Bohemian: "Macrame",
      Traditional: "Crown Molding",
      Coastal: "Nautical",
      "Mid-Century Modern": "Tapered Legs",
    };
    const roomMarkers: Record<RoomType, string> = {
      "Living Room": "Coffee Table",
      Bedroom: "Nightstand",
      Bathroom: "Vanity",
      Kitchen: "Countertop",
      "Dining Room": "Dining Table",
      "Home Office": "Desk",
      "Kids Room": "Bunk Bed",
    };
    for (const theme of DESIGN_THEMES) {
      for (const room of ROOM_TYPES) {
        const prompt = buildPrompt(theme, room);
        for (const [markedTheme, marker] of Object.entries(themeMarkers)) {
          if (markedTheme === theme) expect(prompt).toContain(marker);
          else expect(prompt).not.toContain(marker);
        }
        for (const [markedRoom, marker] of Object.entries(roomMarkers)) {
          if (markedRoom === room) expect(prompt).toContain(marker);
          else expect(prompt).not.toContain(marker);
        }
      }
    }
  });

  test("the quality prompt asks for quality and the negative prompt lists defects", () => {
    expect(QUALITY_PROMPT).toContain("best quality");
    expect(QUALITY_PROMPT).not.toContain("worst quality");
    expect(NEGATIVE_PROMPT).toContain("worst quality");
    expect(NEGATIVE_PROMPT).toContain("lowres");
    expect(NEGATIVE_PROMPT).not.toContain("best quality");
  });

  test("defaults to a Modern living room at the Balanced scale", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      theme: "Modern",
      room: "Living Room",
      scale: 9,
    });
  });

  test("keeps the storage key existing users' settings are saved under", () => {
    expect(SETTINGS_STORAGE_KEY).toBe("interior-designer-settings");
  });
});

describe("SCALE_PRESETS", () => {
  test("offers Faithful, Balanced, Creative and Bold in rising strength", () => {
    expect(SCALE_PRESETS.map((preset) => [preset.label, preset.value])).toEqual(
      [
        ["Faithful", 4],
        ["Balanced", 9],
        ["Creative", 14],
        ["Bold", 19],
      ]
    );
    for (const preset of SCALE_PRESETS) {
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  test("every preset is a scale the API accepts", () => {
    for (const preset of SCALE_PRESETS) {
      expect(preset.value).toBeGreaterThanOrEqual(SCALE_MIN);
      expect(preset.value).toBeLessThanOrEqual(SCALE_MAX);
    }
  });

  test("the default scale is one of the presets, so one is always highlighted", () => {
    const values: number[] = SCALE_PRESETS.map((preset) => preset.value);
    expect(values).toContain(SCALE_DEFAULT);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("validateUploadFile", () => {
  test("accepts JPEG and PNG files up to the size limit", () => {
    for (const type of ["image/jpeg", "image/png"]) {
      expect(validateUploadFile({ type, size: 1 })).toBeNull();
      expect(validateUploadFile({ type, size: MAX_FILE_SIZE })).toBeNull();
    }
  });

  test("rejects other file types, whatever their size", () => {
    const types = [
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/jpg",
      "application/pdf",
      "text/html",
      "",
    ];
    for (const type of types) {
      expect(validateUploadFile({ type, size: 1 })).toBe(
        "Please upload a JPEG or PNG image"
      );
    }
  });

  test("rejects files over the size limit", () => {
    expect(
      validateUploadFile({ type: "image/png", size: MAX_FILE_SIZE + 1 })
    ).toBe("File size must be less than 5MB");
  });

  test("reports the file type before the size", () => {
    expect(
      validateUploadFile({ type: "image/gif", size: MAX_FILE_SIZE + 1 })
    ).toBe("Please upload a JPEG or PNG image");
  });

  test("every accepted type passes, so the picker and the check agree", () => {
    for (const type of ACCEPTED_FILE_TYPES) {
      expect(validateUploadFile({ type, size: 1024 })).toBeNull();
    }
  });
});

describe("pickDesignImage", () => {
  const CONTROL = "https://replicate.delivery/a/control.png";
  const DESIGN = "https://replicate.delivery/a/out.png";

  test("picks the second image when the model also returns its control map", () => {
    expect(pickDesignImage([CONTROL, DESIGN])).toBe(DESIGN);
    expect(pickDesignImage([CONTROL, DESIGN, "https://x/extra.png"])).toBe(
      DESIGN
    );
  });

  test("falls back to the first image when there is only one", () => {
    expect(pickDesignImage([DESIGN])).toBe(DESIGN);
    expect(pickDesignImage([DESIGN, ""])).toBe(DESIGN);
    expect(pickDesignImage([DESIGN, null])).toBe(DESIGN);
  });

  test("returns null when there is no usable image", () => {
    for (const output of [
      [],
      [""],
      [null],
      [42],
      [{}],
      null,
      undefined,
      DESIGN,
      {},
    ]) {
      expect(pickDesignImage(output)).toBeNull();
    }
  });
});

describe("generationErrorMessage", () => {
  test("prefers the error the API sent", () => {
    expect(generationErrorMessage(500, { error: "Model crashed" })).toBe(
      "Model crashed"
    );
    expect(generationErrorMessage(413, { error: "Too big for us" })).toBe(
      "Too big for us"
    );
  });

  test("explains platform errors that carry no JSON body", () => {
    expect(generationErrorMessage(413, null)).toBe(
      "Image is too large to upload. Try a smaller photo."
    );
    expect(generationErrorMessage(504, null)).toBe(
      "Generation timed out. Please try again."
    );
  });

  test("falls back to a generic message", () => {
    for (const data of [
      null,
      undefined,
      {},
      { error: "" },
      { error: 42 },
      "text",
    ]) {
      expect(generationErrorMessage(500, data)).toBe(
        "Failed to generate design"
      );
    }
    expect(generationErrorMessage(502, null)).toBe("Failed to generate design");
  });
});

describe("fitWithin", () => {
  test("leaves sizes that already fit unchanged", () => {
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(2048, 1536, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(1, 1, 2048)).toEqual({ width: 1, height: 1 });
  });

  test("scales the longer edge down to the limit and keeps the aspect ratio", () => {
    expect(fitWithin(4096, 3072, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(3024, 4032, 2048)).toEqual({ width: 1536, height: 2048 });
    expect(fitWithin(8000, 8000, 2048)).toEqual({ width: 2048, height: 2048 });
    expect(fitWithin(2049, 100, 2048)).toEqual({ width: 2048, height: 100 });
  });

  test("never scales up", () => {
    const fitted = fitWithin(640, 480, 2048);
    expect(fitted.width).toBe(640);
    expect(fitted.height).toBe(480);
  });

  test("never returns a zero-sized edge for extreme aspect ratios", () => {
    expect(fitWithin(100_000, 10, 2048)).toEqual({ width: 2048, height: 1 });
    expect(fitWithin(10, 100_000, 2048)).toEqual({ width: 1, height: 2048 });
  });

  test("always returns whole pixels within the limit", () => {
    const sizes = [
      [4000, 3000],
      [3000, 4000],
      [5472, 3648],
      [2049, 2047],
      [9999, 3333],
    ];
    for (const [width, height] of sizes) {
      const fitted = fitWithin(width, height, MAX_UPLOAD_EDGE);
      expect(Number.isInteger(fitted.width)).toBe(true);
      expect(Number.isInteger(fitted.height)).toBe(true);
      expect(Math.max(fitted.width, fitted.height)).toBe(MAX_UPLOAD_EDGE);
      expect(fitted.width / fitted.height).toBeCloseTo(width / height, 2);
    }
  });
});

describe("upload budget", () => {
  test("uploads are scaled to at most 2048 pixels on the longer edge", () => {
    expect(MAX_UPLOAD_EDGE).toBe(2048);
  });

  test("an encoded image of MAX_UPLOAD_BYTES fits the data URL limit as base64", () => {
    const base64Length = Math.ceil(MAX_UPLOAD_BYTES / 3) * 4;
    for (const type of ACCEPTED_FILE_TYPES) {
      const prefix = `data:${type};base64,`;
      expect(prefix.length + base64Length).toBeLessThanOrEqual(
        MAX_IMAGE_DATA_URL_LENGTH
      );
    }
    // ...and the budget is not needlessly small.
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(2_900_000);
  });
});
