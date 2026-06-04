import React, { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertTriangle, ChevronRight, Edit3, RotateCcw, Save, Search, Shield, Swords, Trash2, X } from 'lucide-react';

type FormationName = '기본진형' | '밸런스진형' | '공격진형' | '보호진형';

type EnemyDeck = {
  id: string;
  name: string;
  heroes: string[];
  pets?: string[];
  formation: FormationName;
  front: string[];
  back: string[];
  memo: string;
};

type CounterDeck = {
  id: string;
  enemyDeckId: string;
  name: string;
  heroes: string[];
  pets?: string[];
  formation: FormationName;
  front: string[];
  back: string[];
  skillOrder: string;
  memo: string;
};

type FormState = {
  id?: string;
  name: string;
  heroesText: string;
  petsText: string;
  formation: FormationName;
  frontText: string;
  backText: string;
  memo: string;
  enemyDeckId?: string;
  skillOrder?: string;
};

const firebaseConfig = {
  apiKey: 'AIzaSyAGIbrXb7XQpzN3j7AMtjS1rkpHUhoG4ow',
  authDomain: 'k-re-7b779.firebaseapp.com',
  projectId: 'k-re-7b779',
  storageBucket: 'k-re-7b779.firebasestorage.app',
  messagingSenderId: '269938277190',
  appId: '1:269938277190:web:1a61477c541c240f7d4347',
  measurementId: 'G-NP45W9PKV4',
};

const FORMATIONS: Record<FormationName, { front: number; back: number; description: string }> = {
  기본진형: { front: 3, back: 2, description: '앞 3 / 뒤 2' },
  밸런스진형: { front: 2, back: 3, description: '앞 2 / 뒤 3' },
  공격진형: { front: 4, back: 1, description: '앞 4 / 뒤 1' },
  보호진형: { front: 1, back: 4, description: '앞 1 / 뒤 4' },
};

const SAMPLE_ENEMY_DECKS: EnemyDeck[] = [
  {
    id: 'enemy-choseon-rin-omok',
    name: '초선 린 오목',
    heroes: ['초선', '린', '오목'],
    pets: ['요랑', '카람'],
    formation: '기본진형',
    front: ['초선', '린', '오목'],
    back: [],
    memo: '린 2스 예약, 요랑 펫 여부 확인. 막기/불사 세팅 변수 주의.',
  },
  {
    id: 'enemy-omok-silbe-prena',
    name: '오목 실베스타 프레나',
    heroes: ['오목', '실베스타', '프레나'],
    pets: ['연지'],
    formation: '밸런스진형',
    front: ['오목', '프레나'],
    back: ['실베스타'],
    memo: '오목1 → 실베2 → 실베1 구도 주의.',
  },
];

const SAMPLE_COUNTER_DECKS: CounterDeck[] = [
  {
    id: 'counter-rantaeyeo',
    enemyDeckId: 'enemy-choseon-rin-omok',
    name: '란태여 카운터',
    heroes: ['란드그리드', '태오', '여포'],
    pets: ['유', '리첼'],
    formation: '보호진형',
    front: ['여포'],
    back: ['란드그리드', '태오'],
    skillOrder: '여포1 → 여포2 → 태오1',
    memo: '여포 후열/암살자/약치100/속공 1순위. 태오 약공100, 란드 속공 3순위. 린 스킬 예약 끊는 흐름이 핵심.',
  },
  {
    id: 'counter-milbas',
    enemyDeckId: 'enemy-omok-silbe-prena',
    name: '밀바스',
    heroes: ['밀리아', '바네사', '스쿨드'],
    pets: ['멜페로'],
    formation: '기본진형',
    front: ['밀리아', '바네사', '스쿨드'],
    back: [],
    skillOrder: '바네사1 → 스쿨드2 → 밀리아2',
    memo: '전원 주술사 / 효적100 / 극속 기준.',
  },
];

const emptyEnemyForm: FormState = {
  name: '',
  heroesText: '',
  petsText: '',
  formation: '기본진형',
  frontText: '',
  backText: '',
  memo: '',
};

