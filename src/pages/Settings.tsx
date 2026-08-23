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
  const [chatLimit, setChatLimit] = useState(get('kick_chat_limit', '150'));
  const [showTimestamps, setShowTimestamps] = useState(get('kick_timestamps', '1') === '1');
  const [autoHideChat, setAutoHideChat] = useState(get('kick_auto_hide_chat', '0') === '1');
  const [hideSpam, setHideSpam] = useState(get('kick_hide_spam', '1') === '1');
  const [compact, setCompact] = useState(get('kick_compact_chat', '0') === '1');
  const [fontSize, setFontSize] = useState(get('kick_chat_font', '14'));
  const [saved, setSaved] = useState(false);

  const save = () => {
    set('kick_low_latency', lowLatency ? '1' : '0');
    set('kick_chat_limit', chatLimit);
    set('kick_timestamps', showTimestamps ? '1' : '0');
    set('kick_auto_hide_chat', autoHideChat ? '1' : '0');
    set('kick_hide_spam', hideSpam ? '1' : '0');
    set('kick_compact_chat', compact ? '1' : '0');
    set('kick_chat_font', fontSize);
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
            <div className="settings-row-desc">Daha az gecikme</div>
          </div>
          <input type="checkbox" className="toggle" checked={lowLatency} onChange={(e) => setLowLatency(e.target.checked)} />
        </label>
      </div>

      <div className="settings-group">
        <div className="settings-label">Chat</div>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Spam filtre</div>
            <div className="settings-row-desc">Aynı mesajı peş peşe gizle</div>
          </div>
          <input type="checkbox" className="toggle" checked={hideSpam} onChange={(e) => setHideSpam(e.target.checked)} />
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Kompakt chat</div>
            <div className="settings-row-desc">Daha sıkı satır aralığı</div>
          </div>
          <input type="checkbox" className="toggle" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Yazı boyutu</div>
            <div className="settings-row-desc">Chat font size</div>
          </div>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="settings-select">
            <option value="12">Küçük</option>
            <option value="14">Normal</option>
            <option value="16">Büyük</option>
            <option value="18">Çok büyük</option>
          </select>
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Mesaj limiti</div>
            <div className="settings-row-desc">Düşük = daha akıcı</div>
          </div>
          <select value={chatLimit} onChange={(e) => setChatLimit(e.target.value)} className="settings-select">
            <option value="80">80</option>
            <option value="150">150</option>
            <option value="200">200</option>
            <option value="300">300</option>
          </select>
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Saat göster</div>
            <div className="settings-row-desc">Timestamp</div>
          </div>
          <input type="checkbox" className="toggle" checked={showTimestamps} onChange={(e) => setShowTimestamps(e.target.checked)} />
        </label>
        <label className="settings-row">
          <div>
            <div className="settings-row-title">Chat varsayılan gizli</div>
            <div className="settings-row-desc">Kanala girince kapalı</div>
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
        Kick Companion v1.2 — Chat batch, spam filtre, PiP, 7TV/BTTV.
        Ayarlar bu cihazda saklanır.
      </p>
    </div>
  );
}
