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
- CI quality gate workflow (test, typecheck, lint, build on every push/PR)
- Plugin unit tests covering middleware, path matching, base handling, devMode, meta injection, and asset emission
- crawlDelay validation rejects NaN, negative, and Infinity values
- NPM version badge in README
- Biome lint autofix step in CI autofix workflow
- `@typescript/native-preview` (tsgo) for fast typechecking

### Changed

- URL path joining uses `new URL()` API instead of manual string concatenation
- `toArray()` co-located with `OneOrMany<T>` in `types.ts` (type + runtime normalizer together)
- `presetPolicies` typed as `Readonly<Record<Preset, readonly PolicyRule[]>>`
- Bot arrays use `satisfies readonly KnownBot[]` for type safety
- Dev server content deferred to `configResolved` (siteBase now available)
- `sitemap: true` now warns that directives should be absolute URLs per spec
- Test runner migrated from vitest to `bun:test`; tests moved to `tests/`
- Publish workflow hardened: `--frozen-lockfile`, test+typecheck gate, strict tag pattern
- Autofix workflow: removed `--unsafe` flag from biome
- Use `.ts` import extensions throughout source files

### Removed

- `utils.ts` — consolidated into `types.ts`
- vitest dependency and configuration
- Unnecessary type assertions (`as` casts) in serialize.ts and meta.ts

### Fixed

- `searchOnly` meta preset emits `['index', 'follow']` (was incorrectly `['noindex', 'nofollow']`)
- Publish workflow pipe operator (`|&` → `|`)
- Dev middleware now strips query strings before path matching

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
