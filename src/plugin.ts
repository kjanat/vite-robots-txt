/**
 * Core Vite plugin — generates `robots.txt` at build time and serves it during development.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 * @see {@link https://vite.dev/guide/api-plugin Vite Plugin API}
 * @module
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { metaTagsToHtml, normalizeMeta } from './meta.ts';
import { serialize } from './serialize.ts';
import type { RobotsTxtOptions } from './types.ts';

const PLUGIN_NAME = 'vite-robots-txt';
const DEV_ROBOTS = 'User-agent: *\nDisallow: /\n';

type NextFn = () => void;

/**
 * Strip query string from a URL for path matching.
 *
 * @param url - The raw request URL (may include query string).
 * @param target - The target path to match against.
 * @returns `true` if the path portion of `url` equals `target`.
 */
function matchPath(url: string | undefined, target: string): boolean {
	if (!url) return false;
	const path = url.split('?')[0];
	return path === target;
}

/**
 * Join a URL base path with a filename via standard URL resolution.
 *
 * Uses the {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/URL URL API}
 * with a throwaway origin — only the `.pathname` is used.
 * Defensively normalizes missing trailing slash on `base`.
 *
 * @param base - The base path (e.g. `'/'` or `'/app/'`).
 * @param file - The filename to append (e.g. `'robots.txt'`).
 * @returns The resolved pathname (e.g. `'/app/robots.txt'`).
 */
function joinPath(base: string, file: string): string {
	const origin = `http://n${base.endsWith('/') ? base : `${base}/`}`;
	return new URL(file, origin).pathname;
}

/**
 * Create a connect-style middleware that serves static text content at a given path.
 *
 * @param targetPath - The URL path to intercept.
 * @param content - The text content to serve.
 * @returns A connect middleware function.
 */
function createMiddleware(targetPath: string, content: string) {
	return (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
		if (!matchPath(req.url, targetPath)) return next();
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Cache-Control', 'no-cache');
		res.end(content);
	};
}

/**
 * Create the vite-robots-txt plugin.
 *
 * Generates a `robots.txt` file at build time via Rollup's `emitFile`,
 * serves it during dev/preview via connect middleware, and optionally
 * injects `<meta name="robots">` tags into HTML.
 *
 * @param options - Plugin configuration. See {@link RobotsTxtOptions}.
 * @returns A Vite {@link Plugin}.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import robotsTxt from 'vite-robots-txt';
 *
 * export default defineConfig({
 *   plugins: [robotsTxt({ preset: 'blockAI', meta: true })],
 * });
 * ```
 */
function robotsTxt(options: RobotsTxtOptions = {}): Plugin {
	const fileName = options.fileName ?? 'robots.txt';
	const devMode = options.devMode ?? 'disallowAll';

	let siteBase = '/';
	let htmlTags: HtmlTagDescriptor[] = [];
	let devContent = '';
	let servePath = '';

	return {
		name: PLUGIN_NAME,
		enforce: 'post',

		configResolved(config) {
			siteBase = config.base ?? '/';
			servePath = joinPath(siteBase, fileName);

			// Compute dev content after config is resolved so siteBase is available
			if (devMode === 'disallowAll') {
				devContent = DEV_ROBOTS;
			} else if (devMode === 'same') {
				const resolved = { ...options };
				if (resolved.sitemap === true) {
					resolved.sitemap = joinPath(siteBase, 'sitemap.xml');
				}
				devContent = serialize(resolved);
			}

			if (options.meta !== undefined) {
				const tags = normalizeMeta(options.meta, options.preset);
				htmlTags = metaTagsToHtml(tags);
			}
		},

		configureServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(servePath, devContent));
		},

		configurePreviewServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(servePath, devContent));
		},

		transformIndexHtml() {
			if (htmlTags.length === 0) return [];
			return htmlTags;
		},

		generateBundle() {
			const resolved = { ...options };

			if (resolved.sitemap === true) {
				const sitemapPath = joinPath(siteBase, 'sitemap.xml');
				this.warn(
					`sitemap: true resolved to relative path "${sitemapPath}". `
						+ 'Sitemap directives should be absolute URLs per spec. '
						+ 'Pass a full URL like "https://example.com/sitemap.xml" for production.',
				);
				resolved.sitemap = sitemapPath;
			}

			this.emitFile({
				type: 'asset',
				fileName,
				source: serialize(resolved),
			});
		},
	};
}

export { robotsTxt };
