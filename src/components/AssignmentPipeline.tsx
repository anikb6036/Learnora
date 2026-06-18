import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Send,
  AlertCircle,
  Clock,
  Filter,
  X,
  Database
} from 'lucide-react';
import { Course, StudentBatch, AssignmentBankItem, StudentAssignment, UserAccount, AppNotification } from '../types';

interface AssignmentPipelineProps {
  currentUser: UserAccount;
  courses: Course[];
  batches: StudentBatch[];
  assignmentBank: AssignmentBankItem[];
  setAssignmentBank: React.Dispatch<React.SetStateAction<AssignmentBankItem[]>>;
  assignments: StudentAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<StudentAssignment[]>>;
  users: UserAccount[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

export const AssignmentPipeline: React.FC<AssignmentPipelineProps> = ({
  currentUser,
  courses,
  batches,
  assignmentBank,
  setAssignmentBank,
  assignments,
  setAssignments,
  users,
  setNotifications
}) => {
  // Tab control: 'bank' | 'pipeline'
  const [pipelineTab, setPipelineTab] = useState<'bank' | 'pipeline'>('bank');

  // Bank search/filters
  const [bankSearch, setBankSearch] = useState('');
  const [bankCourseFilter, setBankCourseFilter] = useState('all');
  const [bankBatchFilter, setBankBatchFilter] = useState('all');

  // Multi-step Pipeline (Deploy assignment) states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Month 1');
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [selectedBankTemplateId, setSelectedBankTemplateId] = useState('');
  const [pipelineDueDate, setPipelineDueDate] = useState('');
  const [customMaxPoints, setCustomMaxPoints] = useState(100);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [useCustomAssignment, setUseCustomAssignment] = useState(false);
  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState('');

  // Add/Edit Bank Template modal states
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AssignmentBankItem | null>(null);
  
  // Template Form Fields
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCourse, setTemplateCourse] = useState('');
  const [templateBatch, setTemplateBatch] = useState('');
  const [templateMonth, setTemplateMonth] = useState('Month 1');
  const [templateSyllabus, setTemplateSyllabus] = useState('');
  const [templateMaxPoints, setTemplateMaxPoints] = useState(100);
  const [validationError, setValidationError] = useState('');

  // Open modal for editing or adding template
  const openBankModal = (template: AssignmentBankItem | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateTitle(template.title);
      setTemplateDesc(template.description);
      setTemplateCourse(template.course);
      setTemplateBatch(template.batch);
      setTemplateMonth(template.month || 'Month 1');
      setTemplateSyllabus(template.syllabus || '');
      setTemplateMaxPoints(template.maxPoints);
    } else {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDesc('');
      setTemplateCourse(courses[0]?.name || '');
      setTemplateBatch(batches[0]?.name || '');
      setTemplateMonth('Month 1');
      setTemplateSyllabus('');
      setTemplateMaxPoints(100);
    }
    setValidationError('');
    setIsBankModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateDesc.trim() || !templateCourse || !templateBatch) {
      setValidationError('Please fill out all required fields.');
      return;
    }

