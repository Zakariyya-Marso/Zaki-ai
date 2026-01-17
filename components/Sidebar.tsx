
import React, { useState, useMemo } from 'react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentUser: User;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId,
  currentUser,
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  onClearAll,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.messages.some(m => m.content.toLowerCase().includes(query))
    );
  }, [sessions, searchQuery]);

  const handleClearAll = () => {
    if (window.confirm('Clear all chat history for this account?')) {
      onClearAll();
    }
  };

  return (
    <aside className="flex flex-col w-full h-full bg-slate-950 border-r border-slate-800">
      <div className="p-4 space-y-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-500/10 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search your chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center sticky top-0 bg-slate-950 z-10">
          <span>{searchQuery ? 'Results' : 'Your History'}</span>
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-slate-600 italic">
            {searchQuery ? 'No matches' : 'No history yet'}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all mb-1 ${
                currentSessionId === session.id 
                  ? 'bg-slate-800 text-slate-100 ring-1 ring-slate-700 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex-1 truncate">
                <div className="text-sm font-medium truncate">{session.title}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm space-y-3">
        <button
          onClick={handleClearAll}
          className="w-full flex items-center space-x-2 py-2 px-3 text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
          </svg>
          <span>Wipe History</span>
        </button>

        <div className={`flex items-center space-x-3 p-3 bg-slate-900/50 rounded-xl border ${currentUser.isOwner ? 'border-indigo-500/30' : 'border-slate-800'} group relative`}>
          <div className={`w-8 h-8 rounded-full ${currentUser.isOwner ? 'bg-gradient-to-br from-indigo-600 to-blue-700 shadow-lg shadow-indigo-500/20' : 'bg-gradient-to-br from-slate-700 to-slate-800'} flex items-center justify-center text-[10px] font-bold text-white uppercase`}>
            {currentUser.isOwner ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ) : currentUser.email.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-xs font-semibold text-slate-200 truncate">{currentUser.isOwner ? 'Zaki' : currentUser.email}</div>
              {currentUser.isOwner && (
                <span className="bg-indigo-500 text-[8px] text-white px-1.5 rounded-full py-0.5 font-black uppercase tracking-tighter">Owner</span>
              )}
            </div>
            <button 
              onClick={onLogout}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors font-bold uppercase"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
