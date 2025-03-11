import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'assets');
    
    // Check if directory exists
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json({ images: [] });
    }

    // Read directory and filter for image files
    const files = fs.readdirSync(publicDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    // Sort files naturally (so example1.jpg comes before example10.jpg)
    imageFiles.sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Convert to full paths relative to public directory
    const images = imageFiles.map(file => `/assets/${file}`);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing example images:', error);
    return NextResponse.json({ error: 'Failed to list example images' }, { status: 500 });
  }
} 