
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionPlan } from '../types';
import api from '../services/api';
import tangsengImg from '../pic/tangseng.png';
import guanyingImg from '../pic/guanying.png';

const SubscriptionView: React.FC = () => {
    const { 
        refreshAuthStatus,
        planName,
        isTrialActive,
        hasActiveSubscription,
        trialEndDate,
        subscriptionEndDate,
    } = useAuth();
    const [isLoading, setIsLoading] = useState<SubscriptionPlan | null>(null);
    const [error, setError] = useState('');
    const [planDetails, setPlanDetails] = useState<any>(null);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showUserAgreement, setShowUserAgreement] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    // @ts-ignore
    const [pendingPlan, setPendingPlan] = useState<'standard' | 'pro' | null>(null);

    // 获取动态计划详情
    useEffect(() => {
        const fetchPlanDetails = async () => {
            try {
                const details = await api.config.getPlanDetails();
                setPlanDetails(details);
            } catch (err) {
                console.error('Failed to fetch plan details:', err);
                setError('获取计划详情失败，请刷新页面重试');
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchPlanDetails();
    }, []);

    const handleSubscribe = async (plan: 'standard' | 'pro') => {
        // 检查是否需要显示确认提示框
        if (isTrialActive || hasActiveSubscription) {
            setPendingPlan(plan);
            setShowConfirmModal(true);
            return;
        }
        
        // 直接购买
        await proceedWithPurchase(plan);
    };

    const proceedWithPurchase = async (plan: 'standard' | 'pro') => {
        setIsLoading(plan);
        setError('');
        try {
            const { data } = await api.subscription.createOrder({ plan });
            if (typeof window !== 'undefined') {
              setError(`请在新窗口中打开此（模拟）支付链接完成支付:\n${data.paymentUrl}\n\n本地开发提示: 查看后台日志，手动触发 webhook 来完成订阅。`);
            }
            console.log("Generated Payment URL:", data.paymentUrl);
            console.log("Order ID:", data.orderId);
        } catch (err: any) {
            setError(err.response?.data?.message || '创建订单失败，请稍后重试。');
        } finally {
            setIsLoading(null);
        }
    };

    // 移除未使用的handleConfirmPurchase函数，现在直接显示微信群信息

    const handleCancelPurchase = () => {
        setShowConfirmModal(false);
        setPendingPlan(null);
    };

    const getPlanStatusText = () => {
        if (hasActiveSubscription && subscriptionEndDate) {
            return `您当前的导师（订阅）是：${planName}，有效期至 ${new Date(subscriptionEndDate).toLocaleDateString()}。`;
        }
        if (isTrialActive && trialEndDate) {
            return `您正在免费体验中，有效期至 ${new Date(trialEndDate).toLocaleDateString()}。`;
        }
        return '您当前没有有效的订阅计划，试用期已结束。';
    };

    if (loadingPlans) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-xl">正在加载订阅详情...</div>
            </div>
        );
    }

    if (!planDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-900 flex items-center justify-center">
                <div className="text-red-400 text-xl">无法加载计划详情，请刷新页面重试</div>
            </div>
        );
    }

    const tangsengPrice = planDetails?.standard ? (planDetails.standard.price / 100).toFixed(2) : '19.9';
    const guanyingPrice = planDetails?.pro ? (planDetails.pro.price / 100).toFixed(2) : '29.9';

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-900 font-sans text-white">
            {/* 页面标题区域 */}
            <div className="text-center pt-12 pb-8 px-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-yellow-300 mb-4">
                    尊敬的施主...
                </h1>
                <p className="text-slate-300 max-w-2xl mx-auto">
                    请选择一位监督您孩子修行的导师。两位各有神通，请仔细斟酌。
                </p>
                
                {/* 状态提示 */}
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg max-w-2xl mx-auto">
                    <p className="text-slate-200">{getPlanStatusText()}</p>
                    <button 
                        onClick={refreshAuthStatus} 
                        className="text-sm text-yellow-300 hover:text-yellow-200 mt-2 underline"
                        title="如果您已完成支付，点击这里更新状态"
                    >
                        刷新订阅导师
                    </button>
                </div>
                
                {error && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-2xl mx-auto">
                        <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
                    </div>
                )}
            </div>

            {/* 角色对话区域 */}
            <div className="px-4 mb-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    {/* 唐僧区域 */}
                    <div 
                        className="relative"
                        onMouseEnter={() => setHoveredCharacter('guanying')}
                        onMouseLeave={() => setHoveredCharacter(null)}
                    >
                        {/* 对话气泡 */}
                        <div className="bg-white/90 text-slate-800 p-4 rounded-2xl shadow-lg mb-4 relative">
                            <p className="text-sm leading-relaxed">
                                唐僧 (叹气)："施主，贫僧我是真的尽力了...但眼神不好，难免误判。要不...您看看菩萨救我？她那边虽然贵点、看得慢点，但人家看得准啊！我把她的能耐给您列在下面了，您瞧瞧？"
                            </p>
                            {/* 气泡尾巴 */}
                            <div className="absolute bottom-0 left-8 transform translate-y-full">
                                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[15px] border-l-transparent border-r-transparent border-t-white/90"></div>
                            </div>
                        </div>
                        {/* 唐僧图片 */}
                        <div className="flex justify-start">
                            <img 
                                src={tangsengImg} 
                                alt="唐僧" 
                                className="w-32 h-32 object-contain transform -scale-x-100"
                            />
                        </div>
                    </div>

                    {/* 观音区域 */}
                    <div 
                        className="relative"
                        onMouseEnter={() => setHoveredCharacter('tangseng')}
                        onMouseLeave={() => setHoveredCharacter(null)}
                    >
                        {/* 对话气泡 */}
                        <div className="bg-white/90 text-slate-800 p-4 rounded-2xl shadow-lg mb-4 relative">
                            <p className="text-sm leading-relaxed">
                                观音 (打哈欠)："唉，别找我，心累。你看那唐和尚，多有干劲儿！虽然他眼神不济，但胜在便宜又勤快啊！他有啥本事，我都替你问清楚了，写下面了，你自个儿看吧。"
                            </p>
                            {/* 气泡尾巴 */}
                            <div className="absolute bottom-0 right-8 transform translate-y-full">
                                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[15px] border-l-transparent border-r-transparent border-t-white/90"></div>
                            </div>
                        </div>
                        {/* 观音图片 */}
                        <div className="flex justify-end">
                            <img 
                                src={guanyingImg} 
                                alt="观音" 
                                className="w-32 h-32 object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 产品卡片区域 */}
            <div className="px-4 pb-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 唐僧卡片 */}
                    <div className={`
                        bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 p-6
                        transition-all duration-500
                        ${hoveredCharacter === 'tangseng' 
                            ? 'opacity-100 scale-105 border-yellow-400 shadow-2xl shadow-yellow-300/30' 
                            : 'opacity-60'
                        }
                    `}>
                        {/* 卡片标题和价格 */}
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-white">唐僧严师</h3>
                            <div className="text-right">
                                <div className="text-xs text-yellow-300 mb-1">香火钱</div>
                                <div className="text-2xl font-bold text-yellow-300">{tangsengPrice} 元</div>
                                <div className="text-xs text-slate-400">(有效期：30天)</div>
                            </div>
                        </div>

                        {/* 功能列表 */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">⚡️</span>
                                <div>
                                    <div className="text-white font-medium">监督频率</div>
                                    <div className="text-slate-300 text-sm">3次/分钟 (盯得紧!)</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">👁️</span>
                                <div>
                                    <div className="text-white font-medium">判断方式</div>
                                    <div className="text-slate-300 text-sm">肉眼凡胎 (偶尔误判)</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">📜</span>
                                <div>
                                    <div className="text-white font-medium">核心特点</div>
                                    <div className="text-slate-300 text-sm">勤快、啰嗦、性价比高</div>
                                </div>
                            </div>
                        </div>

                        {/* 选择按钮 */}
                        <button
                            onClick={() => handleSubscribe('standard')}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="text-lg">请"师傅救我"</div>
                            <div className="text-sm font-normal opacity-75">"算了，能盯住就行，便宜要紧！"</div>
                        </button>
                    </div>

                    {/* 观音卡片 */}
                    <div className={`
                        bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 p-6
                        transition-all duration-500
                        ${hoveredCharacter === 'guanying' 
                            ? 'opacity-100 scale-105 border-yellow-400 shadow-2xl shadow-yellow-300/30' 
                            : 'opacity-60'
                        }
                    `}>
                        {/* 卡片标题和价格 */}
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-white">观音大士</h3>
                            <div className="text-right">
                                <div className="text-xs text-yellow-300 mb-1">香火钱</div>
                                <div className="text-2xl font-bold text-yellow-300">{guanyingPrice} 元</div>
                                <div className="text-xs text-slate-400">(有效期：30天)</div>
                            </div>
                        </div>

                        {/* 功能列表 */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">🐌</span>
                                <div>
                                    <div className="text-white font-medium">监督频率</div>
                                    <div className="text-slate-300 text-sm">2次/分钟 (懒是懒点)</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">✨</span>
                                <div>
                                    <div className="text-white font-medium">判断方式</div>
                                    <div className="text-slate-300 text-sm">菩提慧眼 (精准不误判)</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">💎</span>
                                <div>
                                    <div className="text-white font-medium">核心特点</div>
                                    <div className="text-slate-300 text-sm">精准、省心、极少出错..除非娃儿是戏精就没法了...</div>
                                </div>
                            </div>
                        </div>

                        {/* 选择按钮 */}
                        <button
                            onClick={() => handleSubscribe('pro')}
                            disabled={isLoading !== null || (hasActiveSubscription && planName.includes('菩萨救我'))}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="text-lg">请"菩萨救我"</div>
                            <div className="text-sm font-normal opacity-75">"贵是贵，多花钱，但准是准！"</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* 确认购买提示框 */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">支付开通中...</h3>
                        <div className="text-slate-300 mb-6 leading-relaxed">
                            <p className="mb-4">
                                非常抱歉，线上支付正在开通中....如果您实在是要被家中的"灵猴"烦死了，可扫码入微信群申请延长试用时间。
                            </p>
                            <div className="flex justify-center mb-4">
                                <img 
                                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/src/assets/wechat-w.png`} 
                                alt="微信群二维码" 
                                className="w-48 h-48 border border-white/20 rounded-lg"
                            />
                            </div>
                            <p className="text-center text-sm text-slate-400 mb-6">
                                扫码加入微信群，联系管理员申请延长试用时间。
                            </p>
                            
                            {/* 添加隐私协议和服务协议 */}
                            <div className="border-t border-white/20 pt-4">
                                <p className="text-sm text-slate-400 mb-3">
                                    继续使用即表示您同意我们的服务条款：
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <button
                                        onClick={() => setShowUserAgreement(true)}
                                        className="text-yellow-400 hover:text-yellow-300 underline bg-transparent border-none cursor-pointer"
                                    >
                                        《用户服务协议》
                                    </button>
                                    <button
                                        onClick={() => setShowPrivacyPolicy(true)}
                                        className="text-yellow-400 hover:text-yellow-300 underline bg-transparent border-none cursor-pointer"
                                    >
                                        《隐私政策》
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={handleCancelPurchase}
                                className="bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg transition-colors"
                            >
                                我知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 用户服务协议弹窗 */}
            {showUserAgreement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-white/20 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">用户服务协议</h2>
                            <button 
                                onClick={() => setShowUserAgreement(false)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-grow">
                            <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                                {userAgreementContent}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-white/20">
                            <button
                                onClick={() => setShowUserAgreement(false)}
                                className="w-full py-2 px-4 bg-yellow-400 text-slate-900 rounded-md hover:bg-yellow-500 transition-colors"
                            >
                                我已阅读并了解
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 隐私政策弹窗 */}
            {showPrivacyPolicy && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-white/20 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">隐私政策</h2>
                            <button 
                                onClick={() => setShowPrivacyPolicy(false)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-grow">
                            <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                                {privacyPolicyContent}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-white/20">
                            <button
                                onClick={() => setShowPrivacyPolicy(false)}
                                className="w-full py-2 px-4 bg-yellow-400 text-slate-900 rounded-md hover:bg-yellow-500 transition-colors"
                            >
                                我已阅读并了解
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 用户服务协议内容
const userAgreementContent = `
版本号：1.0
生效日期：2025年10月1日

欢迎使用"悟空伴读"！

为使用本服务，请您仔细阅读并遵守《用户服务协议》（以下简称"本协议"）。在您开始使用我们的服务前，请务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款。

当您通过页面勾选或点击"同意"并完成注册程序后，即表示您已充分阅读、理解并接受本协议的全部内容，本协议即在您与【你的公司全称】（以下简称"我们"）之间产生法律效力。

第一条 服务内容与模式

1.1 服务内容：我们提供一款名为"悟空伴读"的、基于人工智能技术的儿童学习专注度分析辅助工具（以下简称"本服务"）。本服务通过您设备的前置摄像头，定时采集图像并进行实时分析，向您提供关于儿童学习状态的分析结果。

1.2 免费试用：我们为每一位新注册的用户提供自注册之日起为期七（7）日的免费全功能体验服务。免费试用期结束后，相关功能将受限。

1.3 付费服务：免费试用期结束后，您可选择一次性购买服务包以继续使用本服务。具体服务内容、期限及价格以购买页面公示为准。本服务为预付费模式，一经购买成功，非因我方重大过失或法律法规另有规定，费用不予退还。

第二条 监护人资格与义务

2.1 您承诺并保证，您是年满18周岁的成年人，并且是您所监护儿童的法定监护人。

2.2 您承诺将按照本App"首次使用向导"的指引，将设备固定于合理的家庭学习空间（如书房、客厅书桌），并确保拍摄画面不涉及卫生间、卧室等任何私密区域。

2.3 您承诺并保证，本服务仅用于您对被监护子女在家庭学习场景下的状态了解与积极引导，不得用于监控任何非被监护人，或任何其他非法、侵权用途。

第三条 账号使用规则

3.1 您应对您的账户信息（如手机号、验证码）妥善保管，并对在该账户下发生的所有活动承担责任。

3.2 您的账户仅限您本人使用，不得转让、赠与、出租或售卖给任何第三方。

第四条 知识产权

本服务所包含的所有内容，包括但不限于文字、图标、UI设计、软件代码，其知识产权均归我们所有。未经我们书面许可，您不得以任何形式复制、修改、传播或用于任何商业目的。

第五条 免责声明

5.1 本服务的分析结果仅基于AI模型对图像的识别，可能因拍摄角度、光线、儿童姿态等多种因素影响而产生误差。分析结果仅供您作为参考，不构成任何具备法律效力的证明或建议。

5.2 您应确保您的使用设备及网络环境安全。因您设备中毒、被黑客攻击或网络问题导致的数据泄露或服务中断，我们不承担责任。

第六条 服务变更与终止

6.1 我们有权根据业务发展需要，变更或升级服务内容。如有重大变更，我们将通过App内公告等方式提前通知您。

6.2 如您违反本协议任何条款，我们有权随时暂停或终止向您提供服务。

6.3 您可以随时通过App内的指引注销您的账户。账号注销后，我们将根据《隐私政策》的规定删除您的所有数据。

第七条 法律适用与争议解决

本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，应首先友好协商解决；协商不成的，任何一方均可向【你的公司所在地】人民法院提起诉讼。

第八条 其他

本协议内容同时包括我们可能不断发布的关于本服务的相关协议、规则等内容。上述内容一经正式发布，即为本协议不可分割的组成部分，您同样应当遵守。
`;

// 隐私政策内容
const privacyPolicyContent = `
版本号：1.0
生效日期：2025年10月1日

"悟空伴读"《隐私政策》

引言
我们深知个人信息对您的重要性，并会尽全力保护您和您孩子的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您和您孩子的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。

本政策将帮助您了解以下内容：
一、 我们如何收集和使用您和您孩子的个人信息
二、 我们如何使用 Cookie 和同类技术
三、 我们如何共享、转让、公开披露您的个人信息
四、 我们如何保护和保存您和您孩子的个人信息
五、 您的权利
六、 我们如何处理儿童的个人信息
七、 本政策如何更新
八、如何联系我们

一、我们如何收集和使用您和您孩子的个人信息

在您使用本服务过程中，我们会遵循合法、正当、必要的原则，收集和使用以下信息：

1.1 为完成注册：当您注册"悟空伴读"账户时，我们会收集您的手机号码，用于创建账户和身份验证。

1.2 为实现核心功能（学习专注度分析）：
* 摄像头权限（单独同意）：在您首次开启本服务核心功能前，我们会通过弹窗明确请求您的摄像头权限，在获得您的单独同意后，才会开启摄像头。
* 图像数据（实时处理，永不存储）：我们会通过摄像头定时采集儿童的学习场景图像。我们郑重承诺，所有原始图像数据仅用于实时传输至云端AI模型进行分析，我们绝不以任何形式存储、备份或保留任何原始图像数据。分析完成后，图像数据立即销毁。
* 衍生数据：AI模型分析后，会生成不包含任何可识别个人生物特征的衍生数据，包括：时间戳、学习状态标签（如"专注"、"分心"）、单日学习时长与分心次数统计。我们收集这些数据是为了向您生成和展示学习报告。

二、我们如何使用 Cookie 和同类技术
为确保本服务正常运转，我们会在您的设备上存储名为 Cookie 的小数据文件。Cookie 通常包含标识符、站点名称以及一些号码和字符。我们不会将 Cookie 用于本政策所述目的之外的任何用途。

三、我们如何共享、转让、公开披露您的个人信息

3.1 共享：我们不会与任何公司、组织和个人共享您的个人信息，但以下情况除外：
* 为实现核心功能所必需的共享：为实现AI分析功能，我们会将加密后的图像数据通过安全通道，共享给阿里云计算有限公司，以使用其"通义千问"大模型服务。我们已与该服务商签订严格的数据处理与保密协议，要求其严格遵守我们的数据安全标准。
* 获得您的明确同意后。
* 在法定情形下的共享：我们可能会根据法律法规规定、诉讼争议解决需要，或按行政、司法机关依法提出的要求，对外共享您的个人信息。

3.2 转让：我们不会将您的个人信息转让给任何公司、组织和个人，但获取您明确同意的除外。

3.3 公开披露：我们仅会在获取您明确同意或基于法律的强制性要求下，公开披露您的个人信息。

四、我们如何保护和保存您和您孩子的个人信息

4.1 保护措施：我们已使用符合业界标准的安全防护措施保护您提供的信息，防止数据遭到未经授权的访问、公开披露、使用、修改、损坏或丢失。例如，我们会采用HTTPS协议进行加密传输，并采用加密技术对存储的衍生数据进行保护。

4.2 保存期限：
* 原始图像数据：不保存。
* 衍生数据：我们将保存您的衍生数据，直至您主动注销账户。当您注销账户后，我们将对您的衍生数据进行删除或匿名化处理。

五、您的权利

您可以通过以下方式访问及管理您的信息：

查询与更正：您可以登录App，查询您的账户信息和学习报告。

删除：您可以通过App内的功能，删除孩子所有的学习数据和分析结果。

注销账户：您可以通过App内的"账号注销"功能随时注销您的账户。

撤回同意：您可以在设备系统中关闭摄像头的授权，以撤回您的同意。请注意，撤回后您将无法使用本服务的核心功能。

六、我们如何处理儿童的个人信息

我们深知保护儿童个人信息的重要性。本服务面向儿童，由其监护人注册和使用。我们仅收集实现服务所必需的儿童相关信息（如前文所述的衍生数据），并严格按照本政策进行保护。若您作为监护人，对所监护儿童的个人信息处理存在疑问，可随时联系我们。

七、本政策如何更新

我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本政策所应享有的权利。对于重大变更，我们会提供更为显著的通知（例如通过App内弹窗或消息推送）。

八、如何联系我们

如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：

公司名称：【上海家乐宝信息科技服务有限公司】

电子邮箱：【lijipz@163.com】

注册地址：【上海市嘉定区】
`;

export default SubscriptionView;