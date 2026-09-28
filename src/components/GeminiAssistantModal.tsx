import React, { useState, useEffect, useRef } from 'react';
import { Chapter, DailyGoalItem, MilestoneKey, SubjectType, UserStudyState } from '../types/jee';
import { askGeminiAssistant, AssistantAction } from '../services/geminiAssistantService';
import { playChimeSound } from '../utils/audioAlert';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  ShieldAlert,
  Bot,
  User as UserIcon,
  HelpCircle,
  Volume2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionsExecuted?: AssistantAction[];
  pendingList?: string[];
  punishmentAlert?: string;
  timestamp: string;
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyState: UserStudyState;
  todayGoals: DailyGoalItem[];
  overdueViolations: any[];
  onToggleMilestone: (chapterId: string, milestoneKey: MilestoneKey, isCompleted: boolean) => void;
  onLogStudyMinutes: (minutes: number) => void;
  onAddQuestions: (subject: SubjectType, count: number) => void;
  onActivatePunishment?: (active: boolean, reason: string) => void;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  studyState,
  todayGoals,
  overdueViolations,
  onToggleMilestone,
  onLogStudyMinutes,
  onAddQuestions,
  onActivatePunishment,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! Main aapka Gemini Super-50 AI Mentor hoon.\n\nAap bolkar ya likhkar apna progress bata sakte hain (e.g. "Maine Rotational Motion ki theory aur 1-page summary complete kar li"), aur main automatically use app me MARK kar dunga. Aap ye bhi puch sakte hain ki "Mera kya kya baki hai?"',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'hi-IN'; // Supports Hindi + English naturally

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognizer.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  if (!isOpen) return null;

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert('Voice input is supported in Google Chrome on your device.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await askGeminiAssistant(
        query,
        studyState,
        todayGoals,
        overdueViolations
      );

      // Execute actions automatically in the app
      if (response.actions && response.actions.length > 0) {
        playChimeSound(); // Audio feedback on auto-marking

        response.actions.forEach((act) => {
          if (act.type === 'MARK_MILESTONE' && act.chapterId && act.milestones) {
            act.milestones.forEach((mKey) => {
              onToggleMilestone(act.chapterId!, mKey, act.status !== false);
            });
          } else if (act.type === 'LOG_QUESTIONS' && act.subject && act.count) {
            onAddQuestions(act.subject, act.count);
          } else if (act.type === 'LOG_HOURS' && act.hours) {
            onLogStudyMinutes(Math.round(act.hours * 60));
          }
        });
      }

      // Execute punishment events
      if (response.punishmentEvent?.activate && onActivatePunishment) {
        onActivatePunishment(true, response.punishmentEvent.reason);
      } else if (response.punishmentEvent?.release && onActivatePunishment) {
        onActivatePunishment(false, '');
      }

      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'assistant',
        text: response.reply,
        actionsExecuted: response.actions,
        pendingList: response.pendingSummary,
        punishmentAlert: response.punishmentEvent?.activate ? response.punishmentEvent.reason : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Assistant error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: 'Maine aapki baat note kar li hai, aur system me synchronize kar diya hai!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-amber-400 p-[2px] shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Google Gemini Super-50 AI Assistant
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Voice & Auto-Mark Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mention progress in Hindi/English &rarr; Auto-mark milestones & check pending tasks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm space-y-2.5 shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line select-text">{m.text}</p>

                  {/* Actions Executed pill cards */}
                  {m.actionsExecuted && m.actionsExecuted.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Auto-Marked in Your Tracker:
                      </span>
                      {m.actionsExecuted.map((act, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-slate-300 flex items-center justify-between"
                        >
                          {act.type === 'MARK_MILESTONE' ? (
                            <span>
                              ✅ {act.chapterName}: <strong>{act.milestones?.join(', ')}</strong>
                            </span>
                          ) : act.type === 'LOG_QUESTIONS' ? (
                            <span>
                              🎯 +{act.count} {act.subject} Practice Questions Logged
                            </span>
                          ) : (
                            <span>
                              ⏱️ +{act.hours} Study Hours Logged
                            </span>
                          )}
                          <span className="text-emerald-400 font-bold text-[10px]">SAVED</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Punishment Alert badge */}
                  {m.punishmentAlert && (
                    <div className="p-2.5 bg-rose-950/80 border border-rose-700/80 rounded-lg text-rose-300 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Punishment Lockdown Triggered:</strong>
                        <span>{m.punishmentAlert}</span>
                      </div>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] font-mono text-right ${
                      isUser ? 'text-slate-800/70' : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                Gemini is parsing your progress & auto-marking milestones...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            'Theory aur 1-page summary complete ho gaya',
            'Mera kya kya baki hai? (Show Pending)',
            'Aaj 40 Chemistry questions solve kiye',
            'Maths me 25 questions practice ho gaya',
            'Kya mera koi punishment active hai?',
          ].map((promptChip) => (
            <button
              key={promptChip}
              onClick={() => handleSendMessage(promptChip)}
              disabled={isProcessing}
              className="px-2.5 py-1 text-[11px] rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400/40 shrink-0 transition-colors"
            >
              {promptChip}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Microphone and Send */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          {/* Microphone Voice Button */}
          <button
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40 animate-pulse ring-4 ring-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Tap to speak like Gemini on your phone'}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? 'Listening to your voice in Hindi/English...'
                : 'Type progress e.g. "Theory done for Rotational Motion" or "Kya baki hai"...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={isProcessing}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 rounded-xl shadow-md shadow-amber-500/10 font-bold transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
