// Default export for convenient `import robotsTxt from 'vite-robots-txt'`
export { metaTagsToHtml, normalizeMeta } from './meta.js';
export { robotsTxt, robotsTxt as default } from './plugin.js';
export { AI_BOTS, presetPolicies, SEARCH_ENGINES } from './presets.js';
export { serialize } from './serialize.js';
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
} from './types.js';
