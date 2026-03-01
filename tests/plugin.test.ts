import { describe, expect, it, mock } from 'bun:test';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ResolvedConfig } from 'vite';
import { robotsTxt } from '../src/plugin.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeConfig(base = '/'): ResolvedConfig {
	return { base } as ResolvedConfig;
}

/**
 * Extract a hook function from the plugin object.
 * Plugin hooks in Vite can be plain functions or `{ handler, order }` objects —
 * we only use plain functions, so a simple property access suffices.
 */
function hook(plugin: ReturnType<typeof robotsTxt>, name: string) {
	// biome-ignore lint/suspicious/noExplicitAny: test helper accessing dynamic hook names
	return (plugin as Record<string, any>)[name];
}

function setupWithConfig(options: Parameters<typeof robotsTxt>[0] = {}, base = '/') {
	const plugin = robotsTxt(options);
	hook(plugin, 'configResolved')(fakeConfig(base));
	return plugin;
}

/** Invoke a connect-style middleware handler and capture the response */
function callMiddleware(
	handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
	url: string,
) {
	const req = { url } as IncomingMessage;
	let endBody: string | undefined;
	const setHeader = mock((_k: string, _v: string) => {});
	const end = mock((body?: string) => {
		endBody = body;
	});
	const res = { setHeader, end } as unknown as ServerResponse;
	const next = mock(() => {});
	handler(req, res, next);
	return { endBody, res: { setHeader, end }, next };
}

type MiddlewareHandler = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

/** Get the middleware handler registered on a fake server */
function getMiddlewareHandler(
	plugin: ReturnType<typeof robotsTxt>,
	hookName = 'configureServer',
): MiddlewareHandler | undefined {
	// biome-ignore lint/suspicious/noExplicitAny: capturing untyped middleware registration
	let captured: any;
	const use = mock((fn: unknown) => {
		captured = fn;
	});
	const server = { middlewares: { use } };
	hook(plugin, hookName)(server);
	return captured as MiddlewareHandler | undefined;
}

// ---------------------------------------------------------------------------
// matchPath (tested indirectly via middleware)
// ---------------------------------------------------------------------------

