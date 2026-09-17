import type { KnowledgeTone } from "@/features/knowledge/data/knowledge-data";

type DetailToneClass = {
  border: string;
  focus: string;
  icon: string;
  pill: string;
  text: string;
};

export const DETAIL_TONE_CLASSES: Record<KnowledgeTone, DetailToneClass> = {
  red: { border: "border-city-600/25", icon: "bg-city-600", text: "text-city-600", pill: "border-city-600/25 bg-city-600/5 text-city-600", focus: "border-city-600/30 focus:border-city-600 focus:ring-city-600/10" },
  green: { border: "border-jade-500/25", icon: "bg-jade-500", text: "text-jade-500", pill: "border-jade-500/25 bg-jade-500/5 text-jade-500", focus: "border-jade-500/30 focus:border-jade-500 focus:ring-jade-500/10" },
  blue: { border: "border-atlas-500/25", icon: "bg-atlas-500", text: "text-atlas-500", pill: "border-atlas-500/25 bg-atlas-500/5 text-atlas-500", focus: "border-atlas-500/30 focus:border-atlas-500 focus:ring-atlas-500/10" },
  gold: { border: "border-gold-700/25", icon: "bg-gold-700", text: "text-gold-700", pill: "border-gold-700/25 bg-gold-700/5 text-gold-700", focus: "border-gold-700/30 focus:border-gold-700 focus:ring-gold-700/10" },
  purple: { border: "border-scholar-500/25", icon: "bg-scholar-500", text: "text-scholar-500", pill: "border-scholar-500/25 bg-scholar-500/5 text-scholar-500", focus: "border-scholar-500/30 focus:border-scholar-500 focus:ring-scholar-500/10" },
};

export const RIVER_TONE_CLASSES = {
  atlas: {
    badge: "bg-atlas-500",
    card: "border-atlas-500/25 bg-paper-100/90 bg-river-atlas",
    divider: "border-atlas-500/15",
    link: "text-atlas-500",
    marker: "bg-atlas-500",
    mnemonic: "border-atlas-500/35 bg-atlas-200/65 text-atlas-500",
    route: "before:from-atlas-500 before:to-atlas-200",
    text: "text-atlas-500",
  },
  gold: {
    badge: "bg-gold-700",
    card: "border-gold-700/25 bg-paper-100/90 bg-river-gold",
    divider: "border-gold-700/15",
    link: "text-gold-700",
    marker: "bg-gold-700",
    mnemonic: "border-gold-700/35 bg-gold-300/65 text-gold-700",
    route: "before:from-gold-700 before:to-gold-300",
    text: "text-gold-700",
  },
} as const;
