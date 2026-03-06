/**
 * Type definitions for vite-robots-txt.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
 * @see {@link https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 Crawl-delay (Bing)}
 * @see {@link https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html Host / Crawl-delay (Yandex)}
 * @module
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * A single value or array of values — for ergonomic config.
 *
 * Accepts `T` or `T[]` so users don't have to wrap single values in arrays.
 * Use {@link toArray} to normalize at runtime.
 *
 * @example
 * ```ts
 * type Input = OneOrMany<string>;
 * const a: Input = 'hello';       // single
 * const b: Input = ['a', 'b'];   // array
 * ```
 */
type OneOrMany<T> = T | T[];

/**
 * Normalize {@link OneOrMany `OneOrMany<T>`} to `T[]`.
 *
 * @param value - A single value, array, or `undefined`.
 * @returns An array of values. `undefined` yields an empty array.
 *
 * @example
 * ```ts
 * toArray('a');         // ['a']
 * toArray(['a', 'b']); // ['a', 'b']
 * toArray(undefined);  // []
 * ```
 */
function toArray<T>(value: OneOrMany<T> | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

/**
 * Known bot identifiers for type-safe presets and autocomplete.
 *
 * Organized by category: search engines, social/preview crawlers, and AI crawlers.
 * Any `string` is still accepted via {@link UserAgent} — this union provides autocomplete only.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers Google Crawlers}
 * @see {@link https://darkvisitors.com/agents Dark Visitors Agent Directory}
 */
type KnownBot =
	// ── Search engines ──────────────────────────────────────────────────
	| 'Googlebot'
	| 'Googlebot-Image'
	| 'Googlebot-News'
	| 'Googlebot-Video'
	| 'Bingbot'
	| 'DuckDuckBot'
	| 'Applebot'
	| 'Baiduspider'
	| 'YandexBot'
	| 'Bravebot'
	/** @deprecated Yahoo Search has been powered by Bing since 2009. Legacy token, no longer actively crawling. */
	| 'Slurp'
	// ── Social / preview crawlers ───────────────────────────────────────
	| 'facebookexternalhit'
	| 'Twitterbot'
	| 'LinkedInBot'
	// ── AI crawlers: OpenAI ─────────────────────────────────────────────
	| 'GPTBot'
	| 'OAI-SearchBot'
	| 'ChatGPT-User'
	// ── AI crawlers: Anthropic ──────────────────────────────────────────
	| 'ClaudeBot'
	| 'Claude-SearchBot'
	| 'Claude-User'
	/** @deprecated Undocumented legacy token. Not in Anthropic's official bot list. Kept for defense-in-depth. */
	| 'Claude-Web'
	/** @deprecated Undocumented legacy token. Not in Anthropic's official bot list. Kept for defense-in-depth. */
	| 'anthropic-ai'
	// ── AI crawlers: Google ─────────────────────────────────────────────
	| 'Google-Extended'
	| 'GoogleOther'
	| 'Google-CloudVertexBot'
	// ── AI crawlers: Meta ───────────────────────────────────────────────
	| 'meta-externalagent'
	| 'meta-externalfetcher'
	| 'FacebookBot'
	// ── AI crawlers: Apple ──────────────────────────────────────────────
	| 'Applebot-Extended'
	// ── AI crawlers: Other ──────────────────────────────────────────────
	| 'Amazonbot'
	| 'Bytespider'
	| 'CCBot'
	| 'PerplexityBot'
	| 'Perplexity-User'
	| 'Cohere-ai'
	| 'cohere-training-data-crawler'
	| 'YouBot'
	| 'Ai2Bot-Dolma'
	| 'PetalBot'
	| 'Diffbot'
	| 'omgili'
	| 'Timpibot';

/**
 * User-agent string — {@link KnownBot known bots} get autocomplete, but any string is valid.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#user-agent User-agent line spec}
 */
type UserAgent = KnownBot | (string & {});

// ---------------------------------------------------------------------------
// Policy (per user-agent group) — robots.txt output
// ---------------------------------------------------------------------------

/**
 * Rules for one or more user-agents in a robots.txt file.
 *
 * Each policy maps to a single `User-agent` group in the output.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 *
 * @example
 * ```ts
 * const rule: PolicyRule = {
 *   userAgent: ['Googlebot', 'Bingbot'],
 *   allow: '/',
 *   disallow: ['/admin', '/api'],
 *   crawlDelay: 10,
 *   comment: 'Search engines with rate limiting',
 * };
 * ```
 */
interface PolicyRule {
	/**
	 * Which user-agent(s) this rule applies to. `'*'` = all crawlers.
	 *
	 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#user-agent User-agent line spec}
	 */
	userAgent: OneOrMany<UserAgent>;

	/**
	 * Paths to allow crawling. Evaluated after disallow (more specific wins).
	 *
	 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values Path matching}
	 */
	allow?: OneOrMany<string>;

	/**
	 * Paths to disallow crawling.
	 *
	 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#disallow Disallow directive}
	 */
	disallow?: OneOrMany<string>;

	/**
	 * Seconds between successive requests. Must be a finite non-negative number.
	 *
	 * Non-standard — supported by Bing, Yandex. Ignored by Google.
	 *
	 * @see {@link https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 Bing crawl-delay}
	 * @see {@link https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html Yandex crawl-delay}
	 */
	crawlDelay?: number;

	/** Inline comments placed above this rule group. */
	comment?: OneOrMany<string>;
}

// ---------------------------------------------------------------------------
// Meta robots — HTML <meta> tag output
// ---------------------------------------------------------------------------

/**
 * Standard meta robots directives with autocomplete.
 *
 * Known directives get IDE autocomplete; the `string & {}` escape hatch
 * accepts any custom directive.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
 */
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
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
 *
 * @example
 * ```ts
 * const global: MetaTag = { content: ['noindex', 'nofollow'] };
 * const perBot: MetaTag = { name: 'GPTBot', content: 'noindex' };
 * ```
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
 * Meta robots configuration — accepts many shorthand forms for ergonomic config.
 *
 * Shorthand forms are normalized internally by {@link normalizeMeta}:
 * - `true` → derive meta tags from the active preset
 * - `'noindex'` → `[{ name: 'robots', content: 'noindex' }]`
 * - `['noindex', 'nofollow']` → `[{ name: 'robots', content: ['noindex', 'nofollow'] }]`
 * - `MetaTag` → `[tag]`
 * - `MetaTag[]` → tags as-is
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
 */
type MetaInput =
	| boolean
	| OneOrMany<MetaDirective>
	| OneOrMany<MetaTag>;

// ---------------------------------------------------------------------------
// X-Robots-Tag headers — HTTP header output
// ---------------------------------------------------------------------------

/**
 * One logical X-Robots-Tag rule for URL pattern matching.
 *
 * This is provider-agnostic input. Providers map this to platform-specific
 * output files such as `_headers`.
 */
interface HeaderRule {
	/** URL or URL pattern this rule applies to. */
	pattern: string;

	/** One or more robots directives, e.g. `noindex`, `nosnippet`. */
	directives: OneOrMany<MetaDirective>;

	/** Optional bot name for user-agent-specific X-Robots-Tag values. */
	userAgent?: UserAgent;
}

/**
 * Normalized, provider-ready header rule.
 *
 * Internal providers consume this shape to avoid repeated runtime branching.
 */
interface ResolvedHeaderRule {
	pattern: string;
	directives: MetaDirective[];
	userAgent?: UserAgent;
}

/**
 * One build output emitted by a header provider.
 */
interface HeaderOutputFile {
	fileName: string;
	source: string;
}

/**
 * Context passed to header providers during build.
 */
interface HeaderProviderContext {
	env: Readonly<Record<string, string | undefined>>;
	warn: (message: string) => void;
}

/**
 * Built-in provider ids.
 *
 * - `flatFile`: emits `_headers` format (Cloudflare Pages/Workers static assets, Netlify)
 */
type HeaderProviderId = 'flatFile';

/**
 * Header provider callback.
 */
type HeaderProviderFn = (
	rules: readonly ResolvedHeaderRule[],
	context: HeaderProviderContext,
) => HeaderOutputFile | null;

/**
 * Header provider — either a built-in provider id or a custom callback.
 */
type HeaderProvider = HeaderProviderId | HeaderProviderFn;

/**
 * HTTP header generation config.
 */
interface HeadersConfig {
	/** Provider-agnostic X-Robots-Tag rules. */
	rules: OneOrMany<HeaderRule>;

	/**
	 * Output providers.
	 *
	 * If omitted, providers are auto-detected from env vars.
	 */
	provider?: OneOrMany<HeaderProvider>;

	/**
	 * Enable env-based provider auto-detection.
	 *
	 * @default true when `provider` is omitted
	 */
	autoDetect?: boolean;
}

/**
 * Accepted `headers` option input.
 *
 * - `HeaderRule | HeaderRule[]` shorthand
 * - full `HeadersConfig`
 */
type HeadersInput = HeadersConfig | OneOrMany<HeaderRule>;

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Built-in presets for common robots.txt configurations.
 *
 * @see {@link presetPolicies} for the actual policy rules each preset generates.
 */
type Preset =
	/** `User-agent: * \n Allow: /` */
	| 'allowAll'
	/** `User-agent: * \n Disallow: /` */
	| 'disallowAll'
	/** Block known AI/LLM training crawlers while allowing search engines */
	| 'blockAI'
	/** Allow only major search engines (Google, Bing, DuckDuckGo, Yahoo, Apple, Baidu, Yandex, Brave) */
	| 'searchOnly';

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------

/**
 * Configuration options for the vite-robots-txt plugin.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 *
 * @example
 * ```ts
 * import robotsTxt from 'vite-robots-txt';
 *
 * export default defineConfig({
 *   plugins: [
 *     robotsTxt({
 *       preset: 'blockAI',
 *       sitemap: 'https://example.com/sitemap.xml',
 *       meta: true,
 *     }),
 *   ],
 * });
 * ```
 */
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
	 * Shorthand: pass a single {@link PolicyRule} instead of an array.
	 */
	policies?: OneOrMany<PolicyRule>;

	/**
	 * Inject `<meta name="robots">` tags into HTML via Vite's `transformIndexHtml` hook.
	 *
	 * Multiple shorthand forms for ergonomic config:
	 *
	 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag Meta robots spec}
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
	 * Generate `X-Robots-Tag` headers for static assets.
	 *
	 * Supports provider auto-detection:
	 * - `CF_PAGES=1` (Cloudflare Pages)
	 * - `CF_WORKERS=1` or `CLOUDFLARE_WORKERS=1` (Cloudflare Workers static assets)
	 * - `NETLIFY=true` (Netlify)
	 *
	 * Shorthand accepted:
	 * @example { pattern: '/*', directives: 'noindex' }
	 * @example [{ pattern: '/static/*', directives: 'nosnippet' }]
	 */
	headers?: HeadersInput;

	/**
	 * Sitemap URL(s) — absolute URLs written as global `Sitemap:` directives.
	 *
	 * Set to `false` to explicitly suppress sitemap output.
	 * Set to `true` to auto-detect from `sitemap.xml` at the site root.
	 *
	 * @see {@link https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview Sitemap spec}
	 *
	 * @default undefined (no sitemap directive)
	 */
	sitemap?: OneOrMany<string> | boolean;

	/**
	 * Preferred host (Yandex `Host:` directive).
	 *
	 * Non-standard — only used by Yandex.
	 *
	 * @see {@link https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html Yandex Host directive}
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
export type {
	HeaderOutputFile,
	HeaderProvider,
	HeaderProviderContext,
	HeaderProviderFn,
	HeaderProviderId,
	HeaderRule,
	HeadersConfig,
	HeadersInput,
	KnownBot,
	MetaDirective,
	MetaInput,
	MetaTag,
	OneOrMany,
	PolicyRule,
	Preset,
	ResolvedHeaderRule,
	RobotsTxtOptions,
	UserAgent,
};
