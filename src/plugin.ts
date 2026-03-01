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

function createMiddleware(fileName: string, content: string) {
	return (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
		if (!matchPath(req.url, `/${fileName}`)) return next();
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

	// Pre-compute dev content (no need to serialize on every request)
	const devContent = devMode === 'same' ? serialize(options) : DEV_ROBOTS;

	return {
		name: PLUGIN_NAME,
		enforce: 'post',

		configResolved(config) {
			siteBase = config.base ?? '/';

			if (options.meta !== undefined) {
				const tags = normalizeMeta(options.meta, options.preset);
				htmlTags = metaTagsToHtml(tags);
			}
		},

		configureServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(fileName, devContent));
		},

		configurePreviewServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(fileName, devContent));
		},

		transformIndexHtml() {
			if (htmlTags.length === 0) return [];
			return htmlTags;
		},

		generateBundle() {
			const resolved = { ...options };

			if (resolved.sitemap === true) {
				const sitemapPath = `${siteBase}sitemap.xml`.replace(/\/+/g, '/');
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
