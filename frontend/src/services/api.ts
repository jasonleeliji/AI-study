import axios from 'axios';
import { TokenStats, TokenHistoryItem } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or other auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired.
      // Clear local storage and redirect to login.
      localStorage.removeItem('token');
      // The AuthContext will handle the redirect.
      if (typeof window !== 'undefined') {
        (window as any).dispatchEvent(new Event('auth-error'));
      }
    }
    return Promise.reject(error);
  }
);

// API方法分类组织
const api = {
  // 认证相关
  auth: {
    login: (data: { phone: string; password: string }) =>
      apiClient.post('/auth/login', data),
    register: (data: { phone: string; password: string }) =>
      apiClient.post('/auth/register', data),
    getStatus: () => apiClient.get('/auth/status'),
    sendCode: (data: { phone: string }) =>
      apiClient.post('/auth/send-code', data),
    verifyCode: (data: { phone: string; code: string }) =>
      apiClient.post('/auth/verify-code', data),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    forgotPassword: {
      sendCode: (phone: string) =>
        apiClient.post('/auth/forgot-password/send-code', { phone }),
      verifyCode: (phone: string, code: string) =>
        apiClient.post('/auth/forgot-password/verify-code', { phone, code }),
      resetPassword: (phone: string, code: string, newPassword: string) =>
        apiClient.post('/auth/forgot-password/reset', { phone, code, newPassword }),
    },
  },
  
  // Token统计相关
  token: {
    getStats: (): Promise<{ data: TokenStats }> =>
      apiClient.get('/token/stats'),
    
    getHistory: (page: number = 1, limit: number = 20): Promise<{
      data: {
        history: TokenHistoryItem[];
        pagination: {
          current: number;
          total: number;
          hasNext: boolean;
        };
      };
    }> =>
      apiClient.get(`/token/history?page=${page}&limit=${limit}`),
  },
  
  // 反馈相关
  feedback: {
    submit: (data: { content: string }) =>
      apiClient.post('/feedback', data),
  },

  // 用户相关
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data: any) => apiClient.put('/users/profile', data),
  },

  // 订阅相关
  subscription: {
    createOrder: (data: { plan: string }) =>
      apiClient.post('/subscription/create-order', data),
  },

  // 报告相关
  reports: {
    getReport: (period: string) =>
      apiClient.get(`/reports/${period}`),
    deleteAll: () =>
      apiClient.delete('/reports/all'),
  },
  
  sessions: {
    getCurrent: () => apiClient.get('/sessions/current'),
    start: () => apiClient.post('/sessions/start', {}),
    stop: () => apiClient.post('/sessions/stop', {}),
    resume: () => apiClient.post('/sessions/resume', {}),
    break: (type: string) => apiClient.post('/sessions/break', { type })
  },
  
  supervision: {
    analyze: (base64Image: string) => apiClient.post('/supervision/analyze', { base64Image })
  },
  
  config: {
    getAppConfig: () => apiClient.get('/config').then(res => res.data),
    updateAppConfig: (data: any) => apiClient.put('/config', data, {
      headers: { 'x-admin-key': localStorage.getItem('adminKey') }
    }).then(res => res.data),
    getPlanDetails: () => apiClient.get('/config/plan-details').then(res => res.data),
    getUITextConfig: (plan: string) => apiClient.get(`/config/ui-text?plan=${plan}`).then(res => res.data),
  },

  // 管理员配置管理
  admin: {
    configManager: {
      // AI提示词配置
      aiPrompts: {
        getAll: () => apiClient.get('/admin/config-manager/ai-prompts', {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        get: (subscriptionPlan: string) => apiClient.get(`/admin/config-manager/ai-prompts/${subscriptionPlan}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        upsert: (data: any) => apiClient.post('/admin/config-manager/ai-prompts', data, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        delete: (id: string) => apiClient.delete(`/admin/config-manager/ai-prompts/${id}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
      },
      // 反馈消息配置
      feedbackMessages: {
        getAll: () => apiClient.get('/admin/config-manager/feedback-messages', {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        upsert: (data: any) => apiClient.post('/admin/config-manager/feedback-messages', data, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        delete: (id: string) => apiClient.delete(`/admin/config-manager/feedback-messages/${id}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
        initialize: () => apiClient.post('/admin/config-manager/feedback-messages/initialize', {}, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data)
      }
    },
    // 语音管理
    audioManager: {
      upload: (file: File) => {
        const formData = new FormData();
        formData.append('audio', file);
        return apiClient.post('/admin/audio-manager/upload', formData, {
          headers: { 
            'x-admin-key': localStorage.getItem('adminKey'),
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.data);
      },
      uploadMultiple: (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('audios', file));
        return apiClient.post('/admin/audio-manager/upload-multiple', formData, {
          headers: { 
            'x-admin-key': localStorage.getItem('adminKey'),
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.data);
      },
      delete: (filename: string) => apiClient.delete(`/admin/audio-manager/${filename}`, {
        headers: { 'x-admin-key': localStorage.getItem('adminKey') }
      }).then(res => res.data),
      updateFeedbackAudio: (data: { feedbackId: string; messageIndex: number; audioUrl: string }) => 
        apiClient.post('/admin/audio-manager/update-feedback-audio', data, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data)
    },
    // 图片管理
    imageManager: {
      uploadWechatQr: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return apiClient.post('/admin/image-manager/upload-wechat-qr', formData, {
          headers: { 
            'x-admin-key': localStorage.getItem('adminKey'),
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.data);
      },
      getWechatQr: () => apiClient.get('/admin/image-manager/wechat-qr').then(res => res.data),
      resetWechatQr: () => apiClient.post('/admin/image-manager/reset-wechat-qr', {}, {
        headers: { 'x-admin-key': localStorage.getItem('adminKey') }
      }).then(res => res.data)
    },

    // 用户管理
    userManager: {
      getAllUsers: (page: number = 1, limit: number = 20, search: string = '') => 
        apiClient.get(`/admin/user-manager/users?page=${page}&limit=${limit}&search=${search}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
      
      searchUserByPhone: (phone: string) => 
        apiClient.get(`/admin/user-manager/users/search/${phone}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
      
      getUserDetails: (userId: string) => 
        apiClient.get(`/admin/user-manager/users/${userId}`, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data),
      
      updateUserSubscription: (userId: string, data: { plan: string; days: number }) => 
        apiClient.put(`/admin/user-manager/users/${userId}/subscription`, data, {
          headers: { 'x-admin-key': localStorage.getItem('adminKey') }
        }).then(res => res.data)
    },
  },
};

export default api;
