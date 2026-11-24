import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RotateCcw, Mic, Paperclip, FileUp } from 'lucide-react';
import QuickPrompts from './QuickPrompts';

export default function ChatPanel({
  messages,
  isSending,
  isUploading,
  onSendMessage,
  onUploadFile,
  onClearChat,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Fokus otomatis ke kotak input saat panel chat dibuka,
  // sehingga pengguna langsung bisa mengetik perintah
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isSending) return;
    const msg = input.trim();
    setInput('');
    onSendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectPrompt = (promptText) => {
    setInput(promptText);
    inputRef.current?.focus();
  };

  const glassPanel = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
  };

  return (
    <div className="rounded-2xl flex flex-col h-full min-h-0 overflow-hidden" style={glassPanel}>
      {/* Panel Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Chat dengan AI Agent</h2>
            <p className="text-[11px] text-white/40">Instruksi natural untuk atur jadwal & tugas</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            title="Bersihkan riwayat chat tampilan"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors text-xs inline-flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
        {messages.length === 0 ? (
          <div className="py-4 flex flex-col items-center text-center justify-center h-full min-h-[220px]">
            {/* Orb */}
            <div className="orb mb-3 shrink-0" />
            <h3 className="font-bold text-white text-base sm:text-lg mb-1">
              Siap Membuat Jadwal Baru?
            </h3>
            <p className="text-xs text-white/40 max-w-xs leading-relaxed mb-4 px-2">
              Saya siap membantu Anda menyusun jadwal, memeriksa waktu bentrok, dan merancang target belajar secara optimal.
            </p>
            <div className="w-full max-w-sm px-2">
              <QuickPrompts onSelectPrompt={handleSelectPrompt} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="mt-3 w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-200 hover:text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(139,92,246,0.35)' }}
              >
                <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload Foto / Dokumen Jadwal (JPG/JPEG, PNG, PDF, Excel)</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                  >
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'text-white rounded-tr-sm'
                      : 'text-white/85 rounded-tl-sm whitespace-pre-line'
                  }`}
                  style={
                    isUser
                      ? { background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }
                      : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <User className="w-3.5 h-3.5 text-white/70" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-start gap-2.5 justify-start">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 animate-pulse"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
            >
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 text-xs text-purple-300 font-medium"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <div className="flex space-x-1 items-center">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
              <span>
                {isUploading
                  ? 'Sedang memindai foto / dokumen & mengekstrak jadwal...'
                  : 'TempoAgent sedang berpikir...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts when there are messages */}
      {messages.length > 0 && (
        <div className="px-4 py-1.5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <QuickPrompts onSelectPrompt={handleSelectPrompt} />
        </div>
      )}

      {/* Input Form — selalu terlihat di bagian bawah */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(18,8,34,0.6)' }}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.jpe,.jfif,.png,.webp,.pdf,.xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUploadFile) {
              onUploadFile(file);
            }
            e.target.value = '';
          }}
        />

        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl px-3.5 py-2.5 transition-all focus-within:ring-1 focus-within:ring-purple-500/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder="Tanyakan apa saja ke TempoAgent... (mis: Buat jadwal besok)"
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-60"
              />
            </div>
            {/* Toolbar */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  title="Unggah foto atau dokumen jadwal (JPG, PNG, PDF, Excel, CSV)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 hover:text-white transition-all disabled:opacity-40 active:scale-95"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Upload Foto / Dokumen</span>
                </button>
                <span className="hidden lg:inline text-[10px] text-white/30">
                  Tekan <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60 font-mono">Enter</kbd>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Kirim</span>
                      <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
