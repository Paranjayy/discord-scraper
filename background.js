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

  if (request.action === 'downloadZip') {
    const { base64Data, filename } = request;
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: `discord-scraper/${filename}`,
      conflictAction: 'uniquify',
      saveAs: false,
    }, (downloadId) => {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError.message);
      }
      sendResponse({ success: true, downloadId });
    });

    return true;
  }

  return true;
});
