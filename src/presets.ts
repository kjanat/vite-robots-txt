import type { KnownBot, PolicyRule, Preset } from './types.ts';

/** AI/LLM training crawlers to block */
const AI_BOTS = [
	'GPTBot',
	'ChatGPT-User',
	'Claude-Web',
	'ClaudeBot',
	'anthropic-ai',
	'Google-Extended',
	'PerplexityBot',
	'Bytespider',
	'CCBot',
	'Cohere-ai',
	'Amazonbot',
	'YouBot',
] as const satisfies readonly KnownBot[];

/** Major search engine crawlers */
const SEARCH_ENGINES = [
	'Googlebot',
	'Bingbot',
	'DuckDuckBot',
	'Slurp',
	'Applebot',
	'Baiduspider',
	'YandexBot',
] as const satisfies readonly KnownBot[];

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
