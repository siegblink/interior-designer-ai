import type { DesignTheme, RoomType } from "@/types";

const THEME_KEYWORDS: Record<DesignTheme, string> = {
  Modern:
    "Glass, Steel, Concrete, Clean Lines, Geometric Shapes, Neutral Palette, Open Plan, Polished Surfaces, Contemporary",
  Minimalist:
    "White Walls, Natural Wood, Clutter-free, Functional, Simple Forms, Muted Tones, Sparse Decor, Zen, Negative Space",
  Scandinavian:
    "Light Oak Wood, Wool Textiles, Hygge, Warm Neutrals, Natural Light, Cozy, Simple Furniture, White and Beige, Nordic",
  Industrial:
    "Exposed Brick, Raw Steel, Concrete Floors, Dark Metal, Edison Bulbs, Weathered Wood, Urban Loft, Pipe Details",
  Bohemian:
    "Rattan Furniture, Macrame, Colorful Textiles, Mixed Patterns, Layered Rugs, Indoor Plants, Eclectic, Warm Earth Tones",
  Traditional:
    "Dark Wood, Upholstered Furniture, Crown Molding, Symmetry, Rich Colors, Formal, Antique Accents, Wainscoting, Classic",
  Coastal:
    "Whitewashed Wood, Linen, Natural Fibers, Blue and White Palette, Airy, Nautical, Driftwood, Breezy, Sea Glass",
  "Mid-Century Modern":
    "Walnut Wood, Brass Accents, Velvet, Organic Shapes, Tapered Legs, Retro, Bold Color Accents, Eames Era, 1950s 1960s",
};

const ROOM_CONTEXT: Record<RoomType, string> = {
  "Living Room": "Sofa, Coffee Table, Lounge, Gathering Space, Large Window",
  Bedroom: "Bed, Nightstand, Dresser, Restful, Private, Soft Lighting",
  Bathroom: "Vanity, Tiles, Spa-like, Fixtures, Clean, Calm",
  Kitchen: "Cabinets, Countertop, Appliances, Functional, Cooking Space",
  "Dining Room": "Dining Table, Chairs, Chandelier, Entertaining, Formal",
  "Home Office": "Desk, Chair, Shelving, Productive, Focused, Well-lit",
  "Kids Room":
    "Playful, Colorful, Safe, Fun, Child-friendly, Bunk Bed, Storage",
};

export function buildPrompt(theme: DesignTheme, room: RoomType): string {
  return `A ${theme} ${room}, ${THEME_KEYWORDS[theme]}, ${ROOM_CONTEXT[room]}, Editorial Style Photo, Natural Light, 4k, Symmetry, Straight On`;
}

export const QUALITY_PROMPT =
  "best quality, extremely detailed, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning";

export const NEGATIVE_PROMPT =
  "longbody, lowres, bad anatomy, missing furniture, extra objects, cropped, worst quality, low quality, blurry, deformed, ugly";
