const BASE = 'https://kick.com/api/v2';

export interface KickChannel {
  id: number;
  user_id: number;
  slug: string;
  playback_url: string | null;
  user: {
    id: number;
    username: string;
    bio: string;
    profile_pic: string;
  };
  chatroom: { id: number };
  livestream: {
    id: number;
    session_title: string;
    is_live: boolean;
    viewer_count: number;
    thumbnail?: {
      url?: string;
      src?: string;
      srcset?: string;
    } | string | null;
    categories: { name: string }[];
  } | null;
}

const headers = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
};

export async function getChannel(slug: string): Promise<KickChannel> {
  const res = await fetch(`${BASE}/channels/${encodeURIComponent(slug)}`, { headers });
  if (!res.ok) throw new Error(`Kanal bulunamadı (${res.status})`);
  return res.json();
}

/** Extract best thumbnail URL from various Kick response shapes */
export function getThumb(ch: KickChannel): string | null {
  const t = ch.livestream?.thumbnail;
  if (!t) return null;
  if (typeof t === 'string') return t;
  if (t.url) return t.url;
  if (t.src) return t.src;
  if (t.srcset) {
    // "url1 1x, url2 2x" → pick last (highest res)
    const parts = t.srcset.split(',').map((s) => s.trim().split(/\s+/)[0]);
    return parts[parts.length - 1] || parts[0] || null;
  }
  return null;
}

export async function getFeatured(limit = 12): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/featured-livestreams/en?limit=${limit}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.livestreams || data?.data || [];
  } catch {
    return [];
  }
}
