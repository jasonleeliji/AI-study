import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Howl } from 'howler';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSwitchToRegister, onForgotPassword }) => {
    // 注释掉文本滚动功能
    // const [currentLine, setCurrentLine] = useState(0);
    
    // 注释掉引言文本数组
    // const introLines = [
    //     "听好了，小猴子！",
    //     "我这儿正要组个队，去西天干票大的。",
    //     "但我可不带拖后腿的。想上我的队，先让我瞧瞧你有没有那个本事。",
    //     "别以为会翻几个跟头就了不起了。在我这儿，只有'坐得住'才是真功夫！",
    //     "你要是敢上蹿下跳、东张西望，就罚你去面壁思过！",
    //     "你要是不好好学习，就让你永远当不了齐天大圣！",
    //     "最惨的，就是永远无法修成正果！",
    //     "只有那个最专注、最能沉下心来的猴子，才有资格成为真正的悟空，扛起齐天大圣的旗号！",
    //     "怎么，不服气？那就坐下来，拿起你的'金箍棒'（笔），让我看看你到底有多少能耐！"
    // ];
    
    // 注释掉音频播放和文本滚动功能
    // useEffect(() => {
    //     // 初始化音频
    //     const sound = new Howl({
    //         src: ['/assets/sounds/monkey-intro.mp3'],
    //         volume: 0.5
    //     });
    //     
    //     // 开始播放音频
    //     sound.play();
    //     
    //     // 设置滚动文本定时器
    //     const timer = setInterval(() => {
    //         setCurrentLine(prev => (prev + 1) % introLines.length);
    //     }, 5000);
    //     
    //     return () => {
    //         clearInterval(timer);
    //         sound.stop();
    //     };
    // }, []);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(phone, password);
        } catch (err: any) {
            // 根据错误状态码显示具体的错误信息
            if (err.response?.status === 401) {
                setError('手机号或密码错误，请重新输入');
            } else if (err.response?.status === 400) {
                setError('请输入有效的手机号和密码');
            } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                setError('网络连接失败，请检查网络后重试');
            } else {
                setError(err.response?.data?.message || '登录失败，请稍后重试');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="relative">

            
            <form onSubmit={handleLogin} className="space-y-6 pt-8">
                {/* 注释掉引言文本滚动显示 */}
                {/* <div className="text-center min-h-[60px] flex items-center justify-center">
                    <p className="text-yellow-200 font-medium animate-fade-in-out text-lg drop-shadow-md">
                        {introLines[currentLine]}
                    </p>
                </div> */}
                <div>
                    <label htmlFor="phone-login" className="block text-sm font-medium text-yellow-100 drop-shadow-sm">手机号码</label>
                    <input
                        id="phone-login"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone((e.currentTarget as HTMLInputElement).value)}
                        placeholder="请输入11位手机号码"
                        className="mt-1 block w-full p-3 border border-slate-500 rounded-md bg-slate-800/80 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:shadow-lg"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password-login" className="block text-sm font-medium text-yellow-100 drop-shadow-sm">密码</label>
                    <input
                        id="password-login"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword((e.currentTarget as HTMLInputElement).value)}
                        placeholder="请输入密码"
                        className="mt-1 block w-full p-3 border border-slate-500 rounded-md bg-slate-800/80 text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:shadow-lg"
                        required
                    />
                </div>
                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-600 rounded-md">
                        <p className="text-red-300 text-sm text-center">{error}</p>
                    </div>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-slate-900 bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-400 disabled:opacity-60 transition-all transform hover:scale-105 duration-300"
                >
                    {isLoading ? '登录中...' : '登录'}
                </button>
                <div className="space-y-2">
                    <p className="text-center text-sm text-slate-200 drop-shadow-sm">
                        还没有账户？{' '}
                        <button type="button" onClick={onSwitchToRegister} className="font-medium text-yellow-300 hover:text-yellow-200 transition-colors duration-300 drop-shadow-sm">
                            立即注册
                        </button>
                    </p>
                    {onForgotPassword && (
                        <p className="text-center text-sm text-slate-200 drop-shadow-sm">
                            <button type="button" onClick={onForgotPassword} className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-300 drop-shadow-sm">
                                忘记密码？
                            </button>
                        </p>
                    )}
                </div>
            </form>
            
        </div>
    );
};

export default LoginView;