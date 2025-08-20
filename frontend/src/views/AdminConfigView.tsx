import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminConfigView: React.FC = () => {
    const [positiveFeedbackMinutes, setPositiveFeedbackMinutes] = useState(0);
    const [standardPlanPrice, setStandardPlanPrice] = useState(0);
    const [proPlanPrice, setProPlanPrice] = useState(0);
    
    // 添加订阅计划特定的分析间隔配置
    const [trialAnalysisInterval, setTrialAnalysisInterval] = useState(60);
    const [standardAnalysisInterval, setStandardAnalysisInterval] = useState(30);
    const [proAnalysisInterval, setProAnalysisInterval] = useState(15);
    
    // 添加游戏化阶段目标配置
    const [stoneMonkeyGoalTokens, setStoneMonkeyGoalTokens] = useState(100000);
    const [caveMasterGoalTokens, setCaveMasterGoalTokens] = useState(300000);
    const [monkeyKingGoalTokens, setMonkeyKingGoalTokens] = useState(600000);
    const [totalMonkeyKingGoalTokens, setTotalMonkeyKingGoalTokens] = useState(1200000);
    
    // 微信二维码管理
    const [wechatQrImageUrl, setWechatQrImageUrl] = useState('');
    const [isUploadingQr, setIsUploadingQr] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.config.getAppConfig();
                setPositiveFeedbackMinutes(response.positiveFeedbackMinutes);
                setStandardPlanPrice(response.standardPlanPrice);
                setProPlanPrice(response.proPlanPrice);
                
                // 设置游戏化阶段目标配置
                setStoneMonkeyGoalTokens(response.stoneMonkeyGoalTokens || 100000);
                setCaveMasterGoalTokens(response.caveMasterGoalTokens || 300000);
                setMonkeyKingGoalTokens(response.monkeyKingGoalTokens || 600000);
                setTotalMonkeyKingGoalTokens(response.totalMonkeyKingGoalTokens || 1200000);
                
                // 设置微信二维码图片URL
                setWechatQrImageUrl(response.wechatQrImageUrl || '/src/assets/wechat-w.png');
                
                // 获取AI提示词配置中的分析间隔
                const aiPrompts = await api.admin.configManager.aiPrompts.getAll();
                console.log('useEffect - 获取到的AI提示词配置:', JSON.stringify(aiPrompts, null, 2));
                
                // 设置各订阅计划的分析间隔 - 注意数据库中是小写
                const trialConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'trial');
                const standardConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'standard');
                const proConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'pro');
                
                console.log('找到的配置:', { trialConfig, standardConfig, proConfig });
                
                if (trialConfig) {
                    setTrialAnalysisInterval(trialConfig.analysisIntervalSeconds);
                    console.log('设置试用版分析间隔:', trialConfig.analysisIntervalSeconds);
                }
                if (standardConfig) {
                    setStandardAnalysisInterval(standardConfig.analysisIntervalSeconds);
                    console.log('设置标准版分析间隔:', standardConfig.analysisIntervalSeconds);
                }
                if (proConfig) {
                    setProAnalysisInterval(proConfig.analysisIntervalSeconds);
                    console.log('设置专业版分析间隔:', proConfig.analysisIntervalSeconds);
                }
            } catch (err) {
                setError('Failed to load configuration');
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        console.log('开始保存系统配置...');
        console.log('当前adminKey:', localStorage.getItem('adminKey'));
        
        try {
            // 1. 保存应用配置（价格、游戏化目标等，不包含AI分析间隔）
            await api.config.updateAppConfig({
                positiveFeedbackMinutes: positiveFeedbackMinutes,
                standardPlanPrice: standardPlanPrice,
                proPlanPrice: proPlanPrice,
                
                // 游戏化阶段目标配置
                stoneMonkeyGoalTokens,
                caveMasterGoalTokens,
                monkeyKingGoalTokens,
                totalMonkeyKingGoalTokens,
            });
            console.log('✓ 应用配置保存成功（价格、反馈文案等）');
            
            // 2. 单独保存AI分析间隔配置（通过AI提示词配置API）
            console.log('开始保存AI分析间隔配置...');
            
            // 获取当前AI提示词配置
            const aiPrompts = await api.admin.configManager.aiPrompts.getAll();
            console.log('获取到的AI提示词配置:', JSON.stringify(aiPrompts, null, 2));
            
            // 更新各订阅计划的分析间隔 - 注意数据库中是小写
            const trialConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'trial');
            const standardConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'standard');
            const proConfig = aiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'pro');
            
            // 保存试用版分析间隔
            if (trialConfig) {
                const configToSave = {
                    ...trialConfig,
                    analysisIntervalSeconds: Number(trialAnalysisInterval) || 60
                };
                console.log('保存试用版分析间隔:', configToSave.analysisIntervalSeconds, '秒');
                await api.admin.configManager.aiPrompts.upsert(configToSave);
                console.log('✓ 试用版分析间隔保存成功');
            }
            
            // 保存标准版分析间隔
            if (standardConfig) {
                const configToSave = {
                    ...standardConfig,
                    analysisIntervalSeconds: Number(standardAnalysisInterval) || 30
                };
                console.log('保存标准版分析间隔:', configToSave.analysisIntervalSeconds, '秒');
                await api.admin.configManager.aiPrompts.upsert(configToSave);
                console.log('✓ 标准版分析间隔保存成功');
            }
            
            // 保存专业版分析间隔
            if (proConfig) {
                const configToSave = {
                    ...proConfig,
                    analysisIntervalSeconds: Number(proAnalysisInterval) || 15
                };
                console.log('保存专业版分析间隔:', configToSave.analysisIntervalSeconds, '秒');
                await api.admin.configManager.aiPrompts.upsert(configToSave);
                console.log('✓ 专业版分析间隔保存成功');
            }
            
            console.log('✓ 所有配置保存完成');
            alert('系统配置保存成功！');
            
            // 重新获取配置并更新页面显示
            try {
                const response = await api.config.getAppConfig();
                console.log('已刷新应用配置:', JSON.stringify(response, null, 2));
                
                // 更新应用配置相关的状态
                setPositiveFeedbackMinutes(response.positiveFeedbackMinutes);
                setStandardPlanPrice(response.standardPlanPrice);
                setProPlanPrice(response.proPlanPrice);
                
                // 更新游戏化阶段目标配置
                setStoneMonkeyGoalTokens(response.stoneMonkeyGoalTokens || 100000);
                setCaveMasterGoalTokens(response.caveMasterGoalTokens || 300000);
                setMonkeyKingGoalTokens(response.monkeyKingGoalTokens || 600000);
                setTotalMonkeyKingGoalTokens(response.totalMonkeyKingGoalTokens || 1200000);
                
                // 更新微信二维码图片URL
                setWechatQrImageUrl(response.wechatQrImageUrl || '/src/assets/wechat-w.png');
                
                // 重新获取AI提示词配置并更新页面显示
                const updatedAiPrompts = await api.admin.configManager.aiPrompts.getAll();
                console.log('刷新后的AI提示词配置:', JSON.stringify(updatedAiPrompts, null, 2));
                
                const updatedTrialConfig = updatedAiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'trial');
                const updatedStandardConfig = updatedAiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'standard');
                const updatedProConfig = updatedAiPrompts.find((p: { subscriptionPlan: string }) => p.subscriptionPlan === 'pro');
                
                // 更新页面显示的分析间隔值
                if (updatedTrialConfig) {
                    setTrialAnalysisInterval(updatedTrialConfig.analysisIntervalSeconds);
                    console.log('刷新后试用版分析间隔:', updatedTrialConfig.analysisIntervalSeconds);
                }
                if (updatedStandardConfig) {
                    setStandardAnalysisInterval(updatedStandardConfig.analysisIntervalSeconds);
                    console.log('刷新后标准版分析间隔:', updatedStandardConfig.analysisIntervalSeconds);
                }
                if (updatedProConfig) {
                    setProAnalysisInterval(updatedProConfig.analysisIntervalSeconds);
                    console.log('刷新后专业版分析间隔:', updatedProConfig.analysisIntervalSeconds);
                }
                
                console.log('✓ 页面显示已更新');
            } catch (refreshError) {
                console.error('刷新配置失败:', refreshError);
            }
        } catch (err) {
            console.error('保存配置失败:', err);
            alert('保存配置失败，请查看控制台错误信息');
        }
    };

    // 二维码上传处理函数
    const handleQrUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        // 验证文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片文件大小不能超过5MB');
            return;
        }

        setIsUploadingQr(true);
        try {
            const response = await api.admin.imageManager.uploadWechatQr(file);
            setWechatQrImageUrl(response.imageUrl);
            alert('二维码图片上传成功！');
        } catch (err) {
            console.error('上传二维码失败:', err);
            alert('上传二维码失败，请重试');
        } finally {
            setIsUploadingQr(false);
        }
    };

    // 重置二维码处理函数
    const handleQrReset = async () => {
        if (!confirm('确定要重置为默认二维码吗？')) return;

        setIsUploadingQr(true);
        try {
            const response = await api.admin.imageManager.resetWechatQr();
            setWechatQrImageUrl(response.imageUrl);
            alert('二维码已重置为默认图片！');
        } catch (err) {
            console.error('重置二维码失败:', err);
            alert('重置二维码失败，请重试');
        } finally {
            setIsUploadingQr(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Configuration</h1>
            
            <h2 className="text-xl font-bold mb-2">订阅计划特定分析间隔</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded bg-gray-50">
                    <label className="block text-lg font-medium">试用版分析间隔 (秒)</label>
                    <input
                        type="number"
                        value={trialAnalysisInterval}
                        onChange={(e) => setTrialAnalysisInterval(Number(e.target.value))}
                        className="p-2 border rounded w-full mt-1"
                        min="10"
                    />
                    <p className="text-sm text-gray-500 mt-1">建议值: 60秒</p>
                </div>
                
                <div className="p-4 border rounded bg-gray-50">
                    <label className="block text-lg font-medium">标准版分析间隔 (秒)</label>
                    <input
                        type="number"
                        value={standardAnalysisInterval}
                        onChange={(e) => setStandardAnalysisInterval(Number(e.target.value))}
                        className="p-2 border rounded w-full mt-1"
                        min="10"
                    />
                    <p className="text-sm text-gray-500 mt-1">建议值: 30秒</p>
                </div>
                
                <div className="p-4 border rounded bg-gray-50">
                    <label className="block text-lg font-medium">专业版分析间隔 (秒)</label>
                    <input
                        type="number"
                        value={proAnalysisInterval}
                        onChange={(e) => setProAnalysisInterval(Number(e.target.value))}
                        className="p-2 border rounded w-full mt-1"
                        min="10"
                    />
                    <p className="text-sm text-gray-500 mt-1">建议值: 15秒</p>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-lg font-medium">Positive Feedback (minutes)</label>
                <input
                    type="number"
                    value={positiveFeedbackMinutes}
                    onChange={(e) => setPositiveFeedbackMinutes(Number(e.target.value))}
                    className="p-2 border rounded"
                />
            </div>

            <h2 className="text-xl font-bold mb-2">订阅计划价格配置</h2>
            <div className="mb-4">
                <label className="block text-lg font-medium">标准版价格 (分):</label>
                <input
                    type="number"
                    value={standardPlanPrice}
                    onChange={(e) => setStandardPlanPrice(Number(e.target.value))}
                    className="p-2 border rounded"
                    min="0"
                />
                <small className="block text-gray-600">当前价格: ¥{(standardPlanPrice / 100).toFixed(2)}</small>
            </div>
            
            <div className="mb-4">
                <label className="block text-lg font-medium">专业版价格 (分):</label>
                <input
                    type="number"
                    value={proPlanPrice}
                    onChange={(e) => setProPlanPrice(Number(e.target.value))}
                    className="p-2 border rounded"
                    min="0"
                />
                <small className="block text-gray-600">当前价格: ¥{(proPlanPrice / 100).toFixed(2)}</small>
            </div>



            {/* 游戏化阶段目标配置 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">游戏化阶段目标配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            石猴阶段目标灵力值
                        </label>
                        <input
                            type="number"
                            value={stoneMonkeyGoalTokens}
                            onChange={(e) => setStoneMonkeyGoalTokens(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="100000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            洞主阶段目标灵力值
                        </label>
                        <input
                            type="number"
                            value={caveMasterGoalTokens}
                            onChange={(e) => setCaveMasterGoalTokens(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="300000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            猴王阶段目标灵力值
                        </label>
                        <input
                            type="number"
                            value={monkeyKingGoalTokens}
                            onChange={(e) => setMonkeyKingGoalTokens(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="600000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            齐天大圣阶段目标灵力值
                        </label>
                        <input
                            type="number"
                            value={totalMonkeyKingGoalTokens}
                            onChange={(e) => setTotalMonkeyKingGoalTokens(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1200000"
                        />
                    </div>
                </div>
            </div>

            {/* 微信二维码管理 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">微信群二维码管理</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 当前二维码预览 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            当前二维码预览
                        </label>
                        <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                            <img 
                                src={wechatQrImageUrl} 
                                alt="微信群二维码" 
                                className="w-48 h-48 object-contain mx-auto"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/src/assets/wechat-w.png';
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            当前图片路径: {wechatQrImageUrl}
                        </p>
                    </div>
                    
                    {/* 上传和管理操作 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            更新二维码图片
                        </label>
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrUpload}
                                    disabled={isUploadingQr}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
                                </p>
                            </div>
                            
                            <button
                                onClick={handleQrReset}
                                disabled={isUploadingQr}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingQr ? '处理中...' : '重置为默认二维码'}
                            </button>
                            
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>提示：</strong>微信群二维码通常7天过期，请及时更新。上传新二维码后，用户在许愿台弹窗中看到的将是新的二维码。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 保存按钮 */}
            <div className="mt-6">
                <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
                    保存所有配置
                </button>
            </div>
        </div>
    );
};

export default AdminConfigView;
