import React, { useState, useEffect } from 'react';
import { STRATEGY_DB, HERO_DB } from '../constants';
import { dbService } from '../services/firebase';
import { useGameData } from '../contexts/GameDataContext';
import { Save, RotateCcw, AlertTriangle, Check, Database, Lock } from 'lucide-react';

const Admin: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'strategy' | 'heroes'>('strategy');
    const [jsonContent, setJsonContent] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    
    const { strategyData, heroData, refreshData } = useGameData();

    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === 'strategy') {
                setJsonContent(JSON.stringify(strategyData, null, 2));
            } else {
                setJsonContent(JSON.stringify(heroData, null, 2));
            }
        }
    }, [activeTab, isAuthenticated, strategyData, heroData]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '0070') {
            setIsAuthenticated(true);
        } else {
            alert('관리자 비밀번호가 틀렸습니다.');
        }
    };

    const handleSave = async () => {
        try {
            const parsed = JSON.parse(jsonContent);
            // 저장 시 자동으로 날짜도 업데이트 됩니다 (firebase.ts의 saveGameData 내부 로직)
            await dbService.saveGameData(activeTab, parsed);
            await refreshData(); // 전역 상태 갱신 (최종 업데이트 날짜 포함)
            setMessage({ type: 'success', text: '성공적으로 저장되었습니다! 사이트에 즉시 반영됩니다.' });
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: '저장 실패: JSON 형식이 올바르지 않거나 네트워크 오류가 발생했습니다.' });
        }
    };

    const handleReset = () => {
        if (confirm('정말 초기화 하시겠습니까? 코드(constants.ts)에 있는 기본 데이터로 덮어씌워집니다.')) {
            if (activeTab === 'strategy') {
                setJsonContent(JSON.stringify(STRATEGY_DB, null, 2));
            } else {
                setJsonContent(JSON.stringify(HERO_DB, null, 2));
            }
            setMessage({ type: 'info', text: '기본 데이터로 되돌렸습니다. 적용하려면 [저장]을 누르세요.' });
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-darker flex items-center justify-center p-4">
                <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl max-w-sm w-full text-center">
                    <div className="bg-red-900/20 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                        <Database className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-6">데이터 관리자</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)}
                            placeholder="관리자 비밀번호 (0070)"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-center focus:border-red-500 focus:outline-none"
                        />
                        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">
                            접속하기
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Database className="text-red-500" /> 데이터 관리자
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            웹사이트의 데이터를 직접 수정합니다. 실수하지 않도록 주의하세요!
                        </p>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setActiveTab('strategy')}
                            className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'strategy' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            전략(공략) 데이터
                        </button>
                        <button 
                            onClick={() => setActiveTab('heroes')}
                            className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'heroes' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                            영웅 데이터
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                        message.type === 'success' ? 'bg-green-900/20 border-green-900 text-green-400' : 
                        message.type === 'error' ? 'bg-red-900/20 border-red-900 text-red-400' : 
                        'bg-blue-900/20 border-blue-900 text-blue-400'
                    }`}>
                        {message.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                        {message.text}
                    </div>
                )}

                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-250px)] shadow-2xl">
                    <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-500">EDITING: {activeTab.toUpperCase()}.JSON</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
                            >
                                <RotateCcw size={14} /> 초기화 (기본값 불러오기)
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold shadow-lg shadow-red-900/20 transition-colors"
                            >
                                <Save size={14} /> 저장 및 반영
                            </button>
                        </div>
                    </div>
                    <textarea 
                        className="flex-grow w-full bg-slate-900 text-green-400 font-mono text-sm p-4 focus:outline-none resize-none"
                        spellCheck={false}
                        value={jsonContent}
                        onChange={e => setJsonContent(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Admin;