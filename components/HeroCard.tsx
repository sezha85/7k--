import React from 'react';
import { Hero, Element } from '../types';
import { Shield, Zap, Star, Flame, Droplets, Mountain, Sun, Moon } from 'lucide-react';

interface HeroCardProps {
  hero: Hero;
}

const getElementIcon = (element: Element) => {
  switch (element) {
    case Element.FIRE: return <Flame size={14} className="text-red-500" />;
    case Element.WATER: return <Droplets size={14} className="text-blue-500" />;
    case Element.EARTH: return <Mountain size={14} className="text-green-500" />;
    case Element.LIGHT: return <Sun size={14} className="text-yellow-400" />;
    case Element.DARK: return <Moon size={14} className="text-purple-500" />;
    default: return <Star size={14} />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'S+': return 'bg-red-600 text-white border-red-400';
    case 'S': return 'bg-orange-500 text-white border-orange-300';
    case 'A': return 'bg-purple-600 text-white border-purple-400';
    case 'B': return 'bg-blue-600 text-white border-blue-400';
    default: return 'bg-gray-600 text-white';
  }
};

const HeroCard: React.FC<HeroCardProps> = ({ hero }) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-all duration-300 group relative flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={hero.imageUrl} 
          alt={hero.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-90"></div>
        
        {/* Top Tags */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getTierColor(hero.tier)}`}>
            {hero.tier} Tier
          </span>
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-900/80 text-gray-200 border border-slate-600 flex items-center gap-1">
            {getElementIcon(hero.element)}
            {hero.element}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{hero.name}</h3>
          <p className="text-xs text-primary/80 font-medium uppercase tracking-wide">{hero.title}</p>
          <p className="text-xs text-gray-400 mt-1">{hero.type} / {hero.rarity}</p>
        </div>
        
        <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-grow">
          {hero.description}
        </p>

        {/* Skills Preview (Simplified) */}
        <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="flex items-start gap-2">
                <Shield size={14} className="mt-0.5 text-blue-400 shrink-0" />
                <p className="text-xs text-gray-400"><span className="text-gray-200 font-semibold">패시브:</span> {hero.passive}</p>
            </div>
            <div className="flex items-start gap-2">
                <Zap size={14} className="mt-0.5 text-yellow-400 shrink-0" />
                <p className="text-xs text-gray-400"><span className="text-gray-200 font-semibold">스킬:</span> {hero.skills[0].name}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
