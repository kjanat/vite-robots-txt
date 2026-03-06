# vite-robots-txt

[![NPM Version](https://img.shields.io/npm/v/vite-robots-txt?logo=npm&labelColor=CB3837&color=black)](https://www.npmjs.com/package/vite-robots-txt)

Vite plugin to generate `robots.txt` and inject `<meta name="robots">` tags — with presets, per-bot rules, and dev mode blocking.

## Install

```bash
bun add -d vite-robots-txt
# or
npm install -D vite-robots-txt
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import robotsTxt from 'vite-robots-txt';

export default defineConfig({
	plugins: [
		robotsTxt({ preset: 'allowAll' }),
	],
});
```

## Presets

| Preset        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `allowAll`    | Allow all crawlers                                   |
| `disallowAll` | Block all crawlers                                   |
| `blockAI`     | Allow search engines, block AI/LLM training crawlers |
| `searchOnly`  | Allow only major search engines                      |

### Block AI crawlers

```ts
robotsTxt({ preset: 'blockAI' });
```

Generates:

```txt
# Allow all crawlers by default
User-agent: *
Allow: /

# Block AI/LLM training crawlers
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: Claude-Web
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Google-Extended
User-agent: PerplexityBot
User-agent: Bytespider
User-agent: CCBot
User-agent: Cohere-ai
User-agent: Amazonbot
User-agent: YouBot
Disallow: /
```

## Custom policies

```ts
robotsTxt({
	policies: [
		{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
		{ userAgent: 'GPTBot', disallow: '/' },
	],
	sitemap: 'https://example.com/sitemap.xml',
});
```

### Merge preset + custom rules

```ts
robotsTxt({
	preset: 'blockAI',
	policies: { userAgent: 'Baiduspider', disallow: '/', crawlDelay: 10 },
});
```

## Meta robots tags

Inject `<meta name="robots">` tags into your HTML for indexing control. Works alongside or independently from `robots.txt`.

### Derive from preset

```ts
// Automatically generates <meta> tags matching the preset
robotsTxt({ preset: 'blockAI', meta: true });
// → <meta name="GPTBot" content="noindex, nofollow">
// → <meta name="ClaudeBot" content="noindex, nofollow">
// → ... (all 12 AI bots)
```

### Global directives

```ts
// Single directive
robotsTxt({ meta: 'noindex' });
// → <meta name="robots" content="noindex">

// Multiple directives
robotsTxt({ meta: ['noindex', 'nofollow'] });
// → <meta name="robots" content="noindex, nofollow">
```

### Per-bot tags

```ts
robotsTxt({
	meta: [
		{ content: ['index', 'follow'] }, // <meta name="robots" ...>
		{ name: 'GPTBot', content: 'noindex' }, // <meta name="GPTBot" ...>
		{ name: 'googlebot', content: 'max-image-preview:large' }, // <meta name="googlebot" ...>
	],
});
```

### Combined: robots.txt + meta tags

```ts
robotsTxt({
	preset: 'blockAI',
	meta: true,
	sitemap: 'https://example.com/sitemap.xml',
});
```

## X-Robots-Tag headers

Generate HTTP `X-Robots-Tag` headers from the same directive vocabulary.

### Auto-detect provider from deploy env

```ts
robotsTxt({
	headers: [
		{ pattern: '/static/*', directives: 'nosnippet' },
		{ pattern: 'https://:project.pages.dev/*', directives: 'noindex' },
	],
});
```

Auto-detection uses env vars:

- `CF_PAGES=1` / `CF_WORKERS=1` / `CLOUDFLARE_WORKERS=1` / `NETLIFY=true` -> emits `_headers`
- `VERCEL=1` -> emits `vercel.json`
- no match -> falls back to `_headers`

### Explicit providers

```ts
import robotsTxt, { flatFile, vercelJson } from 'vite-robots-txt';

robotsTxt({
	headers: {
		rules: { pattern: '/*', directives: 'noindex' },
		provider: [flatFile(), vercelJson()],
		autoDetect: false,
	},
});
```

## Options

| Option     | Type                                                       | Default         | Description                              |
| ---------- | ---------------------------------------------------------- | --------------- | ---------------------------------------- |
| `preset`   | `'allowAll' \| 'disallowAll' \| 'blockAI' \| 'searchOnly'` | —               | Start from a preset                      |
| `policies` | `PolicyRule \| PolicyRule[]`                               | —               | Custom policy rules                      |
| `meta`     | `boolean \| string \| string[] \| MetaTag \| MetaTag[]`    | —               | Inject `<meta>` robots tags into HTML    |
| `headers`  | `HeaderRule \| HeaderRule[] \| HeadersConfig`              | —               | Emit `X-Robots-Tag` header config files  |
| `sitemap`  | `string \| string[] \| boolean`                            | —               | Sitemap URL(s) or `true` for auto-detect |
| `host`     | `string`                                                   | —               | Yandex `Host:` directive                 |
| `fileName` | `string`                                                   | `'robots.txt'`  | Output file name                         |
| `devMode`  | `'disallowAll' \| 'same' \| false`                         | `'disallowAll'` | Dev server behavior                      |
| `header`   | `string`                                                   | —               | Comment at top of file                   |

### PolicyRule

| Field        | Type                 | Description                            |
| ------------ | -------------------- | -------------------------------------- |
| `userAgent`  | `string \| string[]` | Bot name(s), `'*'` for all             |
| `allow`      | `string \| string[]` | Paths to allow                         |
| `disallow`   | `string \| string[]` | Paths to disallow                      |
| `crawlDelay` | `number`             | Seconds between requests (Bing/Yandex) |
| `comment`    | `string \| string[]` | Comments above the rule group          |

### MetaTag

| Field     | Type                 | Default    | Description                    |
| --------- | -------------------- | ---------- | ------------------------------ |
| `name`    | `'robots' \| string` | `'robots'` | Bot name or `'robots'` for all |
| `content` | `string \| string[]` | —          | Meta directives                |

### HeaderRule

| Field        | Type                 | Description                                        |
| ------------ | -------------------- | -------------------------------------------------- |
| `pattern`    | `string`             | URL pattern (`/*`, `/static/*`, absolute URL, etc) |
| `directives` | `string \| string[]` | `X-Robots-Tag` directives                          |
| `userAgent`  | `string`             | Optional bot-prefixed header value                 |

### Available meta directives

`index`, `noindex`, `follow`, `nofollow`, `all`, `none`, `noarchive`, `nocache`, `nosnippet`, `noimageindex`, `max-snippet:N`, `max-image-preview:none|standard|large`, `max-video-preview:N`

## Dev mode

By default, the plugin serves a `Disallow: /` robots.txt during development to prevent indexing of your dev server. Set `devMode: 'same'` to serve the same config as production, or `false` to disable.

## Standalone utilities

```ts
import { metaTagsToHtml, normalizeMeta, serialize } from 'vite-robots-txt';

// Generate robots.txt string
const txt = serialize({
	preset: 'blockAI',
	sitemap: 'https://example.com/sitemap.xml',
});

// Normalize meta input to MetaTag[]
const tags = normalizeMeta(true, 'blockAI');

// Convert to Vite HtmlTagDescriptor[]
const html = metaTagsToHtml(tags);
```

## Exports

| Export                | Description                              |
| --------------------- | ---------------------------------------- |
| `robotsTxt` (default) | Vite plugin factory                      |
| `serialize`           | Standalone robots.txt serializer         |
| `flatFile`            | `_headers` provider factory              |
| `vercelJson`          | `vercel.json` provider factory           |
| `serializeFlatFile`   | Standalone `_headers` serializer         |
| `serializeVercelJson` | Standalone `vercel.json` serializer      |
| `normalizeMeta`       | Normalize meta input to `MetaTag[]`      |
| `metaTagsToHtml`      | Convert `MetaTag[]` to Vite HTML tags    |
| `AI_BOTS`             | Array of known AI crawler user-agents    |
| `SEARCH_ENGINES`      | Array of major search engine user-agents |
| `presetPolicies`      | Preset policy definitions                |

## License

MIT

<!--markdownlint-disable-file no-hard-tabs-->