describe('middleware path matching', () => {
	it('matches exact path', () => {
		const plugin = setupWithConfig();
		const handler = getMiddlewareHandler(plugin);
		expect(handler).toBeDefined();

		const { res, next } = callMiddleware(handler!, '/robots.txt');
		expect(next).not.toHaveBeenCalled();
		expect(res.end).toHaveBeenCalledWith(expect.stringContaining('User-agent: *'));
	});

	it('strips query string before matching', () => {
		const plugin = setupWithConfig();
		const handler = getMiddlewareHandler(plugin)!;

		const { res, next } = callMiddleware(handler, '/robots.txt?v=1');
		expect(next).not.toHaveBeenCalled();
		expect(res.end).toHaveBeenCalled();
	});

	it('calls next() for non-matching paths', () => {
		const plugin = setupWithConfig();
		const handler = getMiddlewareHandler(plugin)!;

		const { next } = callMiddleware(handler, '/index.html');
		expect(next).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// configureServer / configurePreviewServer
// ---------------------------------------------------------------------------

describe('configureServer', () => {
	it('registers middleware by default', () => {
		const plugin = setupWithConfig();
		const use = mock(() => {});
		hook(plugin, 'configureServer')({ middlewares: { use } });
		expect(use).toHaveBeenCalledTimes(1);
	});

	it('skips middleware when devMode: false', () => {
		const plugin = setupWithConfig({ devMode: false });
		const use = mock(() => {});
		hook(plugin, 'configureServer')({ middlewares: { use } });
		expect(use).not.toHaveBeenCalled();
	});

	it('serves Disallow: / in default devMode', () => {
		const plugin = setupWithConfig();
		const handler = getMiddlewareHandler(plugin)!;

		const { res } = callMiddleware(handler, '/robots.txt');
		expect(res.end).toHaveBeenCalledWith('User-agent: *\nDisallow: /\n');
	});

	it('serves full content when devMode: same', () => {
		const plugin = setupWithConfig({ devMode: 'same', preset: 'allowAll' });
		const handler = getMiddlewareHandler(plugin)!;

		const { res } = callMiddleware(handler, '/robots.txt');
		expect(res.end).toHaveBeenCalledWith('User-agent: *\nAllow: /\n');
	});

	it('sets correct Content-Type and Cache-Control headers', () => {
		const plugin = setupWithConfig();
		const handler = getMiddlewareHandler(plugin)!;

		const { res } = callMiddleware(handler, '/robots.txt');
		expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
		expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
	});
});

describe('configurePreviewServer', () => {
	it('registers middleware by default', () => {
		const plugin = setupWithConfig();
		const use = mock(() => {});
		hook(plugin, 'configurePreviewServer')({ middlewares: { use } });
		expect(use).toHaveBeenCalledTimes(1);
	});

	it('skips middleware when devMode: false', () => {
		const plugin = setupWithConfig({ devMode: false });
		const use = mock(() => {});
		hook(plugin, 'configurePreviewServer')({ middlewares: { use } });
		expect(use).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// config.base handling (M3)
// ---------------------------------------------------------------------------

describe('config.base integration', () => {
	it('serves at base path when config.base is set', () => {
		const plugin = setupWithConfig({}, '/app/');
		const handler = getMiddlewareHandler(plugin)!;

		// Should match at /app/robots.txt
		const { res: matched } = callMiddleware(handler, '/app/robots.txt');
		expect(matched.end).toHaveBeenCalled();

		// Should NOT match at /robots.txt
		const { next: skipped } = callMiddleware(handler, '/robots.txt');
		expect(skipped).toHaveBeenCalled();
	});

	it('handles trailing slash normalization in base', () => {
		const plugin = setupWithConfig({}, '/app');
		const handler = getMiddlewareHandler(plugin)!;

		const { res } = callMiddleware(handler, '/app/robots.txt');
		expect(res.end).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// devMode: 'same' with sitemap resolution (M4)
// ---------------------------------------------------------------------------

describe('devMode same with sitemap: true', () => {
	it('resolves sitemap path using siteBase', () => {
		const plugin = setupWithConfig({
			devMode: 'same',
			preset: 'allowAll',
			sitemap: true,
		});
		const handler = getMiddlewareHandler(plugin)!;

		const { endBody } = callMiddleware(handler, '/robots.txt');
		expect(endBody).toContain('Sitemap: /sitemap.xml');
	});

	it('resolves sitemap with non-root base', () => {
		const plugin = setupWithConfig({
			devMode: 'same',
			preset: 'allowAll',
			sitemap: true,
		}, '/app/');
		const handler = getMiddlewareHandler(plugin)!;

		const { endBody } = callMiddleware(handler, '/app/robots.txt');
		expect(endBody).toContain('Sitemap: /app/sitemap.xml');
	});
});

// ---------------------------------------------------------------------------
// transformIndexHtml
// ---------------------------------------------------------------------------

describe('transformIndexHtml', () => {
	it('returns empty array when no meta configured', () => {
		const plugin = setupWithConfig();
		expect(hook(plugin, 'transformIndexHtml')()).toEqual([]);
	});

	it('returns meta tags when meta is configured', () => {
		const plugin = setupWithConfig({ meta: 'noindex' });
		const tags = hook(plugin, 'transformIndexHtml')();
		expect(tags).toHaveLength(1);
		expect(tags[0]).toEqual({
			tag: 'meta',
			attrs: { name: 'robots', content: 'noindex' },
			injectTo: 'head',
		});
	});

	it('returns preset-derived meta tags', () => {
		const plugin = setupWithConfig({ preset: 'blockAI', meta: true });
		const tags = hook(plugin, 'transformIndexHtml')();
		expect(tags.length).toBeGreaterThan(0);
		expect(tags[0]).toMatchObject({ tag: 'meta', injectTo: 'head' });
	});
});

// ---------------------------------------------------------------------------
// generateBundle
// ---------------------------------------------------------------------------

interface EmittedAsset {
	type: string;
	fileName: string;
	source: string;
}

/** Create a fake Rollup plugin context that captures emitFile/warn calls */
function fakeBundleCtx() {
	const captured: { emitted?: EmittedAsset; warned?: string } = {};
	const ctx = {
		warn: mock((msg: string) => {
			captured.warned = msg;
		}),
		emitFile: mock((asset: EmittedAsset) => {
			captured.emitted = asset;
		}),
	};
	return { ctx, captured };
}

describe('generateBundle', () => {
	it('emits robots.txt asset', () => {
		const plugin = setupWithConfig({ preset: 'allowAll' });
		const { ctx, captured } = fakeBundleCtx();
		hook(plugin, 'generateBundle').call(ctx);

		expect(ctx.emitFile).toHaveBeenCalledTimes(1);
		expect(captured.emitted).toEqual({
			type: 'asset',
			fileName: 'robots.txt',
			source: 'User-agent: *\nAllow: /\n',
		});
	});

	it('uses custom fileName', () => {
		const plugin = setupWithConfig({ fileName: 'custom-robots.txt', preset: 'allowAll' });
		const { ctx, captured } = fakeBundleCtx();
		hook(plugin, 'generateBundle').call(ctx);

		expect(captured.emitted?.fileName).toBe('custom-robots.txt');
	});

	it('resolves sitemap: true with warning', () => {
		const plugin = setupWithConfig({ preset: 'allowAll', sitemap: true });
		const { ctx, captured } = fakeBundleCtx();
		hook(plugin, 'generateBundle').call(ctx);

		expect(captured.warned).toContain('sitemap: true');
		expect(captured.emitted?.source).toContain('Sitemap: /sitemap.xml');
	});

	it('resolves sitemap: true with siteBase', () => {
		const plugin = setupWithConfig({ preset: 'allowAll', sitemap: true }, '/app/');
		const { ctx, captured } = fakeBundleCtx();
		hook(plugin, 'generateBundle').call(ctx);

		expect(captured.emitted?.source).toContain('Sitemap: /app/sitemap.xml');
	});

	it('passes through absolute sitemap URL', () => {
		const plugin = setupWithConfig({
			preset: 'allowAll',
			sitemap: 'https://example.com/sitemap.xml',
		});
		const { ctx, captured } = fakeBundleCtx();
		hook(plugin, 'generateBundle').call(ctx);

		expect(captured.warned).toBeUndefined();
		expect(captured.emitted?.source).toContain('Sitemap: https://example.com/sitemap.xml');
	});
});

// ---------------------------------------------------------------------------
// Plugin shape
// ---------------------------------------------------------------------------

describe('plugin shape', () => {
	it('has correct name', () => {
		expect(robotsTxt().name).toBe('vite-robots-txt');
	});

	it('enforces post', () => {
		expect(robotsTxt().enforce).toBe('post');
	});
});
