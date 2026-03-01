# vite-robots-txt

Vite plugin to generate `robots.txt` with presets, per-bot rules, and dev mode blocking.

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

## Options

| Option     | Type                                                       | Default         | Description                              |
| ---------- | ---------------------------------------------------------- | --------------- | ---------------------------------------- |
| `preset`   | `'allowAll' \| 'disallowAll' \| 'blockAI' \| 'searchOnly'` | —               | Start from a preset                      |
| `policies` | `PolicyRule \| PolicyRule[]`                               | —               | Custom policy rules                      |
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

## Dev mode

By default, the plugin serves a `Disallow: /` robots.txt during development to prevent indexing of your dev server. Set `devMode: 'same'` to serve the same config as production, or `false` to disable.

## Standalone serializer

```ts
import { serialize } from 'vite-robots-txt';

const txt = serialize({
	preset: 'blockAI',
	sitemap: 'https://example.com/sitemap.xml',
});
```

## Exports

| Export                | Description                              |
| --------------------- | ---------------------------------------- |
| `robotsTxt` (default) | Vite plugin factory                      |
| `serialize`           | Standalone robots.txt serializer         |
| `AI_BOTS`             | Array of known AI crawler user-agents    |
| `SEARCH_ENGINES`      | Array of major search engine user-agents |
| `presetPolicies`      | Preset policy definitions                |

## License

MIT
