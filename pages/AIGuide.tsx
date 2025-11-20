import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateGuideResponse } from '../services/geminiService';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';

const AIGuide: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: '안녕하세요! 용사님. 세븐나이츠 리버스 공략 AI 가이드입니다. 영웅, 덱 조합, 티어 등 궁금한 점을 물어보세요.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const responseText = await generateGuideResponse(userMsg.text);

    const botMsg: ChatMessage = {
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-dark flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
                <Bot className="text-primary" size={24} />
            </div>
            <div>
                <h2 className="text-white font-bold text-lg">AI 전략가</h2>
                <p className="text-xs text-slate-400">Powered by Gemini 2.5</p>
            </div>
        </div>
        {!process.env.API_KEY && (
            <div className="flex items-center gap-2 text-amber-500 bg-amber-900/20 px-3 py-1 rounded text-xs border border-amber-900/50">
                <AlertCircle size={14} />
                <span>API 키 설정 필요</span>
            </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-700'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-primary" />}
              </div>

              {/* Bubble */}
              <div className={`rounded-2xl p-4 shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-gray-100 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex gap-3 items-center">
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                </div>
                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs">답변 생성 중...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 p-4 border-t border-slate-700">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="예: 루디는 어떤 장비를 껴야 하나요?"
              className="w-full bg-slate-900 text-white border border-slate-600 rounded-full pl-5 pr-12 py-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-amber-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-2">
            AI는 부정확한 정보를 제공할 수 있습니다. 중요한 정보는 게임 내에서 다시 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIGuide;
