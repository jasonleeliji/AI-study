import React from 'react';

interface QuestTrackerProps {
    stage: 'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING';
    totalSpiritualPower: number; // 改为灵力值
    totalFocusSeconds?: number; // 保留用于兼容性，可选
}

// 从环境变量读取阶段目标灵力值（token数）
const STONE_MONKEY_GOAL_TOKENS = parseInt(import.meta.env.VITE_STONE_MONKEY_GOAL_TOKENS || '1000');
const CAVE_MASTER_GOAL_TOKENS = parseInt(import.meta.env.VITE_CAVE_MASTER_GOAL_TOKENS || '3000');
const MONKEY_KING_GOAL_TOKENS = parseInt(import.meta.env.VITE_MONKEY_KING_GOAL_TOKENS || '6000');
const TOTAL_MONKEY_KING_GOAL_TOKENS = parseInt(import.meta.env.VITE_TOTAL_MONKEY_KING_GOAL_TOKENS || '12000');

const questDetails = {
    STONE_MONKEY: {
        title: '石猴出世：称霸花果山',
        objective: `目标：累计修行灵力 ${STONE_MONKEY_GOAL_TOKENS.toLocaleString()} 点，进入水帘洞，即可成为水帘洞主！`,
        goalTokens: STONE_MONKEY_GOAL_TOKENS
    },
    CAVE_MASTER: {
        title: '水帘洞主：拜师学艺',
        objective: `目标：累计修行灵力 ${CAVE_MASTER_GOAL_TOKENS.toLocaleString()} 点，拜师学艺，即可成为孙悟空！`,
        goalTokens: CAVE_MASTER_GOAL_TOKENS
    },
    MONKEY_KING: {
        title: '孙悟空：龙宫取宝',
        objective: `目标：累计修行灵力 ${MONKEY_KING_GOAL_TOKENS.toLocaleString()} 点，龙宫取宝，即可成为斗战胜佛！`,
        goalTokens: MONKEY_KING_GOAL_TOKENS
    },
    TOTAL_MONKEY_KING: {
        title: '斗战胜佛：修成正果',
        objective: '恭喜！你已修成正果，成为斗战胜佛。继续勤勉修行，引领他人！',
        goalTokens: TOTAL_MONKEY_KING_GOAL_TOKENS
    },
}

const formatProgressSpiritualPower = (tokens: number, goalTokens: number) => {
    return `${tokens.toLocaleString()} / ${goalTokens.toLocaleString()} 灵力`;
};

const QuestTracker: React.FC<QuestTrackerProps> = ({ stage, totalSpiritualPower }) => {
    // 添加默认值以防止未定义错误
    const details = questDetails[stage] || questDetails.STONE_MONKEY;
    const progressPercentage = Math.min(100, (totalSpiritualPower / details.goalTokens) * 100);

    return (
        <div className="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg">
            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200">{details.title}</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{details.objective}</p>
            
            {stage !== 'TOTAL_MONKEY_KING' && (
                <div className="mt-3">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        <span>修行进度</span>
                        <span>{formatProgressSpiritualPower(totalSpiritualPower, details.goalTokens)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div 
                            className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestTracker;