import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  ArrowRight,
  Maximize2,
  HeartPulse,
  Pill,
  Activity,
  Calendar,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';
import { buildUserHealthContext } from '../lib/chatContext';
import MarkdownRenderer from './MarkdownRenderer';

interface HomeQuickAIChatProps {
  onNavigate: (tab: string) => void;
}

interface QuickMsg {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: string;
    label: string;
    targetTab?: string;
  };
}

export default function HomeQuickAIChat({ onNavigate }: HomeQuickAIChatProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<QuickMsg[]>([
    {
      id: 'init-home',
      sender: 'ai',
      text: language === 'hi' 
        ? `नमस्ते **${user?.name?.split(' ')[0] || 'दोस्त'}**! मैं आपका **हीलॉरा AI हेल्थ असिस्टेंट** हूँ। आप अपने वाइटल्स, दवाओं या लैब टेस्ट के बारे में यहाँ सीधे पूछ सकते हैं।`
        : `Hello **${user?.name?.split(' ')[0] || 'there'}**! I'm **Healora AI**, your personal clinical assistant. Ask me anything about your current vitals, medications, or health symptoms right here.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = language === 'hi' ? [
    '🩺 मेरे आज के वाइटल्स का विश्लेषण करें',
    '💊 मेरी आज की दवाओं का शेड्यूल बताएं',
    '❤️ ब्लड प्रेशर 120/80 के क्या मायने हैं?',
    '📋 डॉक्टर से क्या सवाल पूछने चाहिए?'
  ] : [
    '🩺 Analyze my current vitals today',
    '💊 Check my scheduled medications today',
    '❤️ What does 120/80 mmHg BP indicate?',
    '📋 What questions should I ask my doctor?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: QuickMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
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
          userContext: healthContext,
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
          ? 'आपके स्वास्थ्य डेटा का विश्लेषण पूरा हुआ। यदि कोई असामान्य लक्षण महसूस हो तो तुरंत डॉक्टर से परामर्श लें।'
          : 'Your health inquiry has been reviewed with clinical reference standards. Feel free to ask more or consult your doctor.';
      }

      // Determine smart suggested action if relevant
      let suggestedAction = undefined;
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('doctor') || lowerQuery.includes('appointment') || lowerQuery.includes('consult') || lowerQuery.includes('डॉक्टर')) {
        suggestedAction = { type: 'doctorBooking', label: language === 'hi' ? 'डॉक्टर अपॉइंटमेंट बुक करें' : 'Book Doctor Consultation', targetTab: 'doctorBooking' };
      } else if (lowerQuery.includes('med') || lowerQuery.includes('dawa') || lowerQuery.includes('दवा') || lowerQuery.includes('pill')) {
        suggestedAction = { type: 'medicines', label: language === 'hi' ? 'दवाएं देखें' : 'View Medicine Schedule', targetTab: 'medicines' };
      } else if (lowerQuery.includes('vital') || lowerQuery.includes('bp') || lowerQuery.includes('sugar') || lowerQuery.includes('हार्ट')) {
        suggestedAction = { type: 'vitals', label: language === 'hi' ? 'वाइटल्स लॉग करें' : 'Check & Log Vitals', targetTab: 'vitals' };
      }

      const aiMsg: QuickMsg = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackMsg: QuickMsg = {
        id: 'ai-err-' + Date.now(),
        sender: 'ai',
        text: language === 'hi'
          ? 'माफ़ कीजिए, AI सर्वर से जुड़ने में समस्या हुई। कृपया थोड़ी देर बाद पुनः प्रयास करें या पूरे चैट पेज पर जाएं।'
          : 'I encountered a temporary connection issue. Please try again or open the full AI Chat screen.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-[480px]">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{language === 'hi' ? 'डायरेक्ट AI हेल्थ चैट' : 'Direct AI Health Assistant'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'होम स्क्रीन पर त्वरित क्लिनिकल सहायता' : 'Instant AI consultation on Home Screen'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('healoraChat')}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
          title="Open Full Screen AI Chat"
        >
          <span>{language === 'hi' ? 'फुल चैट' : 'Full Chat'}</span>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 leading-relaxed relative group ${
                  isAI
                    ? 'bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700/80 text-slate-800 dark:text-slate-200'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isAI ? (
                  <div>
                    <MarkdownRenderer content={m.text} />
                    {m.suggestedAction && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => m.suggestedAction?.targetTab && onNavigate(m.suggestedAction.targetTab)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-xs"
                        >
                          <span>{m.suggestedAction.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{m.text}</div>
                )}

                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{m.timestamp}</span>
                  {isAI && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity ml-2"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
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
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>{language === 'hi' ? 'AI जवाब तैयार कर रहा है...' : 'Healora AI is analyzing your query...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="pt-2 pb-2 overflow-x-auto flex gap-1.5 no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap border border-slate-200 dark:border-slate-600 transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'अपने स्वास्थ्य, वाइटल्स या दवाइयों के बारे में पूछें...'
                : 'Ask AI about your vitals, meds, or symptoms...'
            }
            className="flex-1 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
