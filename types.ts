// --- Strategy DB Types ---

export interface CastleRushEntry {
  id: string;
  day: string;
  boss: string;
  tags: string[];
  party: string[];
  speed: string;
  skills: {
    r1: string;
    r2: string;
    r3: string;
    tip: string;
  };
}

export interface AdventTeam {
  name: string;
  party: string[];
  skillFlow: string;
  tip: string;
}

export interface AdventEntry {
  title: string;
  tags: string[];
  teams: AdventTeam[];
}

export interface TotalWarEntry {
  name: string;
  party: string;
  req: string;
  skill: string;
  equipments: string[];
}

export interface GuildWarCounter {
  deck: string;
  skill: string;
}

export interface GuildWarEntry {
  enemyDeck: string;
  counters: GuildWarCounter[];
}

export interface StrategyDB {
  castleRush: CastleRushEntry[];
  advent: {
    destruction: AdventEntry[];
    yeonhee: AdventEntry[];
  };
  totalWar: TotalWarEntry[];
  guildWar: GuildWarEntry[];
}

// --- Hero Types ---

export enum Element {
    FIRE = "Fire",
    WATER = "Water",
    EARTH = "Earth",
    LIGHT = "Light",
    DARK = "Dark"
}

export enum HeroType {
    OFFENSIVE = "Offensive",
    DEFENSIVE = "Defensive",
    MAGIC = "Magic",
    SUPPORT = "Support",
    UNIVERSAL = "Universal"
}

export enum Rarity {
    NORMAL = "Normal",
    RARE = "Rare",
    EPIC = "Epic",
    LEGENDARY = "Legendary",
    MYTHIC = "Mythic"
}

export interface HeroSkill {
    name: string;
}

export interface Hero {
    id: string;
    name: string;
    title: string;
    type: HeroType | string;
    element: Element;
    rarity: Rarity | string;
    tier: string;
    imageUrl: string;
    description: string;
    passive: string;
    skills: HeroSkill[];
}

// --- Chat Types ---

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

// --- Suggestion Types ---

export interface Suggestion {
    id: string;
    category: string;
    content: string;
    createdAt: number;
    status: 'pending' | 'completed';
    completedAt?: string;
}