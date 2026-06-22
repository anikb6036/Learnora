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
  // Tab control: 'bank' | 'pipeline' | 'template-form'
  const [pipelineTab, setPipelineTab] = useState<'bank' | 'pipeline' | 'template-form'>('bank');

  // Bank search/filters
  const [bankSearch, setBankSearch] = useState('');
  const [bankCourseFilter, setBankCourseFilter] = useState('all');
  const [bankBatchFilter, setBankBatchFilter] = useState('all');

  // Multi-step Pipeline (Deploy assignment) states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Month 1');
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [selectedBankTemplateId, setSelectedBankTemplateId] = useState('');
  const [pipelineDueDate, setPipelineDueDate] = useState('');
  const [customMaxPoints, setCustomMaxPoints] = useState(100);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [useCustomAssignment, setUseCustomAssignment] = useState(false);
  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Template states
  const [templateQuestionType, setTemplateQuestionType] = useState<'dsa' | 'instruction'>('instruction');
  const [templateDsaQuestion, setTemplateDsaQuestion] = useState('');
  const [templateDsaConstraints, setTemplateDsaConstraints] = useState('');
  const [templateDsaTestCases, setTemplateDsaTestCases] = useState('');
  const [templateDsaTemplateCode, setTemplateDsaTemplateCode] = useState('');

  // Custom states
  const [customQuestionType, setCustomQuestionType] = useState<'dsa' | 'instruction'>('instruction');
  const [customDsaQuestion, setCustomDsaQuestion] = useState('');
  const [customDsaConstraints, setCustomDsaConstraints] = useState('');
  const [customDsaTestCases, setCustomDsaTestCases] = useState('');
  const [customDsaTemplateCode, setCustomDsaTemplateCode] = useState('');

  // Add/Edit Bank Template modal states
  const [editingTemplate, setEditingTemplate] = useState<AssignmentBankItem | null>(null);
  
  // Template Form Fields
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCourse, setTemplateCourse] = useState('');
  const [templateBatch, setTemplateBatch] = useState('');
  const [templateMonth, setTemplateMonth] = useState('Month 1');
  const [templateWeek, setTemplateWeek] = useState('Week 1');
  const [templateDay, setTemplateDay] = useState('Day 1');
  const [templateSyllabus, setTemplateSyllabus] = useState('');
  const [templateMaxPoints, setTemplateMaxPoints] = useState(100);
  const [validationError, setValidationError] = useState('');

  const getBatchDisplayName = (batchVal: string) => {
    if (!batchVal) return '';
    const valLower = batchVal.toLowerCase();
    if (valLower === 'stb_001' || valLower === 'batch a') return 'Batch A (stb_001)';
    if (valLower === 'stb_002' || valLower === 'batch b') return 'Batch B (stb_002)';
    if (valLower === 'stb_003' || valLower === 'batch c') return 'Batch C (stb_003)';
    if (valLower === 'stb_004' || valLower === 'batch d') return 'Batch D (stb_004)';
    
    const matchObj = batches.find(b => b.id.toLowerCase() === valLower || b.name.toLowerCase() === valLower);
    if (matchObj) {
      if (matchObj.name.toLowerCase() !== valLower) {
        return `${matchObj.name} (${batchVal})`;
      }
      return matchObj.name;
    }
    return batchVal;
  };

  const availableBatches = React.useMemo(() => {
    const list: string[] = [];
    if (selectedCourse) {
      const matchingCourses = courses.filter(c => c.name.toLowerCase() === selectedCourse.toLowerCase());
      matchingCourses.forEach(c => {
        if (c.batchNumber) {
          list.push(c.batchNumber);
        }
      });
    }
    
    if (list.length === 0) {
      batches.forEach(b => {
        if (!b.status || b.status === "ongoing") {
          list.push(b.name);
        }
      });
    }
    
    const uniqueList = Array.from(new Set(list));
    return ['All', ...uniqueList];
  }, [selectedCourse, courses, batches]);

  React.useEffect(() => {
    if (availableBatches.length > 0) {
      if (!selectedBatch || !availableBatches.includes(selectedBatch)) {
        if (availableBatches.includes('All')) {
          setSelectedBatch('All');
        } else {
          setSelectedBatch(availableBatches[0]);
        }
      }
    } else {
      setSelectedBatch('All');
    }
  }, [availableBatches, selectedBatch]);

  // Open modal for editing or adding template
  const openBankModal = (template: AssignmentBankItem | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateTitle(template.title);
      setTemplateDesc(template.description);
      setTemplateCourse(template.course);
      setTemplateBatch(template.batch);
      setTemplateMonth(template.month || 'Month 1');
      setTemplateWeek(template.week || 'Week 1');
      setTemplateDay(template.day || 'Day 1');
      setTemplateSyllabus(template.syllabus || '');
      setTemplateMaxPoints(template.maxPoints);
      setTemplateQuestionType(template.questionType || 'instruction');
      setTemplateDsaQuestion(template.dsaQuestion || '');
      setTemplateDsaConstraints(template.dsaConstraints || '');
      setTemplateDsaTestCases(template.dsaTestCases || '');
      setTemplateDsaTemplateCode(template.dsaTemplateCode || '');
    } else {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDesc('');
      const defaultCourse = courses[0]?.name || '';
      const matchCourseObj = courses.find(c => c.name === defaultCourse);
      const defaultBatch = matchCourseObj?.batchNumber || batches[0]?.name || 'stb_001';
      setTemplateCourse(defaultCourse);
      setTemplateBatch(defaultBatch);
      setTemplateMonth('Month 1');
      setTemplateWeek('Week 1');
      setTemplateDay('Day 1');
      setTemplateSyllabus('');
      setTemplateMaxPoints(100);
      setTemplateQuestionType('instruction');
      setTemplateDsaQuestion('');
      setTemplateDsaConstraints('');
      setTemplateDsaTestCases('');
      setTemplateDsaTemplateCode('');
    }
    setValidationError('');
    setPipelineTab('template-form');
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
        week: templateWeek,
        day: templateDay,
        syllabus: templateSyllabus,
        maxPoints: templateMaxPoints,
        questionType: templateQuestionType,
        dsaQuestion: templateQuestionType === 'dsa' ? templateDsaQuestion : undefined,
        dsaConstraints: templateQuestionType === 'dsa' ? templateDsaConstraints : undefined,
        dsaTestCases: templateQuestionType === 'dsa' ? templateDsaTestCases : undefined,
        dsaTemplateCode: templateQuestionType === 'dsa' ? templateDsaTemplateCode : undefined
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
        week: templateWeek,
        day: templateDay,
        syllabus: templateSyllabus,
        maxPoints: templateMaxPoints,
        createdDate: new Date().toISOString().split('T')[0],
        questionType: templateQuestionType,
        dsaQuestion: templateQuestionType === 'dsa' ? templateDsaQuestion : undefined,
        dsaConstraints: templateQuestionType === 'dsa' ? templateDsaConstraints : undefined,
        dsaTestCases: templateQuestionType === 'dsa' ? templateDsaTestCases : undefined,
        dsaTemplateCode: templateQuestionType === 'dsa' ? templateDsaTemplateCode : undefined
      };
      setAssignmentBank(prev => [newItem, ...prev]);
    }
    setPipelineTab('bank');
  };

  const handleDeleteTemplate = (id: string) => {
    setDeletingTemplateId(id);
  };

  // Deploy assignment pipeline publisher
  const handleDeployPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert('Please select target Course.');
      return;
    }

    const deployBatch = selectedBatch || 'All';

    let finalTitle = '';
    let finalDesc = '';
    let finalPoints = 100;
    let finalType: 'dsa' | 'instruction' = 'instruction';
    let finalDsaQuestion = '';
    let finalDsaConstraints = '';
    let finalDsaTestCases = '';
    let finalDsaTemplateCode = '';

    if (useCustomAssignment) {
      if (!customTitle.trim() || !customDesc.trim()) {
        alert('Please fill out the custom title and description.');
        return;
      }
      finalTitle = customTitle;
      finalDesc = customDesc;
      finalPoints = customMaxPoints;
      finalType = customQuestionType;
      finalDsaQuestion = customDsaQuestion;
      finalDsaConstraints = customDsaConstraints;
      finalDsaTestCases = customDsaTestCases;
      finalDsaTemplateCode = customDsaTemplateCode;
    } else {
      const template = assignmentBank.find(t => t.id === selectedBankTemplateId);
      if (!template) {
        alert('Please select an assignment template from the bank.');
        return;
      }
      finalTitle = template.title;
      finalDesc = template.description;
      finalPoints = template.maxPoints;
      finalType = template.questionType || 'instruction';
      finalDsaQuestion = template.dsaQuestion || '';
      finalDsaConstraints = template.dsaConstraints || '';
      finalDsaTestCases = template.dsaTestCases || '';
      finalDsaTemplateCode = template.dsaTemplateCode || '';
    }

    const newAssignmentId = `asg-${Date.now()}`;
    const newAsg: StudentAssignment = {
      id: newAssignmentId,
      title: finalTitle,
      description: finalDesc,
      course: selectedCourse,
      batch: deployBatch,
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      dueDate: pipelineDueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      maxPoints: finalPoints,
      status: 'published',
      createdDate: new Date().toISOString().split('T')[0],
      submissions: [],
      month: selectedMonth,
      week: selectedWeek,
      day: selectedDay,
      syllabus: selectedSyllabus,
      questionType: finalType,
      dsaQuestion: finalType === 'dsa' ? finalDsaQuestion : undefined,
      dsaConstraints: finalType === 'dsa' ? finalDsaConstraints : undefined,
      dsaTestCases: finalType === 'dsa' ? finalDsaTestCases : undefined,
      dsaTemplateCode: finalType === 'dsa' ? finalDsaTemplateCode : undefined
    };

    setAssignments(prev => [newAsg, ...prev]);

    // Send notifications to enrolled students
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (deployBatch === 'All' || !u.batch || u.batch.toLowerCase() === deployBatch.toLowerCase() || (deployBatch === 'stb_001' && u.batch.toLowerCase() === 'batch a') || (deployBatch === 'stb_002' && u.batch.toLowerCase() === 'batch b') || (deployBatch === 'stb_003' && u.batch.toLowerCase() === 'batch c') || (deployBatch === 'stb_004' && u.batch.toLowerCase() === 'batch d') || (deployBatch.toLowerCase() === 'batch a' && u.batch.toLowerCase() === 'stb_001') || (deployBatch.toLowerCase() === 'batch b' && u.batch.toLowerCase() === 'stb_002') || (deployBatch.toLowerCase() === 'batch c' && u.batch.toLowerCase() === 'stb_003') || (deployBatch.toLowerCase() === 'batch d' && u.batch.toLowerCase() === 'stb_004')) &&
      (selectedCourse === 'All' || u.course?.toLowerCase() === selectedCourse.toLowerCase())
    );

    targetStudents.forEach(st => {
      const notif: AppNotification = {
        id: `notif-asg-pipeline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `📄 Course Homework: ${finalTitle}`,
        message: `New pipeline assignment issued for ${selectedMonth}, ${selectedWeek}, ${selectedDay} (${selectedSyllabus || 'General'}). Due: ${newAsg.dueDate}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
    });

    setPipelineSuccessMsg(`Successfully deployed assignment "${finalTitle}" to students of ${selectedCourse} (${deployBatch !== 'All' ? getBatchDisplayName(deployBatch) : 'All Batches'}) for ${selectedMonth}, ${selectedWeek}, ${selectedDay}!`);
    
    // Clear pipeline states
    setCustomTitle('');
    setCustomDesc('');
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 5000);
  };

  // Get matching templates for pipeline filtering
  const matchingTemplates = assignmentBank.filter(t => {
    const matchesCourse = !selectedCourse || t.course.toLowerCase() === selectedCourse.toLowerCase();
    const matchesMonth = !selectedMonth || t.month.toLowerCase() === selectedMonth.toLowerCase();
    const matchesWeek = !selectedWeek || !t.week || t.week.toLowerCase() === selectedWeek.toLowerCase();
    const matchesDay = !selectedDay || !t.day || t.day.toLowerCase() === selectedDay.toLowerCase();
    
    return matchesCourse && matchesMonth && matchesWeek && matchesDay;
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
                      className="p-5 bg-white dark:bg-[#111112] border border-slate-200/80 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-2xs group relative overflow-hidden"
                    >
                      {deletingTemplateId === item.id && (
                        <div className="absolute inset-0 bg-slate-900/95 dark:bg-[#0d0d0e]/98 flex flex-col justify-center items-center p-4 z-10 text-center animate-fadeIn">
                          <Trash2 className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
                          <p className="text-xs font-bold text-white mb-1">Delete this template?</p>
                          <p className="text-[10px] text-slate-400 mb-4 max-w-[220px] leading-relaxed">
                            This will permanently remove "{item.title}" from the templates pool.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDeletingTemplateId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignmentBank(prev => prev.filter(t => t.id !== item.id));
                                setDeletingTemplateId(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        </div>
                      )}

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
                              {item.week && (
                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded">
                                  {item.week}
                                </span>
                              )}
                              {item.day && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold rounded">
                                  {item.day}
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

              <div className="space-y-4">
                {/* Visual progression bar */}
                <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-bold text-slate-500 bg-slate-50 dark:bg-white/5 px-3 py-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                  <span className={selectedCourse ? "text-amber-500" : ""}>{selectedCourse || 'Select Course'}</span>
                  <span className="text-slate-305 dark:text-gray-600 font-medium">➔</span>
                  <span className="text-purple-500">{selectedBatch === 'All' ? 'All Batches' : getBatchDisplayName(selectedBatch)}</span>
                  <span className="text-slate-305 dark:text-gray-600 font-medium">➔</span>
                  <span className="text-amber-500">{selectedMonth}</span>
                  <span className="text-slate-305 dark:text-gray-600 font-medium">➔</span>
                  <span className="text-amber-500">{selectedWeek}</span>
                  <span className="text-slate-305 dark:text-gray-600 font-medium">➔</span>
                  <span className="text-amber-500">{selectedDay}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs font-sans">
                  {/* Course Selection */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">1. Course *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-202 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs"
                      value={selectedCourse}
                      onChange={e => {
                        setSelectedCourse(e.target.value);
                      }}
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Target Batch Selection */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">2. Batch *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs"
                      value={selectedBatch}
                      onChange={e => setSelectedBatch(e.target.value)}
                    >
                      {availableBatches.map(b => (
                        <option key={b} value={b}>{getBatchDisplayName(b) || b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Course Month Selection */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">3. Month *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
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

                  {/* Course Week Selection */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">4. Week *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                      value={selectedWeek}
                      onChange={e => setSelectedWeek(e.target.value)}
                    >
                      <option value="Week 1">Week 1</option>
                      <option value="Week 2">Week 2</option>
                      <option value="Week 3">Week 3</option>
                      <option value="Week 4">Week 4</option>
                      <option value="Week 5">Week 5</option>
                    </select>
                  </div>

                  {/* Course Day Selection */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">5. Day *</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-203 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 text-xs"
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                    >
                      <option value="Day 1">Day 1</option>
                      <option value="Day 2">Day 2</option>
                      <option value="Day 3">Day 3</option>
                      <option value="Day 4">Day 4</option>
                      <option value="Day 5">Day 5</option>
                      <option value="Day 6">Day 6</option>
                      <option value="Day 7">Day 7</option>
                    </select>
                  </div>
                </div>

                {/* Target Syllabus Label */}
                <div className="space-y-1.5 text-xs font-sans">
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
                          No bank templates match the criteria: Course: <b className="font-semibold">{selectedCourse || 'None'}</b>, {selectedMonth}, {selectedWeek}, {selectedDay}. 
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

                      {/* Custom Question Type Selector */}
                      <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-405 dark:text-gray-400">Custom Evaluation Type</label>
                          <div className="flex items-center gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                              <input
                                type="radio"
                                checked={customQuestionType === 'instruction'}
                                onChange={() => setCustomQuestionType('instruction')}
                                className="text-amber-550 border-slate-300 dark:border-white/10 focus:ring-amber-550"
                              />
                              <span>Instruction/Theory Type</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                              <input
                                type="radio"
                                checked={customQuestionType === 'dsa'}
                                onChange={() => setCustomQuestionType('dsa')}
                                className="text-amber-550 border-slate-300 dark:border-white/10 focus:ring-amber-550"
                              />
                              <span className="flex items-center gap-1">
                                DSA Coding Challenge
                              </span>
                            </label>
                          </div>
                        </div>

                        {customQuestionType === 'dsa' && (
                          <div className="space-y-4 pt-2 border-t border-slate-150 dark:border-white/5">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">DSA Problem description (Markdown supported) *</label>
                              <textarea
                                rows={3}
                                required={customQuestionType === 'dsa'}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                                value={customDsaQuestion}
                                onChange={e => setCustomDsaQuestion(e.target.value)}
                                placeholder="e.g. Write a function returning the sum of elements..."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Input/Output Constraints</label>
                                <textarea
                                  rows={2}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                                  value={customDsaConstraints}
                                  onChange={e => setCustomDsaConstraints(e.target.value)}
                                  placeholder="e.g. 1 <= nums.length <= 10^5"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Sample Test Cases</label>
                                <textarea
                                  rows={2}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                                  value={customDsaTestCases}
                                  onChange={e => setCustomDsaTestCases(e.target.value)}
                                  placeholder="nums = [1,2,3], target = 4 -> [0,2]"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Starter Template Code</label>
                              <textarea
                                rows={4}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                                value={customDsaTemplateCode}
                                onChange={e => setCustomDsaTemplateCode(e.target.value)}
                                placeholder="function solve(nums) {\n  \n}"
                              />
                            </div>
                          </div>
                        )}
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
                          <div className="flex flex-col text-[10px] text-slate-400 gap-1 leading-normal">
                            <div>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">{asg.month || 'Month 1'}</span>
                              {asg.week && <span className="text-slate-300 dark:text-gray-700 mx-1">/</span>}
                              <span className="text-purple-600 dark:text-purple-400 font-medium">{asg.week}</span>
                              {asg.day && <span className="text-slate-300 dark:text-gray-700 mx-1">/</span>}
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{asg.day}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-slate-400 bg-slate-50 dark:bg-white/5 p-1 rounded">
                              <span className="truncate max-w-[120px] font-mono">{asg.course}</span>
                              <span className="font-medium">Due: {asg.dueDate}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {pipelineTab === 'template-form' && (
          <motion.div
            key="template-form-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-[#070708] border border-slate-205 dark:border-white/10 rounded-2xl p-6 shadow-xs relative max-w-3xl mx-auto">
              <button
                onClick={() => setPipelineTab('bank')}
                className="absolute top-6 right-6 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingTemplate ? 'Edit Bank Template' : 'Add Template to Assignment Bank'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Save reusable curriculum benchmarks mapped dynamically to target course stages.
                  </p>
                </div>
              </div>

              {validationError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-550/10 border border-rose-200 dark:border-rose-500/15 text-rose-600 dark:text-rose-500 text-xs rounded-xl font-medium text-left flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTemplate} className="space-y-5 font-sans text-xs text-left">
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

              {/* Question Type Selection */}
              <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Evaluation Type</label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        checked={templateQuestionType === 'instruction'}
                        onChange={() => setTemplateQuestionType('instruction')}
                        className="text-amber-550 border-slate-300 dark:border-white/10 focus:ring-amber-550"
                      />
                      <span>Instruction/Theory Type</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                      <input
                        type="radio"
                        checked={templateQuestionType === 'dsa'}
                        onChange={() => setTemplateQuestionType('dsa')}
                        className="text-amber-550 border-slate-300 dark:border-white/10 focus:ring-amber-550"
                      />
                      <span className="flex items-center gap-1">
                        DSA Coding Challenge
                      </span>
                    </label>
                  </div>
                </div>

                {templateQuestionType === 'dsa' && (
                  <div className="space-y-4 pt-2 border-t border-slate-150 dark:border-white/5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">DSA Problem description (Markdown supported) *</label>
                      <textarea
                        rows={3}
                        required={templateQuestionType === 'dsa'}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                        value={templateDsaQuestion}
                        onChange={e => setTemplateDsaQuestion(e.target.value)}
                        placeholder="e.g. Write a function returning the sum of elements..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Input/Output Constraints</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                          value={templateDsaConstraints}
                          onChange={e => setTemplateDsaConstraints(e.target.value)}
                          placeholder="e.g. 1 <= nums.length <= 10^5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Sample Test Cases</label>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                          value={templateDsaTestCases}
                          onChange={e => setTemplateDsaTestCases(e.target.value)}
                          placeholder="nums = [1,2,3], target = 4 -> [0,2]\n..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Starter Template Code</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                        value={templateDsaTemplateCode}
                        onChange={e => setTemplateDsaTemplateCode(e.target.value)}
                        placeholder="e.g. function solve(nums) {\n  \n}"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Course & Batch Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Mapped Course *</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateCourse}
                    onChange={e => {
                      const selectedCourseName = e.target.value;
                      setTemplateCourse(selectedCourseName);
                      
                      const matchCourseObj = courses.find(c => c.name === selectedCourseName);
                      if (matchCourseObj?.batchNumber) {
                        setTemplateBatch(matchCourseObj.batchNumber);
                      }
                    }}
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
                    {(() => {
                      const matchCourseObj = courses.find(c => c.name === templateCourse);
                      const batchNum = (matchCourseObj?.batchNumber || '').toLowerCase();

                      // Collect all potential batch options:
                      // 1. From database `batches`
                      // 2. Custom hardcoded fallbacks
                      const allBatchOptions = [
                        ...batches.map(b => ({ value: b.name, label: b.name, id: b.id })),
                        ...batches.map(b => ({ value: b.id, label: b.name, id: b.id })),
                        { value: 'stb_001', label: 'stb_001 (Batch A)', id: 'stb_001' },
                        { value: 'stb_002', label: 'stb_002 (Batch B)', id: 'stb_002' },
                        { value: 'stb_003', label: 'stb_003 (Batch C)', id: 'stb_003' },
                        { value: 'stb_004', label: 'stb_004 (Batch D)', id: 'stb_004' },
                        { value: 'Batch A', label: 'Batch A', id: 'stb_001' },
                        { value: 'Batch B', label: 'Batch B', id: 'stb_002' },
                        { value: 'Batch C', label: 'Batch C', id: 'stb_003' },
                        { value: 'Batch D', label: 'Batch D', id: 'stb_004' },
                      ];

                      // Filter options matching the selected course's batchNumber:
                      const filtered = allBatchOptions.filter(opt => {
                        if (!batchNum) return true; // if course doesn't specify a batch, allow all
                        
                        const valLower = opt.value.toLowerCase();
                        const idLower = opt.id.toLowerCase();
                        
                        // Exact matches
                        if (valLower === batchNum || idLower === batchNum) return true;

                        // Cross-mappings (Batch A <-> stb_001, etc.)
                        const relations: Record<string, string[]> = {
                          'stb_001': ['batch a', 'stb_001'],
                          'stb_002': ['batch b', 'stb_002'],
                          'stb_003': ['batch c', 'stb_003'],
                          'stb_004': ['batch d', 'stb_004'],
                          'batch a': ['batch a', 'stb_001'],
                          'batch b': ['batch b', 'stb_002'],
                          'batch c': ['batch c', 'stb_003'],
                          'batch d': ['batch d', 'stb_004'],
                        };

                        if (relations[batchNum]) {
                          return relations[batchNum].includes(valLower) || relations[batchNum].includes(idLower);
                        }

                        return false;
                      });

                      // Remove duplicate option values to keep dropdown clean
                      const uniqueOptions: typeof allBatchOptions = [];
                      const seen = new Set<string>();
                      for (const opt of filtered) {
                        if (!seen.has(opt.value)) {
                          seen.add(opt.value);
                          uniqueOptions.push(opt);
                        }
                      }

                      return uniqueOptions.map(opt => (
                        <option key={`${opt.value}-${opt.label}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Course Month */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Month Track</label>
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

                {/* Course Week */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Week Track</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateWeek}
                    onChange={e => setTemplateWeek(e.target.value)}
                  >
                    <option value="Week 1">Week 1</option>
                    <option value="Week 2">Week 2</option>
                    <option value="Week 3">Week 3</option>
                    <option value="Week 4">Week 4</option>
                    <option value="Week 5">Week 5</option>
                  </select>
                </div>

                {/* Course Day */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Day Track</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-205 dark:border-white/10 bg-transparent text-slate-880 dark:text-zinc-250 focus:outline-none focus:border-amber-500"
                    value={templateDay}
                    onChange={e => setTemplateDay(e.target.value)}
                  >
                    <option value="Day 1">Day 1</option>
                    <option value="Day 2">Day 2</option>
                    <option value="Day 3">Day 3</option>
                    <option value="Day 4">Day 4</option>
                    <option value="Day 5">Day 5</option>
                    <option value="Day 6">Day 6</option>
                    <option value="Day 7">Day 7</option>
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-450 dark:text-gray-400">Max Points</label>
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
                  onClick={() => setPipelineTab('bank')}
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
          </motion.div>
        )}
    </div>
  );
};
