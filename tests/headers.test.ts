import { describe, expect, it, mock } from 'bun:test';
import {
	flatFile,
	generateHeaderOutputs,
	resolveHeaderRules,
	serializeFlatFile,
	serializeVercelJson,
	vercelJson,
} from '../src/headers.ts';

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

describe('serializeVercelJson', () => {
	it('converts wildcard patterns for vercel.json', () => {
		const warn = mock((_message: string) => {});
		const out = serializeVercelJson([{ pattern: '/static/*', directives: ['noindex'] }], warn);

		expect(out).toContain('"source": "/static/(.*)"');
		expect(out).toContain('"key": "X-Robots-Tag"');
		expect(out).toContain('"value": "noindex"');
		expect(warn).not.toHaveBeenCalled();
	});

	it('strips host for absolute patterns and warns', () => {
		const warn = mock((_message: string) => {});
		const out = serializeVercelJson([{ pattern: 'https://example.pages.dev/*', directives: ['noindex'] }], warn);

		expect(out).toContain('"source": "/(.*)"');
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it('skips unsupported non-path patterns and warns', () => {
		const warn = mock((_message: string) => {});
		const out = serializeVercelJson([{ pattern: 'docs/*', directives: ['noindex'] }], warn);

		expect(out).toContain('"headers": []');
		expect(warn).toHaveBeenCalledWith(
			'[vite-robots-txt] vercel provider skipped unsupported pattern "docs/*".',
		);
	});

	it('keeps non-wildcard paths and merges repeated sources', () => {
		const warn = mock((_message: string) => {});
		const out = serializeVercelJson([
			{ pattern: '/docs', directives: ['noindex'] },
			{ pattern: '/docs', directives: ['nofollow'], userAgent: 'Googlebot' },
		], warn);

		expect(out).toContain('"source": "/docs"');
		expect(out).toContain('"value": "noindex"');
		expect(out).toContain('"value": "Googlebot: nofollow"');
		expect(warn).not.toHaveBeenCalled();
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

	it('auto-detects Vercel to vercel.json', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			[{ pattern: '/*', directives: 'noindex' }],
			{ env: { VERCEL: '1' }, warn },
		);

		expect(outputs).toHaveLength(1);
		expect(outputs[0]?.fileName).toBe('vercel.json');
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
				provider: [flatFile({ fileName: 'custom-headers.txt' }), vercelJson({ fileName: 'custom-vercel.json' })],
				autoDetect: false,
			},
			{ env: { CF_PAGES: '1', VERCEL: '1' }, warn },
		);

		expect(outputs).toHaveLength(2);
		expect(outputs.map((output) => output.fileName)).toEqual(['custom-headers.txt', 'custom-vercel.json']);
	});

	it('does not auto-detect when explicit provider is set', () => {
		const warn = mock((_message: string) => {});
		const outputs = generateHeaderOutputs(
			{
				rules: [{ pattern: '/*', directives: 'noindex' }],
				provider: 'flatFile',
			},
			{ env: { VERCEL: '1' }, warn },
		);

		expect(outputs).toHaveLength(1);
		expect(outputs[0]?.fileName).toBe('_headers');
	});
});
