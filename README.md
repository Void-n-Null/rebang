# !ReBang

[![Live Site](https://img.shields.io/badge/Live_Site-!ReBang-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://rebang.online)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://makeapullrequest.com)

## [rebang.online](https://rebang.online)

A fast, modern bang redirect service that combines bangs from **DuckDuckGo** and **Kagi** into one unified, optimized database—with the ability to create your own custom bangs.

![ReBang Interface](public/rebang_screenshot.png)

## Features

### 🚀 Instant Client-Side Redirects
No server round-trip. Your searches redirect directly from your browser.

### 🔍 Combined Bang Database  
ReBang merges bangs from both DuckDuckGo and Kagi, giving you access to the best of both worlds. Duplicates are intelligently merged so you get one clean trigger for each destination.

### ⚡ Custom Bangs
Create your own bang shortcuts to any website:

1. Click **"My Bangs"** on the homepage
2. Add your trigger, name, and URL pattern (use `%s` for the search query)
3. Your custom bangs work instantly and appear in autocomplete

Custom bangs are stored locally and override built-in bangs with the same trigger.

### 💡 Smart Autocomplete
Discover bangs as you type. Start with `!` and see matching options from the entire database, including your custom bangs.

### ⚙️ Configurable Default Search
Choose your default search engine from the Settings menu. When you search without a bang, ReBang uses your preferred engine.

### 📦 Optimized Database
The bang database is compressed using an array-based format with category lookup tables, reducing file size by ~35% compared to raw JSON. Only the top bangs are bundled inline—the full database loads on-demand.

### 🔄 Monthly Updates
An automated GitHub Actions workflow runs on the 1st of each month to:
- Fetch the latest bangs from DuckDuckGo and Kagi
- Merge and deduplicate entries
- Generate a new content-hashed database file
- Create a PR for review

## Comparison

| Feature | DuckDuckGo | unduck | **ReBang** |
|---------|------------|--------|------------|
| Bang redirects | Server-side | Client-side | Client-side |
| Custom bangs | ❌ | ❌ | ✅ |
| Bang sources | DDG only | DDG only | DDG + Kagi |
| Autocomplete | ✅ | ❌ | ✅ |
| Default search config | ❌ | ❌ | ✅ |
| Modern UI | ✅ | Minimal | ✅ |
| No flash on redirect | ❌ | ✅ | ✅ |
| Optimized database | ❌ | ❌ | ✅ |
| Automated updates | N/A | ❌ | ✅ Monthly |

## Setup

### As Your Default Search Engine

1. Add `https://rebang.online/?q=%s` as a custom search engine in your browser
2. Set it as your default
3. Search normally—include a bang like `!g`, `!yt`, `!w` anywhere in your query to redirect

### Direct Use

Visit [rebang.online](https://rebang.online) and search from there.

## How Custom Bangs Work

Custom bangs let you add shortcuts to any site. Example:

| Trigger | Name | URL Pattern |
|---------|------|-------------|
| `jira` | Jira Search | `https://mycompany.atlassian.net/browse/%s` |
| `docs` | Internal Docs | `https://docs.internal.com/search?q=%s` |
| `npm` | NPM Packages | `https://www.npmjs.com/search?q=%s` |

The `%s` is replaced with your search query. Custom bangs take priority over built-in ones.

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Update bangs from sources
pnpm run update-bangs

# Build for production
pnpm build
```

## Privacy

ReBang runs entirely in your browser. No searches are logged or tracked. Custom bangs and settings are stored in your browser's localStorage.

## Credits

- Inspired by and forked from [unduck](https://github.com/t3dotgg/unduck) by Theo
- Bang data from [DuckDuckGo](https://duckduckgo.com/bang) and [Kagi](https://github.com/kagisearch/bangs)

## License

MIT
