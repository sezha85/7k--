import React, { createContext, useContext, useState, useEffect } from 'react';
import { StrategyDB, Hero } from '../types';
import { STRATEGY_DB, HERO_DB, DEFAULT_LAST_UPDATED } from '../constants';
import { dbService } from '../services/firebase';

interface GameDataContextType {
    strategyData: StrategyDB;
    heroData: Hero[];
    lastUpdated: string;
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [strategyData, setStrategyData] = useState<StrategyDB>(STRATEGY_DB);
    const [heroData, setHeroData] = useState<Hero[]>(HERO_DB);
    const [lastUpdated, setLastUpdated] = useState<string>(DEFAULT_LAST_UPDATED);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Firebase에서 데이터 시도
            const fetchedStrategy = await dbService.getGameData('strategy');
            const fetchedHeroes = await dbService.getGameData('heroes');
            const fetchedDate = await dbService.getMetadata();

            // 데이터가 있으면 덮어쓰기, 없으면 기본값(constants.ts) 유지
            if (fetchedStrategy) {
                setStrategyData(fetchedStrategy);
            } else {
                setStrategyData(STRATEGY_DB); 
            }

            if (fetchedHeroes) {
                setHeroData(fetchedHeroes);
            } else {
                setHeroData(HERO_DB);
            }

            if (fetchedDate) {
                setLastUpdated(fetchedDate);
            } else {
                setLastUpdated(DEFAULT_LAST_UPDATED);
            }

        } catch (error) {
            console.error("데이터 동기화 실패:", error);
            // 에러 시 기본값 사용
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <GameDataContext.Provider value={{ strategyData, heroData, lastUpdated, isLoading, refreshData }}>
            {children}
        </GameDataContext.Provider>
    );
};

export const useGameData = () => {
    const context = useContext(GameDataContext);
    if (context === undefined) {
        throw new Error('useGameData must be used within a GameDataProvider');
    }
    return context;
};