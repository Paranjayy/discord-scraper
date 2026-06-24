# Discord Media Scraper

[![DeepWiki](https://img.shields.io/badge/DeepWiki-Paranjayy%2Fdiscord--scraper-blue.svg)](https://deepwiki.com/Paranjayy/discord-scraper)

Chrome extension for scraping Discord channels and downloading media, files, and messages with filtering, batching, and export tools.

## Features

- Multi-channel scraping with category grouping
- File type filters (images, videos, archives, PDFs, audio, code, docs, messages)
- Advanced filters (date range, author, keyword)
- Organized downloads by server/channel/type
- Export helpers (URLs, JSON, CSV, TXT)
- Built-in viewer for chat/media/files

## Install (Local)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `/home/runner/work/discord-scraper/discord-scraper`

## Usage

1. Open Discord in your browser.
2. Click the extension icon.
3. Get/paste your Discord token.
4. Select server and channels.
5. Choose file types and optional filters.
6. Start scraping and download results.

## Project Structure

- `/home/runner/work/discord-scraper/discord-scraper/manifest.json` – extension manifest
- `/home/runner/work/discord-scraper/discord-scraper/popup.html` + `/home/runner/work/discord-scraper/discord-scraper/popup.js` – popup UI and core logic
- `/home/runner/work/discord-scraper/discord-scraper/background.js` – service worker
- `/home/runner/work/discord-scraper/discord-scraper/viewer/` – local viewer app

## DeepWiki

- Repo docs/chat: https://deepwiki.com/Paranjayy/discord-scraper

## Notes

- This project is intended for scraping content you are authorized to access.
- Keep your token private. It is stored locally in the extension.
