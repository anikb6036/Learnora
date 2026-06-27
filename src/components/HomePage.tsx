import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Shield, 
  Code2, 
  Atom, 
  Target, 
  Sparkles, 
  ChevronRight, 
  Bookmark, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  Calendar,
  Award,
  Terminal,
  Activity,
  Cpu,
  Lock,
  MessageSquare,
  Sparkle,
  Percent,
  Check,
  Search,
  BookMarked,
  UserCheck,
  GraduationCap,
  Calculator
} from 'lucide-react';
import { Course } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import admissionHeroImg from '../assets/images/admission_hero_1781153839906.png';

// Dynamic Area of Interest Categorizer
const getCourseCategory = (courseName: string): string => {
  const nameLower = courseName.toLowerCase();
  if (nameLower.includes('product') || nameLower.includes('management') || nameLower.includes('business') || nameLower.includes('mba') || nameLower.includes('pm')) {
    return 'Product Management with AI';
  }
  if (nameLower.includes('data science') || nameLower.includes('machine learning') || nameLower.includes('ml') || nameLower.includes('biology') || nameLower.includes('neet') || nameLower.includes('medical') || nameLower.includes('chemistry') || nameLower.includes('science')) {
    return 'Data Science and AI-ML';
  }
  if (nameLower.includes('analytics') || nameLower.includes('analysis') || nameLower.includes('statistics') || nameLower.includes('stats')) {
    return 'Analytics and AI';
  }
  if (nameLower.includes('software') || nameLower.includes('engineering') || nameLower.includes('web') || nameLower.includes('frontend') || nameLower.includes('backend') || nameLower.includes('cse') || nameLower.includes('coding') || nameLower.includes('jee') || nameLower.includes('physics') || nameLower.includes('math')) {
    return 'Software Development Engineering';
  }
  if (nameLower.includes('marketing') || nameLower.includes('seo') || nameLower.includes('sales')) {
    return 'Marketing and Analytics';
  }
  if (nameLower.includes('finance') || nameLower.includes('fintech') || nameLower.includes('accounting') || nameLower.includes('blockchain') || nameLower.includes('money') || nameLower.includes('technology')) {
    return 'Finance and Technology';
  }
  return 'Software Development Engineering';
};

interface AreaOfInterest {
  id: string;
  name: string;
  defaultCount: number;
}

const areasOfInterest: AreaOfInterest[] = [
  { id: 'pm', name: 'Product Management with AI', defaultCount: 8 },
  { id: 'analytics', name: 'Analytics and AI', defaultCount: 9 },
  { id: 'datascience', name: 'Data Science and AI-ML', defaultCount: 15 },
  { id: 'sde', name: 'Software Development Engineering', defaultCount: 11 },
  { id: 'marketing', name: 'Marketing and Analytics', defaultCount: 8 },
  { id: 'finance', name: 'Finance and Technology', defaultCount: 5 },
];

const PMIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
    <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
      <div className="bg-[#8E8EF0] rounded-xs shadow-xs"></div>
      <div className="bg-amber-450 rounded-xs shadow-xs flex items-center justify-center relative">
        <span className="text-white font-black text-[9px] leading-none">+</span>
      </div>
      <div className="bg-[#5D7BEE] rounded-xs shadow-xs"></div>
      <div className="bg-[#C96CEB] rounded-xs shadow-xs"></div>
    </div>
  </div>
);

const AnalyticsIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
    <div className="flex items-end gap-0.5 h-5">
      <div className="w-1 h-2 bg-[#3B82F6] rounded-xs shadow-xs" />
      <div className="w-1 h-3.5 bg-[#A855F7] rounded-xs shadow-xs" />
      <div className="w-1 h-5 bg-[#EF4444] rounded-xs shadow-xs" />
    </div>
  </div>
);

const DataScienceIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100/50 dark:border-purple-900/30">
    <Atom className="w-5 h-5 text-[#A855F7] animate-[spin_10s_linear_infinite]" />
  </div>
);

const SDEIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100/50 dark:border-red-900/30">
    <Code2 className="w-5 h-5 text-red-500" />
  </div>
);

const MarketingIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100/50 dark:border-rose-900/30">
    <Target className="w-5 h-5 text-rose-500" />
  </div>
);

const FinanceIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center shrink-0 select-none bg-[#2563EB]/10 rounded-xl border border-blue-500/20">
    <span className="text-[#2563EB] dark:text-blue-400 font-extrabold text-sm font-sans">$</span>
  </div>
);

interface HomePageProps {
  isDark: boolean;
  onEnterPortal: (tab: 'fastReg' | 'authLogin' | 'adminLogin', courseName?: string) => void;
  courses?: Course[];
}

