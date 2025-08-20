import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface AiPromptConfig {
  _id?: string;
  subscriptionPlan: string;
  promptTemplate: string;
  maxTokens: number;
  analysisIntervalSeconds: number;
  analysisCategories: any;
  distractedSubtypes: any;
  isActive: boolean;
}

interface FeedbackMessage {
  _id?: string;
  characterRank: string;
  subscriptionPlan: string;
  studyState: string;
  distractedSubtype?: string;
  messages: string[];
  audioUrls?: string[];
  isActive: boolean;
}

const AdminAdvancedConfigView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai-prompts' | 'feedback' | 'subscription'>('ai-prompts');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI提示词配置状态
  const [aiPrompts, setAiPrompts] = useState<AiPromptConfig[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<AiPromptConfig | null>(null);

  // 反馈消息配置状态
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<FeedbackMessage | null>(null);

  // 订阅服务管理状态
  const [users, setUsers] = useState<any[]>([]);
  const [usersPagination, setUsersPagination] = useState({ current: 1, total: 1, hasNext: false, totalUsers: 0 });
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({ plan: 'STANDARD', days: 30 });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prompts, feedback] = await Promise.all([
        api.admin.configManager.aiPrompts.getAll(),
        api.admin.configManager.feedbackMessages.getAll()
      ]);
      setAiPrompts(prompts);
      setFeedbackMessages(feedback);
      if (activeTab === 'subscription') {
        await loadUsers();
      }
    } catch (err: any) {
      setError('加载数据失败：' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 订阅服务管理相关函数
   const loadUsers = async (page = 1, phone = '') => {
     try {
       const result = await api.admin.userManager.getAllUsers(page, 20, phone);
       setUsers(result.users);
       setUsersPagination(result.pagination);
     } catch (err: any) {
       setError('加载用户列表失败：' + err.message);
     }
   };

  const handleSearchUser = async () => {
    await loadUsers(1, searchPhone);
  };

  const handleGrantSubscription = async () => {
     if (!selectedUser) return;
     
     try {
       await api.admin.userManager.updateUserSubscription(selectedUser._id, {
         plan: subscriptionForm.plan,
         days: subscriptionForm.days
       });
       alert('订阅服务授予成功！');
       setSelectedUser(null);
       await loadUsers(usersPagination.current, searchPhone);
     } catch (err: any) {
       alert('授予失败：' + err.message);
     }
   };

  // AI提示词配置相关函数
  const handleSavePrompt = async (prompt: AiPromptConfig) => {
    try {
      await api.admin.configManager.aiPrompts.upsert(prompt);
      setEditingPrompt(null);
      loadData();
      alert('AI提示词配置保存成功！');
    } catch (err: any) {
      alert('保存失败：' + err.message);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm('确定要删除这个AI提示词配置吗？')) {
      try {
        await api.admin.configManager.aiPrompts.delete(id);
        loadData();
        alert('删除成功！');
      } catch (err: any) {
        alert('删除失败：' + err.message);
      }
    }
  };

  // 反馈消息配置相关函数
  const handleSaveFeedback = async (feedback: FeedbackMessage) => {
    try {
      await api.admin.configManager.feedbackMessages.upsert(feedback);
      setEditingFeedback(null);
      loadData();
      alert('反馈消息配置保存成功！');
    } catch (err: any) {
      alert('保存失败：' + err.message);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (confirm('确定要删除这个反馈消息配置吗？')) {
      try {
        await api.admin.configManager.feedbackMessages.delete(id);
        loadData();
        alert('删除成功！');
      } catch (err: any) {
        alert('删除失败：' + err.message);
      }
    }
  };
  
  // 根据选择的条件查找匹配的反馈消息
  const findMatchingFeedbackMessages = (characterRank: string, subscriptionPlan: string, studyState: string, distractedSubtype?: string) => {
    const matchingMessages = feedbackMessages.filter(feedback => {
      // 基本匹配条件
      const basicMatch = feedback.characterRank === characterRank && 
                         feedback.subscriptionPlan === subscriptionPlan && 
                         feedback.studyState === studyState;
      
      // 如果是分心状态且指定了分心类型，则需要匹配分心类型
      if (studyState === 'DISTRACTED' && distractedSubtype) {
        return basicMatch && feedback.distractedSubtype === distractedSubtype;
      }
      
      // 如果是分心状态但没有指定分心类型，则匹配所有该状态的消息
      if (studyState === 'DISTRACTED' && !distractedSubtype) {
        return basicMatch;
      }
      
      // 其他状态直接返回基本匹配结果
      return basicMatch;
    });
    
    return matchingMessages;
  };

  const renderAiPromptsTab = () => {
    // 获取订阅计划名称
    const getSubscriptionName = (plan: string) => {
      switch(plan) {
        case 'TRIAL': return '试用版';
        case 'STANDARD': return '标准版';
        case 'PRO': return '专业版';
        default: return plan;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">AI提示词配置</h2>
          <button
            onClick={() => setEditingPrompt({
              subscriptionPlan: 'STANDARD',
              promptTemplate: '',
              maxTokens: 100,
              analysisIntervalSeconds: 30,
              analysisCategories: {},
              distractedSubtypes: {},
              isActive: true
            })}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            添加新配置
          </button>
        </div>

        {editingPrompt && (
          <div className="bg-gray-50 p-6 rounded-lg border shadow-md">
            <h3 className="text-lg font-medium mb-4">
              {editingPrompt._id ? '编辑' : '添加'}AI提示词配置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">订阅计划</label>
                <select
                    value={editingPrompt.subscriptionPlan}
                    onChange={(e) => setEditingPrompt({...editingPrompt, subscriptionPlan: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingPrompt._id}
                  >
                  <option value="TRIAL">试用版</option>
                  <option value="STANDARD">标准版</option>
                  <option value="PRO">专业版</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">最大Token数</label>
                <input
                  type="number"
                  value={editingPrompt.maxTokens}
                  onChange={(e) => setEditingPrompt({...editingPrompt, maxTokens: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">分析间隔 (秒)</label>
                <input
                  type="number"
                  value={editingPrompt.analysisIntervalSeconds}
                  onChange={(e) => setEditingPrompt({...editingPrompt, analysisIntervalSeconds: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">状态</label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={editingPrompt.isActive === true}
                      onChange={() => setEditingPrompt({...editingPrompt, isActive: true})}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm">启用</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={editingPrompt.isActive === false}
                      onChange={() => setEditingPrompt({...editingPrompt, isActive: false})}
                      className="form-radio h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm">禁用</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">提示词模板</label>
              <textarea
                value={editingPrompt.promptTemplate}
                onChange={(e) => setEditingPrompt({...editingPrompt, promptTemplate: e.target.value})}
                rows={10}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="输入AI分析提示词..."
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleSavePrompt(editingPrompt)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存
              </button>
              <button
                onClick={() => setEditingPrompt(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {aiPrompts.map((prompt) => (
            <div key={prompt._id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-lg">{getSubscriptionName(prompt.subscriptionPlan)}</h4>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      prompt.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {prompt.isActive ? '启用' : '禁用'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    最大Token: {prompt.maxTokens}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium">提示词模板:</p>
                    <div className="bg-gray-50 p-2 rounded text-sm mt-1 max-h-32 overflow-y-auto font-mono">
                      {prompt.promptTemplate}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setEditingPrompt(prompt)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt._id!)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeedbackTab = () => {
    // 对反馈消息进行分类
    const groupedFeedbacks: { [key: string]: FeedbackMessage[] } = {};
    
    feedbackMessages.forEach(feedback => {
      const key = `${feedback.characterRank}-${feedback.subscriptionPlan}`;
      if (!groupedFeedbacks[key]) {
        groupedFeedbacks[key] = [];
      }
      groupedFeedbacks[key].push(feedback);
    });

    // 获取角色名称
    const getCharacterName = (rank: string) => {
      switch(rank) {
        case 'WUKONG': return '悟空';
        default: return rank;
      }
    };

    // 获取订阅计划名称
    const getSubscriptionName = (plan: string) => {
      switch(plan) {
        case 'TRIAL': return '试用版';
        case 'STANDARD': return '标准版';
        case 'PRO': return '专业版';
        default: return plan;
      }
    };

    // 获取学习状态名称
    const getStudyStateName = (state: string) => {
      switch(state) {
        case 'FOCUSED': return '专注';
        case 'DISTRACTED': return '分心';
        case 'OFF_SEAT': return '离座';
        default: return state;
      }
    };

    // 获取分心类型名称
    const getDistractedSubtypeName = (type: string | undefined) => {
      if (!type) return '';
      switch(type) {
        case 'PLAY': return '玩弄物品';
        case 'DISTRACTED': return '视线偏离';
        case 'ZONE': return '发呆走神';
        case 'TALK': return '与人互动';
        case 'SLEEP': return '趴睡';
        default: return type;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">反馈消息配置</h2>
          <div className="flex space-x-3">
            <button
              onClick={async () => {
                if (confirm('确定要初始化所有反馈消息吗？这将重置为默认配置。')) {
                  try {
                    setIsLoading(true);
                    await api.admin.configManager.feedbackMessages.initialize();
                    loadData();
                    alert('反馈消息初始化成功！');
                  } catch (err: any) {
                    alert('初始化失败：' + err.message);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              初始化默认消息
            </button>
            <button
              onClick={() => setEditingFeedback({
                characterRank: 'WUKONG',
                subscriptionPlan: 'STANDARD',
                studyState: 'FOCUSED',
                messages: [''],
                isActive: true
              })}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加反馈词
            </button>
          </div>
        </div>

        {editingFeedback && (
          <div className="bg-gray-50 p-6 rounded-lg border shadow-md">
            <h3 className="text-lg font-medium mb-4">
              {editingFeedback._id ? '编辑' : '添加'}反馈消息配置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">角色等级</label>
                <div className="w-full p-2 border rounded bg-gray-100 text-gray-700">
                  悟空 (固定角色)
                </div>
                <input type="hidden" value="WUKONG" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">订阅计划</label>
                <select
                  value={editingFeedback.subscriptionPlan}
                  onChange={(e) => {
                    const newSubscriptionPlan = e.target.value;
                    // 查找匹配的消息
                    const matchingMessages = findMatchingFeedbackMessages(
                      editingFeedback.characterRank, 
                      newSubscriptionPlan, 
                      editingFeedback.studyState, 
                      editingFeedback.distractedSubtype
                    );
                    
                    // 如果找到匹配的消息，使用第一个匹配项的消息列表，否则保持当前消息列表
                    const messages = matchingMessages.length > 0 
                      ? [...matchingMessages[0].messages] 
                      : editingFeedback.messages;
                    
                    setEditingFeedback({
                      ...editingFeedback, 
                      subscriptionPlan: newSubscriptionPlan,
                      messages: messages
                    });
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TRIAL">试用版（使用专业版反馈词）</option>
                  <option value="STANDARD">标准版</option>
                  <option value="PRO">专业版</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">学习状态</label>
                <select
                  value={editingFeedback.studyState}
                  onChange={(e) => {
                    const newStudyState = e.target.value;
                    // 如果从分心状态切换到其他状态，清除分心类型
                    const newDistractedSubtype = newStudyState === 'DISTRACTED' 
                      ? editingFeedback.distractedSubtype 
                      : undefined;
                    
                    // 查找匹配的消息
                    const matchingMessages = findMatchingFeedbackMessages(
                      editingFeedback.characterRank, 
                      editingFeedback.subscriptionPlan, 
                      newStudyState, 
                      newDistractedSubtype
                    );
                    
                    // 如果找到匹配的消息，使用第一个匹配项的消息列表，否则保持当前消息列表
                    const messages = matchingMessages.length > 0 
                      ? [...matchingMessages[0].messages] 
                      : editingFeedback.messages;
                    
                    setEditingFeedback({
                      ...editingFeedback, 
                      studyState: newStudyState,
                      distractedSubtype: newDistractedSubtype,
                      messages: messages
                    });
                  }}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FOCUSED">专注</option>
                  <option value="DISTRACTED">分心</option>
                  <option value="OFF_SEAT">离座</option>
                </select>
              </div>
              {editingFeedback.studyState === 'DISTRACTED' && (
                <div>
                  <label className="block text-sm font-medium mb-2">分心类型</label>
                  <select
                    value={editingFeedback.distractedSubtype || ''}
                    onChange={(e) => {
                      const newDistractedSubtype = e.target.value || undefined;
                      
                      // 查找匹配的消息
                      const matchingMessages = findMatchingFeedbackMessages(
                        editingFeedback.characterRank, 
                        editingFeedback.subscriptionPlan, 
                        editingFeedback.studyState, 
                        newDistractedSubtype
                      );
                      
                      // 如果找到匹配的消息，使用第一个匹配项的消息列表，否则保持当前消息列表
                      const messages = matchingMessages.length > 0 
                        ? [...matchingMessages[0].messages] 
                        : editingFeedback.messages;
                      
                      setEditingFeedback({
                        ...editingFeedback, 
                        distractedSubtype: newDistractedSubtype,
                        messages: messages
                      });
                    }}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">选择分心类型</option>
                    <option value="PLAY">玩弄物品</option>
                    <option value="DISTRACTED">视线偏离</option>
                    <option value="ZONE">发呆走神</option>
                    <option value="TALK">与人互动</option>
                    <option value="SLEEP">趴睡</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">反馈消息列表</label>
                <button
                  onClick={() => {
                    const newMessages = [...editingFeedback.messages, ''];
                    const newAudioUrls = [...(editingFeedback.audioUrls || []), ''];
                    setEditingFeedback({
                      ...editingFeedback, 
                      messages: newMessages,
                      audioUrls: newAudioUrls
                    });
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加消息
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg border max-h-60 overflow-y-auto">
                {editingFeedback.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无消息，请添加</p>
                ) : (
                  editingFeedback.messages.map((message, index) => {
                    const audioUrl = editingFeedback.audioUrls?.[index] || '';
                    return (
                      <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-gray-500 text-sm font-medium">{index + 1}.</span>
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => {
                              const newMessages = [...editingFeedback.messages];
                              newMessages[index] = e.target.value;
                              setEditingFeedback({...editingFeedback, messages: newMessages});
                            }}
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="输入反馈消息"
                          />
                          <button
                            onClick={() => {
                              const newMessages = editingFeedback.messages.filter((_, i) => i !== index);
                              const newAudioUrls = editingFeedback.audioUrls?.filter((_, i) => i !== index) || [];
                              setEditingFeedback({
                                ...editingFeedback, 
                                messages: newMessages,
                                audioUrls: newAudioUrls
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="删除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* 语音文件管理 */}
                        <div className="flex items-center space-x-2 ml-6">
                          <span className="text-sm text-gray-600">语音文件:</span>
                          {audioUrl ? (
                            <div className="flex items-center space-x-2">
                              <audio controls className="h-8">
                                <source src={`${import.meta.env.VITE_API_BASE_URL}${audioUrl}`} type="audio/mpeg" />
                                您的浏览器不支持音频播放
                              </audio>
                              <button
                                onClick={async () => {
                                  try {
                                    const filename = audioUrl.split('/').pop();
                                    if (filename) {
                                      await api.admin.audioManager.delete(filename);
                                      const newAudioUrls = [...(editingFeedback.audioUrls || [])];
                                      newAudioUrls[index] = '';
                                      setEditingFeedback({...editingFeedback, audioUrls: newAudioUrls});
                                      alert('语音文件删除成功！');
                                    }
                                  } catch (err: any) {
                                    alert('删除失败：' + err.message);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                                title="删除语音文件"
                              >
                                删除
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const result = await api.admin.audioManager.upload(file);
                                      const newAudioUrls = [...(editingFeedback.audioUrls || new Array(editingFeedback.messages.length).fill(''))];
                                      newAudioUrls[index] = result.audioUrl;
                                      setEditingFeedback({...editingFeedback, audioUrls: newAudioUrls});
                                      alert('语音文件上传成功！');
                                    } catch (err: any) {
                                      alert('上传失败：' + err.message);
                                    }
                                  }
                                }}
                                className="text-sm"
                              />
                              <span className="text-xs text-gray-500">支持mp3, wav等音频格式</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleSaveFeedback(editingFeedback)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存
              </button>
              <button
                onClick={() => setEditingFeedback(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                取消
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-medium">反馈消息列表</h3>
          </div>
          
          <div className="divide-y">
            {Object.keys(groupedFeedbacks).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                暂无反馈消息配置，请添加
              </div>
            ) : (
              Object.keys(groupedFeedbacks).map(key => {
                const [characterRank, subscriptionPlan] = key.split('-');
                const feedbacks = groupedFeedbacks[key];
                
                return (
                  <div key={key} className="p-4">
                    <div className="flex items-center mb-3">
                      <h4 className="font-medium text-lg">
                        {getCharacterName(characterRank)} - {getSubscriptionName(subscriptionPlan)}
                      </h4>
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {feedbacks.length}条配置
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {feedbacks.map(feedback => (
                        <div key={feedback._id} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">{getStudyStateName(feedback.studyState)}</span>
                              {feedback.distractedSubtype && (
                                <span className="ml-1 text-sm text-gray-600">
                                  ({getDistractedSubtypeName(feedback.distractedSubtype)})
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingFeedback(feedback)}
                                className="text-blue-500 hover:text-blue-700"
                                title="编辑"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(feedback._id!)}
                                className="text-red-500 hover:text-red-700"
                                title="删除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                            {feedback.messages.map((message, index) => (
                              <div key={index} className="mb-1 flex">
                                <span className="text-gray-400 mr-1">{index + 1}.</span>
                                <span>{message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">订阅服务管理</h2>
        </div>

        {/* 用户搜索 */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">手机号搜索</label>
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="输入手机号搜索用户"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearchUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-medium">用户列表 (共{usersPagination.totalUsers}个用户)</h3>
          </div>
          <div className="divide-y">
            {users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                暂无用户数据
              </div>
            ) : (
              users.map(user => (
                <div key={user._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{user.phone}</div>
                      <div className="text-sm text-gray-600">
                        当前订阅: {user.subscription?.plan || '无'}
                        {user.subscription?.expiresAt && (
                          <span className="ml-2">
                            到期时间: {new Date(user.subscription.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      授予订阅
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 分页 */}
          {usersPagination.total > 1 && (
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                第 {usersPagination.current} 页，共 {usersPagination.total} 页
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => loadUsers(usersPagination.current - 1, searchPhone)}
                  disabled={usersPagination.current === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  上一页
                </button>
                <button
                  onClick={() => loadUsers(usersPagination.current + 1, searchPhone)}
                  disabled={!usersPagination.hasNext}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 授予订阅弹窗 */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">授予订阅服务</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">用户</label>
                  <div className="p-2 bg-gray-100 rounded">{selectedUser.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">订阅计划</label>
                  <select
                    value={subscriptionForm.plan}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, plan: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="STANDARD">标准版</option>
                    <option value="PRO">专业版</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">有效天数</label>
                  <input
                    type="number"
                    value={subscriptionForm.days}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, days: Number(e.target.value)})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleGrantSubscription}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex-1"
                >
                  确认授予
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex-1"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">错误: {error}</div>
        <button
          onClick={loadData}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">高级配置管理</h1>
      
      {/* 标签导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ai-prompts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai-prompts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            AI提示词配置
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            反馈消息配置
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscription'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            订阅服务管理
          </button>
        </nav>
      </div>

      {/* 标签内容 */}
      {activeTab === 'ai-prompts' && renderAiPromptsTab()}
      {activeTab === 'feedback' && renderFeedbackTab()}
      {activeTab === 'subscription' && renderSubscriptionTab()}
    </div>
  );
};

export default AdminAdvancedConfigView;