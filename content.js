(() => {
  const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const ZIP_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz'];

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape') {
      try {
        const data = scrapeChannel();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }
    return true;
  });

  function scrapeChannel() {
    const images = [];
    const videos = [];
    const zips = [];
    const seen = new Set();

    const messages = document.querySelectorAll('[id^="chat-messages-"]');

    messages.forEach(msg => {
      const content = msg.querySelector('[class*="messageContent"]');
      const accessories = msg.querySelector('[id^="message-accessories"]');

      const author = msg.querySelector('[class*="username"]')?.textContent || 'Unknown';
      const timestamp = msg.querySelector('time')?.textContent || '';

      if (accessories) {
        scrapeAttachments(accessories, author, timestamp, seen, images, videos, zips);
      }

      if (content) {
        scrapeInlineLinks(content, author, timestamp, seen, images, videos, zips);
      }
    });

    return { images, videos, zips };
  }

  function scrapeAttachments(container, author, timestamp, seen, images, videos, zips) {
    container.querySelectorAll('a').forEach(link => {
      const href = link.href;
      if (!href || seen.has(href)) return;

      if (href.includes('cdn.discordapp.com') || href.includes('media.discordapp.net')) {
        const item = categorizeUrl(href, author, timestamp);
        if (item) {
          seen.add(href);
          if (item.type === 'image') images.push(item);
          else if (item.type === 'video') videos.push(item);
          else if (item.type === 'zip') zips.push(item);
        }
      }
    });

    container.querySelectorAll('[class*="fileNameLink"]').forEach(link => {
      const href = link.href;
      if (!href || seen.has(href)) return;

      const name = link.textContent.trim();
      const item = categorizeByName(name, href, author, timestamp);
      if (item) {
        seen.add(href);
        if (item.type === 'image') images.push(item);
        else if (item.type === 'video') videos.push(item);
        else if (item.type === 'zip') zips.push(item);
      }
    });
  }

  function scrapeInlineLinks(container, author, timestamp, seen, images, videos, zips) {
    container.querySelectorAll('a[href]').forEach(link => {
      const href = link.href;
      if (!href || seen.has(href)) return;

      if (href.includes('cdn.discordapp.com') || href.includes('media.discordapp.net')) {
        const item = categorizeUrl(href, author, timestamp);
        if (item) {
          seen.add(href);
          if (item.type === 'image') images.push(item);
          else if (item.type === 'video') videos.push(item);
          else if (item.type === 'zip') zips.push(item);
        }
      }
    });
  }

  function categorizeUrl(url, author, timestamp) {
    try {
      const cleanUrl = url.split('?')[0];
      const name = cleanUrl.split('/').pop() || 'unknown';
      const ext = '.' + name.split('.').pop().toLowerCase();

      if (IMAGE_EXTENSIONS.includes(ext)) {
        return { type: 'image', name, url, author, timestamp, size: '' };
      }
      if (VIDEO_EXTENSIONS.includes(ext)) {
        return { type: 'video', name, url, author, timestamp, size: '' };
      }
      if (ZIP_EXTENSIONS.includes(ext)) {
        return { type: 'zip', name, url, author, timestamp, size: '' };
      }

      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
        return { type: 'image', name, url, author, timestamp, size: '' };
      }
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
        return { type: 'video', name, url, author, timestamp, size: '' };
      }
      if (url.includes('.zip') || url.includes('.rar') || url.includes('.7z')) {
        return { type: 'zip', name, url, author, timestamp, size: '' };
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function categorizeByName(name, url, author, timestamp) {
    const ext = '.' + name.split('.').pop().toLowerCase();

    if (ZIP_EXTENSIONS.includes(ext)) {
      const sizeEl = document.querySelector(`a[href="${CSS.escape(url)}"]`)?.closest('[class*="file"]')?.querySelector('[class*="normal"]');
      return { type: 'zip', name, url, author, timestamp, size: sizeEl?.textContent || '' };
    }
    if (VIDEO_EXTENSIONS.includes(ext)) {
      return { type: 'video', name, url, author, timestamp, size: '' };
    }
    if (IMAGE_EXTENSIONS.includes(ext)) {
      return { type: 'image', name, url, author, timestamp, size: '' };
    }

    return categorizeUrl(url, author, timestamp);
  }
})();
