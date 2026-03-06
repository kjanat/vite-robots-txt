// Default export for convenient `import robotsTxt from 'vite-robots-txt'`
export { flatFile, serializeFlatFile, serializeVercelJson, vercelJson } from './headers.ts';
export { metaTagsToHtml, normalizeMeta } from './meta.ts';
export { robotsTxt, robotsTxt as default } from './plugin.ts';
export { AI_BOTS, presetPolicies, SEARCH_ENGINES } from './presets.ts';
export { serialize } from './serialize.ts';
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
} from './types.ts';
