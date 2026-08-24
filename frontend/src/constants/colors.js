// Static map so Tailwind's JIT scanner can see these exact class strings
// (constructing class names dynamically like `bg-${color}-50` would not
// be picked up by the scanner and would silently produce no styles).
export const COLOR_STYLES = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-500' },
  blue: { bg: 'bg-[#5B82C5]', text: 'text-[#5B82C5]', border: 'border-[#5B82C5]', dot: 'bg-[#5B82C5]' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', dot: 'bg-purple-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', dot: 'bg-rose-500' },
};
