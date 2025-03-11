import { AIModel } from "@/types";

export const models: AIModel[] = [
  {
    id: "replicate-interior-designer",
    name: "Interior Designer v1",
    description: "Transform your room with AI-powered interior design",
    requiresImage: true,
    requiresStyle: true,
    requiresRoomType: true,
    parameters: [
    //   {
    //     name: "prompt",
    //     type: "string",
    //     label: "Additional Prompt",
    //     description: "Additional details to guide the generation",
    //     default: "",
    //   },
    //   {
    //     name: "negative_prompt",
    //     type: "string",
    //     label: "Negative Prompt",
    //     description: "What to avoid in the generation",
    //     default: "bad quality, low quality, blurry",
    //   },
    //   {
    //     name: "num_inference_steps",
    //     type: "number",
    //     label: "Inference Steps",
    //     description: "Number of denoising steps (higher = better quality but slower)",
    //     default: 30,
    //     min: 1,
    //     max: 100,
    //     step: 1,
    //   },
    //   {
    //     name: "guidance_scale",
    //     type: "number",
    //     label: "Guidance Scale",
    //     description: "How much to follow the prompt (higher = more strict)",
    //     default: 7.5,
    //     min: 1,
    //     max: 20,
    //     step: 0.1,
    //   }
    ],
  },
  // Example of another model that could be added in the future
  {
    id: "replicate-interior-designer-v2",
    name: "Interior Designer v2",
    description: "Enhanced interior design model with better quality",
    requiresImage: true,
    requiresStyle: true,
    requiresRoomType: true,
    parameters: [
      {
        name: "prompt",
        type: "string",
        label: "Additional Prompt",
        description: "Additional details to guide the generation",
        default: "",
      },
      {
        name: "strength",
        type: "number",
        label: "Transformation Strength",
        description: "How much to change the original image",
        default: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
      }
    ],
  }
]; 