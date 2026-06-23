# Chrome Web Store Publishing Guide

## Step-by-Step: Publish Your Extension

### Step 1: Create a Developer Account ($5 one-time)
1. Go to **https://chrome.google.com/webstore/devconsole**
2. Sign in with your Google account (use `paranjay245@gmail.com` or your main account)
3. Click "Pay the $5 registration fee" — one-time, lifetime access
4. Complete the developer profile with your name/email

### Step 2: Upload the ZIP
The ready-made ZIP is at:
```
/Users/paranjay/Developer/Discord Scraper/discord-scraper-v1.6.0.zip
```
In the Developer Dashboard:
1. Click **"New Item"** (top-left)
2. Drag and drop the ZIP file, or click to browse and select it
3. The upload will verify the manifest — you should see "Item created successfully"

### Step 3: Store Listing (Copy-Paste Everything Below)

**Name:**
```
Discord Media Scraper
```

**Summary** (132 chars max — this shows in search results):
```
Scrape and download images, videos, files, and messages from any Discord channel with organized folders.
```

**Description** (full description — shows on the extension page):
```
Discord Media Scraper is a powerful tool for extracting content from Discord channels. Perfect for backing up servers, collecting media, or archiving important conversations.

KEY FEATURES:

Multi-Channel Scraping
• Select multiple channels at once, organized by Discord category
• Scrape ALL messages via Discord API — not just visible ones
• Channel preview — see last 5 messages before scraping
• Server info card — member count, online count, channel count

8 File Type Filters
• Images (JPG, PNG, GIF, WebP, SVG)
• Videos (MP4, WebM, MOV, AVI, MKV)
• Archives (ZIP, RAR, 7Z, TAR, GZ)
• PDFs
• Audio (MP3, WAV, OGG, FLAC, AAC)
• Code files (JS, TS, PY, Java, C++, and 25+ more)
• Documents (DOC, XLS, PPT, CSV)
• Messages (chat history as TXT)

Organized Downloads
• Files saved as: ServerName_ChannelName_type/filename
• Each file type gets its own subfolder
• No "Save As" dialogs — downloads happen automatically

Advanced Filters
• Date range picker (from/to)
• Author name filter
• Content search

Smart Features
• Batch size control (3/5/8/10 concurrent downloads)
• Resume interrupted scrapes — picks up where you left off
• Scrape history — re-download or view past scrapes
• Storage estimate — see total size before downloading
• Detailed stats — total/avg/min/max file sizes

Export Options
• Copy all file URLs to clipboard
• Export messages as JSON, CSV, or TXT
• Built-in viewer — view scraped content in chat, media, or grid view

Built-in Viewer
• Opens in a new tab with clean, organized layout
• Chat view with timestamps and author names
• Media gallery with lightbox
• File browser with type icons
• Supports JSON, TXT, CSV, and HTML imports

HOW TO USE:
1. Click the extension icon on the Discord website
2. Click "Get Token" to auto-grab your Discord token (or paste manually)
3. Select your server from the dropdown
4. Check the channels you want to scrape (grouped by category)
5. Choose which file types to download
6. Optionally set advanced filters (date, author, search)
7. Click "Start Scraping"
8. Review stats and click "Download All"

PRIVACY:
This extension only accesses servers you have membership in. Your authentication token is stored locally in your browser and is only sent to Discord's official API (discord.com). No data is sent to any third-party servers. The extension does not collect, track, or transmit any user data.
```

**Category:** `Developer Tools`

**Language:** `English`

### Step 4: Upload Icons

You need a **128x128 PNG** icon. You already have one at:
```
/Users/paranjay/Developer/Discord Scraper/icons/icon128.png
```
Upload it in the "Icon" section of the store listing.

### Step 5: Upload Screenshots (REQUIRED)

You need at least **1 screenshot** (1280x800 or 640x400). Recommended: 3 screenshots.

**Screenshot 1** — Main Interface (1280x800):
- Show the extension popup with server selected, channels grouped by category, file type grid visible

**Screenshot 2** — Right Column Features (1280x800):
- Show server info card, channel preview with messages, and scrape history

**Screenshot 3** — Download Complete (1280x800):
- Show stats, action buttons, and results list after a successful scrape

