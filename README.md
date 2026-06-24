# Discord Media Scraper

[![DeepWiki](https://img.shields.io/badge/DeepWiki-Paranjayy%2Fdiscord--scraper-blue.svg)](https://deepwiki.com/Paranjayy/discord-scraper)

A Chrome extension to scrape Discord channels and export media/messages with filters, batching, and a built-in viewer.

## General POV (Users)

### What this does

- Scrapes messages from selected Discord channels
- Downloads media/files in organized folders
- Exports message data (JSON / CSV / TXT)
- Opens scraped data in a local viewer

### Key features

- Multi-channel scraping (channels grouped by category)
- File type filters: Images, Videos, Archives, PDFs, Audio, Code, Docs, Messages
- Advanced filters: date range, author, text search
- Concurrent download control (3 / 5 / 8 / 10)
- Resume support for interrupted scrapes
- Recent scrape history and channel preview
- Stats for count and file sizes (total/avg/min/max)

### Local install (Chrome)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this repository root folder

### Quick usage

1. Open `https://discord.com`
2. Click the extension icon
3. Use **Get Token from Discord** (or paste token manually)
4. Select server + channels
5. Select download types and optional filters
6. Click **Start Scraping**
7. Use **Download All**, **Copy URLs**, or **View in Viewer**

### Output behavior

Downloads are organized by server/channel/type (for example, media and files go into separate folders), and message exports are available in JSON/CSV/TXT.

### Privacy & safety

- Intended only for content you are authorized to access
- Keep your Discord token private
- Token is stored locally by the extension

## Dev POV (Contributors)

### Project structure

- `manifest.json` — Chrome extension manifest (MV3)
- `popup.html` / `popup.js` / `styles.css` — extension popup UI + scraping workflow
- `background.js` — background service worker
- `viewer/` — Next.js viewer app for browsing exported data
- `icons/` — extension assets

### Prerequisites

- Chrome browser for extension testing
- Node.js (for the `viewer/` app)

### Development workflow

#### Extension (root)

1. Make changes in root files (`popup.js`, `background.js`, UI files)
2. Reload the unpacked extension in `chrome://extensions/`
3. Re-test on `discord.com`

#### Viewer app (`viewer/`)

```bash
cd viewer
npm ci
npm run dev
```

Other useful commands:

```bash
cd viewer
npm run build
npm run start
npm run lint
```

> Note: `npm run lint` may prompt for initial ESLint setup if no ESLint config has been generated yet.

### Release/package notes

The repository includes a packaged extension zip (`discord-scraper-v1.6.0.zip`).
For manual repackaging, zip the extension root files and required assets (`manifest.json`, scripts, styles, `icons/`, `viewer/` static files).

## DeepWiki

- Docs/chat for this repo: https://deepwiki.com/Paranjayy/discord-scraper
