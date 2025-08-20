import React, { useState } from 'react';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import ForgotPasswordView from './ForgotPasswordView';

const StoneMonkeyCharacter = () => (
    <div className="absolute bottom-0 left-4 w-40 h-32 animate-peek pointer-events-none">
        <div className="relative w-full h-full">
            {/* Ears */}
            <div className="absolute bottom-12 left-0 w-8 h-8 bg-[#b98c5d] rounded-full border-2 border-black/80"></div>
            <div className="absolute bottom-12 right-0 w-8 h-8 bg-[#b98c5d] rounded-full border-2 border-black/80"></div>
            
            {/* Head */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-24 bg-[#d4a276] rounded-t-full border-4 border-black/80"></div>

            {/* Face (Heart Shape) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-20">
                <div className="absolute top-0 left-0 w-12 h-12 bg-[#f6dcb0] rounded-t-full rounded-br-full"></div>
                <div className="absolute top-0 right-0 w-12 h-12 bg-[#f6dcb0] rounded-t-full rounded-bl-full"></div>
            </div>

            {/* Eyes */}
            <div className="absolute bottom-8 left-1/2 -translate-x-6 w-4 h-4 bg-black rounded-full border-2 border-white/50"></div>
            <div className="absolute bottom-8 left-1/2 translate-x-2 w-4 h-4 bg-black rounded-full border-2 border-white/50"></div>
            
            {/* Nose */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-3 h-2 bg-[#b98c5d] rounded-full"></div>
        </div>
    </div>
);


const AuthView: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100">
        <StoneMonkeyCharacter />

        <div className="w-full max-w-lg mx-auto p-8 bg-slate-800/60 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-700/80 animate-fade-in">
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">悟空伴读</h1>
            </div>
            
            {isForgotPassword ? (
                <ForgotPasswordView onBackToLogin={() => setIsForgotPassword(false)} />
            ) : isRegistering ? (
                <RegisterView onSwitchToLogin={() => setIsRegistering(false)} />
            ) : (
                <LoginView 
                    onSwitchToRegister={() => setIsRegistering(true)} 
                    onForgotPassword={() => setIsForgotPassword(true)}
                />
            )}
        </div>
    </div>
  );
};

export default AuthView;