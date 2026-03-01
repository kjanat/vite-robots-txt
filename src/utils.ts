import type { OneOrMany } from './types.ts';

/** Normalize `OneOrMany<T>` to `T[]` */
export function toArray<T>(value: OneOrMany<T> | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}
