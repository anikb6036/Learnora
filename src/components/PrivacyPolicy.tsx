import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  FileText, 
  Database, 
  Search, 
  CheckCircle2, 
  Printer, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // References for scroll tracking
  const sectionsRef = {
    intro: useRef<HTMLElement>(null),
    collect: useRef<HTMLElement>(null),
    use: useRef<HTMLElement>(null),
    security: useRef<HTMLElement>(null),
    deletion: useRef<HTMLElement>(null),
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

      // Check which section is currently active in the viewport
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

  // Custom text highlighing
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

  // Copy Policy URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://learnora.in/privacy');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const menuItems = [
    { id: 'intro', label: '1. Introduction', icon: Eye },
    { id: 'collect', label: '2. Information We Collect', icon: Lock },
    { id: 'use', label: '3. How We Use Data', icon: Database },
    { id: 'security', label: '4. Storage & Security', icon: FileText },
    { id: 'deletion', label: '5. Retention & Deletion', icon: Shield },
    { id: 'contact', label: '6. Support & Contacts', icon: Mail },
  ];

  return (
    <div id="privacy-policy-view" className="min-h-screen bg-[#F8FAFC] dark:bg-[#070709] text-[#1E293B] dark:text-[#E2E8F0] font-sans antialiased selection:bg-amber-400/20 selection:text-amber-500">
      
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
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header Block */}
      <section className="relative overflow-hidden py-12 border-b border-slate-200/40 dark:border-white/[0.03] bg-white dark:bg-[#0B0B0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold tracking-normal bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
              Legal Compliance Department
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              We respect your digital safety and identity. This statement details our explicit parameters on user collection, Google OAuth integrations, and cloud storage compliance rules.
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
                {copiedLink ? 'Copied Link!' : 'Copy Policy Link'}
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
                Table of Contents
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

            {/* Quick Trust Banner */}
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                Confidentiality Standard
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                We strictly NEVER share, sell, or monetize user data. All access logs are kept private inside high-end Firestore encryption wrappers.
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
                placeholder="Search policy parameters..."
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
                id="intro" 
                ref={sectionsRef.intro}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Eye className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    1. Introduction & Overview
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3 font-normal">
                  <p>
                    {highlight(
                      "Welcome to Learnora (accessible at learnora.in). We are deeply dedicated to respecting and protecting your privacy. This document explains how Learnora gathers, organizes, implements, and secures your information when you access our proctored coding sandboxes, dynamic academic dashboard compilers, or complete authentication integrations."
                    )}
                  </p>
                  <p>
                    {highlight(
                      "By logging in, creating manual credentials, or utilizing our single-identity authorization systems, you accept and consent to the data processes described in this document. If you disagree, please terminate your website session immediately."
                    )}
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section 
                id="collect" 
                ref={sectionsRef.collect}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Lock className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    2. Information We Collect
                  </h2>
                </div>
                
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-4">
                  <p>
                    {highlight(
                      "We collect information that you input manually during our admission portals, alongside automated security parameters verified during system queries:"
                    )}
                  </p>

                  {/* Visual Sub-Cards */}
                  <div className="grid grid-cols-1 gap-4 mt-2">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#0F0F13] border border-slate-200/50 dark:border-white/[0.04]">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 font-sans tracking-normal text-amber-600 dark:text-amber-400">
                        Profile & Registration Details
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Full Name, primary email address, verified phone numbers, cohort selection preferences, dynamic scoring metrics, and transaction receipt references.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/[0.01] dark:bg-amber-500/[0.02] border border-amber-500/10">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 font-sans tracking-normal text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Google OAuth & Integration Scopes
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        When you select standard Google Sign-In, we request access to core public parameters to build your sandbox profiles. We strictly request:
                      </p>
                      
                      {/* Interactive Scope Box */}
                      <div className="space-y-2 bg-white dark:bg-[#060608] border border-slate-200/50 dark:border-white/5 p-3 rounded-lg font-sans text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/5 pb-1.5">
                          <span className="font-bold text-amber-500">email</span>
                          <span className="text-[10px] text-slate-400">Primary user email identification</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/5 pb-1.5">
                          <span className="font-bold text-amber-500">profile</span>
                          <span className="text-[10px] text-slate-400">Display name, given names, & profile picture</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-amber-500">openid</span>
                          <span className="text-[10px] text-slate-400">Cryptographic ID tokens for OAuth2 auth</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section 
                id="use" 
                ref={sectionsRef.use}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Database className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    3. How We Use Data
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "Learnora uses collected statistics purely to compile active compiler tests, track course progressions, and handle administrative security validations:"
                    )}
                  </p>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                      <span>Provisioning your unique student console workspace, compiler trackers, and sandbox logs.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                      <span>Dispensation of OTP verification credentials and secure login token authorization.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                      <span>Handling custom course calculators, academic reports, and cohort tuition distributions.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section 
                id="security" 
                ref={sectionsRef.security}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    4. Storage & Security
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "Your registry details and sandbox variables are stored safely in Google Cloud Firebase containers protected under rigorous security configurations. Standard TLS/SSL protocols guard all outgoing and incoming packets."
                    )}
                  </p>
                  <div className="p-4 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex gap-3 items-start">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Strict Confidentiality Mandate</span>
                      We strictly never share, rent, or lease your private coordinates with third-party tracking conglomerates or advertising agents. Your sandbox metrics are purely yours.
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section 
                id="deletion" 
                ref={sectionsRef.deletion}
                className="space-y-4 scroll-mt-28"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/10">
                    <Shield className="w-4 h-4 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-sans font-bold text-slate-950 dark:text-white">
                    5. Retention & Deletion Rights
                  </h2>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed space-y-3">
                  <p>
                    {highlight(
                      "You have legal rights to inspect, update, or completely erase your registration history and security entries from our servers."
                    )}
                  </p>
                  <p>
                    To execute complete removal of your student workspace profile and disconnect all Google OAuth authentications, please direct your requests to our data administrators at{' '}
                    <a href="mailto:admissions@learnora.in" className="text-amber-500 hover:underline font-sans text-sm font-semibold">admissions@learnora.in</a>{' '}
                    or developer support at{' '}
                    <a href="mailto:baidyaanik18@gmail.com" className="text-amber-500 hover:underline font-sans text-sm font-semibold">baidyaanik18@gmail.com</a>. All valid requests are executed within 7 working days.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section 
                id="contact" 
                ref={sectionsRef.contact}
                className="space-y-4 scroll-mt-28 font-normal pb-12"
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
                    For feedback, privacy audits, or queries regarding verification procedures:
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
                    <div className="h-px bg-slate-100 dark:bg-white/5" />
                    <div>
                      <span className="text-xs font-sans font-bold text-slate-400 block">Developer Support Line</span>
                      <a href="mailto:baidyaanik18@gmail.com" className="text-sm font-semibold text-amber-500 hover:underline">baidyaanik18@gmail.com</a>
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
                  At a Glance Summary
                </h4>
              </div>
              
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">01</span>
                  <span><strong>Google Sign-In Scope</strong> is used strictly for display configurations and secure sandbox setups.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">02</span>
                  <span><strong>We Never Share</strong> profile data with advertisers, third parties, or marketing registries.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-sans text-amber-500 font-bold">03</span>
                  <span><strong>Complete Data Control</strong> allows users to request account deletion anytime via email.</span>
                </li>
              </ul>
            </div>

            {/* Admin Support Ticket Box */}
            <div className="bg-white dark:bg-[#0F0F13]/90 border border-slate-200/60 dark:border-white/[0.04] rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 font-sans tracking-normal uppercase">
                Privacy Concierge Desk
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Need details regarding our security posture, database hashing, or Google API certification parameters? Get direct admin feedback.
              </p>
              <a 
                href="mailto:admin@learnora.in"
                className="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-white dark:text-amber-400 font-bold text-xs transition-all cursor-pointer border border-slate-200/50 dark:border-amber-500/20"
              >
                Contact Data Officer
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
