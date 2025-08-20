import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoutIcon } from '../components/common/Icons';
import SupervisionView from './SupervisionView';
import SettingsView from './SettingsView';
import ReportView from './ReportView';
import SubscriptionView from './SubscriptionView';
import QuestTracker from '../components/QuestTracker';
import { ChildProfile, Rank, StudyStatus } from '../types';
import api from '../services/api';
import Spinner from '../components/common/Spinner';
import CharacterDisplay from '../components/common/CharacterDisplay';
import SpiritualEnergy from '../components/common/SpiritualEnergy';
import newLogo from '../pic/new-logo.png';

type View = 'supervision' | 'settings' | 'report' | 'subscription';

interface DashboardViewProps {
  gamificationStage?: 'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING';
  onGamificationStageChange?: (stage: 'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING') => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ gamificationStage: _gamificationStage }) => {
  const { logout, planName } = useAuth();
  const [view, setView] = useState<View>('supervision');
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentRank, setCurrentRank] = useState<Rank>(Rank.WUKONG);
  const [studyStatus, setStudyStatus] = useState<StudyStatus>(StudyStatus.Idle);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [wechatQrImageUrl, setWechatQrImageUrl] = useState('/src/assets/wechat-w.png');
  
  // 监听URL hash变化以支持页面跳转
  useEffect(() => {
    const handleHashChange = () => {
      // 如果正在修行或休息，禁止切换TAB
      if (studyStatus === StudyStatus.Studying || studyStatus === StudyStatus.Break) {
        return;
      }
      
      const hash = window.location.hash.replace('#', '');
      if (hash === 'subscription') {
        setView('subscription');
        // 清除hash以避免重复触发
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash === 'report') {
        setView('report');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash === 'settings') {
        setView('settings');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash === 'supervision') {
        setView('supervision');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // 监听hash变化
    window.addEventListener('hashchange', handleHashChange);
    
    // 初始化时检查hash
    handleHashChange();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [studyStatus]);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await api.user.getProfile();
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchWechatQr = async () => {
      try {
        const response = await api.admin.imageManager.getWechatQr();
        setWechatQrImageUrl(response.imageUrl);
      } catch (err) {
        console.error('Failed to fetch wechat QR', err);
        // 保持默认值
      }
    };

    fetchProfile();
    fetchWechatQr();
    
    // 定期获取用户资料以更新修行进度
    const interval = setInterval(fetchProfile, 30000); // 每30秒更新一次
    
    return () => clearInterval(interval);
  }, []);
  

  const renderView = () => {
    switch (view) {
      case 'settings': return <SettingsView onSettingsSaved={() => setView('supervision')} />;
      case 'report': return <ReportView />;
      case 'subscription': return <SubscriptionView />;
      case 'supervision':
      default:
        return <SupervisionView profile={profile} onRankChange={setCurrentRank} onStatusChange={setStudyStatus} onProfileUpdate={setProfile} />;
    }
  };

  const NavButton: React.FC<{
    targetView: View;
    children: React.ReactNode;
  }> = ({ targetView, children }) => {
    const baseClass = "px-3 py-2 text-sm sm:text-base font-medium rounded-md transition-colors";
    const activeClass = "bg-amber-500 text-white shadow-sm";
    const inactiveClass = "bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600";
    const disabledClass = "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed";
    
    // 如果正在修行或休息，且不是当前视图，则禁用按钮
    const isDisabled = (studyStatus === StudyStatus.Studying || studyStatus === StudyStatus.Break) && view !== targetView;
    
    return (
      <button
        onClick={() => {
          if (!isDisabled) {
            setView(targetView);
          }
        }}
        disabled={isDisabled}
        className={`${baseClass} ${
          isDisabled 
            ? disabledClass 
            : view === targetView 
              ? activeClass 
              : inactiveClass
        }`}
        title={isDisabled ? "修行期间无法切换页面" : ""}
      >
        {children}
      </button>
    );
  };
  

  
  const mainContentClass = `bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 transition-all duration-500`;
  
  const handleFeedbackSubmit = async (content: string) => {
    await api.feedback.submit({ content });
  };

  const showAlert = (message: string, onConfirm: () => void) => {
    setAlert({ message, onConfirm });
  };

  const handleAlertConfirm = () => {
    if (alert) {
      alert.onConfirm();
      setAlert(null);
    }
  };

  // 添加自定义alert组件状态
  const [alert, setAlert] = useState<{message: string, onConfirm: () => void} | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col p-4 sm:p-6 lg:p-8 relative">
      <SpiritualEnergy />
      <header className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center">
          <img 
            src={newLogo} 
            alt="悟空伴读" 
            className="h-12 sm:h-16 w-auto animate-pulse"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full animate-pulse">{planName}</span>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavButton targetView="supervision">开始修行</NavButton>
            <NavButton targetView="report">修行报告</NavButton>
            <NavButton targetView="subscription">拜师求佛</NavButton>
            <button 
              onClick={() => {
                if (studyStatus !== StudyStatus.Studying && studyStatus !== StudyStatus.Break) {
                  setShowFeedbackModal(true);
                }
              }}
              disabled={studyStatus === StudyStatus.Studying || studyStatus === StudyStatus.Break}
              className={`px-3 py-2 text-sm sm:text-base font-medium rounded-md transition-colors ${
                studyStatus === StudyStatus.Studying || studyStatus === StudyStatus.Break
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600'
              }`}
              title={studyStatus === StudyStatus.Studying || studyStatus === StudyStatus.Break ? "修行期间无法使用此功能" : ""}
            >
              灵山许愿台
            </button>
            <NavButton targetView="settings">设置</NavButton>
          </nav>
          <button
            onClick={logout}
            title="退出登录"
            className="p-2 rounded-full bg-white dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors z-10"
          >
            <LogoutIcon />
          </button>
        </div>
      </header>
      
      <div className="flex justify-between items-stretch gap-4 mb-6 relative z-10">
        <div className="flex-grow flex items-center">
          {isLoadingProfile ? <Spinner /> : (
              profile && <QuestTracker 
                  stage={profile.gamificationStage || 'STONE_MONKEY'} 
                  totalSpiritualPower={profile.totalSpiritualPower || 0}
              />
          )}
        </div>
        {!isLoadingProfile && profile && view === 'supervision' && (
             <div className="flex items-center">
                <CharacterDisplay 
                    role="student" 
                    rank={currentRank}
                    gamificationStage={profile.gamificationStage || 'STONE_MONKEY'}
                />
             </div>
        )}
      </div>

      <main className={mainContentClass}>
        <div className="relative z-10">
          {renderView()}
        </div>
      </main>
      
      {/* 反馈模态框 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">灵山许愿台</h2>
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-slate-600 dark:text-slate-300 mb-2">三炷香已燃起...请选择您的许愿方式</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">您可以直接在此反馈问题，或扫码加入微信群获得更及时的帮助</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 左侧：文本反馈 */}
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">📝 文字许愿</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const content = formData.get('content') as string;
                    
                    if (!content || !content.trim()) {
                      showAlert('请向佛祖许下最急的愿！', () => {});
                      return;
                    }
                    
                    if (content.length > 200) {
                      showAlert('莫学那唐僧一般啰嗦，限定200字', () => {});
                      return;
                    }
                    
                    try {
                      await handleFeedbackSubmit(content.trim());
                      showAlert('愿望已经收到！嗯，希望您有机会来还愿....', () => {
                        setShowFeedbackModal(false);
                      });
                    } catch (error) {
                      showAlert('灵山似乎在开Party。。。香火僧不在线，请施主等等再来。', () => {});
                    }
                  }}>
                    <div className="mb-4">
                      <textarea
                        name="content"
                        placeholder="尽量少提发财，毕竟佛祖自己都没钱....可以多提系统需求，这样我们才好找涨价的借口...."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={4}
                        maxLength={200}
                      />
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        请输入您的反馈意见，我们将持续改进产品
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                      提交反馈
                    </button>
                  </form>
                </div>

                {/* 右侧：微信群二维码 */}
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">💬 微信群交流</h3>
                  <div className="text-center">
                    <div className="mb-4">
                      <img 
                        src={wechatQrImageUrl} 
                        alt="微信群二维码" 
                        className="w-40 h-40 mx-auto border border-slate-200 dark:border-slate-600 rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/src/assets/wechat-w.png';
                        }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                      扫码加入微信群
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      在群里可以：<br/>
                      • 获得更及时的技术支持<br/>
                      • 与其他用户交流使用心得<br/>
                      • 第一时间了解产品更新<br/>
                      • 申请开通付费服务
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自定义Alert模态框 */}
      {alert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">提示</h2>
                <button 
                  onClick={() => setAlert(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              <div className="mb-6">
                <p className="text-slate-700 dark:text-slate-300">{alert.message}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleAlertConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
