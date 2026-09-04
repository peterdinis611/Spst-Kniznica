export async function register() {
	// Workers start from the Node hall (ensureHall), not Edge instrumentation.
	// pg-boss → pg → fs cannot land in the Edge instrumentation bundle.
}
