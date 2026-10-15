// src/components/tables/FilterPill.tsx
export default function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] transition-[background-color,border-color,color,transform] duration-100 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-95 ${
        active
          ? "border-gold bg-gold text-ink"
          : "border-gold/30 text-paper/75 hover:border-gold hover:text-gold"
      }`}
    >
      {label}
    </button>
  );
}
