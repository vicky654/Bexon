// Staggered data-wow-delay values for lists of cards/items, e.g.
// delay(0) -> ".2s", delay(1) -> ".3s". Capped so long lists don't make the
// last items wait noticeably.
export function delay(idx, base = 0.2, step = 0.1, max = 0.8) {
	const value = Math.min(base + idx * step, max);
	return `${value.toFixed(1)}s`;
}
