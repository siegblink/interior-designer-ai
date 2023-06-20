import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  // 1. Get request data (in JSON format) from the client
  const req = await request.json();

  const image = req.image;
  const theme = req.theme;
  const room = req.room;

  // 2. Initialize the replicate object with our Replicate API token
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  // 3. Set the model that we're about to run
  const model =
    'jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b';

  // 4. Set the image which is the image we uploaded from the client
  const input = {
    image,
    prompt: `A ${theme} ${room} Editorial Style Photo, Symmetry, Straight On, Modern Living Room, Large Window, Leather, Glass, Metal, Wood Paneling, Neutral Palette, Ikea, Natural Light, Apartment, Afternoon, Serene, Contemporary, 4k`,
    a_prompt: `best quality, extremely detailed, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning`,
  };

  // 5. Run the Replicate's model (to remove background) and get the output image
  const output = await replicate.run(model, { input });

  // 6. Check if the output is NULL then return error back to the client
  if (!output) {
    console.log('Something went wrong');
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }

  // 7. Otherwise, we show output in the console (server-side)
  //  and return the output back to the client
  console.log('Output', output);
  return NextResponse.json({ output }, { status: 201 });
}
