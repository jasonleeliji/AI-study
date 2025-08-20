import React, { useState } from 'react';
import api from '../services/api';

interface ChangePasswordViewProps {
  onClose: () => void;
}

const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 验证输入
        if (newPassword !== confirmPassword) {
            setError('新密码和确认密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            setError('新密码长度至少6位');
            return;
        }

        if (currentPassword === newPassword) {
            setError('新密码不能与当前密码相同');
            return;
        }

        setIsLoading(true);

        try {
            await api.auth.changePassword(currentPassword, newPassword);
            setSuccess('密码修改成功');
            
            // 2秒后关闭弹窗
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('当前密码错误');
            } else {
                setError(err.response?.data?.message || '密码修改失败，请稍后重试');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-yellow-400">修改密码</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-300 transition-colors duration-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-slate-300 mb-1">
                            当前密码
                        </label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="请输入当前密码"
                            className="w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-1">
                            新密码
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="请输入新密码（至少6位）"
                            className="w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-300 mb-1">
                            确认新密码
                        </label>
                        <input
                            id="confirm-new-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="请再次输入新密码"
                            className="w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-600 rounded-md">
                            <p className="text-red-300 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-900/50 border border-green-600 rounded-md">
                            <p className="text-green-300 text-sm text-center">{success}</p>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 transition-all duration-300"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-900 rounded-md hover:from-yellow-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60 transition-all duration-300"
                        >
                            {isLoading ? '修改中...' : '确认修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordView;