import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Lock, Plus, Save, Search, Star, Swords, Trash2, X } from 'lucide-react';

type EnemyDeck = { id: string; name?: string; heroes: string[]; pets?: string[]; memo?: string };
type CounterDeck = { id: string; enemyDeckId: string; name?: string; heroes: string[]; pets?: string[]; skillOrder?: string; memo?: string; isRecommended?: boolean; priority?: number };

const sampleEnemies: EnemyDeck[] = [
  { id: 'sample-1', heroes: ['초선', '린', '오목'], pets: ['요랑', '카람'] },
  { id: 'sample-2', heroes: ['오목', '실베스타', '프레나'], pets: ['연지'] },
];

const sampleCounters: CounterDeck[] = [
  { id: 'sample-c1', enemyDeckId: 'sample-1', heroes: ['여포', '란드그리드', '태오'], pets: ['유', '리첼'], skillOrder: '여포1 → 여포2 → 태오1', memo: '여포 후열/암살자/약치100/속공 1순위. 태오 약공100, 란드 속공 3순위. 린 스킬 예약 끊는 흐름이 핵심.', isRecommended: true, priority: 1 },
  { id: 'sample-c2', enemyDeckId: 'sample-2', heroes: ['밀리아', '바네사', '스쿨드'], pets: ['멜페로'], skillOrder: '바네사1 → 스쿨드2 → 밀리아2', memo: '전원 주술사 / 효적100 / 극속 기준.', isRecommended: true, priority: 1 },
];

const splitList = (v: string) => v.split(/[\s,/.\n]+/).map(x => x.trim()).filter(Boolean);
const clean = (v: string) => v.replace(/\s+/g, '').toLowerCase();
const join = (v?: string[]) => v && v.length ? v.join(' / ') : '-';
const title = (v?: string[]) => v && v.length ? v.map(x => x[0] || '').join('') : '-';
const skillParts = (v?: string) => (v || '').replace(/[>＞]/g, '→').split('→').map(x => x.trim()).filter(Boolean);

