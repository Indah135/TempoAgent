import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function Auth({ unauthorizedError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi dasar
    if (!email.trim() || !password) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Nama lengkap wajib diisi untuk pendaftaran.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal harus 6 karakter.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Registrasi user baru menggunakan supabase.auth.signUp
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        setSuccessMsg(
          'Akun berhasil dibuat! Silakan masuk menggunakan akun baru Anda.'
        );
        setMode('login');
        setPassword('');
      } else {
        // Login user menggunakan supabase.auth.signInWithPassword
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email atau password yang Anda masukkan salah.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Email belum dikonfirmasi. Silakan cek kotak masuk email Anda.');
          }
          throw error;
        }

        // Login berhasil, onAuthStateChange di App.jsx akan menangkap session secara otomatis
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-blue-50/40 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 mb-3.5">
            <Sparkles className="w-7 h-7 text-sky-100 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-700 via-blue-600 to-sky-900 bg-clip-text text-transparent">
            TempoAgent
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Personal Task & Schedule Optimizer Agent
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 relative overflow-hidden backdrop-blur-sm">
          {/* Decorative colored top border bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-amber-400" />

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100/90 p-1 rounded-xl mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Unauthorized Alert if user tried to bypass via URL */}
          {unauthorizedError && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 shadow-2xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-amber-800 mb-0.5">Akses Ditolak (401 Unauthorized)</span>
                <span>{unauthorizedError}</span>
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Nama Lengkap (Hanya saat Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password {mode === 'register' && <span className="font-normal text-slate-400">(min. 6 karakter)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 rounded focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 hover:shadow-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Dashboard</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom helper switcher */}
          <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            {mode === 'login' ? (
              <p>
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="font-semibold text-sky-600 hover:text-sky-700 underline"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="font-semibold text-sky-600 hover:text-sky-700 underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-center mt-5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autentikasi aman terenkripsi via Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
