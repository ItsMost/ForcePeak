import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import WeeklyPlanner from './components/WeeklyPlanner/index.jsx';
import { Lock, Sparkles, Printer } from 'lucide-react';
import './index.css';
import './App.css';

import { supabase } from './supabaseClient';

// Read once at module load: the welcome-pack viewer is public (athletes open these links without logging in).
const packFile = new URLSearchParams(window.location.search).get('view-pack');

// Single-coach login: the coach only types a passcode. Behind the scenes it is a normal
// Supabase Auth account (fixed email + passcode as its password), so the database can be
// locked with RLS and the session stays signed in on every device.
const COACH_LOGIN_EMAIL = (import.meta.env.VITE_COACH_LOGIN_EMAIL as string | undefined) || 'coach@peakforce.app';

function App() {
  // ---- All hooks first (never after an early return) ----
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [viewPackHtml, setViewPackHtml] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<boolean>(!!packFile);
  const [packError, setPackError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auth session (skipped entirely for the public welcome-pack viewer)
  useEffect(() => {
    if (packFile) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthChecked(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Shared welcome pack
  useEffect(() => {
    if (!packFile) return;
    supabase.storage
      .from('welcome-packs')
      .download(packFile)
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Empty file received');
        return data.text();
      })
      .then((html) => {
        setViewPackHtml(html);
        setLoadingPack(false);
      })
      .catch((err) => {
        console.error('Error loading welcome pack:', err);
        setPackError('كتيّب الترحيب غير موجود أو منتهي الصلاحية // Welcome pack not found or expired.');
        setLoadingPack(false);
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('اكتب رمز الدخول / Enter your access code');
      return;
    }
    setLoggingIn(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email: COACH_LOGIN_EMAIL, password: passcode.trim() });
    setLoggingIn(false);
    if (error) {
      setErrorMsg('رمز الدخول غير صحيح! / Invalid Access Code!');
    } else {
      setPasscode('');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('تسجيل الخروج؟ / Log out?')) return;
    await supabase.auth.signOut();
    setPasscode('');
  };

  const handlePrintPack = () => {
    iframeRef.current?.contentWindow?.print();
  };

  // ---- Public welcome-pack viewer ----
  if (packFile) {
    if (loadingPack) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 antialiased font-sans">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-400 font-bold uppercase tracking-wider text-xs">جاري تحميل البرنامج التدريبي / Loading Training Blueprint...</p>
          </div>
        </div>
      );
    }

    if (packError || !viewPackHtml) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 antialiased font-sans">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl">⚠️</div>
            <p className="text-white font-bold leading-relaxed text-sm">{packError}</p>
            <a href="/" className="inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl border border-zinc-700">
              الذهاب للرئيسية / Go Home
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-[#121212] overflow-hidden select-none">
        {/* Floating Mobile Control Bar */}
        <header className="bg-[#1e1e1e]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5 sm:px-6 flex items-center justify-between z-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-lg shadow-orange-500/20">
              PF
            </div>
            <div>
              <h1 className="text-xs font-black text-white tracking-widest uppercase">PEAK FORCE</h1>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider -mt-0.5">Welcome Pack</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPack}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>حفظ / طباعة PDF</span>
            </button>
          </div>
        </header>

        {/* Full-bleed iframe viewer */}
        <main className="flex-1 w-full h-full relative overflow-hidden bg-[#121212]">
          <iframe
            ref={iframeRef}
            srcDoc={viewPackHtml}
            className="w-full h-full border-none"
            title="PEAK FORCE Welcome Pack"
          />
        </main>
      </div>
    );
  }

  // ---- Waiting for the stored session ----
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ---- Login ----
  if (!session) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 antialiased font-sans select-none relative overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#1e1e1e] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-widest uppercase">
            PEAK FORCE
          </h1>
          <p className="text-xs text-orange-500 font-black uppercase tracking-widest mt-1">
            Performance Lab
          </p>
          <div className="h-px bg-zinc-800 my-6" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-passcode" className="text-[11px] font-black text-zinc-400 uppercase tracking-widest block text-right mb-2" dir="rtl">
                رمز الدخول الخاص بالكابتن محمود علي
              </label>
              {/* Hidden username so password managers save the code for this site */}
              <input type="text" name="username" autoComplete="username" value={COACH_LOGIN_EMAIL} readOnly hidden />
              <input
                id="login-passcode"
                type="password"
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="•••••••••••••••••"
                className="w-full bg-[#121212] border border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white rounded-2xl p-4 text-center text-lg font-bold placeholder-zinc-700 outline-none transition-all tracking-widest"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-bold bg-red-500/10 border border-red-500/20 rounded-xl p-3 leading-relaxed">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              دخول / LOGIN
            </button>
          </form>

          <p className="text-[11px] text-zinc-500 font-medium mt-6 uppercase tracking-wider">
            Secured Area • Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App selection:bg-orange-500/20 antialiased font-sans min-h-screen bg-[#121212]">
      <WeeklyPlanner onLogout={handleLogout} />
    </div>
  );
}

export default App;
