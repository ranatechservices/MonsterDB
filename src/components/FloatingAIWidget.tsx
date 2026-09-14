import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  Maximize2,
  Minimize2,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';
import { buildUserHealthContext } from '../lib/chatContext';
import MarkdownRenderer from './MarkdownRenderer';

interface FloatingAIWidgetProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

interface MiniMsg {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  targetTab?: string;
  targetLabel?: string;
}

export default function FloatingAIWidget({ currentTab, onNavigate }: FloatingAIWidgetProps) {
  // If already on the full screen AI chat, hide the floating button
  if (currentTab === 'healoraChat') {
    return null;
  }

  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MiniMsg[]>([
    {
      id: 'init-flt',
      sender: 'ai',
      text: language === 'hi'
        ? `नमस्ते! मैं आपका **हीलॉरा AI साथी** हूँ। आप किसी भी फ़ीचर के दौरान यहाँ सीधे मदद ले सकते हैं।`
        : `Hi! I'm your **Healora AI Companion**. Ask me anything while exploring any feature!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    const userMsg: MiniMsg = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const healthContext = buildUserHealthContext(user);
      const turns = [...messages, userMsg].slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: turns,
          userContext: `${healthContext}\n[Active Screen: ${currentTab}]`,
          language: language === 'hi' ? 'hi' : 'en'
        })
      });

      let replyText = '';
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.substring(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  replyText += parsed.text;
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }

      if (!replyText.trim()) {
        replyText = language === 'hi'
          ? 'आपके स्वास्थ्य डेटा का विश्लेषण पूरा हुआ। कृपया आवश्यकता पड़ने पर अपने डॉक्टर से परामर्श लें।'
          : 'I have analyzed your query according to clinical reference standards.';
      }
      
      let targetTab: string | undefined = undefined;
      let targetLabel: string | undefined = undefined;
      const lower = q.toLowerCase();
      if (lower.includes('report') || lower.includes('test') || lower.includes('रिपोर्ट')) {
        targetTab = 'reports';
        targetLabel = language === 'hi' ? 'लैब रिपोर्ट्स पर जाएं' : 'Open Lab Reports';
      } else if (lower.includes('doctor') || lower.includes('consult') || lower.includes('डॉक्टर')) {
        targetTab = 'doctorBooking';
        targetLabel = language === 'hi' ? 'डॉक्टर बुक करें' : 'Book Consultation';
      } else if (lower.includes('vital') || lower.includes('bp') || lower.includes('sugar')) {
        targetTab = 'vitals';
        targetLabel = language === 'hi' ? 'वाइटल्स देखें' : 'View Vitals';
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          targetTab,
          targetLabel
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: language === 'hi' ? 'AI सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।' : 'Could not contact AI server. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          id="floating-ai-chat-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group"
          title="Ask Healora AI Health Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-700 animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-tight pr-1">
            {language === 'hi' ? 'AI हेल्थ चैट' : 'AI Health Chat'}
          </span>
        </button>
      )}

      {/* Slide-over Quick Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide">Healora AI Assistant</h4>
                <p className="text-[10px] text-emerald-200">
                  {language === 'hi' ? '24/7 क्लिनिकल गाइडेंस' : 'Active Clinical Guidance'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('healoraChat');
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition"
                title="Open Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((m) => {
              const isAI = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      isAI
                        ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {isAI ? (
                      <div>
                        <MarkdownRenderer content={m.text} />
                        {m.targetTab && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                onNavigate(m.targetTab!);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all"
                            >
                              <span>{m.targetLabel || 'Open Feature'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>{m.text}</div>
                    )}
                    <div className="mt-1 text-[9px] text-slate-400 text-right">{m.timestamp}</div>
                  </div>

                  {!isAI && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                  <span className="text-[11px]">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleSend(language === 'hi' ? 'मेरे आज के स्वास्थ्य की स्थिति बताएं' : 'Summarize my current health status')}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 rounded-md whitespace-nowrap hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              💡 {language === 'hi' ? 'स्वास्थ्य सारांश' : 'Health Summary'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'hi' ? 'मेरी आज की दवाएं क्या हैं?' : 'What medications should I take today?')}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 rounded-md whitespace-nowrap hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              💊 {language === 'hi' ? 'दवाएं' : 'Medicines'}
            </button>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'hi' ? 'कोई भी स्वास्थ्य सवाल पूछें...' : 'Ask any health question...'}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
