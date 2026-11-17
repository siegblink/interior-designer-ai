import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

// The app's logo: the palette from the sidebar header (Lucide's "palette"
// outline) with four paint dots, on the dark zinc background. The artwork is
// drawn on Lucide's 24px grid.
function iconSvg(cornerRadius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="${cornerRadius}" fill="#18181b"/>
  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" fill="none" stroke="#ffffff" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="13.5" cy="6.5" r="0.95" fill="#f97316"/>
  <circle cx="17.5" cy="10.5" r="0.95" fill="#60a5fa"/>
  <circle cx="6.5" cy="12.5" r="0.95" fill="#f59e0b"/>
  <circle cx="8.5" cy="7.5" r="0.95" fill="#a3e635"/>
</svg>`;
}

const ROUNDED = iconSvg(5.25);
// iOS masks home-screen icons itself and shows transparent corners as black.
const SQUARE = iconSvg(0);

async function toPng(svg: string, size: number): Promise<Buffer> {
  // Render the 24px artwork at the target size instead of upscaling a bitmap.
  return sharp(Buffer.from(svg), { density: (72 * size) / 24 })
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
// app/manifest.ts.
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await toPng(ROUNDED, size) }))
);

write(["app", "favicon.ico"], makeIco(icoPngs));
write(["app", "apple-icon.png"], await toPng(SQUARE, 180));
write(["public", "icon-192.png"], await toPng(ROUNDED, 192));
write(["public", "icon-512.png"], await toPng(ROUNDED, 512));
