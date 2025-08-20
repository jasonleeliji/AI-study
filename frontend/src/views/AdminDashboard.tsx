import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UsersIcon, ChatBubbleLeftRightIcon, CpuChipIcon, CogIcon } from '../components/common/Icons';
import AdminConfigView from './AdminConfigView';

// 管理后台API服务
const adminApi = {
  getDashboardStats: async () => {
    const adminKey = localStorage.getItem('adminKey');
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    const response = await fetch(`${baseURL}/api/admin/dashboard/stats`, {
      headers: {
        'X-Admin-Key': adminKey || ''
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取数据失败: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  },
  
  getUsersTokenStats: async (page = 1, limit = 20, sortBy = 'totalTokens', sortOrder = 'desc') => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseURL}/api/admin/users/token-stats?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
      headers: {
        'X-Admin-Key': localStorage.getItem('adminKey') || ''
      }
    });
    if (!response.ok) throw new Error('获取用户数据失败');
    return response.json();
  },
  
  getFeedbackList: async (page = 1, limit = 20) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseURL}/api/admin/feedback?page=${page}&limit=${limit}`, {
      headers: {
        'X-Admin-Key': localStorage.getItem('adminKey') || ''
      }
    });
    if (!response.ok) throw new Error('获取反馈数据失败');
    return response.json();
  },
  
  deleteFeedback: async (id: string) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseURL}/api/admin/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': localStorage.getItem('adminKey') || ''
      }
    });
    if (!response.ok) throw new Error('删除反馈失败');
    return response.json();
  }
};

interface DashboardStats {
  todayActiveUsers: number;
  totalUsers: number;
  todayNewUsers: number;
  todaySessionCount: number;
  onlineUsers: number;
  todayTokenStats: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    analysisCount: number;
  };
}

interface UserTokenStats {
  _id: string;
  phone: string;
  createdAt: string;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalAnalysisCount: number;
  todayTokens: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayAnalysisCount: number;
}

interface Feedback {
  _id: string;
  content: string;
  createdAt: string;
  user: {
    phone: string;
    createdAt: string;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'feedback' | 'config' | 'advanced-config'>('dashboard');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化时检查localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('adminKey');
    
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
    }
  }, []);
  
  // 数据看板状态
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // 用户统计状态
  const [usersData, setUsersData] = useState<UserTokenStats[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState({ current: 1, total: 1, hasNext: false, totalCount: 0 });
  const [overallStats, setOverallStats] = useState({ totalTokens: 0, inputTokens: 0, outputTokens: 0, analysisCount: 0 });
  
  // 反馈状态
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackPagination, setFeedbackPagination] = useState({ current: 1, total: 1, hasNext: false, totalCount: 0 });

  const handleLogin = () => {
    if (adminKey.trim()) {
      localStorage.setItem('adminKey', adminKey.trim());
      setIsAuthenticated(true);
      loadDashboardStats();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  // 清除错误的密钥
  const clearStorage = () => {
    localStorage.removeItem('adminKey');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  const loadDashboardStats = async () => {
    setDashboardLoading(true);
    try {
      const response = await adminApi.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error('加载数据看板失败:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadUsersData = async (page = 1) => {
    setUsersLoading(true);
    try {
      const response = await adminApi.getUsersTokenStats(page);
      setUsersData(response.data.users);
      setUsersPagination(response.data.pagination);
      setOverallStats(response.data.overallStats);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadFeedbacks = async (page = 1) => {
    setFeedbackLoading(true);
    try {
      const response = await adminApi.getFeedbackList(page);
      setFeedbacks(response.data.feedbacks);
      setFeedbackPagination(response.data.pagination);
    } catch (error) {
      console.error('加载反馈数据失败:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (confirm('确定要删除这条反馈吗？')) {
      try {
        await adminApi.deleteFeedback(id);
        loadFeedbacks(feedbackPagination.current);
      } catch (error) {
        console.error('删除反馈失败:', error);
        alert('删除反馈失败');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'dashboard') {
        loadDashboardStats();
      } else if (activeTab === 'users') {
        loadUsersData();
      } else if (activeTab === 'feedback') {
        loadFeedbacks();
      }
    }
  }, [activeTab, isAuthenticated]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6">系统管理后台</h1>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="请输入管理员密钥"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              登录
            </button>
            <button
              onClick={clearStorage}
              className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              清除缓存
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">AI学习系统管理后台</h1>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 标签导航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'dashboard', label: '数据看板', icon: ChartBarIcon },
              { key: 'users', label: 'Token统计', icon: CpuChipIcon },
              { key: 'feedback', label: '用户反馈', icon: ChatBubbleLeftRightIcon },
              { key: 'config', label: '系统配置', icon: CogIcon },
              { key: 'advanced-config', label: '高级配置', icon: CogIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-lg font-medium text-gray-900 mb-6">数据看板</h2>
            
            {dashboardLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : dashboardStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 今日活跃用户 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">今日活跃用户</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.todayActiveUsers)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 总用户数 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">总用户数</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.totalUsers)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 今日新用户 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">今日新用户</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.todayNewUsers)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 当前在线用户 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">当前在线</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.onlineUsers)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 今日学习会话 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">今日学习会话</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.todaySessionCount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 今日Token消耗 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CpuChipIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">今日Token消耗</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.todayTokenStats.totalTokens)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 今日分析次数 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CpuChipIcon />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">今日分析次数</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatNumber(dashboardStats.todayTokenStats.analysisCount)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">暂无数据</div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">用户Token使用统计</h2>
              <button
                onClick={() => loadUsersData(1)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                刷新数据
              </button>
            </div>

            {/* 总计统计 */}
            <div className="bg-white shadow rounded-lg mb-6 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">总计统计</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(overallStats.totalTokens)}</div>
                  <div className="text-sm text-gray-500">总Token消耗</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(overallStats.inputTokens)}</div>
                  <div className="text-sm text-gray-500">输入Token</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(overallStats.outputTokens)}</div>
                  <div className="text-sm text-gray-500">输出Token</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatNumber(overallStats.analysisCount)}</div>
                  <div className="text-sm text-gray-500">分析次数</div>
                </div>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">今日Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">今日分析</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总Token</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总分析</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersData.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(user.todayTokens)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(user.todayAnalysisCount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(user.totalTokens)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(user.totalAnalysisCount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadUsersData(usersPagination.current - 1)}
                      disabled={usersPagination.current <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => loadUsersData(usersPagination.current + 1)}
                      disabled={!usersPagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        显示第 <span className="font-medium">{(usersPagination.current - 1) * 20 + 1}</span> 到{' '}
                        <span className="font-medium">{Math.min(usersPagination.current * 20, usersPagination.totalCount)}</span> 条，
                        共 <span className="font-medium">{usersPagination.totalCount}</span> 条记录
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => loadUsersData(usersPagination.current - 1)}
                          disabled={usersPagination.current <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          上一页
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {usersPagination.current} / {usersPagination.total}
                        </span>
                        <button
                          onClick={() => loadUsersData(usersPagination.current + 1)}
                          disabled={!usersPagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          下一页
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">用户反馈管理</h2>
              <button
                onClick={() => loadFeedbacks(1)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                刷新数据
              </button>
            </div>

            {feedbackLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {feedbacks.map((feedback) => (
                    <li key={feedback._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              用户: {feedback.user.phone}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-500">
                                {formatDate(feedback.createdAt)}
                              </p>
                              <button
                                onClick={() => handleDeleteFeedback(feedback._id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {feedback.content}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* 分页 */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadFeedbacks(feedbackPagination.current - 1)}
                      disabled={feedbackPagination.current <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => loadFeedbacks(feedbackPagination.current + 1)}
                      disabled={!feedbackPagination.hasNext}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        显示第 <span className="font-medium">{(feedbackPagination.current - 1) * 20 + 1}</span> 到{' '}
                        <span className="font-medium">{Math.min(feedbackPagination.current * 20, feedbackPagination.totalCount)}</span> 条，
                        共 <span className="font-medium">{feedbackPagination.totalCount}</span> 条记录
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => loadFeedbacks(feedbackPagination.current - 1)}
                          disabled={feedbackPagination.current <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          上一页
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {feedbackPagination.current} / {feedbackPagination.total}
                        </span>
                        <button
                          onClick={() => loadFeedbacks(feedbackPagination.current + 1)}
                          disabled={!feedbackPagination.hasNext}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          下一页
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="px-4 py-6 sm:px-0">
            <AdminConfigView />
          </div>
        )}

        {activeTab === 'advanced-config' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">高级配置管理</h2>
              <p className="text-gray-600 mb-4">
                管理AI提示词、反馈消息和角色配置等高级设置。
              </p>
              <a
                href="/admin/advanced-config"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                进入高级配置管理
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;