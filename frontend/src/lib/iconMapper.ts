import {
  Award, Zap, CloudRain, Target, TrendingUp, Medal,
  Trophy, Shield, Star, Crown, Flame, Heart, ThumbsUp,
  Flag, Timer, Rocket, type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  zap: Zap,
  "cloud-rain": CloudRain,
  target: Target,
  "trending-up": TrendingUp,
  medal: Medal,
  trophy: Trophy,
  shield: Shield,
  star: Star,
  crown: Crown,
  flame: Flame,
  heart: Heart,
  "thumbs-up": ThumbsUp,
  flag: Flag,
  timer: Timer,
  rocket: Rocket,
};

export const AVAILABLE_ICONS = Object.keys(iconMap);

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Award;
}

export const AVAILABLE_COLORS = [
  "yellow", "cyan", "green", "orange", "purple", "red", "blue", "pink",
] as const;

export function getColorClasses(color: string): { text: string; bg: string } {
  const map: Record<string, { text: string; bg: string }> = {
    yellow: { text: "text-racing-yellow", bg: "bg-racing-yellow/20" },
    cyan: { text: "text-racing-cyan", bg: "bg-racing-cyan/20" },
    green: { text: "text-racing-green", bg: "bg-racing-green/20" },
    orange: { text: "text-racing-orange", bg: "bg-racing-orange/20" },
    purple: { text: "text-racing-purple", bg: "bg-racing-purple/20" },
    red: { text: "text-racing-red", bg: "bg-racing-red/20" },
    blue: { text: "text-primary", bg: "bg-primary/20" },
    pink: { text: "text-pink-400", bg: "bg-pink-400/20" },
  };
  return map[color] || map.yellow;
}
