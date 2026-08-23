export interface Emote {
  id: string;
  name: string;
  url: string;
}

export type EmoteMap = Record<string, Emote>;

const cache: Record<string, EmoteMap> = {};

async function fetch7TVGlobal(): Promise<Emote[]> {
  try {
    const res = await fetch('https://7tv.io/v3/emote-sets/global');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.emotes || []).map((e: any) => {
      const file = e.data?.host?.files?.find((f: any) => f.name?.includes('2x')) ||
                   e.data?.host?.files?.find((f: any) => f.name?.includes('1x'));
      const url = file ? `https:${e.data.host.url}/${file.name}` : '';
      return { id: e.id, name: e.name, url };
    }).filter((e: Emote) => e.url);
  } catch { return []; }
}

async function fetch7TVChannel(userId: number | string): Promise<Emote[]> {
  try {
    const res = await fetch(`https://7tv.io/v3/users/kick/${userId}`);
    if (!res.ok) return [];
    const user = await res.json();
    const setId = user.emote_set?.id;
    if (!setId) return [];
    const setRes = await fetch(`https://7tv.io/v3/emote-sets/${setId}`);
    if (!setRes.ok) return [];
    const set = await setRes.json();
    return (set.emotes || []).map((e: any) => {
      const file = e.data?.host?.files?.find((f: any) => f.name?.includes('2x')) ||
                   e.data?.host?.files?.find((f: any) => f.name?.includes('1x'));
      const url = file ? `https:${e.data.host.url}/${file.name}` : '';
      return { id: e.id, name: e.name, url };
    }).filter((e: Emote) => e.url);
  } catch { return []; }
}

async function fetchBTTVGlobal(): Promise<Emote[]> {
  try {
    const res = await fetch('https://api.betterttv.net/3/cached/emotes/global');
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((e: any) => ({
      id: e.id,
      name: e.code,
      url: `https://cdn.betterttv.net/emote/${e.id}/2x`,
    }));
  } catch { return []; }
}

export async function loadEmotes(kickUserId?: number | string): Promise<EmoteMap> {
  const key = String(kickUserId || 'g');
  if (cache[key]) return cache[key];
  const [g7, bttv, c7] = await Promise.all([
    fetch7TVGlobal(),
    fetchBTTVGlobal(),
    kickUserId ? fetch7TVChannel(kickUserId) : Promise.resolve([]),
  ]);
  const map: EmoteMap = {};
  [...bttv, ...g7, ...c7].forEach((e) => { map[e.name] = e; });
  cache[key] = map;
  return map;
}

export function parseMessage(content: string, emoteMap: EmoteMap) {
  if (!content) return [];
  const words = content.split(/(\s+)/);
  const result: { type: 'text' | 'emote'; value: string; emote?: Emote }[] = [];
  for (const word of words) {
    const t = word.trim();
    if (t && emoteMap[t]) {
      result.push({ type: 'emote', value: t, emote: emoteMap[t] });
    } else {
      if (result.length && result[result.length - 1].type === 'text') {
        result[result.length - 1].value += word;
      } else {
        result.push({ type: 'text', value: word });
      }
    }
  }
  return result;
}
