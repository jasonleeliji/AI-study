export interface IChildProfile {
  id: number;
  userId: number;
  nickname: string;
  age: number;
  grade: '幼儿园' | '小学一年级' | '小学二年级' | '小学三年级' | '小学四年级' | '小学五年级' | '小学六年级';
  gender: string;
  minSessionDuration: number;
  stretchBreak: number;
  waterBreak: number;
  restroomBreak: number;
  forcedBreakDuration: number;
  workDurationBeforeForcedBreak: number;
  waterBreakLimit: number;
  restroomBreakLimit: number;
  gamificationStage?: string;
  totalSpiritualPower?: number;
  dailySpiritualPower?: number;
  totalFocusSeconds?: number;
  dailyFocusSeconds?: number;
  lastFocusUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}