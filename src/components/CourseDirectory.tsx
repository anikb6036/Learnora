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
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-450 border border-blue-500/20'
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
        <div id="deployments-rows-panel" className="space-y-4 font-sans">
          
          {filteredCourses.map(c => {
            const hasRoadmap = c.roadmap && c.roadmap.length > 0;
            const statusConfig = getStatusBadgeStyles(c.status);
            const viewMode = roadmapViewMode[c.id] || 'admissions';
            const relativeTime = getRelativeLaunchTime(c.publishDate, c.createdDate);
            const durationText = c.durationWeeks ? `${c.durationWeeks} Weeks` : '6 Months';
            
            return (
              <div 
                key={c.id} 
                className="group/row bg-white dark:bg-[#070709] border border-slate-200/70 dark:border-white/5 rounded-xl p-5 shadow-xs hover:border-amber-500/35 dark:hover:border-amber-500/25 hover:shadow-sm transition-all duration-200 relative"
              >
                
                {/* Main horizontal flex content container */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Column: Status Pulsing Indicator, Title, Branch Name */}
                  <div className="flex-1 min-w-0 space-y-2">
                    
                    {/* Header Row: Status Indicator, Topic Subheading, Duration */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 select-none font-sans text-[11px] font-bold">
                        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                        <span className="text-slate-800 dark:text-zinc-200">{statusConfig.label}</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-800 text-xs select-none">|</span>

                      {/* Mock branch name tag: Production or Preview Badge */}
                      {c.status === 'ongoing' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-wide font-extrabold px-2 py-0.5 text-white bg-blue-600 dark:bg-blue-600/95 rounded shadow-2xs font-sans">
                          <Globe className="w-2.5 h-2.5" />
                          <span>ACTIVE PROGRAM</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-wide font-bold px-2 py-0.5 text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-[#111113] border border-zinc-200 dark:border-white/5 rounded font-sans">
                          <span>UPCOMING CATALOG</span>
                        </span>
                      )}

                      {/* Decisive Batch Number Indicator badge */}
                      {c.batchNumber && (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-wide font-extrabold px-2 py-0.5 text-rose-800 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded font-sans">
                          <span>BATCHCODE: {c.batchNumber}</span>
                        </span>
                      )}
                    </div>

                    {/* Deployment Message - Custom structured Course details */}
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-850 dark:text-zinc-150 group-hover/row:text-amber-500 transition-colors duration-150 truncate">
                          {c.name}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-sans line-clamp-1 group-hover/row:line-clamp-none max-w-3xl">
                        {c.description || 'No supplementary overview description declared in the master syllabus catalog.'}
                      </p>
                    </div>

                    {/* Metadata line styled exactly like git commit logs on vercel: Branch details, code, and date duration */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 font-sans">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Duration: {durationText}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-emerald-650 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                        <span>Tuition Fee:</span>
                        <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.fee || 14999)}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span>Course Code:</span> 
                        <span className="text-slate-640 dark:text-zinc-400 underline font-semibold bg-transparent border-0 p-0 hover:text-amber-500 transition cursor-pointer">
                          {c.code || c.id.substring(0, 7).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Visual details / Action timeline launch date triggers */}
                  <div className="flex items-center justify-between md:justify-end gap-x-5 flex-shrink-0 pt-2 md:pt-0 border-t border-dashed border-zinc-100 dark:border-white/5 md:border-t-0 font-sans text-xs">
                    
                    {/* Launch Date (e.g. 1d ago, etc) */}
                    <div className="text-right flex flex-col md:items-end justify-center">
                      <span className="text-slate-700 dark:text-zinc-300 font-bold">Commencing {relativeTime}</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">Release Date: {c.publishDate || c.createdDate}</span>
                    </div>

                    {/* Department Head Avatar with circular initial */}
                    <div className="flex items-center gap-2 select-none">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] animate-fadeIn ${getAvatarColor(c.code)}`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Arrow Trigger button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveActionsId(activeActionsId === c.id ? null : c.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Action Context absolute Overlay Menu */}
                        <AnimatePresence>
                          {activeActionsId === c.id && (
                            <>
                              {/* Invisible backdrop */}
                              <div className="fixed inset-0 z-40" onClick={() => setActiveActionsId(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-white/10 rounded-md shadow-lg py-1 z-50 text-xs text-slate-700 dark:text-zinc-300 font-sans"
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
                                <button
                                  onClick={() => {
                                    setActiveActionsId(null);
                                    setExpandedRoadmapId(expandedRoadmapId === c.id ? null : c.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 cursor-pointer font-bold"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{expandedRoadmapId === c.id ? 'Hide Roadmap' : 'View Roadmap'}</span>
                                </button>
                                <div className="border-t border-zinc-100 dark:border-white/5 my-1" />
                                {['admin', 'sub-admin'].includes(currentUser.role) && onDeleteCourse && (
                                  <button
                                    onClick={() => {
                                      setActiveActionsId(null);
                                      setCourseToDelete(c);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center gap-1.5 cursor-pointer font-bold"
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
                </div>

                {/* Direct Action Expansion Toggle row on mobile/tablet */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedRoadmapId(expandedRoadmapId === c.id ? null : c.id);
                      if (expandedRoadmapId !== c.id) {
                        setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'admissions' }));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-md border border-zinc-200/50 dark:border-white/5 cursor-pointer transition font-sans"
                  >
                    <BookOpen className="w-3 h-3 text-amber-500" />
                    <span>{expandedRoadmapId === c.id ? 'COLLAPSE DETAILS' : 'VIEW COURSE DETAILS & ADMISSIONS'}</span>
                  </button>
                </div>

                {/* Vercel Terminals Logs view panel details */}
                <AnimatePresence>
                  {expandedRoadmapId === c.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 pl-0 border-t border-dashed border-zinc-200 dark:border-white/5 pt-4 transition-all duration-300 font-sans"
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
                        const courseStudents = users.filter(u => u.role === 'student' && u.course === c.name);
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
                          <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl p-6 font-sans space-y-6">
                            
                            {/* Key Performance Indicators Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              
                              {/* Stat Card 1: Total Admitted */}
                              <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all duration-250 hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mb-1">Total Admitted</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-zinc-100">{courseStudents.length}</p>
                                  </div>
                                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl text-indigo-500 dark:text-indigo-400">
                                    <Users className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                  <span>Active enrollment roster</span>
                                  <span className="font-bold text-indigo-500">100% Total</span>
                                </div>
                              </div>

                              {/* Stat Card 2: Revenue Collected */}
                              <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all duration-250 hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mb-1">Revenue Collected</p>
                                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalFeeCollected)}
                                    </p>
                                  </div>
                                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-500 dark:text-emerald-450">
                                    <IndianRupee className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                  <span>Potential: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalPotentialRevenue)}</span>
                                  <span className="font-bold text-emerald-500">
                                    {courseStudents.length > 0 ? `${Math.round((paidStudents.length / courseStudents.length) * 100)}%` : '0%'}
                                  </span>
                                </div>
                              </div>

                              {/* Stat Card 3: Paid Students */}
                              <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all duration-250 hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mb-1">Paid Accounts</p>
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{paidStudents.length}</p>
                                  </div>
                                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-500 dark:text-blue-400">
                                    <GraduationCap className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                  <span>Cleared tuition fee</span>
                                  <span className="font-bold text-blue-500">
                                    {courseStudents.length > 0 ? `${paidStudents.length}/${courseStudents.length}` : '0/0'}
                                  </span>
                                </div>
                              </div>

                              {/* Stat Card 4: Pending Dues */}
                              <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-5 shadow-sm relative overflow-hidden transition-all duration-250 hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mb-1">Outstanding Dues</p>
                                    <p className="text-3xl font-black text-amber-600 dark:text-amber-550">{pendingDuesCount}</p>
                                  </div>
                                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-600 dark:text-amber-500">
                                    <CreditCard className="w-5 h-5" />
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                                  <span>Awaiting payment clearance</span>
                                  <span className="font-bold text-amber-600">
                                    {courseStudents.length > 0 ? `${Math.round((pendingDuesCount / courseStudents.length) * 100)}%` : '0%'}
                                  </span>
                                </div>
                              </div>

                            </div>
                            
                            {/* Student Roster Section */}
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-700 dark:text-zinc-300">
                                    <Users className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Enrolled Student Registry</h4>
                                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">Official student list enrolled in {c.name}</p>
                                  </div>
                                </div>

                                {/* Live Student Search Box */}
                                <div className="relative w-full sm:w-64">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                                  <input
                                    type="text"
                                    placeholder="Search student name or email..."
                                    value={studentSearchQuery}
                                    onChange={e => setStudentSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1 text-xs border border-zinc-250 dark:border-white/10 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
                                  />
                                </div>
                              </div>

                              {searchedStudents.length > 0 ? (
                                <div className="border border-slate-200/60 dark:border-white/5 rounded-xl overflow-hidden bg-white dark:bg-[#070709] shadow-2xs">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-white/5 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-zinc-400">
                                      <tr>
                                        <th className="px-5 py-3">Student Name</th>
                                        <th className="px-5 py-3">Student Email</th>
                                        <th className="px-5 py-3 text-center">Registration ID</th>
                                        <th className="px-5 py-3 text-right">Payment Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-zinc-300">
                                      {searchedStudents.map(student => {
                                        const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                        return (
                                          <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-5 py-3.5 flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200/50 dark:border-white/5`}>
                                                {initials}
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-800 dark:text-zinc-150">{student.name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Joined on {student.joinedDate || 'June 2026'}</p>
                                              </div>
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-zinc-400">{student.email}</td>
                                            <td className="px-5 py-3.5 text-center font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                                              {student.universalId || `STU-${student.id.substring(0, 5).toUpperCase()}`}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs border ${
                                                student.paymentStatus === 'paid' 
                                                  ? 'bg-emerald-50/70 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/10' 
                                                  : 'bg-amber-50/70 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/10'
                                              }`}>
                                                {student.paymentStatus === 'paid' ? 'Paid In Full' : 'Awaiting Fees'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-10 bg-white dark:bg-[#070709] border border-slate-200/60 dark:border-white/5 rounded-xl shadow-2xs">
                                  <Users className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No matching students found</p>
                                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Try modifying your search criteria or enrolling new students in this course.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })() : viewMode === 'timeline' && c.roadmap ? (
                        
                        /* Highly stylized interactive timeline registry milestones */
                        <div className="bg-slate-50/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl p-6 font-sans space-y-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-600">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Curriculum Path & Milestones</h4>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Step-by-step master roadmap sequence for academic success</p>
                            </div>
                          </div>

                          <div className="relative pl-8 border-l-2 border-dashed border-amber-500/40 dark:border-amber-500/25 space-y-6">
                            {c.roadmap.map((step, idx) => {
                              const cleanTitle = (step.title || '').replace(/^Month\s*\d+\s*[:\-]\s*/i, '').trim();
                              return (
                                <div key={step.month} className="relative group/timeline transition-all duration-200">
                                  
                                  {/* Timeline nodes circles - large and beautiful */}
                                  <div className="absolute left-[-42px] top-1 w-7 h-7 rounded-full border-2 border-amber-500 bg-white dark:bg-black flex items-center justify-center font-sans text-[11px] font-black text-amber-600 dark:text-amber-400 select-none shadow-sm group-hover/timeline:scale-110 transition-transform">
                                    {step.month}
                                  </div>

                                  <div className="bg-white dark:bg-[#09090B] border border-slate-200/80 dark:border-white/5 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-amber-500/25 dark:hover:border-amber-500/20 transition-all">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Month {step.month} Milestone
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
            className="bg-white dark:bg-[#09090B] border border-zinc-150 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-xl"
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
