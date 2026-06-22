'use client';

import { useState, useRef, useMemo } from 'react';

interface Message {
  author: string;
  content: string;
  timestamp: string;
  attachments: string[];
  embeds: string[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileName, setFileName] = useState('');
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [view, setView] = useState<'chat' | 'media'>('chat');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setMessages(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
      if (authorFilter && !m.author.toLowerCase().includes(authorFilter.toLowerCase())) return false;
      return true;
    });
  }, [messages, search, authorFilter]);

  const authors = useMemo(() => {
    const set = new Set(messages.map((m) => m.author));
    return Array.from(set).sort();
  }, [messages]);

  const allImages = useMemo(() => {
    const imgs: { url: string; author: string; timestamp: string }[] = [];
    filtered.forEach((m) => {
      m.attachments.forEach((url) => {
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url.split('?')[0])) {
          imgs.push({ url, author: m.author, timestamp: m.timestamp });
        }
      });
      m.embeds.forEach((url) => {
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url.split('?')[0])) {
          imgs.push({ url, author: m.author, timestamp: m.timestamp });
        }
      });
    });
    return imgs;
  }, [filtered]);

  const allVideos = useMemo(() => {
    const vids: { url: string; author: string; timestamp: string }[] = [];
    filtered.forEach((m) => {
      m.attachments.forEach((url) => {
        if (/\.(mp4|webm|mov)$/i.test(url.split('?')[0])) {
          vids.push({ url, author: m.author, timestamp: m.timestamp });
        }
      });
      m.embeds.forEach((url) => {
        if (/\.(mp4|webm|mov)$/i.test(url.split('?')[0])) {
          vids.push({ url, author: m.author, timestamp: m.timestamp });
        }
      });
    });
    return vids;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-discord-bg">
      {!messages.length ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-12 bg-discord-sidebar rounded-2xl border border-white/5 max-w-md">
            <div className="text-6xl mb-6">📁</div>
            <h1 className="text-2xl font-bold text-discord-header mb-3">
              Discord Scraper Viewer
            </h1>
            <p className="text-discord-muted mb-8">
              Upload your JSON export from the Discord Scraper extension to view messages, images, and videos.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-6 py-3 bg-discord-blurple text-white rounded-lg font-semibold hover:bg-discord-blurple/80 transition-colors"
            >
              Upload JSON File
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen">
          <div className="w-64 bg-discord-sidebar flex-shrink-0 p-4 flex flex-col border-r border-white/5">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-discord-header mb-1 truncate">
                {fileName.replace('.json', '')}
              </h2>
              <p className="text-xs text-discord-muted">
                {messages.length} messages
              </p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-discord-input rounded-lg text-sm text-discord-text placeholder-discord-muted outline-none focus:ring-2 focus:ring-discord-blurple"
              />
            </div>

            <div className="mb-4">
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full px-3 py-2 bg-discord-input rounded-lg text-sm text-discord-text outline-none focus:ring-2 focus:ring-discord-blurple"
              >
                <option value="">All authors</option>
                {authors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setView('chat')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'chat'
                    ? 'bg-discord-blurple text-white'
                    : 'bg-discord-input text-discord-muted hover:text-discord-text'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setView('media')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'media'
                    ? 'bg-discord-blurple text-white'
                    : 'bg-discord-input text-discord-muted hover:text-discord-text'
                }`}
              >
                Media
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-2 text-xs text-discord-muted">
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span className="text-discord-text">{filtered.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Images</span>
                  <span className="text-discord-text">{allImages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Videos</span>
                  <span className="text-discord-text">{allVideos.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setMessages([]); setFileName(''); }}
              className="mt-4 py-2 text-sm text-discord-muted hover:text-discord-red transition-colors"
            >
              Clear data
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {view === 'chat' ? (
              <div className="max-w-3xl mx-auto space-y-4">
                {filtered.map((msg, i) => (
                  <div key={i} className="group p-4 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {msg.author[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-discord-header">
                            {msg.author}
                          </span>
                          <span className="text-xs text-discord-muted">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {msg.content && (
                          <p className="text-discord-text whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        {msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((url, j) => {
                              const clean = url.split('?')[0];
                              if (/\.(jpg|jpeg|png|gif|webp)$/i.test(clean)) {
                                return (
                                  <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={url}
                                      alt="attachment"
                                      className="max-w-md rounded-lg hover:opacity-90 transition-opacity"
                                      loading="lazy"
                                    />
                                  </a>
                                );
                              }
                              if (/\.(mp4|webm|mov)$/i.test(clean)) {
                                return (
                                  <video
                                    key={j}
                                    src={url}
                                    controls
                                    className="max-w-md rounded-lg"
                                  />
                                );
                              }
                              return (
                                <a
                                  key={j}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-discord-input rounded-lg text-sm text-discord-blurple hover:underline"
                                >
                                  📎 {clean.split('/').pop()}
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {msg.embeds.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.embeds.map((url, j) => {
                              const clean = url.split('?')[0];
                              if (/\.(jpg|jpeg|png|gif|webp)$/i.test(clean)) {
                                return (
                                  <a key={j} href={url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={url}
                                      alt="embed"
                                      className="max-w-md rounded-lg hover:opacity-90 transition-opacity"
                                      loading="lazy"
                                    />
                                  </a>
                                );
                              }
                              if (/\.(mp4|webm|mov)$/i.test(clean)) {
                                return (
                                  <video
                                    key={j}
                                    src={url}
                                    controls
                                    className="max-w-md rounded-lg"
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {allImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-discord-header mb-4">
                      Images ({allImages.length})
                    </h3>
                    <div className="image-grid">
                      {allImages.map((img, i) => (
                        <a
                          key={i}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-lg overflow-hidden bg-discord-sidebar aspect-square"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-white truncate">{img.author}</p>
                              <p className="text-xs text-white/70">
                                {new Date(img.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {allVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-discord-header mb-4">
                      Videos ({allVideos.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {allVideos.map((vid, i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-discord-sidebar">
                          <video
                            src={vid.url}
                            controls
                            className="w-full"
                          />
                          <div className="p-2">
                            <p className="text-xs text-discord-muted truncate">{vid.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {allImages.length === 0 && allVideos.length === 0 && (
                  <div className="text-center text-discord-muted py-20">
                    No media found in the filtered messages.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
