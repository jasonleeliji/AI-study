import React, { useState } from 'react';
import api from '../services/api';

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
}

const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBackToLogin }) => {
    const [step, setStep] = useState<'phone' | 'verify' | 'reset'>('phone');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // 发送验证码
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.auth.forgotPassword.sendCode(phone);
            setSuccess('验证码已发送到您的手机');
            setStep('verify');
            
            // 开始倒计时
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('该手机号未注册，请先注册账户');
            } else {
                setError(err.response?.data?.message || '发送验证码失败，请稍后重试');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // 验证验证码
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.auth.forgotPassword.verifyCode(phone, code);
            setSuccess('验证码验证成功');
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.message || '验证码验证失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 重置密码
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            setError('密码长度至少6位');
            return;
        }

        setIsLoading(true);

        try {
            await api.auth.forgotPassword.resetPassword(phone, code, newPassword);
            setSuccess('密码重置成功，请使用新密码登录');
            setTimeout(() => {
                onBackToLogin();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || '密码重置失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    const renderPhoneStep = () => (
        <form onSubmit={handleSendCode} className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-blue-400">找回密码</h2>
            <div>
                <label htmlFor="phone-forgot" className="block text-sm font-medium text-slate-300">手机号码</label>
                <input
                    id="phone-forgot"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入注册时的手机号码"
                    className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400 disabled:opacity-60 transition-all duration-300"
            >
                {isLoading ? '发送中...' : '发送验证码'}
            </button>
        </form>
    );

    const renderVerifyStep = () => (
        <form onSubmit={handleVerifyCode} className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-blue-400">验证手机号</h2>
            <p className="text-center text-slate-300">验证码已发送至 {phone}</p>
            <div>
                <label htmlFor="code-verify" className="block text-sm font-medium text-slate-300">验证码</label>
                <input
                    id="code-verify"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400 disabled:opacity-60 transition-all duration-300"
            >
                {isLoading ? '验证中...' : '验证'}
            </button>
            <div className="text-center">
                <button
                    type="button"
                    onClick={countdown > 0 ? undefined : handleSendCode}
                    disabled={countdown > 0}
                    className="text-sm text-blue-400 hover:text-blue-300 disabled:text-slate-500 transition-colors duration-300"
                >
                    {countdown > 0 ? `重新发送(${countdown}s)` : '重新发送验证码'}
                </button>
            </div>
        </form>
    );

    const renderResetStep = () => (
        <form onSubmit={handleResetPassword} className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-blue-400">设置新密码</h2>
            <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-300">新密码</label>
                <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                    className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                    required
                />
            </div>
            <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300">确认密码</label>
                <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-400 disabled:opacity-60 transition-all duration-300"
            >
                {isLoading ? '重置中...' : '重置密码'}
            </button>
        </form>
    );

    return (
        <div>
            {step === 'phone' && renderPhoneStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'reset' && renderResetStep()}
            
            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded-md">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
            )}
            
            {success && (
                <div className="mt-4 p-3 bg-green-900/50 border border-green-600 rounded-md">
                    <p className="text-green-300 text-sm text-center">{success}</p>
                </div>
            )}
            
            <div className="mt-6 text-center">
                <button 
                    type="button" 
                    onClick={onBackToLogin} 
                    className="text-sm text-slate-400 hover:text-slate-300 transition-colors duration-300"
                >
                    返回登录
                </button>
            </div>
        </div>
    );
};

export default ForgotPasswordView;