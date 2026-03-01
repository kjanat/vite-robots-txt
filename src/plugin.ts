import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { metaTagsToHtml, normalizeMeta } from './meta.ts';
import { serialize } from './serialize.ts';
import type { RobotsTxtOptions } from './types.ts';

const PLUGIN_NAME = 'vite-robots-txt';
const DEV_ROBOTS = 'User-agent: *\nDisallow: /\n';

type NextFn = () => void;

/** Strip query string from URL for path matching */
function matchPath(url: string | undefined, target: string): boolean {
	if (!url) return false;
	const path = url.split('?')[0];
	return path === target;
}

/** Join a URL base path with a filename via standard URL resolution */
function joinPath(base: string, file: string): string {
	const origin = `http://n${base.endsWith('/') ? base : `${base}/`}`;
	return new URL(file, origin).pathname;
}

function createMiddleware(targetPath: string, content: string) {
	return (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
		if (!matchPath(req.url, targetPath)) return next();
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Cache-Control', 'no-cache');
		res.end(content);
	};
}

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
