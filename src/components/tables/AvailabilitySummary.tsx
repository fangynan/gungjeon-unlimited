// src/components/tables/AvailabilitySummary.tsx
export default function AvailabilitySummary({ available, total }: { available: number; total: number }) {
  return (
    <p className="flex items-baseline gap-2 text-sm text-paper/70">
      <span className="font-serif-display text-3xl leading-none tabular-nums text-emerald-300">{available}</span>
      <span>
        of {total} tables available
      </span>
    </p>
  );
}