const emptyCounterForm: FormState = {
  name: '',
  heroesText: '',
  petsText: '',
  formation: '기본진형',
  frontText: '',
  backText: '',
  memo: '',
  enemyDeckId: '',
  skillOrder: '',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();
const splitList = (value: string) => value.split(/[\/,.\n ]+/).map(item => item.trim()).filter(Boolean);
const joinList = (items?: string[]) => (items && items.length > 0 ? items.join(' / ') : '');

const skillParts = (skillOrder: string) =>
  skillOrder
    .split('→')
    .flatMap(part => part.split(','))
    .map(part => part.trim())
    .filter(Boolean);

const normalizeEnemy = (deck: any): EnemyDeck => ({ ...deck, pets: deck.pets || [] });
const normalizeCounter = (deck: any): CounterDeck => ({ ...deck, pets: deck.pets || [] });

const toEnemyPayload = (form: FormState): Omit<EnemyDeck, 'id'> => ({
  name: form.name.trim() || splitList(form.heroesText).join(' '),
  heroes: splitList(form.heroesText),
  pets: splitList(form.petsText),
  formation: form.formation,
  front: splitList(form.frontText),
  back: splitList(form.backText),
  memo: form.memo.trim(),
});

const toCounterPayload = (form: FormState): Omit<CounterDeck, 'id'> => ({
  enemyDeckId: form.enemyDeckId || '',
  name: form.name.trim() || splitList(form.heroesText).join(' '),
  heroes: splitList(form.heroesText),
  pets: splitList(form.petsText),
  formation: form.formation,
  front: splitList(form.frontText),
  back: splitList(form.backText),
  skillOrder: form.skillOrder?.trim() || '',
  memo: form.memo.trim(),
});

const GuildWar: React.FC = () => {
  const [enemyDecks, setEnemyDecks] = useState<EnemyDeck[]>(SAMPLE_ENEMY_DECKS);
  const [counterDecks, setCounterDecks] = useState<CounterDeck[]>(SAMPLE_COUNTER_DECKS);
  const [queryText, setQueryText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [enemyForm, setEnemyForm] = useState<FormState>(emptyEnemyForm);
  const [counterForm, setCounterForm] = useState<FormState>(emptyCounterForm);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dbMode === 'local') {
      localStorage.setItem('guild_enemy_decks', JSON.stringify(enemyDecks));
      localStorage.setItem('guild_counter_decks', JSON.stringify(counterDecks));
    }
  }, [enemyDecks, counterDecks, dbMode]);

  const searchTokens = useMemo(() => splitList(queryText).map(normalize), [queryText]);
  const filteredEnemyDecks = useMemo(() => {
    if (searchTokens.length === 0) return enemyDecks;
    return enemyDecks.filter(deck => {
      const heroKeys = deck.heroes.map(hero => normalize(hero));
      return searchTokens.every(token => heroKeys.some(hero => hero.includes(token)));
    });
  }, [enemyDecks, searchTokens]);

  const handleAdminLogin = () => {
    if (adminPassword === '0070') {
      setIsAdmin(true);
      setAdminPassword('');
      setMessage('관리자 모드가 열렸습니다.');
    } else {
      setMessage('관리자 비밀번호가 올바르지 않습니다.');
    }
  };

  const saveEnemyDeck = async () => {
    const payload = toEnemyPayload(enemyForm);
    if (payload.heroes.length === 0) return setMessage('상대 영웅을 최소 1명 이상 입력해주세요.');
    try {
      if (enemyForm.id) {
        if (dbMode === 'firebase') await updateDoc(doc(db, 'guild_enemy_decks', enemyForm.id), payload as any);
        setEnemyDecks(prev => prev.map(item => item.id === enemyForm.id ? { ...payload, id: enemyForm.id! } : item));
        setMessage('상대덱이 수정되었습니다.');
      } else {
        if (dbMode === 'firebase') {
          const ref = await addDoc(collection(db, 'guild_enemy_decks'), { ...payload, createdAt: serverTimestamp() });
          setEnemyDecks(prev => [{ ...payload, id: ref.id }, ...prev]);
        } else {
          setEnemyDecks(prev => [{ ...payload, id: `enemy-${Date.now()}` }, ...prev]);
        }
        setMessage('상대덱이 등록되었습니다.');
      }
      setEnemyForm(emptyEnemyForm);
    } catch (error) {
      console.error(error);
      setMessage('상대덱 저장 중 오류가 발생했습니다.');
    }
  };

  const saveCounterDeck = async () => {
    const payload = toCounterPayload(counterForm);
    if (!payload.enemyDeckId) return setMessage('연결할 상대덱을 선택해주세요.');
    if (payload.heroes.length === 0) return setMessage('카운터 영웅을 최소 1명 이상 입력해주세요.');
    try {
      if (counterForm.id) {
        if (dbMode === 'firebase') await updateDoc(doc(db, 'guild_counter_decks', counterForm.id), payload as any);
        setCounterDecks(prev => prev.map(item => item.id === counterForm.id ? { ...payload, id: counterForm.id! } : item));
        setMessage('카운터덱이 수정되었습니다.');
      } else {
        if (dbMode === 'firebase') {
          const ref = await addDoc(collection(db, 'guild_counter_decks'), { ...payload, createdAt: serverTimestamp() });
          setCounterDecks(prev => [{ ...payload, id: ref.id }, ...prev]);
        } else {
          setCounterDecks(prev => [{ ...payload, id: `counter-${Date.now()}` }, ...prev]);
        }
        setMessage('카운터덱이 등록되었습니다.');
      }
      setCounterForm(emptyCounterForm);
    } catch (error) {
      console.error(error);
      setMessage('카운터덱 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteEnemyDeck = async (id: string) => {
    if (!confirm('상대덱을 삭제하시겠습니까? 연결된 카운터덱도 함께 삭제됩니다.')) return;
    try {
      if (dbMode === 'firebase') await deleteDoc(doc(db, 'guild_enemy_decks', id));
      const linkedCounters = counterDecks.filter(item => item.enemyDeckId === id);
      if (dbMode === 'firebase') await Promise.all(linkedCounters.map(item => deleteDoc(doc(db, 'guild_counter_decks', item.id))));
      setEnemyDecks(prev => prev.filter(item => item.id !== id));
      setCounterDecks(prev => prev.filter(item => item.enemyDeckId !== id));
      setMessage('상대덱이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      setMessage('삭제 중 오류가 발생했습니다.');
    }
  };

  const deleteCounterDeck = async (id: string) => {
    if (!confirm('카운터덱을 삭제하시겠습니까?')) return;
    try {
      if (dbMode === 'firebase') await deleteDoc(doc(db, 'guild_counter_decks', id));
      setCounterDecks(prev => prev.filter(item => item.id !== id));
      setMessage('카운터덱이 삭제되었습니다.');
    } catch (error) {
      console.error(error);
      setMessage('삭제 중 오류가 발생했습니다.');
    }
  };

  const editEnemy = (deck: EnemyDeck) => {
    setEnemyForm({
      id: deck.id,
      name: deck.name,
      heroesText: deck.heroes.join(' '),
      petsText: joinList(deck.pets),
      formation: deck.formation,
      frontText: deck.front.join(' '),
      backText: deck.back.join(' '),
      memo: deck.memo,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const editCounter = (deck: CounterDeck) => {
    setCounterForm({
      id: deck.id,
      enemyDeckId: deck.enemyDeckId,
      name: deck.name,
      heroesText: deck.heroes.join(' '),
      petsText: joinList(deck.pets),
      formation: deck.formation,
      frontText: deck.front.join(' '),
      backText: deck.back.join(' '),
      skillOrder: deck.skillOrder,
      memo: deck.memo,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const copyDeckText = async (enemy: EnemyDeck, counters: CounterDeck[]) => {
    const text = [
      `[상대덱] ${joinList(enemy.heroes)}`,
      `펫: ${joinList(enemy.pets) || '-'}`,
      `진형: ${enemy.formation}`,
      enemy.memo ? `메모: ${enemy.memo}` : '',
      '',
      ...counters.flatMap((counter, index) => [
        `[카운터 ${index + 1}] ${counter.name}`,
        `영웅: ${joinList(counter.heroes)}`,
        `펫: ${joinList(counter.pets) || '-'}`,
        `진형: ${counter.formation}`,
        `앞열: ${joinList(counter.front) || '-'}`,
        `뒷열: ${joinList(counter.back) || '-'}`,
        `스킬: ${counter.skillOrder || '-'}`,
        `메모: ${counter.memo || '-'}`,
        '',
      ]),
    ].filter(line => line !== '').join('\n');
    await navigator.clipboard.writeText(text);
    setMessage('카톡 공유용 텍스트가 복사되었습니다.');
  };

  return (
    <div className="min-h-screen bg-dark text-slate-100">
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30"><Swords className="text-primary" size={28} /></div>
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase">Guild War Counter</p>
              <h1 className="text-2xl sm:text-4xl font-black text-white">길드전 카운터 검색</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            상대 영웅 이름을 1글자만 입력해도 관련 상대덱이 실시간으로 필터링됩니다. 예: <span className="text-white font-bold">린</span>, <span className="text-white font-bold">린 오</span>, <span className="text-white font-bold">초선 린 오목</span>
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl sticky top-16 z-30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="상대 영웅 입력 예: 린 오" className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
            <span className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1">검색 결과 {filteredEnemyDecks.length}개</span>
            <span className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1">DB: {dbMode === 'firebase' ? 'Firebase' : 'Local'}</span>
            {isLoading && <span className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1">불러오는 중...</span>}
          </div>
        </div>

        {message && <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/50 text-amber-200 rounded-xl p-3 text-sm"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{message}</span></div>}

        <section className="space-y-4">
          {filteredEnemyDecks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">검색 결과가 없습니다. 관리자에서 상대덱을 추가해주세요.</div>
          ) : filteredEnemyDecks.map(enemy => {
            const counters = counterDecks.filter(counter => counter.enemyDeckId === enemy.id);
            return (
              <article key={enemy.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">{enemy.heroes.map(hero => <span key={hero} className="bg-red-950/50 border border-red-900/60 text-red-100 rounded-xl px-3 py-1.5 font-bold text-sm">{hero}</span>)}</div>
                      <h2 className="text-xl font-black text-white">{enemy.name}</h2>
                      <p className="text-xs text-slate-500 mt-1">{enemy.formation} · {FORMATIONS[enemy.formation]?.description}</p>
                    </div>
                    <button onClick={() => copyDeckText(enemy, counters)} className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold border border-slate-700">복사</button>
                  </div>
                  <div className="grid sm:grid-cols-4 gap-3 mt-4 text-sm">
                    <InfoBox label="펫" value={joinList(enemy.pets) || '-'} />
                    <InfoBox label="앞열" value={joinList(enemy.front) || '-'} />
                    <InfoBox label="뒷열" value={joinList(enemy.back) || '-'} />
                    <InfoBox label="상대 메모" value={enemy.memo || '-'} />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-primary flex items-center gap-2"><Shield size={18} /> 카운터덱 {counters.length}개</h3>
                    {isAdmin && <div className="flex gap-2"><button onClick={() => editEnemy(enemy)} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 flex items-center gap-1"><Edit3 size={12} />상대 수정</button><button onClick={() => deleteEnemyDeck(enemy.id)} className="text-xs bg-red-950/40 hover:bg-red-900/50 border border-red-900 rounded-lg px-2 py-1 text-red-200 flex items-center gap-1"><Trash2 size={12} />삭제</button></div>}
                  </div>

                  {counters.length === 0 ? <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-500">등록된 카운터덱이 없습니다.</div> : counters.map(counter => (
                    <div key={counter.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black text-white mb-2">{counter.name}</h4>
                          <div className="flex flex-wrap gap-2">{counter.heroes.map(hero => <span key={hero} className="bg-primary/10 border border-primary/30 text-amber-100 rounded-xl px-3 py-1 text-sm font-bold">{hero}</span>)}</div>
                        </div>
                        {isAdmin && <div className="flex gap-2 shrink-0"><button onClick={() => editCounter(counter)} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2 py-1 text-slate-300"><Edit3 size={12} /></button><button onClick={() => deleteCounterDeck(counter.id)} className="text-xs bg-red-950/40 hover:bg-red-900/50 border border-red-900 rounded-lg px-2 py-1 text-red-200"><Trash2 size={12} /></button></div>}
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <InfoBox label="펫" value={joinList(counter.pets) || '-'} />
                        <InfoBox label="진형" value={`${counter.formation} · ${FORMATIONS[counter.formation]?.description}`} />
                        <InfoBox label="배치" value={`앞열: ${joinList(counter.front) || '-'} / 뒷열: ${joinList(counter.back) || '-'}`} />
                      </div>
                      {counter.skillOrder && <div><div className="text-xs text-blue-400 font-bold mb-2">스킬 순서</div><div className="flex flex-wrap gap-y-2 items-center text-sm">{skillParts(counter.skillOrder).map((skill, index, arr) => <React.Fragment key={`${skill}-${index}`}><span className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-bold">{skill}</span>{index < arr.length - 1 && <ChevronRight size={14} className="text-slate-600 mx-1" />}</React.Fragment>)}</div></div>}
                      {counter.memo && <InfoBox label="참고사항 / 메모" value={counter.memo} />}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {!isAdmin ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div><h2 className="font-black text-white">관리자 모드</h2><p className="text-sm text-slate-500">상대덱과 카운터덱을 입력, 수정, 삭제합니다.</p></div>
              <div className="flex gap-2"><input value={adminPassword} onChange={event => setAdminPassword(event.target.value)} type="password" placeholder="관리자 비밀번호" className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary" /><button onClick={handleAdminLogin} className="bg-primary hover:bg-amber-600 text-white font-bold rounded-xl px-4 py-2 text-sm">열기</button></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-3"><div><h2 className="font-black text-white text-xl">관리자 입력</h2><p className="text-sm text-slate-500">영웅명과 펫은 띄어쓰기, /, 쉼표로 구분 가능합니다.</p></div><button onClick={() => setIsAdmin(false)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 flex items-center gap-1"><X size={14} />닫기</button></div>
              <FormPanel title="상대덱 등록 / 수정" onSave={saveEnemyDeck} onReset={() => setEnemyForm(emptyEnemyForm)} isEditing={!!enemyForm.id}><DeckForm form={enemyForm} setForm={setEnemyForm} mode="enemy" enemyDecks={enemyDecks} /></FormPanel>
              <FormPanel title="카운터덱 등록 / 수정" onSave={saveCounterDeck} onReset={() => setCounterForm(emptyCounterForm)} isEditing={!!counterForm.id}><DeckForm form={counterForm} setForm={setCounterForm} mode="counter" enemyDecks={enemyDecks} /></FormPanel>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3"><div className="text-xs text-slate-500 font-bold mb-1">{label}</div><div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{value}</div></div>
);

const FormPanel: React.FC<{ title: string; children: React.ReactNode; onSave: () => void; onReset: () => void; isEditing: boolean }> = ({ title, children, onSave, onReset, isEditing }) => (
  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="font-black text-white">{title}</h3>{isEditing && <span className="text-xs bg-blue-950/50 border border-blue-900 text-blue-200 rounded-full px-3 py-1">수정 중</span>}</div>{children}<div className="flex gap-2 justify-end"><button onClick={onReset} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-300 flex items-center gap-1"><RotateCcw size={14} />초기화</button><button onClick={onSave} className="bg-primary hover:bg-amber-600 rounded-xl px-4 py-2 text-sm text-white font-bold flex items-center gap-1"><Save size={14} />저장</button></div></div>
);

const DeckForm: React.FC<{ form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; mode: 'enemy' | 'counter'; enemyDecks: EnemyDeck[] }> = ({ form, setForm, mode, enemyDecks }) => {
  const setValue = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {mode === 'counter' && <label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">연결할 상대덱</span><select value={form.enemyDeckId || ''} onChange={event => setValue('enemyDeckId', event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-primary"><option value="">상대덱 선택</option>{enemyDecks.map(deck => <option key={deck.id} value={deck.id}>{deck.name} ({joinList(deck.heroes)})</option>)}</select></label>}
      <TextField label={mode === 'enemy' ? '상대덱 이름' : '카운터덱 이름'} value={form.name} onChange={value => setValue('name', value)} placeholder={mode === 'enemy' ? '예: 초선 린 오목' : '예: 란태여 카운터'} />
      <TextField label="영웅" value={form.heroesText} onChange={value => setValue('heroesText', value)} placeholder={mode === 'enemy' ? '예: 초선 린 오목' : '예: 여포 태오 란드그리드'} />
      <TextField label="펫 옵션" value={form.petsText} onChange={value => setValue('petsText', value)} placeholder="예: 요랑 카람" />
      <label className="space-y-1"><span className="text-xs text-slate-500 font-bold">진형</span><select value={form.formation} onChange={event => setForm(prev => ({ ...prev, formation: event.target.value as FormationName }))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-primary">{Object.entries(FORMATIONS).map(([name, info]) => <option key={name} value={name}>{name} ({info.description})</option>)}</select></label>
      {mode === 'counter' && <TextField label="스킬 순서" value={form.skillOrder || ''} onChange={value => setValue('skillOrder', value)} placeholder="예: 여포1 → 여포2 → 태오1" />}
      <TextField label="앞열 배치" value={form.frontText} onChange={value => setValue('frontText', value)} placeholder="예: 여포" />
      <TextField label="뒷열 배치" value={form.backText} onChange={value => setValue('backText', value)} placeholder="예: 태오 란드그리드" />
      <label className="space-y-1 sm:col-span-2"><span className="text-xs text-slate-500 font-bold">참고사항 / 메모</span><textarea value={form.memo} onChange={event => setValue('memo', event.target.value)} placeholder="장비, 속공순서, 주의 변수 등을 입력" className="w-full min-h-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-primary resize-y" /></label>
    </div>
  );
};

const TextField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <label className="space-y-1"><span className="text-xs text-slate-500 font-bold">{label}</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary" /></label>
);

export default GuildWar;
