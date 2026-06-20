import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
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
  Database,
  TrendingUp
} from 'lucide-react';
import { Course, StudentBatch, EvolutionBankItem, StudentEvolution, UserAccount, AppNotification } from '../types';

interface EvolutionPipelineProps {
  currentUser: UserAccount;
  courses: Course[];
  batches: StudentBatch[];
  evolutionBank: EvolutionBankItem[];
  setEvolutionBank: React.Dispatch<React.SetStateAction<EvolutionBankItem[]>>;
  studentEvolutions: StudentEvolution[];
  setStudentEvolutions: React.Dispatch<React.SetStateAction<StudentEvolution[]>>;
  users: UserAccount[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onSendEmail?: (to: string, subject: string, body: string, fromOverride?: string) => void;
}

export const EvolutionPipeline: React.FC<EvolutionPipelineProps> = ({
  currentUser,
  courses,
  batches,
  evolutionBank,
  setEvolutionBank,
  studentEvolutions,
  setStudentEvolutions,
  users,
  setNotifications,
  onSendEmail
}) => {
  // Tab control: 'bank' | 'pipeline' | 'template-form'
  const [pipelineTab, setPipelineTab] = useState<'bank' | 'pipeline' | 'template-form'>('bank');

  // Bank search/filters
  const [bankSearch, setBankSearch] = useState('');
  const [bankCourseFilter, setBankCourseFilter] = useState('all');

  // Multi-step Pipeline (Deploy evolution) states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedBankTemplateId, setSelectedBankTemplateId] = useState('');
  
  // Custom 4 Weeks Fields
  const [useCustomWeeks, setUseCustomWeeks] = useState(false);
  const [cWeek1Title, setCWeek1Title] = useState('Evolution 1 (Week 1)');
  const [cWeek1Desc, setCWeek1Desc] = useState('');
  const [cWeek2Title, setCWeek2Title] = useState('Evolution 2 (Week 2)');
  const [cWeek2Desc, setCWeek2Desc] = useState('');
  const [cWeek3Title, setCWeek3Title] = useState('Evolution 3 (Week 3)');
  const [cWeek3Desc, setCWeek3Desc] = useState('');
  const [cWeek4Title, setCWeek4Title] = useState('Evolution 4 (Week 4)');
  const [cWeek4Desc, setCWeek4Desc] = useState('');

  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Add/Edit Bank Template modal states
  const [editingTemplate, setEditingTemplate] = useState<EvolutionBankItem | null>(null);
  
  // Template Form Fields
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCourse, setTemplateCourse] = useState('');
  const [templateMonth, setTemplateMonth] = useState<number>(1);
  const [tWeek1Title, setTWeek1Title] = useState('Evolution 1 (Week 1)');
  const [tWeek1Desc, setTWeek1Desc] = useState('');
  const [tWeek2Title, setTWeek2Title] = useState('Evolution 2 (Week 2)');
  const [tWeek2Desc, setTWeek2Desc] = useState('');
  const [tWeek3Title, setTWeek3Title] = useState('Evolution 3 (Week 3)');
  const [tWeek3Desc, setTWeek3Desc] = useState('');
  const [tWeek4Title, setTWeek4Title] = useState('Evolution 4 (Week 4)');
  const [tWeek4Desc, setTWeek4Desc] = useState('');
  const [validationError, setValidationError] = useState('');

