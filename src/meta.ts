import type { HtmlTagDescriptor } from 'vite';
import { AI_BOTS } from './presets.ts';
import type { MetaDirective, MetaInput, MetaTag, Preset } from './types.ts';
import { toArray } from './utils.ts';

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
 * - `'noindex'` → `[{ content: ['noindex'] }]`
 * - `['noindex', 'nofollow']` → `[{ content: ['noindex', 'nofollow'] }]`
 * - `MetaTag` → `[tag]`
 * - `MetaTag[]` → tags as-is
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

/** Convert normalized MetaTag[] into Vite HtmlTagDescriptor[] */
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
