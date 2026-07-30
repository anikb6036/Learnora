import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, BookOpen, ArrowRight, CheckCircle2, ShieldCheck, 
  Award, Users, Calendar, HelpCircle, Star, Play, 
  ChevronDown, ChevronUp, Layers, Briefcase, GraduationCap 
} from 'lucide-react';
import { Course } from '../types';

interface CourseDetailsPageProps {
  courseId: string;
  courses: Course[];
  onBack: () => void;
  onEnroll: (course: Course) => void;
  isDark?: boolean;
}

const PROGRAM_PROFILES: Record<string, Partial<Course>> = {
  'business-systems': {
    id: 'business-systems',
    name: 'Business Systems & AI Product Management',
    code: 'BS_PM',
    batchNumber: 'stb_008',
    description: 'Master enterprise product architecture, agile workflows, AI business integrations, process engineering, data analytics, and corporate strategy.',
    fee: 13999,
    durationWeeks: '12',
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Enterprise System Architecture & Agile Workflows', description: 'Core business process modeling, agile product ownership, requirements gathering, and system specification.' },
      { month: 2, title: 'AI-Powered Business Analytics & Automation', description: 'Integrating predictive analytics, LLM automation tools, SQL data pipelines, and executive KPI dashboards.' },
      { month: 3, title: 'Product Strategy & Roadmapping', description: 'Market analysis, user journey mapping, feature prioritization, unit economics, and competitive intelligence.' },
      { month: 4, title: 'ERP & CRM System Integrations', description: 'Hands-on enterprise tool integrations including Salesforce, SAP API patterns, and custom REST middleware.' },
      { month: 5, title: 'Corporate Governance & Risk Security', description: 'Compliance frameworks (GDPR, SOC2), enterprise data privacy, and operational risk mitigation.' },
      { month: 6, title: 'Executive Capstone & Placement', description: 'End-to-end strategic product pitch presentation, resume review, and executive placement interview prep.' }
    ]
  },
  'arts-ux': {
    id: 'arts-ux',
    name: 'Arts & Executive Product UX Design',
    code: 'UIUX',
    batchNumber: 'stb_005',
    description: 'Comprehensive design academy covering user experience research, high-fidelity Figma prototyping, design systems, visual hierarchy, and interaction design.',
    fee: 8999,
    durationWeeks: '12',
    status: 'ongoing',
    imageUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'UX Research & Information Architecture', description: 'User interviews, card sorting, persona creation, wireframing, and user flow mapping.' },
      { month: 2, title: 'High-Fidelity Figma Prototyping', description: 'Advanced Figma components, auto-layout 5.0, variables, micro-interactions, and smart animation.' },
      { month: 3, title: 'Enterprise Design Systems & Accessibility', description: 'Building scalable tokenized design systems, color science, typography scales, and WCAG AA compliance.' },
      { month: 4, title: 'Mobile-First App & Web Layouts', description: 'Designing responsive interfaces across iOS, Android, desktop, and foldable form factors.' },
      { month: 5, title: 'Design Handoff & Developer Alignment', description: 'Spec documentation, asset export optimization, and collaborating with frontend engineers.' },
      { month: 6, title: 'Industry Portfolio & Design Review', description: 'Constructing a world-class Behance/Dribbble case study portfolio with direct design lead feedback.' }
    ]
  },
  'web-design': {
    id: 'web-design',
    name: 'Web Design & Modern Frontend Engineering',
    code: 'JS',
    batchNumber: 'stb_002',
    description: 'Craft responsive, high-performance web applications using React 18, TypeScript, Tailwind CSS, animation systems, and web graphics.',
    fee: 11999,
    durationWeeks: '12',
    status: 'ongoing',
    imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Modern HTML5, CSS3 Grid/Flexbox & Layout Math', description: 'Mastering visual web layouts, typography, CSS custom properties, and responsive design.' },
      { month: 2, title: 'JavaScript ES6+ Async Pipelines & DOM Architecture', description: 'Asynchronous JavaScript, Fetch API, DOM manipulation, closures, and performance profiling.' },
      { month: 3, title: 'React 18 Framework, State Engines & Tailwind CSS', description: 'Component architecture, custom React hooks, global state, and utility-first Tailwind styling.' },
      { month: 4, title: 'UI Animation Systems & Interactive Graphics', description: 'Framer Motion / Motion engine, SVG manipulation, canvas rendering, and micro-interactions.' },
      { month: 5, title: 'Performance Optimization & Web Vitals', description: 'Core Web Vitals tuning, code splitting, lazy loading, SEO metadata, and Lighthouse 100 scores.' },
      { month: 6, title: 'Production Client Project & Web Launch', description: 'Deploying custom client web apps to production CDN with SSL, domain setup, and portfolio audit.' }
    ]
  },
  'sde': {
    id: 'sde',
    name: 'Software Development Engineering (SDE)',
    code: 'JAVA',
    batchNumber: 'stb_001',
    description: 'End-to-end full stack software engineering covering Java/TypeScript backend services, DSA, system design, databases, and CI/CD.',
    fee: 14999,
    durationWeeks: '12',
    status: 'ongoing',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Data Structures, Algorithms & Time Complexity', description: 'Arrays, LinkedLists, Trees, Graphs, Sorting algorithms, and Big-O asymptotic analysis.' },
      { month: 2, title: 'Object-Oriented Design & Clean Code Patterns', description: 'SOLID principles, design patterns, modular Java/TypeScript backend, and unit testing.' },
      { month: 3, title: 'Microservices, RESTful APIs & Cloud Databases', description: 'Building scalable Express/Spring Boot microservices, SQL queries, and ORM integrations.' },
      { month: 4, title: 'System Architecture & Distributed Systems', description: 'Caching with Redis, load balancers, message queues (Kafka), and database sharding.' },
      { month: 5, title: 'DevOps Pipelines, Docker Containerization & Security', description: 'Docker images, CI/CD GitHub Actions, Cloud Run deployment, and OAuth2 security.' },
      { month: 6, title: 'High-Throughput Production Capstone & SDE Placement', description: 'Building a distributed cloud application, resume building, mock interviews, and job referrals.' }
    ]
  },
  'datascience': {
    id: 'datascience',
    name: 'Data Science, Machine Learning & AI Engineering',
    code: 'PY',
    batchNumber: 'stb_003',
    description: 'Master Python, statistical modeling, neural networks, LLM integrations, PyTorch, and predictive data pipelines.',
    fee: 12999,
    durationWeeks: '12',
    status: 'ongoing',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Advanced Python, NumPy, Pandas & Data Wrangling', description: 'Data cleaning, matrix operations, exploratory data analysis, and visualization.' },
      { month: 2, title: 'Exploratory Data Analysis & Statistical Modeling', description: 'Hypothesis testing, probability distributions, regression analysis, and statistical inference.' },
      { month: 3, title: 'Machine Learning Algorithms & Scikit-Learn', description: 'Supervised & unsupervised learning, decision trees, random forests, and SVM classification.' },
      { month: 4, title: 'Deep Learning with PyTorch & Neural Architectures', description: 'Convolutional neural networks, recurrent networks, transformers, and model optimization.' },
      { month: 5, title: 'Generative AI, Prompt Engineering & LLMs', description: 'Integrating Gemini API, RAG vector databases (Pinecone/Faiss), and fine-tuning models.' },
      { month: 6, title: 'End-to-End AI Application Build & Deployment', description: 'Deploying production ML models as API endpoints with monitoring and continuous retraining.' }
    ]
  },
  'cybersecurity': {
    id: 'cybersecurity',
    name: 'Cybersecurity Professional & Cloud Systems',
    code: 'CYBER',
    batchNumber: 'stb_006',
    description: 'Linux architectures, network security protocols, vulnerability analysis, ethical hacking, and cloud defense.',
    fee: 15999,
    durationWeeks: '12',
    status: 'ongoing',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Linux Administration & Command Line Security', description: 'System calls, user permissions, Bash scripting, process isolation, and SSH hardening.' },
      { month: 2, title: 'Network Protocols & Packet Inspection', description: 'TCP/IP stack, Wireshark packet capture, firewall configuration, and DNS security.' },
      { month: 3, title: 'Vulnerability Assessment & Penetration Testing', description: 'OWASP Top 10, Nmap scanning, Metasploit basics, and ethical hacking methodologies.' },
      { month: 4, title: 'Cloud Infrastructure Defense & Identity Management', description: 'AWS/GCP IAM policies, VPC peering, KMS encryption, and zero-trust security architecture.' },
      { month: 5, title: 'Incident Response & Digital Forensics', description: 'Log analysis, SIEM tools, threat intelligence, and post-breach mitigation.' },
      { month: 6, title: 'Security Certification & Industry Placement', description: 'CompTIA Security+ / CEH mock exams, capstone audit report, and security analyst prep.' }
    ]
  }
};

