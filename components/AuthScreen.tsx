
import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.toLowerCase() === 'zaki' && password === '6879') {
      onLogin({ 
        id: 'owner-zaki', 
        email: 'zaki@zak.ai', 
        isOwner: true 
      });
      return;
    }

    if (username.includes('@')) {
       const userId = btoa(username.toLowerCase()).slice(0, 12);
       onLogin({ id: userId, email: username });
    } else {
       setError('Enter a real email, idiot.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#020617] p-4 z-[100]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-900/10 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 p-8 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-700 ring-1 ring-white/5">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/20 mb-6 rotate-12 ring-4 ring-red-900/30">
             <span className="text-2xl font-black text-white italic tracking-tighter">ZAK</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Zak-AI</h2>
          <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">
            {isSignUp ? 'Apply for access' : 'Prove you are not a bot'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Identity</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Who the hell are you?"
              className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all placeholder:text-slate-700 text-sm font-medium"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Secret Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all placeholder:text-slate-700 text-sm font-medium"
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center animate-pulse">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-[0.98] mt-4"
          >
            {isSignUp ? 'Join the circus' : 'Enter the void'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-slate-500 hover:text-red-400 transition-colors font-black uppercase tracking-widest"
          >
            {isSignUp ? (
              <span>Actually I have access <strong className="text-red-500 ml-1">Sign In</strong></span>
            ) : (
              <span>No key? <strong className="text-red-500 ml-1">Sign Up</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
