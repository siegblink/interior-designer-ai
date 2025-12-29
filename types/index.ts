export type RoomType =
  | "Living Room"
  | "Bedroom"
  | "Bathroom"
  | "Kitchen"
  | "Dining Room"
  | "Home Office"
  | "Kids Room";

export type DesignTheme =
  | "Modern"
  | "Minimalist"
  | "Scandinavian"
  | "Industrial"
  | "Bohemian"
  | "Traditional"
  | "Coastal"
  | "Mid-Century Modern";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}
