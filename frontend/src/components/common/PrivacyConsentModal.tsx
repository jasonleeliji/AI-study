import React, { useState } from 'react';
import PrivacyPolicy from '../common/PrivacyPolicy';
import api from '../../services/api'; // 引入api

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onAgree, onDisagree }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false); // 用于发送验证码按钮
  const [isVerifying, setIsVerifying] = useState(false); // 用于验证按钮
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'consent' | 'phone' | 'verify'>('consent');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAgree = () => {
    if (!isChecked) {
      setError('请先同意协议');
      return;
    }
    setStep('phone');
    setError('');
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('请输入手机号码');
      return;
    }

    if (!/^\d{11}$/.test(phoneNumber)) {
      setError('请输入有效的11位手机号码');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      await api.auth.sendCode({ phone: phoneNumber });
      setStep('verify');
    } catch (err: any) {
      // 使用用户友好的错误提示替代原始错误信息
      setError('发送验证码失败，请稍后再试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await api.auth.verifyCode({ phone: phoneNumber, code: verificationCode });
      onAgree();
    } catch (err: any) {
      // 使用用户友好的错误提示替代原始错误信息
      setError('验证码错误，请重新输入');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisagree = () => {
    onDisagree();
    // 重置状态
    setIsChecked(false);
    setStep('consent');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl text-amber-600 dark:text-amber-400 font-bold text-center flex-grow">娃儿，乖！把你家大人喊过来...</h2>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-center flex-grow">🎪 儿童隐私马戏团协议</h2>
            <button 
              onClick={handleDisagree}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
            >
              &times;
            </button>
          </div>

          {step === 'consent' && (
            <>
              <PrivacyPolicy />
              
              <div className="flex items-center mb-4">
                <input
                  id="consent-checkbox"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                />
                <label htmlFor="consent-checkbox" className="ml-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  我同意！并承诺：发现漏洞先骂阿里再骂腾讯，最后才骂你们
                </label>
              </div>
              
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDisagree}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
                >
                  不同意
                </button>
                <button
                  onClick={handleAgree}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  同意协议
                </button>
              </div>
            </>
          )}

          {step === 'phone' && (
            <div>
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  请输入监护人手机号
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="请输入11位手机号"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setStep('consent')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
                >
                  {isSendingCode ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div>
              <div className="mb-4">
                <label htmlFor="verification-code" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  请输入验证码
                </label>
                <input
                  type="text"
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入6位验证码"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  验证码已发送至 {phoneNumber}，请查收。测试环境可输入任意数字
                </p>
              </div>
              
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setStep('phone')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isVerifying}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
                >
                  {isVerifying ? '验证中...' : '验证并开始修行'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentModal;