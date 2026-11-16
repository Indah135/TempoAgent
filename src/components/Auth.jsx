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
    <div className="min-h-screen bg-app flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-3.5"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
          >
            <Sparkles className="w-7 h-7 text-purple-100 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            TempoAgent
          </h1>
          <p className="text-xs sm:text-sm text-white/40 font-medium mt-1">
            Personal Task & Schedule Optimizer Agent
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-window rounded-[26px] p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #9333ea, #c084fc)' }} />

          {/* Mode Switcher Tabs */}
          <div
            className="flex p-1 rounded-xl mb-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              style={mode === 'login' ? { background: 'rgba(139,92,246,0.3)' } : {}}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              style={mode === 'register' ? { background: 'rgba(139,92,246,0.3)' } : {}}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Unauthorized Alert */}
          {unauthorizedError && (
            <div
              className="mb-5 p-3 rounded-xl text-xs flex items-start gap-2.5"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-amber-300 mb-0.5">Akses Ditolak (401 Unauthorized)</span>
                <span className="text-amber-200/80">{unauthorizedError}</span>
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div
              className="mb-5 p-3 rounded-xl text-xs flex items-start gap-2.5"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed text-red-300">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="mb-5 p-3 rounded-xl text-xs flex items-start gap-2.5"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-relaxed text-emerald-300">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Nama Lengkap (Register) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            )}

            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">
                Password {mode === 'register' && <span className="font-normal text-white/25">(min. 6 karakter)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-white/30 hover:text-white/60 absolute right-3 top-1/2 -translate-y-1/2 rounded focus:outline-none"
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
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-white font-semibold text-xs sm:text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
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
          <div className="mt-6 text-center text-xs text-white/40 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {mode === 'login' ? (
              <p>
                Belum memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="font-semibold text-purple-400 hover:text-purple-300 underline"
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
                  className="font-semibold text-purple-400 hover:text-purple-300 underline"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-center mt-5 text-[11px] text-white/25">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
          <span>Autentikasi aman terenkripsi via Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
