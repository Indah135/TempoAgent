import React, { useState } from 'react';
import { Database, AlertTriangle, Key, Globe, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, saveManualSupabaseConfig } from '../lib/supabase';

export default function SetupSupabase() {
  const [inputUrl, setInputUrl] = useState(supabaseUrl || '');
  const [inputKey, setInputKey] = useState(supabaseAnonKey || '');
  const [error, setError] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setError('');

    const cleanUrl = inputUrl.trim();
    const cleanKey = inputKey.trim();

    if (!cleanUrl || !cleanKey) {
      setError('Harap isi kedua bidang URL dan Anon Key.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError('URL Supabase harus diawali dengan https://');
      return;
    }

    if (cleanUrl.includes('<id-proyek') || cleanUrl.includes('your-project-id')) {
      setError('Harap masukkan URL proyek Supabase Anda yang sebenarnya (bukan teks placeholder).');
      return;
    }

    saveManualSupabaseConfig(cleanUrl, cleanKey);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="glass-window max-w-lg w-full rounded-[26px] p-6 sm:p-8 relative overflow-hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #9333ea, #c084fc)' }} />

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-purple-300 shrink-0"
            style={{ background: 'rgba(139,92,246,0.2)' }}
          >
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Sambungkan Proyek Supabase
            </h2>
            <p className="text-xs text-white/40">
              Masukkan URL dan Anon Key Supabase Anda untuk mengaktifkan Login & Database.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-xl text-xs flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Supabase Project URL</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Supabase Anon / Public Key</span>
            </label>
            <input
              type="text"
              required
              placeholder="sb_publishable_... atau eyJhbGci..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
          >
            <span>Simpan & Masuk ke Halaman Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Info box */}
        <div
          className="mt-5 p-3.5 rounded-xl text-[11px] space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="font-semibold text-white/70">Dimana menemukan URL & Key ini?</p>
          <p className="text-white/40">
            Buka dashboard Supabase Anda di{' '}
            <strong className="text-white/60">Project Settings &gt; API</strong>. Salin <strong>Project URL</strong> dan <strong>anon/public Key</strong>.
          </p>
          <p className="text-[10px] text-white/25 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            * Data ini akan disimpan di browser Anda sehingga aplikasi bisa langsung terbuka tanpa perlu mematikan atau mengulang terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
