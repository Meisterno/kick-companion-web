import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannel, type KickChannel } from '../lib/kick-api';

const FEATURED = [
  'xqc', 'adinross', 'trainwreckstv', 'amouranth', 'destiny',
  'hasanabi', 'mizkif', 'pokimane', 'shroud', 'nmplol', 'sodapoppin', 'kaicenat',
];

interface Card {
  slug: string;
  username: string;
  title: string;
  viewers: number;
  isLive: boolean;
  thumb: string | null;
  avatar: string | null;
  category: string;
}

function formatViewers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function loadFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem('kick_favs') || '[]');
  } catch { return []; }
}

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem('kick_recent') || '[]');
  } catch { return []; }
}

export default function Home() {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [streams, setStreams] = useState<Card[]>([]);
  const [favs, setFavs] = useState<Card[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const toCard = (ch: KickChannel): Card => ({
    slug: ch.slug,
    username: ch.user.username,
    title: ch.livestream?.session_title || 'Offline',
    viewers: ch.livestream?.viewer_count || 0,
    isLive: !!ch.livestream?.is_live,
    thumb: ch.livestream?.thumbnail?.url || null,
    avatar: ch.user.profile_pic || null,
    category: ch.livestream?.categories?.[0]?.name || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const favSlugs = loadFavs();
    setRecent(loadRecent());

    const results = await Promise.all(
      FEATURED.slice(0, 10).map(async (s) => {
        try { return toCard(await getChannel(s)); } catch { return null; }
      })
    );
    const list = results.filter(Boolean) as Card[];
    list.sort((a, b) => (a.isLive === b.isLive ? b.viewers - a.viewers : a.isLive ? -1 : 1));
    setStreams(list);

    if (favSlugs.length) {
      const fResults = await Promise.all(
        favSlugs.slice(0, 8).map(async (s) => {
          try { return toCard(await getChannel(s)); } catch { return null; }
        })
      );
      setFavs(fResults.filter(Boolean) as Card[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const go = (slug: string) => {
    const rec = loadRecent().filter((s) => s !== slug);
    rec.unshift(slug);
    localStorage.setItem('kick_recent', JSON.stringify(rec.slice(0, 15)));
    nav(`/channel/${slug}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (q) go(q);
  };

  return (
    <div className="home">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <form className="search-bar" onSubmit={onSearch} style={{ flex: 1, marginBottom: 0 }}>
          <span style={{ color: 'var(--muted)' }}>🔍</span>
          <input
            placeholder="Streamer slug (xqc, adinross...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button type="submit" className="search-btn">Git</button>
        </form>
        <button className="icon-btn" onClick={() => nav('/settings')} style={{ fontSize: 22, flexShrink: 0 }} title="Ayarlar">
          ⚙️
        </button>
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : (
        <>
          {favs.length > 0 && (
            <>
              <div className="section-title">❤️ Favoriler</div>
              <div className="chips">
                {favs.map((f) => (
                  <button key={f.slug} className="chip" onClick={() => go(f.slug)}>
                    {f.avatar && <img src={f.avatar} alt="" />}
                    <span>{f.username}</span>
                    {f.isLive && <span className="live-dot" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {recent.length > 0 && (
            <>
              <div className="section-title">Son İzlenenler</div>
              <div className="chips">
                {recent.slice(0, 8).map((s) => (
                  <button key={s} className="chip" onClick={() => go(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="section-title">Öne Çıkanlar</div>
          <div className="grid">
            {streams.map((item) => (
              <button key={item.slug} className="card" onClick={() => go(item.slug)}>
                <div className="thumb-wrap">
                  {item.thumb ? (
                    <img src={item.thumb} alt="" loading="lazy" />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                      Offline
                    </div>
                  )}
                  {item.isLive && <span className="live-badge">LIVE</span>}
                  {item.isLive && (
                    <span className="viewer-badge">👁 {formatViewers(item.viewers)}</span>
                  )}
                </div>
                <div className="card-body">
                  {item.avatar ? <img className="avatar" src={item.avatar} alt="" /> : <div className="avatar" />}
                  <div className="card-info">
                    <div className="username">{item.username}</div>
                    <div className="title">{item.title}</div>
                    {item.category && <div className="category">{item.category}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {streams.length === 0 && <div className="empty">Stream bulunamadı. Slu g ile ara.</div>}
        </>
      )}
    </div>
  );
}
