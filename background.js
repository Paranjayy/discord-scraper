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

  if (request.action === 'downloadFiles') {
    downloadFiles(request.files);
    sendResponse({ success: true });
  }

  return true;
});

async function downloadFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    setTimeout(() => {
      chrome.downloads.download({
        url: file.url,
        filename: `discord-scraper/${file.subfolder || file.type}/${file.name}`,
        conflictAction: 'uniquify',
        saveAs: false,
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(`Download failed for ${file.name}:`, chrome.runtime.lastError.message);
        }
      });
    }, i * 200);
  }
}
