import React, { useEffect, useState, useRef } from 'react';
import { Send, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types';

interface Session { session_id: string; visitor_name: string; last_message: string; unread: number; last_time: string; }

export default function AdminChat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (!selectedSession) return;
    loadMessages(selectedSession);
    const channel = supabase
      .channel(`admin_chat_${selectedSession}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mt_chat_messages', filter: `session_id=eq.${selectedSession}` },
        payload => setMessages(prev => [...prev, payload.new as ChatMessage])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadSessions() {
    const { data } = await supabase.from('mt_chat_messages').select('session_id, visitor_name, message, is_read, created_at').order('created_at', { ascending: false });
    if (!data) return;
    const map = new Map<string, Session>();
    data.forEach(m => {
      if (!map.has(m.session_id)) {
        map.set(m.session_id, { session_id: m.session_id, visitor_name: m.visitor_name, last_message: m.message, unread: 0, last_time: m.created_at });
      }
      if (!m.is_read && m.sender !== 'admin') {
        const s = map.get(m.session_id)!;
        map.set(m.session_id, { ...s, unread: s.unread + 1 });
      }
    });
    setSessions(Array.from(map.values()));
  }

  async function loadMessages(sid: string) {
    const { data } = await supabase.from('mt_chat_messages').select('*').eq('session_id', sid).order('created_at', { ascending: true });
    setMessages(data ?? []);
    await supabase.from('mt_chat_messages').update({ is_read: true }).eq('session_id', sid).eq('sender', 'user');
    loadSessions();
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selectedSession || sending) return;
    setSending(true);
    const msg = reply.trim();
    setReply('');
    await supabase.from('mt_chat_messages').insert({ session_id: selectedSession, visitor_name: 'Admin', sender: 'admin', message: msg, is_read: true });
    setSending(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Live Chat</h1><p className="text-neutral-500 text-sm">{sessions.length} conversations</p></div>
        <button onClick={loadSessions} className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden flex h-[600px]">
        {/* Session list */}
        <div className="w-64 border-r border-neutral-200 overflow-y-auto flex-shrink-0">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-neutral-400 text-sm">No conversations yet</div>
          ) : sessions.map(s => (
            <button key={s.session_id} onClick={() => setSelectedSession(s.session_id)} className={`w-full p-4 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${selectedSession === s.session_id ? 'bg-neutral-50' : ''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-medium text-neutral-900 text-sm">{s.visitor_name}</p>
                {s.unread > 0 && <span className="w-4 h-4 bg-neutral-900 text-white text-xs rounded-full flex items-center justify-center">{s.unread}</span>}
              </div>
              <p className="text-xs text-neutral-500 truncate">{s.last_message}</p>
              <p className="text-xs text-neutral-400 mt-1">{new Date(s.last_time).toLocaleDateString()}</p>
            </button>
          ))}
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                <p className="font-medium text-neutral-900 text-sm">{sessions.find(s => s.session_id === selectedSession)?.visitor_name || 'Visitor'}</p>
                <p className="text-xs text-neutral-500 font-mono">{selectedSession.slice(0, 20)}...</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.sender === 'admin' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-neutral-400' : 'text-neutral-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendReply} className="p-4 border-t border-neutral-200 flex gap-2">
                <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply..." className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                <button type="submit" disabled={sending || !reply.trim()} className="p-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
