/**
 * vite-robots-txt — Type definitions
 *
 * Robots.txt spec: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
 * Meta robots spec: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
 * Non-standard extensions: Crawl-delay (Bing/Yandex), Host (Yandex), Clean-param (Yandex)
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** A single value or array of values — for ergonomic config */
type OneOrMany<T> = T | T[];

/** Normalize `OneOrMany<T>` to `T[]` */
function toArray<T>(value: OneOrMany<T> | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

/** Known bot identifiers for type-safe presets */
type KnownBot =
	| 'Googlebot'
	| 'Googlebot-Image'
	| 'Googlebot-News'
	| 'Googlebot-Video'
	| 'Bingbot'
	| 'Slurp' // Yahoo
	| 'DuckDuckBot'
	| 'Baiduspider'
	| 'YandexBot'
	| 'facebookexternalhit'
	| 'Twitterbot'
	| 'LinkedInBot'
	| 'Applebot'
	// AI crawlers
	| 'GPTBot'
	| 'ChatGPT-User'
	| 'Claude-Web'
	| 'ClaudeBot'
	| 'Amazonbot'
	| 'anthropic-ai'
	| 'Bytespider' // TikTok/ByteDance
	| 'CCBot' // Common Crawl
	| 'Google-Extended'
	| 'PerplexityBot'
	| 'Cohere-ai'
	| 'YouBot';

/** User-agent string — known bots get autocomplete, but any string is valid */
type UserAgent = KnownBot | (string & {});

// ---------------------------------------------------------------------------
// Policy (per user-agent group) — robots.txt output
// ---------------------------------------------------------------------------

/** Rules for one or more user-agents */
interface PolicyRule {
	/** Which user-agent(s) this rule applies to. `'*'` = all crawlers. */
	userAgent: OneOrMany<UserAgent>;

	/** Paths to allow crawling. Evaluated after disallow (more specific wins). */
	allow?: OneOrMany<string>;

	/** Paths to disallow crawling. */
	disallow?: OneOrMany<string>;

	/**
	 * Seconds between successive requests.
	 * Non-standard — supported by Bing, Yandex. Ignored by Google.
	 */
	crawlDelay?: number;

	/** Inline comments placed above this rule group */
	comment?: OneOrMany<string>;
}

// ---------------------------------------------------------------------------
// Meta robots — HTML <meta> tag output
// ---------------------------------------------------------------------------

/** Standard meta robots directives with autocomplete */
type MetaDirective =
	| 'index'
	| 'noindex'
	| 'follow'
	| 'nofollow'
	| 'all'
	| 'none'
	| 'noarchive'
	| 'nocache'
	| 'nosnippet'
	| 'noimageindex'
	| `max-snippet:${number}`
	| `max-image-preview:${'none' | 'standard' | 'large'}`
	| `max-video-preview:${number}`
	| (string & {}); // escape hatch

/**
 * A single `<meta name="..." content="...">` tag.
 *
 * @example { name: 'robots', content: ['noindex', 'nofollow'] }
 * @example { name: 'GPTBot', content: 'noindex' }
 */
interface MetaTag {
	/**
	 * The `name` attribute. `'robots'` targets all bots.
	 *
	 * @default 'robots'
	 */
	name?: 'robots' | UserAgent;

	/** One or more directives for the `content` attribute. */
	content: OneOrMany<MetaDirective>;
}

/**
 * Meta robots configuration.
 *
 * Shorthand forms are normalized internally:
 * - `true` → derive meta tags from the active preset
 * - `'noindex'` → `{ tags: [{ name: 'robots', content: 'noindex' }] }`
 * - `['noindex', 'nofollow']` → `{ tags: [{ name: 'robots', content: ['noindex', 'nofollow'] }] }`
 * - `MetaTag` → `{ tags: [tag] }`
 * - `MetaTag[]` → `{ tags }`
 */
type MetaInput =
	| boolean
	| OneOrMany<MetaDirective>
	| OneOrMany<MetaTag>;

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/** Built-in presets for common configurations */
type Preset =
	/** `User-agent: * \n Allow: /` */
	| 'allowAll'
	/** `User-agent: * \n Disallow: /` */
	| 'disallowAll'
	/** Block known AI/LLM training crawlers while allowing search engines */
	| 'blockAI'
	/** Allow only major search engines (Google, Bing, DuckDuckGo, Yahoo, Apple) */
	| 'searchOnly';

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------

interface RobotsTxtOptions {
	/**
	 * Start from a preset, then override with `policies`.
	 * Preset rules come first; your policies are appended.
	 *
	 * @default undefined (no preset — you define everything)
	 */
	preset?: Preset;

	/**
	 * Custom policy rules. Merged after preset rules.
	 *
	 * Shorthand: pass a single `PolicyRule` instead of an array.
	 */
	policies?: OneOrMany<PolicyRule>;

	/**
	 * Inject `<meta name="robots">` tags into HTML via `transformIndexHtml`.
	 *
	 * Multiple shorthand forms for ergonomic config:
	 *
	 * @example true                          // derive from preset
	 * @example 'noindex'                     // global noindex
	 * @example ['noindex', 'nofollow']       // global noindex + nofollow
	 * @example { name: 'GPTBot', content: 'noindex' }  // per-bot
	 * @example [                             // multiple tags
	 *   { content: ['index', 'follow'] },
	 *   { name: 'GPTBot', content: 'noindex' },
	 * ]
	 *
	 * @default undefined (no meta tags)
	 */
	meta?: MetaInput;

	/**
	 * Sitemap URL(s) — absolute URLs written as global `Sitemap:` directives.
	 *
	 * Set to `false` to explicitly suppress sitemap output.
	 * Set to `true` to auto-detect from `sitemap.xml` at the site root.
	 *
	 * @default undefined (no sitemap directive)
	 */
	sitemap?: OneOrMany<string> | boolean;

	/**
	 * Preferred host (Yandex `Host:` directive).
	 * Non-standard — only used by Yandex.
	 *
	 * @default undefined
	 */
	host?: string;

	/**
	 * File name to write. Almost always `robots.txt`.
	 *
	 * @default 'robots.txt'
	 */
	fileName?: string;

	/**
	 * What to do in dev/serve mode.
	 *
	 * - `'disallowAll'` — serve a `Disallow: /` robots.txt (prevent dev indexing)
	 * - `'same'` — serve the same robots.txt as build
	 * - `false` — don't serve anything in dev mode
	 *
	 * @default 'disallowAll'
	 */
	devMode?: 'disallowAll' | 'same' | false;

	/**
	 * Header comment placed at the top of the file.
	 *
	 * @example 'Generated by vite-robots-txt'
	 */
	header?: string;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { toArray };
export type { KnownBot, MetaDirective, MetaInput, MetaTag, OneOrMany, PolicyRule, Preset, RobotsTxtOptions, UserAgent };
