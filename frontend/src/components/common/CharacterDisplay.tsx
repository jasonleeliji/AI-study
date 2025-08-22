import React from 'react';
import { Rank } from '../../types';
import { shouldShowSleepingGuanyin } from '../../utils/timeUtils';

// Import local images
import guanyingImage from '../../pic/guanying.png'; // 观音菩萨
import suiguanyingImage from '../../pic/suiguanying.png'; // 睡觉观音菩萨
import tangsengImage from '../../pic/tangseng.png'; // 唐僧

// Import gamification stage images for Wukong
import stoneMonkeyImage from '../../pic/shihou.png'; // 初始阶段：石猴
import caveMasterImage from '../../pic/sld.png'; // 第二阶段：水帘洞主
import studyReturnImage from '../../pic/bsxy.png'; // 第三阶段：学艺归来
import monkeyKingImage from '../../pic/wukong.png'; // 第四阶段：美猴王

const getRankName = (rank: Rank) => {
    const names = {
        [Rank.WUKONG]: '孙悟空',
    };
    return names[rank] || '孙悟空';
};

interface CharacterDisplayProps {
    role: 'master' | 'student';
    rank?: Rank;
    size?: 'normal' | 'small';
    gamificationStage?: 'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING';
    userSubscriptionInfo?: {
        hasActiveSubscription: boolean;
        plan: string;
        isTrialActive: boolean;
    };
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ role, rank, size = 'normal', gamificationStage, userSubscriptionInfo }) => {
    const characterRank = rank || Rank.WUKONG;

    let src: string;
    let altText: string;

    if (role === 'master') {
        // 根据用户订阅状态决定显示唐僧还是观音
        // 标准版使用唐僧形象，试用版和专业版使用观音形象
        const useTangsengVersion = userSubscriptionInfo ? 
            (userSubscriptionInfo.plan === 'standard' || 
             userSubscriptionInfo.plan.includes('师傅救我')) : 
            false; // 默认使用观音
        
        if (useTangsengVersion) {
            // 标准版用户显示唐僧
            src = tangsengImage;
            altText = '唐僧师父';
        } else {
            // 试用版和专业版用户显示观音，根据时间显示不同形象
            if (shouldShowSleepingGuanyin()) {
                src = suiguanyingImage;
                altText = '睡觉中的观音姐姐';
            } else {
                src = guanyingImage;
                altText = '观音姐姐';
            }
        }
    } else {
        // 学生角色只显示悟空，根据游戏化阶段显示不同形象
        switch (gamificationStage) {
            case 'STONE_MONKEY':
                src = stoneMonkeyImage;
                break;
            case 'CAVE_MASTER':
                src = caveMasterImage;
                break;
            case 'MONKEY_KING':
                src = studyReturnImage;
                break;
            case 'TOTAL_MONKEY_KING':
                src = monkeyKingImage;
                break;
            default:
                src = stoneMonkeyImage; // 默认使用石猴形象
        }
        
        altText = `你的当前形象: ${getRankName(characterRank)}`;
    }

    const containerSizeClass = size === 'normal' ? 'w-[150px]' : 'w-[100px]';

    return (
        <div className={`${containerSizeClass} aspect-[3/4] flex flex-col items-center justify-center transition-all duration-300`}>
            <div className="w-full h-full flex items-center justify-center">
                 <img 
                    src={src} 
                    alt={altText} 
                    className={`w-full h-full object-contain`}
                    style={{ backgroundColor: 'transparent' }}
                    onError={(e) => {
                      // 如果图片加载失败，设置透明背景
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                />
            </div>
        </div>
    );
};

export default CharacterDisplay;