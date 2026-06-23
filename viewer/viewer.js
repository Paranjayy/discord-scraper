(function() {
  var messages = [];
  var fileName = '';
  var searchQuery = '';
  var authorFilter = '';
  var channelFilter = '';
  var currentView = 'chat';
  var sortBy = 'newest';
  var selectedImage = null;

  function parseTXT(text) {
    var result = [];
    var lines = text.split('\n');
    var currentChannel = '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.indexOf('# Channel:') === 0) {
        currentChannel = line.replace('# Channel:', '').trim().replace(/^#/, '').trim();
        continue;
      }
      if (line.indexOf('#') === 0 || line.trim() === '') continue;
      var match = line.match(/^\[(.+?)\]\s+(.+?):\s+(.*?)(?:\s+\[attachment:\s+(.+?)\])?$/);
      if (match) {
        result.push({
          author: match[2] || 'Unknown',
          content: match[3] || '',
          timestamp: match[1] || new Date().toISOString(),
          attachments: match[4] ? [match[4]] : [],
          embeds: [],
          channel: currentChannel || undefined
        });
      }
    }
    return result;
  }

  function parseCSV(text) {
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) return [];
    var headers = lines[0].match(/(".*?"|[^,]+)/g) || [];
    headers = headers.map(function(h) { return h.replace(/^"|"$/g, '').toLowerCase(); });
    var result = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].match(/(".*?"|[^,]+)/g) || [];
      var unquote = function(s) { return s.replace(/^"|"$/g, '').replace(/""/g, '"'); };
      var get = function(name) {
        var idx = headers.indexOf(name);
        return idx >= 0 ? unquote(cols[idx] || '') : '';
      };
      result.push({
        author: get('author') || get('username') || 'Unknown',
        content: get('content') || get('message') || '',
        timestamp: get('timestamp') || get('date') || new Date().toISOString(),
        attachments: (get('attachments') || '').split(';').filter(Boolean),
        embeds: (get('embeds') || '').split(';').filter(Boolean),
        channel: get('channel') || undefined
      });
    }
    return result;
  }

  function parseJSON(text) {
    try {
      var data = JSON.parse(text);
      if (Array.isArray(data)) return data;
    } catch(e) {}
    return [];
  }

  function parseHTML(text) {
    var result = [];
    var doc = new DOMParser().parseFromString(text, 'text/html');
    var rows = doc.querySelectorAll('table tr');
    var headers = [];
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td, th');
      if (i === 0) {
        headers = Array.from(cells).map(function(c) { return (c.textContent || '').trim().toLowerCase(); });
        continue;
      }
      var get = function(name) {
        var idx = headers.indexOf(name);
        return idx >= 0 ? (cells[idx] ? cells[idx].textContent.trim() : '') : '';
      };
      if (headers.length > 0) {
        result.push({
          author: get('author') || get('username') || get('name') || 'Unknown',
          content: get('content') || get('message') || get('text') || '',
          timestamp: get('timestamp') || get('date') || get('time') || new Date().toISOString(),
          attachments: (get('attachments') || '').split(';').filter(Boolean),
          embeds: (get('embeds') || '').split(';').filter(Boolean),
          channel: get('channel') || undefined
        });
      }
    }
    return result;
  }

  function detectAndParse(text, filename) {
    var ext = filename.split('.').pop().toLowerCase();
    if (ext === 'html' || ext === 'htm') return parseHTML(text);
    if (ext === 'txt') return parseTXT(text);
    if (ext === 'csv') return parseCSV(text);
    if (ext === 'json') return parseJSON(text);
    try { var d = JSON.parse(text); if (Array.isArray(d)) return d; } catch(e) {}
    if (text.indexOf('# Channel:') >= 0 || /^\[.+?\]\s+.+?:/m.test(text)) return parseTXT(text);
    if (text.indexOf(',') >= 0 && text.indexOf('\n') >= 0) return parseCSV(text);
    return [];
  }

  function handleFile(file) {
    if (!file) return;
    fileName = file.name;
    var reader = new FileReader();
    reader.onload = function(e) {
      var parsed = detectAndParse(e.target.result, file.name);
      if (parsed.length > 0) {
        messages = parsed;
        render();
      } else {
        alert('Could not parse file. Supported: JSON, TXT, CSV, HTML');
      }
    };
    reader.readAsText(file);
  }

  function getStats() {
    if (!messages.length) return { total: 0, images: 0, videos: 0, authors: 0, dateRange: null };
    var authorsSet = {};
    var images = 0, videos = 0;
    messages.forEach(function(m) {
      authorsSet[m.author] = true;
      (m.attachments || []).concat(m.embeds || []).forEach(function(url) {
        var c = url.split('?')[0].toLowerCase();
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(c)) images++;
        if (/\.(mp4|webm|mov|avi|mkv)$/.test(c)) videos++;
      });
    });
    var dates = messages.map(function(m) { return new Date(m.timestamp); }).sort(function(a, b) { return a - b; });
    return {
      total: messages.length, images: images, videos: videos,
      authors: Object.keys(authorsSet).length,
      dateRange: dates.length ? { first: dates[0].toLocaleDateString(), last: dates[dates.length - 1].toLocaleDateString() } : null
    };
  }

  function getFiltered() {
    return messages.filter(function(m) {
      if (searchQuery && m.content.toLowerCase().indexOf(searchQuery.toLowerCase()) < 0) return false;
      if (authorFilter && m.author !== authorFilter) return false;
      if (channelFilter && m.channel !== channelFilter) return false;
      return true;
    }).sort(function(a, b) {
      var da = new Date(a.timestamp).getTime();
      var db = new Date(b.timestamp).getTime();
      return sortBy === 'newest' ? db - da : da - db;
    });
  }

  function getAuthors() {
    var s = {};
    messages.forEach(function(m) { s[m.author] = true; });
    return Object.keys(s).sort();
  }

  function getChannels() {
    var s = {};
    messages.forEach(function(m) { if (m.channel) s[m.channel] = true; });
    return Object.keys(s).sort();
  }

  function getMedia(filtered) {
    var images = [], videos = [], files = [];
    filtered.forEach(function(m) {
      (m.attachments || []).concat(m.embeds || []).forEach(function(url) {
        var c = url.split('?')[0].toLowerCase();
        var item = { url: url, author: m.author, timestamp: m.timestamp, channel: m.channel };
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(c)) images.push(item);
        else if (/\.(mp4|webm|mov|avi|mkv)$/.test(c)) videos.push(item);
        else { item.name = c.split('/').pop().split('?')[0] || 'file'; files.push(item); }
      });
    });
    return { images: images, videos: videos, files: files };
  }

  function exportJSON() {
    var filtered = getFiltered();
    var json = JSON.stringify(filtered, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.\w+$/, '') + '_export.json';
    a.click();
  }

  function exportCSV() {
    var filtered = getFiltered();
    var csv = 'Author,Content,Channel,Timestamp,Attachments\n' + filtered.map(function(m) {
      return '"' + m.author + '","' + m.content.replace(/"/g, '""') + '","' + (m.channel || '') + '","' + m.timestamp + '","' + (m.attachments || []).join('; ') + '"';
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/\.\w+$/, '') + '_export.csv';
    a.click();
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render() {
    var app = document.getElementById('app');
    var stats = getStats();

    if (!messages.length) {
      app.innerHTML = '<div class="empty-state" id="dropzone">' +
        '<div class="empty-card">' +
        '<div class="empty-icon"><svg viewBox="0 0 24 24" width="40" height="40" fill="white"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg></div>' +
        '<h1 class="empty-title">Discord Scraper Viewer</h1>' +
        '<p class="empty-desc">View your scraped Discord data with images, videos, and messages.</p>' +
        '<p class="empty-hint">Drop a file or click to upload (JSON, TXT, CSV, HTML)</p>' +
        '<input type="file" id="fileInput" accept=".json,.txt,.csv,.html,.htm" style="display:none">' +
        '<button id="uploadBtn" class="upload-btn">Upload File</button>' +
        '</div></div>';

      document.getElementById('uploadBtn').addEventListener('click', function() { document.getElementById('fileInput').click(); });
      document.getElementById('fileInput').addEventListener('change', function(e) { handleFile(e.target.files[0]); });
      var dz = document.getElementById('dropzone');
      dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.style.borderColor = '#5865f2'; dz.style.background = 'rgba(88,101,242,0.05)'; });
      dz.addEventListener('dragleave', function() { dz.style.borderColor = ''; dz.style.background = ''; });
      dz.addEventListener('drop', function(e) { e.preventDefault(); dz.style.borderColor = ''; dz.style.background = ''; handleFile(e.dataTransfer.files[0]); });
      return;
    }

    var filtered = getFiltered();
    var media = getMedia(filtered);
    var authors = getAuthors();
    var channels = getChannels();

    var chatHTML = '';
    filtered.forEach(function(m) {
      var mediaHTML = '';
      (m.attachments || []).concat(m.embeds || []).forEach(function(url) {
        var c = url.split('?')[0];
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(c)) {
          mediaHTML += '<img src="' + url + '" data-lightbox="' + url + '" class="lightbox-trigger">';
        } else if (/\.(mp4|webm|mov)$/i.test(c)) {
          mediaHTML += '<video src="' + url + '" controls></video>';
        } else {
          mediaHTML += '<a href="' + url + '" target="_blank">📎 ' + c.split('/').pop().slice(0, 30) + '</a>';
        }
      });
      chatHTML += '<div class="chat-msg">' +
        '<div class="avatar">' + (m.author[0] || '?').toUpperCase() + '</div>' +
        '<div class="msg-body">' +
        '<div class="msg-header">' +
        '<span class="msg-author">' + escapeHTML(m.author) + '</span>' +
        (m.channel ? '<span class="msg-channel">#' + escapeHTML(m.channel) + '</span>' : '') +
        '<span class="msg-time">' + new Date(m.timestamp).toLocaleString() + '</span>' +
        '</div>' +
        (m.content ? '<p class="msg-content">' + escapeHTML(m.content) + '</p>' : '') +
        (mediaHTML ? '<div class="msg-media">' + mediaHTML + '</div>' : '') +
        '</div></div>';
    });

    var imagesHTML = '';
    if (media.images.length) {
      imagesHTML = '<div style="margin-bottom:40px"><h3 class="section-title"><span class="section-dot dot-blue"></span> Images (' + media.images.length + ')</h3><div class="img-grid">';
      media.images.forEach(function(img) {
        imagesHTML += '<div class="img-card" data-lightbox="' + img.url + '"><img src="' + img.url + '" loading="lazy"><div class="img-overlay"><div><div class="img-overlay-text">' + escapeHTML(img.author) + '</div><div class="img-overlay-date">' + new Date(img.timestamp).toLocaleDateString() + '</div></div></div></div>';
      });
      imagesHTML += '</div></div>';
    }

    var videosHTML = '';
    if (media.videos.length) {
      videosHTML = '<div><h3 class="section-title"><span class="section-dot dot-red"></span> Videos (' + media.videos.length + ')</h3><div class="vid-grid">';
      media.videos.forEach(function(vid) {
        videosHTML += '<div class="vid-card"><video src="' + vid.url + '" controls></video><div class="vid-info"><p class="vid-meta">' + escapeHTML(vid.author) + ' · ' + new Date(vid.timestamp).toLocaleDateString() + '</p></div></div>';
      });
      videosHTML += '</div></div>';
    }

    var filesHTML = '';
    if (media.files.length) {
      filesHTML = '<div style="margin-top:40px"><h3 class="section-title"><span class="section-dot dot-green"></span> Files (' + media.files.length + ')</h3><div class="file-grid">';
      media.files.forEach(function(f) {
        var ext = (f.name.split('.').pop() || '').toLowerCase();
        var isPdf = ext === 'pdf';
        var isArchive = ['zip','rar','7z','tar','gz','tgz'].indexOf(ext) >= 0;
        var isAudio = ['mp3','wav','ogg','flac','aac','m4a'].indexOf(ext) >= 0;
        var color = isPdf ? '#ed4245' : isArchive ? '#fee75c' : isAudio ? '#23a55a' : '#5865f2';
        var icon = isPdf ? '📄' : isArchive ? '📦' : isAudio ? '🎵' : '📎';
        filesHTML += '<a href="' + f.url + '" target="_blank" class="file-card"><div class="file-icon" style="background:' + color + '20;color:' + color + '">' + icon + '</div><div style="flex:1;min-width:0"><div class="file-name">' + escapeHTML(f.name) + '</div><div class="file-meta">' + escapeHTML(f.author) + ' · ' + new Date(f.timestamp).toLocaleDateString() + '</div></div></a>';
      });
      filesHTML += '</div></div>';
    }

    var gridItems = media.images.map(function(i) { return Object.assign({}, i, { type: 'image' }); }).concat(media.videos.map(function(v) { return Object.assign({}, v, { type: 'video' }); }));
    var gridHTML = '';
    if (gridItems.length) {
      gridHTML = '<div class="grid-view">';
      gridItems.forEach(function(item) {
        if (item.type === 'image') {
          gridHTML += '<div class="grid-item" data-lightbox="' + item.url + '"><img src="' + item.url + '" loading="lazy"></div>';
        } else {
          gridHTML += '<div class="grid-item"><video src="' + item.url + '"></video><div class="grid-vid-badge">VID</div></div>';
        }
      });
      gridHTML += '</div>';
    } else {
      gridHTML = '<div class="no-media">No media in filtered messages</div>';
    }

    var hasMedia = media.images.length || media.videos.length || media.files.length;
    var viewContent = '';
    if (currentView === 'chat') {
      viewContent = '<div style="max-width:768px;margin:0 auto;padding:24px">' + chatHTML + '</div>';
    } else if (currentView === 'media') {
      viewContent = '<div style="padding:24px">' + imagesHTML + videosHTML + filesHTML + (!hasMedia ? '<div class="no-media">No media in filtered messages</div>' : '') + '</div>';
    } else {
      viewContent = '<div style="padding:24px">' + gridHTML + '</div>';
    }

    var authorOptions = '<option value="">All authors (' + authors.length + ')</option>';
    authors.forEach(function(a) {
      authorOptions += '<option value="' + escapeHTML(a) + '"' + (authorFilter === a ? ' selected' : '') + '>' + escapeHTML(a) + '</option>';
    });

    var channelOptions = '';
    if (channels.length > 1) {
      channelOptions = '<select id="channelSelect" class="filter-select"><option value="">All channels (' + channels.length + ')</option>';
      channels.forEach(function(c) {
        channelOptions += '<option value="' + escapeHTML(c) + '"' + (channelFilter === c ? ' selected' : '') + '># ' + escapeHTML(c) + '</option>';
      });
      channelOptions += '</select>';
    }

    app.innerHTML = '<div class="layout">' +
      '<div class="sidebar">' +
      '<div class="sidebar-title">' + escapeHTML(fileName.replace(/\.\w+$/, '')) + '</div>' +
      '<div class="sidebar-sub">' + stats.total.toLocaleString() + ' messages' + (stats.dateRange ? ' · ' + stats.dateRange.first + ' — ' + stats.dateRange.last : '') + '</div>' +
      '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-val stat-white">' + stats.total.toLocaleString() + '</div><div class="stat-lbl">Messages</div></div>' +
      '<div class="stat-card"><div class="stat-val stat-blue">' + stats.images.toLocaleString() + '</div><div class="stat-lbl">Images</div></div>' +
      '<div class="stat-card"><div class="stat-val stat-red">' + stats.videos.toLocaleString() + '</div><div class="stat-lbl">Videos</div></div>' +
      '<div class="stat-card"><div class="stat-val stat-green">' + stats.authors.toLocaleString() + '</div><div class="stat-lbl">Authors</div></div>' +
      '</div>' +
      '<input type="text" id="searchInput" class="search-input" placeholder="Search messages..." value="' + escapeHTML(searchQuery) + '">' +
      '<select id="authorSelect" class="filter-select">' + authorOptions + '</select>' +
      channelOptions +
      '<select id="sortSelect" class="filter-select"><option value="newest"' + (sortBy === 'newest' ? ' selected' : '') + '>Newest first</option><option value="oldest"' + (sortBy === 'oldest' ? ' selected' : '') + '>Oldest first</option></select>' +
      '<div class="view-tabs">' +
      '<button class="view-tab' + (currentView === 'chat' ? ' active' : '') + '" data-view="chat">chat</button>' +
      '<button class="view-tab' + (currentView === 'media' ? ' active' : '') + '" data-view="media">media</button>' +
      '<button class="view-tab' + (currentView === 'grid' ? ' active' : '') + '" data-view="grid">grid</button>' +
      '</div>' +
      '<div class="sidebar-spacer"></div>' +
      '<button id="exportJsonBtn" style="width:100%;padding:8px;background:none;border:none;color:#5865f2;font-size:12px;cursor:pointer;margin-bottom:4px">Export JSON</button>' +
      '<button id="exportCsvBtn" style="width:100%;padding:8px;background:none;border:none;color:#5865f2;font-size:12px;cursor:pointer;margin-bottom:8px">Export CSV</button>' +
      '<button id="clearDataBtn" class="btn-clear">Clear data</button>' +
      '</div>' +
      '<div class="main">' + viewContent + '</div>' +
      '</div>' +
      (selectedImage ? '<div class="lightbox" id="lightboxOverlay"><button class="lightbox-close" id="closeLightbox">&times;</button><img src="' + selectedImage + '"></div>' : '');

    document.getElementById('searchInput').addEventListener('input', function(e) { searchQuery = e.target.value; render(); });
    document.getElementById('authorSelect').addEventListener('change', function(e) { authorFilter = e.target.value; render(); });
    var cs = document.getElementById('channelSelect');
    if (cs) cs.addEventListener('change', function(e) { channelFilter = e.target.value; render(); });
    document.getElementById('sortSelect').addEventListener('change', function(e) { sortBy = e.target.value; render(); });
    document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('clearDataBtn').addEventListener('click', function() { messages = []; fileName = ''; searchQuery = ''; authorFilter = ''; channelFilter = ''; render(); });

    document.querySelectorAll('.view-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { currentView = btn.dataset.view; render(); });
    });

    document.querySelectorAll('[data-lightbox]').forEach(function(el) {
      el.addEventListener('click', function() { selectedImage = el.dataset.lightbox; render(); });
    });

    var lo = document.getElementById('lightboxOverlay');
    if (lo) {
      document.getElementById('closeLightbox').addEventListener('click', function() { selectedImage = null; render(); });
      lo.addEventListener('click', function(e) { if (e.target === lo) { selectedImage = null; render(); } });
    }
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('viewerData', function(data) {
      if (data.viewerData) {
        try {
          messages = JSON.parse(data.viewerData);
          fileName = 'Discord Scrape';
          render();
        } catch(e) {}
      }
    });
  }

  render();
})();
