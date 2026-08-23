import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChannel, getThumb, type KickChannel } from '../lib/kick-api';

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
  try { return JSON.parse(localStorage.getItem('kick_favs') || '[]'); } catch { return []; }
}
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem('kick_recent') || '[]'); } catch { return []; }
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
    thumb: getThumb(ch),
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

  const hero = streams.find((s) => s.isLive) || streams[0];
  const rest = hero ? streams.filter((s) => s.slug !== hero.slug) : streams;

  return (
    <div className="home">
      <header className="home-header">
        <div className="logo">
          <span className="logo-dot" />
          <span>Kick Companion</span>
        </div>
        <button className="icon-btn" onClick={() => nav('/settings')} aria-label="Ayarlar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </svg>
        </button>
      </header>

      <form className="search-bar" onSubmit={onSearch}>
        <span className="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
        </span>
        <input
          placeholder="Streamer ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button type="submit" className="search-btn">Git</button>
      </form>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Yayınlar yükleniyor…</span>
        </div>
      ) : (
        <>
          {hero && (
            <section className="hero-section">
              <button className="hero-card" onClick={() => go(hero.slug)}>
                <div className="hero-media">
                  {hero.thumb ? (
                    <img src={hero.thumb} alt="" loading="eager" referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="thumb-placeholder">
                      {hero.avatar
                        ? <img src={hero.avatar} alt="" referrerPolicy="no-referrer" />
                        : <span>{hero.username[0]?.toUpperCase()}</span>}
                    </div>
                  )}
                  <div className="hero-overlay" />
                  {hero.isLive && <span className="live-badge live-badge-lg">LIVE</span>}
                  {hero.isLive && (
                    <span className="viewer-badge viewer-badge-lg">
                      <span className="eye">●</span> {formatViewers(hero.viewers)}
                    </span>
                  )}
                  <div className="hero-info">
                    {hero.avatar && (
                      <img className="hero-avatar" src={hero.avatar} alt="" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <div className="hero-name">{hero.username}</div>
                      <div className="hero-title">{hero.title}</div>
                      {hero.category && <div className="hero-cat">{hero.category}</div>}
                    </div>
                  </div>
                </div>
              </button>
            </section>
          )}

          {favs.length > 0 && (
            <section>
              <div className="section-title">Favoriler</div>
              <div className="chips">
                {favs.map((f) => (
                  <button key={f.slug} className="chip" onClick={() => go(f.slug)}>
                    {f.avatar && <img src={f.avatar} alt="" referrerPolicy="no-referrer" />}
                    <span>{f.username}</span>
                    {f.isLive && <span className="live-dot" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <div className="section-title">Son izlenenler</div>
              <div className="chips">
                {recent.slice(0, 8).map((s) => (
                  <button key={s} className="chip chip-text" onClick={() => go(s)}>{s}</button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="section-title">Öne çıkanlar</div>
            <div className="grid">
              {rest.map((item) => (
                <button key={item.slug} className="card" onClick={() => go(item.slug)}>
                  <div className="thumb-wrap">
                    {item.thumb ? (
                      <img
                        src={item.thumb}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          el.parentElement?.classList.add('thumb-fallback');
                        }}
                      />
                    ) : (
                      <div className="thumb-placeholder">
                        {item.avatar
                          ? <img src={item.avatar} alt="" referrerPolicy="no-referrer" />
                          : <span>{item.username[0]?.toUpperCase()}</span>}
                      </div>
                    )}
                    <div className="thumb-shade" />
                    {item.isLive && <span className="live-badge">LIVE</span>}
                    {item.isLive && (
                      <span className="viewer-badge">{formatViewers(item.viewers)} izleyici</span>
                    )}
                  </div>
                  <div className="card-body">
                    {item.avatar ? (
                      <img className="avatar" src={item.avatar} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="avatar avatar-fallback">{item.username[0]?.toUpperCase()}</div>
                    )}
                    <div className="card-info">
                      <div className="username">{item.username}</div>
                      <div className="title">{item.title}</div>
                      {item.category && <div className="category">{item.category}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {streams.length === 0 && (
              <div className="empty">Stream bulunamadı. Arama ile dene.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
