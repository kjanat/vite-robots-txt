/**
 * X-Robots-Tag header rule normalization + provider outputs.
 *
 * Providers convert platform-agnostic header rules into deployment-specific
 * files such as `_headers` (Cloudflare/Netlify).
 *
 * @module
 */

import {
	type HeaderOutputFile,
	type HeaderProvider,
	type HeaderProviderContext,
	type HeaderProviderFn,
	type HeaderProviderId,
	type HeaderRule,
	type HeadersConfig,
	type HeadersInput,
	type ResolvedHeaderRule,
	toArray,
} from './types.ts';

const HEADER_NAME = 'X-Robots-Tag';

function isHeadersConfig(input: HeadersInput): input is HeadersConfig {
	return typeof input === 'object' && input !== null && !Array.isArray(input) && 'rules' in input;
}

function normalizeHeaders(input: HeadersInput): HeadersConfig {
	if (isHeadersConfig(input)) return input;
	return { rules: input };
}

function resolveHeaderRules(input: HeaderRule | HeaderRule[], warn: (message: string) => void): ResolvedHeaderRule[] {
	const rules = toArray(input);
	const normalized: ResolvedHeaderRule[] = [];

	for (const rule of rules) {
		const pattern = rule.pattern.trim();
		if (pattern.length === 0) {
			warn('[vite-robots-txt] skipped header rule with empty pattern.');
			continue;
		}

		const directives = toArray(rule.directives);
		if (directives.length === 0) {
			warn(`[vite-robots-txt] skipped header rule for pattern "${pattern}" with no directives.`);
			continue;
		}

		normalized.push({
			pattern,
			directives,
			userAgent: rule.userAgent,
		});
	}

	return normalized;
}

function isTruthyEnv(value: string | undefined): boolean {
	if (value === undefined) return false;
	const lowered = value.toLowerCase();
	return lowered === '1' || lowered === 'true';
}

function detectProviderIds(env: Readonly<Record<string, string | undefined>>): HeaderProviderId[] {
	const detected: HeaderProviderId[] = [];

	const add = (provider: HeaderProviderId) => {
		if (!detected.includes(provider)) detected.push(provider);
	};

	if (
		isTruthyEnv(env.CF_PAGES)
		|| isTruthyEnv(env.CF_WORKERS)
		|| isTruthyEnv(env.CLOUDFLARE_WORKERS)
		|| isTruthyEnv(env.NETLIFY)
	) {
		add('flatFile');
	}

	return detected;
}

function resolveProviderList(config: HeadersConfig, context: HeaderProviderContext): HeaderProvider[] {
	const explicitProviders = toArray(config.provider);
	const providers: HeaderProvider[] = [...explicitProviders];

	const autoDetect = config.autoDetect ?? explicitProviders.length === 0;
	const detectedProviders = autoDetect ? detectProviderIds(context.env) : [];
	providers.push(...detectedProviders);

	if (providers.length === 0) {
		context.warn('[vite-robots-txt] headers provider auto-detect found none. defaulting to flatFile (_headers).');
		providers.push('flatFile');
	}

	const seenIds = new Set<HeaderProviderId>();
	const seenFns = new Set<HeaderProviderFn>();
	const unique: HeaderProvider[] = [];

	for (const provider of providers) {
		if (typeof provider === 'string') {
			if (seenIds.has(provider)) continue;
			seenIds.add(provider);
			unique.push(provider);
			continue;
		}

		if (seenFns.has(provider)) continue;
		seenFns.add(provider);
		unique.push(provider);
	}

	return unique;
}

function serializeHeaderValue(rule: ResolvedHeaderRule): string {
	const directives = rule.directives.join(', ');
	if (rule.userAgent === undefined) return directives;
	return `${rule.userAgent}: ${directives}`;
}

function serializeFlatFile(rules: readonly ResolvedHeaderRule[]): string {
	if (rules.length === 0) return '';

	const grouped = new Map<string, string[]>();

	for (const rule of rules) {
		const line = `  ${HEADER_NAME}: ${serializeHeaderValue(rule)}`;
		const existing = grouped.get(rule.pattern);
		if (existing === undefined) {
			grouped.set(rule.pattern, [line]);
			continue;
		}
		existing.push(line);
	}

	const blocks: string[] = [];
	for (const [pattern, lines] of grouped) {
		blocks.push(`${pattern}\n${lines.join('\n')}`);
	}

	return `${blocks.join('\n\n')}\n`;
}

function flatFile(options: { fileName?: string } = {}): HeaderProviderFn {
	const fileName = options.fileName ?? '_headers';
	return (rules) => ({
		fileName,
		source: serializeFlatFile(rules),
	});
}

function resolveBuiltInProvider(provider: HeaderProviderId): HeaderProviderFn {
	switch (provider) {
		case 'flatFile':
			return flatFile();
	}
}

function dedupeOutputFiles(
	outputs: HeaderOutputFile[],
	warn: (message: string) => void,
): HeaderOutputFile[] {
	const byFileName = new Map<string, HeaderOutputFile>();

	for (const output of outputs) {
		if (byFileName.has(output.fileName)) {
			warn(`[vite-robots-txt] duplicate header output "${output.fileName}". last provider wins.`);
		}
		byFileName.set(output.fileName, output);
	}

	return Array.from(byFileName.values());
}

function generateHeaderOutputs(
	input: HeadersInput | undefined,
	context: HeaderProviderContext,
): HeaderOutputFile[] {
	if (input === undefined) return [];

	const config = normalizeHeaders(input);
	const rules = resolveHeaderRules(config.rules, context.warn);
	if (rules.length === 0) return [];

	const providers = resolveProviderList(config, context);
	const outputs: HeaderOutputFile[] = [];

	for (const provider of providers) {
		const fn = typeof provider === 'string' ? resolveBuiltInProvider(provider) : provider;
		const output = fn(rules, context);
		if (output === null) continue;
		outputs.push(output);
	}

	return dedupeOutputFiles(outputs, context.warn);
}

export { flatFile, generateHeaderOutputs, resolveHeaderRules, serializeFlatFile };