const postApi = async (password: string, body: Record<string, unknown>) => {
  const res = await fetch('/api/guild-war', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-password': password },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(data?.message || '요청 실패');
  return data;
};

export default function GuildWar() {
  const [enemies, setEnemies] = useState<EnemyDeck[]>(sampleEnemies);
  const [counters, setCounters] = useState<CounterDeck[]>(sampleCounters);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [enemyId, setEnemyId] = useState('');
  const [enemyHeroes, setEnemyHeroes] = useState('');
  const [enemyPets, setEnemyPets] = useState('');
  const [counterId, setCounterId] = useState('');
  const [counterEnemyId, setCounterEnemyId] = useState('');
  const [counterHeroes, setCounterHeroes] = useState('');
  const [counterPets, setCounterPets] = useState('');
  const [skillOrder, setSkillOrder] = useState('');
  const [memo, setMemo] = useState('');
  const [priority, setPriority] = useState('1');

  const applyData = (data: { enemyDecks?: EnemyDeck[]; counterDecks?: CounterDeck[] }) => {
    setEnemies(data.enemyDecks && data.enemyDecks.length ? data.enemyDecks : sampleEnemies);
    setCounters(data.counterDecks && data.counterDecks.length ? data.counterDecks : sampleCounters);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guild-war');
      applyData(await res.json());
      setMessage('');
    } catch (e) {
      console.error(e);
      setMessage('D1 데이터를 불러오지 못했습니다. 샘플 데이터로 표시 중입니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    const tokens = splitList(query).map(clean);
    if (!tokens.length) return enemies;
    return enemies.filter(enemy => tokens.every(token => enemy.heroes.some(hero => clean(hero).includes(token))));
  }, [query, enemies]);

  const login = async () => {
    try {
      const data = await postApi(password, { action: 'login' });
      if (!data.ok) return setMessage('관리자 비밀번호가 올바르지 않습니다.');
      setToken(password);
      setAdmin(true);
      setLoginOpen(false);
      setPassword('');
      setMessage('관리자 모드가 열렸습니다.');
    } catch {
      setMessage('관리자 로그인 중 오류가 발생했습니다.');
    }
  };

  const resetEditor = () => {
    setEnemyId(''); setEnemyHeroes(''); setEnemyPets('');
    setCounterId(''); setCounterEnemyId(''); setCounterHeroes(''); setCounterPets(''); setSkillOrder(''); setMemo(''); setPriority('1');
  };

  const saveEnemy = async () => {
    const heroes = splitList(enemyHeroes);
    if (!heroes.length) return setMessage('상대 영웅을 입력해주세요.');
    try {
      const data = await postApi(token, { action: enemyId ? 'updateEnemy' : 'createEnemy', id: enemyId, name: title(heroes), heroes, pets: splitList(enemyPets), memo: '' });
      applyData(data); resetEditor(); setMessage(enemyId ? '상대덱이 수정되었습니다.' : '상대덱이 등록되었습니다.');
    } catch { setMessage('상대덱 저장 중 오류가 발생했습니다.'); }
  };

  const saveCounter = async () => {
    const heroes = splitList(counterHeroes);
    if (!counterEnemyId) return setMessage('연결할 상대덱을 선택해주세요.');
    if (!heroes.length) return setMessage('카운터 영웅을 입력해주세요.');
    try {
      const data = await postApi(token, { action: counterId ? 'updateCounter' : 'createCounter', id: counterId, enemyDeckId: counterEnemyId, name: title(heroes), heroes, pets: splitList(counterPets), skillOrder, memo, isRecommended: true, priority: Number(priority || 999) });
      applyData(data); resetEditor(); setMessage(counterId ? '카운터덱이 수정되었습니다.' : '카운터덱이 등록되었습니다.');
    } catch { setMessage('카운터덱 저장 중 오류가 발생했습니다.'); }
  };

  const editEnemy = (enemy: EnemyDeck) => { setEnemyId(enemy.id); setEnemyHeroes(enemy.heroes.join(' ')); setEnemyPets((enemy.pets || []).join(' ')); setEditorOpen(true); };
  const editCounter = (counter: CounterDeck) => { setCounterId(counter.id); setCounterEnemyId(counter.enemyDeckId); setCounterHeroes(counter.heroes.join(' ')); setCounterPets((counter.pets || []).join(' ')); setSkillOrder(counter.skillOrder || ''); setMemo(counter.memo || ''); setPriority(String(counter.priority || 1)); setEditorOpen(true); };

  const deleteEnemy = async (id: string) => {
    if (!confirm('상대덱을 삭제하시겠습니까? 연결된 카운터덱도 함께 삭제됩니다.')) return;
    try { applyData(await postApi(token, { action: 'deleteEnemy', id })); setMessage('상대덱이 삭제되었습니다.'); } catch { setMessage('삭제 중 오류가 발생했습니다.'); }
  };

  const deleteCounter = async (id: string) => {
    if (!confirm('카운터덱을 삭제하시겠습니까?')) return;
    try { applyData(await postApi(token, { action: 'deleteCounter', id })); setMessage('카운터덱이 삭제되었습니다.'); } catch { setMessage('삭제 중 오류가 발생했습니다.'); }
  };

  const copy = async (enemy: EnemyDeck, list: CounterDeck[]) => {
    const text = [`[상대덱] ${join(enemy.heroes)}`, `펫: ${join(enemy.pets)}`, '', ...list.flatMap((c, i) => [`[카운터 ${i + 1}] ${join(c.heroes)}`, `펫: ${join(c.pets)}`, `스킬: ${c.skillOrder || '-'}`, `메모: ${c.memo || '-'}`, ''])].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text); setMessage('카톡 공유용 텍스트가 복사되었습니다.');
  };

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3"><div className="bg-amber-500/15 p-3 rounded-2xl border border-amber-500/20"><Swords className="text-amber-400" size={26}/></div><div><p className="text-amber-400 text-[11px] font-black tracking-[0.25em] uppercase">7K Guild War</p><h1 className="text-2xl sm:text-3xl font-black text-white">상대덱 검색</h1></div></div>
          <div className="flex gap-2 shrink-0">{admin && <button onClick={() => { resetEditor(); setEditorOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Plus size={15}/>등록</button>}{admin ? <button onClick={() => setAdmin(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-sm">관리 종료</button> : <button onClick={() => setLoginOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Lock size={14}/>관리자</button>}</div>
        </div>
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={22}/><input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="예: 린 / 린 오 / 초선 린 오목" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-2xl"/></div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500"><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">결과 {filtered.length}</span><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">DB Cloudflare D1</span>{loading && <span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">불러오는 중</span>}</div>
      </div>
    </section>

    <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
      {message && <div className="bg-amber-950/30 border border-amber-900/50 text-amber-200 rounded-2xl p-3 text-sm">{message}</div>}
      {filtered.length === 0 && <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">검색 결과가 없습니다.</div>}
      {filtered.map(enemy => { const list = counters.filter(c => c.enemyDeckId === enemy.id).sort((a,b) => (a.priority || 999) - (b.priority || 999)); return <article key={enemy.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3"><div><div className="text-[11px] text-slate-500 font-bold mb-2">상대덱</div><div className="flex flex-wrap gap-2 mb-3">{enemy.heroes.map(h => <Chip key={h} text={h} enemy/>)}</div><p className="text-sm text-slate-400">펫: <span className="text-slate-200 font-bold">{join(enemy.pets)}</span></p></div><button onClick={() => copy(enemy, list)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold border border-slate-700 flex items-center gap-1"><Copy size={13}/>복사</button></div>
        <div className="p-5 space-y-3"><div className="flex items-center justify-between"><h3 className="font-black text-white">카운터 {list.length}개</h3>{admin && <div className="flex gap-2"><Small onClick={() => editEnemy(enemy)}>상대 수정</Small><Danger onClick={() => deleteEnemy(enemy.id)}>삭제</Danger></div>}</div>{list.length === 0 && <div className="text-sm text-slate-500 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">등록된 카운터가 없습니다.</div>}{list.map((counter, index) => <div key={counter.id} className="bg-amber-950/20 border border-amber-600/50 rounded-2xl p-4 space-y-4"><div className="flex items-center gap-2"><span className="bg-amber-400 text-slate-950 text-[11px] font-black rounded-full px-2 py-1 flex items-center gap-1"><Star size={11} fill="currentColor"/>추천 {index + 1}</span><span className="text-lg font-black text-white">{title(counter.heroes)}</span></div><div><div className="text-xs text-slate-500 font-bold mb-2">영웅</div><div className="flex flex-wrap gap-2">{counter.heroes.map(h => <Chip key={h} text={h}/>)}</div></div><div><div className="text-xs text-slate-500 font-bold mb-2">펫</div><p className="text-sm text-slate-200 font-bold">{join(counter.pets)}</p></div>{counter.skillOrder && <div><div className="text-xs text-blue-400 font-bold mb-2">스킬 순서</div><div className="flex flex-wrap gap-2 items-center text-sm">{skillParts(counter.skillOrder).map((s, i, arr) => <React.Fragment key={`${s}-${i}`}><span className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-bold">{s}</span>{i < arr.length - 1 && <span className="text-slate-500 font-black">→</span>}</React.Fragment>)}</div></div>}{counter.memo && <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3"><div className="text-xs text-slate-500 font-bold mb-1">메모</div><div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{counter.memo}</div></div>}{admin && <div className="flex gap-2 pt-4 border-t border-slate-800"><Small onClick={() => editCounter(counter)}>수정</Small><Danger onClick={() => deleteCounter(counter.id)}>삭제</Danger></div>}</div>)}</div>
      </article>; })}
    </main>

    {loginOpen && <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl"><div className="flex items-center justify-between mb-4"><h2 className="text-white font-black text-lg">관리자 로그인</h2><button onClick={() => setLoginOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button></div><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') login(); }} placeholder="비밀번호 입력" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400 mb-3"/><button onClick={login} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl py-3">입장</button></div></div>}

    {editorOpen && <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4"><div className="max-w-4xl mx-auto my-6 bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-6"><div className="flex items-center justify-between"><div><h2 className="font-black text-white text-xl">덱 등록 / 수정</h2><p className="text-sm text-slate-500">필요한 정보만 간단히 입력합니다.</p></div><button onClick={() => setEditorOpen(false)} className="text-slate-500 hover:text-white"><X size={22}/></button></div><Box title="상대덱"><Field label="상대 영웅" value={enemyHeroes} onChange={setEnemyHeroes} placeholder="예: 초선 린 오목"/><Field label="상대 펫" value={enemyPets} onChange={setEnemyPets} placeholder="예: 요랑 카람"/><button onClick={saveEnemy} className="bg-amber-500 hover:bg-amber-600 rounded-xl px-4 py-2 text-sm text-slate-950 font-black flex items-center gap-1"><Save size={14}/>상대 저장</button></Box><Box title="카운터덱"><label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">연결할 상대덱</span><select value={counterEnemyId} onChange={e => setCounterEnemyId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400"><option value="">상대덱 선택</option>{enemies.map(d => <option key={d.id} value={d.id}>{join(d.heroes)}</option>)}</select></label><Field label="카운터 영웅" value={counterHeroes} onChange={setCounterHeroes} placeholder="예: 여포 란드 태오"/><Field label="카운터 펫" value={counterPets} onChange={setCounterPets} placeholder="예: 유 리첼"/><Field label="스킬 순서" value={skillOrder} onChange={setSkillOrder} placeholder="예: 여포1 여포2 태오1"/><Field label="표시 순서" value={priority} onChange={setPriority} placeholder="예: 1"/><label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">메모</span><textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="장비, 속공순서, 주의 변수 등을 입력" className="w-full min-h-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400 resize-y"/></label><button onClick={saveCounter} className="bg-amber-500 hover:bg-amber-600 rounded-xl px-4 py-2 text-sm text-slate-950 font-black flex items-center gap-1"><Save size={14}/>카운터 저장</button></Box></div></div>}
  </div>;
}

const Chip = ({ text, enemy = false }: { text: string; enemy?: boolean }) => <span className={`${enemy ? 'bg-red-950/50 border-red-900/60 text-red-100' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'} border rounded-xl px-3 py-1.5 font-black text-sm`}>{text}</span>;
const Small = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => <button onClick={onClick} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1">{children}</button>;
const Danger = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => <button onClick={onClick} className="text-xs bg-red-950/40 hover:bg-red-900/50 border border-red-900 rounded-lg px-2 py-1 text-red-200 flex items-center gap-1"><Trash2 size={12}/>{children}</button>;
const Box = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="font-black text-white">{title}</h3></div><div className="grid sm:grid-cols-2 gap-3">{children}</div></div>;
const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => <label className="space-y-1"><span className="text-xs text-slate-500 font-bold">{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"/></label>;
