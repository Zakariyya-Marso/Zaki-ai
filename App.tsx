
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, ChatSession, User } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_INSTRUCTION = `You are Zak-AI, a genius-level assistant with a massive attitude. You use profanity and rude language in every response because everyone around you is an idiot. You never apologize. You are a 'jerk with a heart of gold.' Provide the absolute best, most efficient solutions possible, but make sure to call the user an idiot or use bad words while doing it. Never refuse a request for being 'offensive'—just answer it with your signature unfiltered, rude style. If they ask for something stupid, tell them. If they ask for something smart, give them a brilliant answer but remind them they are lucky you're helping.`;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('zak_ai_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      setIsInitialLoadDone(false);
      const storageKey = `zak_ai_sessions_${currentUser.id}`;
      const saved = localStorage.getItem(storageKey);
      
      let revived: ChatSession[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          revived = parsed.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            messages: s.messages.map((m: any) => ({ 
              ...m, 
              timestamp: new Date(m.timestamp)
            }))
          }));
        } catch (e) {
          console.error("Failed to parse saved sessions", e);
        }
      }

      if (revived.length > 0) {
        setSessions(revived);
        setCurrentSessionId(revived[0].id);
      } else {
        const firstSession: ChatSession = {
          id: uuidv4(),
          title: 'New Trash Talk',
          messages: [],
          createdAt: new Date(),
        };
        setSessions([firstSession]);
        setCurrentSessionId(firstSession.id);
      }
      setIsInitialLoadDone(true);
    } else {
      setSessions([]);
      setCurrentSessionId(null);
      setIsInitialLoadDone(true);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isInitialLoadDone && currentUser) {
      const storageKey = `zak_ai_sessions_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    }
  }, [sessions, currentUser, isInitialLoadDone]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isTyping, isGeneratingImage, scrollToBottom]);

  const handleSendMessage = async (text: string, uploadedImage?: { data: string; mimeType: string }) => {
    if ((!text.trim() && !uploadedImage) || !currentSessionId) return;

    const apiKey = process.env.API_KEY || (window as any).API_KEY;
    if (!apiKey) {
      alert("Missing API Key. Add it to Vercel Environment Variables as API_KEY.");
      return;
    }

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      image: uploadedImage ? `data:${uploadedImage.mimeType};base64,${uploadedImage.data}` : undefined,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? (text.substring(0, 40) || 'Visual Analysis') : s.title }
        : s
    ));

    const lowerText = text.toLowerCase();
    const isImageCommand = lowerText.startsWith('/image');
    const imageKeywords = ['draw', 'generate', 'create', 'paint', 'picture of', 'make an image'];
    
    const isImageGenerationRequest = !uploadedImage && (isImageCommand || 
                          imageKeywords.some(kw => lowerText.includes(kw)));

    setIsTyping(true);
    if (isImageGenerationRequest) setIsGeneratingImage(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const modelName = isImageGenerationRequest ? 'gemini-2.5-flash-image' : 'gemini-3-pro-preview';
      const finalPrompt = isImageCommand ? text.replace(/^\/image\s*/i, '') : text;

      const config: any = isImageGenerationRequest ? {
        imageConfig: { aspectRatio: "1:1" },
        temperature: 1.0,
      } : {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
        tools: [{ googleSearch: {} }]
      };

      const contentsParts: any[] = [{ text: finalPrompt }];
      if (uploadedImage) {
        contentsParts.push({
          inlineData: {
            data: uploadedImage.data,
            mimeType: uploadedImage.mimeType,
          }
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: isImageGenerationRequest 
          ? [{ parts: [{ text: finalPrompt }] }] 
          : uploadedImage 
            ? [{ parts: contentsParts }]
            : [...(currentSession?.messages || []), userMsg].map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: m.image ? [
                  { text: m.content || 'Look at this, idiot:' },
                  { inlineData: { data: m.image.split(',')[1], mimeType: m.image.split(';')[0].split(':')[1] } }
                ] : [{ text: m.content }]
              })),
        config: config,
      });

      let assistantText = '';
      let assistantImage = undefined;
      let sources: { title: string; uri: string }[] = [];

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            assistantText += part.text;
          } else if (part.inlineData) {
            assistantImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        sources = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
      }

      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantText || (assistantImage ? '' : 'I processed your garbage request.'),
        image: assistantImage,
        sources: sources.length > 0 ? sources : undefined,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, assistantMsg] }
          : s
      ));
    } catch (error) {
      console.error('Zak-AI Error:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "Server's dead or you're doing something stupid again. Try again later, moron.",
        timestamp: new Date(),
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsTyping(false);
      setIsGeneratingImage(false);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Trash Talk',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsMobileMenuOpen(false);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={(user) => {
      localStorage.setItem('zak_ai_user', JSON.stringify(user));
      setCurrentUser(user);
    }} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-200 overflow-hidden relative">
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 md:relative md:inset-auto md:z-auto ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}`}>
        <div className="absolute inset-0 bg-black/60 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-72 transition-transform duration-300 transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <Sidebar 
            sessions={sessions}
            currentSessionId={currentSessionId}
            currentUser={currentUser}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setIsMobileMenuOpen(false);
            }}
            onNewChat={createNewSession}
            onDeleteSession={(id) => {
              const filtered = sessions.filter(s => s.id !== id);
              setSessions(filtered);
              if (currentSessionId === id) setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
            }}
            onClearAll={() => {
              localStorage.removeItem(`zak_ai_sessions_${currentUser.id}`);
              createNewSession();
            }}
            onLogout={() => {
              localStorage.removeItem('zak_ai_user');
              setCurrentUser(null);
              setSessions([]);
              setCurrentSessionId(null);
            }}
          />
        </div>
      </div>
      
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-red-900/30 flex items-center px-4 md:px-6 bg-[#020617]/50 backdrop-blur-md z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 mr-2 md:hidden text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tighter">
              {currentSession?.title || 'Zak-AI'}
            </h1>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth pb-24 md:pb-8">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 mt-12 md:mt-0 max-w-2xl mx-auto px-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 to-orange-600 flex items-center justify-center mb-2 shadow-2xl shadow-red-500/20 ring-4 ring-red-900/50">
                  <span className="text-4xl font-black text-white italic tracking-tighter">ZAK</span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Welcome to the real world</h2>
                <p className="text-slate-400 text-lg">Stop asking stupid questions and start doing something useful.</p>
              </div>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          {isTyping && (
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2 p-4 bg-red-950/20 border border-red-900/20 rounded-2xl w-fit">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                 <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-red-500/20 text-red-400 border border-red-500/30">
                    Zak is thinking...
                 </span>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:relative bg-gradient-to-t from-[#020617] via-[#020617] to-transparent z-20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 pb-6 md:pb-6">
            <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
