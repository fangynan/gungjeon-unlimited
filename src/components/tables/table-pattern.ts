// src/components/tables/table-pattern.ts
// UI-only. A 64px seamless tile: lotus medallions on a diamond lattice (palace lattice work).
// Corner medallions are cut by the tile edge and completed by neighbouring tiles.

const PETALS = Array.from(
  { length: 8 },
  (_, k) => `<ellipse cx="0" cy="-6" rx="2.5" ry="4.5" transform="rotate(${k * 45})"/>`
).join("");

export function makeTilePattern(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<defs><g id="m" fill="none" stroke="${color}" stroke-width="0.8">` +
    `<circle r="1.6"/><circle r="10.5"/><circle r="14" stroke-dasharray="1.5 3"/>${PETALS}</g></defs>` +
    `<path d="M32 0L64 32L32 64L0 32Z" fill="none" stroke="${color}" stroke-width="0.6"/>` +
    `<use href="#m" x="32" y="32"/><use href="#m" x="0" y="0"/><use href="#m" x="64" y="0"/>` +
    `<use href="#m" x="0" y="64"/><use href="#m" x="64" y="64"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
