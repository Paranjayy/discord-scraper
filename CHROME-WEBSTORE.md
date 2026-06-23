# Chrome Web Store Publishing Guide

## Quick Start (Lowest Friction)

### 1. Get a Developer Account ($5 one-time)
- Go to https://chrome.google.com/webstore/devconsole
- Sign in with your Google account
- Pay the one-time $5 registration fee

### 2. Upload the Ready-Made ZIP
The file `discord-scraper-v1.4.0.zip` is already built and ready at:
```
/Users/paranjay/Developer/Discord Scraper/discord-scraper-v1.4.0.zip
```

Just drag and drop it into the Chrome Web Store Developer Dashboard.

### 3. Fill in the Store Listing

**Name**: Discord Media Scraper

**Summary** (132 chars max):
```
Scrape and download images, videos, files, and messages from any Discord channel with organized folders.
```

**Description** (copy-paste):
```
Discord Media Scraper is a powerful tool for extracting content from Discord channels. Perfect for backing up servers, collecting media, or archiving important conversations.

Features:
• Multi-channel support with category grouping - Select multiple channels organized by category
• 8 file type filters - Images, Videos, Archives, PDFs, Audio, Code, Documents, Messages
• Organized downloads - Files are automatically organized by server/channel/type
• Advanced filters - Filter by date range, author, or content search
• Message export - Export chat history as JSON, CSV, or TXT
• Storage estimate - See how much space files will take before downloading
• Built-in viewer - View scraped content in a clean, organized interface with chat, media, and grid views
• Fast & reliable - API-based scraping gets ALL messages, not just visible ones

How to use:
1. Click the extension icon
2. Get your token from Discord (auto-grab or paste manually)
3. Select your server and channels (grouped by category)
4. Choose file types to download
5. Click "Start Scraping"
6. Click "Download All" to save files

Privacy: This extension only works with servers you have access to. Your token is stored locally and never sent anywhere except Discord's API.
```

**Category**: Developer Tools
**Language**: English

### 4. Privacy Practices
Check these boxes:
- ✅ "Does not collect user data"
- ✅ "Does not use remote code"

**Data Collection disclosure**: "This extension does not collect any user data."

**Remote Code disclosure**: "This extension does not include any remote code."

### 5. Screenshots
Take 1-3 screenshots (1280x800 or 640x400):
1. The main interface with server/channel selection
2. The download types grid with category-grouped channels
3. The viewer showing scraped content

### 6. Submit
Click "Submit for Review" — approval usually takes 1-3 business days.

---

## What's in the ZIP (v1.4.0)

```
discord-scraper-v1.4.0.zip (53KB)
├── manifest.json          # MV3 manifest, v1.4.0
├── popup.html             # Main extension UI
├── popup.js               # Extension logic
├── background.js          # Service worker (token interception, downloads)
├── styles.css             # UI styles
├── jszip.min.js           # ZIP library for bulk downloads
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── viewer/
    ├── index.html         # Local viewer (CSP-compliant)
    ├── viewer.css         # Viewer styles
    └── viewer.js          # Viewer logic
```

## Features in v1.4.0

- **Channel categories**: Channels grouped by Discord category headers
- **Two-column layout**: Uses full screen width when available
- **CSP-compliant viewer**: Works in Chrome extension context (no CDN, no inline scripts)
- **Multi-format viewer**: Supports JSON, TXT, CSV, HTML imports
- **8 file type filters**: Images, Videos, Archives, PDFs, Audio, Code, Docs, Messages
- **Organized downloads**: Files saved as `ServerName_ChannelName_type/filename`
- **Detailed stats**: Total/avg/min/max file sizes after scraping

## After Approval

Your extension will be live at:
```
https://chrome.google.com/webstore/detail/discord-media-scraper/[extension-id]
```

## Updating Later

1. Make changes to code
2. Bump version in `manifest.json`
3. Create new ZIP: `zip -r discord-scraper-vX.Y.Z.zip manifest.json popup.html popup.js background.js styles.css jszip.min.js icons/ viewer/`
4. Go to Developer Dashboard → your item → "Update"
5. Upload new ZIP → Submit for review

## Resources

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Chrome Web Store Docs: https://developer.chrome.com/docs/webstore/
- Chrome Web Store Support: https://support.google.com/chrome_webstore/
