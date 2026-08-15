// Comparison sources are unlimited, the palette is not — colour classes cycle.
// The actual colours (and their dark-mode variants) live in App.css as
// --entity-c0..c9; must match PALETTE_SIZE.
export const PALETTE_SIZE = 10;

export function colorClass(idx) {
  return `c${idx % PALETTE_SIZE}`;
}
