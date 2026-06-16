import React, { useState } from 'react';
import Logo from './Logo';
import { ArrowRight, BookOpen, Users, Shield, Code2, Atom, Target } from 'lucide-react';
import { Course } from '../types';
import { motion } from 'motion/react';
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
  <div className="relative w-16 h-16 flex items-center justify-center shrink-0 select-none">
    <div className="grid grid-cols-2 gap-1 w-11 h-11">
      <div className="bg-[#8E8EF0] rounded-md shadow-xs"></div>
      <div className="bg-amber-400 rounded-md shadow-xs flex items-center justify-center relative">
        <span className="text-white font-black text-sm leading-none">+</span>
      </div>
      <div className="bg-[#5D7BEE] rounded-md shadow-xs"></div>
      <div className="bg-[#C96CEB] rounded-md shadow-xs"></div>
    </div>
  </div>
);

const AnalyticsIcon = () => (
  <div className="relative w-16 h-16 flex items-end justify-center pb-2.5 shrink-0 select-none">
    <div className="flex items-end gap-1.5 h-11">
      <div className="w-3 h-5 bg-[#3B82F6] rounded-sm shadow-xs" />
      <div className="w-3 h-8 bg-[#A855F7] rounded-sm shadow-xs" />
      <div className="w-3 h-11 bg-[#EF4444] rounded-sm shadow-xs" />
    </div>
  </div>
);

const DataScienceIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center shrink-0 select-none">
    <div className="relative w-12 h-12 rounded-full bg-[#1F2937] dark:bg-slate-800 flex items-center justify-center border-2 border-slate-500 shadow-sm">
      <Atom className="w-7 h-7 text-white animate-[spin_20s_linear_infinite]" />
    </div>
  </div>
);

const SDEIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center shrink-0 select-none">
    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" />
    </svg>
  </div>
);

const MarketingIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center shrink-0 select-none">
    <div className="relative w-12 h-12 rounded-full border-4 border-[#EF4444] bg-white flex items-center justify-center shadow-xs">
      <div className="w-7 h-7 rounded-full border-2 border-[#EF4444] bg-white flex items-center justify-center">
        <div className="w-3.5 h-3.5 rounded-full bg-[#EF4444] flex items-center justify-center" />
      </div>
      <div className="absolute top-0 left-0 w-3 h-3 bg-amber-400 rotate-45 transform -translate-x-0.5 -translate-y-0.5 rounded-xs shadow-xs" />
    </div>
  </div>
);

const FinanceIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center shrink-0 select-none">
    <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center border-2 border-blue-300 shadow-md">
      <span className="text-white font-extrabold text-[#FFFFFF] text-lg font-sans leading-none">$</span>
    </div>
  </div>
);

interface HomePageProps {
  isDark: boolean;
  onEnterPortal: (tab: 'fastReg' | 'authLogin' | 'adminLogin') => void;
  courses?: Course[];
}

