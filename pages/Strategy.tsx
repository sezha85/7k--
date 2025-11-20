import React, { useState, useMemo } from 'react';
import { STRATEGY_DB } from '../constants';
import { Search, Sword, Skull, Castle, ShieldAlert, Users, ChevronRight, Flame, Crown, Shield } from 'lucide-react';

const Strategy: React.FC = () => {
    const [activeTab, setActiveTab] = useState('castle');

    // --------------------------------------------------
    // 1. 공성전 UI
    // --------------------------------------------------
    const renderCastle = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Castle className="text-amber-500 w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">요일별 공성전</h2>
                    <p className="text-slate-400 text-sm">매일 달라지는 보스를 공략하고 최고 점수를 달성하세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
                {STRATEGY_DB.castleRush.map(item => (
                    <div key={item.id} className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700 shadow-sm hover:border-amber-500/50 transition-colors">
                        <div className="text-xs text-slate-400 mb-1">{item.day}</div>
                        <div className="font-bold text-sm text-white">{item.boss}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6">
                {STRATEGY_DB.castleRush.map(item => (
                    <div key={item.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        <div className="bg-slate-900/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/50">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <span className="text-amber-500 mr-2 w-14">{item.day}</span> {item.boss}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {item.tags.map((t, i) => (
                                    <span key={i} className="text-xs bg-slate-950 border border-slate-700 px-2 py-1 rounded-full text-slate-400 font-bold">#{t}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Users size={12} /> Party
                                    </div>
                                    <div className="text-white bg-slate-900 p-3 rounded-lg border border-slate-700 text-sm font-medium shadow-inner">
                                        {item.party.join(" / ")}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-amber-500 font-bold mb-2 uppercase tracking-wider flex items-center gap-1">
                                        <Flame size={12} /> Speed & Check
                                    </div>
                                    <div className="text-slate-300 text-sm bg-amber-950/20 p-3 rounded-lg border border-amber-900/30 shadow-inner">
                                        {item.speed}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="text-xs text-blue-400 font-bold mb-3 uppercase border-b border-blue-900/30 pb-2 flex items-center gap-1">
                                    <Sword size={12} /> Skill Sequence
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 bg-slate-700/20 p-3 rounded-lg flex flex-col items-center border border-slate-700/50">
                                            <span className="text-xs text-slate-500 font-bold mb-1">1 Round</span>
                                            <span className="text-white font-bold text-sm">{item.skills.r1}</span>
                                        </div>
                                        <div className="flex-1 bg-slate-700/20 p-3 rounded-lg flex flex-col items-center border border-slate-700/50">
                                            <span className="text-xs text-slate-500 font-bold mb-1">2 Round</span>
                                            <span className="text-white font-bold text-sm">{item.skills.r2}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/80 p-4 rounded-lg border border-blue-900/20">
                                        <div className="text-xs text-blue-400 font-bold mb-3">3 Round (Full Sequence)</div>
                                        <div className="flex flex-wrap gap-y-2 items-center text-sm text-slate-300 leading-relaxed">
                                            {item.skills.r3.split('→').map((skill, idx, arr) => (
                                                <React.Fragment key={idx}>
                                                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-200 shadow-sm border border-slate-700/50">{skill.trim()}</span>
                                                    {idx < arr.length - 1 && <ChevronRight size={14} className="text-slate-600 mx-1" />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                    {item.skills.tip && (
                                        <div className="bg-yellow-900/20 border-l-2 border-yellow-500 p-3 text-sm text-yellow-200/90 rounded-r-lg flex items-start gap-2">
                                            <Crown size={16} className="mt-0.5 shrink-0 text-yellow-500" />
                                            <span><span className="font-bold">Tip:</span> {item.skills.tip}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --------------------------------------------------
    // 2. 강림/원정대 UI
    // --------------------------------------------------
    const renderAdvent = () => (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Skull className="text-purple-500 w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">강림 & 원정대</h2>
                    <p className="text-slate-400 text-sm">고난이도 PVE 콘텐츠 공략 모음입니다.</p>
                </div>
            </div>
            
            {/* 파괴의 신 */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-purple-500 pl-4 py-1">파괴의 신</h3>
                {STRATEGY_DB.advent.destruction.map((item, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-md">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <h4 className="text-white font-bold text-lg">{item.title}</h4>
                            <span className="text-xs bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full border border-purple-700/50">{item.tags[0]}</span>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {item.teams.map((team, tIdx) => (
                                <div key={tIdx} className="bg-slate-700/20 p-5 rounded-xl border border-slate-700 flex flex-col">
                                    <div className="text-base font-bold text-purple-300 mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        {team.name}
                                    </div>
                                    <div className="mb-4">
                                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Party</div>
                                        <div className="text-sm text-white bg-slate-900 p-3 rounded-lg shadow-inner border border-slate-800">{team.party.join(" / ")}</div>
                                    </div>
                                    <div className="mb-4 flex-grow">
                                        <div className="text-xs text-blue-400 font-bold uppercase mb-1">Skill Flow</div>
                                        <div className="bg-slate-900/80 p-3 rounded-lg border border-blue-900/20 h-full">
                                            <div className="flex flex-wrap gap-y-2 items-center text-sm text-slate-300 leading-relaxed">
                                                {team.skillFlow.split('→').map((skill, sIdx, arr) => (
                                                    <React.Fragment key={sIdx}>
                                                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 text-xs sm:text-sm">{skill.trim()}</span>
                                                        {sIdx < arr.length - 1 && <ChevronRight size={12} className="text-slate-600 mx-1" />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {team.tip && (
                                        <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 text-sm text-yellow-200/80 rounded-lg mt-auto">
                                            <span className="font-bold mr-1 text-yellow-500">💡 Tip:</span> {team.tip}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 연희 원정대 */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-l-4 border-pink-500 pl-4 py-1">연희 원정대</h3>
                    {STRATEGY_DB.advent.yeonhee.map((item, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-md">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <h4 className="text-white font-bold text-lg">{item.title}</h4>
                            <div className="flex gap-2">
                                {item.tags.map(t => <span key={t} className="text-xs bg-pink-900/40 text-pink-200 px-3 py-1 rounded-full border border-pink-700/50">{t}</span>)}
                            </div>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {item.teams.map((team, tIdx) => (
                                <div key={tIdx} className="bg-slate-700/20 p-5 rounded-xl border border-slate-700 flex flex-col">
                                    <div className="text-base font-bold text-pink-300 mb-4 flex items-center gap-2">
                                         <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                        {team.name}
                                    </div>
                                    <div className="mb-4">
                                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Party</div>
                                        <div className="text-sm text-white bg-slate-900 p-3 rounded-lg shadow-inner border border-slate-800">{team.party.join(" / ")}</div>
                                    </div>
                                    <div className="mb-4 flex-grow">
                                        <div className="text-xs text-blue-400 font-bold uppercase mb-1">Strategy</div>
                                        <div className="bg-slate-900/80 p-3 rounded-lg border border-blue-900/20 text-sm text-slate-300 h-full">
                                                {team.skillFlow.split('→').map((skill, sIdx, arr) => (
                                                    <React.Fragment key={sIdx}>
                                                        <span className="inline-block bg-slate-800 px-1.5 py-0.5 rounded text-slate-200 mb-1">{skill.trim()}</span>
                                                        {sIdx < arr.length - 1 && <span className="text-slate-600 mx-1 font-bold">➜</span>}
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                    </div>
                                    {team.tip && (
                                        <div className="bg-pink-900/10 border border-pink-900/30 p-3 text-sm text-pink-200/80 rounded-lg mt-auto">
                                            <span className="font-bold mr-1 text-pink-500">💡 Info:</span> {team.tip}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --------------------------------------------------
    // 3. 총력전 UI
    // --------------------------------------------------
    const renderTotal = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Sword className="text-emerald-500 w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">총력전 추천 덱</h2>
                    <p className="text-slate-400 text-sm">강력한 덱 조합과 장비 세팅 가이드</p>
                </div>
            </div>

            <div className="grid gap-6">
                {STRATEGY_DB.totalWar.map((deck, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-emerald-500/30 transition-colors">
                        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                    {deck.name}
                                </h3>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900 px-3 py-1 rounded-full">
                                    {deck.req}
                                </span>
                            </div>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 font-medium">
                                {deck.party}
                            </div>
                        </div>
                        <div className="bg-slate-900/30 p-6 grid md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-xs text-slate-500 font-bold mb-2 uppercase flex items-center gap-1">
                                    <Sword size={12} /> Skill Order
                                </div>
                                <div className="text-sm text-white bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
                                    {deck.skill}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-bold mb-2 uppercase flex items-center gap-1">
                                    <Shield size={12} /> Equipment Setting
                                </div>
                                <ul className="text-sm text-slate-400 space-y-2 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                    {deck.equipments && deck.equipments.map((eq, i) => (
                                        <li key={i} className="flex gap-2 items-start">
                                            <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                                            <span>{eq}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // --------------------------------------------------
    // 4. 길드전 UI
    // --------------------------------------------------
    const GuildWarSearch = () => {
        const [query, setQuery] = useState('');
        const filtered = useMemo(() => {
            if(!query) return STRATEGY_DB.guildWar;
            return STRATEGY_DB.guildWar.filter(g => g.enemyDeck.includes(query));
        }, [query]);

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                        <ShieldAlert className="text-red-500 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">길드전 카운터 찾기</h2>
                        <p className="text-slate-400 text-sm">상대방 덱을 입력하고 카운터 덱을 찾아보세요.</p>
                    </div>
                </div>
                
                <div className="sticky top-20 z-20 pt-2 pb-4 bg-dark">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="상대 덱 영웅 입력 (예: 플라튼, 연희)"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-12 pr-5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-lg shadow-lg placeholder-slate-500"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                            <p className="text-slate-500 text-lg">검색 결과가 없습니다.</p>
                        </div>
                    ) : (
                        filtered.map((item, idx) => (
                            <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                                <div className="bg-red-900/10 p-4 border-b border-slate-700 flex items-center gap-3">
                                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Enemy</div>
                                    <h3 className="text-white font-bold text-lg">{item.enemyDeck}</h3>
                                </div>
                                <div className="divide-y divide-slate-700">
                                    {item.counters.map((counter, cIdx) => (
                                        <div key={cIdx} className="p-5 hover:bg-slate-700/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">You</div>
                                                    <div className="text-blue-300 font-bold text-lg">{counter.deck}</div>
                                                </div>
                                            </div>
                                            <div className="pl-0 sm:pl-12">
                                                <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 w-full flex items-start gap-2">
                                                    <span className="text-slate-500 font-bold text-xs uppercase mt-0.5 shrink-0">Strategy</span>
                                                    <span>{counter.skill}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark pb-20">
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 mb-8 border-b border-white/5">
                <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    전략 가이드
                </h1>
                <p className="text-slate-400 text-lg">
                    공성전, 강림, 길드전 등 모든 콘텐츠의 핵심 공략을 확인하세요.
                </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
                    {[
                        { id: 'castle', label: '공성전', color: 'amber' },
                        { id: 'advent', label: '강림원정대', color: 'purple' },
                        { id: 'total', label: '총력전', color: 'emerald' },
                        { id: 'guild', label: '길드전', color: 'red' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 border ${
                                activeTab === tab.id 
                                    ? `bg-slate-800 text-white border-${tab.color}-500 shadow-md shadow-${tab.color}-900/20 ring-1 ring-${tab.color}-500` 
                                    : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-[600px]">
                    {activeTab === 'castle' && renderCastle()}
                    {activeTab === 'advent' && renderAdvent()}
                    {activeTab === 'total' && renderTotal()}
                    {activeTab === 'guild' && <GuildWarSearch />}
                </div>
            </div>
        </div>
    );
};

export default Strategy;