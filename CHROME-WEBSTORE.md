# Chrome Web Store Publishing Guide

## Prerequisites

1. **Google Developer Account** ($5 one-time fee)
   - Go to https://chrome.google.com/webstore/devconsole
   - Sign in with your Google account
   - Pay the one-time registration fee

2. **Prepare Extension Files**
   - The extension is ready in this directory
   - No external dependencies needed (all bundled)

## Package Extension for Upload

1. **Create a ZIP file** containing only these files:
   ```
   manifest.json
   popup.html
   popup.js
   background.js
   styles.css
   jszip.min.js
   icons/
     icon16.png
     icon48.png
     icon128.png
   viewer/
     index.html
   ```

2. **Exclude these files**:
   ```
   node_modules/
   .git/
   viewer/ (if deploying separately)
   *.md
   IDEAS.md
   CHROME-WEBSTORE.md
   ```

3. **ZIP command** (run from project root):
   ```bash
   zip -r discord-scraper.zip manifest.json popup.html popup.js background.js styles.css jszip.min.js icons/ viewer/
   ```

## Chrome Web Store Submission

### Step 1: Access Developer Dashboard
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item" or "Add New Item"

### Step 2: Upload ZIP
1. Drag and drop `discord-scraper.zip` or click to upload
2. Fill in the store listing

### Step 3: Store Listing

**Name**: Discord Media Scraper
**Summary** (132 chars max):
```
Scrape and download images, videos, files, and messages from any Discord channel with organized folders.
```

**Description** (detailed):
```
Discord Media Scraper is a powerful tool for extracting content from Discord channels. Perfect for backing up servers, collecting media, or archiving important conversations.

Features:
• Multi-channel support - Select multiple channels to scrape at once
• 8 file type filters - Images, Videos, Archives, PDFs, Audio, Code, Documents, Messages
• Organized downloads - Files are automatically organized by server/channel/type
• Advanced filters - Filter by date range, author, or content search
• Message export - Export chat history as JSON, CSV, or TXT
• Storage estimate - See how much space files will take before downloading
• Built-in viewer - View scraped content in a clean, organized interface
• Fast & reliable - API-based scraping gets ALL messages, not just visible ones

How to use:
1. Click the extension icon
2. Get your token from Discord (auto-grab or paste manually)
3. Select your server and channels
4. Choose file types to download
5. Click "Start Scraping"
6. Click "Download All" to save files

Privacy: This extension only works with servers you have access to. Your token is stored locally and never sent anywhere except Discord's API.
```

**Category**: Developer Tools (or Utilities)
**Language**: English

### Step 4: Add Screenshots
- Take 1-5 screenshots of the extension in action
- Recommended size: 1280x800 or 640x400
- Show: main interface, server selection, file type grid, download progress

### Step 5: Privacy Practices
- **Data Collection**: "This extension does not collect any user data"
- **Remote Code**: "This extension does not include any remote code"
- Check: "Does not collect user data"
- Check: "Does not use remote code"

### Step 6: Submit for Review
1. Click "Submit for Review"
2. Review typically takes 1-3 business days

## Common Rejection Reasons (Avoid These)

1. **Permission warnings**: Ensure `host_permissions` are clearly explained
2. **Misleading descriptions**: Don't claim features you don't have
3. **Privacy policy**: Not required for this extension (no data collection)
4. **Single purpose**: Extension should have one clear purpose

## Post-Approval

1. Extension will be live at:
   `https://chrome.google.com/webstore/detail/discord-media-scraper/[extension-id]`

2. Share the link with users

3. Monitor reviews and user feedback

## Updating the Extension

1. Make changes to the code
2. Increment version in `manifest.json`
3. Create new ZIP
4. Go to Developer Dashboard
5. Click "Update" on your existing item
6. Upload new ZIP
7. Submit for review

## Tips

- **Test thoroughly** before submitting
- **Use meaningful screenshots** that show the extension's value
- **Write a clear description** that explains what the extension does
- **Respond to user reviews** promptly
- **Keep the extension updated** with bug fixes and features

## Need Help?

- Chrome Web Store Developer Documentation: https://developer.chrome.com/docs/webstore/
- Chrome Web Store Support: https://support.google.com/chrome_webstore/
