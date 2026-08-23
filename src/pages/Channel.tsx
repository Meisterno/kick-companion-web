import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { getChannel, type KickChannel } from '../lib/kick-api';
import { KickChatClient } from '../lib/kick-chat';
import { loadEmotes, parseMessage, type EmoteMap } from '../lib/emotes';

interface Msg {
  id: string;
  user: string;
  content: string;
  color: string;
  time: string;
}

function formatViewers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getFavs(): string[] {
  try { return JSON.parse(localStorage.getItem('kick_favs') || '[]'); } catch { return []; }
}
function toggleFav(slug: string): boolean {
  const list = getFavs();
  const i = list.indexOf(slug);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(slug);
  localStorage.setItem('kick_favs', JSON.stringify(list.slice(0, 40)));
  return i < 0;
}
function getSetting(key: string, def: string) {
  try { return localStorage.getItem(key) || def; } catch { return def; }
}

export default function Channel() {
  const { slug = '' } = useParams();
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [channel, setChannel] = useState<KickChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatStatus, setChatStatus] = useState('disconnected');
  const [emotes, setEmotes] = useState<EmoteMap>({});
  const [fav, setFav] = useState(false);
  const [showChat, setShowChat] = useState(getSetting('kick_auto_hide_chat', '0') !== '1');
  const [muted, setMuted] = useState(true);
  const [playerError, setPlayerError] = useState('');

  const lowLatency = getSetting('kick_low_latency', '1') === '1';
  const chatLimit = parseInt(getSetting('kick_chat_limit', '200'), 10) || 200;
  const showTs = getSetting('kick_timestamps', '1') === '1';

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    setPlayerError('');
    try {
      const data = await getChannel(slug.toLowerCase());
      setChannel(data);
      setFav(getFavs().includes(slug.toLowerCase()));
      loadEmotes(data.user_id || data.user?.id).then(setEmotes);

      const recent = JSON.parse(localStorage.getItem('kick_recent') || '[]');
      const r = [slug.toLowerCase(), ...recent.filter((s: string) => s !== slug.toLowerCase())].slice(0, 15);
      localStorage.setItem('kick_recent', JSON.stringify(r));
    } catch (e: any) {
      setError(e.message || 'Kanal yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  // HLS player
  useEffect(() => {
    const url = channel?.playback_url;
    const video = videoRef.current;
    if (!url || !video || !channel?.livestream?.is_live) return;

    video.muted = true;
    setMuted(true);
    setPlayerError('');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: lowLatency,
        backBufferLength: 30,
        maxBufferLength: lowLatency ? 12 : 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setPlayerError('Yayın yüklenemedi. Yenilemeyi dene.');
            hls.destroy();
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      setPlayerError('Bu tarayıcı HLS desteklemiyor');
    }
  }, [channel?.playback_url, channel?.livestream?.is_live, lowLatency]);

  // Chat
  useEffect(() => {
    if (!channel?.chatroom?.id) return;
    const client = new KickChatClient();
    client.onStatus = setChatStatus;
    client.onMessage((data) => {
      const msg: Msg = {
        id: data.id || String(Date.now() + Math.random()),
        user: data.sender?.username || 'anon',
        content: data.content || '',
        color: data.sender?.identity?.color || '#53fc18',
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > chatLimit ? next.slice(-chatLimit) : next;
      });
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    });
    client.connect(channel.chatroom.id);
    return () => client.disconnect();
  }, [channel?.chatroom?.id, chatLimit]);

  const onFav = () => {
    if (!slug) return;
    setFav(toggleFav(slug.toLowerCase()));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  if (loading) {
    return (
      <div className="loading" style={{ marginTop: 80 }}>
        <div className="spinner" />
        <span>Kanal yükleniyor...</span>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="error-box">
        <p>{error || 'Kanal bulunamadı'}</p>
        <button className="search-btn" style={{ marginTop: 16 }} onClick={() => nav('/')}>
          Ana Sayfa
        </button>
      </div>
    );
  }

  const isLive = !!channel.livestream?.is_live;
  const title = channel.livestream?.session_title || channel.user.username;
  const viewers = channel.livestream?.viewer_count || 0;

  return (
    <div className="channel">
      <div className="channel-main">
        <div className="topbar">
          <button className="icon-btn" onClick={() => nav('/')} title="Ana sayfa">←</button>
          <div className="topbar-center">
            {channel.user.profile_pic && (
              <img src={channel.user.profile_pic} alt="" referrerPolicy="no-referrer" />
            )}
            <span>{channel.user.username}</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={() => nav('/settings')} title="Ayarlar">⚙️</button>
            <button className="icon-btn" onClick={onFav} title="Favori">
              <span className={fav ? 'heart' : ''}>{fav ? '♥' : '♡'}</span>
            </button>
          </div>
        </div>

        <div className="player-area">
          {isLive && channel.playback_url ? (
            <>
              <video
                ref={videoRef}
                controls
                playsInline
                autoPlay
                muted
                poster=""
              />
              {muted && !playerError && (
                <button className="unmute-btn" onClick={toggleMute}>
                  🔊 Sesi Aç
                </button>
              )}
              {playerError && (
                <div className="player-error">
                  <p>{playerError}</p>
                  <button className="search-btn" onClick={load}>Yenile</button>
                </div>
              )}
            </>
          ) : (
            <div className="offline-box">
              {channel.user.profile_pic && (
                <img src={channel.user.profile_pic} alt="" referrerPolicy="no-referrer" />
              )}
              <div>{isLive ? 'Yayın yükleniyor...' : 'Yayın kapalı'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{channel.user.username}</div>
            </div>
          )}
          <div className="player-meta">
            <div className="player-meta-left">
              {isLive && <span className="live-tag">LIVE</span>}
              <span className="stream-title">{title}</span>
            </div>
            {isLive && <span className="viewer-count">👁 {formatViewers(viewers)}</span>}
          </div>
        </div>
      </div>

      {showChat ? (
        <div className="chat-area">
          <div className="chat-header">
            <h3>Chat</h3>
            <div className="chat-header-right">
              <div className="status">
                <span className={`status-dot ${chatStatus}`} />
                {chatStatus}
              </div>
              <button onClick={() => setShowChat(false)} className="icon-btn" style={{ fontSize: 16 }}>▾</button>
            </div>
          </div>
          <div className="chat-list">
            {messages.length === 0 && (
              <div className="chat-empty">
                {chatStatus === 'connected' ? 'Mesajlar burada görünecek...' : 'Bağlanıyor...'}
              </div>
            )}
            {messages.map((m) => {
              const parts = parseMessage(m.content, emotes);
              return (
                <div key={m.id} className="msg">
                  {showTs && <span className="msg-time">{m.time}</span>}
                  <span className="msg-user" style={{ color: m.color }}>{m.user}</span>
                  <span className="msg-content">
                    {parts.map((p, i) =>
                      p.type === 'emote' && p.emote ? (
                        <img
                          key={i}
                          className="emote"
                          src={p.emote.url}
                          alt={p.value}
                          title={p.value}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span key={i}>{p.value}</span>
                      )
                    )}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        </div>
      ) : (
        <button className="show-chat-btn" onClick={() => setShowChat(true)}>
          💬 Chat'i Göster
        </button>
      )}
    </div>
  );
}
