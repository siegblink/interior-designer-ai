import { Sparkles, Upload, Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const steps = [
  {
    icon: Upload,
    title: "Upload a room photo",
    description:
      "Start with any JPEG or PNG photo of your space — living room, bedroom, kitchen, bathroom, home office, dining room, or kids room. No professional photography needed.",
  },
  {
    icon: Wand2,
    title: "Choose a design style",
    description:
      "Pick from eight curated styles: Modern, Minimalist, Scandinavian, Industrial, Bohemian, Traditional, Coastal, or Mid-Century Modern. Adjust the style strength to stay close to your existing layout or go for a full AI makeover.",
  },
  {
    icon: Sparkles,
    title: "Generate and download",
    description:
      "Our AI redesigns your room in seconds using ControlNet. Compare the before and after side by side, then download the result or regenerate for a fresh take.",
  },
];

const styles = [
  {
    name: "Modern",
    description: "Clean lines, neutral tones, and uncluttered spaces.",
  },
  {
    name: "Scandinavian",
    description: "Warm minimalism with natural textures and cozy accents.",
  },
  {
    name: "Mid-Century Modern",
    description: "Retro silhouettes, organic shapes, and earthy palettes.",
  },
  {
    name: "Industrial",
    description: "Raw materials, exposed elements, and urban character.",
  },
  {
    name: "Bohemian",
    description: "Layered textiles, global patterns, and eclectic warmth.",
  },
  {
    name: "Coastal",
    description: "Breezy blues, natural fibers, and relaxed seaside living.",
  },
  {
    name: "Traditional",
    description: "Classic furniture, rich fabrics, and timeless elegance.",
  },
  {
    name: "Minimalist",
    description: "Only essentials — maximum calm, zero clutter.",
  },
];

export function SeoContent() {
  return (
    <section aria-label="How it works" className="space-y-12 pb-16">
      <Separator />

      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="text-muted-foreground text-sm">
            Redesign any room in three steps — no design experience required.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  0{i + 1}
                </span>
                <step.icon className="text-muted-foreground h-4 w-4" />
              </div>
              <h3 className="text-sm font-medium">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Design styles</h2>
          <p className="text-muted-foreground text-sm">
            Eight interior design aesthetics to transform your space. Each style
            is tuned to produce realistic, room-appropriate results using
            AI-powered image generation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {styles.map((style) => (
            <div key={style.name} className="space-y-1">
              <h3 className="text-sm font-medium">{style.name}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {style.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
