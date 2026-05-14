import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

function encodePathname(theme: string, room: string): string {
  const id = Date.now();
  return `designs/${id}_${encodeURIComponent(theme)}_${encodeURIComponent(room)}.png`;
}

function decodePathname(pathname: string): { theme: string; room: string } {
  const filename = pathname.split("/").pop() ?? "";
  const withoutExt = filename.replace(/\.png$/, "");
  const [, encodedTheme, ...rest] = withoutExt.split("_");
  return {
    theme: decodeURIComponent(encodedTheme ?? ""),
    room: decodeURIComponent(rest.join("_")),
  };
}

export async function POST(request: Request) {
  try {
    const { imageUrl, theme, room } = await request.json();

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from source URL." },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") ?? "image/png";

    const blob = await put(encodePathname(theme, room), imageBuffer, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save design";
    console.error("Gallery save error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "designs/" });

    const designs = blobs
      .map((blob) => {
        const { theme, room } = decodePathname(blob.pathname);
        return {
          url: blob.url,
          theme,
          room,
          createdAt: blob.uploadedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ designs });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch designs";
    console.error("Gallery fetch error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = await request.json();
    await del(url);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete design";
    console.error("Gallery delete error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
