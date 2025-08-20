import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import AdminDashboard from './views/AdminDashboard';
import AdminConfigView from './views/AdminConfigView';
import AdminAdvancedConfigView from './views/AdminAdvancedConfigView';
import Spinner from './components/common/Spinner';
import { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [gamificationStage, setGamificationStage] = useState<'STONE_MONKEY' | 'CAVE_MASTER' | 'MONKEY_KING' | 'TOTAL_MONKEY_KING'>('STONE_MONKEY');

  // 获取用户的游戏化阶段
  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          const { data } = await api.user.getProfile();
          setGamificationStage(data.gamificationStage);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      };
      fetchProfile();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <Spinner size="lg" />
       </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full flex-grow">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/config" element={<AdminConfigView />} />
          <Route path="/admin/advanced-config" element={<AdminAdvancedConfigView />} />
          <Route 
            path="/*" 
            element={isAuthenticated ? <DashboardView gamificationStage={gamificationStage} onGamificationStageChange={setGamificationStage} /> : <AuthView />} 
          />
        </Routes>
      </div>
      {isAuthenticated && (
        <footer className="w-full text-center text-xs text-white/70 bg-black/20 backdrop-blur-sm py-4 z-10">
            <p>请确保在光线充足、环境安静的地方使用本系统。家长应在附近陪同。</p>
            <p>&copy; {new Date().getFullYear()} 悟空伴读. All Rights Reserved.</p>
        </footer>
      )}
    </div>
  );
}

export default App;