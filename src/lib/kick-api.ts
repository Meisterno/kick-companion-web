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
    thumbnail: { url: string };
    categories: { name: string }[];
  } | null;
}

export async function getChannel(slug: string): Promise<KickChannel> {
  const res = await fetch(`${BASE}/channels/${slug}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Kanal bulunamadı (${res.status})`);
  return res.json();
}
