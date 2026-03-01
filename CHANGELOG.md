# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `meta` option to inject `<meta name="robots">` tags into HTML via `transformIndexHtml`
- `meta: true` derives meta tags from the active preset (e.g. `blockAI` → `noindex` per AI bot)
- Multiple shorthand forms: `'noindex'`, `['noindex', 'nofollow']`, `MetaTag`, `MetaTag[]`
- Per-bot meta tags: `{ name: 'GPTBot', content: 'noindex' }`
- `MetaDirective` type with autocomplete for all standard directives (`noindex`, `nofollow`, `noarchive`, `max-snippet:N`, etc.)
- `MetaTag` type for explicit `<meta name="..." content="...">` configuration
- `normalizeMeta()` and `metaTagsToHtml()` exported for standalone use

## [0.1.0] - 2026-03-01

### Added

- Vite plugin that generates `robots.txt` at build time
- Dev/preview server middleware serves robots.txt (default: `Disallow: /`)
- Preview server middleware support
- 4 built-in presets: `allowAll`, `disallowAll`, `blockAI`, `searchOnly`
- `blockAI` preset blocks 12 known AI/LLM training crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, etc.)
- `searchOnly` preset allows only major search engines (Google, Bing, DuckDuckGo, Yahoo, Apple, Baidu, Yandex)
- Per-bot policy rules with `allow`, `disallow`, `crawlDelay`, and `comment`
- `OneOrMany<T>` ergonomic — single values or arrays accepted everywhere
- `KnownBot` union type with 25+ bots for autocomplete (search engines + AI crawlers)
- `Sitemap:` directive support (single URL, multiple URLs, or `true` for auto-detect)
- `Host:` directive support (Yandex)
- `header` option for top-of-file comments
- `devMode` option: `'disallowAll'` (default), `'same'`, or `false`
- `fileName` option (default: `robots.txt`)
- `serialize()` function exported for standalone use (no Vite dependency)
- `AI_BOTS` and `SEARCH_ENGINES` constants exported
- `presetPolicies` record exported for custom composition
- Default export for convenient `import robotsTxt from 'vite-robots-txt'`
- ESM + CJS dual package output
- Full TypeScript types with JSDoc documentation
- Vite 5, 6, and 7 peer dependency support

[Unreleased]: https://github.com/kjanat/vite-robots-txt/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kjanat/vite-robots-txt/releases/tag/v0.1.0
