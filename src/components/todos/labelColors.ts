import type { LabelColor } from '@/types';

export const LABEL_COLOR_ORDER: LabelColor[] = [
  'blue', 'emerald', 'amber', 'rose', 'violet', 'slate', 'cyan', 'orange',
];

interface LabelColorMeta {
  /** full chip classes (bg + text), used on the Badge-style chip */
  chip: string;
  /** solid dot color, used in color pickers/menus */
  dot: string;
}

// NOTE: literal class strings only — never build these dynamically, or the
// JIT purge will drop them. The 5 accent-* tokens reuse the app theme vars;
// slate/cyan/orange fall back to stock Tailwind palette colors.
export const LABEL_COLORS: Record<LabelColor, LabelColorMeta> = {
  blue:    { chip: 'bg-accent-blue text-white',    dot: 'bg-accent-blue' },
  emerald: { chip: 'bg-accent-emerald text-white', dot: 'bg-accent-emerald' },
  amber:   { chip: 'bg-accent-amber text-white',   dot: 'bg-accent-amber' },
  rose:    { chip: 'bg-accent-rose text-white',     dot: 'bg-accent-rose' },
  violet:  { chip: 'bg-accent-violet text-white',  dot: 'bg-accent-violet' },
  slate:   { chip: 'bg-slate-600 text-white',      dot: 'bg-slate-600' },
  cyan:    { chip: 'bg-cyan-600 text-white',        dot: 'bg-cyan-600' },
  orange:  { chip: 'bg-orange-600 text-white',     dot: 'bg-orange-600' },
};

export function labelColorMeta(color: string): LabelColorMeta {
  return LABEL_COLORS[(color as LabelColor)] ?? LABEL_COLORS.blue;
}