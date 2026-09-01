import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Mail, Phone, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { ContactMessage } from '../../types';
import { apiFetch } from '../../lib/api';

interface AdminMessagesPageProps {
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminMessagesPage: React.FC<AdminMessagesPageProps> = ({
  onShowToast = (_msg?: string, _type?: 'success' | 'error') => {}
}) => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; messages: ContactMessage[] }>(`/api/contact?search=${encodeURIComponent(search)}`);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (msg: ContactMessage, isRead: boolean) => {
    try {
      const res = await apiFetch<{ success: boolean; contact: ContactMessage }>(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead })
      });
      if (res.success) {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? res.contact : m)));
        if (selectedMsg?.id === msg.id) setSelectedMsg(res.contact);
        onShowToast(`Message marked as ${isRead ? 'read' : 'unread'}.`, 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update message status.', 'error');
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!window.confirm('Delete this contact message permanently?')) return;
    try {
      const res = await apiFetch<{ success: boolean }>(`/api/contact/${msgId}`, { method: 'DELETE' });
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (selectedMsg?.id === msgId) setSelectedMsg(null);
        onShowToast('Message deleted.', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete message.', 'error');
    }
  };

  return (
    <div className="space-y-8 bg-[#f8f6f0] dark:bg-[#0a0a0a] text-stone-900 dark:text-[#f5f5f1] min-h-screen transition-colors p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#9a7229]/20 dark:border-[#c5a059]/20 pb-4">
        <div>
          <span className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-[0.25em]">Concierge Inquiries</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">Customer Messages</h1>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-stone-300 dark:border-[#c5a059]/30 hover:border-[#9a7229] dark:hover:border-[#c5a059] text-xs font-semibold text-stone-800 dark:text-zinc-200 uppercase tracking-wider transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-[#9a7229] dark:text-[#c5a059] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-wider border-b border-stone-200 dark:border-[#c5a059]/20 pb-2">
            Inquiry Ledger ({messages.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw className="w-5 h-5 text-[#9a7229] dark:text-[#c5a059] animate-spin mx-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-zinc-500 space-y-1">
              <MessageSquare className="w-8 h-8 text-stone-400 dark:text-zinc-600 mx-auto" />
              <p>No messages received yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {messages.map((m) => {
                const isSelected = selectedMsg?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMsg(m);
                      if (!m.isRead) handleMarkRead(m, true);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#9a7229]/10 dark:bg-[#c5a059]/15 border-[#9a7229] dark:border-[#c5a059]'
                        : m.isRead
                        ? 'bg-stone-50 dark:bg-[#0a0a0a] border-stone-200 dark:border-[#c5a059]/20 hover:border-[#9a7229]/50 dark:hover:border-[#c5a059]/50'
                        : 'bg-white dark:bg-[#1a1a1a] border-[#9a7229]/50 dark:border-[#c5a059]/60 hover:border-[#9a7229] dark:hover:border-[#c5a059]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-900 dark:text-zinc-200 truncate max-w-[150px]">{m.fullName}</span>
                      {!m.isRead && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-zinc-400 font-mono truncate">{m.subject}</div>
                    <div className="text-[10px] text-stone-500 dark:text-zinc-500 font-mono mt-1 flex items-center justify-between">
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      <span className="truncate max-w-[120px]">{m.email}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Message Reader */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 shadow-sm min-h-[400px]">
          {selectedMsg ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-stone-200 dark:border-[#c5a059]/20 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#9a7229] dark:text-[#c5a059] uppercase tracking-widest">Inquiry Message</span>
                  <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-[#f5f5f1]">{selectedMsg.subject}</h2>
                  <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-zinc-400 font-mono mt-2">
                    <span className="flex items-center gap-1 text-stone-800 dark:text-zinc-200 font-semibold">
                      {selectedMsg.fullName}
                    </span>
                    <span className="flex items-center gap-1 text-[#9a7229] dark:text-[#c5a059]">
                      <Mail className="w-3.5 h-3.5" /> {selectedMsg.email}
                    </span>
                    {selectedMsg.phone && (
                      <span className="flex items-center gap-1 text-stone-500 dark:text-zinc-400">
                        <Phone className="w-3.5 h-3.5" /> {selectedMsg.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkRead(selectedMsg, !selectedMsg.isRead)}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#c5a059]/30 hover:bg-[#9a7229]/10 dark:hover:bg-[#c5a059]/20 text-xs text-stone-800 dark:text-zinc-200"
                  >
                    Mark {selectedMsg.isRead ? 'Unread' : 'Read'}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMsg.id)}
                    className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="bg-stone-50 dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#c5a059]/20 rounded-2xl p-6 text-sm text-stone-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedMsg.message}
              </div>

              <div className="pt-2 text-right">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}`}
                  className="px-6 py-2.5 rounded-xl bg-[#9a7229] dark:bg-[#c5a059] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-wider hover:bg-[#7a581d] dark:hover:bg-[#d4af37] transition-all inline-flex items-center gap-2 shadow"
                >
                  <Mail className="w-4 h-4" /> Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-stone-500 dark:text-zinc-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-stone-400 dark:text-zinc-600 mx-auto" />
              <p className="text-xs">Select an inquiry from the list to read full message details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
