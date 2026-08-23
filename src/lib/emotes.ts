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
      const files = e.data?.host?.files || [];
      const file = files.find((f: any) => f.name === '2x.webp') ||
                   files.find((f: any) => f.name === '1x.webp') ||
                   files.find((f: any) => f.name?.includes('2x')) ||
                   files[0];
      const url = file && e.data?.host?.url ? `https:${e.data.host.url}/${file.name}` : '';
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
      const files = e.data?.host?.files || [];
      const file = files.find((f: any) => f.name === '2x.webp') ||
                   files.find((f: any) => f.name === '1x.webp') ||
                   files.find((f: any) => f.name?.includes('2x')) ||
                   files[0];
      const url = file && e.data?.host?.url ? `https:${e.data.host.url}/${file.name}` : '';
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
      url: `https://cdn.betterttv.net/emote/${e.id}/2x.webp`,
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

/**
 * Parse chat message.
 * 1) Kick native: [emote:ID:NAME] → https://files.kick.com/emotes/ID/fullsize
 * 2) 7TV / BTTV text names
 */
export function parseMessage(content: string, emoteMap: EmoteMap) {
  if (!content) return [];

  type Part = { type: 'text' | 'emote'; value: string; emote?: Emote };
  const result: Part[] = [];

  const kickEmoteRe = /\[emote:(\d+):([^\]]*)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = kickEmoteRe.exec(content)) !== null) {
    if (match.index > lastIndex) {
      pushTextWithThirdParty(content.slice(lastIndex, match.index), emoteMap, result);
    }
    const id = match[1];
    const name = match[2] || id;
    result.push({
      type: 'emote',
      value: name,
      emote: {
        id,
        name,
        url: `https://files.kick.com/emotes/${id}/fullsize`,
      },
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    pushTextWithThirdParty(content.slice(lastIndex), emoteMap, result);
  }

  return result;
}

function pushTextWithThirdParty(
  text: string,
  emoteMap: EmoteMap,
  result: { type: 'text' | 'emote'; value: string; emote?: Emote }[]
) {
  if (!text) return;
  const words = text.split(/(\s+)/);
  for (const word of words) {
    const t = word.trim();
    if (t && emoteMap[t]) {
      result.push({ type: 'emote', value: t, emote: emoteMap[t] });
    } else {
      if (result.length && result[result.length - 1].type === 'text') {
        result[result.length - 1].value += word;
      } else if (word) {
        result.push({ type: 'text', value: word });
      }
    }
  }
}
