// Default export for convenient `import robotsTxt from 'vite-robots-txt'`
export { metaTagsToHtml, normalizeMeta } from './meta.ts';
export { robotsTxt, robotsTxt as default } from './plugin.ts';
export { AI_BOTS, presetPolicies, SEARCH_ENGINES } from './presets.ts';
export { serialize } from './serialize.ts';
export type {
	KnownBot,
	MetaDirective,
	MetaInput,
	MetaTag,
	OneOrMany,
	PolicyRule,
	Preset,
	RobotsTxtOptions,
	UserAgent,
} from './types.ts';