export default function CourseDetailsPage({ courseId, courses, onBack, onEnroll, isDark }: CourseDetailsPageProps) {
  const normalizedSlug = courseId ? decodeURIComponent(courseId).toLowerCase().trim() : '';
  const profileMatch = PROGRAM_PROFILES[normalizedSlug];

  const matchedFromCourses = courses.find(
    c => c.id === courseId || c.code === courseId || c.name.toLowerCase() === normalizedSlug || c.code?.toLowerCase() === normalizedSlug
  );

  const selectedCourse: Course = profileMatch 
    ? ({ ...courses[0], ...profileMatch } as Course)
    : matchedFromCourses || courses[0];

  const [expandedSyllabusIdx, setExpandedSyllabusIdx] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  if (!selectedCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-200">
        <div className="text-center space-y-4 p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl max-w-md">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-2xl font-bold">Course Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">The requested cohort curriculum could not be located in the system registry.</p>
          <button 
            onClick={onBack} 
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to All Courses
          </button>
        </div>
      </div>
    );
  }

  const isWeeks = selectedCourse.durationUnit === 'weeks' || (!selectedCourse.durationUnit && selectedCourse.durationWeeks && !selectedCourse.durationMonths);
  const durationLabel = isWeeks 
    ? `${selectedCourse.durationMonths || selectedCourse.durationWeeks || 12} Weeks`
    : `${selectedCourse.durationMonths || 6} Months`;

  const getCourseRoadmap = (name: string, code: string) => {
    const defaultMap = [
      { month: 1, title: 'Foundations & Development Tooling', description: 'Introduction to core industry architecture, environment setup, CLI tools, and version control best practices.' },
      { month: 2, title: 'Core Principles & Algorithms', description: 'Deep dive into fundamental algorithms, data flow design, and modular code patterns.' },
      { month: 3, title: 'Advanced Frameworks & Architecture', description: 'Building high-throughput scalable systems, state management, and real-time backend communication.' },
      { month: 4, title: 'Practical Application & Live Micro-Projects', description: 'Hands-on construction of industry-ready modules with continuous proctored evaluations.' },
      { month: 5, title: 'Optimization, Security & Testing', description: 'Performance profiling, vulnerability mitigation, automated end-to-end testing, and deployment pipelines.' },
      { month: 6, title: 'Capstone Project & Career Placement', description: 'End-to-end production build deployment, portfolio audit, and 1-on-1 career placement guidance.' }
    ];
    return defaultMap;
  };

  const roadmapData = selectedCourse.roadmap && selectedCourse.roadmap.length > 0
    ? selectedCourse.roadmap
    : getCourseRoadmap(selectedCourse.name || '', selectedCourse.code || '');

  return (
    <div className={`min-h-screen bg-white dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans ${isDark ? 'dark' : ''}`}>
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-3 py-1 bg-transparent border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            BATCH {selectedCourse.batchNumber || 'STB_001'}
          </span>
          <button
            onClick={() => onEnroll(selectedCourse)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Course Header Title Banner */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 bg-transparent border border-indigo-200/60 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-lg uppercase tracking-wider">
              {selectedCourse.code || 'COHORT_REG'}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 / 5.0 Rating</span>
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> 120+ Enrolled Students
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {selectedCourse.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-4xl leading-relaxed font-normal">
            {selectedCourse.description || "A comprehensive, industry-aligned career program structured with live interactive sessions, proctored evaluations, continuous project milestones, and dedicated 1-on-1 mentorship."}
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Key Highlights Grid */}
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>What You Will Gain</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Live Daily Interactive Classes", description: "Engage in real-time problem solving with expert faculty and cohort peers." },
                  { title: "Proctored Code Assessments", description: "Automated telemetry and real-time environment validation for skills." },
                  { title: "1-on-1 Faculty Mentorship", description: "Weekly personalized progress reviews and career guidance." },
                  { title: "Production Capstone Portfolio", description: "Build and deploy real-world production systems to present to recruiters." },
                  { title: "Continuous Progress Dashboard", description: "Track attendance, quiz evaluations, homework submissions, and milestones." },
                  { title: "Lifetime LMS Access", description: "Full record of recorded lecture archives, notes, and study resources." }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-transparent border border-slate-200/60 dark:border-zinc-700/50 flex items-start gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Curriculum Roadmap Accordion */}
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-500" />
                    <span>Curriculum & Syllabus Roadmap</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Detailed step-by-step learning journey over {durationLabel}.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 bg-transparent border border-slate-200 dark:border-zinc-800 px-3 py-1 rounded-full">
                  {roadmapData.length} Modules
                </span>
              </div>

              <div className="space-y-4">
                {roadmapData.map((step: any, idx: number) => {
                  const unitLabel = isWeeks ? 'Week' : 'Month';
                  const cleanTitle = (step.title || '').replace(/^(Month|Week)\s*\d+\s*[:\-]\s*/i, '').trim();
                  const isOpen = expandedSyllabusIdx === idx;

                  return (
                    <div 
                      key={idx}
                      className="border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 bg-transparent"
                    >
                      <button
                        onClick={() => setExpandedSyllabusIdx(isOpen ? null : idx)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-[#ffde21] text-[#0a0a0a] font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {step.month}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#000080] dark:text-blue-400 uppercase tracking-widest block">
                              {unitLabel} {step.month}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {cleanTitle}
                            </h4>
                          </div>
                        </div>

                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-200/60 dark:border-zinc-700/40 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed space-y-3 animate-fadeIn">
                          <p className="text-xs sm:text-sm">{step.desc || step.description}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <span className="px-2.5 py-1 bg-transparent border border-slate-200 dark:border-zinc-700 text-[11px] font-bold rounded-lg text-slate-700 dark:text-zinc-300">
                              ✓ Live Lecture & Notes
                            </span>
                            <span className="px-2.5 py-1 bg-transparent border border-slate-200 dark:border-zinc-700 text-[11px] font-bold rounded-lg text-slate-700 dark:text-zinc-300">
                              ✓ Practical Homework
                            </span>
                            <span className="px-2.5 py-1 bg-transparent border border-slate-200 dark:border-zinc-700 text-[11px] font-bold rounded-lg text-slate-700 dark:text-zinc-300">
                              ✓ Proctor Assessment
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


          </div>

          {/* RIGHT COLUMN: "Side of the Page" Sticky Pricing & Admission Panel (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xl space-y-6">
              
              <div>
                <span className="px-3 py-1 bg-transparent border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
                  Admissions Open
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                  Enrollment Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Reserve your place in the upcoming cohort today.
                </p>
              </div>

              {/* Price Display */}
              <div className="bg-transparent p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Course Fee</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-transparent px-2 py-0.5 rounded">
                    Scholarship Eligible
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{(selectedCourse.fee || 14999).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">
                    ₹{((selectedCourse.fee || 14999) * 1.4).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                  Includes full LMS portal access, live classes, exams, & certificate.
                </p>
              </div>

              {/* Details List */}
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <Clock className="w-4 h-4 text-black dark:text-white" /> Duration
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{durationLabel}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <BookOpen className="w-4 h-4 text-black dark:text-white" /> Batch Code
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedCourse.code || 'COHORT_REG'}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <Calendar className="w-4 h-4 text-black dark:text-white" /> Admission Deadline
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {selectedCourse.admissionLastDate || 'Open for Next 3 Days'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                    <GraduationCap className="w-4 h-4 text-black dark:text-white" /> Trial Period
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedCourse.trialDays ? `${selectedCourse.trialDays} Days Risk-Free` : '7 Days Trial Available'}
                  </span>
                </div>
              </div>

              {/* Primary Apply Button */}
              <button
                onClick={() => onEnroll(selectedCourse)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm cursor-pointer"
              >
                <span>Apply for Admission</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="p-3.5 bg-transparent rounded-xl border border-slate-200/60 dark:border-zinc-800 flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  Need financial assistance or counseling? Email <strong className="text-slate-800 dark:text-zinc-200">admin@learnora.in</strong> for inquiry.
                </p>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
