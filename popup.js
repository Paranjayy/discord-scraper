document.addEventListener('DOMContentLoaded', () => {
  const tokenSection = document.getElementById('tokenSection');
  const getTokenBtn = document.getElementById('getTokenBtn');
  const tokenInputGroup = document.getElementById('tokenInputGroup');
  const tokenInput = document.getElementById('tokenInput');
  const saveTokenBtn = document.getElementById('saveTokenBtn');
  const mainSection = document.getElementById('mainSection');
  const userInfo = document.getElementById('userInfo');
  const serverSelect = document.getElementById('serverSelect');
  const channelSelect = document.getElementById('channelSelect');
  const scanBtn = document.getElementById('scanBtn');
  const stopBtn = document.getElementById('stopBtn');
  const counter = document.getElementById('counter');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const stats = document.getElementById('stats');
  const actions = document.getElementById('actions');
  const results = document.getElementById('results');
  const resultsList = document.getElementById('resultsList');
  const resultsTitle = document.getElementById('resultsTitle');
  const clearResults = document.getElementById('clearResults');
  const downloadBtn = document.getElementById('downloadBtn');
  const exportBtn = document.getElementById('exportBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportTxtBtn = document.getElementById('exportTxtBtn');
  const status = document.getElementById('status');
  const toggleAdvanced = document.getElementById('toggleAdvanced');
  const advancedContent = document.getElementById('advancedContent');
  const dateFrom = document.getElementById('dateFrom');
  const dateTo = document.getElementById('dateTo');
  const authorFilter = document.getElementById('authorFilter');
  const searchFilter = document.getElementById('searchFilter');

  const filterImages = document.getElementById('filterImages');
  const filterVideos = document.getElementById('filterVideos');
  const filterZips = document.getElementById('filterZips');
  const filterText = document.getElementById('filterText');
  const selectAll = document.getElementById('selectAll');

  const imageCount = document.getElementById('imageCount');
  const videoCount = document.getElementById('videoCount');
  const zipCount = document.getElementById('zipCount');
  const textCount = document.getElementById('textCount');

  let token = null;
  let messages = [];
  let mediaFiles = [];
  let abort = false;
  let channels = [];

  const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif'];
  const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const ZIP_EXT = ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz'];

  const filters = [filterImages, filterVideos, filterZips, filterText];

  selectAll.addEventListener('change', () => {
    filters.forEach((f) => (f.checked = selectAll.checked));
    updateResults();
  });

  filters.forEach((f) => {
    f.addEventListener('change', () => {
      selectAll.checked = filters.every((f) => f.checked);
      updateResults();
    });
  });

  toggleAdvanced.addEventListener('click', () => {
    const isOpen = advancedContent.style.maxHeight !== '0px';
    advancedContent.style.maxHeight = isOpen ? '0px' : '300px';
    toggleAdvanced.classList.toggle('open', !isOpen);
  });

  [dateFrom, dateTo, authorFilter, searchFilter].forEach((el) => {
    el.addEventListener('input', updateResults);
  });

  getTokenBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getToken' });
    tokenInputGroup.style.display = 'flex';
    tokenInput.focus();
    showStatus('Opening Discord to grab token...', 'info');
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'saveToken' && request.token) {
      token = request.token;
      chrome.storage.local.set({ token: token });
      tokenInput.value = token;
      initWithToken(token);
    }
  });

  saveTokenBtn.addEventListener('click', () => {
    token = tokenInput.value.trim();
    if (token) {
      chrome.storage.local.set({ token: token });
      initWithToken(token);
    }
  });

  tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveTokenBtn.click();
  });

  chrome.storage.local.get('token', async (data) => {
    if (data.token) {
      token = data.token;
      tokenInput.value = token;
      initWithToken(token);
    }
  });

  async function initWithToken(t) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: t },
      });
      if (!res.ok) throw new Error('Invalid token');
      const user = await res.json();
      userInfo.textContent = `Logged in as ${user.username}`;
      tokenSection.style.display = 'none';
      mainSection.style.display = 'block';
      await loadServers(t);
    } catch (e) {
      showStatus('Invalid token. Try again.', 'error');
      token = null;
      chrome.storage.local.remove('token');
    }
  }

  async function loadServers(t) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: t },
      });
      if (!res.ok) throw new Error('Failed');
      const guilds = await res.json();
      serverSelect.innerHTML = '';
      guilds.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        serverSelect.appendChild(opt);
      });
      await loadChannels(t);
    } catch (e) {
      showStatus('Failed to load servers', 'error');
    }
  }

  serverSelect.addEventListener('change', () => {
    counter.textContent = '';
    actions.style.display = 'none';
    results.style.display = 'none';
    loadChannels(token);
  });

  async function loadChannels(t) {
    const serverId = serverSelect.value;
    if (!serverId) return;
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${serverId}/channels`,
        { headers: { Authorization: t } }
      );
      if (!res.ok) throw new Error('Failed');
      const allChannels = await res.json();
      channels = allChannels.filter((c) => c.type === 0 || c.type === 5 || c.type === 1);
      channelSelect.innerHTML = '';
      channels.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        const type = c.type === 5 ? '📢' : c.type === 1 ? '💬' : '#';
        opt.textContent = `${type} ${c.name}`;
        channelSelect.appendChild(opt);
      });
    } catch (e) {
      showStatus('Failed to load channels', 'error');
    }
  }

  channelSelect.addEventListener('change', () => {
    counter.textContent = '';
    actions.style.display = 'none';
    results.style.display = 'none';
  });

  scanBtn.addEventListener('click', startScraping);
  stopBtn.addEventListener('click', () => { abort = true; });

  async function startScraping() {
    messages = [];
    mediaFiles = [];
    abort = false;
    counter.textContent = '';
    actions.style.display = 'none';
    results.style.display = 'none';
    scanBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    serverSelect.disabled = true;
    channelSelect.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    const channel = channels.find((c) => c.id === channelSelect.value);
    if (!channel) {
      showStatus('Select a channel', 'error');
      resetUI();
      return;
    }

    showStatus('Scraping messages...', 'info');
    await fetchMessages(token, channel.id, channel.last_message_id);
    extractMedia();
    updateStats();
    updateResults();
    resetUI();

    if (messages.length > 0 && !abort) {
      showStatus(`Scraped ${messages.length} messages. Found ${mediaFiles.length} media files.`, 'success');
    }
  }

  async function fetchMessages(t, channelId, before) {
    if (abort) return;
    let retries = 0;
    const maxRetries = 5;

    while (true) {
      if (abort) return;
      try {
        let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`;
        if (before) url += `&before=${before}`;

        const res = await fetch(url, { headers: { Authorization: t } });

        if (res.status === 429) {
          const data = await res.json();
          const retryAfter = (data.retry_after || 1) * 1000;
          showStatus(`Rate limited. Waiting ${Math.ceil(retryAfter / 1000)}s...`, 'info');
          await sleep(retryAfter);
          retries++;
          if (retries > maxRetries) {
            showStatus('Too many rate limits. Stopping.', 'error');
            return;
          }
          continue;
        }

        if (!res.ok) {
          showStatus(`Access denied (${res.status})`, 'error');
          return;
        }

        retries = 0;
        const data = await res.json();
        messages.push(...data);
        counter.textContent = `Messages: ${messages.length}`;

        const pct = Math.min(100, (messages.length / 5000) * 100);
        progressFill.style.width = pct + '%';

        if (data.length < 100) return;
        before = data[data.length - 1].id;
        await sleep(350);
      } catch (e) {
        showStatus('Network error. Retrying...', 'error');
        await sleep(2000);
        retries++;
        if (retries > maxRetries) return;
      }
    }
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function resetUI() {
    scanBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';
    serverSelect.disabled = false;
    channelSelect.disabled = false;
    progressBar.style.display = 'none';
    actions.style.display = messages.length > 0 ? 'flex' : 'none';
  }

  function extractMedia() {
    mediaFiles = [];
    const seen = new Set();
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    const authorQ = authorFilter.value.toLowerCase().trim();
    const searchQ = searchFilter.value.toLowerCase().trim();

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp);
      if (fromDate && msgDate < fromDate) continue;
      if (toDate && msgDate > toDate) continue;

      const author = msg.author?.username || 'Unknown';
      if (authorQ && !author.toLowerCase().includes(authorQ)) continue;

      const content = (msg.content || '').toLowerCase();
      if (searchQ && !content.includes(searchQ)) continue;

      if (msg.attachments) {
        for (const att of msg.attachments) {
          const url = att.url || att.proxy_url;
          if (!url || seen.has(url)) continue;
          seen.add(url);

          const name = att.filename || 'unknown';
          const ext = '.' + name.split('.').pop().toLowerCase();
          const size = att.size ? formatSize(att.size) : '';
          const type = getTypeFromExt(ext);
          if (type) {
            mediaFiles.push({
              type, name, url, size, author,
              timestamp: msg.timestamp || '',
              source: 'attachment',
              date: msgDate.toISOString().split('T')[0],
            });
          }
        }
      }

      if (msg.embeds) {
        for (const embed of msg.embeds) {
          const embedUrl = embed.url;
          const imageUrl = embed.image?.url || embed.thumbnail?.url || embed.video?.url;
          if (!imageUrl || seen.has(imageUrl)) continue;
          seen.add(imageUrl);

          const name = imageUrl.split('/').pop().split('?')[0] || 'embed';
          const ext = '.' + name.split('.').pop().toLowerCase();
          const type = getTypeFromExt(ext) || (embed.video ? 'video' : 'image');
          const size = embed.image?.width && embed.image?.height
            ? `${embed.image.width}x${embed.image.height}`
            : '';

          mediaFiles.push({
            type, name: `embed_${name}`, url: imageUrl, size, author,
            timestamp: msg.timestamp || '',
            source: 'embed',
            date: msgDate.toISOString().split('T')[0],
          });
        }
      }
    }
  }

  function getTypeFromExt(ext) {
    if (IMAGE_EXT.includes(ext)) return 'image';
    if (VIDEO_EXT.includes(ext)) return 'video';
    if (ZIP_EXT.includes(ext)) return 'zip';

    const urlChecks = { image: IMAGE_EXT, video: VIDEO_EXT, zip: ZIP_EXT };
    for (const [type, exts] of Object.entries(urlChecks)) {
      if (exts.some((e) => ext.includes(e))) return type;
    }
    return null;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function getSelectedMedia() {
    const items = [];
    if (filterImages.checked) items.push(...mediaFiles.filter((f) => f.type === 'image'));
    if (filterVideos.checked) items.push(...mediaFiles.filter((f) => f.type === 'video'));
    if (filterZips.checked) items.push(...mediaFiles.filter((f) => f.type === 'zip'));
    return items;
  }

  function getFilteredMessages() {
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    const authorQ = authorFilter.value.toLowerCase().trim();
    const searchQ = searchFilter.value.toLowerCase().trim();

    return messages.filter((m) => {
      const d = new Date(m.timestamp);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      if (authorQ && !(m.author?.username || '').toLowerCase().includes(authorQ)) return false;
      if (searchQ && !(m.content || '').toLowerCase().includes(searchQ)) return false;
      return true;
    });
  }

  function updateStats() {
    imageCount.textContent = mediaFiles.filter((f) => f.type === 'image').length;
    videoCount.textContent = mediaFiles.filter((f) => f.type === 'video').length;
    zipCount.textContent = mediaFiles.filter((f) => f.type === 'zip').length;
    textCount.textContent = messages.length;
    stats.style.display = 'flex';
  }

  function updateResults() {
    const selected = getSelectedMedia();
    results.style.display = selected.length > 0 ? 'block' : 'none';
    resultsTitle.textContent = `${selected.length} files found`;
    resultsList.innerHTML = '';

    const display = selected.slice(0, 100);
    display.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      const iconColor =
        item.type === 'image' ? '#5865f2' : item.type === 'video' ? '#ed4245' : '#fee75c';
      const iconPath =
        item.type === 'image'
          ? '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>'
          : item.type === 'video'
          ? '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>'
          : '<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>';
      const sourceTag = item.source === 'embed' ? ' <span class="tag">embed</span>' : '';
      div.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="${iconColor}">${iconPath}</svg>
        <span class="name" title="${item.url}">${item.name}</span>
        <span class="size">${item.size}</span>${sourceTag}
      `;
      resultsList.appendChild(div);
    });

    if (selected.length > 100) {
      const more = document.createElement('div');
      more.className = 'result-item';
      more.textContent = `... and ${selected.length - 100} more`;
      resultsList.appendChild(more);
    }
  }

  downloadBtn.addEventListener('click', () => {
    const selected = getSelectedMedia();
    if (selected.length === 0) { showStatus('No media files selected', 'error'); return; }
    chrome.runtime.sendMessage({ action: 'downloadFiles', files: selected });
    showStatus(`Downloading ${selected.length} files to Downloads/discord-scraper/`, 'success');
  });

  exportBtn.addEventListener('click', () => {
    const selected = getSelectedMedia();
    if (selected.length === 0) { showStatus('No media files selected', 'error'); return; }
    const urls = selected.map((f) => f.url).join('\n');
    copyToClipboard(urls);
    showStatus(`Copied ${selected.length} URLs to clipboard`, 'success');
  });

  exportJsonBtn.addEventListener('click', () => {
    const filtered = getFilteredMessages();
    if (filtered.length === 0) { showStatus('No messages to export', 'error'); return; }
    const data = filtered.map((m) => ({
      author: m.author?.username || 'Unknown',
      content: m.content || '',
      timestamp: m.timestamp,
      attachments: (m.attachments || []).map((a) => a.url),
      embeds: (m.embeds || []).map((e) => e.url || e.image?.url).filter(Boolean),
    }));
    downloadFile(JSON.stringify(data, null, 2), 'application/json', 'json');
    showStatus(`Exported ${filtered.length} messages as JSON`, 'success');
  });

  exportCsvBtn.addEventListener('click', () => {
    const filtered = getFilteredMessages();
    if (filtered.length === 0) { showStatus('No messages to export', 'error'); return; }
    const escape = (s) => `"${(s || '').replace(/"/g, '""')}"`;
    const header = 'Author,Content,Timestamp,Attachments,Embeds';
    const rows = filtered.map((m) =>
      [
        escape(m.author?.username),
        escape(m.content),
        escape(m.timestamp),
        escape((m.attachments || []).map((a) => a.url).join(' | ')),
        escape((m.embeds || []).map((e) => e.url || e.image?.url).filter(Boolean).join(' | ')),
      ].join(',')
    );
    downloadFile([header, ...rows].join('\n'), 'text/csv', 'csv');
    showStatus(`Exported ${filtered.length} messages as CSV`, 'success');
  });

  exportTxtBtn.addEventListener('click', () => {
    const filtered = getFilteredMessages();
    if (filtered.length === 0) { showStatus('No messages to export', 'error'); return; }
    const text = filtered.map((m) =>
      `[${m.timestamp}] ${m.author?.username}: ${m.content}`
    ).join('\n');
    downloadFile(text, 'text/plain', 'txt');
    showStatus(`Exported ${filtered.length} messages as TXT`, 'success');
  });

  function downloadFile(content, mimeType, ext) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const server = serverSelect.options[serverSelect.selectedIndex]?.text || 'server';
    const channel = channelSelect.options[channelSelect.selectedIndex]?.text || 'channel';
    a.download = `${server}_${channel}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearResults.addEventListener('click', () => {
    results.style.display = 'none';
    resultsList.innerHTML = '';
  });

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status visible ${type}`;
    clearTimeout(status._timeout);
    status._timeout = setTimeout(() => status.classList.remove('visible'), 5000);
  }
});