export default function HomePage({ isDark, onEnterPortal, courses = [] }: HomePageProps) {
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const activeCourseId = selectedCourseId || hoveredCourseId;

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

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#E0E6ED_0%,#EDF2F7_50%,#E2E8F0_100%)] dark:bg-[linear-gradient(135deg,#0E131F_0%,#151D30_50%,#090D16_100%)] text-[#1E293B] dark:text-slate-200 transition-colors duration-300 flex flex-col justify-between relative overflow-hidden font-sans z-0">
      
      {/* High-Resolution Modern Geometric & Wave Background (Matching the reference picture) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        {/* Subtle split plane layout backgrounds */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[#E5ECF6] dark:bg-[#131A2C] opacity-40 dark:opacity-20 [clip-path:polygon(40%_0,100%_0,100%_100%,0_100%)]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-full bg-[#D9E2EC] dark:bg-[#0D1525] opacity-35 dark:opacity-15 [clip-path:polygon(0_0,100%_100%,0_100%)]" />

        <svg className="absolute w-full h-full opacity-80 dark:opacity-45" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7"/>
              <stop offset="50%" stopColor="#D9E4F5" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#C4D4EC" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B0CBE9" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#9BBEE3" stopOpacity="0.25"/>
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#8DA9C4" stopOpacity="0"/>
              <stop offset="25%" stopColor="#8DA9C4" stopOpacity="0.35"/>
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8"/>
              <stop offset="75%" stopColor="#6C8EBF" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#6C8EBF" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="darkLineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#334E68" stopOpacity="0"/>
              <stop offset="30%" stopColor="#486581" stopOpacity="0.4"/>
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6"/>
              <stop offset="70%" stopColor="#243B53" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#243B53" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Smooth layered backdrop ribbons */}
          <path d="M-100,280 C300,120 500,450 900,220 C1100,105 1300,200 1600,150 L1600,850 L-100,850 Z" fill="url(#wave1)" />
          <path d="M-50,380 C250,520 600,180 1000,380 C1200,480 1350,350 1550,420 L1550,850 L-50,850 Z" fill="url(#wave2)" />

          {/* Precision high resolution guilloche contour waves */}
          <g stroke="url(#lineGrad)" fill="none" strokeWidth="1.2" className="dark:hidden">
            <path d="M-100,290 Q200,380 500,240 T1100,350 T1600,210" />
            <path d="M-100,310 Q200,400 500,260 T1100,370 T1600,230" />
            <path d="M-100,330 Q200,420 500,280 T1100,390 T1600,250" />
            <path d="M-100,350 Q200,440 500,300 T1100,410 T1600,270" />
            <path d="M-100,370 Q200,460 500,320 T1100,430 T1600,290" />
            <path d="M-100,390 Q200,480 500,340 T1100,450 T1600,310" />
            <path d="M-100,410 Q200,500 500,360 T1100,470 T1600,330" />
            <path d="M-100,430 Q200,520 500,380 T1100,490 T1600,350" />
            <path d="M-100,450 Q200,540 500,400 T1100,510 T1600,370" />
            <path d="M-100,470 Q200,560 500,420 T1100,530 T1600,390" />
            <path d="M-100,490 Q200,580 500,440 T1100,550 T1600,410" />
          </g>

          <g stroke="url(#darkLineGrad)" fill="none" strokeWidth="1.2" className="hidden dark:g">
            <path d="M-100,290 Q200,380 500,240 T1100,350 T1600,210" />
            <path d="M-100,310 Q200,400 500,260 T1100,370 T1600,230" />
            <path d="M-100,330 Q200,420 500,280 T1100,390 T1600,250" />
            <path d="M-100,350 Q200,440 500,300 T1100,410 T1600,270" />
            <path d="M-100,370 Q200,460 500,320 T1100,430 T1600,290" />
            <path d="M-100,390 Q200,480 500,340 T1100,450 T1600,310" />
            <path d="M-100,410 Q200,500 500,360 T1100,470 T1600,330" />
            <path d="M-100,430 Q200,520 500,380 T1100,490 T1600,350" />
            <path d="M-100,450 Q200,540 500,400 T1100,510 T1600,370" />
          </g>
        </svg>

        {/* Soft, crisp radial glowing point */}
        <div className="absolute right-[10%] top-[25%] w-[450px] h-[450px] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-[120px]" />
        <div className="absolute left-[5%] bottom-[15%] w-[350px] h-[350px] rounded-full bg-slate-300/30 dark:bg-indigo-900/15 blur-[100px]" />
      </div>

      {/* Nav Header */}
      <header className="w-full border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50 transition-colors shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <Logo size="sm" withStrapline={true} inverse={isDark} />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
            <button type="button" onClick={() => onEnterPortal('fastReg')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
              Apply Now
            </button>
            <button type="button" onClick={() => onEnterPortal('authLogin')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
              Student Login
            </button>
            <button type="button" onClick={() => onEnterPortal('adminLogin')} className="hover:text-amber-500 transition-colors text-left cursor-pointer">
              Staff Portal
            </button>
            
            <button 
              type="button" 
              onClick={() => onEnterPortal('authLogin')}
              className="ml-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-sm active:scale-95"
            >
              Sign In
            </button>
          </nav>

          {/* Mobile Nav Toggle (Simplified) */}
          <div className="md:hidden">
            <button type="button" onClick={() => onEnterPortal('authLogin')} className="px-5 py-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 rounded-lg font-bold text-sm">
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Typography & Calls to Action */}
        <div className="flex flex-col items-start gap-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
            Admissions Open 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-sans font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
            Learn<span className="text-red-500">ora</span> <br/>
            <span className="text-3xl md:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 block mt-2">Empowering Minds, Shaping Futures</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 font-medium leading-relaxed">
            The next generation platform for collaborative academic discovery. Streamlined courses, real-time administrative workflows, and a thriving student community.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
            <button 
              onClick={() => onEnterPortal('fastReg')}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_-6px_rgba(245,158,11,0.4)] active:scale-95 text-lg"
            >
              Start Application <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onEnterPortal('authLogin')}
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl font-bold transition-all active:scale-95 text-lg"
            >
              Student Login
            </button>
          </div>

          {/* Feature Highlights row */}
          <div className="grid grid-cols-3 gap-6 pt-8 w-full border-t border-slate-200 dark:border-white/10 mt-4">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Smart Curriculum</h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Coaching</h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Secure Sandbox</h3>
            </div>
          </div>
        </div>

        {/* Right Side: Beautiful Illustration Graphic with Motion Effects */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex items-center justify-center relative w-full h-full min-h-[400px]"
        >
          {/* Decorative glowing background circles */}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-red-400/10 dark:bg-red-500/5 blur-3xl -z-10 animate-pulse" />
          <div className="absolute w-[250px] h-[250px] rounded-full bg-amber-400/10 dark:bg-amber-500/5 blur-2xl -z-10" />

          {/* Floated Image Container */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut"
            }}
            className="relative max-w-full lg:max-w-md xl:max-w-xl flex items-center justify-center select-none"
          >
            <img 
              src={admissionHeroImg}
              alt="Unlock Learning Capabilities"
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[480px] object-contain drop-shadow-[0_15px_30px_rgba(239,68,68,0.15)] dark:drop-shadow-[0_15px_40px_rgba(239,68,68,0.08)] filter"
              style={{ transform: 'scaleX(-1)' }}
            />
          </motion.div>
        </motion.div>

      </main>

      {/* Active Running Courses Section */}
      <section className="w-full bg-[#fbd4d6] dark:bg-[#1a0e10] py-12 md:py-20 relative z-10 border-t border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="bg-white dark:bg-[#0B0C10] rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
            
            {/* Choose Your Area of Interest Section */}
            <div className="flex flex-col lg:flex-row gap-12 xl:gap-16">
              <div className="flex-1">
                <h2 className="text-3xl md:text-5xl font-sans font-bold text-slate-900 dark:text-white tracking-tight mb-12">
                  Choose Your Program
                </h2>

                {courses.filter(c => c.status === 'upcoming').length === 0 ? (
                  <div className="p-8 md:p-12 text-center rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                    <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-305">
                      No upcoming academic programs available yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {courses.filter(c => c.status === 'upcoming').map((course, idx) => {
                      const isSelected = selectedCourseId === course.id;
                      const isHovered = hoveredCourseId === course.id;
                      const isActive = isSelected || isHovered;
                      return (
                        <div
                          key={course.id}
                          className={`p-6 rounded-[1.5rem] bg-white dark:bg-[#15161A] border-2 transition-all duration-300 flex items-center justify-between cursor-pointer select-none group relative ${
                            isSelected
                              ? 'border-red-500 ring-4 ring-red-500/10 shadow-lg col-span-1'
                              : 'border-slate-100 dark:border-white/5 hover:border-red-400 dark:hover:border-red-500/30 shadow-xs col-span-1'
                          }`}
                          onClick={() => {
                            setSelectedCourseId(isSelected ? null : course.id);
                          }}
                          onMouseEnter={() => setHoveredCourseId(course.id)}
                          onMouseLeave={() => setHoveredCourseId(null)}
                        >
                          <div className="flex-1 pr-4">
                            <h3 className={`font-extrabold text-base md:text-md leading-snug transition-colors ${isSelected ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-zinc-100 group-hover:text-red-500'}`}>
                              {course.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-bold font-mono">
                              {course.durationWeeks ? `${course.durationWeeks} Months` : '5 Months'} • {course.code || 'COHORT'}
                            </p>
                            {(course.publishDate || course.createdDate) && (
                              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-md">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                  Starts: {new Date(course.publishDate || course.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                          </div>
                      
                          <div className="shrink-0 flex items-center justify-center mix-blend-multiply dark:mix-blend-normal">
                            {getCourseCategory(course.name) === 'Product Management with AI' && <PMIcon />}
                            {getCourseCategory(course.name) === 'Analytics and AI' && <AnalyticsIcon />}
                            {getCourseCategory(course.name) === 'Data Science and AI-ML' && <DataScienceIcon />}
                            {getCourseCategory(course.name) === 'Software Development Engineering' && <SDEIcon />}
                            {getCourseCategory(course.name) === 'Marketing and Analytics' && <MarketingIcon />}
                            {getCourseCategory(course.name) === 'Finance and Technology' && <FinanceIcon />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Roadmap Section */}
              <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:border-l border-slate-200 dark:border-white/10 lg:pl-12 xl:pl-16 pt-12 lg:pt-0">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {selectedCourse ? `${selectedCourse.name} Path` : 'Admission Roadmap'}
                </h3>
                {selectedCourse && (
                   <p className="text-xs text-slate-500 mb-8">5-Month Technology Curriculum</p>
                )}
                {!selectedCourse && (
                   <p className="text-xs text-slate-500 mb-8">Follow these steps to get enrolled.</p>
                )}
                
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto lg:before:ml-5 lg:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-red-500 before:via-red-300 before:to-transparent">
                  {selectedCourse ? (
                    getCourseRoadmap(selectedCourse.name).map((step, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0C10] bg-red-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 lg:translate-x-0 lg:order-none z-10 font-bold text-sm">
                          {step.month}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] lg:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161A] shadow-sm ml-4 lg:ml-4 md:ml-0 md:group-odd:mr-4 lg:mr-0 text-left">
                          <h4 className="font-bold text-slate-900 dark:text-white">Month {step.month}: {step.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{step.desc}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0C10] bg-red-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 lg:translate-x-0 lg:order-none z-10 font-bold text-sm">
                          1
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] lg:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161A] shadow-sm ml-4 lg:ml-4 md:ml-0 md:group-odd:mr-4 lg:mr-0 text-left">
                          <h4 className="font-bold text-slate-900 dark:text-white">Apply Online</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fill out the quick registration form and submit your basic details.</p>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0C10] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 lg:translate-x-0 lg:order-none z-10 font-bold text-sm">
                          2
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] lg:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161A] shadow-sm ml-4 lg:ml-4 md:ml-0 md:group-odd:mr-4 lg:mr-0 text-left opacity-70">
                          <h4 className="font-bold text-slate-900 dark:text-white">Entrance Test</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Take our online aptitude assessment to evaluate your foundation.</p>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0C10] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 lg:translate-x-0 lg:order-none z-10 font-bold text-sm">
                          3
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] lg:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161A] shadow-sm ml-4 lg:ml-4 md:ml-0 md:group-odd:mr-4 lg:mr-0 text-left opacity-70">
                          <h4 className="font-bold text-slate-900 dark:text-white">Counseling</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Discuss your goals and pick the right course track with our advisors.</p>
                        </div>
                      </div>
                      
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0C10] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 lg:translate-x-0 lg:order-none z-10 font-bold text-sm">
                          4
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] lg:w-[calc(100%-4rem)] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161A] shadow-sm ml-4 lg:ml-4 md:ml-0 md:group-odd:mr-4 lg:mr-0 text-left opacity-70">
                          <h4 className="font-bold text-slate-900 dark:text-white">Enrollment</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Complete your registration, receive credentials and get onboarded.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {selectedCourse && (
                   <div className="mt-8 relative z-10">
                     <button
                       onClick={() => onEnterPortal('fastReg')}
                       className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-sm"
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
      
      {/* Footer */}
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
                <p>© 2026, Learnora Edu Inc.</p>
                <div className="flex items-center gap-4">
                  <button className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></button>
                  <button className="hover:text-white transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></button>
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
