chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    downloadFiles(request.files);
    sendResponse({ success: true });
  }
  return true;
});

async function downloadFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const delay = i * 300;

    setTimeout(() => {
      chrome.downloads.download({
        url: file.url,
        filename: `discord-scraper/${file.type}/${file.name}`,
        conflictAction: 'uniquify',
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(`Download failed for ${file.name}:`, chrome.runtime.lastError.message);
        }
      });
    }, delay);
  }
}
