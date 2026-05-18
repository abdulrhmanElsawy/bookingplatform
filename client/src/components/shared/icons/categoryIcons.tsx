import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Dumbbell,
  HandMetal,
  HeartPulse,
  Medal,
  UserRound,
  UtensilsCrossed,
  Volleyball,
  Waves,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  gyms: Dumbbell,
  padel: Volleyball,
  boxing: HandMetal,
  swimming: Waves,
  activities: Medal,
  restaurants: UtensilsCrossed,
  'personal-training': UserRound,
  rehabilitation: HeartPulse,
};

export function CategoryIcon({
  slug,
  size = 18,
  ...props
}: { slug: string } & LucideProps) {
  const Icon = CATEGORY_ICON_MAP[slug] ?? Dumbbell;
  return <Icon size={size} strokeWidth={2} aria-hidden {...props} />;
}
