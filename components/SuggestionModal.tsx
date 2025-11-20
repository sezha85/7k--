import React, { useState, useEffect } from 'react';
import { X, Send, Check, Lock, Unlock, AlertCircle, Clock, Trash2, CloudOff, Cloud, ExternalLink } from 'lucide-react';
import { Suggestion } from '../types';
import { dbService } from '../services/firebase';

interface SuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
    const [category, setCategory] = useState('공성전');
    const [content, setContent] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    
    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminInput, setShowAdminInput] = useState(false);
    
    // Delete Confirmation State
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    
    // DB State
    const isDbConnected = dbService.isConfigured();

    useEffect(() => {
        if (!isOpen) return;

        // Subscribe to real-time updates
        const unsubscribe = dbService.subscribe((data) => {
            setSuggestions(data);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const newSuggestion: Omit<Suggestion, 'id'> = {
            category,
            content,
            createdAt: Date.now(),
            status: 'pending'
        };

        try {
            await dbService.add(newSuggestion);
            setContent('');
            setActiveTab('list');
        } catch (error) {
            alert('제보 등록 중 오류가 발생했습니다.');
            console.error(error);
        }
    };

    const handleAdminLogin = () => {
        // TODO: 보안을 위해 실제 배포 시에는 이 비밀번호를 변경하거나 환경변수로 관리하세요.
        if (adminPassword === '0070') {
            setIsAdmin(true);
            setShowAdminInput(false);
            setAdminPassword('');
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    };

    const handleComplete = async (id: string) => {
        const date = new Date();
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        try {
            await dbService.updateStatus(id, 'completed', dateString);
        } catch (error) {
            alert('상태 업데이트 실패');
        }
    };

    const initiateDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const cancelDelete = () => {
        setDeleteConfirmId(null);
    };

    const confirmDelete = async (id: string) => {
        try {
            await dbService.delete(id);
            setDeleteConfirmId(null);
        } catch (error) {
            alert('삭제 실패: ' + error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📢 공략 제보하기
                        {!isDbConnected && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 flex items-center gap-1 font-normal">
                                <CloudOff size={10} /> 체험판(로컬)
                            </span>
                        )}
                        {isDbConnected && (
                             <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/20 text-green-500 border border-green-900/30 flex items-center gap-1 font-normal">
                                <Cloud size={10} /> 온라인
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button 
                        onClick={() => setActiveTab('write')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'write' ? 'text-primary border-b-2 border-primary bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        제보 작성
                    </button>
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'list' ? 'text-primary border-b-2 border-primary bg-slate-800/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        제보 내역 ({suggestions.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!isDbConnected && activeTab === 'write' && (
                        <div className="mb-4 bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                                <div className="text-sm text-amber-100">
                                    <p className="font-bold text-amber-400 mb-1">현재 '혼자 쓰기' 모드입니다.</p>
                                    <p className="mb-2 text-amber-200/80">
                                        Firebase 설정이 되어있지 않아 작성한 글이 <strong>다른 사람에게는 보이지 않습니다.</strong>
                                    </p>
                                    <p className="text-xs text-amber-500 bg-amber-950/50 p-2 rounded border border-amber-900/50">
                                        💡 <strong>공유하는 방법:</strong><br/>
                                        <code>services/firebase.ts</code> 파일을 열어보세요. 아주 쉬운 설정 방법이 적혀있습니다!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'write' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-sm text-slate-300 flex gap-3">
                                <AlertCircle className="text-primary shrink-0" size={20} />
                                <p>
                                    발견하신 공략이나 팁을 공유해주세요!<br/>
                                    작성해주신 내용은 관리자 검토 후 공략집에 반영됩니다.
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300">카테고리</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="공성전">공성전</option>
                                    <option value="강림원정대">강림원정대</option>
                                    <option value="총력전">총력전</option>
                                    <option value="길드전">길드전</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-300">제보 내용</label>
                                <textarea 
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="예: 화요일 공성전 아일린 상대로 윈디 대신 클로에를 써보니 점수가 더 잘나와요. 덱 구성은..."
                                    className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Send size={18} /> 제보하기
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                             {suggestions.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    등록된 제보가 없습니다.
                                </div>
                             ) : (
                                suggestions.map(item => (
                                    <div key={item.id} className={`bg-slate-800 rounded-xl p-5 border transition-all ${item.status === 'completed' ? 'border-green-900/50 bg-green-900/5' : 'border-slate-700'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700">
                                                    {item.category}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Status Badges */}
                                                {item.status === 'completed' ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                                                        <Check size={12} /> {item.completedAt} 반영 완료
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-900/20 px-2 py-1 rounded border border-amber-900/30">
                                                        <Clock size={12} /> 검토 중
                                                    </span>
                                                )}

                                                {/* Admin Actions */}
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-700">
                                                        {item.status !== 'completed' && (
                                                            <button 
                                                                onClick={() => handleComplete(item.id)}
                                                                className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-amber-600 transition-colors"
                                                            >
                                                                반영
                                                            </button>
                                                        )}
                                                        
                                                        {/* Delete Confirmation UI */}
                                                        {deleteConfirmId === item.id ? (
                                                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                                                <button 
                                                                    onClick={() => confirmDelete(item.id)}
                                                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors font-bold"
                                                                >
                                                                    확인
                                                                </button>
                                                                <button 
                                                                    onClick={cancelDelete}
                                                                    className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors"
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => initiateDelete(item.id)}
                                                                className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded hover:bg-red-900/50 border border-red-900/50 transition-colors flex items-center"
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                ))
                             )}
                        </div>
                    )}
                </div>

                {/* Footer (Admin Toggle) */}
                <div className="p-4 bg-slate-950 rounded-b-2xl flex justify-end items-center border-t border-slate-800">
                    {isAdmin ? (
                        <button 
                            onClick={() => setIsAdmin(false)}
                            className="text-xs text-green-500 flex items-center gap-1 hover:text-green-400"
                        >
                            <Unlock size={12} /> 관리자 모드 활성화됨
                        </button>
                    ) : showAdminInput ? (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right duration-300">
                            <input 
                                type="password" 
                                placeholder="관리자 비밀번호"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-32 focus:outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                            />
                            <button onClick={handleAdminLogin} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1.5 rounded">
                                확인
                            </button>
                            <button onClick={() => setShowAdminInput(false)} className="text-xs text-slate-500 px-1">
                                취소
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAdminInput(true)}
                            className="text-xs text-slate-600 flex items-center gap-1 hover:text-slate-400"
                        >
                            <Lock size={12} /> 관리자
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuggestionModal;