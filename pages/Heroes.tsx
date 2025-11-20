import React, { useState, useMemo } from 'react';
import { HERO_DB } from '../constants';
import HeroCard from '../components/HeroCard';
import { HeroType, Element, Rarity } from '../types';
import { Search, Filter } from 'lucide-react';

const Heroes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedElement, setSelectedElement] = useState<string>('ALL');

  const filteredHeroes = useMemo(() => {
    return HERO_DB.filter(hero => {
      const matchesSearch = hero.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            hero.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'ALL' || hero.type === selectedType;
      const matchesElement = selectedElement === 'ALL' || hero.element === selectedElement;
      
      return matchesSearch && matchesType && matchesElement;
    });
  }, [searchTerm, selectedType, selectedElement]);

  return (
    <div className="min-h-screen bg-dark pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8 mb-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            영웅 도감
          </h1>
          <p className="text-indigo-200 text-lg max-w-2xl">
            세븐나이츠 리버스의 모든 영웅 정보를 확인하고 전략을 세우세요.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border border-slate-700 shadow-md">
            {/* Search */}
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-lg leading-5 bg-slate-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="영웅 이름 또는 칭호 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="appearance-none bg-slate-900 border border-slate-600 text-gray-300 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-40"
                    >
                        <option value="ALL">모든 타입</option>
                        {Object.values(HeroType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Filter className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                     <select
                        value={selectedElement}
                        onChange={(e) => setSelectedElement(e.target.value)}
                        className="appearance-none bg-slate-900 border border-slate-600 text-gray-300 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-40"
                    >
                        <option value="ALL">모든 속성</option>
                        {Object.values(Element).map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 h-2 w-2 bg-indigo-500 rounded-full pointer-events-none"></div>
                </div>
            </div>
        </div>

        {/* Grid */}
        {filteredHeroes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHeroes.map((hero) => (
                <HeroCard key={hero.id} hero={hero} />
            ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-400">
                <p className="text-xl">검색 결과가 없습니다.</p>
                <p className="text-sm mt-2">다른 검색어나 필터를 시도해보세요.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Heroes;
