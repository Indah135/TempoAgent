import React, { useState, useEffect } from 'react';
import { Clock, Settings, Download, ChevronDown, Sparkles } from 'lucide-react';
import { getIanaZone } from '../lib/timezone';

function getGreeting(hour) {
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export default function Header({ user, timezone = 'WIB', onNavigate }) {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iana = getIanaZone(timezone);
      setCurrentDateTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: iana,
        })
      );
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hourCycle: 'h23',
          timeZone: iana,
        }).format(now)
      );
      setGreeting(getGreeting(hour));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, [timezone]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    '';

  return (
    <header
      className="sticky top-0 z-30 px-5 py-3 flex items-center justify-between gap-4"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Left: Model selector pill */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-semibold text-white">Gemini Flash</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/40" />
      </div>

      {/* Center: greeting + time */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
        <Clock className="w-3.5 h-3.5 text-purple-400/70" />
        <span>
          {greeting}{displayName ? `, ${displayName}` : ''}
          {currentDateTime ? ` — ${currentDateTime} ${timezone}` : ''}
        </span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate?.('profile')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Konfigurasi</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
}
