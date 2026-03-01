import type { HtmlTagDescriptor } from 'vite';
import { AI_BOTS } from './presets.js';
import type { MetaDirective, MetaInput, MetaTag, OneOrMany, Preset } from './types.js';

/** Normalize `OneOrMany<T>` to `T[]` */
function toArray<T>(value: OneOrMany<T> | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

/** Check if a value is a MetaTag object (has `content` property) */
function isMetaTag(value: unknown): value is MetaTag {
	return typeof value === 'object' && value !== null && 'content' in value;
}

/** Derive meta tags from a preset */
function presetMetaTags(preset: Preset): MetaTag[] {
	switch (preset) {
		case 'disallowAll':
			return [{ content: ['noindex', 'nofollow'] }];

		case 'blockAI':
			return AI_BOTS.map((bot) => ({
				name: bot as MetaTag['name'],
				content: ['noindex', 'nofollow'] as MetaDirective[],
			}));

		case 'searchOnly':
			// Block indexing by default, allow only search engines
			return [{ content: ['noindex', 'nofollow'] }];

		case 'allowAll':
			return [{ content: ['index', 'follow'] }];

		default:
			return [];
	}
}

/**
 * Normalize the many shorthand forms of `MetaInput` into a flat `MetaTag[]`.
 *
 * - `true` → derive from preset
 * - `'noindex'` → `[{ name: 'robots', content: ['noindex'] }]`
 * - `['noindex', 'nofollow']` → `[{ name: 'robots', content: ['noindex', 'nofollow'] }]`
 * - `MetaTag` → `[tag]`
 * - `MetaTag[]` → tags as-is
 */
function normalizeMeta(input: MetaInput, preset?: Preset): MetaTag[] {
	// Boolean: derive from preset
	if (input === true) {
		if (!preset) return [{ content: ['index', 'follow'] }];
		return presetMetaTags(preset);
	}
	if (input === false) return [];

	// String: single global directive
	if (typeof input === 'string') {
		return [{ content: [input] }];
	}

	// Array — could be MetaDirective[] or MetaTag[]
	if (Array.isArray(input)) {
		// If first element is a string, treat entire array as directives
		if (input.length === 0) return [];
		if (typeof input[0] === 'string') {
			return [{ content: input as MetaDirective[] }];
		}
		// Otherwise it's MetaTag[]
		return input as MetaTag[];
	}

	// Single MetaTag object
	if (isMetaTag(input)) {
		return [input];
	}

	return [];
}

/** Convert normalized MetaTag[] into Vite HtmlTagDescriptor[] */
function metaTagsToHtml(tags: MetaTag[]): HtmlTagDescriptor[] {
	return tags.map((tag) => {
		const name = tag.name ?? 'robots';
		const directives = toArray(tag.content);
		return {
			tag: 'meta',
			attrs: {
				name,
				content: directives.join(', '),
			},
			injectTo: 'head' as const,
		};
	});
}

export { metaTagsToHtml, normalizeMeta, presetMetaTags };
