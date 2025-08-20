import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudyStatus, BreakType, AnalysisResult, ChildProfile, StudySession, Rank, UserStatus } from '../types';
import Camera, { CameraHandle } from '../components/common/Camera';
import { ClockIcon, SparklesIcon, InformationCircleIcon, PlayIcon, StopIcon, ResumeIcon, TrophyIcon } from '../components/common/Icons';
import api from '../services/api';
import { useSpeech } from '../hooks/useSpeech';
import Spinner from '../components/common/Spinner';
import AnimationOverlay from '../components/common/AnimationOverlay';
import CharacterDisplay from '../components/common/CharacterDisplay';
import CameraConsentModal from '../components/modals/CameraConsentModal';
import PrivacyConsentModal from '../components/modals/PrivacyConsentModal';
import { useAuth } from '../contexts/AuthContext';
import { isSleepTime, getSleepTimeMessage, getFeedbackTitle, getIdleMessage } from '../utils/timeUtils';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getRankInfo = (rank: Rank): {name: string, icon: JSX.Element} => {
    switch (rank) {
        case Rank.WUKONG: return { name: '齐天大圣', icon: <TrophyIcon /> };
        default: return { name: '齐天大圣', icon: <TrophyIcon /> };
    }
};

const StatusIndicator: React.FC<{ status: StudyStatus }> = ({ status }) => {
    let bgColor = 'bg-slate-400';
    let text = '准备就绪';
    switch (status) {
        case StudyStatus.Studying: bgColor = 'bg-amber-500'; text = '正在修行'; break;
        case StudyStatus.Break: bgColor = 'bg-sky-500'; text = '正在休息'; break;
        case StudyStatus.Finished: bgColor = 'bg-slate-500'; text = '修行结束'; break;
        case StudyStatus.Idle: bgColor = 'bg-slate-400'; text = '准备开始'; break;
    }
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${bgColor} animate-pulse`}></span>
            <span className="font-medium">{text}</span>
        </div>
    );
};

interface SupervisionViewProps {
  profile: ChildProfile | null;
  onRankChange: (rank: Rank) => void;
  onStatusChange: (status: StudyStatus) => void;
  onProfileUpdate?: (profile: ChildProfile) => void;
}

const SupervisionView: React.FC<SupervisionViewProps> = ({ profile, onRankChange, onStatusChange, onProfileUpdate }) => {
    const { hasActiveSubscription, planName, isTrialActive } = useAuth();
    const [session, setSession] = useState<StudySession | null>(null);
    const [_userStatus, setUserStatus] = useState<UserStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
    const [timer, setTimer] = useState(0);
    const [animation, setAnimation] = useState<{ key: AnalysisResult['animationKey']; message: string; show: boolean }>({ key: 'idle', message: '', show: false });
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [dailyLimitMinutes, setDailyLimitMinutes] = useState<number | null>(null);
    const [remainingDays, setRemainingDays] = useState<number | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
    const [showCameraConsentModal, setCameraConsentModal] = useState(false);
    const [showPrivacyConsentModal, setShowPrivacyConsentModal] = useState(false);
    const [cameraConsentGiven, setCameraConsentGiven] = useState(() => {
        // 从localStorage读取摄像头授权状态
        const consent = localStorage.getItem('cameraConsentGiven') === 'true';
        console.log('Initial camera consent from localStorage:', consent);
        return consent;
    });
    const [privacyConsentGiven, setPrivacyConsentGiven] = useState(() => {
        // 从localStorage读取隐私协议同意状态
        const consent = localStorage.getItem('privacyConsentGiven') === 'true';
        console.log('Initial privacy consent from localStorage:', consent);
        return consent;
    });
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
    const [analysisInterval, setAnalysisInterval] = useState<number | null>(null); // Initially null until config is fetched
    const [isCurrentlySleepTime, setIsCurrentlySleepTime] = useState(isSleepTime());
    const [feedbackTitle, setFeedbackTitle] = useState('菩萨有话说'); // 动态反馈标题
    const [sleepMessage, setSleepMessage] = useState('哎呀，姐姐困了，小屁孩也赶紧去睡觉吧，小心长不高哈！再重要的作业咱也不做了，去吧去吧！'); // 动态睡觉提示
    const [idleMessage, setIdleMessage] = useState('徒儿，为师已经准备好了，快来开始修行吧！'); // 动态空闲提示

    // 处理摄像头错误的回调函数
    const handleCameraError = useCallback((error: string) => {
        setError(error);
        setIsCameraReady(false);
    }, []);

    // 处理摄像头准备就绪的回调函数
    const handleCameraReady = useCallback((ready: boolean) => {
        console.log('Camera ready state changed:', ready);
        setError(null);
        setIsCameraReady(ready);
    }, []);



    const captureFrameRef = useRef<CameraHandle>(null);
    const analysisIntervalRef = useRef<number | null>(null);
    const timeLimitUpdateRef = useRef<number | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const { speak } = useSpeech();
    const historyContainerRef = useRef<HTMLDivElement>(null);

    const currentRank = session?.currentRank || lastAnalysis?.currentRank || Rank.WUKONG;


    useEffect(() => {
        onRankChange(currentRank);
    }, [currentRank, onRankChange]);

    // 定期检查时间变化，处理睡觉时间逻辑
    useEffect(() => {
        const checkTimeInterval = setInterval(() => {
            const currentSleepTime = isSleepTime();
            
            // 如果时间状态发生变化
            if (currentSleepTime !== isCurrentlySleepTime) {
                setIsCurrentlySleepTime(currentSleepTime);
                
                // 如果进入睡觉时间且正在修行，自动停止修行
                if (currentSleepTime && session && (session.status === StudyStatus.Studying || session.status === StudyStatus.Break)) {
                    handleAction(async () => {
                        return await api.sessions.stop();
                    });
                    setError(sleepMessage);
                }
            }
        }, 60000); // 每分钟检查一次

        return () => clearInterval(checkTimeInterval);
    }, [isCurrentlySleepTime, session]);
    
    // Reset rank to default when view is unmounted
    useEffect(() => {
        return () => {
            onRankChange(Rank.WUKONG);
        };
    }, [onRankChange]);

    // 根据用户订阅计划获取UI文案配置
    useEffect(() => {
        const fetchUITextConfig = async () => {
            try {
                // 确定用户的订阅计划
                let currentPlan: string = 'trial'; // 默认试用版
                
                if (hasActiveSubscription) {
                    if (planName && (planName.includes('菩萨救我') || planName.includes('pro'))) {
                        currentPlan = 'pro';
                    } else if (planName && (planName.includes('师傅救我') || planName.includes('standard'))) {
                        currentPlan = 'standard';
                    }
                } else if (isTrialActive) {
                    currentPlan = 'trial';
                }

                // 获取对应的UI文案配置
                const [titleResult, messageResult, idleResult] = await Promise.allSettled([
                    getFeedbackTitle(currentPlan as any),
                    getSleepTimeMessage(currentPlan as any),
                    getIdleMessage(currentPlan as any)
                ]);

                if (titleResult.status === 'fulfilled') {
                    setFeedbackTitle(titleResult.value);
                }

                if (messageResult.status === 'fulfilled') {
                    setSleepMessage(messageResult.value);
                }

                if (idleResult.status === 'fulfilled') {
                    setIdleMessage(idleResult.value);
                }
            } catch (error) {
                console.error('Failed to fetch UI text config:', error);
                // 保持默认值
            }
        };

        fetchUITextConfig();
    }, [hasActiveSubscription, planName, isTrialActive]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // 并行获取会话、用户状态和应用配置
                const [sessionResponse, userStatusResponse, configResponse] = await Promise.allSettled([
                    api.sessions.getCurrent(),
                    api.auth.getStatus(),
                    api.config.getAppConfig()
                ]);

                if (sessionResponse.status === 'fulfilled') {
                    setSession(sessionResponse.value.data);
                    // 通知父组件初始状态
                    if (sessionResponse.value.data?.status) {
                        onStatusChange(sessionResponse.value.data.status);
                    }
                    if (sessionResponse.value.data?.currentRank) {
                        setLastAnalysis(prev => ({...(prev ?? {isFocused: true, isOnSeat: true, animationKey: 'idle', message: ''}), currentRank: sessionResponse.value.data.currentRank}));
                        onRankChange(sessionResponse.value.data.currentRank);
                    }
                } else {
                    // This is not a critical error, just means no previous session
                    setSession(null);
                    // 通知父组件空闲状态
                    onStatusChange(StudyStatus.Idle);
                }

                if (userStatusResponse.status === 'fulfilled') {
                    const userData = userStatusResponse.value.data;
                    setUserStatus(userData);
                    // 设置时间限制信息
                    if (userData.effectiveDailyLimit) {
                        setDailyLimitMinutes(userData.effectiveDailyLimit);
                        // 优先使用用户状态中的remainingSeconds
                        setRemainingSeconds(userData.remainingSeconds || 0);
                    }
                    if (userData.remainingDays !== undefined) {
                        setRemainingDays(userData.remainingDays);
                    }
                }

                if (configResponse.status === 'fulfilled') {
                    const config = configResponse.value;
                    
                    let intervalSet = false;
                    
                    // 优先使用计划特定的间隔信息
                    if (config.planIntervals) {
                        let currentPlan = 'standard'; // 默认标准版
                        
                        if (hasActiveSubscription) {
                            if (planName && (planName.includes('菩萨救我') || planName.includes('pro'))) {
                                currentPlan = 'pro';
                            } else if (planName && (planName.includes('师傅救我') || planName.includes('standard'))) {
                                currentPlan = 'standard';
                            }
                        } else if (isTrialActive) {
                            currentPlan = 'trial';
                        }
                        
                        if (config.planIntervals[currentPlan]) {
                            const planInterval = config.planIntervals[currentPlan];
                            setAnalysisInterval(planInterval * 1000);
                            intervalSet = true;
                        }
                    }
                    
                    // 如果没有设置计划特定的间隔，则使用基本分析间隔
                    if (!intervalSet && config.analysisIntervalSeconds) {
                        console.log('从配置中获取默认分析间隔:', config.analysisIntervalSeconds, '秒');
                        setAnalysisInterval(config.analysisIntervalSeconds * 1000);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);
    // 浏览器关闭/刷新时的清理逻辑
    useEffect(() => {
        const handleBeforeUnload = async () => {
            // 停止分析间隔
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
            
            // 停止时间限制更新间隔
            if (timeLimitUpdateRef.current) {
                clearInterval(timeLimitUpdateRef.current);
                timeLimitUpdateRef.current = null;
            }
            
            // 关闭WebSocket连接
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };

        const handlePageUnload = async () => {
            // 只在真正的页面卸载时停止会话
            const currentSession = session;
            if (currentSession && (currentSession.status === StudyStatus.Studying || currentSession.status === StudyStatus.Break)) {
                try {
                    await api.sessions.stop();
                } catch (error) {
                    console.error('Failed to stop session on page unload:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handlePageUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handlePageUnload);
            // 组件卸载时只清理资源，不停止会话
            handleBeforeUnload();
        };
    }, []); // 移除session依赖，避免每次session更新时重新运行

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Construct WebSocket URL using correct protocol and token
        const wsUrl = import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws') + `/ws?token=${token}`;
        console.log('Connecting to WebSocket:', wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
        };

        ws.current.onerror = (error) => {
            console.log('WebSocket error:', error);
        };

        // Handle incoming WebSocket messages
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'session_updated':
                    setSession(data.session);
                    // 通知父组件状态变化
                    if (data.session?.status) {
                        onStatusChange(data.session.status);
                    }
                    if (data.session?.currentRank) {
                        onRankChange(data.session.currentRank);
                    }
                    break;
                case 'profile_updated':
                    // 通知父组件profile更新
                    if (data.profile) {
                        // 这里需要通过回调函数通知DashboardView更新profile
                        if (onProfileUpdate) {
                            onProfileUpdate(data.profile);
                        }
                    }
                    break;
                case 'remaining_time_updated':
                    setRemainingSeconds(data.remainingSeconds);
                    break;
                case 'config_updated':
                    // 处理计划特定的分析间隔
                    if (data.config?.planIntervals) {
                        let currentPlan = 'standard'; // 默认标准版
                        
                        if (hasActiveSubscription) {
                            if (planName && (planName.includes('菩萨救我') || planName.includes('pro'))) {
                                currentPlan = 'pro';
                            } else if (planName && (planName.includes('师傅救我') || planName.includes('standard'))) {
                                currentPlan = 'standard';
                            }
                        } else if (isTrialActive) {
                            currentPlan = 'trial';
                        }
                        
                        if (data.config.planIntervals[currentPlan]) {
                            const planInterval = data.config.planIntervals[currentPlan];
                            console.log(`WebSocket更新: 使用${currentPlan}计划的分析间隔:`, planInterval, '秒');
                            setAnalysisInterval(planInterval * 1000);
                        }
                    }
                    // 如果没有计划特定的间隔，则使用基本分析间隔
                    else if (data.config?.analysisIntervalSeconds) {
                        console.log('WebSocket更新分析间隔:', data.config.analysisIntervalSeconds, '秒');
                        setAnalysisInterval(data.config.analysisIntervalSeconds * 1000);
                    }
                    break;
                default:
                    break;
            }
        };

        // Cleanup function
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [onRankChange]);

    const handleAnalysis = useCallback(async () => {
        if (!captureFrameRef.current || isAnalyzing) return;
        const base64Image = captureFrameRef.current.captureFrame();
        if (!base64Image) { setError('无法捕获摄像头画面。'); return; }

        setError(null);
        setIsAnalyzing(true);
        try {
            const { data } = await api.supervision.analyze(base64Image);
            const { analysis } = data;
            
            setLastAnalysis(analysis);
            
            // 根据后端的shouldSpeak标识决定是否进行语音播报
            if (session?.status === StudyStatus.Studying && (analysis as any).shouldSpeak) {
                speak(analysis.message);
                setAnimation({ key: analysis.animationKey, message: analysis.message, show: true });
                setTimeout(() => setAnimation(prev => ({ ...prev, show: false })), 4000);
            }
            
            // 更新分析历史
            setAnalysisHistory(prev => [analysis, ...prev]);
            
            // 如果是专注状态，更新修行进度
            if (analysis.isFocused && analysis.isOnSeat) {
                // 通过WebSocket获取最新的会话数据，包括进度
                // 这里不需要做任何事情，因为WebSocket会自动更新session状态
            }
        } catch (err: any) {
            setError(`AI分析失败: ${err.response?.data?.message || '未知错误'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [speak, isAnalyzing, session?.status, setAnalysisHistory]);

    // 使用useRef保存最新的handleAnalysis函数
    const handleAnalysisRef = useRef(handleAnalysis);
    handleAnalysisRef.current = handleAnalysis;

    useEffect(() => {
        if (session?.status === StudyStatus.Studying) {  // 只在学习状态时进行AI分析
            // 清除现有的定时器
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
            
            // 等待一个分析间隔周期后才开始第一次分析，而不是立即分析
            // 这样给摄像头和用户一些准备时间
            analysisIntervalRef.current = setInterval(() => {
                handleAnalysisRef.current();
            }, analysisInterval || 0);
        } else {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
        }
        return () => {
            if (analysisIntervalRef.current) {
                clearInterval(analysisIntervalRef.current);
                analysisIntervalRef.current = null;
            }
        };
    }, [session?.status, analysisInterval]); // 添加analysisInterval作为依赖，确保配置更新时重新设置定时器

    useEffect(() => {
        let timerId: ReturnType<typeof setInterval> | null = null;
        let breakWarningTimer: ReturnType<typeof setTimeout> | null = null;
        
        if (session?.status === StudyStatus.Studying) {
            timerId = setInterval(() => {
                const now = Date.now();
                const startTime = new Date(session.startTime).getTime();
                const totalBreakDuration = session.breakHistory.reduce((acc, br) => acc + (br.endTime ? (new Date(br.endTime).getTime() - new Date(br.startTime).getTime()) : 0), 0);
                setTimer(Math.floor((now - startTime - totalBreakDuration) / 1000));
            }, 1000);
        } else if (session?.status === StudyStatus.Break && profile) {
            timerId = setInterval(() => {
                const currentBreak = session.breakHistory.find(b => !b.endTime);
                if(currentBreak) {
                    // 统一三种休息类型的时长为5分钟
                    const breakDurationMinutes = 5; 
                    
                    const breakDurationSeconds = breakDurationMinutes * 60;
                    const elapsed = Math.floor((Date.now() - new Date(currentBreak.startTime).getTime()) / 1000);
                    const remainingTime = Math.max(0, breakDurationSeconds - elapsed);
                    setTimer(remainingTime);
                    
                    // 休息结束前30秒提醒孩子回到座位继续学习
                    if (remainingTime === 30 && !breakWarningTimer) {
                        speak("休息时间快结束了，请回到座位上准备继续修行。");
                        breakWarningTimer = setTimeout(() => {
                            // 清除定时器引用
                            breakWarningTimer = null;
                        }, 1000); // 1秒后清除引用，避免重复提醒
                    }
                    
                    // 休息时间结束时自动恢复修行
                    if (remainingTime === 0) {
                        handleAction(async () => {
                            return await api.sessions.resume();
                        });
                    }
                } else {
                    // 如果没有找到进行中的休息，重置计时器
                    setTimer(0);
                }
            }, 1000);
        } else {
            setTimer(0);
        }
        return () => { 
            if (timerId) clearInterval(timerId); 
            if (breakWarningTimer) clearTimeout(breakWarningTimer);
        };
    }, [session, profile, speak]);

    // 移除本地时间限制倒计时，改为依赖后端推送
    // useEffect(() => {
    //     if (session?.status === StudyStatus.Studying && remainingSeconds !== null) {
    //         if (!timeLimitUpdateRef.current) {
    //             timeLimitUpdateRef.current = setInterval(() => {
    //                 setRemainingSeconds(prev => {
    //                     if (prev === null || prev <= 0) return prev;
    //                     return prev - 1;
    //                 });
    //             }, 1000);
    //         }
    //     } else {
    //         if (timeLimitUpdateRef.current) {
    //             clearInterval(timeLimitUpdateRef.current);
    //             timeLimitUpdateRef.current = null;
    //         }
    //     }
    //     return () => {
    //         if (timeLimitUpdateRef.current) {
    //             clearInterval(timeLimitUpdateRef.current);
    //             timeLimitUpdateRef.current = null;
    //         }
    //     };
    // }, [session?.status, remainingSeconds]);
    
    const handleAction = async (action: () => Promise<any>) => {
        setError(null);
        setIsActionLoading(true);
        try {
            const { data } = await action();
            setSession(data);
            // 通知父组件状态变化
            if (data?.status) {
                onStatusChange(data.status);
            }
        } catch (err: any) {
            // 使用用户友好的错误提示替代原始错误信息
            const errorMessage = err.response?.data?.message || '操作失败，请稍后重试';
            setError(errorMessage);
            
            // 检查是否是试用期结束的错误
            if (errorMessage.includes('试用期已结束')) {
                setShowSubscriptionPrompt(true);
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    // 滚动到最新的提醒历史
    useEffect(() => {
        if (historyContainerRef.current) {
            historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
    }, [analysisHistory]);

    const onStart = () => {
        console.log('onStart called - isCameraReady:', isCameraReady, 'cameraConsentGiven:', cameraConsentGiven, 'privacyConsentGiven:', privacyConsentGiven, 'isSleepTime:', isSleepTime());
        
        // 检查是否在睡觉时间
        if (isSleepTime()) {
            setError(sleepMessage);
            return;
        }

        // 首先检查隐私协议同意状态
        if (!privacyConsentGiven) {
            console.log('Privacy consent not given, showing privacy modal');
            setShowPrivacyConsentModal(true);
            return;
        }

        if (!isCameraReady) {
            setError('摄像头未准备就绪，请检查设备连接和浏览器权限。');
            return;
        }

        if (!cameraConsentGiven) {
            console.log('Camera consent not given, showing camera modal');
            setCameraConsentModal(true);
        } else {
            console.log('Starting session directly');
            handleAction(async () => {
                const response = await api.sessions.start();
                return response;
            });
            onRankChange(Rank.WUKONG); // Reset rank on new session start
        }
    };

    const handlePrivacyConsent = () => {
        console.log('Privacy consent given');
        setPrivacyConsentGiven(true);
        localStorage.setItem('privacyConsentGiven', 'true');
        setShowPrivacyConsentModal(false);
        
        // 隐私协议同意后，继续检查摄像头权限
        if (!isCameraReady) {
            setError('摄像头未准备就绪，请检查设备连接和浏览器权限。');
            return;
        }

        if (!cameraConsentGiven) {
            console.log('Privacy consent given, now showing camera modal');
            setCameraConsentModal(true);
        } else {
            console.log('Privacy consent given, starting session directly');
            handleAction(async () => {
                const response = await api.sessions.start();
                return response;
            });
            onRankChange(Rank.WUKONG); // Reset rank on new session start
        }
    };

    const handlePrivacyDisagree = () => {
        console.log('Privacy consent denied');
        setShowPrivacyConsentModal(false);
        setError('需要同意隐私协议才能开始修行');
    };

    const handleCameraConsent = (agreed: boolean) => {
        setCameraConsentModal(false);
        if (agreed) {
            setCameraConsentGiven(true);
            localStorage.setItem('cameraConsentGiven', 'true');
            
            handleAction(async () => {
                const response = await api.sessions.start();
                return response;
            });
            onRankChange(Rank.WUKONG); // Reset rank on new session start
        }
    };

    const onStop = () => handleAction(async () => {
        return await api.sessions.stop();
    });
    
    const onBreak = (type: BreakType) => handleAction(async () => {
        return await api.sessions.break(type);
    });
    
    const onResume = () => handleAction(async () => {
        return await api.sessions.resume();
    });

    if (isLoading || !profile) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    
    const status = session?.status || StudyStatus.Idle;
    
    // 调试信息
    console.log('Current session:', session);
    console.log('Current status:', status);
    console.log('Is camera ready:', isCameraReady);
    console.log('Privacy consent:', privacyConsentGiven);
    console.log('Camera consent:', cameraConsentGiven);
    const rankInfo = getRankInfo(currentRank);

    return (
        <div className="flex flex-col gap-6">
            {/* 隐私协议确认弹窗 */}
            {showPrivacyConsentModal && (
                <PrivacyConsentModal 
                    isOpen={showPrivacyConsentModal}
                    onAgree={handlePrivacyConsent}
                    onDisagree={handlePrivacyDisagree}
                />
            )}

            {/* 摄像头授权确认弹窗 */}
            {showCameraConsentModal && (
                <CameraConsentModal 
                    isOpen={showCameraConsentModal}
                    onAgree={() => handleCameraConsent(true)}
                    onDisagree={() => handleCameraConsent(false)}
                />
            )}

            {/* 试用期结束或订阅到期提示框 */}
            {showSubscriptionPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">订阅提醒</h2>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-slate-700 dark:text-slate-300">
                                    您的试用期已结束，请前往"拜师求佛"页面选择"师傅救我"或"菩萨救我"作为您娃的导师，继续使用。
                                </p>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSubscriptionPrompt(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
                                >
                                    稍后再说
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSubscriptionPrompt(false);
                                        // 导航到订阅页面
                                        window.location.hash = '#subscription';
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    前往求法
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Left Column --- */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                        {/* 摄像头区域 - 现在占据整行宽度 */}
                        <div className="col-span-1">
                            <div className="relative">
                                <Camera 
                                    ref={captureFrameRef} 
                                    onCameraError={handleCameraError}
                                    onCameraReady={handleCameraReady}
                                />
                                <AnimationOverlay 
                                    show={animation.show}
                                    animationKey={animation.key}
                                    message={animation.message}
                                />

                            </div>
                        </div>
                    </div>
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                </div>

                {/* --- Right Column --- */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-slate-200 dark:bg-slate-700/50 p-4 rounded-lg">
                        <h3 className="font-bold mb-3 text-lg">修行状态</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><InformationCircleIcon />状态</span> <StatusIndicator status={status} /></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><ClockIcon />今日可修行时长</span> <span className="font-bold">{formatTime(remainingSeconds ?? 0)} / {dailyLimitMinutes ? `${dailyLimitMinutes}:00` : 'N/A'}</span></div>
                            {/* 修行进度显示 */}
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2">修行进度</span>
                                <span className="font-mono text-sm">
                                    {(() => {
                                        const currentPower = profile?.totalSpiritualPower || 0;
                                        const stage = profile?.gamificationStage || 'STONE_MONKEY';
                                        let goalTokens = 1000; // 默认石猴阶段
                                        
                                        switch (stage) {
                                            case 'STONE_MONKEY':
                                                goalTokens = parseInt(import.meta.env.VITE_STONE_MONKEY_GOAL_TOKENS || '1000');
                                                break;
                                            case 'CAVE_MASTER':
                                                goalTokens = parseInt(import.meta.env.VITE_CAVE_MASTER_GOAL_TOKENS || '3000');
                                                break;
                                            case 'MONKEY_KING':
                                                goalTokens = parseInt(import.meta.env.VITE_MONKEY_KING_GOAL_TOKENS || '6000');
                                                break;
                                            case 'TOTAL_MONKEY_KING':
                                                goalTokens = parseInt(import.meta.env.VITE_TOTAL_MONKEY_KING_GOAL_TOKENS || '12000');
                                                break;
                                        }
                                        
                                        return `${currentPower.toLocaleString()} / ${goalTokens.toLocaleString()} 灵力`;
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-2"><ClockIcon />{status === StudyStatus.Break ? '休息剩余' : '修行计时'}</span> <span className="font-mono text-base">{formatTime(timer)}</span></div>
                            {remainingDays !== null && (
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2"><ClockIcon />剩余天数</span> 
                                    <span className="font-mono text-sm">{remainingDays}天</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-200 dark:bg-slate-700/50 p-4 rounded-lg">
                        {status === StudyStatus.Idle || status === StudyStatus.Finished ? (
                            <button 
                                onClick={onStart} 
                                disabled={isActionLoading || !isCameraReady || isSleepTime()} 
                                className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-300"
                            >
                                <PlayIcon /> 
                                {isSleepTime() ? '每日9:00-23:00可修行' : 
                                 !isCameraReady ? '等待摄像头准备...' : 
                                 '开始修行'}
                            </button>
                        ) : status === StudyStatus.Studying ? (
                            <div className="space-y-2">
                                <button onClick={onStop} disabled={isActionLoading} className="w-full flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors disabled:bg-slate-400">
                                    <StopIcon /> 结束本次修行
                                </button>
                                
                                {/* 替换"我要休息"按钮为三个具体的休息按钮 */}
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => onBreak(BreakType.Stretch)} 
                                        disabled={isActionLoading} 
                                        className="flex flex-col items-center justify-center gap-1 bg-green-500 text-white font-bold py-3 px-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
                                    >
                                        <span>去化缘</span>
                                        <span className="text-xs">5分钟</span>
                                    </button>
                                    <button 
                                        onClick={() => onBreak(BreakType.Restroom)} 
                                        disabled={isActionLoading} 
                                        className="flex flex-col items-center justify-center gap-1 bg-purple-500 text-white font-bold py-3 px-2 rounded-lg hover:bg-purple-600 transition-colors disabled:bg-purple-300"
                                    >
                                        <span>去方便</span>
                                        <span className="text-xs">5分钟</span>
                                    </button>
                                    <button 
                                        onClick={() => onBreak(BreakType.Forced)} 
                                        disabled={isActionLoading} 
                                        className="flex flex-col items-center justify-center gap-1 bg-orange-500 text-white font-bold py-3 px-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300"
                                    >
                                        <span>偷个懒</span>
                                        <span className="text-xs">5分钟</span>
                                    </button>
                                </div>
                            </div>
                        ) : status === StudyStatus.Break ? (
                            <button onClick={onResume} disabled={isActionLoading} className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors disabled:bg-amber-300">
                                <ResumeIcon /> 恢复修行
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            
            {/* 师父教诲区域 - 恢复为原来的样子 */}
            <div className="bg-slate-200 dark:bg-slate-700/50 p-4 rounded-lg">
                <div className="flex gap-4 items-start">
                    <div className="flex-grow">
                        {status === StudyStatus.Studying || status === StudyStatus.Break ? (
                            <>
                                <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><SparklesIcon /> 
                                    菩萨睁开法眼，正在默默观察中...
                                </h3>
                                {isAnalyzing ? (
                                    <p className="italic text-slate-500 dark:text-slate-400">
                                        菩萨正在观察中...
                                    </p>
                                ) : lastAnalysis ? (
                                    <p className={`text-base ${lastAnalysis.isFocused && lastAnalysis.isOnSeat ? 'text-slate-600 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {lastAnalysis.message}
                                    </p>
                                ) : (
                                    <p className="italic text-slate-500 dark:text-slate-400">
                                        菩萨正在观察中...
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><SparklesIcon /> {feedbackTitle}</h3>
                                <p className="text-base text-amber-600 dark:text-amber-400">
                                    {isSleepTime() 
                                        ? sleepMessage
                                        : idleMessage
                                    }
                                </p>
                            </>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <CharacterDisplay 
                            role="master" 
                            size="small" 
                            gamificationStage={profile?.gamificationStage}
                            userSubscriptionInfo={{
                                hasActiveSubscription,
                                plan: planName,
                                isTrialActive
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisionView;
