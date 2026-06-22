document.addEventListener('DOMContentLoaded', () => {
  const filterImages = document.getElementById('filterImages');
  const filterVideos = document.getElementById('filterVideos');
  const filterZips = document.getElementById('filterZips');
  const selectAll = document.getElementById('selectAll');
  const scanBtn = document.getElementById('scanBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const exportBtn = document.getElementById('exportBtn');
  const channelName = document.getElementById('channelName');
  const imageCount = document.getElementById('imageCount');
  const videoCount = document.getElementById('videoCount');
  const zipCount = document.getElementById('zipCount');
  const results = document.getElementById('results');
  const resultsList = document.getElementById('resultsList');
  const status = document.getElementById('status');

  let scrapedData = { images: [], videos: [], zips: [] };

  const filters = [filterImages, filterVideos, filterZips];

  selectAll.addEventListener('change', () => {
    filters.forEach(f => f.checked = selectAll.checked);
    updateResults();
  });

  filters.forEach(f => {
    f.addEventListener('change', () => {
      selectAll.checked = filters.every(f => f.checked);
      updateResults();
    });
  });

  scanBtn.addEventListener('click', async () => {
    showStatus('Scanning channel...', 'info');
    scanBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('discord.com')) {
        showStatus('Please navigate to a Discord channel first', 'error');
        scanBtn.disabled = false;
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });

      if (response && response.success) {
        scrapedData = response.data;
        updateStats();
        updateResults();
        showStatus(`Found ${getTotalCount()} items`, 'success');

        const parts = tab.url.split('/');
        const serverName = document.querySelector('.header h1')?.textContent || 'Server';
        channelName.textContent = `#${parts[parts.length - 1] || 'unknown'}`;
        channelName.classList.add('active');
      } else {
        showStatus(response?.error || 'Failed to scrape', 'error');
      }
    } catch (err) {
      showStatus('Cannot connect to Discord. Make sure the tab is active.', 'error');
    }

    scanBtn.disabled = false;
  });

  downloadBtn.addEventListener('click', async () => {
    const selected = getSelectedItems();
    if (selected.length === 0) {
      showStatus('No items selected', 'error');
      return;
    }

    showStatus(`Downloading ${selected.length} files...`, 'info');
    downloadBtn.disabled = true;

    try {
      await chrome.runtime.sendMessage({
        action: 'download',
        files: selected
      });
      showStatus(`Started downloading ${selected.length} files`, 'success');
    } catch (err) {
      showStatus('Download failed: ' + err.message, 'error');
    }

    downloadBtn.disabled = false;
  });

  exportBtn.addEventListener('click', () => {
    const selected = getSelectedItems();
    if (selected.length === 0) {
      showStatus('No items selected', 'error');
      return;
    }

    const urls = selected.map(item => item.url).join('\n');
    navigator.clipboard.writeText(urls).then(() => {
      showStatus(`Copied ${selected.length} URLs to clipboard`, 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = urls;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showStatus(`Copied ${selected.length} URLs to clipboard`, 'success');
    });
  });

  function getSelectedItems() {
    const items = [];
    if (filterImages.checked) items.push(...scrapedData.images);
    if (filterVideos.checked) items.push(...scrapedData.videos);
    if (filterZips.checked) items.push(...scrapedData.zips);
    return items;
  }

  function getTotalCount() {
    return scrapedData.images.length + scrapedData.videos.length + scrapedData.zips.length;
  }

  function updateStats() {
    imageCount.textContent = scrapedData.images.length;
    videoCount.textContent = scrapedData.videos.length;
    zipCount.textContent = scrapedData.zips.length;
  }

  function updateResults() {
    const selected = getSelectedItems();
    const hasItems = selected.length > 0;

    results.classList.toggle('visible', hasItems);
    downloadBtn.disabled = !hasItems;
    exportBtn.disabled = !hasItems;

    resultsList.innerHTML = '';
    const displayItems = selected.slice(0, 50);

    displayItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'result-item';

      const iconClass = item.type === 'image' ? 'image' : item.type === 'video' ? 'video' : 'zip';
      const iconPath = item.type === 'image'
        ? '<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>'
        : item.type === 'video'
        ? '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>'
        : '<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>';

      div.innerHTML = `
        <svg class="icon ${iconClass}" viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>
        <span class="name" title="${item.name}">${item.name}</span>
        <span>${item.size || ''}</span>
      `;
      resultsList.appendChild(div);
    });

    if (selected.length > 50) {
      const more = document.createElement('div');
      more.className = 'result-item';
      more.textContent = `... and ${selected.length - 50} more`;
      resultsList.appendChild(more);
    }
  }

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status visible ${type}`;
    setTimeout(() => {
      if (status.textContent === message) {
        status.classList.remove('visible');
      }
    }, 5000);
  }
});