  // Open modal for editing or adding template
  const openBankModal = (template: EvolutionBankItem | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateTitle(template.title);
      setTemplateDesc(template.description);
      setTemplateCourse(template.course);
      setTemplateMonth(template.month);
      setTWeek1Title(template.week1Title);
      setTWeek1Desc(template.week1Desc);
      setTWeek2Title(template.week2Title);
      setTWeek2Desc(template.week2Desc);
      setTWeek3Title(template.week3Title);
      setTWeek3Desc(template.week3Desc);
      setTWeek4Title(template.week4Title);
      setTWeek4Desc(template.week4Desc);
    } else {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDesc('');
      const defaultCourse = courses[0]?.name || '';
      setTemplateCourse(defaultCourse);
      setTemplateMonth(1);
      setTWeek1Title('Evolution 1 (Week 1)');
      setTWeek1Desc('');
      setTWeek2Title('Evolution 2 (Week 2)');
      setTWeek2Desc('');
      setTWeek3Title('Evolution 3 (Week 3)');
      setTWeek3Desc('');
      setTWeek4Title('Evolution 4 (Week 4)');
      setTWeek4Desc('');
    }
    setValidationError('');
    setPipelineTab('template-form');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateDesc.trim() || !templateCourse) {
      setValidationError('Please fill out all required fields.');
      return;
    }

    if (editingTemplate) {
      // Edit
      setEvolutionBank(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        month: templateMonth,
        week1Title: tWeek1Title,
        week1Desc: tWeek1Desc,
        week2Title: tWeek2Title,
        week2Desc: tWeek2Desc,
        week3Title: tWeek3Title,
        week3Desc: tWeek3Desc,
        week4Title: tWeek4Title,
        week4Desc: tWeek4Desc
      } : t));
    } else {
      // Add
      const newItem: EvolutionBankItem = {
        id: `evo-bank-${Date.now()}`,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        month: templateMonth,
        week1Title: tWeek1Title,
        week1Desc: tWeek1Desc,
        week2Title: tWeek2Title,
        week2Desc: tWeek2Desc,
        week3Title: tWeek3Title,
        week3Desc: tWeek3Desc,
        week4Title: tWeek4Title,
        week4Desc: tWeek4Desc,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setEvolutionBank(prev => [newItem, ...prev]);
    }
    setPipelineTab('bank');
  };

  const handleDeleteTemplate = (id: string) => {
    setEvolutionBank(prev => prev.filter(t => t.id !== id));
    setDeletingTemplateId(null);
  };

  // Deploy evolution pipeline publisher
  const handleDeployPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch) {
      alert('Please select target Course and Batch.');
      return;
    }

    let finalWeeks = {
      w1T: 'Evolution 1 (Week 1)', w1D: 'Kinematics & Base theory',
      w2T: 'Evolution 2 (Week 2)', w2D: 'Applied Practical Problems',
      w3T: 'Evolution 3 (Week 3)', w3D: 'Analytical Problem Resolution',
      w4T: 'Evolution 4 (Week 4)', w4D: 'Integrated Examination'
    };

    let sourceTitle = 'Custom Monthly Evaluation Grid';

    if (useCustomWeeks) {
      finalWeeks = {
        w1T: cWeek1Title, w1D: cWeek1Desc || 'Week 1 Continuous Syllabus',
        w2T: cWeek2Title, w2D: cWeek2Desc || 'Week 2 Continuous Syllabus',
        w3T: cWeek3Title, w3D: cWeek3Desc || 'Week 3 Continuous Syllabus',
        w4T: cWeek4Title, w4D: cWeek4Desc || 'Week 4 Continuous Syllabus'
      };
    } else {
      const template = evolutionBank.find(t => t.id === selectedBankTemplateId);
      if (!template) {
        alert('Please select an evolution blueprint template from the bank.');
        return;
      }
      sourceTitle = template.title;
      finalWeeks = {
        w1T: template.week1Title, w1D: template.week1Desc,
        w2T: template.week2Title, w2D: template.week2Desc,
        w3T: template.week3Title, w3D: template.week3Desc,
        w4T: template.week4Title, w4D: template.week4Desc
      };
    }

    // Find enrolled students in the target Batch and Course
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (selectedBatch === 'All' || u.batch?.toLowerCase() === selectedBatch.toLowerCase() || (selectedBatch === 'stb_001' && u.batch?.toLowerCase() === 'batch a') || (selectedBatch === 'stb_002' && u.batch?.toLowerCase() === 'batch b')) &&
      (selectedCourse === 'All' || u.course?.toLowerCase() === selectedCourse.toLowerCase())
    );

    if (targetStudents.length === 0) {
      alert(`There are currently no active students matched to ${selectedCourse} inside batch "${selectedBatch}". Check student records first.`);
      return;
    }

    // Upsert student evolution tracker entries
    setStudentEvolutions(prev => {
      const updatedList = [...prev];

      targetStudents.forEach(st => {
        const existingIdx = updatedList.findIndex(ev => ev.studentId === st.id && ev.month === selectedMonth && ev.course === selectedCourse);

        if (existingIdx > -1) {
          // Update existing with the newly deployed syllabus structures
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
            title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
            title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
            title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
            batch: selectedBatch,
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Insert fresh record
          updatedList.push({
            id: `evol-${Date.now()}-${st.id.substring(0, 4)}`,
            studentId: st.id,
            studentName: st.name,
            course: selectedCourse,
            batch: selectedBatch,
            month: selectedMonth,
            promoted: false,
            title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
            title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
            title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
            title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
            lastUpdated: new Date().toISOString()
          });
        }

        // Notify Student
        const notif: AppNotification = {
          id: `notif-evo-pipeline-${Date.now()}-${st.id.substring(0, 4)}`,
          title: `📈 Continuous Evolution Month ${selectedMonth} Initialized!`,
          message: `Your syllabus milestones for Study Month ${selectedMonth} have been deployed. View evaluation blocks.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'general',
          channel: 'system'
        };
        setNotifications(prevNotif => [notif, ...prevNotif]);

        // Send Email
        if (onSendEmail && st.email) {
          const emailSubject = `🎓 Continuous Evolution Milestones Deployed: Month ${selectedMonth}`;
          const emailBody = `Dear ${st.name},\n\nWe pleased to inform you that your authorized subject instructors have deployed the official Monthly Continuous Evolution syllabus guidelines for Study Month ${selectedMonth} under: ${selectedCourse}.\n\nHere are your upcoming academic checkpoints:\n\n- Week 1 Checkpoint: ${finalWeeks.w1T} (${finalWeeks.w1D})\n- Week 2 Checkpoint: ${finalWeeks.w2T} (${finalWeeks.w2D})\n- Week 3 Checkpoint: ${finalWeeks.w3T} (${finalWeeks.w3D})\n- Week 4 Checkpoint: ${finalWeeks.w4T} (${finalWeeks.w4D})\n\nGrade Criteria:\nOnce all four checkpoints are evaluated by your assigned professor, an overall aggregate average of 80% or greater will trigger immediate Automatic Level Promotion.\n\nKeep up the extraordinary efforts!\n\nBest regards,\nLearnora Academic Pipeline Office\nsupport@learnora.in`;
          onSendEmail(st.email, emailSubject, emailBody, 'academic-office@learnora.in');
        }
      });

      return updatedList;
    });

    setPipelineSuccessMsg(`Successfully deployed Month ${selectedMonth} Evolution Grid "${sourceTitle}" to ${targetStudents.length} active students in course "${selectedCourse}" [Batch: ${selectedBatch}]!`);
    
    // Clear field states
    if (useCustomWeeks) {
      setCWeek1Desc('');
      setCWeek2Desc('');
      setCWeek3Desc('');
      setCWeek4Desc('');
    }
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 6000);
  };

  // Filter templates matching current pipeline selections
  const matchingTemplates = evolutionBank.filter(t => {
    const matchesCourse = !selectedCourse || t.course.toLowerCase() === selectedCourse.toLowerCase();
    const matchesMonth = !selectedMonth || t.month === selectedMonth;
    return matchesCourse && matchesMonth;
  });

  // Filter bank view
  const filteredBank = evolutionBank.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn font-sans">
      {/* Premium Header Decoration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Monthly Evolution Pipeline & Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Build reusable curriculum continuous-evaluation blueprints, configure custom weekly checkpoints, and broadcast standard 4-week grade cards.
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-1 bg-slate-50 dark:bg-[#070708] border border-slate-205 dark:border-white/5 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setPipelineTab('bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'bank'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Blueprint Bank
          </button>
          <button
            type="button"
            onClick={() => {
              setPipelineTab('pipeline');
              if (courses.length > 0 && !selectedCourse) {
                setSelectedCourse(courses[0].name);
                setSelectedBatch(courses[0].batchNumber || 'Batch A');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Deploy Evolution
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {pipelineTab === 'bank' && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-zinc-900/10 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blueprints..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <select
                  value={bankCourseFilter}
                  onChange={(e) => setBankCourseFilter(e.target.value)}
                  className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-zinc-300"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => openBankModal(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Blueprint
                </button>
              </div>
            </div>

            {/* Blueprints Display list */}
            {filteredBank.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                <Database className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No Evolution Blueprints Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Create syllabus blueprints detailing month-by-month and week-by-week benchmarks for active class evaluations.
                </p>
                <button
                  type="button"
                  onClick={() => openBankModal(null)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Create First Blueprint
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBank.map(tmp => (
                  <div 
                    key={tmp.id} 
                    className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xs relative hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md uppercase tracking-wider">
                            Month {tmp.month}
                          </span>
                          <span className="text-[10px] font-mono text-slate-450 dark:text-zinc-500 ml-2">
                            Created: {tmp.createdDate}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openBankModal(tmp)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                            title="Edit structural template"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTemplateId(tmp.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{tmp.title}</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed border-b border-dashed border-slate-100 dark:border-white/5 pb-4">
                        {tmp.description}
                      </p>

                      {/* 4 continuous weeks mini timeline breakdown */}
                      <div className="mt-4 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Weekly Milestones</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week1Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week1Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week2Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week2Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week3Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week3Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week4Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week4Desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[11px] text-slate-500">
                      <span className="font-medium truncate max-w-xs block">Course: {tmp.course}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(tmp.course);
                          setSelectedMonth(tmp.month);
                          setSelectedBankTemplateId(tmp.id);
                          setUseCustomWeeks(false);
                          setPipelineTab('pipeline');
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {pipelineTab === 'pipeline' && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" />
                  Deploy Continuous Evolution Track
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  Deploy a Month's evaluation structure. This will instantly push individual weekly syllabus parameters onto the grading profiles of every student currently in the targeted course and batch.
                </p>
              </div>

              {pipelineSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{pipelineSuccessMsg}</p>
                </div>
              )}

              <form onSubmit={handleDeployPipeline} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Select Course */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedBankTemplateId('');
                      }}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Batch */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Batch</label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">-- Choose Batch --</option>
                      <option value="All">All Batches</option>
                      <option value="Batch A">Batch A</option>
                      <option value="Batch B">Batch B</option>
                      <option value="Batch C">Batch C</option>
                      <option value="Batch D">Batch D</option>
                    </select>
                  </div>

                  {/* Active Month */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value));
                        setSelectedBankTemplateId('');
                      }}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                    >
                      <option value={1}>Month 1</option>
                      <option value={2}>Month 2</option>
                      <option value={3}>Month 3</option>
                      <option value={4}>Month 4</option>
                      <option value={5}>Month 5</option>
                      <option value={6}>Month 6</option>
                    </select>
                  </div>
                </div>

                {/* Switch between pre-existing templates or manually typing */}
                <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Syllabus Template Source</p>
                    <div className="flex bg-slate-200/50 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setUseCustomWeeks(false)}
                        className={`px-3 py-1.5 rounded-md transition ${!useCustomWeeks ? 'bg-white dark:bg-[#1a1b1e] text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                      >
                        From Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomWeeks(true)}
                        className={`px-3 py-1.5 rounded-md transition ${useCustomWeeks ? 'bg-white dark:bg-[#1a1b1e] text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                      >
                        Custom Setup
                      </button>
                    </div>
                  </div>

                  {!useCustomWeeks ? (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Select Template Blueprint</label>
                      <select
                        value={selectedBankTemplateId}
                        onChange={(e) => setSelectedBankTemplateId(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      >
                        <option value="">-- Click to choose template blueprint --</option>
                        {matchingTemplates.map(tmp => (
                          <option key={tmp.id} value={tmp.id}>
                            {tmp.title} (Month {tmp.month})
                          </option>
                        ))}
                      </select>
                      
                      {matchingTemplates.length === 0 && selectedCourse && (
                        <p className="text-[10px] text-amber-500 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No bank blueprints match your chosen course and study month. Try "Custom Setup" or create a new Blueprint.
                        </p>
                      )}

                      {/* Template Preview Panel */}
                      {selectedBankTemplateId && (() => {
                        const activeTmp = evolutionBank.find(t => t.id === selectedBankTemplateId);
                        if (!activeTmp) return null;
                        return (
                          <div className="p-3 bg-white dark:bg-black border border-slate-200 dark:border-white/5 rounded-xl mt-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syllabus Overview</p>
                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{activeTmp.title}</h4>
                            <p className="text-[10px] text-slate-550 leading-relaxed italic">{activeTmp.description}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week1Title}:</span> {activeTmp.week1Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week2Title}:</span> {activeTmp.week2Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week3Title}:</span> {activeTmp.week3Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week4Title}:</span> {activeTmp.week4Desc}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Configure Custom Weekly Syllabus Targets</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5">
                          <input
                            type="text"
                            value={cWeek1Title}
                            onChange={(e) => setCWeek1Title(e.target.value)}
                            className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                            placeholder="Week 1 Title"
                          />
                          <textarea
                            value={cWeek1Desc}
                            onChange={(e) => setCWeek1Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border-0 text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none p-1.5 rounded"
                          />
                        </div>

                        <div className="space-y-1.5 p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5">
                          <input
                            type="text"
                            value={cWeek2Title}
                            onChange={(e) => setCWeek2Title(e.target.value)}
                            className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                            placeholder="Week 2 Title"
                          />
                          <textarea
                            value={cWeek2Desc}
                            onChange={(e) => setCWeek2Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border-0 text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none p-1.5 rounded"
                          />
                        </div>

                        <div className="space-y-1.5 p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5">
                          <input
                            type="text"
                            value={cWeek3Title}
                            onChange={(e) => setCWeek3Title(e.target.value)}
                            className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                            placeholder="Week 3 Title"
                          />
                          <textarea
                            value={cWeek3Desc}
                            onChange={(e) => setCWeek3Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border-0 text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none p-1.5 rounded"
                          />
                        </div>

                        <div className="space-y-1.5 p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5">
                          <input
                            type="text"
                            value={cWeek4Title}
                            onChange={(e) => setCWeek4Title(e.target.value)}
                            className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                            placeholder="Week 4 Title"
                          />
                          <textarea
                            value={cWeek4Desc}
                            onChange={(e) => setCWeek4Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border-0 text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none p-1.5 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Deploy Monthly Evolution Pipeline
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {pipelineTab === 'template-form' && (
          <motion.div
            key="template-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingTemplate ? 'Edit Blueprint Blueprint' : 'Build Brand New Evolution Blueprint'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPipelineTab('bank')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg text-slate-550 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTemplate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blueprint Title */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Blueprint Title *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      placeholder="e.g. Month 1 Advanced Kinematics & Applied Motion Vector"
                      required
                    />
                  </div>

                  {/* Course mapping */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Map Course *</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateCourse}
                      onChange={(e) => setTemplateCourse(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Target Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month mapping */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Map Month *</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateMonth}
                      onChange={(e) => setTemplateMonth(parseInt(e.target.value))}
                      required
                    >
                      <option value={1}>Month 1</option>
                      <option value={2}>Month 2</option>
                      <option value={3}>Month 3</option>
                      <option value={4}>Month 4</option>
                      <option value={5}>Month 5</option>
                      <option value={6}>Month 6</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Description / Guidelines *</label>
                    <textarea
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-zinc-200"
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                      rows={3}
                      placeholder="Detail the active monthly review, learning expectations, and focus goals."
                      required
                    />
                  </div>
                </div>

                {/* 4 continuous weeks structure builders */}
                <div className="pt-4 border-t border-slate-150 dark:border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Configure Week-by-Week syllabus Checkpoint Guidelines
                  </h4>

                  <div className="space-y-4">
                    {/* Week 1 */}
                    <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 1 Title</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek1Title}
                          onChange={(e) => setTWeek1Title(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 1 Checkpoint Syllabus</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek1Desc}
                          onChange={(e) => setTWeek1Desc(e.target.value)}
                          placeholder="e.g. Vector operations, speed curves and relative drift offsets."
                        />
                      </div>
                    </div>

                    {/* Week 2 */}
                    <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 2 Title</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek2Title}
                          onChange={(e) => setTWeek2Title(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 2 Checkpoint Syllabus</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek2Desc}
                          onChange={(e) => setTWeek2Desc(e.target.value)}
                          placeholder="e.g. Free-body dynamics diagram, pulleys and surface Normal."
                        />
                      </div>
                    </div>

                    {/* Week 3 */}
                    <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 3 Title</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek3Title}
                          onChange={(e) => setTWeek3Title(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 3 Checkpoint Syllabus</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek3Desc}
                          onChange={(e) => setTWeek3Desc(e.target.value)}
                          placeholder="e.g. Kinetic and static friction, threshold angle and normal slippage."
                        />
                      </div>
                    </div>

                    {/* Week 4 */}
                    <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 4 Title</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek4Title}
                          onChange={(e) => setTWeek4Title(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Week 4 Checkpoint Syllabus</label>
                        <input
                          type="text"
                          className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                          value={tWeek4Desc}
                          onChange={(e) => setTWeek4Desc(e.target.value)}
                          placeholder="e.g. Energy conservation calculations, heat dissipation and circular inertia."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-150 dark:border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPipelineTab('bank')}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1a1b1e] dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Blueprint Template
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation of deletion popup */}
      {deletingTemplateId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Evolution Blueprint?</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you absolutely sure you want to remove this monthly evolution blueprint template from the bank? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplateId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Keep Template
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(deletingTemplateId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
