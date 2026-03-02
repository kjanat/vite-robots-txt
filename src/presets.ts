/**
 * Built-in presets and bot lists for common robots.txt configurations.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 * @see {@link https://darkvisitors.com/agents Dark Visitors — known agent directory}
 * @module
 */

import type { KnownBot, PolicyRule, Preset } from './types.ts';

/**
 * AI and LLM training/inference crawlers to block.
 *
 * Includes official training crawlers, AI search indexers, and user-initiated
 * fetch agents. Legacy/undocumented tokens are kept for defense-in-depth.
 *
 * @see {@link https://platform.openai.com/docs/bots OpenAI Bots}
 * @see {@link https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler Anthropic Web Crawlers}
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers Google Crawlers}
 * @see {@link https://about.you.com/youbot/ You.com YouBot}
 * @see {@link https://docs.perplexity.ai/guides/bots Perplexity Bots}
 * @see {@link https://support.apple.com/en-us/119829 Applebot & Applebot-Extended}
 */
const AI_BOTS = [
	// ── OpenAI ────────────────────────────────────────────────────────────
	/** Training data crawler for GPT models. @see {@link https://platform.openai.com/docs/bots} */
	'GPTBot',
	/** ChatGPT Search indexing crawler. @see {@link https://platform.openai.com/docs/bots} */
	'OAI-SearchBot',
	/** User-initiated fetches from ChatGPT / Custom GPTs. @see {@link https://platform.openai.com/docs/bots} */
	'ChatGPT-User',

	// ── Anthropic ─────────────────────────────────────────────────────────
	/** Training data crawler for Claude models. @see {@link https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler} */
	'ClaudeBot',
	/** Claude search feature indexing. @see {@link https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler} */
	'Claude-SearchBot',
	/** User-initiated fetches from Claude. @see {@link https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler} */
	'Claude-User',
	/** @deprecated Undocumented legacy token — not in Anthropic's official bot list. Kept for defense-in-depth. */
	'Claude-Web',
	/** @deprecated Undocumented legacy token — not in Anthropic's official bot list. Kept for defense-in-depth. */
	'anthropic-ai',

	// ── Google ─────────────────────────────────────────────────────────────
	/** Controls Gemini training/grounding use of Google-crawled content. No separate HTTP UA — purely a robots.txt token. @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers} */
	'Google-Extended',
	/** Generic Google R&D crawler, may be used for AI purposes. @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers} */
	'GoogleOther',
	/** Vertex AI Search crawler. @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers} */
	'Google-CloudVertexBot',

	// ── Meta ───────────────────────────────────────────────────────────────
	/** Meta AI training data crawler (Llama models). @see {@link https://developers.facebook.com/docs/sharing/webmasters/crawler} */
	'meta-externalagent',
	/** User-initiated fetches from Meta AI assistant. @see {@link https://developers.facebook.com/docs/sharing/webmasters/crawler} */
	'meta-externalfetcher',
	/** Meta AI speech recognition training data crawler. @see {@link https://developers.facebook.com/docs/sharing/webmasters/crawler} */
	'FacebookBot',

	// ── Apple ──────────────────────────────────────────────────────────────
	/** Controls Apple Intelligence training data usage, separate from Applebot search crawling. @see {@link https://support.apple.com/en-us/119829} */
	'Applebot-Extended',

	// ── Perplexity ────────────────────────────────────────────────────────
	/** AI search indexing crawler. @see {@link https://docs.perplexity.ai/guides/bots} */
	'PerplexityBot',
	/** User-initiated fetches from Perplexity. @see {@link https://docs.perplexity.ai/guides/bots} */
	'Perplexity-User',

	// ── Amazon ─────────────────────────────────────────────────────────────
	/** Amazon web indexing for Alexa, Kindle, Shopping; may be used for AI training. @see {@link https://developer.amazon.com/amazonbot} */
	'Amazonbot',

	// ── ByteDance ──────────────────────────────────────────────────────────
	/** ByteDance (TikTok) AI training data crawler for Doubao and other LLMs. @see {@link https://darkvisitors.com/agents/bytespider} */
	'Bytespider',

	// ── Common Crawl ──────────────────────────────────────────────────────
	/** Open web data repository widely used for AI/LLM training. @see {@link https://commoncrawl.org/ccbot} */
	'CCBot',

	// ── Cohere ─────────────────────────────────────────────────────────────
	/** @deprecated Undocumented legacy token — Cohere's official crawler is `cohere-training-data-crawler`. Kept for defense-in-depth. */
	'Cohere-ai',
	/** Cohere's official training data crawler. @see {@link https://darkvisitors.com/agents/cohere-training-data-crawler} */
	'cohere-training-data-crawler',

	// ── You.com ───────────────────────────────────────────────────────────
	/** You.com AI search engine indexing. @see {@link https://about.you.com/youbot/} */
	'YouBot',

	// ── AI2 (Allen Institute) ─────────────────────────────────────────────
	/** Allen Institute open-source AI training data (Dolma dataset). @see {@link https://darkvisitors.com/agents/ai2bot-dolma} */
	'Ai2Bot-Dolma',

	// ── Huawei ─────────────────────────────────────────────────────────────
	/** Petal Search + Huawei AI services crawler. @see {@link https://darkvisitors.com/agents/petalbot} */
	'PetalBot',

	// ── Diffbot ───────────────────────────────────────────────────────────
	/** Structured data extraction for AI training datasets. @see {@link https://docs.diffbot.com/reference/crawl} */
	'Diffbot',

	// ── Webz.io ───────────────────────────────────────────────────────────
	/** Web data collection resold for AI training. @see {@link https://darkvisitors.com/agents/omgili} */
	'omgili',

	// ── Timpi ─────────────────────────────────────────────────────────────
	/** Decentralized web index used for LLM training. @see {@link https://darkvisitors.com/agents/timpibot} */
	'Timpibot',
] as const satisfies readonly KnownBot[];

