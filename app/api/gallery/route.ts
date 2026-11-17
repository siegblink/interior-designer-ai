import { put, del } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, isAdminSession } from "@/lib/admin-session";
import { DESIGN_THEMES, ROOM_TYPES } from "@/lib/constants";
import {
  DESIGNS_PREFIX,
  encodeDesignPathname,
  revalidateDesigns,
} from "@/lib/gallery";
import {
  GALLERY_SAVE_PER_CLIENT,
  gallerySaveBudget,
  limitClient,
  limitGlobal,
  turnedOff,
} from "@/lib/rate-limit";
import { rejectCrossSite } from "@/lib/same-origin";

const ALLOWED_IMAGE_HOSTS = ["replicate.delivery"];
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const MAX_REDIRECTS = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

const saveSchema = z.object({
  imageUrl: z.string(),
  theme: z.enum(DESIGN_THEMES),
  room: z.enum(ROOM_TYPES),
});

function parseAllowedImageUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    const hostAllowed = ALLOWED_IMAGE_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
    return hostAllowed ? url : null;
  } catch {
    return null;
  }
}

/**
 * Fetches an allowlisted image URL, re-validating every redirect hop against
 * the allowlist so a redirect cannot steer the request to another host.
 */
async function fetchAllowedImage(url: URL): Promise<Response | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current.href, { redirect: "manual" });
    if (response.status < 300 || response.status >= 400) return response;
    // Release the redirect response; its headers stay readable.
    discardBody(response);

    const location = response.headers.get("location");
    if (!location) return null;
    let nextUrl: URL | null;
    try {
      nextUrl = parseAllowedImageUrl(new URL(location, current).href);
    } catch {
      nextUrl = null;
    }
    if (!nextUrl) return null;
    current = nextUrl;
  }
  return null;
}

/**
 * Cancels an unread body so its connection can be released. Deliberately not
 * awaited: Next.js hands route handlers a tee'd clone of each fetch response,
 * and cancel() on one tee branch only settles once the other is cancelled too.
 */
function discardBody(response: Response | null): void {
  response?.body?.cancel().catch(() => {});
}

/** Reads a response body, giving up as soon as it exceeds `limit` bytes. */
async function readBodyWithLimit(
  response: Response,
  limit: number
): Promise<Buffer | null> {
  if (!response.body) return null;
  const declaredLength = Number(response.headers.get("content-length"));
  if (declaredLength > limit) {
    discardBody(response);
    return null;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      // Not awaited, for the same reason as discardBody().
      reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/** Identifies PNG, JPEG and WebP by their magic bytes; null for anything else. */
function sniffImageType(data: Buffer): string | null {
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  ) {
    return "image/png";
  }
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    data.length >= 12 &&
    data.toString("latin1", 0, 4) === "RIFF" &&
    data.toString("latin1", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Accepts only URLs of gallery designs in a public Vercel Blob store. */
function parseDesignBlobUrl(rawUrl: unknown): URL | null {
  if (typeof rawUrl !== "string") return null;
  try {
    const url = new URL(rawUrl);
    const isDesignBlob =
      url.protocol === "https:" &&
      url.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      url.pathname.startsWith(`/${DESIGNS_PREFIX}`);
    return isDesignBlob ? url : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const refused =
    rejectCrossSite(request) ??
    turnedOff(gallerySaveBudget()) ??
    limitClient(GALLERY_SAVE_PER_CLIENT, request);
  if (refused) return refused;

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { imageUrl, theme, room } = parsed.data;

  try {
    const parsedImageUrl = parseAllowedImageUrl(imageUrl);
    if (!parsedImageUrl) {
      return NextResponse.json(
        { error: "Image URL is not from a trusted source." },
        { status: 400 }
      );
    }

    const imageResponse = await fetchAllowedImage(parsedImageUrl);
    if (!imageResponse?.ok) {
      discardBody(imageResponse);
      return NextResponse.json(
        { error: "Failed to fetch image from source URL." },
        { status: 400 }
      );
    }

    const imageBuffer = await readBodyWithLimit(imageResponse, MAX_IMAGE_BYTES);
    const contentType = imageBuffer ? sniffImageType(imageBuffer) : null;
    if (!imageBuffer || !contentType) {
      return NextResponse.json(
        {
          error:
            "Source file is not a supported image (PNG, JPEG or WebP up to 10MB).",
        },
        { status: 400 }
      );
    }

    // Each upload is a Blob Advanced Operation; see gallerySaveBudget().
    const overBudget = limitGlobal(gallerySaveBudget());
    if (overBudget) return overBudget;

    const blob = await put(encodeDesignPathname(theme, room), imageBuffer, {
      access: "public",
      contentType,
    });
    revalidateDesigns();

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save design";
    console.error("Gallery save error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!isAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const designUrl = parseDesignBlobUrl(body?.url);
  if (!designUrl) {
    return NextResponse.json(
      { error: "Not a gallery design URL." },
      { status: 400 }
    );
  }

  try {
    await del(designUrl.href);
    revalidateDesigns();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete design";
    console.error("Gallery delete error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
