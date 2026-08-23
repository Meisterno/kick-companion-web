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

export default function Channel() {
  const { slug = '' } = useParams();
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chatRef = useRef<KickChatClient | null>(null);

  const [channel, setChannel] = useState<KickChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatStatus, setChatStatus] = useState('disconnected');
  const [emotes, setEmotes] = useState<EmoteMap>({});
  const [fav, setFav] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
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

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    }
  }, [channel?.playback_url, channel?.livestream?.is_live]);

  // Chat
  useEffect(() => {
    if (!channel?.chatroom?.id) return;
    const client = new KickChatClient();
    chatRef.current = client;
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
        return next.length > 200 ? next.slice(-200) : next;
      });
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    });
    client.connect(channel.chatroom.id);
    return () => client.disconnect();
  }, [channel?.chatroom?.id]);

  const onFav = () => {
    if (!slug) return;
    setFav(toggleFav(slug.toLowerCase()));
  };

  if (loading) {
    return <div className="loading" style={{ marginTop: 80 }}>Kanal yükleniyor...</div>;
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
          <button className="icon-btn" onClick={() => nav(-1)}>←</button>
          <div className="topbar-center">
            {channel.user.profile_pic && <img src={channel.user.profile_pic} alt="" />}
            <span>{channel.user.username}</span>
          </div>
          <button className="icon-btn" onClick={onFav}>
            <span className={fav ? 'heart' : ''}>{fav ? '♥' : '♡'}</span>
          </button>
        </div>

        <div className="player-area">
          {isLive && channel.playback_url ? (
            <video ref={videoRef} controls playsInline autoPlay />
          ) : (
            <div className="offline-box">
              {channel.user.profile_pic && <img src={channel.user.profile_pic} alt="" />}
              <div>{isLive ? 'Yayın yükleniyor...' : 'Yayın kapalı'}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>{channel.user.username}</div>
            </div>
          )}
          <div className="player-meta">
            <div className="player-meta-left">
              {isLive && <span className="live-tag">LIVE</span>}
              <span className="stream-title">{title}</span>
            </div>
            {isLive && (
              <span className="viewer-count">👁 {formatViewers(viewers)}</span>
            )}
          </div>
        </div>
      </div>

      {showChat ? (
        <div className="chat-area">
          <div className="chat-header">
            <h3>Chat</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="status">
                <span className={`status-dot ${chatStatus}`} />
                {chatStatus}
              </div>
              <button onClick={() => setShowChat(false)} style={{ color: 'var(--muted)', fontSize: 18 }}>
                ▾
              </button>
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
                  <span className="msg-time">{m.time}</span>
                  <span className="msg-user" style={{ color: m.color }}>{m.user}</span>
                  <span className="msg-content">
                    {parts.map((p, i) =>
                      p.type === 'emote' && p.emote ? (
                        <img key={i} className="emote" src={p.emote.url} alt={p.value} />
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
