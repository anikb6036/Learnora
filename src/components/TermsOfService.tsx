import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  ArrowLeft, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Globe, 
  Search, 
  Printer, 
  Clock, 
  ChevronRight, 
  Share2,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('accept');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // References for scroll tracking
  const sectionsRef = {
    accept: useRef<HTMLElement>(null),
    eligibility: useRef<HTMLElement>(null),
    compiler: useRef<HTMLElement>(null),
    payments: useRef<HTMLElement>(null),
    suspension: useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null),
  };

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      // Progress bar percentage
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollPercent((window.scrollY / totalScroll) * 100);
      }

      // Check which section is currently active in viewport
      const scrollPos = window.scrollY + 160; // offset
      for (const [key, ref] of Object.entries(sectionsRef)) {
        if (ref.current) {
          const top = ref.current.offsetTop;
          const height = ref.current.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(key);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: keyof typeof sectionsRef) => {
    const target = sectionsRef[sectionId].current;
    if (target) {
      const offset = 100; // Offset for header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = target.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Custom text highlighting
  const highlight = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-amber-400/20 text-amber-600 dark:text-amber-400 font-semibold px-0.5 rounded border-b border-amber-500/30">
          {part}
        </mark>
      ) : part
    );
  };

  // Copy URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://learnora.in/terms');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const menuItems = [
    { id: 'accept', label: '1. Acceptance of Terms', icon: Globe },
    { id: 'eligibility', label: '2. Eligibility & Accounts', icon: CheckCircle2 },
    { id: 'compiler', label: '3. Coding Sandbox Rules', icon: BookOpen },
    { id: 'payments', label: '4. Tuition & Refund Terms', icon: DollarSign },
    { id: 'suspension', label: '5. Suspensions & Outages', icon: ShieldAlert },
    { id: 'contact', label: '6. Administrative support', icon: Mail },
  ];

  return (
    <div id="terms-of-service-view" className="min-h-screen bg-[#F8FAFC] dark:bg-[#070709] text-[#1E293B] dark:text-[#E2E8F0] font-sans antialiased selection:bg-amber-400/20 selection:text-amber-500">
      
      {/* Top Sticky Reading Bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-200 dark:bg-slate-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-all duration-75"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-1/4 h-[400px] w-[400px] bg-amber-500/5 dark:bg-amber-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] bg-sky-500/5 dark:bg-sky-500/[0.01] rounded-full blur-[140px] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 bg-white/85 dark:bg-[#0F0F13]/85 backdrop-blur-md border-b border-slate-200/50 dark:border-white/[0.04] z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer mr-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo size="sm" />
          </div>

          {/* Quick Stats/Metadata */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>6 min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header Block */}
      <section className="relative overflow-hidden py-12 border-b border-slate-200/40 dark:border-white/[0.03] bg-white dark:bg-[#0B0B0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold tracking-normal bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
              Student Cohort agreement
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
              Terms of Service
            </h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              By accessing our academic platforms, online sandboxes, and administrative compilers, you agree to comply with the legal parameters outlined below.
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-slate-200/50 dark:border-white/5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Copy
              </button>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-slate-200/50 dark:border-white/5"
              >
                <Share2 className="w-3.5 h-3.5" /> 
                {copiedLink ? 'Copied Link!' : 'Copy Terms Link'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: Sidebar TOC (4 cols on large screens) */}
          <aside className="lg:col-span-3 sticky top-28 self-start hidden lg:block space-y-6">
            <div className="bg-white dark:bg-[#0F0F13]/90 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm">
              <h3 className="font-sans text-xs text-slate-500 font-bold mb-4">
                Agreement Outline
              </h3>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500 pl-4 font-semibold' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-amber-500" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Help Banner */}
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                Enrollment Protection
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                By maintaining standard academic honor codes, your cohort seat is always fully secured. All performance evaluations are proctored safely.
              </p>
            </div>
          </aside>

          {/* MIDDLE COLUMN: Actual Content (6 cols on lg screens, full on mobile) */}
          <div className="col-span-1 lg:col-span-6 space-y-12">
            
            {/* Search Input Box */}
            <div className="bg-white dark:bg-[#0F0F13]/90 border border-slate-200/60 dark:border-white/[0.04] p-4 rounded-2xl shadow-sm flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search agreement sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-sm w-full placeholder:text-slate-400 text-slate-900 dark:text-white focus:ring-0"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="space-y-14">
              
              {/* Section 1 */}
              <section 
                id="accept" 
                ref={sectionsRef.accept}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Globe className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    1. Acceptance of Terms
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3 font-normal">
                  <p>
                    {highlight(
                      "By accessing, registering, or interacting with the course platforms, compilers, fee calculators, or academic registers hosted at Learnora (learnora.in), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service."
                    )}
                  </p>
                  <p>
                    {highlight(
                      "If you do not accept these terms in their entirety, you are strictly forbidden from creating a student or admin profile, compiling files, or submitting admission records."
                    )}
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section 
                id="eligibility" 
                ref={sectionsRef.eligibility}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    2. Eligibility & User Accounts
                  </h2>
                </div>
                
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                  <p>
                    {highlight(
                      "To establish enrollment within our specialized cohort tracks, you must register a unique user workspace profile, subject to the following rules:"
                    )}
                  </p>

                  <div className="grid grid-cols-1 gap-4 mt-2">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#0F0F13] border border-slate-200/50 dark:border-white/[0.04]">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 font-sans tracking-normal text-amber-600 dark:text-amber-400">
                        Google Single-Sign-In Integration
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        We leverage standard Google OAuth secure pathways to let you create accounts in one click. You guarantee that all details received from your Google profiles are authentic and accurate.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/[0.01] dark:bg-amber-500/[0.02] border border-amber-500/10">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 font-sans tracking-normal text-amber-600 dark:text-amber-400">
                        Single Identity Protection Rule
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Creating multiple or duplicate student personas, exploiting rating parameters, or submitting automated API query runs against our compiler routes will trigger immediate dashboard suspensions.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section 
                id="compiler" 
                ref={sectionsRef.compiler}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    3. Code Compiler & Interactive Sandbox Use
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "Learnora hosts sandbox environments and grading systems. Submitting malicious software, attempting container escape sequences, or trying to reverse-engineer test suite validation algorithms is heavily prohibited."
                    )}
                  </p>
                  <p>
                    {highlight(
                      "All coursework, problem explanations, structural layouts, and test matrices are the proprietary and exclusive intellectual property of Learnora.in."
                    )}
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section 
                id="payments" 
                ref={sectionsRef.payments}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    4. Payments, Scholarships & Refunds
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "All scholarship distributions, course invoices, and sandbox enrollment parameters are verified by academic administrators."
                    )}
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2" />
                      <span><strong>Admissions Calculations:</strong> All pricing structures computed in sandbox calculations are subject to manual validation of original transcript profiles.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-2" />
                      <span><strong>Refund Protocols:</strong> Seat deposits or workspace licensing fees are non-refundable once sandbox test configurations or official certificates are generated.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section 
                id="suspension" 
                ref={sectionsRef.suspension}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    5. Account Suspension & Outages
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "We maintain absolute legal authority to lock, remove, or limit any registered profiles who violate academic guidelines, fail to complete verification, or submit fraudulent transactions."
                    )}
                  </p>
                  <p>
                    We continuously optimize our active compilers, schedules, and grading pipelines. Learnora is not liable for brief server downtimes, cloud database latency, or unexpected maintenance intervals.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section 
                id="contact" 
                ref={sectionsRef.contact}
                className="space-y-4 scroll-mt-28 pb-12"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Mail className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    6. Support & Contact
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    For inquiries regarding terms compliance, billing statements, or database integrations:
                  </p>
                  
                  {/* Styled Box */}
                  <div className="bg-white dark:bg-[#0F0F13] border border-slate-200/50 dark:border-white/[0.04] p-5 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-xs font-sans font-bold text-slate-400 block">Admissions Email</span>
                        <a href="mailto:admissions@learnora.in" className="text-sm font-semibold text-amber-500 hover:underline">admissions@learnora.in</a>
                      </div>
                      <div>
                        <span className="text-xs font-sans font-bold text-slate-400 block sm:text-right">Admin Email</span>
                        <a href="mailto:admin@learnora.in" className="text-sm font-semibold text-amber-500 hover:underline sm:text-right block">admin@learnora.in</a>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>

          {/* RIGHT COLUMN: At a Glance panel (3 cols on large screens) */}
          <aside className="lg:col-span-3 sticky top-28 self-start space-y-6">
            
            {/* At a Glance Summary Card */}
            <div className="bg-white dark:bg-[#0F0F13]/90 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-normal">
                  Terms At a Glance
                </h4>
              </div>
              
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">01</span>
                  <span><strong>By using this platform</strong>, you agree to all proctored sandbox and compiler guidelines.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">02</span>
                  <span><strong>Single Account Rule</strong> is strictly enforced. Attempted exploit results in immediate suspension.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">03</span>
                  <span><strong>Admissions calculations</strong> are final and subject to transcript profile verification.</span>
                </li>
              </ul>
            </div>

            {/* Support Desk Ticket Box */}
            <div className="bg-white dark:bg-[#0F0F13]/90 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 font-sans tracking-normal uppercase">
                Agreement Hotline
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Have specific queries regarding refund policies, cohort seat allocations, Razorpay settlements, or Google API authentications? Reach our desk.
              </p>
              <a 
                href="mailto:admissions@learnora.in"
                className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-white dark:text-amber-400 font-bold text-xs transition-all cursor-pointer border border-slate-200/50 dark:border-amber-500/20"
              >
                Contact Admissions Desk
              </a>
            </div>

          </aside>

        </div>
      </main>

      {/* Footer Branding Area */}
      <footer className="bg-white dark:bg-[#09090C] border-t border-slate-200/50 dark:border-white/[0.04] py-8 transition-colors mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-sans">
            © 2026 Learnora.in • Distributed Academy Sandboxes. All rights reserved.
          </p>
          <button
            onClick={onBack}
            className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1"
          >
            Return to Academy Home <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </footer>

    </div>
  );
}
