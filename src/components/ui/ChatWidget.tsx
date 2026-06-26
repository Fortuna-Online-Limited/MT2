import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../context/LangContext';
import type { ChatMessage } from '../../types';

function getSessionId() {
  let id = localStorage.getItem('mt_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('mt_session_id', id);
  }
  return id;
}

export default function ChatWidget() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const channel = supabase
      .channel(`chat_${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mt_chat_messages', filter: `session_id=eq.${sessionId}` },
        payload => setMessages(prev => [...prev, payload.new as ChatMessage])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const { data } = await supabase
      .from('mt_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    if ((data ?? []).length > 0) setStarted(true);
  }

  async function startChat(e: React.FormEvent) {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setStarted(true);
    await supabase.from('mt_chat_messages').insert({
      session_id: sessionId,
      visitor_name: visitorName,
      sender: 'admin',
      message: t(`Hi ${visitorName}! Welcome to MT Brand. How can I help you today?`, `你好 ${visitorName}！歡迎來到MT品牌。今天有什麼可以幫您？`),
    });
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const msg = input.trim();
    setInput('');
    await supabase.from('mt_chat_messages').insert({
      session_id: sessionId,
      visitor_name: visitorName || 'Visitor',
      sender: 'user',
      message: msg,
    });
    setSending(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold">{t('MT Brand Support', 'MT品牌客服')}</p>
                <p className="text-xs text-neutral-400">{t('Typically replies in minutes', '通常在幾分鐘內回覆')}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!started ? (
            <div className="p-4">
              <p className="text-sm text-neutral-600 mb-3">{t('Please enter your name to start chatting.', '請輸入您的姓名開始聊天。')}</p>
              <form onSubmit={startChat} className="space-y-3">
                <input
                  type="text"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  placeholder={t('Your name', '您的姓名')}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button type="submit" className="w-full py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                  {t('Start Chat', '開始聊天')}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 h-64 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700'}`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <form onSubmit={sendMessage} className="p-3 border-t border-neutral-100 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('Type a message...', '輸入訊息...')}
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button type="submit" disabled={sending || !input.trim()} className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all hover:scale-105 flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
