import React from 'react';
import { AnalysisResult } from '../../types';

// Base64 encoded GIFs for different states. Embedding them directly prevents extra network requests.
const animationAssets = {
    // A GIF of Wukong scratching his head, looking confused.
    distracted: 'data:image/gif;base64,R0lGODlhgACAAJEDAAAA//8A/wAA////yH5BAUKAAIALAAAAACAAIAAAAKvnI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUqn1Kr1is1qt9yu9wsOi8fksvmMTqvX7Lb7DY/L5/S6/Y7P6/f8vv8PGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5yZgAADn5+goaKjpKWmp6ipqqusra6voKGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rUqGCAACH5BAUKAAIALAAAxABzAMgAAArTkF0pZbASiMzi3lG+1iOv42e+4jfeH5ohCgmhM5Z3v5dtnrZt3rbf/p9h+Hhi/l4si0fD0PhkKp9K5xK6xSa1Wm/UGvV2v2Kz2e33Cw6Hx+Sy+YxOq9fstvsNj8vn9Lr9js/r9/y+/w8YKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dZXVQIAOw==',
    // A GIF of Wukong looking around, as if searching.
    off_seat: 'data:image/gif;base64,R0lGODlhgACAAJEDAAAA//8A/wAA////yH5BAUKAAIALAAAAACAAIAAAAK8nI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUqn1Kqv2Kz2C8Zqt9yu9wsOi8fksvmMTqvX7Lb7DY/L5/S6/Y7P6/f8vv8PGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5yZgAADn5+goaKjpKWmp6ipqqusra6voKGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rUqGCAACH5BAUKAAIALAAAxABzAMgAAAvEkF0pZbASiMzi3lG+1iOv42e+4jfeH5ohCgmhM5Z3v5dtnrZt3rbf/p9h+Hhi/l4si0fD0PhkKp9K5xK6xSa1Wm/UGvV2v2Kz2e33Cw6Hx+Sy+YxOq9fstvsNj8vn9Lr9js/r9/y+/w8YKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dZXVQIAOw=='
};

interface AnimationOverlayProps {
    show: boolean;
    animationKey: AnalysisResult['animationKey'];
    message: string;
}

const AnimationOverlay: React.FC<AnimationOverlayProps> = ({ show, animationKey, message }) => {
    if (!show || animationKey === 'idle') {
        return null;
    }

    const gifSrc = animationAssets[animationKey as keyof typeof animationAssets];
    if (!gifSrc) return null;

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" aria-live="assertive">
            <div className="relative flex items-center">
                <img 
                    src={gifSrc} 
                    alt="孙悟空动画" 
                    className="w-48 h-48 drop-shadow-lg transform -scale-x-100" // Flip image to face the text
                />
                <div className="absolute -top-12 left-32 w-56 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border-2 border-yellow-400 dark:border-yellow-500">
                    <p className="text-center font-semibold text-base text-slate-800 dark:text-slate-100">{message}</p>
                    {/* Speech bubble tail */}
                    <div className="absolute left-4 -bottom-3.5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-white dark:border-t-slate-800 transform rotate-[-20deg]"></div>
                    <div className="absolute left-4 -bottom-3 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-yellow-400 dark:border-t-yellow-500 transform rotate-[-20deg] -z-10"></div>
                </div>
            </div>
        </div>
    );
};

export default AnimationOverlay;