/**
 * Major search engine crawlers.
 *
 * Used by the `searchOnly` preset to allow only legitimate search indexing.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers Googlebot}
 * @see {@link https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0 Bingbot}
 * @see {@link https://duckduckgo.com/duckduckbot DuckDuckBot}
 * @see {@link https://support.apple.com/en-us/119829 Applebot}
 * @see {@link https://www.baidu.com/search/robots_english.html Baiduspider}
 * @see {@link https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html YandexBot}
 * @see {@link https://search.brave.com/help/bravebot Bravebot}
 */
const SEARCH_ENGINES = [
	/** Google's primary web search crawler. @see {@link https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers} */
	'Googlebot',
	/** Microsoft Bing web search crawler. @see {@link https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0} */
	'Bingbot',
	/** DuckDuckGo web search crawler. @see {@link https://duckduckgo.com/duckduckbot} */
	'DuckDuckBot',
	/** @deprecated Yahoo Search has been powered by Bing since 2009. Legacy token, no longer actively crawling. */
	'Slurp',
	/** Apple search features (Spotlight, Siri, Safari). @see {@link https://support.apple.com/en-us/119829} */
	'Applebot',
	/** Baidu web search crawler (primarily Chinese web). @see {@link https://www.baidu.com/search/robots_english.html} */
	'Baiduspider',
	/** Yandex web search crawler (primarily Russian/CIS web). @see {@link https://yandex.com/support/webmaster/robot-workings/check-yandex-robots.html} */
	'YandexBot',
	/** Brave Search independent web crawler. @see {@link https://search.brave.com/help/bravebot} */
	'Bravebot',
] as const satisfies readonly KnownBot[];

/**
 * Built-in policy presets for common robots.txt configurations.
 *
 * Preset rules are prepended to any user-supplied {@link PolicyRule} entries.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 *
 * @example
 * ```ts
 * import { presetPolicies } from 'vite-robots-txt';
 *
 * // Compose custom config from preset rules
 * const rules = [...presetPolicies.blockAI, myCustomRule];
 * ```
 */
const presetPolicies: Readonly<Record<Preset, readonly PolicyRule[]>> = {
	allowAll: [{ userAgent: '*', allow: '/' }],

	disallowAll: [{ userAgent: '*', disallow: '/' }],

	blockAI: [
		{ userAgent: '*', allow: '/', comment: 'Allow all crawlers by default' },
		{
			userAgent: [...AI_BOTS],
			disallow: '/',
			comment: 'Block AI/LLM training crawlers',
		},
	],

	searchOnly: [
		{ userAgent: '*', disallow: '/', comment: 'Block all by default' },
		{
			userAgent: [...SEARCH_ENGINES],
			allow: '/',
			comment: 'Allow major search engines',
		},
	],
};

export { AI_BOTS, presetPolicies, SEARCH_ENGINES };
