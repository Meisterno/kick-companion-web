import { useState } from 'react';
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
    <div className="settings">
      <div className="settings-header">
        <button className="icon-btn" onClick={() => nav(-1)}>←</button>
        <h2>Ayarlar</h2>
      </div>

      <div className="settings-group">
        <div className="settings-label">Oynatıcı</div>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Düşük latency</div>
            <div className="settings-row-desc">Daha az gecikme, biraz daha buffer riski</div>
          </div>
          <input type="checkbox" className="toggle" checked={lowLatency} onChange={(e) => setLowLatency(e.target.checked)} />
        </label>
      </div>

      <div className="settings-group">
        <div className="settings-label">Chat</div>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Mesaj limiti</div>
            <div className="settings-row-desc">Bellekte tutulan max mesaj</div>
          </div>
          <select value={chatLimit} onChange={(e) => setChatLimit(e.target.value)} className="settings-select">
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="500">500</option>
          </select>
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Saat göster</div>
            <div className="settings-row-desc">Mesaj yanında timestamp</div>
          </div>
          <input type="checkbox" className="toggle" checked={showTimestamps} onChange={(e) => setShowTimestamps(e.target.checked)} />
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Chat'i varsayılan gizle</div>
            <div className="settings-row-desc">Kanala girince chat kapalı gelsin</div>
          </div>
          <input type="checkbox" className="toggle" checked={autoHideChat} onChange={(e) => setAutoHideChat(e.target.checked)} />
        </label>
      </div>

      <button className="search-btn settings-save" onClick={save}>
        {saved ? '✓ Kaydedildi' : 'Kaydet'}
      </button>

      <div className="settings-group" style={{ marginTop: 28 }}>
        <div className="settings-label">Veri</div>
        <button className="settings-danger" onClick={clearData}>
          Favorileri & geçmişi temizle
        </button>
      </div>

      <p className="settings-footer">
        Kick Companion v1.1 — Emote (Kick + 7TV + BTTV), low latency, favoriler.
        Ayarlar bu cihazda saklanır.
      </p>
    </div>
  );
}
