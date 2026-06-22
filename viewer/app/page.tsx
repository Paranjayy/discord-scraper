'use client';

import { useState, useRef, useMemo, useCallback } from 'react';

interface Message {
  author: string;
  content: string;
  timestamp: string;
  attachments: string[];
  embeds: string[];
  channel?: string;
}

interface Stats {
  totalMessages: number;
  totalImages: number;
  totalVideos: number;
  totalAuthors: number;
  dateRange: { first: string; last: string } | null;
}

function parseTXT(text: string): Message[] {
  const messages: Message[] = [];
  const lines = text.split('\n');
  let currentChannel = '';

  for (const line of lines) {
    if (line.startsWith('# Channel:')) {
      currentChannel = line.replace('# Channel:', '').trim().replace(/^#/, '').trim();
      continue;
    }
    if (line.startsWith('#') || line.trim() === '') continue;

    const match = line.match(/^\[(.+?)\]\s+(.+?):\s+(.*?)(?:\s+\[attachment:\s+(.+?)\])?$/);
    if (match) {
      const [, timestamp, author, content, attachment] = match;
      messages.push({
        author: author || 'Unknown',
        content: content || '',
        timestamp: timestamp || new Date().toISOString(),
        attachments: attachment ? [attachment] : [],
        embeds: [],
        channel: currentChannel || undefined,
      });
    }
  }
  return messages;
}

function parseCSV(text: string): Message[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const messages: Message[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/(".*?"|[^,]+)/g) || [];
    const unquote = (s: string) => s.replace(/^"|"$/g, '').replace(/""/g, '"');

    messages.push({
      author: unquote(cols[1] || 'Unknown'),
      content: unquote(cols[2] || ''),
      timestamp: unquote(cols[3] || new Date().toISOString()),
      attachments: unquote(cols[4] || '').split('; ').filter(Boolean),
      embeds: unquote(cols[5] || '').split('; ').filter(Boolean),
      channel: unquote(cols[0] || '') || undefined,
    });
  }
  return messages;
}

