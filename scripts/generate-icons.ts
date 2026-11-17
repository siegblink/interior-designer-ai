import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

// House icon on dark purple gradient — reflects the "Interior Designer" home metaphor
// and matches the home icon used in the app's sidebar navigation.
function iconSvg(cornerRadius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1040"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="${cornerRadius}" fill="url(#g)"/>
  <polygon points="16,5 27,16 5,16" fill="white"/>
  <rect x="6" y="15" width="20" height="13" fill="white"/>
  <rect x="12" y="21" width="8" height="7" rx="1" fill="#3b0764"/>
</svg>`;
}

const ROUNDED = iconSvg(6);
// iOS masks home-screen icons itself and shows transparent corners as black.
const SQUARE = iconSvg(0);

async function toPng(svg: string, size: number): Promise<Buffer> {
  // Render the 32px artwork at the target size instead of upscaling a bitmap.
  return sharp(Buffer.from(svg), { density: (72 * size) / 32 })
    .resize(size, size)
    .png()
    .toBuffer();
}

function makeIco(pngs: { size: number; data: Buffer }[]): Buffer {
  const n = pngs.length;
  const headerSize = 6 + n * 16;

  let cursor = headerSize;
  const offsets: number[] = pngs.map((p) => {
    const offset = cursor;
    cursor += p.data.length;
    return offset;
  });

  const out = Buffer.alloc(cursor);

  // ICONDIR header
  out.writeUInt16LE(0, 0); // Reserved
  out.writeUInt16LE(1, 2); // Type: 1 = ICO
  out.writeUInt16LE(n, 4); // Image count

  // ICONDIRENTRY per image
  for (let i = 0; i < n; i++) {
    const base = 6 + i * 16;
    const { size, data } = pngs[i];
    out.writeUInt8(size === 256 ? 0 : size, base + 0); // Width (0 = 256)
    out.writeUInt8(size === 256 ? 0 : size, base + 1); // Height
    out.writeUInt8(0, base + 2); // ColorCount (0 = no palette)
    out.writeUInt8(0, base + 3); // Reserved
    out.writeUInt16LE(1, base + 4); // Color planes
    out.writeUInt16LE(32, base + 6); // Bits per pixel
    out.writeUInt32LE(data.length, base + 8); // Image data size
    out.writeUInt32LE(offsets[i], base + 12); // Offset from file start
  }

  // Append PNG blobs
  for (let i = 0; i < n; i++) {
    pngs[i].data.copy(out, offsets[i]);
  }

  return out;
}

function write(path: string[], data: Buffer): void {
  const dest = join(process.cwd(), ...path);
  writeFileSync(dest, data);
  console.log(`✓  ${path.join("/")} (${data.length} bytes)`);
}

// app/favicon.ico and app/apple-icon.png are Next.js file conventions: Next
// adds the <link> tags for them. The manifest icons are referenced from
// public/manifest.json.
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await toPng(ROUNDED, size) }))
);

write(["app", "favicon.ico"], makeIco(icoPngs));
write(["app", "apple-icon.png"], await toPng(SQUARE, 180));
write(["public", "icon-192.png"], await toPng(ROUNDED, 192));
write(["public", "icon-512.png"], await toPng(ROUNDED, 512));
