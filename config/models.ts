import { AIModel } from "@/types";

function controlnetpreprocessInput(input: any) {
  return {
    image: input.image,
    prompt: `A ${input.theme} ${input.room} Editorial Style Photo, Symmetry, Straight On, Modern Living Room, Large Window, Leather, Glass, Metal, Wood Paneling, Neutral Palette, Ikea, Natural Light, Apartment, Afternoon, Serene, Contemporary, 4k`,
    a_prompt: `best quality, extremely detailed, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning`,
    ...input.parameters
  };
}

export const models: AIModel[] = [
  {
    id: "replicate-jagilley-interior-designer",
    name: "Jagilley Interior Designer",
    description: "Transform your room with AI-powered interior design",
    requiresImage: true,
    requiresStyle: true,
    requiresRoomType: true,
    url: "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
    preprocessInput: controlnetpreprocessInput,
    preprocessOutput: (output: any) => ({
      output: output[1],
      mask: output[0]
    }),
    hasMask: true,
    parameters: [
      {
        name: "prompt",
        type: "string",
        label: "Additional Prompt",
        description: "Additional details to guide the generation",
        default: "",
        isAdvanced: true
      },
      {
        name: "negative_prompt",
        type: "string",
        label: "Negative Prompt",
        description: "What to avoid in the generation",
        default: "bad quality, low quality, blurry",
        isAdvanced: true
      },
      {
        name: "num_inference_steps",
        type: "number",
        label: "Inference Steps",
        description: "Number of denoising steps (higher = better quality but slower)",
        default: 30,
        min: 1,
        max: 100,
        step: 1,
        isAdvanced: true
      },
      {
        name: "guidance_scale",
        type: "number",
        label: "Guidance Scale",
        description: "How much to follow the prompt (higher = more strict)",
        default: 7.5,
        min: 1,
        max: 20,
        step: 0.1,
        isAdvanced: true
      }
    ],
  },
  {
    id: "replicate-adirik-interior-designer-v2",
    name: "Adirik Interior Design",
    description: "Enhanced interior design model with better quality",
    requiresImage: true,
    requiresStyle: true,
    requiresRoomType: true,
    url: "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
    preprocessInput: (input) => ({
      image: input.image,
      prompt: `A ${input.theme} ${input.room} interior design, high quality, photorealistic`,
    //   guidance_scale: 15,
    //   negative_prompt: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, realistic",
    //   prompt_strength: 0.9,
    //   num_inference_steps: 337,
      ...input.parameters
    }),
    preprocessOutput: (output: any) => ({
      output: output,
      mask: undefined
    }),
    hasMask: false,
    parameters: [
      {
        name: "prompt",
        type: "string",
        label: "Additional Prompt",
        description: "Additional details to guide the generation",
        default: "",
        isAdvanced: true
      },
      {
        name: "negative_prompt",
        type: "string",
        label: "Negative Prompt",
        description: "What to avoid in the generation",
        default: "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, extra, ugly, upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, realistic",
        isAdvanced: true
      },
      {
        name: "num_inference_steps",
        type: "number",
        label: "Inference Steps",
        description: "Number of denoising steps (higher = better quality but slower)",
        default: 337,
        min: 1,
        max: 100,
        step: 1,
        isAdvanced: true
      },
      {
        name: "prompt_strength",
        type: "number",
        label: "Prompt Strength",
        description: "How much to change the original image",
        default: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
        isAdvanced: true
      },
      {
        name: "guidance_scale",
        type: "number",
        label: "Guidance Scale",
        description: "How much to follow the prompt (higher = more strict)",
        default: 15,
        min: 1,
        max: 20,
        step: 0.1,
        isAdvanced: true
      }
    ],
  }
]; 