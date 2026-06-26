import React, { useState, useMemo, useEffect } from 'react';
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
  Database,
  TrendingUp,
  Sparkles,
  Award,
  Check,
  Briefcase
} from 'lucide-react';
import { 
  Course, 
  StudentBatch, 
  AssignmentBankItem, 
  StudentAssignment, 
  EvolutionBankItem, 
  StudentEvolution, 
  UserAccount, 
  AppNotification 
} from '../types';
import { EASY_PROBLEMS, MEDIUM_PROBLEMS, HARD_PROBLEMS, DSAProblem } from './DsaProblemsPool';

interface AssignmentPipelineProps {
  currentUser: UserAccount;
  courses: Course[];
  batches: StudentBatch[];
  assignmentBank: AssignmentBankItem[];
  setAssignmentBank: React.Dispatch<React.SetStateAction<AssignmentBankItem[]>>;
  assignments: StudentAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<StudentAssignment[]>>;
  evolutionBank: EvolutionBankItem[];
  setEvolutionBank: React.Dispatch<React.SetStateAction<EvolutionBankItem[]>>;
  studentEvolutions: StudentEvolution[];
  setStudentEvolutions: React.Dispatch<React.SetStateAction<StudentEvolution[]>>;
  users: UserAccount[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onSendEmail?: (to: string, subject: string, body: string, fromOverride?: string) => void;
}

export const AssignmentPipeline: React.FC<AssignmentPipelineProps> = ({
  currentUser,
  courses,
  batches,
  assignmentBank,
  setAssignmentBank,
  assignments,
  setAssignments,
  evolutionBank,
  setEvolutionBank,
  studentEvolutions,
  setStudentEvolutions,
  users,
  setNotifications,
  onSendEmail
}) => {
  // Master Track selection: 'assignment' | 'evolution'
  const [selectedTrack, setSelectedTrack] = useState<'assignment' | 'evolution'>('assignment');
  
  // Tab control: 'bank' | 'pipeline' | 'template-form' | 'active-list'
  const [pipelineTab, setPipelineTab] = useState<'bank' | 'pipeline' | 'template-form' | 'active-list'>('bank');

  // Success message state
  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState('');

  // Delete prompt overlays
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deletingActiveId, setDeletingActiveId] = useState<string | null>(null);

  // Filter keys
  const [bankSearch, setBankSearch] = useState('');
  const [bankCourseFilter, setBankCourseFilter] = useState('all');
  const [bankBatchFilter, setBankBatchFilter] = useState('all');

  // Shared Selector parameters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonthStr, setSelectedMonthStr] = useState('Month 1'); // Assignment
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(1);   // Evolution

  // Batch equivalent matcher
  const areBatchesEquivalent = (batchA: string | undefined, batchB: string | undefined): boolean => {
    if (!batchA || !batchB) return false;
    const a = batchA.toLowerCase().trim();
    const b = batchB.toLowerCase().trim();
    if (a === b) return true;
    
    const map: Record<string, string[]> = {
      'stb_001': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'stb_002': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'stb_003': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'stb_004': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
      'batch a': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'batch b': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'batch c': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'batch d': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
    };
    return !!(map[a] && map[a].includes(b));
  };

  const getBatchDisplayName = (batchVal: string) => {
    return batchVal || '';
  };

  // Safe ongoing batch retrieval for target courses
  const getBatchesForCourse = (courseName: string): string[] => {
    if (!courseName) return [];
    
    const activeBatchNames = new Set<string>();

    users.forEach(u => {
      if (u.role === 'student' && u.course && u.course.toLowerCase() === courseName.toLowerCase() && u.batch) {
        activeBatchNames.add(u.batch);
      }
    });

    courses.forEach(c => {
      if (c.name.toLowerCase() === courseName.toLowerCase() && c.status !== 'completed' && c.batchNumber) {
        activeBatchNames.add(c.batchNumber);
      }
    });

    if (activeBatchNames.size === 0) {
      const fallback = batches.filter(b => b.status !== 'completed' && b.id !== 'batch-3').map(b => b.name);
      if (fallback.length > 0) {
        fallback.forEach(f => activeBatchNames.add(f));
      } else {
        activeBatchNames.add("stb_001");
      }
    }

    return Array.from(activeBatchNames);
  };

  // Reset inner selection tabs when track is toggled, keeping current tab if in deploy workspace or template forms
  useEffect(() => {
    if (pipelineTab !== 'pipeline' && pipelineTab !== 'template-form') {
      setPipelineTab('bank');
    }
    setBankSearch('');
    setPipelineSuccessMsg('');
    setValidationError('');
  }, [selectedTrack]);

