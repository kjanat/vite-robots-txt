import { describe, expect, it } from 'vitest';
import { metaTagsToHtml, normalizeMeta } from '../meta.ts';
import { AI_BOTS } from '../presets.ts';

describe('normalizeMeta', () => {
	describe('boolean shorthand', () => {
		it('meta: false returns empty', () => {
			expect(normalizeMeta(false)).toEqual([]);
		});

		it('meta: true without preset defaults to index/follow', () => {
			const tags = normalizeMeta(true);
			expect(tags).toEqual([{ content: ['index', 'follow'] }]);
		});

		it('meta: true with blockAI generates noindex tag per AI bot', () => {
			const tags = normalizeMeta(true, 'blockAI');
			expect(tags).toHaveLength(AI_BOTS.length);
			for (const tag of tags) {
				expect(tag.content).toEqual(['noindex', 'nofollow']);
				expect(AI_BOTS).toContain(tag.name);
			}
		});

		it('meta: true with disallowAll generates global noindex', () => {
			const tags = normalizeMeta(true, 'disallowAll');
			expect(tags).toEqual([{ content: ['noindex', 'nofollow'] }]);
		});

		it('meta: true with allowAll generates global index/follow', () => {
			const tags = normalizeMeta(true, 'allowAll');
			expect(tags).toEqual([{ content: ['index', 'follow'] }]);
		});

		it('meta: true with searchOnly generates global noindex', () => {
			const tags = normalizeMeta(true, 'searchOnly');
			expect(tags).toEqual([{ content: ['noindex', 'nofollow'] }]);
		});
	});

	describe('string shorthand', () => {
		it('single directive string becomes global robots tag', () => {
			const tags = normalizeMeta('noindex');
			expect(tags).toEqual([{ content: ['noindex'] }]);
		});
	});

	describe('directive array shorthand', () => {
		it('string array becomes single robots tag with multiple directives', () => {
			const tags = normalizeMeta(['noindex', 'nofollow', 'noarchive']);
			expect(tags).toEqual([{ content: ['noindex', 'nofollow', 'noarchive'] }]);
		});

		it('empty array returns empty', () => {
			expect(normalizeMeta([])).toEqual([]);
		});
	});

	describe('MetaTag object', () => {
		it('single MetaTag wraps in array', () => {
			const tag = { name: 'GPTBot' as const, content: 'noindex' as const };
			const tags = normalizeMeta(tag);
			expect(tags).toEqual([tag]);
		});

		it('MetaTag without name defaults to robots in HTML output', () => {
			const tags = normalizeMeta({ content: 'noindex' });
			expect(tags).toEqual([{ content: 'noindex' }]);
			// name defaults to 'robots' at HTML render time, not normalization
		});
	});

	describe('MetaTag array', () => {
		it('multiple MetaTags pass through', () => {
			const input = [
				{ content: ['index', 'follow'] as const },
				{ name: 'GPTBot' as const, content: 'noindex' as const },
				{ name: 'Google-Extended' as const, content: ['noindex', 'nofollow'] as const },
			];
			const tags = normalizeMeta(input);
			expect(tags).toEqual(input);
		});
	});
});

describe('metaTagsToHtml', () => {
	it('generates correct HTML tag descriptor', () => {
		const html = metaTagsToHtml([{ content: ['noindex', 'nofollow'] }]);
		expect(html).toEqual([
			{
				tag: 'meta',
				attrs: { name: 'robots', content: 'noindex, nofollow' },
				injectTo: 'head',
			},
		]);
	});

	it('uses custom bot name', () => {
		const html = metaTagsToHtml([{ name: 'GPTBot', content: 'noindex' }]);
		expect(html).toEqual([
			{
				tag: 'meta',
				attrs: { name: 'GPTBot', content: 'noindex' },
				injectTo: 'head',
			},
		]);
	});

	it('generates multiple tags for multiple bots', () => {
		const html = metaTagsToHtml([
			{ name: 'GPTBot', content: 'noindex' },
			{ name: 'ClaudeBot', content: ['noindex', 'nofollow'] },
		]);
		expect(html).toHaveLength(2);
		expect(html[0]?.attrs).toEqual({ name: 'GPTBot', content: 'noindex' });
		expect(html[1]?.attrs).toEqual({ name: 'ClaudeBot', content: 'noindex, nofollow' });
	});

	it('returns empty array for no tags', () => {
		expect(metaTagsToHtml([])).toEqual([]);
	});

	it('blockAI preset meta covers all known AI bots', () => {
		const tags = normalizeMeta(true, 'blockAI');
		const html = metaTagsToHtml(tags);
		const names = html.map((h) => h.attrs?.['name']);

		// Every AI bot should have a meta tag
		for (const bot of AI_BOTS) {
			expect(names).toContain(bot);
		}

		// All should be noindex, nofollow
		for (const tag of html) {
			expect(tag.attrs?.['content']).toBe('noindex, nofollow');
		}
	});

	it('handles max-snippet directive correctly', () => {
		const html = metaTagsToHtml([{ content: ['noindex', 'max-snippet:150'] }]);
		expect(html[0]?.attrs?.['content']).toBe('noindex, max-snippet:150');
	});

	it('handles max-image-preview directive correctly', () => {
		const html = metaTagsToHtml([{ content: 'max-image-preview:large' }]);
		expect(html[0]?.attrs?.['content']).toBe('max-image-preview:large');
	});
});
