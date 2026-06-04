import React, { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertTriangle, Copy, Edit3, Lock, Plus, RotateCcw, Save, Search, Star, Swords, Trash2, X } from 'lucide-react';

type EnemyDeck = { id: string; name?: string; heroes: string[]; pets?: string[]; memo?: string };
type CounterDeck = { id: string; enemyDeckId: string; name?: string; heroes: string[]; pets?: string[]; skillOrder?: string; memo?: string; isRecommended?: boolean; priority?: number };
type EnemyFormState = { id?: string; heroesText: string; petsText: string };
type CounterFormState = { id?: string; enemyDeckId: string; heroesText: string; petsText: string; skillOrder: string; memo: string; isRecommended: boolean; priorityText: string };

const firebaseConfig = {
  apiKey: 'AIzaSyAGIbrXb7XQpzN3j7AMtjS1rkpHUhoG4ow',
  authDomain: 'k-re-7b779.firebaseapp.com',
  projectId: 'k-re-7b779',
  storageBucket: 'k-re-7b779.firebasestorage.app',
  messagingSenderId: '269938277190',
  appId: '1:269938277190:web:1a61477c541c240f7d4347',
  measurementId: 'G-NP45W9PKV4',
};

const SAMPLE_ENEMY_DECKS: EnemyDeck[] = [
  { id: 'enemy-choseon-rin-omok', heroes: ['초선', '린', '오목'], pets: ['요랑', '카람'] },
  { id: 'enemy-omok-silbe-prena', heroes: ['오목', '실베스타', '프레나'], pets: ['연지'] },
];

const SAMPLE_COUNTER_DECKS: CounterDeck[] = [
  { id: 'counter-rantaeyeo', enemyDeckId: 'enemy-choseon-rin-omok', heroes: ['여포', '란드그리드', '태오'], pets: ['유', '리첼'], skillOrder: '여포1 → 여포2 → 태오1', memo: '여포 후열/암살자/약치100/속공 1순위. 태오 약공100, 란드 속공 3순위. 린 스킬 예약 끊는 흐름이 핵심.', isRecommended: true, priority: 1 },
  { id: 'counter-milbas', enemyDeckId: 'enemy-omok-silbe-prena', heroes: ['밀리아', '바네사', '스쿨드'], pets: ['멜페로'], skillOrder: '바네사1 → 스쿨드2 → 밀리아2', memo: '전원 주술사 / 효적100 / 극속 기준.', isRecommended: true, priority: 1 },
];

const emptyEnemyForm: EnemyFormState = { heroesText: '', petsText: '' };
const emptyCounterForm: CounterFormState = { enemyDeckId: '', heroesText: '', petsText: '', skillOrder: '', memo: '', isRecommended: true, priorityText: '1' };

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const splitList = (value: string) => value.split(/[\/,.\n ]+/).map(item => item.trim()).filter(Boolean);
const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
const joinList = (items?: string[]) => (items && items.length > 0 ? items.join(' / ') : '');
const cleanArrow = (value?: string) => (value || '').replace(/[>＞]/g, '→').replace(/\s+/g, ' ').trim();
const toPriority = (value: string) => { const parsed = Number(value || '999'); return Number.isFinite(parsed) && parsed > 0 ? parsed : 999; };
const autoName = (heroes?: string[]) => (!heroes || heroes.length === 0 ? '' : heroes.map(hero => hero.trim()[0] || '').join(''));
const deckTitle = (deck: { name?: string; heroes?: string[] }) => deck.name || autoName(deck.heroes) || joinList(deck.heroes) || '-';
const skillParts = (skillOrder?: string) => cleanArrow(skillOrder).split('→').flatMap(part => part.split(',')).map(part => part.trim()).filter(Boolean);
const normalizeEnemy = (deck: any): EnemyDeck => ({ id: deck.id, name: deck.name || autoName(deck.heroes || []), heroes: deck.heroes || [], pets: deck.pets || [], memo: deck.memo || '' });
const normalizeCounter = (deck: any): CounterDeck => ({ id: deck.id, enemyDeckId: deck.enemyDeckId || '', name: deck.name || autoName(deck.heroes || []), heroes: deck.heroes || [], pets: deck.pets || [], skillOrder: deck.skillOrder || '', memo: deck.memo || '', isRecommended: deck.isRecommended !== false, priority: deck.priority ?? 999 });
const sortCounters = (items: CounterDeck[]) => [...items].sort((a, b) => { if (!!a.isRecommended !== !!b.isRecommended) return a.isRecommended ? -1 : 1; return (a.priority ?? 999) - (b.priority ?? 999); });
const enemyPayload = (form: EnemyFormState): Omit<EnemyDeck, 'id'> => { const heroes = splitList(form.heroesText); return { name: autoName(heroes), heroes, pets: splitList(form.petsText), memo: '' }; };
const counterPayload = (form: CounterFormState): Omit<CounterDeck, 'id'> => { const heroes = splitList(form.heroesText); return { enemyDeckId: form.enemyDeckId, name: autoName(heroes), heroes, pets: splitList(form.petsText), skillOrder: cleanArrow(form.skillOrder), memo: form.memo.trim(), isRecommended: form.isRecommended, priority: toPriority(form.priorityText) }; };

