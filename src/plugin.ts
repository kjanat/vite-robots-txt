import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { serialize } from './serialize.js';
import type { RobotsTxtOptions } from './types.js';

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

	const devContent = devMode === 'disallowAll' ? DEV_ROBOTS : serialize(options);

	return {
		name: PLUGIN_NAME,
		enforce: 'post',

		configResolved(config) {
			siteBase = config.base ?? '/';
		},

		configureServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(fileName, devContent));
		},

		configurePreviewServer(server) {
			if (devMode === false) return;
			server.middlewares.use(createMiddleware(fileName, devContent));
		},

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
