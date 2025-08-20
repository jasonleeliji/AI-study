// Types that are shared between frontend and backend
// In a larger project, this could be a shared package.

// 订阅计划类型
export type SubscriptionPlan = 'trial' | 'none' | 'standard' | 'pro';

// 从环境变量读取价格配置，如果未设置则使用默认值
const STANDARD_PLAN_PRICE = parseFloat(import.meta.env.VITE_STANDARD_PLAN_PRICE || '19.9');
const PRO_PLAN_PRICE = parseFloat(import.meta.env.VITE_PRO_PLAN_PRICE || '29.9');

export const PLAN_DETAILS: Record<SubscriptionPlan, { name: string; price: number; dailyTimeLimit: number }> = {
  trial: {
    name: '试用版',
    price: 0,
    dailyTimeLimit: 60, // 60分钟
  },
  none: {
    name: '无订阅',
    price: 0,
    dailyTimeLimit: 0, // 无使用时间
  },
  standard: {
    name: '师傅救我',
    price: STANDARD_PLAN_PRICE,
    dailyTimeLimit: 180, // 180分钟
  },
  pro: {
    name: '菩萨救我',
    price: PRO_PLAN_PRICE,
    dailyTimeLimit: 300, // 300分钟
  },
};

export interface ChildProfile {
  _id: string;
  user: string;
  nickname: string;
  age: number;
  grade: '幼儿园' | '小学一年级' | '小学二年级' | '小学三年级' | '小学四年级' | '小学五年级' | '小学六年级';
  gender: 'boy' | 'girl';
  minSessionDuration: number;
  stretchBreak: number;
  waterBreak: number;
  restroomBreak: number;
  forcedBreakDuration: number;
  workDurationBeforeForcedBreak: number;
  continuousStudyTime: number; // 连续学习时长（分钟）
  forcedBreakTime: number; // 强制休息时长（分钟）
  waterBreakLimit: number;
  restroomBreakLimit: number;
  gamificationStage: 'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING';
  totalSpiritualPower: number; // 累计灵力值（AI分析消耗的token总和）
  dailySpiritualPower: number; // 每日灵力值
  totalFocusSeconds: number;
  dailyFocusSeconds: number;
  lastFocusUpdate: string; // ISO String
}

export enum StudyStatus {
  Idle = 'IDLE',
  Studying = 'STUDYING',
  Paused = 'PAUSED',
  Break = 'BREAK',
  Finished = 'FINISHED',
}

export enum BreakType {
  Stretch = 'STRETCH',
  Water = 'WATER',
  Restroom = 'RESTROOM',
  Forced = 'FORCED',
}

export enum Rank {
    WUKONG = 'WUKONG',
}

export interface FocusEntry {
  timestamp: string; // ISO String
  isFocused: boolean;
  isOnSeat: boolean;
}

export interface BreakEntry {
  startTime: string; // ISO String
  endTime?: string; // ISO String
  type: BreakType;
}

export interface StudySession {
  _id: string;
  user: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  status: StudyStatus;
  activeBreakType?: BreakType;
  focusHistory: FocusEntry[];
  breakHistory: BreakEntry[];
  createdAt: string;
  currentRank: Rank;
}


export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface TokenStats {
  lastAnalysis: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    createdAt: string;
  } | null;
  currentSession: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    analysisCount: number;
    sessionId: string | null;
  };
  today: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    analysisCount: number;
  };
  total: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    analysisCount: number;
  };
}

export interface TokenHistoryItem {
  _id: string;
  user: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  sessionId?: {
    _id: string;
    createdAt: string;
    status: string;
  };
  createdAt: string;
}

export interface UserStatus {
  planName: string;
  effectiveDailyLimit: number;
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  trialEndDate?: string;
  totalTokensUsed: number;
  remainingSeconds?: number;
  remainingDays?: number;
}

export interface AnalysisResult {
  isFocused: boolean;
  isOnSeat: boolean;
  animationKey: 'idle' | 'distracted' | 'off_seat';
  message: string;
  currentRank: Rank;
}

export interface TimeSeriesData {
  date: string;
  totalStudyTime: number;
  focusedTime: number;
  focusRate: number;
}

export interface ReportMetrics {
  totalStudyTime: number; // in seconds
  focusedTime: number; // in seconds
  focusRate: number;
  totalBreakTime: number; // in seconds
  breakTimePercentage: number;
  breakCount: number;
  medianBreakInterval: number; // in seconds
  timeSeries?: TimeSeriesData[];
}
