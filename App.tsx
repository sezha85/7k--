import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import GuildWar from './pages/GuildWar';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-dark text-slate-100 font-sans antialiased selection:bg-primary/30 selection:text-primary">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<GuildWar />} />
            <Route path="/guild-war" element={<GuildWar />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="bg-darker border-t border-slate-800 py-6">
          <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-xs">
            <p>© 2026 7K Guild War Counter. Unofficial Fan Site.</p>
            <p className="mt-1">상대덱 검색 · 카운터덱 관리 · 길드전 오더 참고용</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
