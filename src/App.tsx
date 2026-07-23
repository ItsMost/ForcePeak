import React, { useState, useEffect } from 'react';
import WeeklyPlanner from './components/WeeklyPlanner/index.jsx';
import { Lock, LogOut, Sparkles, Printer } from 'lucide-react';
import './index.css';
import './App.css';

import { supabase } from './supabaseClient';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const [viewPackHtml, setViewPackHtml] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<boolean>(false);
  const [packError, setPackError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('peakforce_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    // Check if viewing a shared welcome pack
    const urlParams = new URLSearchParams(window.location.search);
    const packFile = urlParams.get('view-pack');
    if (packFile) {
      setLoadingPack(true);
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
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'mahmoud123456789') {
      localStorage.setItem('peakforce_authenticated', 'true');
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('رمز الدخول غير صحيح! / Invalid Access Code!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('peakforce_authenticated');
    setIsAuthenticated(false);
    setPasscode('');
  };

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

  if (packError) {
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

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handlePrintPack = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  if (viewPackHtml) {
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
              <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider -mt-0.5">Welcome Pack</p>
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 antialiased font-sans select-none relative overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#1e1e1e] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-650 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>

          <h1 className="text-3xl font-black text-white tracking-widest uppercase">
            PEAK FORCE
          </h1>
          <p className="text-xs text-orange-500 font-black uppercase tracking-widest mt-1">
            Athletic Performance System
          </p>
          <div className="h-px bg-zinc-800 my-6" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block text-right mb-2" dir="rtl">
                رمز الدخول الخاص بالكابتن محمود علي
              </label>
              <input
                type="password"
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
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-orange-600/10 hover:shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              دخول / LOGIN
            </button>
          </form>

          <p className="text-[10px] text-zinc-500 font-medium mt-6 uppercase tracking-wider">
            Secured Area • Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App selection:bg-orange-500/20 antialiased font-sans flex flex-col min-h-screen bg-[#121212] text-white">
      {/* Top Header with Logout Button */}
      <header className="bg-[#1a1a1a] border-b border-zinc-800 px-4 py-2.5 sm:px-6 flex items-center justify-between z-50 shrink-0 select-none print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md">
            PF
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-widest uppercase">PEAK FORCE</h1>
            <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider -mt-0.5">Weekly Planner</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 bg-zinc-800 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-zinc-800"
          title="تسجيل الخروج / Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* Main Content Area: Renders only the WeeklyPlanner */}
      <main className="flex-1 min-h-0 relative">
        <WeeklyPlanner />
      </main>
    </div>
  );
}

export default App;