**How to take screenshots:**
1. Load the extension in Chrome (see "Test Locally" below)
2. Open it on Discord, select a server
3. Use macOS screenshot: `Cmd + Shift + 4` then drag to select
4. Or use Chrome DevTools: F12 → Device toolbar → set to 1280x800

### Step 6: Privacy Practices

Answer the questionnaire:

**Does this extension collect user data?**
→ ❌ No (unchecked)

**Does this extension use remote code?**
→ ❌ No (unchecked)

**Privacy Policy:**
You can either:
- Link to the GitHub README: `https://github.com/Paranjayy/discord-scraper`
- Or write: "This extension does not collect, store, or transmit any user data. The authentication token is stored locally and only used to communicate with Discord's official API."

**Data Usage Compliance:**
- ✅ "I certify that the data practices described in this extension's privacy policy are accurate"

### Step 7: Submit for Review

1. Click **"Submit for Review"** at the bottom
2. Approval typically takes **1-3 business days** (sometimes faster)
3. You'll get an email when approved
4. Your extension will be live at: `https://chrome.google.com/webstore/detail/discord-media-scraper/[extension-id]`

---

## Test Locally Before Publishing

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the folder: `/Users/paranjay/Developer/Discord Scraper`
5. The extension appears in your toolbar
6. Go to discord.com, click the extension icon, test everything

---

## What's in the ZIP (v1.6.0)

```
discord-scraper-v1.6.0.zip (57KB)
├── manifest.json          # MV3 manifest, v1.6.0
├── popup.html             # Two-column extension UI
├ popup.js               # Core logic (scraping, downloads, history)
├── background.js          # Service worker (token, downloads, CORS)
├── styles.css             # Full UI styles (two-column, responsive)
├── jszip.min.js           # ZIP library (loaded in background)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── viewer/
    ├── index.html         # Local viewer shell (CSP-compliant)
    ├── viewer.css         # Viewer styles (vanilla CSS, no CDN)
    └── viewer.js          # Viewer logic (multi-format, lightbox)
```

## Features in v1.6.0

- **Channel categories**: Channels grouped by Discord category headers
- **Two-column layout**: Server/channels on left, info/stats on right
- **Server info card**: Icon, name, description, member count, online count
- **Channel preview**: Hover eye icon to preview last 5 messages
- **Scrape history**: Last 5 scrapes with re-download + view + delete
- **Resume interrupted scrapes**: Banner shows last incomplete scrape
- **Batch size control**: 3/5/8/10 concurrent downloads
- **8 file type filters**: Images, Videos, Archives, PDFs, Audio, Code, Docs, Messages
- **CSP-compliant viewer**: No CDN, no inline scripts — works in MV3
- **Multi-format viewer**: JSON, TXT, CSV, HTML auto-detection
- **Organized downloads**: `ServerName_ChannelName_type/filename`
- **Detailed stats**: Total/avg/min/max file sizes
- **Export**: Copy URLs, JSON/CSV/TXT message export

---

## Updating Later

1. Make code changes
2. Bump version in `manifest.json`
3. Create new ZIP:
   ```bash
   zip -r discord-scraper-vX.Y.Z.zip manifest.json popup.html popup.js background.js styles.css jszip.min.js icons/ viewer/index.html viewer/viewer.css viewer/viewer.js
   ```
4. Go to Developer Dashboard → your item → "Package" tab → "Upload updated package"
5. Upload new ZIP → Update store listing if needed → Submit for review

---

## Troubleshooting

**"Permission denied" errors:**
- Make sure you're on discord.com when clicking "Get Token"
- The extension needs `webRequest` permission to intercept the token

**"Invalid token" after pasting:**
- Make sure you copied the full token (no extra spaces)
- Tokens expire — grab a fresh one from Discord

**Downloads not working:**
- Check that `chrome.downloads` permission is granted
- Make sure you're not in Incognito mode (extensions are disabled by default)

**Extension rejected:**
- Read the rejection email carefully — usually it's a screenshot or privacy policy issue
- Fix the issue and resubmit

---

## Resources

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Chrome Web Store Docs: https://developer.chrome.com/docs/webstore/
- Manifest V3 Migration: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- Your GitHub repo: https://github.com/Paranjayy/discord-scraper