const GuildWar: React.FC = () => {
  const [enemyDecks, setEnemyDecks] = useState<EnemyDeck[]>(SAMPLE_ENEMY_DECKS);
  const [counterDecks, setCounterDecks] = useState<CounterDeck[]>(SAMPLE_COUNTER_DECKS);
  const [queryText, setQueryText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [enemyForm, setEnemyForm] = useState<EnemyFormState>(emptyEnemyForm);
  const [counterForm, setCounterForm] = useState<CounterFormState>(emptyCounterForm);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbMode, setDbMode] = useState<'firebase' | 'local'>('firebase');

  const loadData = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const enemySnapshot = await getDocs(query(collection(db, 'guild_enemy_decks'), orderBy('createdAt', 'desc')));
      const counterSnapshot = await getDocs(query(collection(db, 'guild_counter_decks'), orderBy('createdAt', 'desc')));
      const loadedEnemies = enemySnapshot.docs.map(item => normalizeEnemy({ id: item.id, ...item.data() }));
      const loadedCounters = counterSnapshot.docs.map(item => normalizeCounter({ id: item.id, ...item.data() }));
      if (loadedEnemies.length > 0) setEnemyDecks(loadedEnemies);
      if (loadedCounters.length > 0) setCounterDecks(loadedCounters);
      setDbMode('firebase');
    } catch (error) {
      console.error(error);
      setDbMode('local');
      const localEnemies = localStorage.getItem('guild_enemy_decks');
      const localCounters = localStorage.getItem('guild_counter_decks');
      if (localEnemies) setEnemyDecks(JSON.parse(localEnemies).map(normalizeEnemy));
      if (localCounters) setCounterDecks(JSON.parse(localCounters).map(normalizeCounter));
      setMessage('Firebase 연결 실패로 현재 브라우저 임시 저장 모드로 동작 중입니다.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (dbMode === 'local') { localStorage.setItem('guild_enemy_decks', JSON.stringify(enemyDecks)); localStorage.setItem('guild_counter_decks', JSON.stringify(counterDecks)); } }, [enemyDecks, counterDecks, dbMode]);

  const filteredEnemyDecks = useMemo(() => {
    const tokens = splitList(queryText).map(normalize);
    if (tokens.length === 0) return enemyDecks;
    return enemyDecks.filter(deck => {
      const heroKeys = deck.heroes.map(hero => normalize(hero));
      return tokens.every(token => heroKeys.some(hero => hero.includes(token)));
    });
  }, [enemyDecks, queryText]);

  const openAdmin = () => {
    if (adminPassword === '0070') { setIsAdmin(true); setIsLoginOpen(false); setAdminPassword(''); setMessage('관리자 모드가 열렸습니다.'); }
    else setMessage('관리자 비밀번호가 올바르지 않습니다.');
  };

  const openNewEditor = () => { setEnemyForm(emptyEnemyForm); setCounterForm(emptyCounterForm); setIsEditorOpen(true); };
  const closeEditor = () => { setIsEditorOpen(false); setEnemyForm(emptyEnemyForm); setCounterForm(emptyCounterForm); };

  const saveEnemyDeck = async () => {
    const payload = enemyPayload(enemyForm);
    if (payload.heroes.length === 0) return setMessage('상대 영웅을 입력해주세요. 예: 초선 린 오목');
    try {
      if (enemyForm.id) { if (dbMode === 'firebase') await updateDoc(doc(db, 'guild_enemy_decks', enemyForm.id), payload as any); setEnemyDecks(prev => prev.map(item => item.id === enemyForm.id ? { ...payload, id: enemyForm.id! } : item)); setMessage('상대덱이 수정되었습니다.'); }
      else { if (dbMode === 'firebase') { const ref = await addDoc(collection(db, 'guild_enemy_decks'), { ...payload, createdAt: serverTimestamp() }); setEnemyDecks(prev => [{ ...payload, id: ref.id }, ...prev]); } else setEnemyDecks(prev => [{ ...payload, id: `enemy-${Date.now()}` }, ...prev]); setMessage('상대덱이 등록되었습니다.'); }
      setEnemyForm(emptyEnemyForm);
    } catch (error) { console.error(error); setMessage('상대덱 저장 중 오류가 발생했습니다.'); }
  };

  const saveCounterDeck = async () => {
    const payload = counterPayload(counterForm);
    if (!payload.enemyDeckId) return setMessage('연결할 상대덱을 선택해주세요.');
    if (payload.heroes.length === 0) return setMessage('카운터 영웅을 입력해주세요. 예: 여포 란드 태오');
    try {
      if (counterForm.id) { if (dbMode === 'firebase') await updateDoc(doc(db, 'guild_counter_decks', counterForm.id), payload as any); setCounterDecks(prev => prev.map(item => item.id === counterForm.id ? { ...payload, id: counterForm.id! } : item)); setMessage('카운터덱이 수정되었습니다.'); }
      else { if (dbMode === 'firebase') { const ref = await addDoc(collection(db, 'guild_counter_decks'), { ...payload, createdAt: serverTimestamp() }); setCounterDecks(prev => [{ ...payload, id: ref.id }, ...prev]); } else setCounterDecks(prev => [{ ...payload, id: `counter-${Date.now()}` }, ...prev]); setMessage('카운터덱이 등록되었습니다.'); }
      setCounterForm(emptyCounterForm);
    } catch (error) { console.error(error); setMessage('카운터덱 저장 중 오류가 발생했습니다.'); }
  };

  const editEnemy = (deck: EnemyDeck) => { setEnemyForm({ id: deck.id, heroesText: deck.heroes.join(' '), petsText: joinList(deck.pets).replace(/ \/ /g, ' ') }); setIsEditorOpen(true); };
  const editCounter = (deck: CounterDeck) => { setCounterForm({ id: deck.id, enemyDeckId: deck.enemyDeckId, heroesText: deck.heroes.join(' '), petsText: joinList(deck.pets).replace(/ \/ /g, ' '), skillOrder: deck.skillOrder || '', memo: deck.memo || '', isRecommended: !!deck.isRecommended, priorityText: String(deck.priority ?? 1) }); setIsEditorOpen(true); };

  const deleteEnemyDeck = async (id: string) => {
    if (!confirm('상대덱을 삭제하시겠습니까? 연결된 카운터덱도 함께 삭제됩니다.')) return;
    try { if (dbMode === 'firebase') await deleteDoc(doc(db, 'guild_enemy_decks', id)); const linked = counterDecks.filter(item => item.enemyDeckId === id); if (dbMode === 'firebase') await Promise.all(linked.map(item => deleteDoc(doc(db, 'guild_counter_decks', item.id)))); setEnemyDecks(prev => prev.filter(item => item.id !== id)); setCounterDecks(prev => prev.filter(item => item.enemyDeckId !== id)); setMessage('상대덱이 삭제되었습니다.'); } catch (error) { console.error(error); setMessage('삭제 중 오류가 발생했습니다.'); }
  };
  const deleteCounterDeck = async (id: string) => { if (!confirm('카운터덱을 삭제하시겠습니까?')) return; try { if (dbMode === 'firebase') await deleteDoc(doc(db, 'guild_counter_decks', id)); setCounterDecks(prev => prev.filter(item => item.id !== id)); setMessage('카운터덱이 삭제되었습니다.'); } catch (error) { console.error(error); setMessage('삭제 중 오류가 발생했습니다.'); } };

  const copyDeckText = async (enemy: EnemyDeck, counters: CounterDeck[]) => {
    const text = [`[상대덱] ${joinList(enemy.heroes)}`, `펫: ${joinList(enemy.pets) || '-'}`, '', ...sortCounters(counters).flatMap((c, i) => [`[카운터 ${i + 1}] ${c.isRecommended ? '★ 추천 ' : ''}${deckTitle(c)}`, `영웅: ${joinList(c.heroes)}`, `펫: ${joinList(c.pets) || '-'}`, `스킬: ${c.skillOrder || '-'}`, `메모: ${c.memo || '-'}`, ''])].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text); setMessage('카톡 공유용 텍스트가 복사되었습니다.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/15 p-3 rounded-2xl border border-amber-500/20"><Swords className="text-amber-400" size={26} /></div>
              <div><p className="text-amber-400 text-[11px] font-black tracking-[0.25em] uppercase">7K Guild War</p><h1 className="text-2xl sm:text-3xl font-black text-white">상대덱 검색</h1></div>
            </div>
            <div className="flex gap-2 shrink-0">
              {isAdmin && <button onClick={openNewEditor} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Plus size={15} />등록</button>}
              {isAdmin ? <button onClick={() => setIsAdmin(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-sm">관리 종료</button> : <button onClick={() => setIsLoginOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Lock size={14} />관리자</button>}
            </div>
          </div>
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={22} /><input value={queryText} onChange={e => setQueryText(e.target.value)} autoFocus placeholder="예: 린 / 린 오 / 초선 린 오목" className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-2xl" /></div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500"><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">결과 {filteredEnemyDecks.length}</span><span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">DB {dbMode === 'firebase' ? 'Firebase' : 'Local'}</span>{isLoading && <span className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1">불러오는 중</span>}</div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {message && <Notice text={message} />}
        {filteredEnemyDecks.length === 0 ? <EmptyState /> : filteredEnemyDecks.map(enemy => { const counters = sortCounters(counterDecks.filter(c => c.enemyDeckId === enemy.id)); return <EnemyCard key={enemy.id} enemy={enemy} counters={counters} isAdmin={isAdmin} onCopy={() => copyDeckText(enemy, counters)} onEditEnemy={() => editEnemy(enemy)} onDeleteEnemy={() => deleteEnemyDeck(enemy.id)} onEditCounter={editCounter} onDeleteCounter={deleteCounterDeck} />; })}
      </main>

      {isLoginOpen && <LoginModal password={adminPassword} setPassword={setAdminPassword} onClose={() => setIsLoginOpen(false)} onSubmit={openAdmin} />}
      {isEditorOpen && <EditorModal enemyForm={enemyForm} setEnemyForm={setEnemyForm} counterForm={counterForm} setCounterForm={setCounterForm} enemyDecks={enemyDecks} onClose={closeEditor} onSaveEnemy={saveEnemyDeck} onSaveCounter={saveCounterDeck} onResetEnemy={() => setEnemyForm(emptyEnemyForm)} onResetCounter={() => setCounterForm(emptyCounterForm)} />}
    </div>
  );
};

const EnemyCard: React.FC<{ enemy: EnemyDeck; counters: CounterDeck[]; isAdmin: boolean; onCopy: () => void; onEditEnemy: () => void; onDeleteEnemy: () => void; onEditCounter: (deck: CounterDeck) => void; onDeleteCounter: (id: string) => void }> = ({ enemy, counters, isAdmin, onCopy, onEditEnemy, onDeleteEnemy, onEditCounter, onDeleteCounter }) => (
  <article className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
    <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3">
      <div><div className="text-[11px] text-slate-500 font-bold mb-2">상대덱</div><div className="flex flex-wrap gap-2 mb-3">{enemy.heroes.map(h => <HeroChip key={h} text={h} tone="enemy" />)}</div>{enemy.pets && enemy.pets.length > 0 && <p className="text-sm text-slate-400">펫: <span className="text-slate-200 font-bold">{joinList(enemy.pets)}</span></p>}</div>
      <div className="flex gap-2 shrink-0"><button onClick={onCopy} className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold border border-slate-700 flex items-center gap-1"><Copy size={13} />복사</button></div>
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between"><h3 className="font-black text-white">카운터 {counters.length}개</h3>{isAdmin && <div className="flex gap-2"><SmallButton onClick={onEditEnemy}><Edit3 size={12} />상대 수정</SmallButton><DangerButton onClick={onDeleteEnemy}><Trash2 size={12} />삭제</DangerButton></div>}</div>
      {counters.length === 0 ? <div className="text-sm text-slate-500 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">등록된 카운터가 없습니다.</div> : counters.map((counter, index) => <CounterCard key={counter.id} counter={counter} index={index} isAdmin={isAdmin} onEdit={() => onEditCounter(counter)} onDelete={() => onDeleteCounter(counter.id)} />)}
    </div>
  </article>
);

const CounterCard: React.FC<{ counter: CounterDeck; index: number; isAdmin: boolean; onEdit: () => void; onDelete: () => void }> = ({ counter, index, isAdmin, onEdit, onDelete }) => (
  <div className={`${counter.isRecommended ? 'bg-amber-950/20 border-amber-600/50' : 'bg-slate-950/60 border-slate-800'} border rounded-2xl p-4`}>
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div>
        <div className="flex items-center gap-2 mb-3">{counter.isRecommended ? <span className="bg-amber-400 text-slate-950 text-[11px] font-black rounded-full px-2 py-1 flex items-center gap-1"><Star size={11} fill="currentColor" />추천 {index + 1}</span> : <span className="bg-slate-800 text-slate-400 text-[11px] font-bold rounded-full px-2 py-1">카운터 {index + 1}</span>}<span className="text-lg font-black text-white">{deckTitle(counter)}</span></div>
        <div className="flex flex-wrap gap-2">{counter.heroes.map(h => <HeroChip key={h} text={h} />)}</div>
        {counter.pets && counter.pets.length > 0 && <p className="text-sm text-slate-400 mt-3">펫: <span className="text-slate-200 font-bold">{joinList(counter.pets)}</span></p>}
      </div>
      <div className="space-y-3">
        {counter.skillOrder && <div><div className="text-xs text-blue-400 font-bold mb-2">스킬 순서</div><div className="flex flex-wrap gap-y-2 items-center text-sm">{skillParts(counter.skillOrder).map((s, i) => <span key={`${s}-${i}`} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-bold mr-1 mb-1">{s}</span>)}</div></div>}
        {counter.memo && <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3"><div className="text-xs text-slate-500 font-bold mb-1">메모</div><div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{counter.memo}</div></div>}
      </div>
    </div>
    {isAdmin && <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800"><SmallButton onClick={onEdit}><Edit3 size={12} />수정</SmallButton><DangerButton onClick={onDelete}><Trash2 size={12} />삭제</DangerButton></div>}
  </div>
);

const LoginModal: React.FC<{ password: string; setPassword: (value: string) => void; onClose: () => void; onSubmit: () => void }> = ({ password, setPassword, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl"><div className="flex items-center justify-between mb-4"><h2 className="text-white font-black text-lg">관리자 로그인</h2><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button></div><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }} placeholder="비밀번호 입력" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400 mb-3" /><button onClick={onSubmit} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl py-3">입장</button></div></div>
);

const EditorModal: React.FC<{ enemyForm: EnemyFormState; setEnemyForm: React.Dispatch<React.SetStateAction<EnemyFormState>>; counterForm: CounterFormState; setCounterForm: React.Dispatch<React.SetStateAction<CounterFormState>>; enemyDecks: EnemyDeck[]; onClose: () => void; onSaveEnemy: () => void; onSaveCounter: () => void; onResetEnemy: () => void; onResetCounter: () => void }> = ({ enemyForm, setEnemyForm, counterForm, setCounterForm, enemyDecks, onClose, onSaveEnemy, onSaveCounter, onResetEnemy, onResetCounter }) => {
  const setEnemyValue = (key: keyof EnemyFormState, value: string) => setEnemyForm(prev => ({ ...prev, [key]: value }));
  const setCounterValue = (key: keyof CounterFormState, value: string | boolean) => setCounterForm(prev => ({ ...prev, [key]: value }));
  return <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4"><div className="max-w-4xl mx-auto my-6 bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-6"><div className="flex items-center justify-between"><div><h2 className="font-black text-white text-xl">덱 등록 / 수정</h2><p className="text-sm text-slate-500">필요한 정보만 간단히 입력합니다.</p></div><button onClick={onClose} className="text-slate-500 hover:text-white"><X size={22} /></button></div><FormBox title="상대덱" onSave={onSaveEnemy} onReset={onResetEnemy} isEditing={!!enemyForm.id}><TextField label="상대 영웅" value={enemyForm.heroesText} onChange={v => setEnemyValue('heroesText', v)} placeholder="예: 초선 린 오목" /><TextField label="상대 펫" value={enemyForm.petsText} onChange={v => setEnemyValue('petsText', v)} placeholder="예: 요랑 카람" /></FormBox><FormBox title="카운터덱" onSave={onSaveCounter} onReset={onResetCounter} isEditing={!!counterForm.id}><label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">연결할 상대덱</span><select value={counterForm.enemyDeckId} onChange={e => setCounterValue('enemyDeckId', e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400"><option value="">상대덱 선택</option>{enemyDecks.map(d => <option key={d.id} value={d.id}>{joinList(d.heroes)}</option>)}</select></label><TextField label="카운터 영웅" value={counterForm.heroesText} onChange={v => setCounterValue('heroesText', v)} placeholder="예: 여포 란드 태오" /><TextField label="카운터 펫" value={counterForm.petsText} onChange={v => setCounterValue('petsText', v)} placeholder="예: 유 리첼" /><TextField label="스킬 순서" value={counterForm.skillOrder} onChange={v => setCounterValue('skillOrder', v)} placeholder="예: 여포1 여포2 태오1" /><TextField label="표시 순서" value={counterForm.priorityText} onChange={v => setCounterValue('priorityText', v)} placeholder="예: 1" /><label className="sm:col-span-2 flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200"><input type="checkbox" checked={counterForm.isRecommended} onChange={e => setCounterValue('isRecommended', e.target.checked)} className="w-5 h-5 accent-amber-500" /><span className="font-bold">추천 카운터로 표시</span></label><label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">메모</span><textarea value={counterForm.memo} onChange={e => setCounterValue('memo', e.target.value)} placeholder="장비, 속공순서, 주의 변수 등을 입력" className="w-full min-h-28 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-amber-400 resize-y" /></label></FormBox></div></div>;
};

const FormBox: React.FC<{ title: string; children: React.ReactNode; onSave: () => void; onReset: () => void; isEditing: boolean }> = ({ title, children, onSave, onReset, isEditing }) => <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="font-black text-white">{title}</h3>{isEditing && <span className="text-xs bg-blue-950/50 border border-blue-900 text-blue-200 rounded-full px-3 py-1">수정 중</span>}</div><div className="grid sm:grid-cols-2 gap-3">{children}</div><div className="flex gap-2 justify-end"><button onClick={onReset} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300 flex items-center gap-1"><RotateCcw size={14} />초기화</button><button onClick={onSave} className="bg-amber-500 hover:bg-amber-600 rounded-xl px-4 py-2 text-sm text-slate-950 font-black flex items-center gap-1"><Save size={14} />저장</button></div></div>;
const TextField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => <label className="space-y-1"><span className="text-xs text-slate-500 font-bold">{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400" /></label>;
const Notice: React.FC<{ text: string }> = ({ text }) => <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/50 text-amber-200 rounded-2xl p-3 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{text}</span></div>;
const EmptyState: React.FC = () => <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">검색 결과가 없습니다. 관리자에서 상대덱을 추가해주세요.</div>;
const HeroChip: React.FC<{ text: string; tone?: 'enemy' | 'counter' }> = ({ text, tone = 'counter' }) => <span className={`${tone === 'enemy' ? 'bg-red-950/50 border-red-900/60 text-red-100' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'} border rounded-xl px-3 py-1.5 font-black text-sm`}>{text}</span>;
const SmallButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => <button onClick={onClick} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1">{children}</button>;
const DangerButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => <button onClick={onClick} className="text-xs bg-red-950/40 hover:bg-red-900/50 border border-red-900 rounded-lg px-2 py-1 text-red-200 flex items-center gap-1">{children}</button>;

export default GuildWar;
