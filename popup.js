document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const tokenSection = $('tokenSection');
  const getTokenBtn = $('getTokenBtn');
  const tokenInputGroup = $('tokenInputGroup');
  const tokenInput = $('tokenInput');
  const saveTokenBtn = $('saveTokenBtn');
  const mainSection = $('mainSection');
  const userInfo = $('userInfo');
  const serverSelect = $('serverSelect');
  const channelList = $('channelList');
  const channelCount = $('channelCount');
  const selectAllChannels = $('selectAllChannels');
  const selectNoChannels = $('selectNoChannels');
  const scanBtn = $('scanBtn');
  const stopBtn = $('stopBtn');
  const channelProgress = $('channelProgress');
  const channelProgressText = $('channelProgressText');
  const counter = $('counter');
  const progressBar = $('progressBar');
  const progressFill = $('progressFill');
  const downloadProgress = $('downloadProgress');
  const downloadText = $('downloadText');
  const downloadFill = $('downloadFill');
  const stats = $('stats');
  const actions = $('actions');
  const results = $('results');
  const resultsList = $('resultsList');
  const resultsTitle = $('resultsTitle');
  const clearResults = $('clearResults');
  const downloadBtn = $('downloadBtn');
  const estimateBtn = $('estimateBtn');
  const exportBtn = $('exportBtn');
  const exportJsonBtn = $('exportJsonBtn');
  const exportCsvBtn = $('exportCsvBtn');
  const exportTxtBtn = $('exportTxtBtn');
  const status = $('status');
  const toggleAdvanced = $('toggleAdvanced');
  const advancedContent = $('advancedContent');
  const dateFrom = $('dateFrom');
  const dateTo = $('dateTo');
  const authorFilter = $('authorFilter');
  const searchFilter = $('searchFilter');
  const filterImages = $('filterImages');
  const filterVideos = $('filterVideos');
  const filterZips = $('filterZips');
  const filterText = $('filterText');
  const selectAllCb = $('selectAll');
  const imageCount = $('imageCount');
  const videoCount = $('videoCount');
  const zipCount = $('zipCount');
  const textCount = $('textCount');

  let token = null;
  let channels = [];
  let allMessages = {};
  let allMedia = {};
  let abort = false;

  const IMAGE_EXT = ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg','.tiff','.tif'];
  const VIDEO_EXT = ['.mp4','.webm','.mov','.avi','.mkv','.m4v'];
  const ZIP_EXT = ['.zip','.rar','.7z','.tar','.gz','.tgz'];
  const allTypeFilters = [filterImages, filterVideos, filterZips, filterText];

  selectAllCb.addEventListener('change', () => {
    allTypeFilters.forEach((f) => (f.checked = selectAllCb.checked));
    updateResults();
  });
  allTypeFilters.forEach((f) => f.addEventListener('change', () => {
    selectAllCb.checked = allTypeFilters.every((f) => f.checked);
    updateResults();
  }));

  toggleAdvanced.addEventListener('click', () => {
    const open = advancedContent.style.maxHeight !== '0px';
    advancedContent.style.maxHeight = open ? '0px' : '300px';
    toggleAdvanced.classList.toggle('open', !open);
  });

  [dateFrom, dateTo, authorFilter, searchFilter].forEach((el) => el.addEventListener('input', updateResults));

  getTokenBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getToken' });
    tokenInputGroup.style.display = 'flex';
    tokenInput.focus();
    showStatus('Opening Discord to grab token...', 'info');
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'saveToken' && request.token) {
      token = request.token;
      chrome.storage.local.set({ token });
      tokenInput.value = token;
      initWithToken(token);
    }
  });

  saveTokenBtn.addEventListener('click', () => {
    token = tokenInput.value.trim();
    if (token) { chrome.storage.local.set({ token }); initWithToken(token); }
  });
  tokenInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveTokenBtn.click(); });
  chrome.storage.local.get('token', (data) => {
    if (data.token) { token = data.token; tokenInput.value = token; initWithToken(token); }
  });

  async function initWithToken(t) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: t } });
      if (!res.ok) throw new Error();
      const user = await res.json();
      userInfo.textContent = `Logged in as ${user.username}`;
      tokenSection.style.display = 'none';
      mainSection.style.display = 'block';
      await loadServers(t);
    } catch {
      showStatus('Invalid token.', 'error');
      token = null;
      chrome.storage.local.remove('token');
    }
  }

  async function loadServers(t) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: t } });
      if (!res.ok) throw new Error();
      const guilds = await res.json();
      serverSelect.innerHTML = '';
      guilds.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id; opt.textContent = g.name;
        serverSelect.appendChild(opt);
      });
      await loadChannels(t);
    } catch { showStatus('Failed to load servers', 'error'); }
  }

  serverSelect.addEventListener('change', () => {
    resetState();
    loadChannels(token);
  });

  async function loadChannels(t) {
    const serverId = serverSelect.value;
    if (!serverId) return;
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, { headers: { Authorization: t } });
      if (!res.ok) throw new Error();
      const all = await res.json();
      channels = all.filter((c) => c.type === 0 || c.type === 5);
      renderChannelList();
    } catch { showStatus('Failed to load channels', 'error'); }
  }

  function renderChannelList() {
    channelList.innerHTML = '';
    channels.forEach((c) => {
      const label = document.createElement('label');
      label.className = 'channel-item';
      const icon = c.type === 5 ? '📢' : '#';
      label.innerHTML = `
        <input type="checkbox" class="channel-checkbox" value="${c.id}" data-name="${c.name}" checked>
        <span class="checkmark"></span>
        <span class="channel-name">${icon} ${c.name}</span>
      `;
      channelList.appendChild(label);
    });
    updateChannelCount();
    channelList.querySelectorAll('.channel-checkbox').forEach((cb) => {
      cb.addEventListener('change', updateChannelCount);
    });
  }

  function updateChannelCount() {
    const checked = channelList.querySelectorAll('.channel-checkbox:checked').length;
    channelCount.textContent = `${checked} selected`;
  }

  selectAllChannels.addEventListener('click', () => {
    channelList.querySelectorAll('.channel-checkbox').forEach((cb) => (cb.checked = true));
    updateChannelCount();
  });

  selectNoChannels.addEventListener('click', () => {
    channelList.querySelectorAll('.channel-checkbox').forEach((cb) => (cb.checked = false));
    updateChannelCount();
  });

  function getSelectedChannels() {
    return Array.from(channelList.querySelectorAll('.channel-checkbox:checked')).map((cb) => ({
      id: cb.value,
      name: cb.dataset.name,
    }));
  }

  function resetState() {
    allMessages = {}; allMedia = {};
    counter.textContent = ''; actions.style.display = 'none'; results.style.display = 'none';
  }

  scanBtn.addEventListener('click', startScraping);
  stopBtn.addEventListener('click', () => { abort = true; });

  async function startScraping() {
    const selected = getSelectedChannels();
    if (!selected.length) { showStatus('Select at least one channel', 'error'); return; }

    allMessages = {}; allMedia = {};
    abort = false;
    resetState();
    scanBtn.style.display = 'none'; stopBtn.style.display = 'inline-flex';
    serverSelect.disabled = true;
    progressBar.style.display = 'block'; progressFill.style.width = '0%';
    channelProgress.style.display = 'block';
    downloadProgress.style.display = 'none';

    const serverName = serverSelect.options[serverSelect.selectedIndex]?.text || 'server';

    for (let i = 0; i < selected.length; i++) {
      if (abort) break;
      const ch = selected[i];
      channelProgressText.textContent = `Scraping ${i + 1}/${selected.length}: #${ch.name}`;
      counter.textContent = `Total messages: ${Object.values(allMessages).flat().length}`;

      await fetchChannelMessages(token, ch.id, ch.name);

      const pct = Math.round(((i + 1) / selected.length) * 100);
      progressFill.style.width = pct + '%';
    }

    extractAllMedia();
    updateStats();
    updateResults();
    resetUI();

    const totalMsgs = Object.values(allMessages).flat().length;
    const totalMedia = Object.values(allMedia).flat().length;
    if (totalMsgs > 0 && !abort) {
      showStatus(`Done! ${totalMsgs} messages, ${totalMedia} media files from ${selected.length} channels.`, 'success');
    }
  }

  async function fetchChannelMessages(t, channelId, channelName) {
    let before = null;
    let retries = 0;
    allMessages[channelName] = [];

    while (!abort) {
      try {
        let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`;
        if (before) url += `&before=${before}`;
        const res = await fetch(url, { headers: { Authorization: t } });

        if (res.status === 429) {
          const data = await res.json();
          const wait = (data.retry_after || 1) * 1000;
          showStatus(`Rate limited. Waiting ${Math.ceil(wait / 1000)}s...`, 'info');
          await sleep(wait);
          if (++retries > 5) return;
          continue;
        }
        if (!res.ok) return;

        retries = 0;
        const data = await res.json();
        allMessages[channelName].push(...data);

        const total = Object.values(allMessages).flat().length;
        counter.textContent = `Total messages: ${total}`;

        if (data.length < 100) return;
        before = data[data.length - 1].id;
        await sleep(350);
      } catch {
        await sleep(2000);
        if (++retries > 5) return;
      }
    }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function extractAllMedia() {
    allMedia = {};
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    const authorQ = authorFilter.value.toLowerCase().trim();
    const searchQ = searchFilter.value.toLowerCase().trim();

    for (const [channelName, messages] of Object.entries(allMessages)) {
      allMedia[channelName] = [];
      const seen = new Set();

      for (const msg of messages) {
        const msgDate = new Date(msg.timestamp);
        if (fromDate && msgDate < fromDate) continue;
        if (toDate && msgDate > toDate) continue;
        const author = msg.author?.username || 'Unknown';
        if (authorQ && !author.toLowerCase().includes(authorQ)) continue;
        if (searchQ && !(msg.content || '').toLowerCase().includes(searchQ)) continue;

        if (msg.attachments) {
          for (const att of msg.attachments) {
            const url = att.url || att.proxy_url;
            if (!url || seen.has(url)) continue; seen.add(url);
            const name = att.filename || 'unknown';
            const ext = '.' + name.split('.').pop().toLowerCase();
            const type = getTypeFromExt(ext);
            if (type) allMedia[channelName].push({
              type, name, url, size: att.size ? fmtSize(att.size) : '', author,
              timestamp: msg.timestamp, source: 'attachment', channel: channelName,
            });
          }
        }
        if (msg.embeds) {
          for (const embed of msg.embeds) {
            const imageUrl = embed.image?.url || embed.thumbnail?.url || embed.video?.url;
            if (!imageUrl || seen.has(imageUrl)) continue; seen.add(imageUrl);
            const name = imageUrl.split('/').pop().split('?')[0] || 'embed';
            const ext = '.' + name.split('.').pop().toLowerCase();
            const type = getTypeFromExt(ext) || (embed.video ? 'video' : 'image');
            allMedia[channelName].push({
              type, name: `embed_${name}`, url: imageUrl, author,
              timestamp: msg.timestamp, source: 'embed', channel: channelName,
              size: embed.image ? `${embed.image.width}x${embed.image.height}` : '',
            });
          }
        }
      }
    }
  }

  function getTypeFromExt(ext) {
    if (IMAGE_EXT.includes(ext)) return 'image';
    if (VIDEO_EXT.includes(ext)) return 'video';
    if (ZIP_EXT.includes(ext)) return 'zip';
    return null;
  }

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function getSelectedMedia() {
    const items = [];
    for (const [ch, files] of Object.entries(allMedia)) {
      for (const f of files) {
        if (filterImages.checked && f.type === 'image') items.push(f);
        if (filterVideos.checked && f.type === 'video') items.push(f);
        if (filterZips.checked && f.type === 'zip') items.push(f);
      }
    }
    return items;
  }

  function getFilteredMessages() {
    const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;
    const authorQ = authorFilter.value.toLowerCase().trim();
    const searchQ = searchFilter.value.toLowerCase().trim();
    const items = [];
    for (const [ch, msgs] of Object.entries(allMessages)) {
      for (const m of msgs) {
        const d = new Date(m.timestamp);
        if (fromDate && d < fromDate) continue;
        if (toDate && d > toDate) continue;
        if (authorQ && !(m.author?.username || '').toLowerCase().includes(authorQ)) continue;
        if (searchQ && !(m.content || '').toLowerCase().includes(searchQ)) continue;
        items.push({ ...m, channel: ch });
      }
    }
    return items;
  }

  function updateStats() {
    const all = Object.values(allMedia).flat();
    imageCount.textContent = all.filter((f) => f.type === 'image').length;
    videoCount.textContent = all.filter((f) => f.type === 'video').length;
    zipCount.textContent = all.filter((f) => f.type === 'zip').length;
    textCount.textContent = Object.values(allMessages).flat().length;
    stats.style.display = 'flex';
  }

  function updateResults() {
    const selected = getSelectedMedia();
    results.style.display = selected.length > 0 ? 'block' : 'none';
    resultsTitle.textContent = `${selected.length} files found`;
    resultsList.innerHTML = '';
    selected.slice(0, 100).forEach((item) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      const color = item.type === 'image' ? '#5865f2' : item.type === 'video' ? '#ed4245' : '#fee75c';
      const path = item.type === 'image'
        ? '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>'
        : item.type === 'video'
        ? '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>'
        : '<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>';
      const ch = item.channel ? `<span class="tag">#${item.channel}</span>` : '';
      div.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="${color}">${path}</svg><span class="name" title="${item.url}">${item.name}</span><span class="size">${item.size}</span>${ch}`;
      resultsList.appendChild(div);
    });
    if (selected.length > 100) {
      const more = document.createElement('div');
      more.className = 'result-item';
      more.textContent = `... and ${selected.length - 100} more`;
      resultsList.appendChild(more);
    }
  }

  async function estimateStorage() {
    const selected = getSelectedMedia();
    if (!selected.length) return;

    downloadProgress.style.display = 'block';
    downloadText.textContent = 'Estimating file sizes...';
    downloadFill.style.width = '0%';

    const urls = selected.map(f => f.url);
    const result = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'estimateFiles', urls }, resolve);
    });

    const mb = (result.totalBytes / 1024 / 1024).toFixed(1);
    downloadText.textContent = `${selected.length} files · ~${mb} MB estimated`;
    downloadFill.style.width = '100%';

    setTimeout(() => { downloadProgress.style.display = 'none'; }, 3000);
  }

  estimateBtn.addEventListener('click', estimateStorage);
  downloadBtn.addEventListener('click', downloadAsZip);
  exportBtn.addEventListener('click', () => {
    const selected = getSelectedMedia();
    if (!selected.length) { showStatus('No media files selected', 'error'); return; }
    copyToClipboard(selected.map((f) => f.url).join('\n'));
    showStatus(`Copied ${selected.length} URLs to clipboard`, 'success');
  });
  exportJsonBtn.addEventListener('click', () => exportMessages('json'));
  exportCsvBtn.addEventListener('click', () => exportMessages('csv'));
  exportTxtBtn.addEventListener('click', () => exportMessages('txt'));
  clearResults.addEventListener('click', () => { results.style.display = 'none'; resultsList.innerHTML = ''; });

  async function downloadAsZip() {
    const selected = getSelectedMedia();
    if (!selected.length) { showStatus('No media files selected', 'error'); return; }

    downloadProgress.style.display = 'block';
    downloadBtn.disabled = true;
    downloadText.textContent = 'Starting download...';
    downloadFill.style.width = '0%';

    const serverName = serverSelect.options[serverSelect.selectedIndex]?.text || 'server';
    const files = selected.map(f => ({
      url: f.url,
      name: f.name,
      type: f.type,
      channel: f.channel || 'unknown'
    }));

    chrome.runtime.onMessage.addListener(function progressListener(msg) {
      if (msg.type === 'zip-progress') {
        const pct = Math.round((msg.done / msg.total) * 100);
        downloadFill.style.width = pct + '%';
        downloadText.textContent = `Downloading ${msg.done}/${msg.total} files (${pct}%)${msg.failed ? ` · ${msg.failed} failed` : ''}...`;
        if (msg.done >= msg.total) {
          chrome.runtime.onMessage.removeListener(progressListener);
        }
      }
    });

    const result = await new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'fetchAndZip', files, serverName, token }, resolve);
    });

    downloadProgress.style.display = 'none';
    downloadBtn.disabled = false;
    downloadFill.style.width = '0%';
    if (result && result.success) {
      showStatus(`Downloaded ${selected.length} files as ${serverName}.zip`, 'success');
    } else {
      showStatus('Download failed', 'error');
    }
  }

  function exportMessages(format) {
    const filtered = getFilteredMessages();
    if (!filtered.length) { showStatus('No messages to export', 'error'); return; }
    const serverName = serverSelect.options[serverSelect.selectedIndex]?.text || 'server';

    let content, ext;
    if (format === 'json') {
      content = JSON.stringify(filtered.map((m) => ({
        channel: m.channel, author: m.author?.username || 'Unknown',
        content: m.content || '', timestamp: m.timestamp,
        attachments: (m.attachments || []).map((a) => a.url),
        embeds: (m.embeds || []).map((e) => e.url || e.image?.url).filter(Boolean),
      })), null, 2);
      ext = 'json';
    } else if (format === 'csv') {
      const esc = (s) => `"${(s || '').replace(/"/g, '""')}"`;
      const header = 'Channel,Author,Content,Timestamp,Attachments,Embeds';
      const rows = filtered.map((m) => [
        esc(m.channel), esc(m.author?.username), esc(m.content), esc(m.timestamp),
        esc((m.attachments || []).map((a) => a.url).join(' | ')),
        esc((m.embeds || []).map((e) => e.url || e.image?.url).filter(Boolean).join(' | ')),
      ].join(','));
      content = [header, ...rows].join('\n');
      ext = 'csv';
    } else {
      content = filtered.map((m) => `[${m.channel}] [${m.timestamp}] ${m.author?.username}: ${m.content}`).join('\n');
      ext = 'txt';
    }

    navigator.clipboard.writeText(content).then(() => {
      showStatus(`Copied ${filtered.length} messages (${ext.toUpperCase()}) to clipboard`, 'success');
    }).catch(() => {
      copyToClipboard(content);
      showStatus(`Copied ${filtered.length} messages (${ext.toUpperCase()}) to clipboard`, 'success');
    });
  }

  function resetUI() {
    scanBtn.style.display = 'inline-flex'; stopBtn.style.display = 'none';
    serverSelect.disabled = false;
    progressBar.style.display = 'none'; channelProgress.style.display = 'none';
    actions.style.display = Object.values(allMessages).flat().length > 0 ? 'flex' : 'none';
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    });
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status visible ${type}`;
    clearTimeout(status._t);
    status._t = setTimeout(() => status.classList.remove('visible'), 5000);
  }

  const viewerBtn = $('viewerBtn');
  viewerBtn.addEventListener('click', openViewer);

  function openViewer() {
    const msgs = Object.values(allMessages).flat().map(m => ({
      author: m.author?.username || 'Unknown',
      content: m.content || '',
      timestamp: m.timestamp,
      attachments: (m.attachments || []).map(a => a.url),
      embeds: (m.embeds || []).map(e => e.url || ''),
      channel: m._channel || ''
    }));
    const json = JSON.stringify(msgs);
    chrome.storage.local.set({ viewerData: json }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('viewer/index.html') });
    });
  }
});