function parseJSON(text: string): Message[] {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

function detectAndParse(text: string, filename: string): Message[] {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'txt') return parseTXT(text);
  if (ext === 'csv') return parseCSV(text);
  if (ext === 'json') return parseJSON(text);

  // Try JSON first, then TXT, then CSV
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
  } catch {}

  if (text.includes('# Channel:') || text.match(/^\[.+?\]\s+.+?:/m)) {
    return parseTXT(text);
  }

  if (text.includes(',') && text.includes('\n')) {
    return parseCSV(text);
  }

  return [];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [view, setView] = useState<'chat' | 'media' | 'grid'>('chat');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = detectAndParse(text, file.name);
      if (parsed.length > 0) {
        setMessages(parsed);
      } else {
        alert('Could not parse file. Supported formats: JSON, TXT, CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = detectAndParse(text, file.name);
      if (parsed.length > 0) {
        setMessages(parsed);
      } else {
        alert('Could not parse file. Supported formats: JSON, TXT, CSV');
      }
    };
    reader.readAsText(file);
  }, []);

  const stats: Stats = useMemo(() => {
    if (!messages.length) return { totalMessages: 0, totalImages: 0, totalVideos: 0, totalAuthors: 0, dateRange: null };
    const authors = new Set(messages.map((m) => m.author));
    let images = 0, videos = 0;
    messages.forEach((m) => {
      [...m.attachments, ...m.embeds].forEach((url) => {
        const clean = url.split('?')[0].toLowerCase();
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(clean)) images++;
        if (/\.(mp4|webm|mov|avi)$/.test(clean)) videos++;
      });
    });
    const dates = messages.map((m) => new Date(m.timestamp)).sort((a, b) => a.getTime() - b.getTime());
    return {
      totalMessages: messages.length,
      totalImages: images,
      totalVideos: videos,
      totalAuthors: authors.size,
      dateRange: dates.length ? { first: dates[0].toLocaleDateString(), last: dates[dates.length - 1].toLocaleDateString() } : null,
    };
  }, [messages]);

  const filtered = useMemo(() => {
    return messages
      .filter((m) => {
        if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
        if (authorFilter && m.author !== authorFilter) return false;
        if (channelFilter && m.channel !== channelFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.timestamp).getTime();
        const db = new Date(b.timestamp).getTime();
        return sortBy === 'newest' ? db - da : da - db;
      });
  }, [messages, search, authorFilter, channelFilter, sortBy]);

  const authors = useMemo(() => Array.from(new Set(messages.map((m) => m.author))).sort(), [messages]);
  const channelNames = useMemo(() => Array.from(new Set(messages.map((m) => m.channel).filter(Boolean))).sort(), [messages]);

  const allImages = useMemo(() => {
    const imgs: { url: string; author: string; timestamp: string; channel?: string }[] = [];
    filtered.forEach((m) => {
      [...m.attachments, ...m.embeds].forEach((url) => {
        const clean = url.split('?')[0].toLowerCase();
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(clean)) {
          imgs.push({ url, author: m.author, timestamp: m.timestamp, channel: m.channel });
        }
      });
    });
    return imgs;
  }, [filtered]);

  const allVideos = useMemo(() => {
    const vids: { url: string; author: string; timestamp: string; channel?: string }[] = [];
    filtered.forEach((m) => {
      [...m.attachments, ...m.embeds].forEach((url) => {
        const clean = url.split('?')[0].toLowerCase();
        if (/\.(mp4|webm|mov|avi)$/.test(clean)) {
          vids.push({ url, author: m.author, timestamp: m.timestamp, channel: m.channel });
        }
      });
    });
    return vids;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e4e4e7]">
      {!messages.length ? (
        <div className="flex items-center justify-center min-h-screen" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <div className="text-center p-12 bg-[#111118] rounded-3xl border border-white/5 max-w-lg shadow-2xl shadow-black/50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#5865f2] to-[#eb459e] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="white"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#5865f2] to-[#eb459e] bg-clip-text text-transparent">
              Discord Scraper Viewer
            </h1>
            <p className="text-[#71717a] mb-2">
              View your scraped Discord data with images, videos, and messages.
            </p>
            <p className="text-[#52525b] text-sm mb-8">
              Drop a file or click to upload (JSON, TXT, CSV)
            </p>
            <input ref={fileRef} type="file" accept=".json,.txt,.csv" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-8 py-4 bg-gradient-to-r from-[#5865f2] to-[#eb459e] text-white rounded-2xl font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#5865f2]/25"
            >
              Upload File
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-72 bg-[#111118] flex-shrink-0 p-5 flex flex-col border-r border-white/5">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1 truncate">
                {fileName.replace('.json', '')}
              </h2>
              <p className="text-xs text-[#71717a]">
                {stats.totalMessages.toLocaleString()} messages
                {stats.dateRange && ` · ${stats.dateRange.first} — ${stats.dateRange.last}`}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { label: 'Messages', value: stats.totalMessages, color: 'text-white' },
                { label: 'Images', value: stats.totalImages, color: 'text-[#5865f2]' },
                { label: 'Videos', value: stats.totalVideos, color: 'text-[#ed4245]' },
                { label: 'Authors', value: stats.totalAuthors, color: 'text-[#23a55a]' },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                  <div className="text-[10px] text-[#52525b] uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a0a0f] rounded-xl text-sm text-white placeholder-[#52525b] outline-none focus:ring-2 focus:ring-[#5865f2]/50 border border-white/5 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0f] rounded-xl text-sm text-white outline-none border border-white/5 focus:ring-2 focus:ring-[#5865f2]/50"
              >
                <option value="">All authors ({authors.length})</option>
                {authors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              {channelNames.length > 1 && (
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0f] rounded-xl text-sm text-white outline-none border border-white/5 focus:ring-2 focus:ring-[#5865f2]/50"
                >
                  <option value="">All channels ({channelNames.length})</option>
                  {channelNames.map((c) => <option key={c} value={c}># {c}</option>)}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="w-full px-3 py-2 bg-[#0a0a0f] rounded-xl text-sm text-white outline-none border border-white/5 focus:ring-2 focus:ring-[#5865f2]/50"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            {/* View Tabs */}
            <div className="flex gap-1 p-1 bg-[#0a0a0f] rounded-xl mb-6 border border-white/5">
              {(['chat', 'media', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                    view === v
                      ? 'bg-[#5865f2] text-white shadow-lg shadow-[#5865f2]/25'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex-1"></div>

            <button
              onClick={() => { setMessages([]); setFileName(''); }}
              className="py-2 text-sm text-[#52525b] hover:text-[#ed4245] transition-colors"
            >
              Clear data
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {view === 'chat' && (
              <div className="max-w-3xl mx-auto p-6 space-y-1">
                {filtered.map((msg, i) => (
                  <div key={i} className="group flex gap-4 py-3 px-4 rounded-2xl hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865f2] to-[#eb459e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {msg.author[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-white">{msg.author}</span>
                        {msg.channel && <span className="text-xs text-[#52525b]">#{msg.channel}</span>}
                        <span className="text-xs text-[#52525b]">{new Date(msg.timestamp).toLocaleString()}</span>
                      </div>
                      {msg.content && (
                        <p className="text-[#a1a1aa] whitespace-pre-wrap break-words leading-relaxed">
                          {msg.content}
                        </p>
                      )}
                      {(msg.attachments.length > 0 || msg.embeds.length > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[...msg.attachments, ...msg.embeds].map((url, j) => {
                            const clean = url.split('?')[0];
                            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(clean)) {
                              return (
                                <button key={j} onClick={() => setSelectedImage(url)} className="block">
                                  <img src={url} alt="" className="max-w-xs max-h-48 rounded-xl object-cover hover:opacity-80 transition-opacity" loading="lazy" />
                                </button>
                              );
                            }
                            if (/\.(mp4|webm|mov)$/i.test(clean)) {
                              return <video key={j} src={url} controls className="max-w-xs max-h-48 rounded-xl" />;
                            }
                            return (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] rounded-xl text-sm text-[#5865f2] hover:bg-[#1e1e3a] transition-colors border border-white/5">
                                📎 {clean.split('/').pop()?.slice(0, 30)}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'media' && (
              <div className="p-6">
                {allImages.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5865f2]"></span>
                      Images ({allImages.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allImages.map((img, i) => (
                        <button key={i} onClick={() => setSelectedImage(img.url)}
                          className="group relative aspect-square rounded-2xl overflow-hidden bg-[#111118] border border-white/5 hover:border-[#5865f2]/50 transition-all hover:scale-[1.02]">
                          <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-xs text-white font-medium truncate">{img.author}</p>
                              <p className="text-[10px] text-white/60">{new Date(img.timestamp).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {allVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ed4245]"></span>
                      Videos ({allVideos.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allVideos.map((vid, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden bg-[#111118] border border-white/5">
                          <video src={vid.url} controls className="w-full" />
                          <div className="p-3">
                            <p className="text-xs text-[#71717a]">{vid.author} · {new Date(vid.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {allImages.length === 0 && allVideos.length === 0 && (
                  <div className="text-center text-[#52525b] py-32">No media in filtered messages</div>
                )}
              </div>
            )}

            {view === 'grid' && (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {[...allImages.map((img) => ({ ...img, type: 'image' as const })), ...allVideos.map((vid) => ({ ...vid, type: 'video' as const }))].map((item, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-[#111118] border border-white/5">
                      {item.type === 'image' ? (
                        <button onClick={() => setSelectedImage(item.url)} className="w-full h-full">
                          <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                        </button>
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-2 right-2">
                        {item.type === 'video' && (
                          <span className="px-1.5 py-0.5 bg-[#ed4245] text-white text-[9px] rounded font-bold">VID</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lightbox */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
              <button className="absolute top-4 right-4 text-white/50 hover:text-white text-4xl">&times;</button>
              <img src={selectedImage} alt="" className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
