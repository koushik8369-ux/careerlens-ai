import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, UserCircle2, Sparkles } from 'lucide-react';
import type { CareerAssistantConversation, CareerAssistantMessage } from '../../types';

interface CareerChatProps {
  conversation: CareerAssistantConversation | null;
  messages: CareerAssistantMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onSend: (question: string) => Promise<boolean>;
}

const STARTER_PROMPTS = [
  'What skills am I missing for my target role?',
  'How can I improve my resume?',
  'What should I learn next?',
  'Help me prepare for an interview.',
];

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

  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'ASSISTANT');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) return;
    if (await onSend(trimmedQuestion)) setQuestion('');
  };

  return (
    <section className="glass-card min-h-[520px] flex flex-col overflow-hidden">
      <header className="border-b border-slate-800/80 px-5 py-4">
        <h2 className="font-semibold text-white truncate">{conversation?.title ?? 'Your career conversation'}</h2>
        <p className="text-xs text-slate-500 mt-1">Career guidance grounded in your saved JOBFIT AI data</p>
      </header>

      <div className="flex-1 min-h-[360px] max-h-[58vh] overflow-y-auto p-5 space-y-4">
        {isLoading && <p className="text-sm text-slate-400 text-center py-8">Loading messages...</p>}
        {!isLoading && messages.length === 0 && (
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
            <Bot className="w-8 h-8 text-brand-400 mb-3" />
            <p className="text-sm font-medium text-slate-200">How can I help with your career?</p>
            <p className="text-xs text-slate-500 mt-1">Choose a prompt or ask anything about your career direction.</p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void onSend(prompt)}
                  disabled={isSending}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-brand-500/50 hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
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
        {!isSending && latestAssistantMessage?.followUpSuggestions.length ? (
          <div className="ml-8 flex flex-wrap gap-2" aria-label="Suggested follow-up questions">
            <Sparkles className="mt-2 h-3.5 w-3.5 text-brand-400" />
            {latestAssistantMessage.followUpSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void onSend(prompt)}
                disabled={isSending}
                className="rounded-full border border-brand-500/20 bg-brand-500/5 px-3 py-1.5 text-left text-xs text-brand-200 transition hover:bg-brand-500/15 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}
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
          placeholder="Ask about your resume, skills, job fit, or next steps..."
          maxLength={2000}
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