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

  if (request.action === 'fetchAndZip') {
    const { files, serverName, token } = request;
    handleFetchAndZip(files, serverName, token, sender.id).then(sendResponse);
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

async function handleFetchAndZip(files, serverName, token, tabId) {
  const zip = new JSZip();
  const total = files.length;
  let done = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const res = await fetch(file.url, {
        headers: token ? { Authorization: token } : {}
      });
      if (!res.ok) { failed++; done++; continue; }
      const arrayBuffer = await res.arrayBuffer();
      const folderPath = `${serverName}/${file.channel}/${file.type}s`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      zip.file(`${folderPath}/${safeName}`, new Uint8Array(arrayBuffer));
    } catch (e) {
      console.warn(`Failed to fetch: ${file.name}`, e);
      failed++;
    }
    done++;

    if (tabId) {
      try {
        chrome.tabs.sendMessage(tabId, {
          type: 'zip-progress',
          done,
          total,
          failed
        });
      } catch {}
    }
  }

  const content = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:application/zip;base64,${base64}`;
  const filename = `discord-scraper/${serverName}.zip`;

  return new Promise((resolve) => {
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      conflictAction: 'uniquify',
      saveAs: false,
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError.message);
      }
      resolve({ success: true, downloadId, failed });
    });
  });
}

async function handleDownloadFiles(files, serverName, tabId) {
  const total = files.length;
  let done = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const folderPath = `${serverName}/${file.channel}/${file.type}s`;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${folderPath}/${safeName}`;

      await new Promise((resolve, reject) => {
        chrome.downloads.download({
          url: file.url,
          filename: filename,
          conflictAction: 'uniquify',
          saveAs: false,
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(downloadId);
          }
        });
      });
    } catch (e) {
      console.warn(`Failed to download: ${file.name}`, e);
      failed++;
    }
    done++;

    if (tabId) {
      try {
        chrome.tabs.sendMessage(tabId, {
          type: 'zip-progress',
          done,
          total,
          failed
        });
      } catch {}
    }
  }

  return { success: true, failed };
}
