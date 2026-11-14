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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Top decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-amber-400" />

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Sambungkan Proyek Supabase
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan URL dan Anon Key Supabase Anda untuk mengaktifkan Login & Database.
            </p>
          </div>
        </div>

        {/* Direct Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>Supabase Project URL</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Supabase Anon / Public Key</span>
            </label>
            <input
              type="text"
              required
              placeholder="sb_publishable_... atau eyJhbGci..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Simpan & Masuk ke Halaman Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Info box */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 space-y-1.5">
          <p className="font-semibold text-slate-700">Dimana menemukan URL & Key ini?</p>
          <p>
            Buka dashboard Supabase Anda di{' '}
            <strong className="text-slate-700">Project Settings &gt; API</strong>. Salin <strong>Project URL</strong> dan <strong>anon/public Key</strong>.
          </p>
          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
            * Data ini akan disimpan di browser Anda sehingga aplikasi bisa langsung terbuka tanpa perlu mematikan atau mengulang terminal.
          </p>
        </div>
      </div>
    </div>
  );
}
