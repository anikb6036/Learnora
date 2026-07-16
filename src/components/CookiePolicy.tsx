import React, { useState, useEffect, useRef } from 'react';
import { 
  Cookie, 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  FileText, 
  Search, 
  Printer, 
  Clock, 
  ChevronRight, 
  Share2,
  Settings,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface CookiePolicyProps {
  onBack: () => void;
}

export default function CookiePolicy({ onBack }: CookiePolicyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('intro');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // References for scroll tracking
  const sectionsRef = {
    intro: useRef<HTMLElement>(null),
    what: useRef<HTMLElement>(null),
    types: useRef<HTMLElement>(null),
    manage: useRef<HTMLElement>(null),
    contact: useRef<HTMLElement>(null),
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollPercent((window.scrollY / totalScroll) * 100);
      }

      const scrollPosition = window.scrollY + 200;
      let currentSection = 'intro';

      Object.entries(sectionsRef).forEach(([key, ref]) => {
        if (ref.current && ref.current.offsetTop <= scrollPosition) {
          currentSection = key;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = sectionsRef[sectionId as keyof typeof sectionsRef];
    if (section.current) {
      window.scrollTo({
        top: section.current.offsetTop - 120,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const lastUpdated = "July 16, 2026";

  const navigationLinks = [
    { id: 'intro', label: 'Introduction', icon: <FileText className="w-4 h-4" /> },
    { id: 'what', label: 'What are Cookies?', icon: <Cookie className="w-4 h-4" /> },
    { id: 'types', label: 'Types of Cookies We Use', icon: <Settings className="w-4 h-4" /> },
    { id: 'manage', label: 'Managing Cookies', icon: <Shield className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Information', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-gray-100 font-sans selection:bg-amber-500/30">
      <div 
        className="fixed top-0 left-0 h-1 bg-amber-500 z-50 transition-all duration-150 ease-out"
        style={{ width: `${scrollPercent}%` }}
      />
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
              <Logo hideTextOnMobile={true} />
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-[#121214] px-4 py-2 rounded-full border border-slate-200 dark:border-white/5 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search policy..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm w-48 text-slate-800 dark:text-gray-200 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={copyPageLink}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300 relative group"
                  title="Share link"
                >
                  {copiedLink ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
                  <span className="absolute -bottom-10 right-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-gray-300 group relative"
                  title="Print policy"
                >
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          <div className="lg:w-[320px] shrink-0">
            <div className="sticky top-28 bg-white dark:bg-[#121214] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 px-3 flex items-center gap-2">
                <Cookie className="w-4 h-4 text-amber-500" /> Navigation
              </h3>
              <nav className="space-y-1">
                {navigationLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      activeSection === link.id 
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' 
                        : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg transition-colors ${activeSection === link.id ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/20'}`}>
                        {link.icon}
                      </span>
                      {link.label}
                    </div>
                    {activeSection === link.id && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 px-3">
                <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last Updated: <span className="text-slate-700 dark:text-gray-300 font-medium">{lastUpdated}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Version: <span className="text-slate-700 dark:text-gray-300 font-medium">1.0</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-3xl">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold tracking-wide mb-6">
                <Cookie className="w-4 h-4" /> LEGAL AGREEMENT
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
                Cookie Policy
              </h1>
              <p className="text-lg text-slate-600 dark:text-gray-400 leading-relaxed">
                This Cookie Policy explains how Learnora uses cookies and similar technologies to recognize you when you visit our platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
              </p>
            </div>

            <div className="space-y-16 pb-24">
              <section id="intro" ref={sectionsRef.intro} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </div>
                  1. Introduction
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 leading-loose">
                  <p>
                    At Learnora, we believe in being clear and open about how we collect and use data related to you. This Cookie Policy provides detailed information about how and when we use cookies on our platform.
                  </p>
                  <p>
                    By continuing to visit or use our services, you are agreeing to the use of cookies and similar technologies for the purposes we describe in this policy.
                  </p>
                </div>
              </section>

              <section id="what" ref={sectionsRef.what} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </div>
                  2. What are Cookies?
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 leading-loose">
                  <p>
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
                  </p>
                  <p>
                    Cookies set by the website owner (in this case, Learnora) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., interactive content and analytics).
                  </p>
                </div>
              </section>

              <section id="types" ref={sectionsRef.types} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </div>
                  3. Types of Cookies We Use
                </h2>
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Essential Cookies</h3>
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
                      These cookies are strictly necessary to provide you with services available through our platform and to use some of its features, such as access to secure areas. Without these cookies, our platform cannot function properly.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Performance & Functionality Cookies</h3>
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
                      These cookies are used to enhance the performance and functionality of our platform but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Analytics & Customization Cookies</h3>
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed text-sm">
                      These cookies collect information that is used either in aggregate form to help us understand how our platform is being used or how effective our marketing campaigns are, or to help us customize our platform for you.
                    </p>
                  </div>
                </div>
              </section>

              <section id="manage" ref={sectionsRef.manage} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </div>
                  4. Managing Cookies
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 leading-loose">
                  <p>
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject.
                  </p>
                  <p>
                    You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our platform though your access to some functionality and areas may be restricted.
                  </p>
                </div>
              </section>

              <section id="contact" ref={sectionsRef.contact} className="scroll-mt-32">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </div>
                  5. Contact Information
                </h2>
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-gray-300 leading-loose mb-8">
                  <p>
                    If you have any questions about our use of cookies or other technologies, please contact us at:
                  </p>
                </div>
                <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Privacy Team</h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm">Available Monday - Friday, 9am - 5pm EST</p>
                  </div>
                  <a 
                    href="mailto:privacy@learnora.in"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all hover:shadow-lg active:scale-95"
                  >
                    <Mail className="w-4 h-4" /> Email Privacy Team
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
