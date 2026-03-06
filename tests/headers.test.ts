import { describe, expect, it, mock } from 'bun:test';
import { flatFile, generateHeaderOutputs, resolveHeaderRules, serializeFlatFile } from '../src/headers.ts';

describe('resolveHeaderRules', () => {
	it('normalizes OneOrMany directives', () => {
		const warn = mock((_message: string) => {});
		const rules = resolveHeaderRules({ pattern: '/*', directives: 'noindex' }, warn);
		expect(rules).toEqual([{ pattern: '/*', directives: ['noindex'], userAgent: undefined }]);
		expect(warn).not.toHaveBeenCalled();
	});

	it('skips invalid rules and warns', () => {
		const warn = mock((_message: string) => {});
		const rules = resolveHeaderRules([
			{ pattern: '   ', directives: 'noindex' },
			{ pattern: '/ok', directives: [] },
			{ pattern: '/ok', directives: 'nofollow' },
		], warn);

		expect(rules).toEqual([{ pattern: '/ok', directives: ['nofollow'], userAgent: undefined }]);
		expect(warn).toHaveBeenCalledTimes(2);
	});
});

describe('serializeFlatFile', () => {
	it('serializes grouped _headers blocks', () => {
		const out = serializeFlatFile([
			{ pattern: '/static/*', directives: ['nosnippet'] },
			{ pattern: '/static/*', directives: ['noindex'], userAgent: 'Googlebot' },
			{ pattern: 'https://example.pages.dev/*', directives: ['noindex'] },
		]);

		expect(out).toBe(
			'/static/*\n'
				+ '  X-Robots-Tag: nosnippet\n'
				+ '  X-Robots-Tag: Googlebot: noindex\n\n'
				+ 'https://example.pages.dev/*\n'
				+ '  X-Robots-Tag: noindex\n',
		);
	});
});

describe('generateHeaderOutputs', () => {
	it('auto-detects Cloudflare/Netlify to _headers', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			[{ pattern: '/*', directives: 'noindex' }],
			{ env: { CF_PAGES: '1' }, warn },
		);

		expect(outputs).toHaveLength(1);
		expect(outputs[0]).toEqual({
			fileName: '_headers',
			source: '/*\n  X-Robots-Tag: noindex\n',
		});
	});

	it('auto-detects Cloudflare Workers to _headers', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			[{ pattern: '/*', directives: 'noindex' }],
			{ env: { CF_WORKERS: '1' }, warn },
		);

		expect(outputs[0]?.fileName).toBe('_headers');
	});

	it('falls back to flatFile when auto-detect finds nothing', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			[{ pattern: '/*', directives: 'noindex' }],
			{ env: {}, warn },
		);

		expect(outputs[0]?.fileName).toBe('_headers');
		expect(warn).toHaveBeenCalledWith(
			'[vite-robots-txt] headers provider auto-detect found none. defaulting to flatFile (_headers).',
		);
	});

	it('accepts explicit provider callbacks and disables auto-detect', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			{
				rules: [{ pattern: '/docs/*', directives: 'nosnippet' }],
				provider: [
					flatFile({ fileName: 'custom-headers-a.txt' }),
					flatFile({ fileName: 'custom-headers-b.txt' }),
				],
				autoDetect: false,
			},
			{ env: { CF_PAGES: '1' }, warn },
		);

		expect(outputs).toHaveLength(2);
		expect(outputs.map((output) => output.fileName)).toEqual(['custom-headers-a.txt', 'custom-headers-b.txt']);
	});

	it('does not auto-detect when explicit provider is set', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			{
				rules: [{ pattern: '/*', directives: 'noindex' }],
				provider: 'flatFile',
			},
			{ env: { CF_PAGES: '1' }, warn },
		);

		expect(outputs).toHaveLength(1);
		expect(outputs[0]?.fileName).toBe('_headers');
	});
});
