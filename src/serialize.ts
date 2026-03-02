/**
 * Robots.txt serializer — converts {@link RobotsTxtOptions} into a robots.txt string.
 *
 * @see {@link https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt Robots.txt spec}
 * @module
 */

import { presetPolicies } from './presets.ts';
import { type PolicyRule, type RobotsTxtOptions, toArray } from './types.ts';

/**
 * Serialize a single {@link PolicyRule} into robots.txt lines.
 *
 * @param rule - The policy rule to serialize.
 * @returns A string containing the robots.txt lines for this rule group.
 */
function serializePolicy(rule: PolicyRule): string {
	const lines: string[] = [];

	for (const c of toArray(rule.comment)) {
		lines.push(`# ${c}`);
	}

	for (const ua of toArray(rule.userAgent)) {
		lines.push(`User-agent: ${ua}`);
	}

	for (const path of toArray(rule.disallow)) {
		lines.push(`Disallow: ${path}`);
	}

	for (const path of toArray(rule.allow)) {
		lines.push(`Allow: ${path}`);
	}

	if (rule.crawlDelay !== undefined && Number.isFinite(rule.crawlDelay) && rule.crawlDelay >= 0) {
		lines.push(`Crawl-delay: ${rule.crawlDelay}`);
	}

	return lines.join('\n');
}

/**
 * Build the full robots.txt content from resolved options.
 *
 * Applies preset rules first (if any), then user-supplied policies,
 * followed by global directives (`Host:`, `Sitemap:`).
 *
 * @param options - The resolved plugin options.
 * @returns The complete robots.txt file content.
 *
 * @example
 * ```ts
 * import { serialize } from 'vite-robots-txt';
 *
 * const txt = serialize({
 *   preset: 'blockAI',
 *   sitemap: 'https://example.com/sitemap.xml',
 * });
 * ```
 */
function serialize(options: RobotsTxtOptions): string {
	const sections: string[] = [];

	if (options.header) {
		sections.push(`# ${options.header}`);
	}

	const policies: PolicyRule[] = [];

	if (options.preset) {
		const presetRules = presetPolicies[options.preset];
		if (presetRules) {
			policies.push(...presetRules);
		}
	}

	for (const p of toArray(options.policies)) {
		policies.push(p);
	}

	// Default to allow all if nothing specified
	if (policies.length === 0) {
		policies.push({ userAgent: '*', allow: '/' });
	}

	for (const policy of policies) {
		sections.push(serializePolicy(policy));
	}

	if (options.host) {
		sections.push(`Host: ${options.host}`);
	}

	// Sitemap directives (skip boolean — resolved in plugin.ts)
	if (options.sitemap && options.sitemap !== true) {
		for (const url of toArray(options.sitemap)) {
			sections.push(`Sitemap: ${url}`);
		}
	}

	return `${sections.join('\n\n')}\n`;
}

export { serialize };
