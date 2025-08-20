import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('三炷香已燃起...请向佛祖许下最急的愿！');
      return;
    }

    if (content.length > 200) {
      setError('莫学那唐僧一般啰嗦，限定200字');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await onSubmit(content);
      setSuccess(true);
      setContent('');
      
      // 2秒后自动关闭
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      // 使用用户友好的错误提示替代原始错误信息
      setError('灵山似乎在开Party。。。香火僧不在线，请施主等等再来。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setContent('');
      setError('');
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">灵山许愿台</h2>
            <button 
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl disabled:opacity-50"
            >
              &times;
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">愿望已经收到！嗯，希望您有机会来还愿....</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">感谢您的宝贵意见！</p>
              <div className="mt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">如需更多帮助，欢迎加入微信群：</p>
                <div className="flex justify-center">
                  <img 
                    src="/src/assets/wechat-w.png" 
                    alt="微信群二维码" 
                    className="w-32 h-32 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="feedback-content" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  三炷香已燃起...请向佛祖许下最急的愿！
                </label>
                <textarea
                  id="feedback-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="尽量少提发财，毕竟佛祖自己都没钱....可以多提系统需求，这样我们才好找涨价的借口...."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  maxLength={200}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {content.length}/200字
                  </span>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-md transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '提交中...' : '提交反馈'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;