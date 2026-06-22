importScripts('jszip.min.js');

const origins = chrome.runtime.getManifest().host_permissions;

chrome.action.onClicked.addListener(async () => {
  const granted = await chrome.permissions.request({ origins: origins });
  if (granted) {
    const url = chrome.runtime.getURL('popup.html');
    chrome.tabs.create({ url: url });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getToken') {
    let tokenFound = false;

    const getToken = (details) => {
      if (!tokenFound) {
        const tokenHeader = details.requestHeaders.find(
          (h) => h.name.toLowerCase() === 'authorization'
        );
        if (tokenHeader && tokenHeader.value) {
          tokenFound = true;
          chrome.webRequest.onBeforeSendHeaders.removeListener(getToken);

          try {
            chrome.runtime.sendMessage({
              message: 'saveToken',
              token: tokenHeader.value,
            });
          } catch (e) {
            console.error('Error sending token:', e);
          }

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url.includes('discord.com')) {
              chrome.tabs.remove(tabs[0].id);
            }
          });
        }
      }
    };

    chrome.webRequest.onBeforeSendHeaders.addListener(
      getToken,
      { urls: ['*://discord.com/*'] },
      ['requestHeaders']
    );

    sendResponse({ status: 'listener added' });
  }

  if (request.action === 'estimateFiles') {
    const { urls } = request;
    handleEstimate(urls).then(sendResponse);
    return true;
  }

  if (request.action === 'downloadFiles') {
    const { files, serverName } = request;
    handleDownloadFiles(files, serverName, sender.id).then(sendResponse);
    return true;
  }

  return true;
});

async function handleEstimate(urls) {
  let totalBytes = 0;
  const sizes = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const len = res.headers.get('content-length');
      const size = len ? parseInt(len, 10) : 0;
      totalBytes += size;
      sizes.push(size);
    } catch {
      sizes.push(0);
    }
  }

  return { totalBytes, sizes };
}

function downloadSingle(url, filename) {
  return new Promise((resolve) => {
    chrome.downloads.download({
      url: url,
      filename: filename,
      conflictAction: 'uniquify',
      saveAs: false,
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve({ ok: true, downloadId });
      }
    });
  });
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 60);
}

function buildFilename(file, serverName) {
  const safeServer = sanitize(serverName);
  const safeChannel = sanitize(file.channel);
  const safeName = sanitize(file.name);
  const typeDir = file.type + 's';
  return `${safeServer}_${safeChannel}_${typeDir}/${safeName}`;
}

async function handleDownloadFiles(files, serverName, tabId) {
  const total = files.length;
  let done = 0;
  let failed = 0;
  const CONCURRENCY = 5;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (file) => {
      const filename = buildFilename(file, serverName);

      const result = await downloadSingle(file.url, filename);
      if (!result.ok) {
        console.warn(`Failed to download: ${file.name}`, result.error);
        failed++;
      }
      done++;

      if (tabId) {
        try {
          chrome.tabs.sendMessage(tabId, {
            type: 'download-progress',
            done,
            total,
            failed
          });
        } catch {}
      }
    });

    await Promise.all(promises);
  }

  return { success: true, failed, total };
}