  // Pre-populate target parameters in deploy screen
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].name);
      const available = getBatchesForCourse(courses[0].name);
      if (available.length > 0) {
        setSelectedBatch(available[0]);
      }
    }
  }, [courses, selectedCourse]);

  // Adjust target batch selection when course changes
  const handleCourseChangeInDeploy = (courseName: string) => {
    setSelectedCourse(courseName);
    setSelectedBankTemplateId('');
    const available = getBatchesForCourse(courseName);
    if (available.length > 0) {
      setSelectedBatch(available[0]);
    } else {
      setSelectedBatch('All');
    }
  };

  // Real-time task/evaluation counts based on currently selected Deploy options
  const currentAssignedCount = useMemo(() => {
    if (!selectedCourse) return 0;
    return assignments.filter(asg => {
      const matchCourse = asg.course.toLowerCase() === selectedCourse.toLowerCase();
      const matchBatch = selectedBatch === 'All' || asg.batch === 'All' || asg.batch.toLowerCase() === selectedBatch.toLowerCase() || areBatchesEquivalent(asg.batch, selectedBatch);
      const matchMonth = asg.month === selectedMonthStr;
      return matchCourse && matchBatch && matchMonth;
    }).length;
  }, [assignments, selectedCourse, selectedBatch, selectedMonthStr]);

  const currentEvolutionCount = useMemo(() => {
    if (!selectedCourse) return 0;
    return studentEvolutions.filter(evo => {
      const matchCourse = evo.course.toLowerCase() === selectedCourse.toLowerCase();
      const matchBatch = selectedBatch === 'All' || evo.batch?.toLowerCase() === 'all' || evo.batch?.toLowerCase() === selectedBatch.toLowerCase() || areBatchesEquivalent(evo.batch || '', selectedBatch);
      const matchMonth = evo.month === selectedMonthNum;
      return matchCourse && matchBatch && matchMonth;
    }).length;
  }, [studentEvolutions, selectedCourse, selectedBatch, selectedMonthNum]);


  // ==========================================
  // SUB-TRACK 1: ASSIGNMENTS PIPELINE LOGIC
  // ==========================================

  // Deploy assignment state variables
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [selectedBankTemplateId, setSelectedBankTemplateId] = useState('');
  const [pipelineDueDate, setPipelineDueDate] = useState('');
  const [customMaxPoints, setCustomMaxPoints] = useState(100);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [useCustomAssignment, setUseCustomAssignment] = useState(false);
  const [deployAssignmentStatus, setDeployAssignmentStatus] = useState<'published' | 'closed'>('published'); // NEW: "set the status"

  // Deployment Proctoring Configurations
  const [pipelineRequireCamera, setPipelineRequireCamera] = useState(false);
  const [pipelineRequireMic, setPipelineRequireMic] = useState(false);
  const [pipelineRequireScreenShare, setPipelineRequireScreenShare] = useState(false);
  const [pipelineRequireRecording, setPipelineRequireRecording] = useState(false);
  const [pipelineIsProctored, setPipelineIsProctored] = useState(false);

  // Assignment template builder fields
  const [editingTemplate, setEditingTemplate] = useState<AssignmentBankItem | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCourse, setTemplateCourse] = useState('');
  const [templateBatch, setTemplateBatch] = useState('');
  const [templateMonth, setTemplateMonth] = useState('Month 1');
  const [templateWeek, setTemplateWeek] = useState('Week 1');
  const [templateDay, setTemplateDay] = useState('Day 1');
  const [templateSyllabus, setTemplateSyllabus] = useState('');
  const [templateMaxPoints, setTemplateMaxPoints] = useState(100);
  const [templateQuestionType, setTemplateQuestionType] = useState<'dsa' | 'instruction'>('instruction');
  const [templateDsaQuestion, setTemplateDsaQuestion] = useState('');
  const [templateDsaConstraints, setTemplateDsaConstraints] = useState('');
  const [templateDsaTestCases, setTemplateDsaTestCases] = useState('');
  const [templateDsaTemplateCode, setTemplateDsaTemplateCode] = useState('');
  const [templateDsaGenDiff, setTemplateDsaGenDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [templateDsaGenCount, setTemplateDsaGenCount] = useState(1);
  const [validationError, setValidationError] = useState('');

  // Custom code inputs while deploying custom on-the-fly assignments
  const [customQuestionType, setCustomQuestionType] = useState<'dsa' | 'instruction'>('instruction');
  const [customDsaQuestion, setCustomDsaQuestion] = useState('');
  const [customDsaConstraints, setCustomDsaConstraints] = useState('');
  const [customDsaTestCases, setCustomDsaTestCases] = useState('');
  const [customDsaTemplateCode, setCustomDsaTemplateCode] = useState('');
  const [customDsaGenDiff, setCustomDsaGenDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [customDsaGenCount, setCustomDsaGenCount] = useState(1);

  const openAssignmentTemplateForm = (template: AssignmentBankItem | null = null) => {
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
      const defaultBatch = getBatchesForCourse(defaultCourse)[0] || 'stb_001';
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

  const handleSaveAssignmentTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateDesc.trim() || !templateCourse || !templateBatch) {
      setValidationError('Please fill out all required fields.');
      return;
    }

    if (editingTemplate) {
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
      const newItem: AssignmentBankItem = {
        id: `bank-${Date.now()}`,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        batch: templateBatch,
        month: templateMonth,
        createdDate: new Date().toISOString().split('T')[0],
        week: templateWeek,
        day: templateDay,
        syllabus: templateSyllabus,
        maxPoints: templateMaxPoints,
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

  const handleDeployAssignment = (e: React.FormEvent) => {
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
        alert('Please fill out custom title and description.');
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
        alert('Please select an assignment template from the Bank.');
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
      status: deployAssignmentStatus, // "set the status" dynamically!
      createdDate: new Date().toISOString().split('T')[0],
      submissions: [],
      month: selectedMonthStr,
      week: selectedWeek,
      day: selectedDay,
      syllabus: selectedSyllabus,
      questionType: finalType,
      dsaQuestion: finalType === 'dsa' ? finalDsaQuestion : undefined,
      dsaConstraints: finalType === 'dsa' ? finalDsaConstraints : undefined,
      dsaTestCases: finalType === 'dsa' ? finalDsaTestCases : undefined,
      dsaTemplateCode: finalType === 'dsa' ? finalDsaTemplateCode : undefined,
      requireCamera: pipelineRequireCamera,
      requireMic: pipelineRequireMic,
      requireScreenShare: pipelineRequireScreenShare,
      requireRecording: pipelineRequireRecording,
      isProctored: pipelineIsProctored
    };

    setAssignments(prev => [newAsg, ...prev]);

    // Send notifications to enrolled students
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (deployBatch === 'All' || !u.batch || u.batch.toLowerCase() === deployBatch.toLowerCase() || areBatchesEquivalent(u.batch, deployBatch)) &&
      (selectedCourse === 'All' || u.course?.toLowerCase() === selectedCourse.toLowerCase())
    );

    targetStudents.forEach(st => {
      const notif: AppNotification = {
        id: `notif-asg-pipeline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `📄 Homework Published: ${finalTitle}`,
        message: `A syllabus assignment task has been issued for ${selectedMonthStr}, ${selectedWeek}. Status is set to ${deployAssignmentStatus.toUpperCase()}. Due by: ${newAsg.dueDate}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
    });

    setPipelineSuccessMsg(`Successfully deployed Assignment "${finalTitle}" with status "${deployAssignmentStatus}" to ${targetStudents.length} active students in course "${selectedCourse}" [Batch: ${deployBatch}]!`);
    
    // Clear deployed variables
    setCustomTitle('');
    setCustomDesc('');
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 5000);
  };


  // ==========================================
  // SUB-TRACK 2: MONTHLY EVOLUTIONS LOGIC
  // ==========================================

  // Auto builders for weekly DSA configurations
  const [w1Diff, setW1Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w1Count, setW1Count] = useState<number>(1);
  const [w2Diff, setW2Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w2Count, setW2Count] = useState<number>(1);
  const [w3Diff, setW3Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w3Count, setW3Count] = useState<number>(1);
  const [w4Diff, setW4Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w4Count, setW4Count] = useState<number>(1);

  // Deploy evolution state parameters
  const [useCustomWeeks, setUseCustomWeeks] = useState(false);
  const [customWeeksTitle, setCustomWeeksTitle] = useState('');
  const [customWeeksDesc, setCustomWeeksDesc] = useState('');
  const [deployEvolutionStatus, setDeployEvolutionStatus] = useState<boolean>(true); // Active/Published

  // Continuous Evolution Exam Parameters
  const [evolutionDate, setEvolutionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [evolutionTime, setEvolutionTime] = useState<string>('14:00');
  const [evolutionDuration, setEvolutionDuration] = useState<string>('120 mins');

  const [cWeek1Title, setCWeek1Title] = useState('');
  const [cWeek1Desc, setCWeek1Desc] = useState('');
  const [cWeek1Type, setCWeek1Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek1Q, setCWeek1Q] = useState('');
  const [cWeek1C, setCWeek1C] = useState('');
  const [cWeek1T, setCWeek1T] = useState('');
  const [cWeek1Code, setCWeek1Code] = useState('');

  const [cWeek2Title, setCWeek2Title] = useState('');
  const [cWeek2Desc, setCWeek2Desc] = useState('');
  const [cWeek2Type, setCWeek2Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek2Q, setCWeek2Q] = useState('');
  const [cWeek2C, setCWeek2C] = useState('');
  const [cWeek2T, setCWeek2T] = useState('');
  const [cWeek2Code, setCWeek2Code] = useState('');

  const [cWeek3Title, setCWeek3Title] = useState('');
  const [cWeek3Desc, setCWeek3Desc] = useState('');
  const [cWeek3Type, setCWeek3Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek3Q, setCWeek3Q] = useState('');
  const [cWeek3C, setCWeek3C] = useState('');
  const [cWeek3T, setCWeek3T] = useState('');
  const [cWeek3Code, setCWeek3Code] = useState('');

  const [cWeek4Title, setCWeek4Title] = useState('');
  const [cWeek4Desc, setCWeek4Desc] = useState('');
  const [cWeek4Type, setCWeek4Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek4Q, setCWeek4Q] = useState('');
  const [cWeek4C, setCWeek4C] = useState('');
  const [cWeek4T, setCWeek4T] = useState('');
  const [cWeek4Code, setCWeek4Code] = useState('');

  // Evolution Blueprint Builder Fields
  const [editingEvoTemplate, setEditingEvoTemplate] = useState<EvolutionBankItem | null>(null);
  const [evoTemplateTitle, setEvoTemplateTitle] = useState('');
  const [evoTemplateDesc, setEvoTemplateDesc] = useState('');
  const [evoTemplateCourse, setEvoTemplateCourse] = useState('');
  const [evoTemplateMonth, setEvoTemplateMonth] = useState<number>(1);

  const [tWeek1Title, setTWeek1Title] = useState('');
  const [tWeek1Desc, setTWeek1Desc] = useState('');
  const [tWeek1Type, setTWeek1Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek1Q, setTWeek1Q] = useState('');
  const [tWeek1C, setTWeek1C] = useState('');
  const [tWeek1T, setTWeek1T] = useState('');
  const [tWeek1Code, setTWeek1Code] = useState('');

  const [tWeek2Title, setTWeek2Title] = useState('');
  const [tWeek2Desc, setTWeek2Desc] = useState('');
  const [tWeek2Type, setTWeek2Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek2Q, setTWeek2Q] = useState('');
  const [tWeek2C, setTWeek2C] = useState('');
  const [tWeek2T, setTWeek2T] = useState('');
  const [tWeek2Code, setTWeek2Code] = useState('');

  const [tWeek3Title, setTWeek3Title] = useState('');
  const [tWeek3Desc, setTWeek3Desc] = useState('');
  const [tWeek3Type, setTWeek3Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek3Q, setTWeek3Q] = useState('');
  const [tWeek3C, setTWeek3C] = useState('');
  const [tWeek3T, setTWeek3T] = useState('');
  const [tWeek3Code, setTWeek3Code] = useState('');

  const [tWeek4Title, setTWeek4Title] = useState('');
  const [tWeek4Desc, setTWeek4Desc] = useState('');
  const [tWeek4Type, setTWeek4Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek4Q, setTWeek4Q] = useState('');
  const [tWeek4C, setTWeek4C] = useState('');
  const [tWeek4T, setTWeek4T] = useState('');
  const [tWeek4Code, setTWeek4Code] = useState('');

  const handleAutoGenerateDSA = (weekNum: number, diff: 'Easy' | 'Medium' | 'Hard', count: number) => {
    const pool = diff === 'Easy' ? EASY_PROBLEMS : diff === 'Medium' ? MEDIUM_PROBLEMS : HARD_PROBLEMS;
    const selected: DSAProblem[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(pool[i % pool.length]);
    }

    const titles = selected.map(p => p.title.replace(/^\d+\.\s*/, '')).join(' & ');
    let combinedQuestion = `### Coding Challenge: ${titles}\n\n`;
    combinedQuestion += `Difficulty: **${diff}** | Challenges Count: ${count}\n\n`;
    
    if (selected.length === 1) {
      combinedQuestion += `\n${selected[0].description}`;
    } else {
      selected.forEach((p, idx) => {
        combinedQuestion += `#### Problem ${idx + 1}: ${p.title}\n${p.description}\n\n---\n\n`;
      });
    }

    let combinedConstraints = selected.length === 1 ? selected[0].constraints : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.constraints}`).join('\n\n');
    let combinedTestCases = selected.length === 1 ? selected[0].testCases : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.testCases}`).join('\n\n');
    let combinedTemplate = selected.length === 1 ? selected[0].starterCode : `// Combined Workspace: ${titles}\n\n` + selected.map((p, ix) => `// --- CHALLENGE ${ix + 1}: ${p.title} ---\n${p.starterCode}`).join('\n\n');

    const firstTitleToken = selected[0].title.replace(/^\d+\.\s*/, '');
    const titleVal = `DSA Milestone - ${diff} Block (${firstTitleToken}${count > 1 ? ' + ' + (count - 1) + ' more' : ''})`;
    const descVal = `Implement efficient code solving: ${titles}. Meet limits & pass assertions.`;

    if (pipelineTab === 'template-form') {
      if (weekNum === 1) { tSetWeek1(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 2) { tSetWeek2(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 3) { tSetWeek3(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 4) { tSetWeek4(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
    } else {
      if (weekNum === 1) { cSetWeek1(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 2) { cSetWeek2(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 3) { cSetWeek3(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
      if (weekNum === 4) { cSetWeek4(titleVal, descVal, 'dsa', combinedQuestion, combinedConstraints, combinedTestCases, combinedTemplate); }
    }
  };

  const handleAutoGenerateTemplateDSA = (diff: 'Easy' | 'Medium' | 'Hard', count: number) => {
    const pool = diff === 'Easy' ? EASY_PROBLEMS : diff === 'Medium' ? MEDIUM_PROBLEMS : HARD_PROBLEMS;
    const selected: DSAProblem[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(pool[i % pool.length]);
    }

    const titles = selected.map(p => p.title.replace(/^\d+\.\s*/, '')).join(' & ');
    let combinedQuestion = `### Coding Challenge: ${titles}\n\n`;
    combinedQuestion += `Difficulty: **${diff}** | Challenges Count: ${count}\n\n`;
    
    if (selected.length === 1) {
      combinedQuestion += `\n${selected[0].description}`;
    } else {
      selected.forEach((p, idx) => {
        combinedQuestion += `#### Problem ${idx + 1}: ${p.title}\n${p.description}\n\n---\n\n`;
      });
    }

    let combinedConstraints = selected.length === 1 ? selected[0].constraints : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.constraints}`).join('\n\n');
    let combinedTestCases = selected.length === 1 ? selected[0].testCases : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.testCases}`).join('\n\n');
    let combinedTemplate = selected.length === 1 ? selected[0].starterCode : `// Combined Workspace: ${titles}\n\n` + selected.map((p, ix) => `// --- CHALLENGE ${ix + 1}: ${p.title} ---\n${p.starterCode}`).join('\n\n');

    setTemplateDsaQuestion(combinedQuestion);
    setTemplateDsaConstraints(combinedConstraints);
    setTemplateDsaTestCases(combinedTestCases);
    setTemplateDsaTemplateCode(combinedTemplate);
  };

  const handleAutoGenerateCustomDSA = (diff: 'Easy' | 'Medium' | 'Hard', count: number) => {
    const pool = diff === 'Easy' ? EASY_PROBLEMS : diff === 'Medium' ? MEDIUM_PROBLEMS : HARD_PROBLEMS;
    const selected: DSAProblem[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(pool[i % pool.length]);
    }

    const titles = selected.map(p => p.title.replace(/^\d+\.\s*/, '')).join(' & ');
    let combinedQuestion = `### Coding Challenge: ${titles}\n\n`;
    combinedQuestion += `Difficulty: **${diff}** | Challenges Count: ${count}\n\n`;
    
    if (selected.length === 1) {
      combinedQuestion += `\n${selected[0].description}`;
    } else {
      selected.forEach((p, idx) => {
        combinedQuestion += `#### Problem ${idx + 1}: ${p.title}\n${p.description}\n\n---\n\n`;
      });
    }

    let combinedConstraints = selected.length === 1 ? selected[0].constraints : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.constraints}`).join('\n\n');
    let combinedTestCases = selected.length === 1 ? selected[0].testCases : selected.map((p, ix) => `[Problem ${ix + 1}]\n${p.testCases}`).join('\n\n');
    let combinedTemplate = selected.length === 1 ? selected[0].starterCode : `// Combined Workspace: ${titles}\n\n` + selected.map((p, ix) => `// --- CHALLENGE ${ix + 1}: ${p.title} ---\n${p.starterCode}`).join('\n\n');

    setCustomTitle(`DSA Milestone - ${diff} Block (${selected[0].title.replace(/^\d+\.\s*/, '')}${count > 1 ? ' +' : ''})`);
    setCustomDesc(`Implement efficient code solving: ${titles}. Meet limits & pass assertions.`);
    setCustomDsaQuestion(combinedQuestion);
    setCustomDsaConstraints(combinedConstraints);
    setCustomDsaTestCases(combinedTestCases);
    setCustomDsaTemplateCode(combinedTemplate);
  };

  const tSetWeek1 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setTWeek1Title(t); setTWeek1Desc(d); setTWeek1Type(type); setTWeek1Q(q); setTWeek1C(c); setTWeek1T(tst); setTWeek1Code(cd);
  };
  const tSetWeek2 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setTWeek2Title(t); setTWeek2Desc(d); setTWeek2Type(type); setTWeek2Q(q); setTWeek2C(c); setTWeek2T(tst); setTWeek2Code(cd);
  };
  const tSetWeek3 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setTWeek3Title(t); setTWeek3Desc(d); setTWeek3Type(type); setTWeek3Q(q); setTWeek3C(c); setTWeek3T(tst); setTWeek3Code(cd);
  };
  const tSetWeek4 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setTWeek4Title(t); setTWeek4Desc(d); setTWeek4Type(type); setTWeek4Q(q); setTWeek4C(c); setTWeek4T(tst); setTWeek4Code(cd);
  };

  const cSetWeek1 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setCWeek1Title(t); setCWeek1Desc(d); setCWeek1Type(type); setCWeek1Q(q); setCWeek1C(c); setCWeek1T(tst); setCWeek1Code(cd);
  };
  const cSetWeek2 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setCWeek2Title(t); setCWeek2Desc(d); setCWeek2Type(type); setCWeek2Q(q); setCWeek2C(c); setCWeek2T(tst); setCWeek2Code(cd);
  };
  const cSetWeek3 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setCWeek3Title(t); setCWeek3Desc(d); setCWeek3Type(type); setCWeek3Q(q); setCWeek3C(c); setCWeek3T(tst); setCWeek3Code(cd);
  };
  const cSetWeek4 = (t: string, d: string, type: 'dsa' | 'instruction', q = '', c = '', tst = '', cd = '') => {
    setCWeek4Title(t); setCWeek4Desc(d); setCWeek4Type(type); setCWeek4Q(q); setCWeek4C(c); setCWeek4T(tst); setCWeek4Code(cd);
  };

  const openEvoTemplateForm = (template: EvolutionBankItem | null = null) => {
    if (template) {
      setEditingEvoTemplate(template);
      setEvoTemplateTitle(template.title);
      setEvoTemplateDesc(template.description);
      setEvoTemplateCourse(template.course);
      setEvoTemplateMonth(template.month);

      setTWeek1Title(template.week1Title); setTWeek1Desc(template.week1Desc); setTWeek1Type(template.week1Type || 'instruction');
      setTWeek1Q(template.week1Question || ''); setTWeek1C(template.week1Constraints || ''); setTWeek1T(template.week1TestCases || ''); setTWeek1Code(template.week1TemplateCode || '');

      setTWeek2Title(template.week2Title); setTWeek2Desc(template.week2Desc); setTWeek2Type(template.week2Type || 'instruction');
      setTWeek2Q(template.week2Question || ''); setTWeek2C(template.week2Constraints || ''); setTWeek2T(template.week2TestCases || ''); setTWeek2Code(template.week2TemplateCode || '');

      setTWeek3Title(template.week3Title); setTWeek3Desc(template.week3Desc); setTWeek3Type(template.week3Type || 'instruction');
      setTWeek3Q(template.week3Question || ''); setTWeek3C(template.week3Constraints || ''); setTWeek3T(template.week3TestCases || ''); setTWeek3Code(template.week3TemplateCode || '');

      setTWeek4Title(template.week4Title); setTWeek4Desc(template.week4Desc); setTWeek4Type(template.week4Type || 'instruction');
      setTWeek4Q(template.week4Question || ''); setTWeek4C(template.week4Constraints || ''); setTWeek4T(template.week4TestCases || ''); setTWeek4Code(template.week4TemplateCode || '');
    } else {
      setEditingEvoTemplate(null);
      setEvoTemplateTitle('');
      setEvoTemplateDesc('');
      setEvoTemplateCourse(courses[0]?.name || '');
      setEvoTemplateMonth(1);

      tSetWeek1('Weekly Assignment 1', 'Solve fundamental logical constraints.', 'instruction');
      tSetWeek2('Weekly Assignment 2', 'Complete class architectural templates.', 'instruction');
      tSetWeek3('Weekly Assignment 3', 'Database system integrations practical.', 'instruction');
      tSetWeek4('Weekly Assignment 4', 'Comprehensive project build parameters.', 'instruction');
    }
    setValidationError('');
    setPipelineTab('template-form');
  };

  const handleSaveEvoTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evoTemplateTitle.trim() || !evoTemplateDesc.trim() || !evoTemplateCourse) {
      setValidationError('Please fill out all required blueprint parameters.');
      return;
    }

    if (editingEvoTemplate) {
      setEvolutionBank(prev => prev.map(t => t.id === editingEvoTemplate.id ? {
        ...t,
        title: evoTemplateTitle,
        description: evoTemplateDesc,
        course: evoTemplateCourse,
        month: evoTemplateMonth,
        week1Title: tWeek1Title, week1Desc: tWeek1Desc, week1Type: tWeek1Type, week1Question: tWeek1Q, week1Constraints: tWeek1C, week1TestCases: tWeek1T, week1TemplateCode: tWeek1Code,
        week2Title: tWeek2Title, week2Desc: tWeek2Desc, week2Type: tWeek2Type, week2Question: tWeek2Q, week2Constraints: tWeek2C, week2TestCases: tWeek2T, week2TemplateCode: tWeek2Code,
        week3Title: tWeek3Title, week3Desc: tWeek3Desc, week3Type: tWeek3Type, week3Question: tWeek3Q, week3Constraints: tWeek3C, week3TestCases: tWeek3T, week3TemplateCode: tWeek3Code,
        week4Title: tWeek4Title, week4Desc: tWeek4Desc, week4Type: tWeek4Type, week4Question: tWeek4Q, week4Constraints: tWeek4C, week4TestCases: tWeek4T, week4TemplateCode: tWeek4Code
      } : t));
    } else {
      const newItem: EvolutionBankItem = {
        id: `evo-bank-${Date.now()}`,
        title: evoTemplateTitle,
        description: evoTemplateDesc,
        course: evoTemplateCourse,
        month: evoTemplateMonth,
        createdDate: new Date().toISOString().split('T')[0],
        week1Title: tWeek1Title, week1Desc: tWeek1Desc, week1Type: tWeek1Type, week1Question: tWeek1Q, week1Constraints: tWeek1C, week1TestCases: tWeek1T, week1TemplateCode: tWeek1Code,
        week2Title: tWeek2Title, week2Desc: tWeek2Desc, week2Type: tWeek2Type, week2Question: tWeek2Q, week2Constraints: tWeek2C, week2TestCases: tWeek2T, week2TemplateCode: tWeek2Code,
        week3Title: tWeek3Title, week3Desc: tWeek3Desc, week3Type: tWeek3Type, week3Question: tWeek3Q, week3Constraints: tWeek3C, week3TestCases: tWeek3T, week3TemplateCode: tWeek3Code,
        week4Title: tWeek4Title, week4Desc: tWeek4Desc, week4Type: tWeek4Type, week4Question: tWeek4Q, week4Constraints: tWeek4C, week4TestCases: tWeek4T, week4TemplateCode: tWeek4Code
      };
      setEvolutionBank(prev => [newItem, ...prev]);
    }
    setPipelineTab('bank');
  };

  const handleDeployEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      alert('Please select target course first.');
      return;
    }

    const publishTargetBatch = selectedBatch || 'All';
    let sourceTitle = '';
    let finalWeeks = {
      w1T: '', w1D: '', w1Ty: 'instruction' as 'dsa'|'instruction', w1Q: '', w1C: '', w1Tst: '', w1Cd: '',
      w2T: '', w2D: '', w2Ty: 'instruction' as 'dsa'|'instruction', w2Q: '', w2C: '', w2Tst: '', w2Cd: '',
      w3T: '', w3D: '', w3Ty: 'instruction' as 'dsa'|'instruction', w3Q: '', w3C: '', w3Tst: '', w3Cd: '',
      w4T: '', w4D: '', w4Ty: 'instruction' as 'dsa'|'instruction', w4Q: '', w4C: '', w4Tst: '', w4Cd: ''
    };

    if (useCustomWeeks) {
      if (!customWeeksTitle.trim() || !cWeek1Title || !cWeek2Title || !cWeek3Title || !cWeek4Title) {
        alert('Please fill out the custom titles for all four weeks.');
        return;
      }
      sourceTitle = customWeeksTitle;
      finalWeeks = {
        w1T: cWeek1Title, w1D: cWeek1Desc || 'Week 1 standard evaluation guidelines.', w1Ty: cWeek1Type, w1Q: cWeek1Q, w1C: cWeek1C, w1Tst: cWeek1T, w1Cd: cWeek1Code,
        w2T: cWeek2Title, w2D: cWeek2Desc || 'Week 2 standard evaluation guidelines.', w2Ty: cWeek2Type, w2Q: cWeek2Q, w2C: cWeek2C, w2Tst: cWeek2T, w2Cd: cWeek2Code,
        w3T: cWeek3Title, w3D: cWeek3Desc || 'Week 3 standard evaluation guidelines.', w3Ty: cWeek3Type, w3Q: cWeek3Q, w3C: cWeek3C, w3Tst: cWeek3T, w3Cd: cWeek3Code,
        w4T: cWeek4Title, w4D: cWeek4Desc || 'Week 4 standard evaluation guidelines.', w4Ty: cWeek4Type, w4Q: cWeek4Q, w4C: cWeek4C, w4Tst: cWeek4T, w4Cd: cWeek4Code,
      };
    } else {
      const template = evolutionBank.find(t => t.id === selectedBankTemplateId);
      if (!template) {
        alert('Please select a Monthly Evolution blueprint from the bank.');
        return;
      }
      sourceTitle = template.title;
      finalWeeks = {
        w1T: template.week1Title, w1D: template.week1Desc, w1Ty: template.week1Type || 'instruction', w1Q: template.week1Question || '', w1C: template.week1Constraints || '', w1Tst: template.week1TestCases || '', w1Cd: template.week1TemplateCode || '',
        w2T: template.week2Title, w2D: template.week2Desc, w2Ty: template.week2Type || 'instruction', w2Q: template.week2Question || '', w2C: template.week2Constraints || '', w2Tst: template.week2TestCases || '', w2Cd: template.week2TemplateCode || '',
        w3T: template.week3Title, w3D: template.week3Desc, w3Ty: template.week3Type || 'instruction', w3Q: template.week3Question || '', w3C: template.week3Constraints || '', w3Tst: template.week3TestCases || '', w3Cd: template.week3TemplateCode || '',
        w4T: template.week4Title, w4D: template.week4Desc, w4Ty: template.week4Type || 'instruction', w4Q: template.week4Question || '', w4C: template.week4Constraints || '', w4Tst: template.week4TestCases || '', w4Cd: template.week4TemplateCode || '',
      };
    }

    // Filter students enrolled
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      u.course?.toLowerCase() === selectedCourse.toLowerCase() && 
      (publishTargetBatch === 'All' || !u.batch || u.batch.toLowerCase() === publishTargetBatch.toLowerCase() || areBatchesEquivalent(u.batch, publishTargetBatch))
    );

    if (targetStudents.length === 0) {
      alert(`No active students found in course "${selectedCourse}" inside batch "${publishTargetBatch}". Correct enrolled student parameters first.`);
      return;
    }

    // Upsert student evolution trackers
    setStudentEvolutions(prev => {
      let updatedList = [...prev];
      targetStudents.forEach(st => {
        const existingIdx = updatedList.findIndex(ev => ev.studentId === st.id && ev.month === selectedMonthNum && ev.course.toLowerCase() === selectedCourse.toLowerCase());
        
        const freshEntry: StudentEvolution = {
          id: existingIdx !== -1 ? updatedList[existingIdx].id : `evo-track-${Date.now()}-${st.id.substring(0,4)}`,
          studentId: st.id,
          studentName: st.name,
          course: selectedCourse,
          batch: publishTargetBatch,
          month: selectedMonthNum,
          promoted: false,
          lastUpdated: new Date().toISOString(),
          status: deployEvolutionStatus ? 'active' : 'draft',
          
          examDate: evolutionDate || undefined,
          examTime: evolutionTime || undefined,
          examDuration: evolutionDuration || undefined,
          
          title1: finalWeeks.w1T, desc1: finalWeeks.w1D, week1Type: finalWeeks.w1Ty, week1Question: finalWeeks.w1Q, week1Constraints: finalWeeks.w1C, week1TestCases: finalWeeks.w1Tst, week1TemplateCode: finalWeeks.w1Cd,
          title2: finalWeeks.w2T, desc2: finalWeeks.w2D, week2Type: finalWeeks.w2Ty, week2Question: finalWeeks.w2Q, week2Constraints: finalWeeks.w2C, week2TestCases: finalWeeks.w2Tst, week2TemplateCode: finalWeeks.w2Cd,
          title3: finalWeeks.w3T, desc3: finalWeeks.w3D, week3Type: finalWeeks.w3Ty, week3Question: finalWeeks.w3Q, week3Constraints: finalWeeks.w3C, week3TestCases: finalWeeks.w3Tst, week3TemplateCode: finalWeeks.w3Cd,
          title4: finalWeeks.w4T, desc4: finalWeeks.w4D, week4Type: finalWeeks.w4Ty, week4Question: finalWeeks.w4Q, week4Constraints: finalWeeks.w4C, week4TestCases: finalWeeks.w4Tst, week4TemplateCode: finalWeeks.w4Cd,

          evolution1: existingIdx !== -1 ? updatedList[existingIdx].evolution1 : undefined,
          evolution2: existingIdx !== -1 ? updatedList[existingIdx].evolution2 : undefined,
          evolution3: existingIdx !== -1 ? updatedList[existingIdx].evolution3 : undefined,
          evolution4: existingIdx !== -1 ? updatedList[existingIdx].evolution4 : undefined,
          feedback1: existingIdx !== -1 ? updatedList[existingIdx].feedback1 : undefined,
          feedback2: existingIdx !== -1 ? updatedList[existingIdx].feedback2 : undefined,
          feedback3: existingIdx !== -1 ? updatedList[existingIdx].feedback3 : undefined,
          feedback4: existingIdx !== -1 ? updatedList[existingIdx].feedback4 : undefined,
          requireCamera: pipelineRequireCamera,
          requireMic: pipelineRequireMic,
          requireScreenShare: pipelineRequireScreenShare,
          requireRecording: pipelineRequireRecording,
          isProctored: pipelineIsProctored
        };

        if (existingIdx !== -1) {
          updatedList[existingIdx] = freshEntry;
        } else {
          updatedList.push(freshEntry);
        }

        // Notify Student
        const notif: AppNotification = {
          id: `notif-evo-pipeline-${Date.now()}-${st.id.substring(0, 4)}`,
          title: `📈 Continuous Evolution Month ${selectedMonthNum} Initialized!`,
          message: `Your syllabus milestones for Study Month ${selectedMonthNum} have been deployed. Status set to: ${deployEvolutionStatus ? 'ACTIVE' : 'DRAFT'}.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'general',
          channel: 'system'
        };
        setNotifications(prevNotif => [notif, ...prevNotif]);

        // Simulated Email Notification
        if (onSendEmail && st.email) {
          const emailSubject = `🎓 Continuous Evolution Milestones Deployed: Month ${selectedMonthNum}`;
          const emailBody = `Dear ${st.name},\n\nYour authorized syllabus structures for Study Month ${selectedMonthNum} under: ${selectedCourse} have been deployed.\n\nUpcoming Weekly Checkpoints:\n- Week 1: ${finalWeeks.w1T}\n- Week 2: ${finalWeeks.w2T}\n- Week 3: ${finalWeeks.w3T}\n- Week 4: ${finalWeeks.w4T}\n\nTrack status is active. Aggregate passing score is 80%+.\n\nKeep up the extraordinary coding effort!\n\nBest regards,\nLearnora Academic Office`;
          onSendEmail(st.email, emailSubject, emailBody, 'academic-office@learnora.in');
        }
      });
      return updatedList;
    });

    setPipelineSuccessMsg(`Successfully deployed Month ${selectedMonthNum} Evolution Grid "${sourceTitle}" with active status to ${targetStudents.length} active students in course "${selectedCourse}" [Batch: ${publishTargetBatch}]!`);
    
    if (useCustomWeeks) {
      setCWeek1Desc(''); setCWeek2Desc(''); setCWeek3Desc(''); setCWeek4Desc('');
      setCustomWeeksTitle('');
    }
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 5000);
  };


  // ==========================================
  // VIEW FILTER CALCULATIONS
  // ==========================================

  // Filter templates list based on search parameters
  const filteredTemplates = useMemo(() => {
    if (selectedTrack === 'assignment') {
      return assignmentBank.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || 
                              t.description.toLowerCase().includes(bankSearch.toLowerCase()) ||
                              t.syllabus.toLowerCase().includes(bankSearch.toLowerCase());
        const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
        const matchesBatch = bankBatchFilter === 'all' || t.batch.toLowerCase() === bankBatchFilter.toLowerCase();
        return matchesSearch && matchesCourse && matchesBatch;
      });
    } else {
      return evolutionBank.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || 
                              t.description.toLowerCase().includes(bankSearch.toLowerCase());
        const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
        return matchesSearch && matchesCourse;
      });
    }
  }, [selectedTrack, assignmentBank, evolutionBank, bankSearch, bankCourseFilter, bankBatchFilter]);

  // Filter deployed live tasks list for the status summary tracker tab
  const filteredActiveTasks = useMemo(() => {
    if (selectedTrack === 'assignment') {
      return assignments.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || t.description.toLowerCase().includes(bankSearch.toLowerCase());
        const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
        const matchesBatch = bankBatchFilter === 'all' || t.batch.toLowerCase() === bankBatchFilter.toLowerCase();
        return matchesSearch && matchesCourse && matchesBatch;
      });
    } else {
      // Group track by Month, Course, and Batch
      const uniqueMap: Record<string, { id: string; course: string; batch: string; month: number; studentsCount: number; title: string }> = {};
      studentEvolutions.forEach(e => {
        const key = `${e.course}-${e.batch}-${e.month}`;
        if (!uniqueMap[key]) {
          uniqueMap[key] = {
            id: e.id,
            course: e.course,
            batch: e.batch || 'Batch A',
            month: e.month,
            studentsCount: 0,
            title: e.title1 ? `Month ${e.month} Milestone Checklist` : `Study Track Grid`
          };
        }
        uniqueMap[key].studentsCount += 1;
      });
      return Object.values(uniqueMap).filter(t => {
        const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
        const matchesBatch = bankBatchFilter === 'all' || t.batch.toLowerCase() === bankBatchFilter.toLowerCase();
        return matchesCourse && matchesBatch;
      });
    }
  }, [selectedTrack, assignments, studentEvolutions, bankSearch, bankCourseFilter, bankBatchFilter]);


  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Upper Pipeline Type Selector */}
      <div className="bg-slate-100 dark:bg-zinc-900/60 p-1.5 rounded-2xl flex border border-slate-200/50 dark:border-white/5 max-w-md mx-auto shadow-xs">
        <button
          type="button"
          onClick={() => setSelectedTrack('assignment')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            selectedTrack === 'assignment'
              ? 'bg-amber-500 text-amber-950 font-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Syllabus Assignments
        </button>
        <button
          type="button"
          onClick={() => setSelectedTrack('evolution')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            selectedTrack === 'evolution'
              ? 'bg-amber-500 text-amber-950 font-black shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Continuous Evolutions
        </button>
      </div>

      {/* Main Context Card */}
      <div className="bg-white dark:bg-[#111112] max-w-7xl mx-auto rounded-3xl border border-slate-200/80 dark:border-white/5 p-6 md:p-8 space-y-6 shadow-sm">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              {selectedTrack === 'assignment' ? (
                <>
                  <ClipboardList className="w-5 h-5 text-amber-500" />
                  Syllabus Assignment Pipeline
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Continuous Monthly Evolution Grid
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              {selectedTrack === 'assignment' 
                ? 'Design coding milestones, build dynamic DSA challenges, assign homework paths, and set active status.'
                : 'Construct 4-week structured curriculum benchmarks, authorize monthly promotions, and deploy core assessment blocks.'}
            </p>
          </div>

          {/* Action Tabs Selector */}
          <div className="flex bg-slate-50 dark:bg-[#070708] border border-slate-200/60 dark:border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setPipelineTab('bank')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                pipelineTab === 'bank' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Blueprint Bank
            </button>
            <button
              onClick={() => setPipelineTab('pipeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                pipelineTab === 'pipeline' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Assign & Deploy
            </button>
            <button
              onClick={() => setPipelineTab('active-list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                pipelineTab === 'active-list' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Manage Deployed
            </button>
          </div>
        </div>

        {/* Global Notifications Container */}
        {pipelineSuccessMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="font-medium">{pipelineSuccessMsg}</p>
          </div>
        )}

        {/* Dynamic Context Render */}
        <AnimatePresence mode="wait">
          
          {/* ====================================================
              VIEW TAB 1: BLUEPRINT TEMPLATE BANK
              ==================================================== */}
          {pipelineTab === 'bank' && (
            <motion.div
              key="bank-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-205 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search template title, content..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 focus:outline-none text-slate-800 dark:text-zinc-200"
                    value={bankSearch}
                    onChange={e => setBankSearch(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                    value={bankCourseFilter}
                    onChange={e => setBankCourseFilter(e.target.value)}
                  >
                    <option value="all">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                {selectedTrack === 'assignment' && (
                  <div>
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                      value={bankBatchFilter}
                      onChange={e => setBankBatchFilter(e.target.value)}
                    >
                      <option value="all">All Batches</option>
                      {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Roster Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  Available Templates Pool ({filteredTemplates.length})
                </h3>
                <button
                  type="button"
                  onClick={() => selectedTrack === 'assignment' ? openAssignmentTemplateForm() : openEvoTemplateForm()}
                  className="px-3.5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Blueprint Template
                </button>
              </div>

              {/* List Cards */}
              {filteredTemplates.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708]/40">
                  <Database className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">No Templates Found</p>
                  <p className="text-[10px] text-slate-400 mt-1">Create a new reusable curriculum blueprint template to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTemplates.map(item => (
                    <div
                      key={item.id}
                      className="p-5 bg-white dark:bg-[#151517] border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 transition-all shadow-2xs group relative overflow-hidden"
                    >
                      {deletingTemplateId === item.id && (
                        <div className="absolute inset-0 bg-slate-950/98 flex flex-col justify-center items-center p-4 z-10 text-center animate-fadeIn">
                          <Trash2 className="w-8 h-8 text-rose-500 mb-2" />
                          <p className="text-xs font-bold text-white mb-1">Delete Template?</p>
                          <p className="text-[10px] text-slate-400 max-w-[240px] mb-4">This will permanently remove "{item.title}" from the Bank.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeletingTemplateId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">Cancel</button>
                            <button
                              onClick={() => {
                                if (selectedTrack === 'assignment') {
                                  setAssignmentBank(prev => prev.filter(t => t.id !== item.id));
                                } else {
                                  setEvolutionBank(prev => prev.filter(t => t.id !== item.id));
                                }
                                setDeletingTemplateId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[10px]"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2 min-w-0 flex-1">
                            {/* Meta Badges */}
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 text-[9px] font-bold rounded uppercase">
                                {item.course}
                              </span>
                              {'batch' in item && item.batch && (
                                <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold rounded uppercase">
                                  {getBatchDisplayName(item.batch)}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded">
                                Month {item.month}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                              {item.title}
                            </h4>
                          </div>

                          {/* Trigger Edit/Delete actions in Template card */}
                          <div className="flex gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition duration-150">
                            <button
                              onClick={() => selectedTrack === 'assignment' ? openAssignmentTemplateForm(item as AssignmentBankItem) : openEvoTemplateForm(item as EvolutionBankItem)}
                              className="p-1.5 rounded bg-slate-50 dark:bg-white/5 hover:bg-slate-250 dark:hover:bg-white/10 text-slate-500"
                              title="Edit blueprint"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTemplateId(item.id)}
                              className="p-1.5 rounded bg-slate-50 dark:bg-white/5 hover:bg-rose-500/10 text-rose-500"
                              title="Remove blueprint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans line-clamp-3">
                          {item.description}
                        </p>

                        {/* Additional dynamic stats */}
                        {selectedTrack === 'assignment' ? (
                          <div className="text-[10px] text-slate-400 flex items-center gap-3 bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl">
                            <span className="font-bold text-amber-600 dark:text-amber-400">Assignment Topic: { (item as AssignmentBankItem).syllabus || 'General Integration' }</span>
                            <span>•</span>
                            <span>Max Points: {(item as AssignmentBankItem).maxPoints}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl space-y-1">
                            <div className="font-bold text-indigo-500 dark:text-indigo-400">Continuous Curriculum Checkpoints:</div>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-[9px]">
                              <div className="truncate">W1: {(item as EvolutionBankItem).week1Title}</div>
                              <div className="truncate">W2: {(item as EvolutionBankItem).week2Title}</div>
                              <div className="truncate">W3: {(item as EvolutionBankItem).week3Title}</div>
                              <div className="truncate">W4: {(item as EvolutionBankItem).week4Title}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}


          {/* ====================================================
              VIEW TAB 2: DEPLOY WORKSPACE ("assign the task")
              ==================================================== */}
          {pipelineTab === 'pipeline' && (
            <motion.div
              key="deploy-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="border border-slate-150 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-amber-500" />
                    Deploy & Assign Syllabus Track
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Target a specific course cohort, configure task parameters, and publish evaluations instantly onto students profiles.
                  </p>
                </div>

                {/* Unified Target Selectors form */}
                <form onSubmit={selectedTrack === 'assignment' ? handleDeployAssignment : handleDeployEvolution} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    {/* Deployment Type Selection */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Deployment Type</label>
                      <select
                        value={selectedTrack}
                        onChange={e => {
                          const val = e.target.value as 'assignment' | 'evolution';
                          setSelectedTrack(val);
                          setSelectedBankTemplateId('');
                        }}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 font-bold text-amber-600 dark:text-amber-400"
                      >
                        <option value="assignment">📄 Syllabus Assignment</option>
                        <option value="evolution">📈 Continuous Evolution</option>
                      </select>
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Target Course</label>
                      <select
                        value={selectedCourse}
                        onChange={e => handleCourseChangeInDeploy(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 font-medium text-slate-800 dark:text-zinc-200"
                        required
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Batch Selection */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Target Batch</label>
                      <select
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 font-medium text-slate-800 dark:text-zinc-200"
                        required
                        disabled={!selectedCourse}
                      >
                        {!selectedCourse ? (
                          <option value="">-- Choose Course First --</option>
                        ) : (
                          <>
                            <option value="All">All Active Batches</option>
                            {getBatchesForCourse(selectedCourse).map(bName => (
                              <option key={bName} value={bName}>{getBatchDisplayName(bName)}</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    {/* Month/Period Selection */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Target Month</label>
                      {selectedTrack === 'assignment' ? (
                        <select
                          value={selectedMonthStr}
                          onChange={e => { setSelectedMonthStr(e.target.value); setSelectedBankTemplateId(''); }}
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 font-medium text-slate-800 dark:text-zinc-200"
                        >
                          {['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      ) : (
                        <select
                          value={selectedMonthNum}
                          onChange={e => { setSelectedMonthNum(parseInt(e.target.value)); setSelectedBankTemplateId(''); }}
                          className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 font-medium text-slate-800 dark:text-zinc-200"
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>Month {num}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Real-time Audit & Counter display */}
                  {selectedCourse && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-950/40 border-slate-150 dark:border-white/5 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            Selected Cohort Live Deployment Count Auditing
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {selectedCourse} • {getBatchDisplayName(selectedBatch) || 'All Batches'} • {selectedTrack === 'assignment' ? selectedMonthStr : `Month ${selectedMonthNum}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className={`p-3 rounded-xl border transition-all ${selectedTrack === 'assignment' ? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-400' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-400'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Assignment Task Count</span>
                            <ClipboardList className="w-4 h-4 opacity-75" />
                          </div>
                          <div className="mt-1 text-base font-black">
                            {currentAssignedCount} {currentAssignedCount === 1 ? 'Task' : 'Tasks'} Deployed
                          </div>
                        </div>

                        <div className={`p-3 rounded-xl border transition-all ${selectedTrack === 'evolution' ? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-400' : 'bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-400'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Evolution Checklist Count</span>
                            <TrendingUp className="w-4 h-4 opacity-75" />
                          </div>
                          <div className="mt-1 text-base font-black">
                            {currentEvolutionCount} {currentEvolutionCount === 1 ? 'Profile track' : 'Profile tracks'} Tracked
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Syllabus Source selection panel */}
                  <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-150 dark:border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                      <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">Syllabus Curriculum Source</p>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setUseCustomAssignment(false); setUseCustomWeeks(false); }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                            (!useCustomAssignment && !useCustomWeeks) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                          }`}
                        >
                          Use Reusable Bank Blueprint
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUseCustomAssignment(true); setUseCustomWeeks(true); }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                            (useCustomAssignment || useCustomWeeks) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                          }`}
                        >
                          Configure Custom On-The-Fly Task
                        </button>
                      </div>
                    </div>

                    {/* Pre-existing Blueprint Source dropdown list */}
                    {(!useCustomAssignment && !useCustomWeeks) ? (
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Select Bank Blueprint</label>
                        <select
                          value={selectedBankTemplateId}
                          onChange={e => setSelectedBankTemplateId(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                          required
                          disabled={!selectedCourse}
                        >
                          <option value="">-- Choose Blueprint --</option>
                          {filteredTemplates
                            .filter(t => !selectedCourse || t.course.toLowerCase() === selectedCourse.toLowerCase())
                            .map(t => (
                              <option key={t.id} value={t.id}>
                                {t.title} (Month {t.month} - {t.course})
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    ) : (
                      /* CUSTOM OPTION: Renders either Custom Assignment form or Custom Evolution weeks config */
                      <div className="space-y-4 font-sans animate-fadeIn">
                        {selectedTrack === 'assignment' ? (
                          /* Custom assignment on-the-fly dashboard form block */
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Custom Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Build a custom shopping cart"
                                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-zinc-200"
                                  value={customTitle}
                                  onChange={e => setCustomTitle(e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Target Week</label>
                                  <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-2 py-2 text-xs rounded-lg">
                                    {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => <option key={w} value={w}>{w}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">Target Day</label>
                                  <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-2 py-2 text-xs rounded-lg">
                                    {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Task Description</label>
                              <textarea
                                placeholder="Detail what the student needs to build..."
                                rows={2}
                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-zinc-200 field-sizing-content"
                                value={customDesc}
                                onChange={e => setCustomDesc(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Syllabus Topic</label>
                                <input
                                  type="text"
                                  placeholder="e.g. React hook forms"
                                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-zinc-200"
                                  value={selectedSyllabus}
                                  onChange={e => setSelectedSyllabus(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Max Score Points</label>
                                <input
                                  type="number"
                                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-zinc-200"
                                  value={customMaxPoints || ''}
                                  onChange={e => setCustomMaxPoints(parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            {/* Additional custom code question type properties */}
                            <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-500">Question Submission Type</label>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setCustomQuestionType('instruction')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${customQuestionType === 'instruction' ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-400'}`}>General Instruction Prompt</button>
                                  <button type="button" onClick={() => setCustomQuestionType('dsa')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${customQuestionType === 'dsa' ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-400'}`}>Interactive DSA Question</button>
                                </div>
                              </div>
                              {customQuestionType === 'dsa' && (
                                <div className="space-y-4 border-l-2 border-amber-500/20 pl-3 animate-fadeIn">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-amber-50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/5">
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500">DSA Pool Difficulty</label>
                                      <select value={customDsaGenDiff} onChange={e => setCustomDsaGenDiff(e.target.value as any)} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg text-slate-700 dark:text-zinc-300">
                                        <option value="Easy">Easy Problems</option>
                                        <option value="Medium">Medium Problems</option>
                                        <option value="Hard">Hard Problems</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-500">Challenges quantity</label>
                                      <select value={customDsaGenCount} onChange={e => setCustomDsaGenCount(parseInt(e.target.value))} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg text-slate-700 dark:text-zinc-300">
                                        <option value={1}>1 Problem</option>
                                        <option value={2}>2 Nested Problems</option>
                                        <option value={3}>3 Combined Problems</option>
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAutoGenerateCustomDSA(customDsaGenDiff, customDsaGenCount)}
                                      className="h-9 px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 font-sans cursor-pointer transition flex items-center justify-center gap-1.5"
                                    >
                                      Generate Challenge
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <textarea placeholder="DSA Problem instruction detail..." rows={2} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={customDsaQuestion} onChange={e => setCustomDsaQuestion(e.target.value)}/>
                                    <input type="text" placeholder="Constraints (comma separated)" className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={customDsaConstraints} onChange={e => setCustomDsaConstraints(e.target.value)}/>
                                    <textarea placeholder="Test cases format block..." rows={2} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={customDsaTestCases} onChange={e => setCustomDsaTestCases(e.target.value)}/>
                                    <textarea placeholder="Starter template workspace code..." rows={2} className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs font-mono rounded text-slate-700 dark:text-zinc-300" value={customDsaTemplateCode} onChange={e => setCustomDsaTemplateCode(e.target.value)}/>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Custom monthly evolution checkpoints template inputs */
                          <div className="space-y-4 font-sans animate-fadeIn">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Custom Evolution Blueprint Title</label>
                              <input
                                type="text"
                                className="w-full bg-white dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2 text-xs rounded-xl"
                                placeholder="..."
                                value={customWeeksTitle}
                                onChange={e => setCustomWeeksTitle(e.target.value)}
                              />
                            </div>

                            {/* Standard 4-week checkpoint details */}
                            {[1, 2, 3, 4].map(wk => {
                              const titleVal = wk === 1 ? cWeek1Title : wk === 2 ? cWeek2Title : wk === 3 ? cWeek3Title : cWeek4Title;
                              const descVal = wk === 1 ? cWeek1Desc : wk === 2 ? cWeek2Desc : wk === 3 ? cWeek3Desc : cWeek4Desc;
                              const typeVal = wk === 1 ? cWeek1Type : wk === 2 ? cWeek2Type : wk === 3 ? cWeek3Type : cWeek4Type;
                              const diffVal = wk === 1 ? w1Diff : wk === 2 ? w2Diff : wk === 3 ? w3Diff : w4Diff;
                              const countVal = wk === 1 ? w1Count : wk === 2 ? w2Count : wk === 3 ? w3Count : w4Count;

                              const setTitle = (val: string) => {
                                if (wk === 1) setCWeek1Title(val); if (wk === 2) setCWeek2Title(val); if (wk === 3) setCWeek3Title(val); if (wk === 4) setCWeek4Title(val);
                              };
                              const setDesc = (val: string) => {
                                if (wk === 1) setCWeek1Desc(val); if (wk === 2) setCWeek2Desc(val); if (wk === 3) setCWeek3Desc(val); if (wk === 4) setCWeek4Desc(val);
                              };
                              const setType = (val: 'dsa' | 'instruction') => {
                                if (wk === 1) setCWeek1Type(val); if (wk === 2) setCWeek2Type(val); if (wk === 3) setCWeek3Type(val); if (wk === 4) setCWeek4Type(val);
                              };
                              const setDiff = (val: 'Easy' | 'Medium' | 'Hard') => {
                                if (wk === 1) setW1Diff(val); if (wk === 2) setW2Diff(val); if (wk === 3) setW3Diff(val); if (wk === 4) setW4Diff(val);
                              };
                              const setCount = (val: number) => {
                                if (wk === 1) setW1Count(val); if (wk === 2) setW2Count(val); if (wk === 3) setW3Count(val); if (wk === 4) setW4Count(val);
                              };

                              return (
                                <div key={wk} className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 rounded-2xl space-y-3">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                    <span className="text-xs font-black text-amber-500">Week {wk} Continuous Checkpoint</span>
                                    
                                    {/* Evaluation Subtype buttons */}
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => setType('instruction')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${typeVal === 'instruction' ? 'bg-slate-150 dark:bg-white/10 text-slate-800 dark:text-zinc-200' : 'text-slate-400'}`}>Manual Assignment</button>
                                      <button type="button" onClick={() => setType('dsa')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${typeVal === 'dsa' ? 'bg-slate-150 dark:bg-white/10 text-slate-800 dark:text-zinc-200' : 'text-slate-400'}`}>Interactive DSA Challenge</button>
                                    </div>
                                  </div>

                                  {typeVal === 'dsa' ? (
                                    /* Inline Generator for DSA Problem items */
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-amber-505/5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/5">
                                      <div>
                                        <label className="text-[9px] font-bold text-slate-500">DSA Pool Difficulty</label>
                                        <select value={diffVal} onChange={e => setDiff(e.target.value as any)} className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg">
                                          <option value="Easy">Easy Problems</option>
                                          <option value="Medium">Medium Problems</option>
                                          <option value="Hard">Hard Problems</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-bold text-slate-500">Challenges quantity</label>
                                        <select value={countVal} onChange={e => setCount(parseInt(e.target.value))} className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg">
                                          <option value={1}>1 Problem</option>
                                          <option value={2}>2 Nested Problems</option>
                                          <option value={3}>3 Combined Problems</option>
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleAutoGenerateDSA(wk, diffVal, countVal)}
                                        className="h-9 px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 font-sans cursor-pointer transition flex items-center justify-center gap-1.5"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                        Auto Run Builder
                                      </button>
                                    </div>
                                  ) : null}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 px-3 py-2 text-xs rounded-lg"
                                      placeholder="Checkpoint Title..."
                                      value={titleVal}
                                      onChange={e => setTitle(e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 px-3 py-2 text-xs rounded-lg"
                                      placeholder="Checkpoint description..."
                                      value={descVal}
                                      onChange={e => setDesc(e.target.value)}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM DEPLOY STATUS AND DUE DATE (Assign fields) */}
                  <div className="border-t border-slate-100 dark:border-white/5 pt-5 space-y-4">
                    {selectedTrack === 'evolution' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100/80 dark:border-white/5"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" /> Evolution Exam Date
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                            value={evolutionDate}
                            onChange={e => setEvolutionDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" /> Evolution Exam Time
                          </label>
                          <input
                            type="time"
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                            value={evolutionTime}
                            onChange={e => setEvolutionTime(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" /> Exam Duration
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 180 mins"
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200 font-medium"
                            value={evolutionDuration}
                            onChange={e => setEvolutionDuration(e.target.value)}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTrack === 'assignment' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Assignment Due Date</label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                            value={pipelineDueDate}
                            onChange={e => setPipelineDueDate(e.target.value)}
                          />
                        </div>
                      )}

                      {/* STATS DEPLOY STATUS CONTROLLER: "set the status which it evolution or aassisment" */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Deployment Publishing Status</label>
                        {selectedTrack === 'assignment' ? (
                          <select
                            value={deployAssignmentStatus}
                            onChange={e => setDeployAssignmentStatus(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200 font-bold"
                          >
                            <option value="published">🟢 Published (Instantly available to student homework tracks)</option>
                            <option value="closed">🛑 Closed (Saved inside logs as draft but invisible to students)</option>
                          </select>
                        ) : (
                          <select
                            value={deployEvolutionStatus ? 'active' : 'draft'}
                            onChange={e => setDeployEvolutionStatus(e.target.value === 'active')}
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs text-slate-800 dark:text-zinc-200 font-bold"
                          >
                            <option value="active">🟢 Active (Instantly starts continuous weekly grade card updates)</option>
                            <option value="draft">🛑 Draft (Saved, but track parameters are temporarily inactive)</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Proctoring and Security Telemetry Control Panel */}
                    <div className="p-4 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/15 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">🛡️ Proctoring & Cheating Prevention Telemetry</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Require candidate device permissions to enable automated identity verification, environment acoustics scanning, and background screen capture recording during submissions.
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                        <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl cursor-pointer hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition select-none">
                          <input
                            type="checkbox"
                            checked={pipelineRequireCamera}
                            onChange={e => setPipelineRequireCamera(e.target.checked)}
                            className="w-4 h-4 text-rose-500 focus:ring-rose-400 border-slate-300 rounded"
                          />
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Camera Feed</p>
                            <p className="text-[9px] text-slate-400">Facial tracking</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl cursor-pointer hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition select-none">
                          <input
                            type="checkbox"
                            checked={pipelineRequireMic}
                            onChange={e => setPipelineRequireMic(e.target.checked)}
                            className="w-4 h-4 text-rose-500 focus:ring-rose-400 border-slate-300 rounded"
                          />
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Microphone Feed</p>
                            <p className="text-[9px] text-slate-400">Acoustic analysis</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl cursor-pointer hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition select-none">
                          <input
                            type="checkbox"
                            checked={pipelineRequireScreenShare}
                            onChange={e => setPipelineRequireScreenShare(e.target.checked)}
                            className="w-4 h-4 text-rose-500 focus:ring-rose-400 border-slate-300 rounded"
                          />
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Screen Share</p>
                            <p className="text-[9px] text-slate-400">Capture desktop</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl cursor-pointer hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition select-none">
                          <input
                            type="checkbox"
                            checked={pipelineRequireRecording}
                            onChange={e => setPipelineRequireRecording(e.target.checked)}
                            className="w-4 h-4 text-rose-500 focus:ring-rose-400 border-slate-300 rounded"
                          />
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Record Session</p>
                            <p className="text-[9px] text-slate-400">Save recording</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-3 rounded-xl cursor-pointer hover:bg-rose-500/5 dark:hover:bg-rose-500/5 transition select-none">
                          <input
                            type="checkbox"
                            checked={pipelineIsProctored}
                            onChange={e => setPipelineIsProctored(e.target.checked)}
                            className="w-4 h-4 text-rose-500 focus:ring-rose-400 border-slate-300 rounded"
                          />
                          <div className="text-left">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">Enable AI Proctor</p>
                            <p className="text-[9px] text-slate-400">Tab out warnings</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Bottom Submit controls */}
                    <div className="flex justify-end gap-3 pt-2">
                       <button
                         type="button"
                         onClick={() => setPipelineTab('bank')}
                         className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                       >
                         Cancel
                       </button>
                       <button
                         type="submit"
                         className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                       >
                         <Send className="w-4 h-4" />
                         {selectedTrack === 'assignment' ? 'Deploy Custom Homework Assignment' : 'Deploy Continuous Evolution Track'}
                       </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}


          {/* ====================================================
              VIEW TAB 3: MANAGE DEPLOYED ACTIVE TASKS & STATUS
              ==================================================== */}
          {pipelineTab === 'active-list' && (
            <motion.div
              key="active-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Toolbar filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-205 dark:border-white/5">
                <div>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                    value={bankCourseFilter}
                    onChange={e => setBankCourseFilter(e.target.value)}
                  >
                    <option value="all">All Live Courses</option>
                    {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                    value={bankBatchFilter}
                    onChange={e => setBankBatchFilter(e.target.value)}
                  >
                    <option value="all">All Live Batches</option>
                    {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Roster list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-300">
                    Currently Deployed {selectedTrack === 'assignment' ? 'Assignments' : 'Evolution Grids'} ({filteredActiveTasks.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">Total active cohorts tracked inline</p>
                </div>

                {filteredActiveTasks.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/20 rounded-2xl border border-slate-100 dark:border-white/5">
                    <Clock className="w-10 h-10 text-slate-350 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No live deployed task records matched.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTrack === 'assignment' ? (
                      /* ASSIGNMENT ROSTER: Allows editing "status" published/closed and deleting assignments */
                      (filteredActiveTasks as StudentAssignment[]).map(asg => (
                        <div
                          key={asg.id}
                          className="p-4 bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/40 relative"
                        >
                          {deletingActiveId === asg.id && (
                            <div className="absolute inset-x-0 inset-y-0 bg-slate-900/98 rounded-2xl flex justify-center items-center z-10 px-4">
                              <p className="text-xs text-white font-bold mr-4">Permanently withdraw homework?</p>
                              <button onClick={() => setDeletingActiveId(null)} className="px-2.5 py-1 text-[10px] bg-slate-850 text-slate-300 rounded mr-2">Cancel</button>
                              <button
                                onClick={() => {
                                  setAssignments(p => p.filter(it => it.id !== asg.id));
                                  setDeletingActiveId(null);
                                }}
                                className="px-2.5 py-1 text-[10px] bg-rose-600 text-white rounded"
                              >
                                Delete
                              </button>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">{asg.title}</span>
                              <span className="text-[10px] text-slate-400">({asg.month}, {asg.week})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                              <span>Course: <b className="text-slate-700 dark:text-zinc-300">{asg.course}</b></span>
                              <span>•</span>
                              <span>Target Batch: <b className="text-slate-705 dark:text-zinc-300">{getBatchDisplayName(asg.batch)}</b></span>
                              <span>•</span>
                              <span>Due: {asg.dueDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* STATUS SELECT DROPDOWN INLINE: "set the status" like before! */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">Class Status:</span>
                              <select
                                value={asg.status}
                                onChange={e => {
                                  const newVal = e.target.value as 'published' | 'closed';
                                  setAssignments(p => p.map(item => item.id === asg.id ? { ...item, status: newVal } : item));
                                }}
                                className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border ${
                                  asg.status === 'published' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                }`}
                              >
                                <option value="published">🟢 Published</option>
                                <option value="closed">🛑 Closed / Draft</option>
                              </select>
                            </div>

                            <button
                              onClick={() => setDeletingActiveId(asg.id)}
                              className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-rose-500/10 text-rose-500 rounded"
                              title="Delete Live Assignment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* CONTINUOUS EVOLUTION BATCH WORKSPACE REPRESENTATIONS */
                      filteredActiveTasks.map(evoGroup => {
                        const castObj = evoGroup as { id: string; course: string; batch: string; month: number; studentsCount: number; title: string };
                        return (
                          <div
                            key={castObj.id}
                            className="p-4 bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 relative"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">Study Month {castObj.month} Continuous Evolution Cards</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-md font-bold uppercase">Active Grid</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                                <span>Course: <b className="text-slate-705 dark:text-zinc-300">{castObj.course}</b></span>
                                <span>•</span>
                                <span>Target Cohort Batch: <b className="text-slate-705 dark:text-zinc-300">{getBatchDisplayName(castObj.batch)}</b></span>
                                <span>•</span>
                                <span>Total Monitored student counts: <b className="text-slate-800 dark:text-zinc-100 font-black">{castObj.studentsCount}</b></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded font-bold uppercase">Status Check: Live tracking</span>
                              
                              <button
                                onClick={() => {
                                  // Reset/Delete continuous tracks for this cohort match
                                  if (confirm(`Do you wish to permanently withdraw continuous monthly evolution grading cards from all ${castObj.studentsCount} students in Course "${castObj.course}" and Batch "${castObj.batch}" for Month ${castObj.month}?`)) {
                                    setStudentEvolutions(p => p.filter(it => !(it.course.toLowerCase() === castObj.course.toLowerCase() && it.batch === castObj.batch && it.month === castObj.month)));
                                  }
                                }}
                                className="p-1.5 bg-slate-50 dark:bg-white/5 hover:bg-rose-500/10 text-rose-500 rounded"
                                title="Delete live evolution trackers"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* ====================================================
              VIEW TAB 4: TEMPLATE FORM CREATION DIRECTORIES
              ==================================================== */}
          {pipelineTab === 'template-form' && (
            <motion.div
              key="template-form-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="border border-slate-150 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-5 shadow-inner">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedTrack === 'assignment' 
                      ? (editingTemplate ? 'Modify Reusable Homework Blueprint' : 'Build Custom Syllabus Assignment Template')
                      : (editingEvoTemplate ? 'Modify Continuous Evaluation Blueprint' : 'Build Custom Monthly Evolution Template')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Construct structured blueprints with precise question metadata, storing them in the reusable template directories.
                  </p>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold leading-normal">
                    {validationError}
                  </div>
                )}

                <form onSubmit={selectedTrack === 'assignment' ? handleSaveAssignmentTemplate : handleSaveEvoTemplate} className="space-y-6">
                  {selectedTrack === 'assignment' ? (
                    /* ASSIGNMENTS TEMPLATE CONFIG FORMS */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Template Title</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)}/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Associated Course Context</label>
                          <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800 dark:text-zinc-200" value={templateCourse} onChange={e => setTemplateCourse(e.target.value)}>
                            {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Template Description</label>
                        <textarea rows={3} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg text-slate-800" value={templateDesc} onChange={e => setTemplateDesc(e.target.value)}/>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Month</label>
                          <select value={templateMonth} onChange={e => setTemplateMonth(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded-lg">
                            {['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Week</label>
                          <select value={templateWeek} onChange={e => setTemplateWeek(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded-lg">
                            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Day</label>
                          <select value={templateDay} onChange={e => setTemplateDay(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 p-2 text-xs rounded-lg">
                            {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-500">Syllabus Tag</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg" value={templateSyllabus} onChange={e => setTemplateSyllabus(e.target.value)}/>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Target Cohort Batch</label>
                          <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg" value={templateBatch} onChange={e => setTemplateBatch(e.target.value)}>
                            <option value="stb_001">Batch A (stb_001)</option>
                            <option value="stb_002">Batch B (stb_002)</option>
                            <option value="stb_003">Batch C (stb_003)</option>
                            <option value="stb_004">Batch D (stb_004)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500">Max Points</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-2 text-xs rounded-lg" value={templateMaxPoints || ''} onChange={e => setTemplateMaxPoints(parseInt(e.target.value) || 0)}/>
                        </div>
                      </div>

                      {/* Code workspace setups */}
                      <div className="space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500">Question Submission Method</label>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setTemplateQuestionType('instruction')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${templateQuestionType === 'instruction' ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-400'}`}>Instruction Prompt</button>
                            <button type="button" onClick={() => setTemplateQuestionType('dsa')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${templateQuestionType === 'dsa' ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-400'}`}>Interactive DSA Code Challenge</button>
                          </div>
                        </div>

                        {templateQuestionType === 'dsa' && (
                          <div className="space-y-4 border-l-2 border-amber-500/20 pl-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-amber-50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/5">
                              <div>
                                <label className="text-[9px] font-bold text-slate-500">DSA Pool Difficulty</label>
                                <select value={templateDsaGenDiff} onChange={e => setTemplateDsaGenDiff(e.target.value as any)} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg text-slate-700 dark:text-zinc-300">
                                  <option value="Easy">Easy Problems</option>
                                  <option value="Medium">Medium Problems</option>
                                  <option value="Hard">Hard Problems</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-500">Challenges quantity</label>
                                <select value={templateDsaGenCount} onChange={e => setTemplateDsaGenCount(parseInt(e.target.value))} className="w-full px-2 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded-lg text-slate-700 dark:text-zinc-300">
                                  <option value={1}>1 Problem</option>
                                  <option value={2}>2 Nested Problems</option>
                                  <option value={3}>3 Combined Problems</option>
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAutoGenerateTemplateDSA(templateDsaGenDiff, templateDsaGenCount)}
                                className="h-9 px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 font-sans cursor-pointer transition flex items-center justify-center gap-1.5"
                              >
                                Generate Challenge
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <textarea placeholder="Detail the coding problem..." rows={2} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={templateDsaQuestion} onChange={e => setTemplateDsaQuestion(e.target.value)}/>
                              <input type="text" placeholder="Constraints..." className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={templateDsaConstraints} onChange={e => setTemplateDsaConstraints(e.target.value)}/>
                              <textarea placeholder="Test Cases..." rows={2} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-2 text-xs rounded text-slate-700 dark:text-zinc-300" value={templateDsaTestCases} onChange={e => setTemplateDsaTestCases(e.target.value)}/>
                              <textarea placeholder="Starter Code Template..." rows={3} className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 p-2 text-xs font-mono rounded text-slate-700 dark:text-zinc-300" value={templateDsaTemplateCode} onChange={e => setTemplateDsaTemplateCode(e.target.value)}/>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* EVOLUTION BLUEPRINTS TEMPLATE CREATION FORMS */
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Blueprint Title</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2 text-xs rounded-xl" value={evoTemplateTitle} onChange={e => setEvoTemplateTitle(e.target.value)} required/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Associated Course roadmap</label>
                          <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 rounded-xl" value={evoTemplateCourse} onChange={e => setEvoTemplateCourse(e.target.value)}>
                            {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Blueprint description</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2 text-xs rounded-xl" value={evoTemplateDesc} onChange={e => setEvoTemplateDesc(e.target.value)} required/>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">Target Study Month (Numerical)</label>
                          <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-205 dark:border-white/10 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 rounded-xl" value={evoTemplateMonth} onChange={e => setEvoTemplateMonth(parseInt(e.target.value))}>
                            {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>Month {num}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Config lines for the 4 separate weeks checkpoints inside blueprint builder */}
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map(wk => {
                          const titleVal = wk === 1 ? tWeek1Title : wk === 2 ? tWeek2Title : wk === 3 ? tWeek3Title : tWeek4Title;
                          const descVal = wk === 1 ? tWeek1Desc : wk === 2 ? tWeek2Desc : wk === 3 ? tWeek3Desc : tWeek4Desc;
                          const typeVal = wk === 1 ? tWeek1Type : wk === 2 ? tWeek2Type : wk === 3 ? tWeek3Type : tWeek4Type;
                          const diffVal = wk === 1 ? w1Diff : wk === 2 ? w2Diff : wk === 3 ? w3Diff : w4Diff;
                          const countVal = wk === 1 ? w1Count : wk === 2 ? w2Count : wk === 3 ? w3Count : w4Count;

                          const setTitle = (val: string) => {
                            if (wk === 1) setTWeek1Title(val); if (wk === 2) setTWeek2Title(val); if (wk === 3) setTWeek3Title(val); if (wk === 4) setTWeek4Title(val);
                          };
                          const setDesc = (val: string) => {
                            if (wk === 1) setTWeek1Desc(val); if (wk === 2) setTWeek2Desc(val); if (wk === 3) setTWeek3Desc(val); if (wk === 4) setTWeek4Desc(val);
                          };
                          const setType = (val: 'dsa' | 'instruction') => {
                            if (wk === 1) setTWeek1Type(val); if (wk === 2) setTWeek2Type(val); if (wk === 3) setTWeek3Type(val); if (wk === 4) setTWeek4Type(val);
                          };
                          const setDiff = (val: 'Easy' | 'Medium' | 'Hard') => {
                            if (wk === 1) setW1Diff(val); if (wk === 2) setW2Diff(val); if (wk === 3) setW3Diff(val); if (wk === 4) setW4Diff(val);
                          };
                          const setCount = (val: number) => {
                            if (wk === 1) setW1Count(val); if (wk === 2) setW2Count(val); if (wk === 3) setW3Count(val); if (wk === 4) setW4Count(val);
                          };

                          return (
                            <div key={wk} className="p-4 bg-slate-50/50 dark:bg-zinc-900 border border-slate-200/60 dark:border-white/10 rounded-2xl space-y-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <span className="text-xs font-black text-indigo-500">Week {wk} Checkpoint Target</span>
                                
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setType('instruction')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${typeVal === 'instruction' ? 'bg-slate-200 dark:bg-white/10 text-slate-800' : 'text-slate-400'}`}>Instruction</button>
                                  <button type="button" onClick={() => setType('dsa')} className={`px-2 py-0.5 text-[9px] rounded font-bold ${typeVal === 'dsa' ? 'bg-slate-200 dark:bg-white/10 text-slate-800' : 'text-slate-400'}`}>DSA Challenge</button>
                                </div>
                              </div>

                              {typeVal === 'dsa' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500">DSA Pool Difficulty</label>
                                    <select value={diffVal} onChange={e => setDiff(e.target.value as any)} className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded">
                                      <option value="Easy">Easy Problems</option>
                                      <option value="Medium">Medium Problems</option>
                                      <option value="Hard">Hard Problems</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500">Challenges Quantity</label>
                                    <select value={countVal} onChange={e => setCount(parseInt(e.target.value))} className="w-full px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 rounded">
                                      <option value={1}>1 Problem</option>
                                      <option value={2}>2 Problems</option>
                                      <option value={3}>3 Problems</option>
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAutoGenerateDSA(wk, diffVal, countVal)}
                                    className="h-8 px-3 bg-amber-500/15 hover:bg-amber-500/20 text-amber-600 text-xs font-bold rounded cursor-pointer transition flex items-center justify-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    Run Builder State
                                  </button>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input type="text" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 px-2.5 py-1.5 text-xs rounded-lg" placeholder="Title..." value={titleVal} onChange={e => setTitle(e.target.value)}/>
                                <input type="text" className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/5 px-2.5 py-1.5 text-xs rounded-lg" placeholder="Desc..." value={descVal} onChange={e => setDesc(e.target.value)}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Form actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                    <button type="button" onClick={() => setPipelineTab('bank')} className="px-4 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer">Save Template to Bank</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
