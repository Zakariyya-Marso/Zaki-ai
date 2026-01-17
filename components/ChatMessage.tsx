
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { marked } from 'marked';
import Prism from 'prismjs';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      Prism.highlightAllUnder(contentRef.current);
    }
  }, [message.content]);

  const renderContent = () => {
    if (isUser) {
      return <div className="whitespace-pre-wrap font-medium">{message.content}</div>;
    }
    
    const html = marked.parse(message.content, {
      breaks: true,
      gfm: true,
    });
    
    return (
      <div 
        ref={contentRef}
        className="markdown-content prose prose-invert prose-sm max-w-none break-words leading-relaxed font-normal selection:bg-red-500/30"
        dangerouslySetInnerHTML={{ __html: html as string }}
      />
    );
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 shadow-2xl ${
        isUser 
          ? 'bg-red-600 text-white rounded-tr-none shadow-red-500/10' 
          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none border-l-red-500/50'
      }`}>
        <div className="flex items-center space-x-2 mb-1 opacity-70">
          <span className={`text-[10px] font-black uppercase tracking-widest ${!isUser && 'text-red-400'}`}>
            {isUser ? 'Dummy' : 'Zak-AI'}
          </span>
          <span className="text-[10px]">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {message.image && (
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-800 bg-black group-image relative">
            <img 
              src={message.image} 
              alt="Generated Content" 
              className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 hover:scale-[1.01] cursor-zoom-in" 
              onClick={() => window.open(message.image, '_blank')}
            />
          </div>
        )}

        <div className="text-sm">
          {renderContent()}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Evidence for idiots
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] bg-black/50 border border-slate-800 hover:border-red-500 text-red-400 px-2 py-1 rounded-lg transition-all flex items-center gap-1 max-w-[200px] truncate"
                >
                  <span className="truncate">{source.title}</span>
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