    if (editingTemplate) {
      // Edit
      setAssignmentBank(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        batch: templateBatch,
        month: templateMonth,
        syllabus: templateSyllabus,
        maxPoints: templateMaxPoints
      } : t));
    } else {
      // Add
      const newItem: AssignmentBankItem = {
        id: `bank-${Date.now()}`,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        batch: templateBatch,
        month: templateMonth,
        syllabus: templateSyllabus,
        maxPoints: templateMaxPoints,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setAssignmentBank(prev => [newItem, ...prev]);
    }
    setIsBankModalOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment template from the bank?')) {
      setAssignmentBank(prev => prev.filter(t => t.id !== id));
    }
  };

  // Deploy assignment pipeline publisher
  const handleDeployPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch) {
      alert('Please select target Course and Batch.');
      return;
    }

    let finalTitle = '';
    let finalDesc = '';
    let finalPoints = 100;

    if (useCustomAssignment) {
      if (!customTitle.trim() || !customDesc.trim()) {
        alert('Please fill out the custom title and description.');
        return;
      }
      finalTitle = customTitle;
      finalDesc = customDesc;
      finalPoints = customMaxPoints;
    } else {
      const template = assignmentBank.find(t => t.id === selectedBankTemplateId);
      if (!template) {
        alert('Please select an assignment template from the bank.');
        return;
      }
      finalTitle = template.title;
      finalDesc = template.description;
      finalPoints = template.maxPoints;
    }

    const newAssignmentId = `asg-${Date.now()}`;
    const newAsg: StudentAssignment = {
      id: newAssignmentId,
      title: finalTitle,
      description: finalDesc,
      course: selectedCourse,
      batch: selectedBatch,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      dueDate: pipelineDueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      maxPoints: finalPoints,
      status: 'published',
      createdDate: new Date().toISOString().split('T')[0],
      submissions: [],
      month: selectedMonth,
      syllabus: selectedSyllabus
    };

    setAssignments(prev => [newAsg, ...prev]);

    // Send notifications to enrolled students
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (selectedBatch === 'All' || u.batch?.toLowerCase() === selectedBatch.toLowerCase()) &&
      (selectedCourse === 'All' || u.course?.toLowerCase() === selectedCourse.toLowerCase())
    );

    targetStudents.forEach(st => {
      const notif: AppNotification = {
        id: `notif-asg-pipeline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `📄 Course Homework: ${finalTitle}`,
        message: `New pipeline assignment issued for ${selectedMonth} (${selectedSyllabus || 'General'}). Due: ${newAsg.dueDate}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
    });

    setPipelineSuccessMsg(`Successfully deployed assignment "${finalTitle}" to all students in ${selectedCourse} (${selectedBatch}) for ${selectedMonth}!`);
    
    // Clear pipeline states
    setCustomTitle('');
    setCustomDesc('');
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 5000);
  };

  // Get matching templates for pipeline filtering
  const matchingTemplates = assignmentBank.filter(t => {
    const matchesCourse = !selectedCourse || t.course.toLowerCase() === selectedCourse.toLowerCase();
    
    // Check batch matches. Course might store code (like stb_001) or name (Batch A)
    // We normalize to match names or codes
    const batchMatches = !selectedBatch || 
                         t.batch.toLowerCase() === selectedBatch.toLowerCase() ||
                         (selectedBatch === 'stb_001' && t.batch.toLowerCase() === 'batch a') ||
                         (selectedBatch === 'stb_002' && t.batch.toLowerCase() === 'batch b') ||
                         (selectedBatch === 'stb_003' && t.batch.toLowerCase() === 'batch c') ||
                         (selectedBatch === 'stb_004' && t.batch.toLowerCase() === 'batch d') ||
                         (t.batch.toLowerCase() === 'stb_001' && selectedBatch.toLowerCase() === 'batch a') ||
                         (t.batch.toLowerCase() === 'stb_002' && selectedBatch.toLowerCase() === 'batch b') ||
                         (t.batch.toLowerCase() === 'stb_003' && selectedBatch.toLowerCase() === 'batch c') ||
                         (t.batch.toLowerCase() === 'stb_004' && selectedBatch.toLowerCase() === 'batch d');

    const matchesMonth = !selectedMonth || t.month.toLowerCase() === selectedMonth.toLowerCase();
    
    return matchesCourse && batchMatches && matchesMonth;
  });

  // Filter assignment bank list view
  const filteredBank = assignmentBank.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(bankSearch.toLowerCase()) ||
                          t.syllabus.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
    const matchesBatch = bankBatchFilter === 'all' || t.batch.toLowerCase() === bankBatchFilter.toLowerCase();
    return matchesSearch && matchesCourse && matchesBatch;
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Premium Header Decoration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-amber-500" />
            Assignment Bank & Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Build reusable curriculum assignment templates, map them to specific course schedules, and deploy structured homework paths.
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-1 bg-slate-50 dark:bg-[#070708] border border-slate-205 dark:border-white/5 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setPipelineTab('bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'bank'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Assignment Bank
          </button>
          <button
            type="button"
            onClick={() => {
              setPipelineTab('pipeline');
              // Pre-populate filters if courses exist
              if (courses.length > 0 && !selectedCourse) {
                setSelectedCourse(courses[0].name);
                setSelectedBatch(courses[0].batchNumber || 'Batch A');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'pipeline'
                ? 'bg-amber-500 text-amber-950 shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Deploy Pipeline
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {pipelineTab === 'bank' ? (
          <motion.div
            key="bank-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-[#111112] p-4 rounded-2xl border border-slate-205 dark:border-white/5 shadow-xs">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search template title, syllabus, keywords..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs bg-slate-50 dark:bg-[#070708] focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-zinc-200"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                />
              </div>

              {/* Course Filter */}
              <div>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs bg-slate-50 dark:bg-[#070708] focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-zinc-200"
                  value={bankCourseFilter}
                  onChange={e => setBankCourseFilter(e.target.value)}
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs bg-slate-50 dark:bg-[#070708] focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-zinc-200"
                  value={bankBatchFilter}
                  onChange={e => setBankBatchFilter(e.target.value)}
                >
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                  <option value="stb_001">Batch stb_001</option>
                  <option value="stb_002">Batch stb_002</option>
                  <option value="stb_003">Batch stb_003</option>
                  <option value="stb_004">Batch stb_004</option>
                </select>
              </div>
            </div>

            {/* Template Roster Heading */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-805 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Templates Pool ({filteredBank.length})
              </h3>
              <button
                type="button"
                onClick={() => openBankModal()}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 animate-pulse" />
                Create Template
              </button>
            </div>

            {/* List/Grid of templates */}
            {filteredBank.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708] p-10">
                <Database className="w-12 h-12 text-slate-300 dark:text-white/5 mx-auto mb-3" />
                <p className="text-xs text-slate-450 dark:text-slate-550 font-semibold">No Templates Found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try resetting filters or create a new template for the syllabus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBank.map(item => {
                  // Find batch label
                  let displayBatch = item.batch;
                  if (item.batch === 'stb_001') displayBatch = 'Batch A';
                  if (item.batch === 'stb_002') displayBatch = 'Batch B';
                  if (item.batch === 'stb_003') displayBatch = 'Batch C';
                  if (item.batch === 'stb_004') displayBatch = 'Batch D';

                  return (
                    <div
                      key={item.id}
                      className="p-5 bg-white dark:bg-[#111112] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-2xs group relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Meta Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded ring-1 ring-slate-200/50 dark:ring-white/5 uppercase">
                                {item.course}
                              </span>
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold rounded ring-1 ring-amber-500/10">
                                {displayBatch}
                              </span>
                              {item.month && (
                                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded">
                                  {item.month}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-855 dark:text-white leading-snug tracking-tight">
                              {item.title}
                            </h4>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              type="button"
                              onClick={() => openBankModal(item)}
                              className="p-1 rounded bg-slate-50 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 cursor-pointer"
                              title="Edit Template"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(item.id)}
                              className="p-1 rounded bg-slate-50 dark:bg-white/5 hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                              title="Delete Template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11.5px] text-slate-505 dark:text-zinc-400 font-sans leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">Syllabus: <strong className="text-slate-600 dark:text-slate-400 font-medium">{item.syllabus || 'N/A'}</strong></span>
                        </div>
                        <div className="font-mono bg-slate-50 dark:bg-slate-900/40 px-2 py-0.5 rounded font-semibold text-slate-605">
                          {item.maxPoints} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pipeline-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Deploy Setup Form Columns */}
            <form onSubmit={handleDeployPipeline} className="lg:col-span-7 bg-white dark:bg-[#111112] border border-slate-205 dark:border-white/5 p-6 rounded-2xl shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-white/5">
                <Layers className="w-4 h-4 text-amber-500 animate-pulse" />
                Step 1: Set Target filters & Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                {/* Course Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Target Course *</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-202 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={selectedCourse}
                    onChange={e => {
                      setSelectedCourse(e.target.value);
                      // Auto-select match batch from courses list if possible
                      const matchCourseObj = courses.find(c => c.name === e.target.value);
                      if (matchCourseObj?.batchNumber) {
                        setSelectedBatch(matchCourseObj.batchNumber);
                      }
                    }}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Target Batch *</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={selectedBatch}
                    onChange={e => setSelectedBatch(e.target.value)}
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                    <option value="stb_001">stb_001 (Batch A)</option>
                    <option value="stb_002">stb_002 (Batch B)</option>
                    <option value="stb_003">stb_003 (Batch C)</option>
                    <option value="stb_004">stb_004 (Batch D)</option>
                  </select>
                </div>

                {/* Course Month Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Month Track *</label>
                  <select
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  >
                    <option value="Month 1">Month 1</option>
                    <option value="Month 2">Month 2</option>
                    <option value="Month 3">Month 3</option>
                    <option value="Month 4">Month 4</option>
                    <option value="Month 5">Month 5</option>
                    <option value="Month 6">Month 6</option>
                  </select>
                </div>

                {/* Target Syllabus Label */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Syllabus Topic / Unit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 2: Chemical Bonding"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-201 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                    value={selectedSyllabus}
                    onChange={e => setSelectedSyllabus(e.target.value)}
                  />
                </div>
              </div>

              {/* Assignment Selector Option Toggle */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Step 2: Choose Assignment Source
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      id="custom_asg_toggle"
                      checked={useCustomAssignment}
                      onChange={e => setUseCustomAssignment(e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/10 text-amber-500 focus:ring-amber-500 cursor-pointer w-3.5 h-3.5"
                    />
                    <label htmlFor="custom_asg_toggle" className="text-slate-500 dark:text-gray-400 font-medium cursor-pointer">
                      Use custom template-less task
                    </label>
                  </div>
                </div>

                {pipelineSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pipelineSuccessMsg}</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {!useCustomAssignment ? (
                    <motion.div
                      key="bank-selector"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400 mb-1">Select Bank Assignment Template *</label>
                      {matchingTemplates.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-rose-200 dark:border-rose-500/20 bg-rose-50/20 dark:bg-rose-500/5 text-rose-600 text-xs text-left">
                          <AlertCircle className="w-4 h-4 inline-block -mt-0.5 mr-1.5 text-rose-500" />
                          No bank templates match the criteria: Course: <b className="font-semibold">{selectedCourse || 'None'}</b>, Batch: <b className="font-semibold">{selectedBatch || 'None'}</b>, Month: <b className="font-semibold">{selectedMonth}</b>. 
                          <span className="block mt-1 text-slate-500 dark:text-gray-500">
                            Create one in the <b>Assignment Bank</b> tab first, or toggle "Use custom template-less task".
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {matchingTemplates.map(item => (
                            <label
                              key={item.id}
                              className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition text-xs ${
                                selectedBankTemplateId === item.id
                                  ? 'bg-amber-500/5 border-amber-500 ring-1 ring-amber-500/30'
                                  : 'bg-slate-50/50 dark:bg-[#070708] border-slate-200 dark:border-white/5 hover:border-slate-350'
                              }`}
                            >
                              <input
                                type="radio"
                                name="pipeline_template"
                                className="mt-1 border-slate-300 text-amber-500 focus:ring-amber-500"
                                checked={selectedBankTemplateId === item.id}
                                onChange={() => {
                                  setSelectedBankTemplateId(item.id);
                                  setSelectedSyllabus(item.syllabus);
                                }}
                              />
                              <div className="text-left font-sans flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-850 dark:text-zinc-100">{item.title}</span>
                                  <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-505 dark:text-zinc-400 px-1.5 py-0.5 rounded font-bold font-mono shrink-0">{item.maxPoints} pts</span>
                                </div>
                                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 italic">Syllabus: {item.syllabus || 'N/A'}</p>
                                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="custom-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="text-left space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Custom Homework Title *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-805 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                          value={customTitle}
                          onChange={e => setCustomTitle(e.target.value)}
                          placeholder="e.g. End of Month Quiz Practice Pack"
                        />
                      </div>

                      <div className="text-left space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Instructions / Prompt Details *</label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-805 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs leading-relaxed font-mono"
                          value={customDesc}
                          onChange={e => setCustomDesc(e.target.value)}
                          placeholder="Write synthetic homework equations, guidelines, material links..."
                        />
                      </div>

                      <div className="text-left space-y-1.5 w-1/2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Max Score Points</label>
                        <input
                          type="number"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-805 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                          value={customMaxPoints}
                          onChange={e => setCustomMaxPoints(Number(e.target.value))}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Logistics & Publishing */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4 text-xs font-sans">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 3: Define Logistics & Deploy
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-550 leading-relaxed">Due Date Deadline</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                      value={pipelineDueDate}
                      onChange={e => setPipelineDueDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end">
                    <button
                      type="submit"
                      disabled={!useCustomAssignment && !selectedBankTemplateId}
                      className={`w-full py-3 h-[38px] rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs ${
                        (!useCustomAssignment && !selectedBankTemplateId)
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/5 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-amber-950 border border-amber-500'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Deploy Pipeline Task &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Right-sided Live Statistics pipeline visualizer */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 dark:bg-[#111112]/40 border border-slate-205 dark:border-white/5 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-450 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Active Assignments Registry
                </h4>

                <div className="space-y-3 font-sans text-xs">
                  {assignments.length === 0 ? (
                    <p className="text-slate-400 py-6 text-center text-[11px]">No active live assignments assigned yet.</p>
                  ) : (
                    assignments.slice(0, 5).map(asg => {
                      const displayB = asg.batch === 'stb_001' ? 'Batch A' : asg.batch === 'stb_002' ? 'Batch B' : asg.batch === 'stb_003' ? 'Batch C' : asg.batch === 'stb_004' ? 'Batch D' : asg.batch;
                      return (
                        <div key={asg.id} className="p-3 border border-slate-200/50 dark:border-white/5 bg-white dark:bg-[#070708] rounded-xl text-left space-y-1.5 hover:border-amber-500/10 transition-colors">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-800 dark:text-zinc-250 truncate block max-w-[150px]">{asg.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/5 border border-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase scale-90 origin-right shrink-0">{displayB}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 leading-none">
                            <span>{asg.month || 'General'} | {asg.course.slice(0, 15)}...</span>
                            <span>Due: {asg.dueDate}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Course Pipeline Outline checklist panel */}
              <div className="bg-white dark:bg-[#111112] border border-slate-205 dark:border-white/5 p-5 rounded-2xl text-left space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-white/5 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Curriculum Progress Map
                </h3>
  
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  The syllabus milestones are populated. Ensure that each student clears their month challenges before transitioning status.
                </p>

                <div className="space-y-2 pt-2 text-[11px] font-sans">
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent">
                    <span className="font-medium text-slate-700 dark:text-neutral-300">IIT-JEE Month 1 (Newtonian Forces)</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent">
                    <span className="font-medium text-slate-700 dark:text-neutral-300">IIT-JEE Month 2 (Thermodynamics)</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent">
                    <span className="font-medium text-slate-700 dark:text-neutral-300">NEET Month 1 (Organic Chemistry)</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Bank Template Form Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0B0C10] border border-slate-205 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsBankModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingTemplate ? 'Edit Bank Template' : 'Add Template to Assignment Bank'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
                  Save reusable curriculum benchmarks mapped dynamically to target course stages.
                </p>
              </div>
            </div>

            {validationError && (
              <div className="mb-4 p-2.5 bg-rose-550/10 border border-rose-500/15 text-rose-500 text-xs rounded-xl font-medium text-left flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4 font-sans text-xs text-left">
              {/* Template Title */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Assignment Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                  value={templateTitle}
                  onChange={e => setTemplateTitle(e.target.value)}
                  placeholder="e.g. Chemical Nomenclature Quiz Pack"
                />
              </div>

              {/* Template Description */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-455 dark:text-gray-400">Detailed Instructions / Description *</label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  placeholder="Insert instructions, material indexes..."
                />
              </div>

              {/* Course & Batch Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Mapped Course *</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateCourse}
                    onChange={e => setTemplateCourse(e.target.value)}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Target Batch *</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateBatch}
                    onChange={e => setTemplateBatch(e.target.value)}
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                    <option value="stb_001">stb_001 (Batch A)</option>
                    <option value="stb_002">stb_002 (Batch B)</option>
                    <option value="stb_003">stb_003 (Batch C)</option>
                    <option value="stb_004">stb_004 (Batch D)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Course Month */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Course Month</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateMonth}
                    onChange={e => setTemplateMonth(e.target.value)}
                  >
                    <option value="Month 1">Month 1</option>
                    <option value="Month 2">Month 2</option>
                    <option value="Month 3">Month 3</option>
                    <option value="Month 4">Month 4</option>
                    <option value="Month 5">Month 5</option>
                    <option value="Month 6">Month 6</option>
                  </select>
                </div>

                {/* Syllabus Topic Details */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Syllabus Topic</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 placeholder-slate-400"
                    value={templateSyllabus}
                    onChange={e => setTemplateSyllabus(e.target.value)}
                    placeholder="e.g. Unit 3"
                  />
                </div>

                {/* Score scale points */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Max Score Points</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                    value={templateMaxPoints}
                    onChange={e => setTemplateMaxPoints(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-zinc-350 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  {editingTemplate ? 'Update Master Template' : 'Add to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
