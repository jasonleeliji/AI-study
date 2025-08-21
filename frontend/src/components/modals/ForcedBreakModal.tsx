import React, { useState, useEffect, useCallback } from 'react';
import { useSpeech } from '../../hooks/useSpeech';

interface ForcedBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  breakDurationMinutes: number;
  audioUrl?: string;
}

const ForcedBreakModal: React.FC<ForcedBreakModalProps> = ({ isOpen, onClose, message, breakDurationMinutes, audioUrl }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const { speak } = useSpeech();

  // 初始化倒计时
  useEffect(() => {
    if (isOpen && breakDurationMinutes) {
      setTimeRemaining(breakDurationMinutes * 60); // 转换为秒
      setHasPlayedAudio(false);
    }
  }, [isOpen, breakDurationMinutes]);

  // 播放语音提醒
  useEffect(() => {
    if (isOpen && message && !hasPlayedAudio) {
      // 播放语音提醒
      speak(message);
      setHasPlayedAudio(true);
      
      // 如果有音频文件，播放音频文件
      if (audioUrl) {
        try {
          const audio = new Audio(audioUrl);
          audio.volume = 0.5;
          audio.play().catch(err => {
            console.log('无法播放休息提醒音频:', err);
          });
        } catch (err) {
          console.log('音频播放失败:', err);
        }
      }
    }
  }, [isOpen, message, audioUrl, hasPlayedAudio, speak]);

  // 倒计时逻辑
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // 休息时间结束
          speak('休息时间结束，可以继续学习了！');
          setTimeout(() => {
            onClose();
          }, 2000); // 2秒后自动关闭
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining, speak, onClose]);

  // 格式化时间显示
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 重新播放语音
  const replayAudio = useCallback(() => {
    if (message) {
      speak(message);
    }
  }, [message, speak]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 animate-pulse-slow">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🧘‍♂️</div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            强制休息时间
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            保护眼睛，劳逸结合
          </p>
        </div>

        {/* 休息消息 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <p className="text-slate-800 dark:text-slate-200 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* 倒计时显示 */}
        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
            {formatTime(timeRemaining)}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            剩余休息时间
          </p>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ 
                width: `${((breakDurationMinutes * 60 - timeRemaining) / (breakDurationMinutes * 60)) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* 休息建议 */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">💡 休息建议</h3>
          <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
            <li>• 远眺窗外，放松眼部肌肉</li>
            <li>• 起身活动，伸展身体</li>
            <li>• 深呼吸，放松心情</li>
            <li>• 喝点水，补充水分</li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={replayAudio}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-6a3 3 0 00-6 0v6z" />
            </svg>
            <span>重播语音</span>
          </button>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            休息时间结束后将自动恢复学习
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcedBreakModal;