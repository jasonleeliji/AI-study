import React from 'react';

interface CameraConsentModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

const CameraConsentModal: React.FC<CameraConsentModalProps> = ({ isOpen, onAgree, onDisagree }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">摄像头使用授权</h2>
            <button 
              onClick={onDisagree}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 text-center mb-4">
              为了监督孩子的学习状态，我们需要使用摄像头拍摄照片进行分析。
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">我们承诺：</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 照片仅用于学习状态分析</li>
                <li>• 不会保存或传输个人照片</li>
                <li>• 分析完成后立即删除</li>
                <li>• 严格保护孩子隐私安全</li>
              </ul>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              点击"同意并开始"即表示您同意我们使用摄像头进行学习监督
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onDisagree}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors"
            >
              暂不使用
            </button>
            <button
              onClick={onAgree}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              同意并开始修行
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraConsentModal;