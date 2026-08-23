import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function get(key: string, def: string) {
  try { return localStorage.getItem(key) || def; } catch { return def; }
}
function set(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

export default function Settings() {
  const nav = useNavigate();
  const [lowLatency, setLowLatency] = useState(get('kick_low_latency', '1') === '1');
  const [chatLimit, setChatLimit] = useState(get('kick_chat_limit', '200'));
  const [showTimestamps, setShowTimestamps] = useState(get('kick_timestamps', '1') === '1');
  const [autoHideChat, setAutoHideChat] = useState(get('kick_auto_hide_chat', '0') === '1');
  const [saved, setSaved] = useState(false);

  const save = () => {
    set('kick_low_latency', lowLatency ? '1' : '0');
    set('kick_chat_limit', chatLimit);
    set('kick_timestamps', showTimestamps ? '1' : '0');
    set('kick_auto_hide_chat', autoHideChat ? '1' : '0');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const clearData = () => {
    if (confirm('Favoriler ve son izlenenler silinecek. Emin misin?')) {
      localStorage.removeItem('kick_favs');
      localStorage.removeItem('kick_recent');
      alert('Temizlendi');
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => nav(-1)} style={{ fontSize: 22 }}>←</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>Ayarlar</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Düşük latency (low latency HLS)</span>
          <input type="checkbox" checked={lowLatency} onChange={(e) => setLowLatency(e.target.checked)} />
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Chat mesaj limiti</span>
          <select value={chatLimit} onChange={(e) => setChatLimit(e.target.value)} style={{ background: 'var(--surface)', color: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="500">500</option>
          </select>
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Saat göster (timestamp)</span>
          <input type="checkbox" checked={showTimestamps} onChange={(e) => setShowTimestamps(e.target.checked)} />
        </label>

        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Chat'i varsayılan gizle</span>
          <input type="checkbox" checked={autoHideChat} onChange={(e) => setAutoHideChat(e.target.checked)} />
        </label>

        <button className="search-btn" onClick={save} style={{ width: '100%', padding: 12 }}>
          {saved ? '✓ Kaydedildi' : 'Kaydet'}
        </button>

        <hr style={{ borderColor: 'var(--border)' }} />

        <button onClick={clearData} style={{ background: '#333', color: '#ff6b6b', padding: 12, borderRadius: 8, fontWeight: 600 }}>
          Favorileri & geçmişi temizle
        </button>

        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
          Kick Companion v1.1 — Emote (Kick + 7TV + BTTV), low latency, favoriler, PWA.
          Ayarlar tarayıcında saklanır.
        </p>
      </div>
    </div>
  );
}
