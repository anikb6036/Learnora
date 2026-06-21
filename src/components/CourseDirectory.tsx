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
  Play
} from 'lucide-react';
import { Course, UserAccount } from '../types';

interface CourseDirectoryProps {
  currentUser: UserAccount;
  courses: Course[];
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  onTriggerEdit?: (course: Course) => void;
}

export const CourseDirectory: React.FC<CourseDirectoryProps> = ({
  currentUser,
  courses,
  onUpdateCourse,
  onDeleteCourse,
  onTriggerEdit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
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
  const [roadmapViewMode, setRoadmapViewMode] = useState<Record<string, 'terminal' | 'timeline'>>({});
  
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
        <div id="deployments-rows-panel" className="border border-zinc-200 dark:border-white/5 bg-white dark:bg-black rounded-lg overflow-hidden divide-y divide-zinc-200 dark:divide-white/5 shadow-2xs font-sans">
          
          {filteredCourses.map(c => {
            const hasRoadmap = c.roadmap && c.roadmap.length > 0;
            const statusConfig = getStatusBadgeStyles(c.status);
            const viewMode = roadmapViewMode[c.id] || 'terminal';
            const relativeTime = getRelativeLaunchTime(c.publishDate, c.createdDate);
            const durationText = c.durationWeeks ? `${c.durationWeeks} Weeks` : '6 Months';
            
            return (
              <div 
                key={c.id} 
                className="group/row hover:bg-slate-50/[0.3] dark:hover:bg-white/[0.01] transition-all duration-150 p-4 relative"
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
                {hasRoadmap && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedRoadmapId(expandedRoadmapId === c.id ? null : c.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-md border border-zinc-200/50 dark:border-white/5 cursor-pointer transition font-sans"
                    >
                      <BookOpen className="w-3 h-3 text-amber-500" />
                      <span>{expandedRoadmapId === c.id ? 'COLLAPSE ROADMAP' : `VIEW SYLLABUS ROADMAP (${c.roadmap?.length} Milestones)`}</span>
                    </button>
                  </div>
                )}

                {/* Vercel Terminals Logs view panel details */}
                <AnimatePresence>
                  {expandedRoadmapId === c.id && c.roadmap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 pl-0 border-t border-dashed border-zinc-200 dark:border-white/5 pt-4 transition-all duration-300 font-sans"
                    >
                      
                      {/* Terminal View Switcher bar */}
                      <div className="flex items-center justify-between mb-3 bg-slate-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 px-3 py-1.5 rounded-lg">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold select-none font-sans">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span>Curriculum Milestones: ~/{(c.batchNumber || 'batch').toLowerCase()}/milestones</span>
                        </div>
                        
                        {/* Interactive toggle of presentation mode */}
                        <div className="flex items-center gap-1 bg-white dark:bg-black rounded p-0.5 border border-zinc-200 dark:border-white/5 font-sans">
                          <button
                            type="button"
                            onClick={() => setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'terminal' }))}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-xs cursor-pointer ${viewMode === 'terminal' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                            Milestones List
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoadmapViewMode(prev => ({ ...prev, [c.id]: 'timeline' }))}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-xs cursor-pointer ${viewMode === 'timeline' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                            Timeline View
                          </button>
                        </div>
                      </div>

                      {/* Display content base on selected toggle visualization */}
                      {viewMode === 'terminal' ? (
                        
                        /* Log CLI console design output */
                        <div className="bg-[#0A0A0C] border border-[#1E1E22] rounded-lg p-5 font-sans text-xs text-zinc-300 space-y-2.5 shadow-2xl relative select-text overflow-x-auto">
                          
                          {/* Live compilation header logs mimicking real vercel deployers */}
                          <div className="space-y-0.5 select-none border-b border-zinc-800/80 pb-2 text-[11px] text-zinc-400 font-sans">
                            <p>▲ Academy Syllabus Registry - Milestones and academic objectives loaded successfully</p>
                            <p>▲ Course Code: <span className="text-emerald-450 font-semibold">&ldquo;{c.code || c.id.substring(0, 7).toUpperCase()}&rdquo;</span> | Batch Code: <span className="text-rose-400 font-semibold">&ldquo;{c.batchNumber || 'stb_001'}&rdquo;</span> | Sequence ID: {c.id.substring(0,8)}</p>
                            <p>▲ Duration: {durationText} | Release Date: {c.publishDate || c.createdDate}</p>
                            <p className="text-emerald-500 font-semibold">✓ All curriculum milestones verified... Active!</p>
                          </div>

                          <div className="space-y-4 pt-2 font-sans">
                            {c.roadmap.map((step, idx) => {
                              return (
                                <div key={step.month} className="group/terminal-row flex items-start gap-4 hover:bg-white/[0.02] p-1 rounded transition duration-150">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-amber-550 font-bold text-xs">[Milestone {step.month}]</span>
                                      <span className="text-zinc-100 font-bold tracking-tight text-sm">
                                        &ldquo;{step.title}&rdquo;
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-1">
                                      <p className="text-zinc-400 leading-relaxed text-[11px] font-normal font-sans">
                                        {step.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Final success lines logs */}
                          <div className="pt-2 select-none border-t border-zinc-800/80 text-[10px] text-zinc-500 flex justify-between font-sans">
                            <span>▲ Curriculum mapped successfully for academic registry</span>
                            <span className="text-emerald-500 font-bold">● PROGRAM ACTIVE</span>
                          </div>
                        </div>
                      ) : (
                        
                        /* Visualization timeline chart graph mockup view */
                        <div className="bg-slate-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-lg p-5 space-y-4 font-sans">
                          <div className="relative pl-6 border-l-2 border-amber-500/50 space-y-6">
                            {c.roadmap.map((step, idx) => (
                              <div key={step.month} className="relative animate-fadeIn">
                                
                                {/* Timeline nodes circles */}
                                <div className="absolute left-[-30px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-500 bg-white dark:bg-black flex items-center justify-center font-sans text-[8px] font-bold text-amber-500 select-none">
                                  {step.month}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                                      Month {step.month} Milestone
                                    </span>
                                    <span className="text-slate-450 dark:text-zinc-400 font-sans text-[9px] bg-slate-100 dark:bg-white/5 py-0.5 px-1.5 rounded-sm">
                                      Stage {idx + 1}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">{step.title}</h4>
                                  <p className="text-xs text-slate-550 dark:text-zinc-400 leading-relaxed font-sans mt-1">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
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
