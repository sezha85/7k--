import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sword, Megaphone } from 'lucide-react';
import SuggestionModal from './SuggestionModal';

const Navbar: React.FC = () => {
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  return (
    <>
      <nav className="bg-darker border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-wider hover:text-amber-400 transition-colors">
                <Sword className="text-primary" fill="currentColor" size={24} />
                <span className="text-white">7K <span className="text-primary">RE:BIRTH</span> WIKI</span>
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSuggestionOpen(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-700 transition-all"
              >
                <Megaphone size={14} className="text-primary" />
                제보하기
              </button>
              <div className="hidden sm:block text-xs text-slate-500 font-medium">
                통합 공략 데이터베이스
              </div>
            </div>
          </div>
        </div>
      </nav>
      <SuggestionModal isOpen={isSuggestionOpen} onClose={() => setIsSuggestionOpen(false)} />
    </>
  );
};

export default Navbar;