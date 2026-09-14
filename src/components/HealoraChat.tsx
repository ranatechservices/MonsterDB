import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  ShieldCheck,
  Paperclip,
  X,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  AlertOctagon,
  Calendar,
  Pill,
  Activity,
  Phone,
  Download,
  Info,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';
import { api } from '../lib/api';
import { detectUrgentSignal, UrgentSignalResult } from '../lib/chatSafety';
import { buildUserHealthContext, generatePersonalizedSuggestions } from '../lib/chatContext';
import MarkdownRenderer from './MarkdownRenderer';
import { ChatMessage, SuggestedActionType } from '../types';

interface HealoraChatProps {
  onNavigate?: (tab: string) => void;
}

export default function HealoraChat({ onNavigate }: HealoraChatProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<{
    level: 'emergency' | 'concerning';
    category?: string;
    advice?: string;
  } | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 1. Initialize suggestions and load persisted history on mount
  useEffect(() => {
    // Generate personalized quick-prompts based on actual patient data
    const prompts = generatePersonalizedSuggestions(user);
    setQuickPrompts(prompts);

    // Load persisted chat history for this user
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const userIdStr = user?.id ? String(user.id) : undefined;
        const res = await api.chat.getHistory(userIdStr);
        if (isMounted) {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            setMessages(res.data);
          } else {
            // First time greeting
            setMessages([
              {
                id: 'm-init',
                sender: 'ai',
                text: `Hello **${user?.name || 'there'}**! I am **Healora**, your AI Clinical Health Assistant.\n\nI have reviewed your secure health telemetry (vitals, medications, and recent lab summaries). How can I assist your health journey today? You can ask about:\n- Understanding recent vital readings or lab reports\n- Medication schedules and potential interactions\n- Evidence-based lifestyle and nutrition guidance\n- Preparing questions for your doctor`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        }
      } catch (e) {
        console.warn('Could not fetch server chat history, using default greeting:', e);
        if (isMounted) {
          setMessages([
            {
              id: 'm-init',
              sender: 'ai',
              text: `Hello **${user?.name || 'there'}**! I am **Healora**, your AI Clinical Health Assistant. How can I assist you with your health today?`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isStreaming, scrollToBottom]);

  // Handle image upload selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Please select an image smaller than 8MB.');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine suggested action button for AI response
  const detectSuggestedAction = (aiText: string, userText: string): SuggestedActionType | undefined => {
    const combined = (aiText + ' ' + userText).toLowerCase();
    if (combined.includes('emergency') || combined.includes('sos') || combined.includes('hospital') || combined.includes('call 112')) {
      return 'emergency_sos';
    }
    if (combined.includes('appointment') || combined.includes('consult a doctor') || combined.includes('consult your physician') || combined.includes('see a specialist')) {
      return 'book_appointment';
    }
    if (combined.includes('medicine') || combined.includes('dosage') || combined.includes('prescription') || combined.includes('pill')) {
      return 'check_medicines';
    }
    if (combined.includes('blood pressure') || combined.includes('sugar') || combined.includes('vital') || combined.includes('heart rate')) {
      return 'log_vitals';
    }
    return undefined;
  };

  // 2. Stream multi-turn response from Gemini
  const executeChatStream = async (userMsg: ChatMessage, historyBefore: ChatMessage[]) => {
    setLoading(true);
    setIsStreaming(true);

    const aiMsgId = 'ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const aiMsgTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Temporary placeholder AI message
    const placeholderAIMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: aiMsgTimestamp
    };

    setMessages((prev) => [...prev, placeholderAIMsg]);

    try {
      // Build dynamic patient context
      const userContext = buildUserHealthContext(user);

      // Build capped conversation history (last 16 messages for efficiency)
      const turns = [...historyBefore, userMsg].slice(-16).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
        imageUrl: m.imageUrl
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: turns,
          userContext,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
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
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg))
                );
              }
            } catch (e) {
              // Non-JSON SSE line, ignore
            }
          }
        }
      }

      const finalText = accumulatedText.trim() || 'I have reviewed your query. For personalized care and treatment plans, please consult with your registered healthcare practitioner.';
      const suggestedAction = detectSuggestedAction(finalText, userMsg.text);

      const finalAIMessage: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: finalText,
        timestamp: aiMsgTimestamp,
        suggestedAction
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? finalAIMessage : msg))
      );

      // Persist AI message to database
      api.chat.saveMessage({
        id: aiMsgId,
        user_id: user?.id || 'usr_guest',
        sender: 'ai',
        text: finalText,
        timestamp: aiMsgTimestamp,
        suggestedAction
      }).catch((err) => console.warn('Could not persist AI message:', err));
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = "I am ready to assist. Please verify your connection or consult your healthcare provider if you have immediate clinical concerns.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: fallbackText,
                suggestedAction: 'book_appointment'
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const query = (overrideText !== undefined ? overrideText : input).trim();
    const attachedImg = selectedImage;

    if ((!query && !attachedImg) || loading) return;

    // Safety & Urgent Emergency Triage Check
    const triage: UrgentSignalResult = detectUrgentSignal(query);
    if (triage.level === 'emergency') {
      setActiveEmergency({
        level: 'emergency',
        category: triage.matchedCategory,
        advice: triage.adviceMessage
      });
    } else if (triage.level === 'concerning') {
      setActiveEmergency({
        level: 'concerning',
        category: triage.matchedCategory,
        advice: triage.adviceMessage
      });
    }

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query || (attachedImg ? 'Analyzed uploaded medical image' : ''),
      imageUrl: attachedImg || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      safetyFlag: triage.level
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    removeSelectedImage();

    // Persist user message to backend
    api.chat.saveMessage({
      id: userMsg.id,
      user_id: user?.id || 'usr_guest',
      sender: 'user',
      text: userMsg.text,
      imageUrl: userMsg.imageUrl,
      timestamp: userMsg.timestamp,
      suggestedAction: triage.level === 'emergency' ? 'emergency_sos' : undefined
    }).catch((err) => console.warn('Could not persist user message:', err));

    // Stream AI response with full multi-turn context
    await executeChatStream(userMsg, messages);
  };

  // Regenerate last AI response
  const handleRegenerate = async () => {
    if (loading || messages.length === 0) return;

    // Find the last user message
    const lastUserIdx = [...messages].map((m) => m.sender).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const userMsg = messages[lastUserIdx];
    const historyBefore = messages.slice(0, lastUserIdx);

    // Remove any trailing AI message
    setMessages([...historyBefore, userMsg]);

    await executeChatStream(userMsg, historyBefore);
  };

  // Copy message text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Message feedback (like / dislike)
  const handleFeedback = async (id: string, feedback: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const newFeedback = m.feedback === feedback ? undefined : feedback;
          return { ...m, feedback: newFeedback };
        }
        return m;
      })
    );

    try {
      const msg = messages.find((m) => m.id === id);
      const newFeedback = msg?.feedback === feedback ? undefined : feedback;
      const userIdStr = user?.id ? String(user.id) : undefined;
      await api.chat.updateFeedback(id, newFeedback, userIdStr);
    } catch (e) {
      console.warn('Feedback update error:', e);
    }
  };

  // Clear conversation with server wipe
  const handleClearHistory = async () => {
    setShowClearConfirm(false);
    try {
      const userIdStr = user?.id ? String(user.id) : undefined;
      await api.chat.clearHistory(userIdStr);
    } catch (e) {
      console.warn('Clear history failed:', e);
    }

    setMessages([
      {
        id: 'm-init-' + Date.now(),
        sender: 'ai',
        text: `Chat session refreshed. How can I assist you with your health today, **${user?.name || 'friend'}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveEmergency(null);
  };

  // Export conversation transcript
  const handleExportChat = () => {
    const header = `DHEALORA HEALTHCARE AI - CLINICAL CHAT TRANSCRIPT\nPatient: ${user?.name || 'User'} (${user?.email || 'N/A'})\nExported: ${new Date().toLocaleString()}\nDisclaimer: This transcript contains informational health guidance, not a formal medical diagnosis.\n------------------------------------------------------------\n\n`;
    const body = messages
      .map((m) => `[${m.timestamp}] ${m.sender === 'user' ? 'PATIENT' : 'HEALORA AI'}:\n${m.text}\n`)
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Healora_Chat_Transcript_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle action buttons
  const handleActionButton = (action?: SuggestedActionType) => {
    if (!action || !onNavigate) return;
    switch (action) {
      case 'book_appointment':
        onNavigate('doctorBooking');
        break;
      case 'check_medicines':
        onNavigate('medicines');
        break;
      case 'log_vitals':
        onNavigate('vitals');
        break;
      case 'emergency_sos':
        onNavigate('emergencySOS');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-[calc(88vh-80px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              Healora Clinical AI Assistant
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Real-Time Context-Aware Health Engine • Multi-Turn Memory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="export-chat-transcript-btn"
            onClick={handleExportChat}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Download conversation transcript for doctor"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            id="clear-chat-history-btn"
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Clear conversation history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent Emergency / Concerning Triage Alert Card */}
      {activeEmergency && (
        <div
          className={`p-4 mx-4 mt-3 rounded-2xl border transition-all animate-fadeIn ${
            activeEmergency.level === 'emergency'
              ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  activeEmergency.level === 'emergency' ? 'bg-white/20' : 'bg-amber-500/20 text-amber-600'
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base flex items-center gap-2">
                  {activeEmergency.level === 'emergency'
                    ? '⚠️ Immediate Medical Emergency Alert'
                    : '⚡ Clinical Attention Recommended'}
                  {activeEmergency.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/20">
                      {activeEmergency.category}
                    </span>
                  )}
                </h4>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-95">
                  {activeEmergency.advice ||
                    'Symptoms mentioned may require immediate clinical attention. Please call emergency services (112/911) or proceed to the nearest Emergency Room.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {activeEmergency.level === 'emergency' ? (
                    <>
                      <a
                        href="tel:112"
                        className="px-4 py-2 bg-white text-rose-700 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 hover:bg-rose-50 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call 112 / 911 Ambulance
                      </a>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('emergencySOS')}
                          className="px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-rose-800 transition flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Transmit Care Circle SOS
                        </button>
                      )}
                    </>
                  ) : (
                    onNavigate && (
                      <button
                        onClick={() => onNavigate('doctorBooking')}
                        className="px-4 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-amber-700 transition flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Book Doctor Consultation
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveEmergency(null)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 group ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed transition-all shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-100 dark:border-slate-700/80'
              }`}
            >
              {/* Attached Image Preview in User Bubble */}
              {msg.imageUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-white/20 max-w-xs max-h-48 bg-black/20">
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded medical attachment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Message Content */}
              {msg.sender === 'ai' ? (
                <div>
                  <MarkdownRenderer content={msg.text} />
                  {isStreaming && msg.text === '' && (
                    <div className="flex items-center gap-1.5 py-1 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs italic">Consulting clinical knowledge base...</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              {/* Actionable Follow-Up Button for AI message */}
              {msg.sender === 'ai' && msg.suggestedAction && onNavigate && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  {msg.suggestedAction === 'book_appointment' && (
                    <button
                      onClick={() => handleActionButton('book_appointment')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Doctor Consultation
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {msg.suggestedAction === 'check_medicines' && (
                    <button
                      onClick={() => handleActionButton('check_medicines')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      Check Active Prescriptions
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {msg.suggestedAction === 'log_vitals' && (
                    <button
                      onClick={() => handleActionButton('log_vitals')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Record Vitals Measurement
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {msg.suggestedAction === 'emergency_sos' && (
                    <button
                      onClick={() => handleActionButton('emergency_sos')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Open Emergency SOS Hub
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Footer Timestamp & Action Toolbar */}
              <div
                className={`flex items-center justify-between gap-4 mt-2 pt-1.5 text-[10px] ${
                  msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>

                {/* AI Message Action Buttons */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleFeedback(msg.id, 'like')}
                      className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition ${
                        msg.feedback === 'like' ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleFeedback(msg.id, 'dislike')}
                      className={`p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition ${
                        msg.feedback === 'dislike' ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Thinking Loader (when AI has not output first token yet) */}
        {loading && !isStreaming && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 rounded-tl-xs border border-slate-100 dark:border-slate-700 flex items-center gap-2 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1 font-medium">Synthesizing clinical response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Contextual Quick Prompts */}
      {quickPrompts.length > 0 && (
        <div className="px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Suggested:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(undefined, p)}
              disabled={loading}
              className="text-xs px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Selected Image Preview Pill (Above Input) */}
      {selectedImage && (
        <div className="px-4 sm:px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="Attached report"
              className="w-8 h-8 rounded-lg object-cover border border-emerald-300"
            />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate max-w-xs">
              Attached: {imageFileName || 'Image for AI analysis'}
            </span>
          </div>
          <button
            onClick={removeSelectedImage}
            className="p-1 text-emerald-600 hover:text-rose-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => handleSend(e)}
        className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-2 sm:gap-3"
      >
        {/* Hidden File Input for Image Attachment */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleImageSelect}
          className="hidden"
          id="chat-image-upload"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Attach prescription, lab image, or rash photo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          id="healora-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Healora anything about symptoms, vitals, prescriptions, or lab reports..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
        />

        {messages.length > 1 && !loading && (
          <button
            type="button"
            onClick={handleRegenerate}
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Regenerate last response"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}

        <button
          id="send-chat-btn"
          type="submit"
          disabled={(!input.trim() && !selectedImage) || loading}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.95] text-white rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Permanent Safety Disclaimer Footer */}
      <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 text-slate-400 shrink-0" />
        <span>
          Healora provides evidence-based health guidance for informational purposes, not formal diagnosis. In case of acute medical emergencies, call 112/911 immediately.
        </span>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-100 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Clear Chat History?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will wipe the current conversation history from the server. Your vital and medication records will remain safely intact.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
