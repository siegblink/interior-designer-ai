import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { models } from '@/config/models';

export async function POST(request: Request) {
  // 1. Get request data (in JSON format) from the client
  const req = await request.json();
  // console.log("🚀 ~ POST ~ req:", req)

  const { modelId, image, theme, room, parameters } = req;

  // Find the selected model
  const selectedModel = models.find(m => m.id === modelId);
  if (!selectedModel) {
    return NextResponse.json(
      { error: 'Invalid model ID' },
      { status: 400 }
    );
  }

  // 2. Initialize the replicate object with our Replicate API token
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN as string,
  });

  // 3. Preprocess the input using the model's preprocess function
  const input = selectedModel.preprocessInput ? 
    selectedModel.preprocessInput({ image, theme, room, parameters }) : 
    { image, theme, room, ...parameters };

  try {
    // 4. Run the model with the processed input
    const output = await replicate.run(selectedModel.url as `${string}/${string}:${string}`, { input });

    // 5. Check if the output is NULL then return error back to the client
    if (!output) {
      console.log('No output from model');
      return NextResponse.json(
        { error: 'No output from model' },
        { status: 500 }
      );
    }

    // 6. Return the output back to the client
    return NextResponse.json({ output }, { status: 201 });
  } catch (error) {
    console.error('Error running model:', error);
    return NextResponse.json(
      { error: 'Error running model' },
      { status: 500 }
    );
  }
}
