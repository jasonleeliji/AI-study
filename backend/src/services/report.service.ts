
import { StudySession } from '../models/studySession.model';
import moment from 'moment-timezone';

export interface Focus {
  isFocused: boolean;
  timestamp: Date;
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

const CAPTURE_INTERVAL = 20; // 20 seconds

export const calculateMetrics = (sessions: StudySession[], groupBy?: 'day' | 'week'): ReportMetrics => {
  if (sessions.length === 0) {
    return { totalStudyTime: 0, focusedTime: 0, focusRate: 0, totalBreakTime: 0, breakTimePercentage: 0, breakCount: 0, medianBreakInterval: 0 };
  }

  let totalStudyTime = 0;
  let focusedTime = 0;
  let totalBreakTime = 0;
  let breakCount = 0;
  const studyIntervals: number[] = [];

  sessions.forEach(session => {
    if(!session.endTime) return;
    
    const sessionEndTime = new Date(session.endTime).getTime();
    const sessionStartTime = new Date(session.startTime).getTime();

    const sessionDuration = (sessionEndTime - sessionStartTime) / 1000;
    const sessionBreakTime = session.breakHistory?.reduce((acc, br) => {
        const breakEndTime = br.endTime ? new Date(br.endTime).getTime() : new Date().getTime();
        const breakStartTime = new Date(br.startTime).getTime();
        return acc + (breakEndTime - breakStartTime) / 1000;
    }, 0) || 0;
    totalStudyTime += (sessionDuration - sessionBreakTime);
    totalBreakTime += sessionBreakTime;
    breakCount += session.breakHistory?.length || 0;

    focusedTime += (session.focusHistory as Focus[])?.filter(f => f.isFocused).length * CAPTURE_INTERVAL || 0;

    let lastEventTime = sessionStartTime;
    session.breakHistory?.forEach(br => {
        if (br.endTime) {
            studyIntervals.push((new Date(br.startTime).getTime() - lastEventTime) / 1000);
            lastEventTime = new Date(br.endTime).getTime();
        }
    });
    studyIntervals.push((sessionEndTime - lastEventTime) / 1000);
  });
  
  const focusRate = totalStudyTime > 0 ? (focusedTime / totalStudyTime) * 100 : 0;
  const grandTotalTime = totalStudyTime + totalBreakTime;
  const breakTimePercentage = grandTotalTime > 0 ? (totalBreakTime / grandTotalTime) * 100 : 0;

  let medianBreakInterval = 0;
  if(studyIntervals.length > 0){
    const sortedIntervals = [...studyIntervals].sort((a,b) => a-b);
    const mid = Math.floor(sortedIntervals.length / 2);
    medianBreakInterval = sortedIntervals.length % 2 !== 0 ? sortedIntervals[mid] : (sortedIntervals[mid-1] + sortedIntervals[mid]) / 2;
  }

  const baseMetrics = {
    totalStudyTime,
    focusedTime,
    focusRate: Math.min(100, focusRate),
    totalBreakTime,
    breakTimePercentage,
    breakCount,
    medianBreakInterval
  };

  if (groupBy) {
    const groupedData: { [key: string]: { totalStudyTime: number, focusedTime: number } } = {};

    sessions.forEach(session => {
      if (!session.endTime) return;

      const key = groupBy === 'day' 
        ? moment(session.startTime).tz('Asia/Shanghai').format('YYYY-MM-DD')
        : moment(session.startTime).tz('Asia/Shanghai').startOf('week').format('YYYY-MM-DD');

      if (!groupedData[key]) {
        groupedData[key] = { totalStudyTime: 0, focusedTime: 0 };
      }

      const sessionDuration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000;
      const sessionBreakTime = session.breakHistory?.reduce((acc, br) => {
        const breakEndTime = br.endTime ? new Date(br.endTime).getTime() : new Date().getTime();
        const breakStartTime = new Date(br.startTime).getTime();
        return acc + (breakEndTime - breakStartTime) / 1000;
      }, 0) || 0;
      
      groupedData[key].totalStudyTime += (sessionDuration - sessionBreakTime);
      groupedData[key].focusedTime += (session.focusHistory as Focus[])?.filter(f => f.isFocused).length * CAPTURE_INTERVAL || 0;
    });

    const timeSeries = Object.entries(groupedData).map(([date, data]) => ({
      date,
      totalStudyTime: data.totalStudyTime,
      focusedTime: data.focusedTime,
      focusRate: data.totalStudyTime > 0 ? Math.min(100, (data.focusedTime / data.totalStudyTime) * 100) : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { ...baseMetrics, timeSeries };
  }

  return baseMetrics;
};
