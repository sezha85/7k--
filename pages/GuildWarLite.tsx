import React from 'react';

const enemy = ['오공', '겔리두스', '미스트'];
const enemyPets = ['유', '멜페로'];
const counter = ['밀리아', '레긴레이프', '오목'];
const pets = ['연지'];
const skills = ['오공1', '레긴레이프2', '오목2'];
const memo = `극내실\n오목 속공 3순위\n레긴 추적 효저 100 가까이\n오목 추적 치확 약공 최대`;

const chip = 'border rounded-xl px-3 py-1.5 font-black text-sm';

export default function GuildWarLite() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-amber-400 text-[10px] font-black tracking-[0.25em]">7K GUILD WAR</p>
              <h1 className="text-2xl font-black">상대덱 검색</h1>
            </div>
            <button className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm">관리자</button>
          </div>
          <input placeholder="예: 린 / 린 오 / 초선 린 오목" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 px-4 text-lg outline-none focus:border-amber-400" />
          <div className="flex gap-2 mt-3 text-xs text-slate-500"><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">결과 1</span><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">Local</span></div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="text-xs text-slate-500 font-bold mb-2">상대덱</div>
            <div className="flex flex-wrap gap-2 mb-3">{enemy.map(x => <span key={x} className={`${chip} bg-red-950/50 border-red-900/60 text-red-100`}>{x}</span>)}</div>
            <div className="text-xs text-slate-500 font-bold mb-2">상대 펫</div>
            <div className="flex flex-wrap gap-2">{enemyPets.map(x => <span key={x} className={`${chip} bg-emerald-950/40 border-emerald-700/50 text-emerald-100`}>{x}</span>)}</div>
          </div>
          <div className="p-4 space-y-3">
            <h3 className="font-black">카운터 1개</h3>
            <div className="bg-amber-950/20 border border-amber-600/50 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2"><span className="bg-amber-400 text-slate-950 text-[11px] font-black rounded-full px-2 py-1">추천 1</span><b className="text-lg">밀레오</b></div>
              <Block label="영웅"><div className="flex flex-wrap gap-2">{counter.map(x => <span key={x} className={`${chip} bg-amber-500/10 border-amber-500/30 text-amber-100`}>{x}</span>)}</div></Block>
              <Block label="펫"><div className="flex flex-wrap gap-2">{pets.map(x => <span key={x} className={`${chip} bg-emerald-950/40 border-emerald-700/50 text-emerald-100`}>{x}</span>)}</div></Block>
              <Block label="스킬 순서"><div className="flex flex-wrap gap-2 items-center">{skills.map((x,i) => <React.Fragment key={x}><span className={`${chip} bg-blue-950/40 border-blue-700/50 text-blue-100`}>{x}</span>{i < skills.length - 1 && <span className="text-slate-600">→</span>}</React.Fragment>)}</div></Block>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4"><div className="text-xs text-slate-500 font-bold mb-2">메모</div><div className="text-sm whitespace-pre-wrap leading-relaxed">{memo}</div></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs text-slate-500 font-bold mb-2">{label}</div>{children}</div>;
}
