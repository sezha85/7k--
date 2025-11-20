import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    setDoc,
    getDoc,
    Firestore
} from 'firebase/firestore';
import { Suggestion, StrategyDB, Hero } from '../types';

// 사용자가 제공한 Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyAGIbrXb7XQpzN3j7AMtjS1rkpHUhoG4ow",
  authDomain: "k-re-7b779.firebaseapp.com",
  projectId: "k-re-7b779",
  storageBucket: "k-re-7b779.firebasestorage.app",
  messagingSenderId: "269938277190",
  appId: "1:269938277190:web:1a61477c541c240f7d4347",
  measurementId: "G-NP45W9PKV4"
};

// 설정 확인 (키가 입력되었으므로 true)
const isConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isConfigured) {
    try {
        // 앱이 이미 초기화되었는지 확인 (React Fast Refresh 등으로 인한 중복 초기화 방지)
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApps()[0];
        }
        db = getFirestore(app);
        console.log("🔥 Firebase 연결 성공:", firebaseConfig.projectId);
    } catch (e) {
        console.error("Firebase 연결 오류:", e);
    }
}

// Local Storage 업데이트 이벤트를 위한 커스텀 이벤트
const LOCAL_UPDATE_EVENT = 'local-db-update';

export const dbService = {
    isConfigured: () => isConfigured && !!db,

    // 데이터 실시간 구독
    subscribe: (callback: (data: Suggestion[]) => void) => {
        if (isConfigured && db) {
            try {
                const q = query(collection(db, "suggestions"), orderBy("createdAt", "desc"));
                return onSnapshot(q, (snapshot) => {
                    const suggestions = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Suggestion[];
                    callback(suggestions);
                }, (error) => {
                    console.error("데이터 불러오기 실패 (권한 문제일 수 있음):", error);
                    callback(getLocalSuggestions());
                });
            } catch (e) {
                console.error("구독 설정 오류:", e);
                callback(getLocalSuggestions());
                return () => {};
            }
        } else {
            callback(getLocalSuggestions());
            
            const handleUpdate = () => callback(getLocalSuggestions());
            window.addEventListener(LOCAL_UPDATE_EVENT, handleUpdate);
            return () => {
                window.removeEventListener(LOCAL_UPDATE_EVENT, handleUpdate);
            };
        }
    },

    add: async (suggestion: Omit<Suggestion, 'id'>) => {
        if (isConfigured && db) {
            await addDoc(collection(db, "suggestions"), suggestion);
        } else {
            const newId = Date.now().toString();
            const newSuggestion = { ...suggestion, id: newId };
            const current = getLocalSuggestions();
            saveLocalSuggestions([newSuggestion, ...current]);
        }
    },

    updateStatus: async (id: string, status: 'completed' | 'pending', completedAt?: string) => {
        if (isConfigured && db) {
            const ref = doc(db, "suggestions", id);
            await updateDoc(ref, { status, completedAt: completedAt || null });
        } else {
            const current = getLocalSuggestions();
            const updated = current.map(s => 
                s.id === id ? { ...s, status, completedAt } : s
            );
            saveLocalSuggestions(updated);
        }
    },

    delete: async (id: string) => {
        if (isConfigured && db) {
            await deleteDoc(doc(db, "suggestions", id));
        } else {
            const current = getLocalSuggestions();
            const updated = current.filter(s => s.id !== id);
            saveLocalSuggestions(updated);
        }
    },

    // --- 게임 데이터 관리 (Admin용) ---
    
    // 게임 데이터 저장 (StrategyDB 또는 Hero[])
    saveGameData: async (type: 'strategy' | 'heroes', data: any) => {
        if (!isConfigured || !db) throw new Error("DB 미연결");
        await setDoc(doc(db, "game_data", type), { data });
        
        // 업데이트 날짜 기록
        const date = new Date();
        const dateString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        await setDoc(doc(db, "game_data", "metadata"), { lastUpdated: dateString });
    },

    // 게임 데이터 불러오기
    getGameData: async (type: 'strategy' | 'heroes') => {
        if (!isConfigured || !db) return null;
        try {
            const docRef = doc(db, "game_data", type);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().data;
            }
            return null;
        } catch (e) {
            console.error("게임 데이터 로드 실패:", e);
            return null;
        }
    },

    // 메타데이터(날짜) 불러오기
    getMetadata: async () => {
        if (!isConfigured || !db) return null;
        try {
            const docRef = doc(db, "game_data", "metadata");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().lastUpdated;
            }
            return null;
        } catch (e) {
            console.error("메타데이터 로드 실패:", e);
            return null;
        }
    }
};

// --- 로컬 저장소 도우미 함수들 ---

const getLocalSuggestions = (): Suggestion[] => {
    try {
        const saved = localStorage.getItem('sk_suggestions');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
};

const saveLocalSuggestions = (data: Suggestion[]) => {
    localStorage.setItem('sk_suggestions', JSON.stringify(data));
    window.dispatchEvent(new Event(LOCAL_UPDATE_EVENT));
};