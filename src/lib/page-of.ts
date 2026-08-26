/** SvelteKit `load` is typed as `void | data` because of redirect/error. */
export function pageOf<T>(data: T): Exclude<T, void> {
	if (data === undefined) throw new Error('load nevrátil dáta');
	return data as Exclude<T, void>;
}
