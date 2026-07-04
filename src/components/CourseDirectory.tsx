import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitBranch, 
  Calendar, 
  Search, 
  Pencil, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Terminal,
  Grid,
  List,
  CheckCircle2,
  Globe,
  Filter,
  User,
  Activity,
  Play,
  Users,
  CreditCard,
  ArrowRight,
  IndianRupee,
  GraduationCap
} from 'lucide-react';
import { Course, UserAccount } from '../types';

const ProgressRing: React.FC<{ type: 'empty' | 'partial' | 'full' }> = ({ type }) => {
  if (type === 'full') {
    return (
      <span className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      </span>
    );
  }
  if (type === 'partial') {
    return (
      <span className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-zinc-800 border-t-emerald-500 border-r-emerald-500 shrink-0 mt-0.5" />
    );
  }
  return (
    <span className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-zinc-800 shrink-0 mt-0.5" />
  );
};

interface CourseDirectoryProps {
  currentUser: UserAccount;
  courses: Course[];
  users?: UserAccount[];
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onTriggerEdit?: (course: Course) => void;
}

export const CourseDirectory: React.FC<CourseDirectoryProps> = ({
  currentUser,
  courses,
  users = [],
  onUpdateCourse,
  onDeleteCourse,
  onTriggerEdit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Vercel-style filters state
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  
  // Custom dropdown display states
  const [openDropdown, setOpenDropdown] = useState<'status' | 'duration' | 'category' | 'daterange' | null>(null);
  
  // Layout mode: 'row' (Vercel) or 'visual'
  const [layoutMode, setLayoutMode] = useState<'row' | 'log'>('row');
  
  // Roadmap states
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null);
  const [roadmapViewMode, setRoadmapViewMode] = useState<Record<string, 'timeline' | 'admissions'>>({});
  
  // Action context menus
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  
  // Delete confirm modal
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Close open dropdowns helper
  const toggleDropdown = (type: 'status' | 'duration' | 'category' | 'daterange') => {
    if (openDropdown === type) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(type);
    }
  };

  // Get distinct course prefix categories (e.g., DEVELOPMENT, CYBERSECURITY etc.)
  const distinctCategories = Array.from(new Set(courses.map(c => {
    const codeVal = c.code || c.batchNumber || 'ACADEMIC';
    if (codeVal.includes('-')) {
      return codeVal.split('-')[0].trim();
    }
    return codeVal.replace(/[0-9]/g, '').replace(/_/g, '').trim().toUpperCase() || 'ACADEMIC';
  }))) as string[];

  // Filter courses based on Vercel controls
  const filteredCourses = courses.filter(c => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const codeMatch = (c.code || '').toLowerCase().includes(q);
      const batchMatch = (c.batchNumber || '').toLowerCase().includes(q);
      const nameMatch = c.name.toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      if (!codeMatch && !batchMatch && !nameMatch && !descMatch) return false;
    }

    // 2. Status
    const status = c.status || 'ongoing';
    if (selectedStatus !== 'all' && status !== selectedStatus) return false;

    // 3. Duration
    const durMonths = c.durationMonths || (c.durationWeeks ? parseInt(c.durationWeeks, 10) : 0);
    if (selectedDuration !== 'all') {
      if (selectedDuration === 'short' && durMonths >= 6) return false;
      if (selectedDuration === 'long' && durMonths < 6) return false;
    }

    // 4. Category
    const codeVal = c.code || c.batchNumber || 'ACADEMIC';
    const categoryName = codeVal.includes('-') 
      ? codeVal.split('-')[0].trim() 
      : codeVal.replace(/[0-9]/g, '').replace(/_/g, '').trim().toUpperCase() || 'ACADEMIC';
    if (selectedCategory !== 'all' && categoryName !== selectedCategory) return false;

    // 5. Date Range / Release Year
    if (selectedDateRange !== 'all') {
      const year = c.publishDate ? c.publishDate.split('-')[0] : '2026';
      if (selectedDateRange !== year) return false;
    }

    return true;
  });

  // Relative launch date calculator (e.g. "12h ago", "2d ago") to simulate Vercel deployment speeds
  const getRelativeLaunchTime = (publishDate?: string, createdDate?: string) => {
    const rawDate = publishDate || createdDate || '2026-06-10';
    try {
      const targetDate = new Date(rawDate);
      const referenceDate = new Date('2026-06-15T09:00:00'); // current mock date
      const diffTime = referenceDate.getTime() - targetDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return '1h ago';
      if (diffDays === 1) return '1d ago';
      if (diffDays >= 30) {
        const months = Math.floor(diffDays / 30);
        return `${months}mo ago`;
      }
      return `${diffDays}d ago`;
    } catch {
      return '2d ago';
    }
  };

  // Helper for Category Colors in Vercel styling
  const getAvatarColor = (code?: string) => {
    if (!code) return 'bg-slate-500 text-white dark:bg-zinc-600';
    const text = code.toLowerCase();
    if (text.includes('dev')) return 'bg-blue-500 text-white dark:bg-blue-600';
    if (text.includes('cyber') || text.includes('security')) return 'bg-purple-500 text-white dark:bg-purple-600';
    if (text.includes('data') || text.includes('science')) return 'bg-emerald-500 text-white dark:bg-emerald-600';
    if (text.includes('analyt') || text.includes('marketing')) return 'bg-amber-500 text-white dark:bg-amber-600';
    return 'bg-slate-500 text-white dark:bg-zinc-600';
  };

  const getStatusBadgeStyles = (status?: string) => {
    const s = status || 'ongoing';
    if (s === 'ongoing') {
      return {
        dot: 'bg-emerald-500 shadow-emerald-500/50 animate-pulse',
        label: 'Active',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
      };
    } else if (s === 'upcoming') {
      return {
        dot: 'bg-blue-500 shadow-blue-500/50 animate-pulse',
        label: 'Upcoming',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-455 border border-blue-500/20'
      };
    } else {
      return {
        dot: 'bg-slate-400 dark:bg-slate-600 shadow-transparent',
        label: 'Archived',
        badge: 'bg-slate-500/10 text-slate-500 dark:text-gray-400 border border-slate-500/10'
      };
    }
  };

  return (
    <div id="course-directory-root" className="space-y-6 font-sans text-slate-900 dark:text-zinc-100 max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Vercel Header Breadcrumb Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 dark:border-white/5 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 select-none">
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span className="w-5 h-5 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-xs">L</span>
              learnora
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">academic-registry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Course Roadmaps
          </h1>
        </div>

        {/* Action / Context Details */}
        <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-zinc-400 font-sans select-none">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Curriculum Engine Active</span>
          </span>
          <span>•</span>
          <span>Active Programs: {filteredCourses.length}/{courses.length}</span>
        </div>
      </div>

      {/* Vercel Filter Controls Row */}
      <div className="space-y-3 font-sans">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#070708]">
          
          {/* Main search and filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
            
            {/* Search Box */}
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search programs, batch codes, subjects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-6 py-1.5 text-xs border border-zinc-200 dark:border-white/5 rounded-md bg-white dark:bg-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all font-sans"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-sans text-[9px] font-bold text-slate-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/10 px-1 py-0.2 rounded bg-slate-50 dark:bg-zinc-900">
                F
              </span>
            </div>

            {/* Vercel Dropdown Filters */}
            <div className="grid grid-cols-2 md:flex items-center gap-1.5 relative z-40">
              
              {/* All Branches - Category Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('category')}
                  className={`w-full md:w-auto flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 dark:bg-black dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 rounded-md transition cursor-pointer`}
                >
                  <span className="truncate">
                    {selectedCategory === 'all' ? 'All Categories' : `Category: ${selectedCategory}`}
                  </span>
                  <span className="text-[9px] text-slate-400">▾</span>
                </button>
                {openDropdown === 'category' && (
                  <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 text-xs text-slate-700 dark:text-zinc-300">
                    <button
                      onClick={() => { setSelectedCategory('all'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      All Categories (All Programs)
                    </button>
                    {distinctCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setOpenDropdown(null); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block font-sans truncate"
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All Authors - Duration Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('duration')}
                  className="w-full md:w-auto flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 dark:bg-black dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 rounded-md transition cursor-pointer"
                >
                  <span className="truncate">
                    {selectedDuration === 'all' ? 'All Durations' : selectedDuration === 'short' ? 'Short Term (<6m)' : 'Semesters (≥6m)'}
                  </span>
                  <span className="text-[9px] text-slate-400">▾</span>
                </button>
                {openDropdown === 'duration' && (
                  <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 text-xs text-slate-700 dark:text-zinc-300 font-sans">
                    <button
                      onClick={() => { setSelectedDuration('all'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      All Durations
                    </button>
                    <button
                      onClick={() => { setSelectedDuration('short'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      Under 6 Months
                    </button>
                    <button
                      onClick={() => { setSelectedDuration('long'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      6 to 12 Months
                    </button>
                  </div>
                )}
              </div>

              {/* All Environments - Status Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('status')}
                  className="w-full md:w-auto flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 dark:bg-black dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 rounded-md transition cursor-pointer font-sans"
                >
                  <span className="truncate">
                    {selectedStatus === 'all' ? 'All Statuses' : selectedStatus === 'ongoing' ? 'Active' : selectedStatus === 'upcoming' ? 'Upcoming' : 'Archived'}
                  </span>
                  <span className="text-[9px] text-slate-400">▾</span>
                </button>
                {openDropdown === 'status' && (
                  <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 text-xs text-slate-700 dark:text-zinc-300 font-sans">
                    <button
                      onClick={() => { setSelectedStatus('all'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block font-sans"
                    >
                      All Statuses
                    </button>
                    <button
                      onClick={() => { setSelectedStatus('ongoing'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block font-sans"
                    >
                      Active (Ongoing)
                    </button>
                    <button
                      onClick={() => { setSelectedStatus('upcoming'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block font-sans"
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => { setSelectedStatus('completed'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block font-sans"
                    >
                      Archived (Completed)
                    </button>
                  </div>
                )}
              </div>

              {/* Select Date Range Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('daterange')}
                  className="w-full md:w-auto flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 dark:bg-black dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 rounded-md transition cursor-pointer"
                >
                  <span className="truncate">
                    {selectedDateRange === 'all' ? 'Select Date' : `Year: ${selectedDateRange}`}
                  </span>
                  <span className="text-[9px] text-slate-400">▾</span>
                </button>
                {openDropdown === 'daterange' && (
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 text-xs text-slate-700 dark:text-zinc-300">
                    <button
                      onClick={() => { setSelectedDateRange('all'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      All Launches
                    </button>
                    <button
                      onClick={() => { setSelectedDateRange('2026'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      2026 Registry
                    </button>
                    <button
                      onClick={() => { setSelectedDateRange('2025'); setOpenDropdown(null); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 block"
                    >
                      2025 Archives
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right utility selectors */}
          <div className="flex items-center gap-2 justify-end self-end lg:self-center">
            
            {/* View Style Switcher */}
            <div className="flex items-center border border-zinc-200 dark:border-white/5 rounded-md overflow-hidden bg-white dark:bg-black p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode('row')}
                title="Sleek Rows Layout"
                className={`p-1.5 rounded-sm cursor-pointer transition ${layoutMode === 'row' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-650 hover:text-slate-750'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('log')}
                title="Compact Terminal Index"
                className={`p-1.5 rounded-sm cursor-pointer transition ${layoutMode === 'log' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-650 hover:text-slate-750'}`}
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Clear filter helper if filters are active */}
        {(selectedStatus !== 'all' || selectedDuration !== 'all' || selectedCategory !== 'all' || selectedDateRange !== 'all' || searchQuery !== '') && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 px-1 animate-fadeIn font-sans">
            <span>Filtered:</span>
            <span className="text-slate-700 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full font-bold">
              {filteredCourses.length} programs found
            </span>
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedDuration('all');
                setSelectedCategory('all');
                setSelectedDateRange('all');
                setSearchQuery('');
              }}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer ml-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Row-Based Course Deployments List */}
      {filteredCourses.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-transparent border border-zinc-200 dark:border-white/5 rounded-xl">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No course programs found</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Try resetting filter metrics or entering a different search keyword.</p>
        </div>
      ) : (
        <div id="deployments-rows-panel" className="bg-white dark:bg-[#070708] border border-slate-200/70 dark:border-white/5 rounded-xl p-6 md:p-10 divide-y divide-slate-150 dark:divide-white/[0.04] font-sans">
          
          {filteredCourses.map(c => {
            const hasRoadmap = c.roadmap && c.roadmap.length > 0;
            const viewMode = roadmapViewMode[c.id] || 'admissions';
            const isWeeks = c.durationUnit === 'weeks' || (!c.durationUnit && c.durationWeeks && !c.durationMonths);
            const durationText = isWeeks
              ? `${c.durationMonths || c.durationWeeks || 6} Weeks`
              : `${c.durationMonths || 6} Months`;
            
            return (
              <div 
                key={c.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 py-8 first:pt-0 last:pb-0 font-sans"
              >
                
                {/* Left Column: Course Name, Description and Actions */}
                <div className="md:col-span-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {c.name}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">
                      {c.description || 'No supplementary overview description declared in the master syllabus catalog.'}
                    </p>
                  </div>
                  
                  {/* Action Buttons: View Roadmap & More options */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setExpandedRoadmapId(expandedRoadmapId === c.id ? null : c.id);
                        if (expandedRoadmapId !== c.id) {
                          setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'admissions' }));
                        }
                      }}
                      className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all font-bold text-xs rounded-md shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{expandedRoadmapId === c.id ? "Collapse Details" : "View Roadmap"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedRoadmapId === c.id ? "rotate-180" : ""}`} />
                    </button>
                    
                    {/* Action Context Menu Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveActionsId(activeActionsId === c.id ? null : c.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white cursor-pointer border border-slate-200/50 dark:border-white/5"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {activeActionsId === c.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveActionsId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700 dark:text-zinc-300 font-sans"
                            >
                              {onTriggerEdit && (
                                <button
                                  onClick={() => {
                                    setActiveActionsId(null);
                                    onTriggerEdit(c);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 cursor-pointer font-bold"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Edit Syllabus</span>
                                </button>
                              )}
                              <div className="border-t border-zinc-100 dark:border-white/5 my-1" />
                              {['admin', 'sub-admin'].includes(currentUser.role) && onDeleteCourse && (
                                <button
                                  onClick={() => {
                                    setActiveActionsId(null);
                                    setCourseToDelete(c);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-455 flex items-center gap-1.5 cursor-pointer font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Decommission</span>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quotas, Metrics & Limits (Resend Usage style) */}
                <div className="md:col-span-6 space-y-4 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      {c.status === 'ongoing' ? 'Ongoing Program' : 'Upcoming Catalog'}
                    </span>
                    {c.batchNumber && (
                      <span className="text-[10px] font-bold text-rose-650 dark:text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Batch: {c.batchNumber}
                      </span>
                    )}
                  </div>
                  
                  {/* Limit/quota rows */}
                  <div className="space-y-1.5">
                    {(() => {
                      const courseStudents = users.filter(u => {
                        if (u.role !== 'student') return false;
                        if (!u.course) return false;
                        const userCourseClean = u.course.trim().toLowerCase().replace(/\.+$/, "");
                        const userBatchClean = u.batch?.trim().toLowerCase() || "";
                        const cId = c.id?.trim().toLowerCase() || "";
                        const cName = c.name.trim().toLowerCase().replace(/\.+$/, "");
                        const cCode = c.code?.trim().toLowerCase() || "";
                        const cBatch = c.batchNumber?.trim().toLowerCase() || "";
                        const isCourseMatch = userCourseClean === cName || userCourseClean === cId || userCourseClean === cCode;
                        if (userBatchClean) {
                          const isBatchMatch = userBatchClean === cBatch || userBatchClean === cCode || userBatchClean === cId;
                          return isCourseMatch && isBatchMatch;
                        }
                        return isCourseMatch;
                      });

                      const limitItems = [
                        {
                          label: "Contacts / Admitted Students",
                          value: courseStudents.length > 0 ? `${courseStudents.length} / 100` : "0 / 100",
                          ringType: courseStudents.length === 0 ? 'empty' : courseStudents.length >= 100 ? 'full' : 'partial'
                        },
                        {
                          label: "Duration Quota",
                          value: durationText,
                          ringType: 'partial' as const
                        },
                        {
                          label: "Tuition Fee tier",
                          value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.fee || 14999),
                          ringType: 'partial' as const
                        },
                        {
                          label: "Course Code identifier",
                          value: c.code || c.id.substring(0, 7).toUpperCase(),
                          ringType: 'empty' as const
                        }
                      ];

                      return limitItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/[0.03] last:border-0 font-sans">
                          <div className="flex items-center gap-3">
                            <ProgressRing type={item.ringType} />
                            <span className="text-xs font-medium text-slate-650 dark:text-zinc-350">{item.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans">{item.value}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Expanded content view underneath both columns */}
                <AnimatePresence>
                  {expandedRoadmapId === c.id && (
                    <div className="col-span-1 md:col-span-12 mt-4 pt-6 border-t border-dashed border-slate-200 dark:border-white/5">
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden transition-all duration-300 font-sans"
                      >
                        
                        {/* Terminal View Switcher bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-lg gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold select-none font-sans">
                            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                            <span>~/{(c.batchNumber || 'batch').toLowerCase()}/{viewMode}</span>
                          </div>
                          
                          {/* Interactive toggle of presentation mode */}
                          <div className="flex items-center gap-1 bg-white dark:bg-black rounded p-0.5 border border-zinc-200 dark:border-white/5 font-sans overflow-x-auto">
                            {c.roadmap && (
                              <button
                                type="button"
                                onClick={() => setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'timeline' }))}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-xs cursor-pointer whitespace-nowrap ${viewMode === 'timeline' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                              >
                                Timeline View
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'admissions' }))}
                              className={`px-2 py-0.5 text-[9px] font-bold rounded-xs cursor-pointer whitespace-nowrap ${viewMode === 'admissions' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              Admissions & Analytics
                            </button>
                          </div>
                        </div>

                        {/* Display content base on selected toggle visualization */}
                        {viewMode === 'admissions' ? (() => {
                          const courseStudents = users.filter(u => {
                            if (u.role !== 'student') return false;
                            if (!u.course) return false;
                            
                            const userCourseClean = u.course.trim().toLowerCase().replace(/\.+$/, "");
                            const userBatchClean = u.batch?.trim().toLowerCase() || "";
                            
                            const cId = c.id?.trim().toLowerCase() || "";
                            const cName = c.name.trim().toLowerCase().replace(/\.+$/, "");
                            const cCode = c.code?.trim().toLowerCase() || "";
                            const cBatch = c.batchNumber?.trim().toLowerCase() || "";
                            
                            const isCourseMatch = userCourseClean === cName || userCourseClean === cId || userCourseClean === cCode;
                            
                            if (userBatchClean) {
                              const isBatchMatch = userBatchClean === cBatch || userBatchClean === cCode || userBatchClean === cId;
                              return isCourseMatch && isBatchMatch;
                            }
                            
                            return isCourseMatch;
                          });
                          const paidStudents = courseStudents.filter(u => u.paymentStatus === 'paid');
                          const totalFeeCollected = paidStudents.length * (c.fee || 14999);
                          const pendingDuesCount = courseStudents.length - paidStudents.length;
                          const totalPotentialRevenue = courseStudents.length * (c.fee || 14999);
                          
                          const searchedStudents = courseStudents.filter(student => {
                            if (!studentSearchQuery) return true;
                            const q = studentSearchQuery.toLowerCase();
                            return (
                              student.name.toLowerCase().includes(q) ||
                              student.email.toLowerCase().includes(q) ||
                              (student.universalId || '').toLowerCase().includes(q)
                            );
                          });

                          return (
                            <div className="space-y-4">
                              {/* Summary Cards Row inside Expanded view */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                <div className="p-3 bg-slate-50 dark:bg-zinc-900/65 rounded-lg border border-zinc-200/80 dark:border-white/5 font-sans">
                                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Total Registered
                                  </div>
                                  <div className="text-base font-bold text-slate-850 dark:text-zinc-100 flex items-baseline gap-1 mt-0.5">
                                    <span>{courseStudents.length}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal font-sans">Active students</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-900/65 rounded-lg border border-zinc-200/80 dark:border-white/5 font-sans">
                                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Admissions Revenue
                                  </div>
                                  <div className="text-base font-bold text-emerald-650 dark:text-emerald-450 flex items-baseline gap-1 mt-0.5">
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalFeeCollected)}</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-900/65 rounded-lg border border-zinc-200/80 dark:border-white/5 font-sans">
                                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Pending Collection
                                  </div>
                                  <div className="text-base font-bold text-amber-650 dark:text-amber-450 flex items-baseline gap-1 mt-0.5">
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(pendingDuesCount * (c.fee || 14999))}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-normal font-sans">({pendingDuesCount} unpaid)</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-zinc-900/65 rounded-lg border border-zinc-200/80 dark:border-white/5 font-sans">
                                  <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Total Potential
                                  </div>
                                  <div className="text-base font-bold text-blue-650 dark:text-blue-450 flex items-baseline gap-1 mt-0.5">
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPotentialRevenue)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Search + Student Directory table exactly mimicking Vercel's tables */}
                              <div className="bg-slate-50/50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-white/5 rounded-lg p-3 font-sans">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-sans">
                                    Registered Cohort Listing ({courseStudents.length})
                                  </div>
                                  
                                  <div className="relative w-full sm:max-w-[200px]">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                                    <input
                                      type="text"
                                      placeholder="Filter cohort name/ID..."
                                      value={studentSearchQuery}
                                      onChange={e => setStudentSearchQuery(e.target.value)}
                                      className="w-full pl-7 pr-3 py-1 text-[11px] border border-zinc-200 dark:border-white/5 rounded-md bg-white dark:bg-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none font-sans"
                                    />
                                  </div>
                                </div>

                                {searchedStudents.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 select-none font-sans">
                                    No students matched the current cohort query
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                      <thead>
                                        <tr className="border-b border-zinc-200 dark:border-white/5 text-slate-400 dark:text-zinc-555 font-bold uppercase tracking-wider">
                                          <th className="pb-2 font-bold font-sans">Student Name</th>
                                          <th className="pb-2 font-bold font-sans">Email Address</th>
                                          <th className="pb-2 font-bold font-sans">Enrollment ID</th>
                                          <th className="pb-2 font-bold text-right font-sans">Tuition Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.03] text-slate-700 dark:text-zinc-300">
                                        {searchedStudents.map(student => {
                                          return (
                                            <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                                              <td className="py-2.5 font-semibold flex items-center gap-1.5 font-sans">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[9px] text-slate-600 dark:text-zinc-400 font-sans">
                                                  {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{student.name}</span>
                                              </td>
                                              <td className="py-2.5 text-slate-500 dark:text-zinc-400 font-sans">{student.email}</td>
                                              <td className="py-2.5 font-mono text-slate-500 dark:text-zinc-400">
                                                {student.universalId || `STU-${student.id.substring(0, 5).toUpperCase()}`}
                                              </td>
                                              <td className="py-2.5 text-right">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                                  student.paymentStatus === 'paid' 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                    : 'bg-amber-500/10 text-amber-605 dark:text-amber-400'
                                                }`}>
                                                  {student.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })() : viewMode === 'timeline' && c.roadmap ? (
                          
                          /* Highly stylized interactive timeline registry milestones */
                          <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl p-6 font-sans space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Curriculum Path & Milestones</h4>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">Step-by-step master roadmap sequence for academic success</p>
                              </div>
                            </div>

                            <div className="relative pl-8 border-l-2 border-dashed border-amber-500/40 dark:border-amber-500/25 space-y-6">
                              {c.roadmap.map((step, idx) => {
                                const isWeeks = c.durationUnit === 'weeks' || (!c.durationUnit && c.durationWeeks && !c.durationMonths);
                                const unitLabel = isWeeks ? 'Week' : 'Month';
                                const cleanTitle = (step.title || '').replace(/^(Month|Week)\s*\d+\s*[:\-]\s*/i, '').trim();
                                return (
                                  <div key={step.month} className="relative group/timeline transition-all duration-200">
                                    
                                    {/* Timeline nodes circles - large and beautiful */}
                                    <div className="absolute left-[-42px] top-1 w-7 h-7 rounded-full border-2 border-amber-500 bg-white dark:bg-black flex items-center justify-center font-sans text-[11px] font-black text-amber-600 dark:text-amber-400 select-none shadow-sm group-hover/timeline:scale-110 transition-transform">
                                      {step.month}
                                    </div>
 
                                    <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-amber-500/25 dark:hover:border-amber-500/20 transition-all font-sans">
                                      <div className="flex flex-wrap items-center gap-2 font-sans">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                          {unitLabel} {step.month} Milestone
                                        </span>
                                        <span className="text-slate-400 dark:text-zinc-500 font-sans text-[9px] font-extrabold uppercase bg-slate-50 dark:bg-white/5 py-0.5 px-2 rounded-full border border-slate-100 dark:border-white/5">
                                          Stage {idx + 1}
                                        </span>
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-150 mt-1">{cleanTitle}</h5>
                                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mt-2 font-medium">
                                        {step.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                        
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#09090B] border border-zinc-150 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-xl font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/15 rounded-xl text-red-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-slate-850 dark:text-zinc-100">
                  Decommission Published Course?
                </h3>
                <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to completely decommission and unpublish <strong className="text-slate-800 dark:text-white">&ldquo;{courseToDelete.name}&rdquo;</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-5 font-sans">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-1.5 text-xs bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-350 font-bold rounded-xl border border-zinc-200 dark:border-transparent hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCourse) onDeleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Decommission
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
