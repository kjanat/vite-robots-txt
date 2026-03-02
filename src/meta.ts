/**
 * Meta robots tag normalization and HTML generation.
 *
 * Converts the many shorthand forms of {@link MetaInput} into
 * Vite {@link HtmlTagDescriptor} objects for injection via `transformIndexHtml`.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
 * @module
 */

import type { HtmlTagDescriptor } from 'vite';
import { AI_BOTS } from './presets.ts';
import { type MetaDirective, type MetaInput, type MetaTag, type Preset, toArray } from './types.ts';

/**
 * Derive {@link MetaTag meta tags} from a {@link Preset}.
 *
 * @param preset - The preset to derive tags from.
 * @returns An array of meta tags matching the preset's intent.
 */
function presetMetaTags(preset: Preset): MetaTag[] {
	switch (preset) {
		case 'disallowAll':
			return [{ content: ['noindex', 'nofollow'] }];

		case 'blockAI':
			return AI_BOTS.map((bot) => ({
				name: bot,
				content: ['noindex', 'nofollow'],
			}));

		case 'searchOnly':
			return [{ content: ['index', 'follow'] }];

		case 'allowAll':
			return [{ content: ['index', 'follow'] }];

		default:
			return [];
	}
}

/**
 * Normalize the many shorthand forms of {@link MetaInput} into a flat {@link MetaTag MetaTag[]}.
 *
 * - `true` → derive from preset
 * - `'noindex'` → `[{ content: ['noindex'] }]`
 * - `['noindex', 'nofollow']` → `[{ content: ['noindex', 'nofollow'] }]`
 * - `MetaTag` → `[tag]`
 * - `MetaTag[]` → tags as-is
 *
 * @param input - The raw meta configuration from the user.
 * @param preset - Optional preset to derive tags from when `input` is `true`.
 * @returns Normalized array of {@link MetaTag} objects.
 *
 * @example
 * ```ts
 * import { normalizeMeta } from 'vite-robots-txt';
 *
 * normalizeMeta(true, 'blockAI');
 * // → [{ name: 'GPTBot', content: ['noindex', 'nofollow'] }, ...]
 *
 * normalizeMeta('noindex');
 * // → [{ content: ['noindex'] }]
 * ```
 */
function normalizeMeta(input: MetaInput, preset?: Preset): MetaTag[] {
	if (input === true) {
		return preset ? presetMetaTags(preset) : [{ content: ['index', 'follow'] }];
	}
	if (input === false) return [];

	// String → single global directive
	if (typeof input === 'string') {
		return [{ content: [input] }];
	}

	// Array — MetaDirective[] (strings) or MetaTag[] (objects)
	if (Array.isArray(input)) {
		if (input.length === 0) return [];
		if (typeof input[0] === 'string') {
			return [{ content: input as MetaDirective[] }];
		}
		return input as MetaTag[];
	}

	// Single MetaTag object (only remaining possibility)
	return [input];
}

/**
 * Convert normalized {@link MetaTag MetaTag[]} into Vite
 * {@link https://vite.dev/guide/api-plugin#transformindexhtml HtmlTagDescriptor[]}
 * for injection into `<head>`.
 *
 * @param tags - Normalized meta tags from {@link normalizeMeta}.
 * @returns Vite HTML tag descriptors ready for `transformIndexHtml`.
 *
 * @example
 * ```ts
 * import { metaTagsToHtml, normalizeMeta } from 'vite-robots-txt';
 *
 * const tags = normalizeMeta('noindex');
 * const html = metaTagsToHtml(tags);
 * // → [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' }, injectTo: 'head' }]
 * ```
 */
function metaTagsToHtml(tags: MetaTag[]): HtmlTagDescriptor[] {
	return tags.map((tag) => ({
		tag: 'meta',
		attrs: {
			name: tag.name ?? 'robots',
			content: toArray(tag.content).join(', '),
		},
		injectTo: 'head' as const,
	}));
}

export { metaTagsToHtml, normalizeMeta };
