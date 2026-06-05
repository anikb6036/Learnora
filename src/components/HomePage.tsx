import React from 'react';
import { Sun, Moon, Sparkles, GraduationCap, Lock, Shield, Users, BarChart3, CloudLightning } from 'lucide-react';
import Logo from './Logo';

interface HomePageProps {
  isDark: boolean;
  onEnterPortal: (tab: 'fastReg' | 'authLogin' | 'adminLogin') => void;
}

export default function HomePage({ isDark, onEnterPortal }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF3F5] via-[#FFF8F9] to-[#FFFBFB] dark:from-[#110D12] dark:via-[#160E14] dark:to-[#0A0A0B] text-slate-800 dark:text-gray-200 transition-colors duration-300 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Subtle background glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Nav Header */}
      <header className="w-full border-b border-slate-200/20 bg-black sticky top-0 z-50 transition-colors shadow-md text-white">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <Logo size="sm" withStrapline={true} inverse={true} />

          {/* Center static items for look & feel */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            <a href="#features" className="hover:text-[#FF3B5C] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#FF3B5C] transition-colors">Interactive Loop</a>
            <a href="#sandbox" className="hover:text-[#FF3B5C] transition-colors">Sandbox Spec</a>
          </nav>

          {/* Action area */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onEnterPortal('authLogin')}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-black hover:bg-neutral-900 text-[#FF2C2C] hover:text-emerald-400 transition-all rounded-xl shadow-md cursor-pointer active:scale-95 font-extrabold"
            >
              Login
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0ECE1] border border-slate-200/40 text-[10px] font-mono font-bold tracking-widest text-black uppercase">
            <Sparkles className="w-3 h-3 text-black animate-pulse" />
            <span>Sandbox Core Ready</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif italic text-black dark:text-black leading-tight font-extrabold tracking-tight">
            Learn with Rigor,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">Coordinate with Grace.</span>
          </h2>

          <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed font-sans max-w-2xl">
            Learnora is an integrated administrative and academic scheduling ecosystem. Our platform implements dynamic sandbox queues, multi-role dashboards for administrators and advisors, and custom score evaluation logs with zero-config test bypasses.
          </p>

          {/* Action Buttons Hub */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => onEnterPortal('fastReg')}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-amber-500/15 hover:shadow-lg hover:shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-amber-955" />
              Apply For Admission
            </button>

            <button
              type="button"
              onClick={() => onEnterPortal('authLogin')}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 dark:bg-[#161618] dark:hover:bg-white/10 text-slate-800 dark:text-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-white/5 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Lock className="w-4 h-4 text-red-500" />
              Sign In to Portal
            </button>

            <button
              type="button"
              onClick={() => onEnterPortal('adminLogin')}
              className="px-6 py-3.5 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              Admin Entry
            </button>
          </div>

          {/* Dynamic stats bar */}
          <div className="pt-8 grid grid-cols-3 gap-6 border-t border-slate-200 dark:border-white/5 max-w-xl font-mono text-[11px]">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-serif">3 <span className="text-red-500 font-sans">+</span> Roles</p>
              <p className="text-slate-450 dark:text-gray-500 mt-1">Student, Advisor, Admin</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-serif">Offline-Safe</p>
              <p className="text-slate-450 dark:text-gray-500 mt-1">Automatic Local Storage</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white font-serif">Zero Config</p>
              <p className="text-slate-450 dark:text-gray-500 mt-1">Demo Otp Link Bypass</p>
            </div>
          </div>

        </div>

        {/* Right mockup side */}
        <div id="workflow" className="lg:col-span-5 space-y-4">
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0F0F11] border border-slate-150/80 dark:border-white/5 shadow-2xl relative">
            
            <p className="text-[10px] font-mono uppercase text-red-500 font-bold tracking-widest mb-4">
              Sandbox Simulation Lifecycle Loop
            </p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition">
                <div className="text-lg text-blue-900 dark:text-blue-400 w-7 h-7 flex items-center justify-center shrink-0 font-bold select-none animate-pulse">•</div>
                <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-gray-200">Submit Application Form</h4>
                   <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">Submit registration with smart country dropdowns and file verification bounds.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition">
                <div className="text-lg text-blue-900 dark:text-blue-400 w-7 h-7 flex items-center justify-center shrink-0 font-bold select-none animate-pulse">•</div>
                <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-gray-200">Dynamic Admin Review</h4>
                   <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">Admin logs the request, checks information validity, and clicks Approve to enroll.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 hover:bg-slate-55/60 dark:hover:bg-white/5 rounded-2xl transition">
                <div className="text-lg text-blue-900 dark:text-blue-400 w-7 h-7 flex items-center justify-center shrink-0 font-bold select-none animate-pulse">•</div>
                <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-gray-200">Credential Simulation Dispatch</h4>
                   <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">The platform auto-dispatches generated setup keys on the built-in Sandbox Student Inbox.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition">
                <div className="text-lg text-blue-900 dark:text-blue-400 w-7 h-7 flex items-center justify-center shrink-0 font-bold select-none animate-pulse">•</div>
                <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-gray-200">Academic Evaluations</h4>
                   <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">Instructors schedule class logs and evaluate grades, displaying performance curves instantly.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="w-full border-t border-slate-200/50 dark:border-white/5 bg-slate-100/50 dark:bg-[#070708] py-16">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">System Capabilities</p>
            <h3 className="text-3xl font-serif italic text-slate-900 dark:text-white font-extrabold">Fully Integrated Sandbox Operations</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400">Learnora comes outfitted with custom management utilities built directly into the client.</p>
          </div>

          <div id="sandbox" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-white dark:bg-[#0F0F11] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-10 h-10 flex items-center justify-center border border-amber-500/20">
                <GraduationCap className="w-5 h-5 flex-shrink-0" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-gray-200">Interactive Admissions</h4>
              <p className="text-[11.5px] text-slate-500 dark:text-gray-400 leading-relaxed">
                Student applications can be dynamically enqueued, inspected, assigned advisors, and verified under a centralized registrar workflow.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white dark:bg-[#0F0F11] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-10 h-10 flex items-center justify-center border border-amber-500/20">
                <Users className="w-5 h-5 flex-shrink-0" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-gray-200">Multi-Role Dashboards</h4>
              <p className="text-[11.5px] text-slate-500 dark:text-gray-400 leading-relaxed">
                Log in instantly using the demo autofill sidebar cards for Admin, Advisor, or Student. Explore views tailored strictly to each permission level.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white dark:bg-[#0F0F11] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-10 h-10 flex items-center justify-center border border-amber-500/20">
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-gray-200">Interactive Evaluations</h4>
              <p className="text-[11.5px] text-slate-500 dark:text-gray-400 leading-relaxed">
                Evaluate students easily. Generate dynamic graphs, test record trends, scorecard averages, and dispatch academic progress.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white dark:bg-[#0F0F11] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl w-10 h-10 flex items-center justify-center border border-amber-500/20">
                <CloudLightning className="w-5 h-5 flex-shrink-0" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-gray-200">Database Backups</h4>
              <p className="text-[11.5px] text-slate-500 dark:text-gray-400 leading-relaxed">
                Maintain security with JSON database snapshot dispatches. Back up or restore user databases instantly with clean client actions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-[#070708] pt-16 pb-12 text-slate-500 dark:text-gray-400 font-sans transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-200/50 dark:border-white/5">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" withStrapline={false} />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed max-w-sm">
              An advanced, simulated academic and administrative scheduling platform. Manage multi-role authorization states, advisor assignments, and live score trend reports with secure client-side storage.
            </p>
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Sandbox Network Status</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-gray-300">
                ACTIVE / NO-DELAY LATENCY
              </p>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-gray-500">Console Entry</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => onEnterPortal('fastReg')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
                  Admission Form
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onEnterPortal('authLogin')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
                  Student Sign In
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onEnterPortal('authLogin')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
                  Advisor Sign In
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onEnterPortal('adminLogin')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
                  Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Simulator Specs */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-gray-500">Sandbox Flows</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#workflow" className="hover:text-amber-500 transition-colors">Lifecycle Loops</a></li>
              <li><a href="#features" className="hover:text-amber-500 transition-colors">Role Capabilities</a></li>
              <li><a href="#sandbox" className="hover:text-amber-500 transition-colors">Client Database Sync</a></li>
              <li>
                <span className="text-slate-400 dark:text-gray-500 flex items-center gap-1.5">
                  Inbox Simulator <strong className="text-[9px] px-1 py-0.5 bg-amber-500/10 text-amber-500 font-mono rounded">FREE_OTP</strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Tech Stack Spec */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-gray-500">Simulation Target</h5>
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                This local node runs client-side triggers synced over a highly efficient in-memory JSON core with fallback to browser cache storage.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="p-1 px-1.5 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition text-[9px] font-mono text-slate-600 dark:text-gray-300 pointer-events-none">React 18</span>
                <span className="p-1 px-1.5 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition text-[9px] font-mono text-slate-600 dark:text-gray-300 pointer-events-none">Tailwind v4</span>
                <span className="p-1 px-1.5 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition text-[9px] font-mono text-slate-600 dark:text-gray-300 pointer-events-none">Vite</span>
                <span className="p-1 px-1.5 rounded bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition text-[9px] font-mono text-slate-600 dark:text-gray-300 pointer-events-none">Firestore</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright and dispatch credentials */}
        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-xs text-slate-800 dark:text-gray-300 font-bold">
              © {new Date().getFullYear()} Learnora Console Center. All rights reserved.
            </p>
            <p className="text-[10px] text-slate-450 dark:text-gray-500">
              Built for secure real-time student scheduling, evaluation reporting, and mock authorization trials.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[10.5px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-gray-400">
              SYSTEM CONTEXT: <strong className="text-emerald-500">SECURE DISPATCH</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161618] border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-gray-400">
              DATAFEED: <strong className="text-amber-500">LOCAL FIRESTORE</strong>
            </span>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-95 transition-all text-[10px] font-extrabold uppercase rounded-lg shadow-sm cursor-pointer hover:shadow-md active:scale-95 text-amber-950 font-sans"
              title="Return to Coordinates"
            >
              Back To Top ↑
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
