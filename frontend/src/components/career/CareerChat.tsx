import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, UserCircle2 } from 'lucide-react';
import type { CareerAssistantConversation, CareerAssistantMessage } from '../../types';

interface CareerChatProps {
  conversation: CareerAssistantConversation | null;
  messages: CareerAssistantMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onSend: (question: string) => Promise<void>;
}

export const CareerChat: React.FC<CareerChatProps> = ({
  conversation,
  messages,
  isLoading,
  isSending,
  error,
  onSend,
}) => {
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending || !conversation) return;
    await onSend(trimmedQuestion);
    setQuestion('');
  };

  if (!conversation) {
    return (
      <section className="glass-card min-h-[520px] flex flex-col items-center justify-center p-8 text-center">
        <Bot className="w-10 h-10 text-brand-400 mb-4" />
        <h2 className="text-lg font-semibold text-white">Choose a conversation</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">Start a new conversation or select one from your history to ask a career question.</p>
      </section>
    );
  }

  return (
    <section className="glass-card min-h-[520px] flex flex-col overflow-hidden">
      <header className="border-b border-slate-800/80 px-5 py-4">
        <h2 className="font-semibold text-white truncate">{conversation.title}</h2>
        <p className="text-xs text-slate-500 mt-1">Career guidance grounded in your saved profile</p>
      </header>

      <div className="flex-1 min-h-[360px] max-h-[58vh] overflow-y-auto p-5 space-y-4">
        {isLoading && <p className="text-sm text-slate-400 text-center py-8">Loading messages...</p>}
        {!isLoading && messages.length === 0 && (
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center">
            <Bot className="w-8 h-8 text-slate-500 mb-3" />
            <p className="text-sm text-slate-300">Ask your first career question.</p>
            <p className="text-xs text-slate-500 mt-1">Try asking about skills, your resume, or a career roadmap.</p>
          </div>
        )}
        {messages.map((message) => {
          const isUser = message.role === 'USER';
          return (
            <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
              {!isUser && <Bot className="w-5 h-5 shrink-0 mt-1 text-brand-400" />}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${isUser ? 'bg-brand-600/80 text-white' : 'bg-slate-800/80 border border-slate-700/70 text-slate-200'}`}>
                {message.content}
              </div>
              {isUser && <UserCircle2 className="w-5 h-5 shrink-0 mt-1 text-slate-400" />}
            </div>
          );
        })}
        {isSending && <p className="text-xs text-slate-500 pl-8">Career Assistant is thinking...</p>}
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="px-5 pb-3 text-sm text-rose-300" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="border-t border-slate-800/80 p-4 flex gap-2">
        <label htmlFor="career-question" className="sr-only">Ask a career question</label>
        <input
          id="career-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a career question..."
          disabled={isSending}
          className="min-w-0 flex-1 rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        />
        <button
          type="submit"
          disabled={isSending || !question.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </section>
  );
};

export default CareerChat;