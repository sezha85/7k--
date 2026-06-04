import React from 'react';
import { Link } from 'react-router-dom';
import { Swords } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-darker border-b border-slate-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-primary tracking-wider hover:text-amber-400 transition-colors">
              <Swords className="text-primary" size={24} />
              <span className="text-white">7K <span className="text-primary">Guild War</span></span>
            </Link>
          </div>
          <div className="hidden sm:block text-xs text-slate-500 font-medium">
            길드전 카운터 검색 시스템
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
