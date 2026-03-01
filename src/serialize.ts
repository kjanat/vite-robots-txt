import { presetPolicies } from './presets.ts';
import type { OneOrMany, PolicyRule, RobotsTxtOptions } from './types.ts';
import { toArray } from './utils.ts';

/** Serialize a single policy rule group into robots.txt lines */
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

	if (rule.crawlDelay !== undefined) {
		lines.push(`Crawl-delay: ${rule.crawlDelay}`);
	}

	return lines.join('\n');
}

/** Build the full robots.txt content from resolved options */
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
		for (const url of toArray(options.sitemap as OneOrMany<string>)) {
			sections.push(`Sitemap: ${url}`);
		}
	}

	return `${sections.join('\n\n')}\n`;
}

export { serialize };
