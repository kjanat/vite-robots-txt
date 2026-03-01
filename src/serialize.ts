import { presetPolicies } from './presets.js';
import type { OneOrMany, PolicyRule, RobotsTxtOptions } from './types.js';

/** Normalize `OneOrMany<T>` to `T[]` */
function toArray<T>(value: OneOrMany<T> | undefined): T[] {
	if (value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

/** Serialize a single policy rule group into robots.txt lines */
function serializePolicy(rule: PolicyRule): string {
	const lines: string[] = [];

	// Comments above the group
	for (const c of toArray(rule.comment)) {
		lines.push(`# ${c}`);
	}

	// User-agent line(s)
	for (const ua of toArray(rule.userAgent)) {
		lines.push(`User-agent: ${ua}`);
	}

	// Disallow lines
	for (const path of toArray(rule.disallow)) {
		lines.push(`Disallow: ${path}`);
	}

	// Allow lines
	for (const path of toArray(rule.allow)) {
		lines.push(`Allow: ${path}`);
	}

	// Crawl-delay
	if (rule.crawlDelay !== undefined) {
		lines.push(`Crawl-delay: ${rule.crawlDelay}`);
	}

	return lines.join('\n');
}

/** Build the full robots.txt content from resolved options */
function serialize(options: RobotsTxtOptions): string {
	const sections: string[] = [];

	// Header comment
	if (options.header) {
		sections.push(`# ${options.header}`);
	}

	// Collect policies: preset first, then user-defined
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

	// If no policies at all, default to allow all
	if (policies.length === 0) {
		policies.push({ userAgent: '*', allow: '/' });
	}

	// Serialize each policy group
	for (const policy of policies) {
		sections.push(serializePolicy(policy));
	}

	// Host directive (Yandex)
	if (options.host) {
		sections.push(`Host: ${options.host}`);
	}

	// Sitemap directive(s)
	if (options.sitemap && options.sitemap !== true) {
		for (const url of toArray(options.sitemap as OneOrMany<string>)) {
			sections.push(`Sitemap: ${url}`);
		}
	}

	// Join with blank lines between groups, trailing newline
	return `${sections.join('\n\n')}\n`;
}

export { serialize, serializePolicy, toArray };
