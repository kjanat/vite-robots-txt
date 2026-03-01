import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HtmlTagDescriptor, Plugin } from 'vite';
import { metaTagsToHtml, normalizeMeta } from './meta.ts';
import { serialize } from './serialize.ts';
import type { RobotsTxtOptions } from './types.ts';

const PLUGIN_NAME = 'vite-robots-txt';
const DEV_ROBOTS = 'User-agent: *\nDisallow: /\n';

type NextFn = () => void;

function createMiddleware(fileName: string, content: string) {
	return (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
		if (req.url !== `/${fileName}`) return next();
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

	return {
		name: PLUGIN_NAME,
		enforce: 'post',

		configResolved(config) {
			siteBase = config.base ?? '/';

			// Resolve meta tags once at config time
			if (options.meta !== undefined) {
				const tags = normalizeMeta(options.meta, options.preset);
				htmlTags = metaTagsToHtml(tags);
			}
		},

		// Serve robots.txt in dev mode
		configureServer(server) {
			if (devMode === false) return;

			server.middlewares.use(
				createMiddleware(
					fileName,
					devMode === 'disallowAll' ? DEV_ROBOTS : serialize(options),
				),
			);
		},

		// Also serve in preview mode
		configurePreviewServer(server) {
			if (devMode === false) return;

			server.middlewares.use(
				createMiddleware(
					fileName,
					devMode === 'disallowAll' ? DEV_ROBOTS : serialize(options),
				),
			);
		},

		// Inject <meta name="robots"> tags into HTML
		transformIndexHtml() {
			if (htmlTags.length === 0) return [];
			return htmlTags;
		},

		// Emit robots.txt at build time
		generateBundle() {
			const resolved = { ...options };

			if (resolved.sitemap === true) {
				resolved.sitemap = `${siteBase}sitemap.xml`.replace(/\/+/g, '/');
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
