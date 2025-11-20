import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Strategy from './pages/Strategy';
import { Lock, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('sk_auth');
    if (auth === 'UMGHYOK') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'UMGHYOK') {
      localStorage.setItem('sk_auth', 'UMGHYOK');
      setIsAuthenticated(true);
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-darker flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-primary" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">접근 제한</h1>
            <p className="text-slate-400 text-sm">
              페이지에 접근하려면 비밀번호를 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setError('');
                }}
                placeholder="비밀번호 입력"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-center tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              입장하기 <ArrowRight size={18} />
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-slate-600 text-xs">Protected by System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-dark text-slate-100 font-sans antialiased selection:bg-primary/30 selection:text-primary">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Strategy />} />
          </Routes>
        </main>
        <footer className="bg-darker border-t border-slate-800 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                <p>© 2024 Seven Knights Rebirth Wiki. Unofficial Fan Site.</p>
                <p className="mt-2">Data source is managed by community.</p>
            </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;