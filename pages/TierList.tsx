import React from 'react';
import { HERO_DB } from '../constants';
import { Hero } from '../types';
import HeroCard from '../components/HeroCard';

const TierList: React.FC = () => {
  const tiers = ['S+', 'S', 'A', 'B', 'C'];

  const getHeroesByTier = (tier: string) => {
    return HERO_DB.filter(h => h.tier === tier);
  };

  return (
    <div className="min-h-screen bg-dark pb-10">
       <div className="bg-gradient-to-r from-red-900 to-orange-900 py-12 px-4 sm:px-6 lg:px-8 mb-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            티어 리스트
          </h1>
          <p className="text-orange-200 text-lg">
            현재 메타에서 가장 강력한 영웅 순위입니다. (매주 업데이트)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {tiers.map((tier) => {
          const heroes = getHeroesByTier(tier);
          if (heroes.length === 0) return null;

          let tierColor = '';
          let tierBg = '';
          
          switch(tier) {
            case 'S+': 
                tierColor = 'text-red-400'; 
                tierBg = 'border-red-900/50 bg-red-900/10';
                break;
            case 'S': 
                tierColor = 'text-orange-400'; 
                tierBg = 'border-orange-900/50 bg-orange-900/10';
                break;
            case 'A': 
                tierColor = 'text-purple-400'; 
                tierBg = 'border-purple-900/50 bg-purple-900/10';
                break;
            default: 
                tierColor = 'text-blue-400'; 
                tierBg = 'border-blue-900/50 bg-blue-900/10';
          }

          return (
            <div key={tier} className={`rounded-2xl border ${tierBg} p-6`}>
              <h2 className={`text-4xl font-black ${tierColor} mb-6 flex items-center gap-4`}>
                {tier} <span className="text-lg font-normal text-gray-400 tracking-normal">RANK</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {heroes.map(hero => (
                  <HeroCard key={hero.id} hero={hero} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierList;
