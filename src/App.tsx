import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Channel from './pages/Channel';
import Settings from './pages/Settings';
import './styles/app.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channel/:slug" element={<Channel />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