export default function HomePage({ isDark, onEnterPortal, courses = [] }: HomePageProps) {
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Interactive Console Demo States
  const [activeConsoleTab, setActiveConsoleTab] = useState<'status' | 'metrics' | 'proctor'>('status');
  const [countdownMinutes, setCountdownMinutes] = useState(11);
  const [countdownSeconds, setCountdownSeconds] = useState(48);

  // Eligibility & Scholarship Calculator States
  const [calcCourse, setCalcCourse] = useState<string>('course-1');
  const [calcQualification, setCalcQualification] = useState<string>('Undergraduate');
  const [calcGrade, setCalcGrade] = useState<number>(85);
  const [eligibilityResult, setEligibilityResult] = useState<{
    status: 'High' | 'Moderate' | 'Ineligible';
    scholarship: number;
    baseFee: number;
    estimatedFee: number;
    badgeColor: string;
  }>({ status: 'High', scholarship: 30, baseFee: 14999, estimatedFee: 10499, badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' });

  // FAQ Accordion States
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  // Synchronize initial calcCourse when courses are loaded
  useEffect(() => {
    if (courses && courses.length > 0) {
      if (!calcCourse || !courses.some(c => c.id === calcCourse)) {
        setCalcCourse(courses[0].id);
      }
    }
  }, [courses]);

  // Active Live Class countdown simulator
  useEffect(() => {
    const timer = setInterval(() => {
      if (countdownSeconds > 0) {
        setCountdownSeconds(prev => prev - 1);
      } else if (countdownMinutes > 0) {
        setCountdownMinutes(prev => prev - 1);
        setCountdownSeconds(59);
      } else {
        setCountdownMinutes(15);
        setCountdownSeconds(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds, countdownMinutes]);

  // Recalculate scholarship and fees in real-time
  useEffect(() => {
    let baseFee = 12000;
    
    // Find course from list
    const foundCourse = courses.find(c => c.id === calcCourse || c.name === calcCourse || c.code === calcCourse);
    if (foundCourse && foundCourse.fee !== undefined) {
      baseFee = foundCourse.fee;
    } else {
      // Fallback matching names or ids
      if (calcCourse === 'course-1' || calcCourse === 'Java Masterclass' || calcCourse === 'JAVA') baseFee = 14999;
      else if (calcCourse === 'course-2' || calcCourse === 'Full-Stack JavaScript Development' || calcCourse === 'JS') baseFee = 11999;
      else if (calcCourse === 'course-3' || calcCourse === 'Python AI & Data Science' || calcCourse === 'PY') baseFee = 12999;
      else if (calcCourse === 'course-4' || calcCourse === 'SDET Specialization (QA Automation)' || calcCourse === 'SDET') baseFee = 9999;
      else if (calcCourse === 'course-5' || calcCourse === 'UI/UX Design Academy' || calcCourse === 'UIUX') baseFee = 8999;
      else if (calcCourse === 'course-6' || calcCourse === 'Cybersecurity Professional' || calcCourse === 'CYBER') baseFee = 15999;
    }

    let schPercent = 0;
    if (calcGrade >= 95) schPercent = 50;
    else if (calcGrade >= 85) schPercent = 30;
    else if (calcGrade >= 75) schPercent = 15;
    else if (calcGrade >= 60) schPercent = 5;

    // Additional boost based on qualification
    if (calcQualification === 'High School' && schPercent > 0) {
      schPercent = Math.min(schPercent + 5, 55);
    }

    const discounted = baseFee * (1 - schPercent / 100);
    let eligibilityStatus: 'High' | 'Moderate' | 'Ineligible' = 'High';
    let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

    if (calcGrade < 60) {
      eligibilityStatus = 'Ineligible';
      badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    } else if (calcGrade < 75) {
      eligibilityStatus = 'Moderate';
      badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }

    setEligibilityResult({
      status: eligibilityStatus,
      scholarship: schPercent,
      baseFee,
      estimatedFee: Math.round(discounted),
      badgeColor
    });
  }, [calcCourse, calcQualification, calcGrade, courses]);

  const getCourseRoadmap = (courseName: string = '', courseCode: string = '') => {
    const nameLower = courseName.toLowerCase();
    const codeLower = courseCode.toLowerCase();

    if (nameLower.includes('web') || nameLower.includes('software') || nameLower.includes('engineering') || codeLower.includes('web') || codeLower.includes('cse')) {
      return [
        { month: 1, title: 'Frontend Fundamentals', desc: 'HTML5, CSS3, Tailwind CSS, Responsive Design, and Javascript ES6 basics.' },
        { month: 2, title: 'Modern UI Libraries', desc: 'React 18+, Component architecture, Hook patterns, state management, and Framer Motion animations.' },
        { month: 3, title: 'Backend & APIs', desc: 'Node.js, Express framework, crafting RESTful APIs, and token-based authentication.' },
        { month: 4, title: 'Databases & Integration', desc: 'SQL (PostgreSQL/MySQL) vs NoSQL (MongoDB/Firestore), schema migrations, and ORMs (Drizzle/Prisma).' },
        { month: 5, title: 'Production Deployment & CI/CD', desc: 'Cloud Run / Vercel containers hosting, secure CORS policies, automated test suites, and git workflows.' },
      ];
    } else if (nameLower.includes('jee') || codeLower.includes('jee') || nameLower.includes('physics') || nameLower.includes('math')) {
      return [
        { month: 1, title: 'Calculus & Mechanics', desc: 'Kinematics, Newton’s Laws of Motion, work-power-energy, and modern mathematical limits & derivatives.' },
        { month: 2, title: 'Fluids & Chemistry Basics', desc: 'Fluid dynamics, thermodynamics, key organic nomenclature pathways, and 3D vectors.' },
        { month: 3, title: 'Electrostatics & Reactions', desc: 'Coulomb’s law, electric fields, reaction mechanisms, coordination structures, and integrals.' },
        { month: 4, title: 'Optics & Modern Physics', desc: 'Wave optics, dual nature of matter, atomic nuclei, permutations, and probability models.' },
        { month: 5, title: 'Grand Practice Exams', desc: 'Real JEE-level mock trial exams, high-difficulty doubt solving, and custom scoring tactics.' },
      ];
    } else if (nameLower.includes('neet') || codeLower.includes('neet') || nameLower.includes('medical') || nameLower.includes('biology')) {
      return [
        { month: 1, title: 'Cell Biology & Plant Science', desc: 'Cell architecture, active biomolecules, cell division stages, and plant taxonomy.' },
        { month: 2, title: 'Human Physiology', desc: 'Gastrointestinal, cardiac, and neural mechanisms paired with foundational chemistry bounds.' },
        { month: 3, title: 'Genetics & Biophysics', desc: 'Mendelian inheritances, molecular genetic structures, and key electrostatic currents.' },
        { month: 4, title: 'Reproduction & Evolution', desc: 'Human/plant gametogenesis, Darwinian theories, and organic chemistry synthesis.' },
        { month: 5, title: 'Full NEET Mock Drills', desc: 'High-speed diagnostic MCQs, comprehensive NCERT syllabus review, and paper-solving tricks.' },
      ];
    } else {
      return [
        { month: 1, title: 'Core Foundations & Induction', desc: 'Introduction to standard academic databases, program tools, grading rubrics, and workspace setups.' },
        { month: 2, title: 'Intermediate Case Studies', desc: 'Detailed look into complex modules, collaborative work environments, and progressive test sessions.' },
        { month: 3, title: 'Advanced Methods', desc: 'Tackling complex systems, industry standard theories, and specialized custom approaches.' },
        { month: 4, title: 'Real-world Capstones', desc: 'Executing a holistic mock industrial project to test technical knowledge and agility.' },
        { month: 5, title: 'Review & Certification', desc: 'Direct faculty assessment, active peer discussions, final portfolio checkout, and official badges.' },
      ];
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const faqs = [
    { id: 1, q: "How does the digitized academic console work?", a: "Learnora provides a single unified dashboard where students can attend live interactive webinars, submit automated coding & academic assignments with real-time feedback, view visual progression metrics, and directly contact their assigned industry mentors." },
    { id: 2, q: "Is there a guaranteed placement assistance program?", a: "Yes. Our premium tracks (such as Software Development and Product Management) include dedicated career counseling, mock interview evaluations, resume critiques, and direct partner placements. We maintain a 98.2% direct placement rate." },
    { id: 3, q: "What are the continuous evolution assessments?", a: "Unlike static year-end exams, our system utilizes continuous week-by-week micro-evaluations (Evolutions). Students must score at least 80% to be automatically promoted to the next syllabus module, maintaining peak cohort quality." },
    { id: 4, q: "How is proctoring implemented during evaluations?", a: "Our evaluations feature optional browser proctoring overlays including tab-switch records, camera gaze-away alerts, and voice checks, preparing students for highly disciplined enterprise-level recruitment exams." }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] transition-colors duration-300 flex flex-col justify-between relative overflow-hidden font-sans z-0 selection:bg-red-500/10 selection:text-red-900">
      
      {/* High-Fidelity Editorial Visual Background Grid and Glowing Nodes */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        {/* Soft elegant neon glowing radial nodes */}
        <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-indigo-400/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-red-400/5 blur-[130px]" />
        <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full bg-fuchsia-400/3 blur-[100px]" />

        {/* Minimalist architectural layout grids */}
        <div className="absolute inset-0 opacity-[0.06]" 
             style={{ backgroundImage: 'radial-gradient(circle, #8F9BB3 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Horizontal linear accents mimicking premium SaaS frameworks */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300/30 to-transparent" />
        <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300/30 to-transparent" />
        
        {/* Abstract structural vector guides */}
        <svg className="absolute top-12 right-12 w-[50%] h-[700px] opacity-[0.04] text-slate-900" fill="none" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
          <circle cx="300" cy="300" r="250" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx="300" cy="300" r="150" stroke="currentColor" strokeWidth="0.5" />
          <line x1="50" y1="300" x2="550" y2="300" stroke="currentColor" strokeWidth="0.5" />
          <line x1="300" y1="50" x2="300" y2="550" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Nav Header */}
      <header className="w-full border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <Logo size="sm" withStrapline={true} inverse={false} />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <button type="button" onClick={() => onEnterPortal('fastReg')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5">
              Apply Now <Sparkle className="w-3 h-3 text-red-500 animate-pulse" />
            </button>
            <button type="button" onClick={() => onEnterPortal('authLogin')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
              Student Login
            </button>
            <button type="button" onClick={() => onEnterPortal('adminLogin')} className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
              Staff Portal
            </button>
            
            <button 
              type="button" 
              onClick={() => onEnterPortal('authLogin')}
              className="ml-4 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-slate-950/10 active:scale-97 cursor-pointer"
            >
              Enter Console
            </button>
          </nav>

          {/* Mobile Nav Toggle */}
          <div className="md:hidden">
            <button 
              type="button" 
              onClick={() => onEnterPortal('authLogin')} 
              className="px-4.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Premium Hero and Live Interactive Console Panel Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Left Column: Premium Interactive Typography */}
        <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[11px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            Live Admission Portal 2026 Active
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black text-[#1D1D1F] leading-[1.05] tracking-tight">
            Digitized Cohorts.<br />
            Continuous <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-300% animate-[gradient_8s_ease_infinite]">Evolution.</span>
          </h1>

          <p className="text-md sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
            A premium cooperative workspace for technical academics. Master schedules, build fully automated and proctored assignments, receive evaluation charts, and thrive within elite peer-to-peer pipelines.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-3">
            <button 
              onClick={() => onEnterPortal('fastReg')}
              className="w-full sm:w-auto px-7 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 active:scale-97 text-sm cursor-pointer"
            >
              Start Application <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onEnterPortal('authLogin')}
              className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-97 text-sm"
            >
              Student Portal <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Minimalist Micro Stats Banner */}
          <div className="grid grid-cols-3 gap-6 pt-8 w-full border-t border-slate-200 mt-4">
            <div>
              <div className="text-lg font-black text-[#1D1D1F] font-sans tracking-tight">98.2%</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">Placement Rate</div>
            </div>
            <div>
              <div className="text-lg font-black text-[#1D1D1F] font-sans tracking-tight">1:12</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">Mentor Ratio</div>
            </div>
            <div>
              <div className="text-lg font-black text-[#1D1D1F] font-sans tracking-tight">100%</div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">Digital Records</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Mock Console Terminal Panel */}
        <div className="lg:col-span-6 flex items-center justify-center relative w-full">
          <div className="absolute inset-0 border border-slate-200 rounded-3xl transform rotate-1 -z-10 bg-indigo-500/5 blur-xl scale-98" />
          
          <div className="bg-white/85 border border-slate-200/80 rounded-3xl p-5 shadow-2xl w-full max-w-lg overflow-hidden backdrop-blur-sm">
            {/* Header / Tab Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">academic-console-v2.6</span>
              </div>
              
              {/* Dynamic Status Badges */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                </span>
              </div>
            </div>

            {/* Interactive Tab Controls */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button 
                onClick={() => setActiveConsoleTab('status')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                  activeConsoleTab === 'status' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Schedule Status
              </button>
              <button 
                onClick={() => setActiveConsoleTab('metrics')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                  activeConsoleTab === 'metrics' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Performance Metrics
              </button>
              <button 
                onClick={() => setActiveConsoleTab('proctor')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all ${
                  activeConsoleTab === 'proctor' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Proctored Sandbox
              </button>
            </div>

            {/* Tab content screens */}
            <div className="h-[250px] flex flex-col justify-between relative">
              <AnimatePresence mode="wait">
                {activeConsoleTab === 'status' && (
                  <motion.div 
                    key="status-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Upcoming Lecture</span>
                          <h4 className="font-bold text-sm text-[#1D1D1F] mt-0.5">Advanced DSA: Greedy Algorithm & Proofs</h4>
                        </div>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-0.5 rounded-md font-black">
                          CSE-102
                        </span>
                      </div>

                      <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-red-500" />
                          <span>Starts in {countdownMinutes}:{countdownSeconds < 10 ? `0${countdownSeconds}` : countdownSeconds}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>42 Enrolled</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs bg-slate-50/50 px-3 py-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-semibold text-slate-700">Staff Portal Sync Status</span>
                        </div>
                        <span className="font-mono text-emerald-600 text-[11px] font-bold">ACTIVE ●</span>
                      </div>
                      <div className="flex items-center justify-between text-xs bg-slate-50/50 px-3 py-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-semibold text-slate-700">Database Backup Routine</span>
                        </div>
                        <span className="font-mono text-emerald-600 text-[11px] font-bold">SECURED ●</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeConsoleTab === 'metrics' && (
                  <motion.div 
                    key="metrics-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/60 shadow-xs space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-600 uppercase">Interactive Grading Curve</h4>
                        <span className="text-[10px] text-slate-500 font-mono">My Score: 88.5%</span>
                      </div>
                      
                      {/* Interactive Sparkline Progress Chart */}
                      <div className="h-20 w-full flex items-end gap-1.5 pt-2">
                        {[40, 55, 62, 58, 75, 88, 82, 92, 85, 96, 90, 98].map((score, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                            <div className="text-[9px] text-white font-black opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-4 bg-slate-900 px-1 rounded">
                              {score}%
                            </div>
                            <div 
                              className={`w-full rounded-t-xs transition-all duration-300 ${
                                idx === 11 ? 'bg-red-500 shadow-lg shadow-red-500/25' : 'bg-indigo-500/30 group-hover:bg-indigo-400'
                              }`} 
                              style={{ height: `${score / 1.3}%` }} 
                            />
                            <span className="text-[8px] text-slate-500 font-mono">E{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 bg-slate-50/50 rounded-xl p-3 border border-slate-200/60 shadow-xs text-left">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Avg Evolution Score</span>
                        <span className="text-md font-black text-[#1D1D1F] font-sans mt-0.5 block">85.4%</span>
                      </div>
                      <div className="flex-1 bg-slate-50/50 rounded-xl p-3 border border-slate-200/60 shadow-xs text-left">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Current Badge Level</span>
                        <span className="text-md font-black text-rose-600 font-sans mt-0.5 block flex items-center gap-1">
                          <Award className="w-4 h-4 text-rose-500" /> Platinum
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeConsoleTab === 'proctor' && (
                  <motion.div 
                    key="proctor-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    <div className="relative bg-slate-100 rounded-2xl h-44 border border-slate-200/60 overflow-hidden flex items-center justify-center">
                      <div className="absolute top-3 left-3 bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5 rounded-md font-mono text-[9px] flex items-center gap-1 font-bold z-20">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        PROCTOR FEED: ACTIVE
                      </div>

                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-slate-700 px-2.5 py-1 border border-slate-200/60 rounded-lg font-mono text-[9.5px] z-20">
                        Gaze Deviation: 0.00%
                      </div>

                      {/* Mock scan line */}
                      <div className="absolute inset-x-0 h-0.5 bg-red-500/10 shadow-lg shadow-red-500/30 animate-[scan_4s_linear_infinite] z-10" />

                      {/* Animated vector faces mockup */}
                      <svg className="w-24 h-24 text-red-500/10 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-red-500/5 border border-red-150 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 text-red-600 font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Continuous Proctor Monitoring Enabled</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Auto Guard v1.2</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </main>

      {/* Interactive Academic Pathways Explorer */}
      <section className="w-full border-t border-slate-200/60 bg-white py-16 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 text-left">
            <div className="max-w-xl">
              <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-red-500" /> Curated Syllabus Pathways
              </div>
              <h2 className="text-3xl sm:text-4xl font-sans font-black text-[#1D1D1F] tracking-tight leading-tight">
                Our Interactive Cohort Programs
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Click on any course card below to view its month-by-month evolution roadmap, batch timings, and curriculum scope instantly.
              </p>
            </div>
            
            <div className="flex gap-4 sm:gap-8 shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-xs">
              <div>
                <div className="text-xs text-slate-500 font-medium">Available Pathways</div>
                <div className="text-lg font-bold text-[#1D1D1F] mt-0.5">6 Core Tracks</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <div className="text-xs text-slate-500 font-medium">Standard Duration</div>
                <div className="text-lg font-bold text-[#1D1D1F] mt-0.5">5 Months</div>
              </div>
            </div>
          </div>

          {/* Interactive Cohorts Grid & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Courses Grid (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {courses.filter(c => c.status === 'upcoming').length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200/60 shadow-xs">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">
                    No upcoming cohorts currently open for enrollment. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courses.filter(c => c.status === 'upcoming').map((course) => {
                    const isSelected = selectedCourseId === course.id || (!selectedCourseId && courses[0]?.id === course.id);
                    const category = getCourseCategory(course.name);
                    
                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`p-5 rounded-2xl transition-all duration-300 cursor-pointer select-none border text-left flex flex-col justify-between h-[200px] relative overflow-hidden group ${
                          isSelected
                            ? 'bg-white border-red-500 shadow-xl shadow-red-500/5 ring-1 ring-red-500/20'
                            : 'bg-slate-50/50 border-slate-250/60 hover:border-slate-300 hover:bg-slate-100/30'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-200/20 to-transparent opacity-10 group-hover:scale-110 transition-transform" />

                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              {category === 'Product Management with AI' && <PMIcon />}
                              {category === 'Analytics and AI' && <AnalyticsIcon />}
                              {category === 'Data Science and AI-ML' && <DataScienceIcon />}
                              {category === 'Software Development Engineering' && <SDEIcon />}
                              {category === 'Marketing and Analytics' && <MarketingIcon />}
                              {category === 'Finance and Technology' && <FinanceIcon />}
                            </div>
                            
                            {course.batchNumber && (
                              <span className="text-[9.5px] bg-slate-100 border border-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Batch {course.batchNumber}
                              </span>
                            )}
                          </div>

                          <h3 className={`font-bold text-sm leading-snug mt-4 transition-colors ${
                            isSelected ? 'text-red-600' : 'text-[#1D1D1F] group-hover:text-red-600'
                          }`}>
                            {course.name}
                          </h3>
                        </div>

                        {/* Card Footer info */}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>{course.durationWeeks ? `${course.durationWeeks} Months` : '5 Months'} • {course.code || 'COHORT'}</span>
                          <span className="text-red-600 font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Syllabus <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Timeline Tracker (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50/70 border border-slate-200/60 p-6 rounded-3xl shadow-lg relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-md font-bold text-[#1D1D1F] tracking-tight">
                    {selectedCourse ? `${selectedCourse.name} Milestone Path` : 'Syllabus Journey Map'}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  A rigorous, industry-aligned syllabus structured around continuous projects and proctored assessment validations.
                </p>

                {/* Timeline Roadmap */}
                <div className="relative space-y-5 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {(selectedCourse && selectedCourse.roadmap && selectedCourse.roadmap.length > 0
                    ? selectedCourse.roadmap
                    : getCourseRoadmap(selectedCourse?.name || '', selectedCourse?.code || '')
                  ).slice(0, 5).map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-black text-xs z-10 shrink-0 shadow-md">
                        {step.month}
                      </div>
                      <div className="text-left bg-white p-3.5 rounded-xl border border-slate-200/60 w-full shadow-xs">
                        <h4 className="font-bold text-xs text-[#1D1D1F]">Month {step.month}: {step.title}</h4>
                        <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{step.desc || (step as any).description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                {selectedCourse && (
                  <div className="mt-6 pt-2">
                    <button
                      onClick={() => onEnterPortal('fastReg', selectedCourse.name)}
                      className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-97 text-xs cursor-pointer"
                    >
                      Apply for {selectedCourse.name} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Interactive Eligibility & Scholarship Estimator Section */}
      <section className="w-full border-t border-slate-200/60 bg-[#F5F5F7] py-16 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: Copy (5 cols) */}
            <div className="lg:col-span-5 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold tracking-wider uppercase">
                <Calculator className="w-3.5 h-3.5" /> Merit Scholarships
              </div>
              <h2 className="text-3xl sm:text-4xl font-sans font-black text-[#1D1D1F] tracking-tight leading-tight">
                Evaluate Your Eligibility & Fee Structure Instantly
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                At Learnora, we support academic talent. Use our live interactive calculator to select your desired cohort pathway, adjust your grade thresholds, and view potential merit scholarships and final discounted fees in real-time.
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-700 font-medium">Up to 55% Tuition waivers for eligible students</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-700 font-medium">Interest-free monthly academic installment facilities</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-700 font-medium">Automatic interview screening bypass for scores above 90%</span>
                </div>
              </div>
            </div>

            {/* Right side: Interactive Form Container (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/60 p-6 sm:p-8 rounded-3xl shadow-xl text-left relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-indigo-500/5 to-transparent blur-2xl" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {/* Course Selection */}
                <div>
                  <label className="block text-xs text-slate-500 font-bold uppercase mb-2">Select Target Program</label>
                  <select 
                    value={calcCourse} 
                    onChange={(e) => setCalcCourse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500 transition-colors cursor-pointer shadow-xs"
                  >
                    {courses && courses.length > 0 ? (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code || 'COHORT'})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="course-1">Java Masterclass (JAVA)</option>
                        <option value="course-2">Full-Stack JavaScript Development (JS)</option>
                        <option value="course-3">Python AI & Data Science (PY)</option>
                        <option value="course-4">SDET Specialization (QA Automation) (SDET)</option>
                        <option value="course-5">UI/UX Design Academy (UIUX)</option>
                        <option value="course-6">Cybersecurity Professional (CYBER)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-xs text-slate-500 font-bold uppercase mb-2">Highest Qualification</label>
                  <select 
                    value={calcQualification} 
                    onChange={(e) => setCalcQualification(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500 transition-colors cursor-pointer shadow-xs"
                  >
                    <option value="High School">High School (Grade 12)</option>
                    <option value="Undergraduate">Undergraduate (B.Tech / B.Sc / BCA)</option>
                    <option value="Graduate">Postgraduate (M.Tech / MBA / MCA)</option>
                    <option value="Working Professional">Working Professional (1+ Years Exp)</option>
                  </select>
                </div>
              </div>

              {/* Slider for percentage grade */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="block text-xs text-slate-500 font-bold uppercase">Average Grade / Academic Score</label>
                  <span className="text-sm font-black text-slate-900 font-mono">{calcGrade}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={calcGrade} 
                  onChange={(e) => setCalcGrade(Number(e.target.value))}
                  className="w-full accent-red-500 bg-slate-100 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 uppercase">
                  <span>50% (Min Pass)</span>
                  <span>75% (First Div)</span>
                  <span>100% (Perfect)</span>
                </div>
              </div>

              {/* Dynamic Outcomes Card */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center shadow-xs">
                {/* Eligibility Indicator */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Eligibility</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-black px-2 py-1 rounded-md border ${eligibilityResult.badgeColor}`}>
                      {eligibilityResult.status}
                    </span>
                  </div>
                </div>

                {/* Set Course Amount (Base Fee) */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Course Fee</span>
                  <span className="text-sm font-black text-slate-700 font-mono tracking-tight mt-1 block">
                    ₹{eligibilityResult.baseFee.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Scholarship Applied */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Scholarship</span>
                  <span className="text-sm font-black text-rose-600 font-mono tracking-tight mt-1 block">
                    {eligibilityResult.scholarship}% Waiver
                  </span>
                </div>

                {/* Discounted Fee */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Estimated Fee</span>
                  <span className="text-sm font-black text-slate-900 font-mono tracking-tight mt-1 block">
                    ₹{eligibilityResult.estimatedFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => {
                    const selectedCourseObj = courses?.find(c => c.id === calcCourse) || 
                      (calcCourse === 'course-1' ? { name: 'Java Masterclass' } :
                       calcCourse === 'course-2' ? { name: 'Full-Stack JavaScript Development' } :
                       calcCourse === 'course-3' ? { name: 'Python AI & Data Science' } :
                       calcCourse === 'course-4' ? { name: 'SDET Specialization (QA Automation)' } :
                       calcCourse === 'course-5' ? { name: 'UI/UX Design Academy' } :
                       calcCourse === 'course-6' ? { name: 'Cybersecurity Professional' } : null);
                    const courseDisplayName = selectedCourseObj?.name || calcCourse;
                    onEnterPortal('fastReg', `${courseDisplayName} - Applied with ${eligibilityResult.scholarship}% Scholarship`);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-97 shadow-md cursor-pointer"
                >
                  Submit Registration With Scholarship <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bento Grid Highlights: Complete Platform Ecosystem */}
      <section className="w-full border-t border-slate-200/60 bg-white py-16 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest block">Continuous Evaluation Ecosystem</span>
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-[#1D1D1F] tracking-tight">
              One Workspace. Endless Growth.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Experience a highly structured academic model optimized for rigorous preparation, deep mentoring, and clear career milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between text-left h-[280px] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-1.5 mt-6">
                <h3 className="font-bold text-md text-[#1D1D1F]">Assigned Faculty Mentors</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every student gets paired with an industry expert instructor who hosts periodic mock reviews, grades assignments, and provides customized study directives.
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between text-left h-[280px] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1.5 mt-6">
                <h3 className="font-bold text-md text-[#1D1D1F]">Continuous Evolutions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Skip massive high-stakes finals. Our curriculum relies on 4 dynamic week-by-week evaluations every single month with an 80% baseline promotion rule.
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between text-left h-[280px] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1.5 mt-6">
                <h3 className="font-bold text-md text-[#1D1D1F]">Verified Digital Credentials</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every successfully completed program module triggers cryptographic badges and verified certificates easily syncable with Linkedin and recruitment portals.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full border-t border-slate-200/60 bg-[#F5F5F7] py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-left">
          
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest block">Academic Portal Inquiries</span>
            <h2 className="text-3xl font-sans font-black text-[#1D1D1F] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden transition-colors shadow-xs"
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-sm text-[#1D1D1F] focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-500">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer (PRESERVED IDENTICALLY) */}
      <footer className="w-full bg-[#0B0C10] text-white pt-12 pb-12 relative z-10 overflow-hidden font-sans mt-0">
        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-between min-h-[500px]">
          {/* Top Header inside footer */}
          <div className="flex justify-between items-center mb-16 md:mb-24">
            <Logo size="sm" withStrapline={false} inverse={true} />
            <div className="flex items-center gap-8 text-sm font-medium text-slate-300">
              <button className="hover:text-white transition-colors">Programs</button>
              <button className="hover:text-white transition-colors">Admissions</button>
              <button className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start flex-1 gap-12 relative">
            {/* Left Content */}
            <div className="w-full md:w-1/2 pr-0 md:pr-8 flex flex-col justify-between h-full z-10">
              <div>
                 <h2 className="text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight leading-[1.05] mb-16 text-white max-w-lg">
                   Empowering Minds, Shaping Futures
                 </h2>
                 <div className="flex flex-wrap gap-16 md:gap-32 mb-16">
                    <div>
                       <h4 className="font-bold text-white mb-6 tracking-wide">Programs</h4>
                       <ul className="space-y-3 text-sm text-slate-400 font-medium">
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Engineering App</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Medicine</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Business Systems</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Arts / UX</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Web Design</button></li>
                       </ul>
                    </div>
                    <div>
                       <h4 className="font-bold text-white mb-6 tracking-wide">Resources</h4>
                       <ul className="space-y-3 text-sm text-slate-400 font-medium">
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Student Portal</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Behance Labs</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Dribbble Works</button></li>
                          <li><button className="hover:text-white transition-colors hover:underline underline-offset-4">Github Repos</button></li>
                       </ul>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-auto md:w-3/4">
                <p>© 2026,  Learnora.in</p>
                <div className="flex items-center gap-4">
                  <button id="facebook-btn" className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></button>
                  <a id="linkedin-link" href="https://www.linkedin.com/company/132394114/admin/dashboard/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
                  <button id="twitter-btn" className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></button>
                  <a id="instagram-link" href="https://www.instagram.com/learn_ora.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
                </div>
              </div>
            </div>

            {/* Right Graphic "L" */}
            <div className="hidden md:flex flex-1 items-center justify-center relative min-h-[450px]">
              <div className="relative w-[340px] h-[450px] drop-shadow-2xl">
                 {/* L Vertical Stem background */}
                 <div className="absolute left-0 top-0 w-[100px] h-full bg-[#fbbc04] shadow-[inset_-8px_0_15px_rgba(0,0,0,0.15)]" />
                 
                 {/* L Vertical Stem Top Blue shape */}
                 <div className="absolute left-0 top-0 w-[160px] h-[180px] bg-[#4285f4] rounded-tr-[80px] overflow-hidden shadow-lg border-b border-[#3061b4]">
                   {/* Inner texture white shape */}
                   <div className="absolute right-[-20px] top-[20px] w-[130px] h-[140px] bg-[#f0f0f0] rounded-l-full shadow-inner mix-blend-luminosity flex items-center opacity-90">
                     <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                   </div>
                   {/* Red wedge */}
                   <div className="absolute right-0 bottom-0 w-[40px] h-[90px] bg-[#ea4335] rounded-tl-full shadow-inner z-10" />
                 </div>

                 {/* Middle Pink Wedge */}
                 <div className="absolute left-[15px] top-[140px] w-[80px] h-[130px] bg-[#d946ef] rounded-tl-full shadow-[5px_10px_20px_rgba(0,0,0,0.3)] z-20 overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                 </div>

                 {/* Bottom horizontal base red/yellow */}
                 <div className="absolute left-0 bottom-0 w-[240px] h-[80px] bg-[#ea4335] shadow-[0_-5px_15px_rgba(0,0,0,0.2)] z-30">
                   <div className="absolute top-0 right-0 w-[80px] h-full bg-[#fbbc04]" />
                   <div className="absolute left-0 top-0 w-[100px] h-full bg-[#b91c1c] shadow-inner mix-blend-multiply opacity-50" />
                 </div>

                 {/* Bottom horizontal top Pink Piece */}
                 <div className="absolute left-[10px] bottom-[20px] w-[180px] h-[90px] bg-[#d946ef] rounded-tr-[50px] shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-40 overflow-hidden border-t-2 border-fuchsia-400/40">
                    <div className="absolute left-[20px] top-[-10px] w-[90px] h-[60px] bg-[#f0f0f0] rounded-b-full shadow-[inset_0_5px_10px_rgba(0,0,0,0.1)] opacity-90 flex items-center justify-center">
                       <div className="w-full h-full opacity-30" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                    </div>
                 </div>
              </div>

              {/* Multi-pagination dots on the far right */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 pr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500 cursor-pointer transition-colors" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500 cursor-pointer transition-colors" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500 cursor-pointer transition-colors" />
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
