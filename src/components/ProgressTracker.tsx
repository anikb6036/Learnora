/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord, StudentAssignment, StudentEvolution, Course } from '../types';
import { Award, BookOpen, Clock, Calendar, Plus, CornerDownRight, CheckCircle, Search, Sparkles, Filter, Download, Printer, X, FileCode, Check, Send, ChevronRight, AlertCircle, TrendingUp, Sparkle, Terminal, Code, Copy, History, Play, Flame, RotateCcw, BookOpenText, ChevronLeft, HelpCircle, Maximize2, Settings, ShieldCheck, Layers, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const cleanMilestoneTitle = (title: string): string => {
  return (title || '').replace(/^(Month|Week|Day|Study)\s*\d+\s*[:\-]\s*/i, '').trim();
};

interface ProgressTrackerProps {
  currentUser: UserAccount;
  students: UserAccount[];
  courses?: Course[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
  assignments?: StudentAssignment[];
  onAddProgressRecord: (record: Omit<ProgressRecord, 'id' | 'evaluationDate' | 'instructorId' | 'instructorName'>) => void;
  studentEvolutions?: StudentEvolution[];
  onUpdateStudentEvolutions?: React.Dispatch<React.SetStateAction<StudentEvolution[]>>;
  onSendEmail?: (to: string, subject: string, body: string, fromOverride?: string) => void;
  onUpdateUsers?: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}

export default function ProgressTracker({
  currentUser,
  students,
  courses = [],
  schedules,
  progressRecords,
  assignments = [],
  onAddProgressRecord,
  studentEvolutions = [],
  onUpdateStudentEvolutions,
  onSendEmail,
  onUpdateUsers
}: ProgressTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'traditional' | 'evolution'>('traditional');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'excellent' | 'good' | 'average' | 'needs-improvement'>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active student workspace modal states
  const [selectedActiveWeekIndex, setSelectedActiveWeekIndex] = useState<number | null>(null);
  const [draftResponse, setDraftResponse] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);
  const [workspaceSuccessMsg, setWorkspaceSuccessMsg] = useState<string>('');

  // Interactive LeetCode Workspace Specific States
  const [leftActiveTab, setLeftActiveTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('JavaScript');
  const [testcaseInput, setTestcaseInput] = useState<string>('');
  const [testcaseOutput, setTestcaseOutput] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<{ success: boolean; stdout?: string; error?: string; timeMs?: number; outputVal?: string } | null>(null);
  const [terminalOpen, setTerminalOpen] = useState<boolean>(true);

  // Evolution scoring state variables
  const [selectedEvolutionStudentId, setSelectedEvolutionStudentId] = useState('');
  const [selectedEvolutionCourse, setSelectedEvolutionCourse] = useState('');
  const [selectedEvolutionMonth, setSelectedEvolutionMonth] = useState<number>(1);
  const [ev1Score, setEv1Score] = useState<string>('');
  const [ev2Score, setEv2Score] = useState<string>('');
  const [ev3Score, setEv3Score] = useState<string>('');
  const [ev4Score, setEv4Score] = useState<string>('');
  const [ev1Feedback, setEv1Feedback] = useState<string>('');
  const [ev2Feedback, setEv2Feedback] = useState<string>('');
  const [ev3Feedback, setEv3Feedback] = useState<string>('');
  const [ev4Feedback, setEv4Feedback] = useState<string>('');
  const [evolutionSuccessMessage, setEvolutionSuccessMessage] = useState('');
  const [studentSelectedMonth, setStudentSelectedMonth] = useState<number>(() => {
    if (currentUser.role === 'student' && studentEvolutions.length > 0) {
      const activeEvos = studentEvolutions.filter(ev => ev.studentId === currentUser.id && ev.status !== 'draft');
      if (activeEvos.length > 0) {
        activeEvos.sort((a, b) => b.month - a.month);
        return activeEvos[0].month;
      }
    }
    return currentUser.currentMonth || 1;
  });

  const handleUpdateEvolutionScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvolutionStudentId || !selectedEvolutionCourse || !onUpdateStudentEvolutions) return;

    const studentFound = students.find(s => s.id === selectedEvolutionStudentId);
    const studentName = studentFound?.name || 'Student';
    const studentEmail = studentFound?.email || '';

    // Convert scores safely
    const sc1 = ev1Score !== '' ? parseInt(ev1Score) : undefined;
    const sc2 = ev2Score !== '' ? parseInt(ev2Score) : undefined;
    const sc3 = ev3Score !== '' ? parseInt(ev3Score) : undefined;
    const sc4 = ev4Score !== '' ? parseInt(ev4Score) : undefined;

    onUpdateStudentEvolutions(prev => {
      const existingIdx = prev.findIndex(ev => ev.studentId === selectedEvolutionStudentId && ev.month === selectedEvolutionMonth && ev.course === selectedEvolutionCourse);
      
      let record: StudentEvolution;
      if (existingIdx > -1) {
        record = { ...prev[existingIdx] };
      } else {
        record = {
          id: `evol-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          studentId: selectedEvolutionStudentId,
          studentName,
          course: selectedEvolutionCourse,
          month: selectedEvolutionMonth,
          promoted: false,
          lastUpdated: new Date().toISOString()
        };
      }

      if (sc1 !== undefined) { record.evolution1 = sc1; record.feedback1 = ev1Feedback; }
      if (sc2 !== undefined) { record.evolution2 = sc2; record.feedback2 = ev2Feedback; }
      if (sc3 !== undefined) { record.evolution3 = sc3; record.feedback3 = ev3Feedback; }
      if (sc4 !== undefined) { record.evolution4 = sc4; record.feedback4 = ev4Feedback; }

      // Calculate average score of entered evolutions
      const vals: number[] = [];
      if (record.evolution1 !== undefined) vals.push(record.evolution1);
      if (record.evolution2 !== undefined) vals.push(record.evolution2);
      if (record.evolution3 !== undefined) vals.push(record.evolution3);
      if (record.evolution4 !== undefined) vals.push(record.evolution4);

      const average = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      record.overallScore = average;
      record.lastUpdated = new Date().toISOString();

      // Check if all 4 are completed and average is >= 80% to trigger automatic promote!
      const isCompleteMonth = record.evolution1 !== undefined && 
                              record.evolution2 !== undefined && 
                              record.evolution3 !== undefined && 
                              record.evolution4 !== undefined;

      if (average >= 80 && isCompleteMonth && !record.promoted) {
        record.promoted = true;
        record.promotedDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // 1. Promote student in Users list!
        if (onUpdateUsers) {
          onUpdateUsers(prevUsers => prevUsers.map(u => {
            if (u.id === selectedEvolutionStudentId) {
              const nextMonth = (u.currentMonth || 1) + 1;
              return { ...u, currentMonth: nextMonth };
            }
            return u;
          }));
        }

        // 2. Dispatch simulated email!
        if (onSendEmail && studentEmail) {
          const emailSubject = `🎓 AUTOMATIC PROMOTION ACHIEVED: Month ${selectedEvolutionMonth} Completed with ${average}%!`;
          const emailBody = `Dear ${studentName},\n\nWe are absolutely delighted and proud to inform you that you have met all requirements, cleared Month ${selectedEvolutionMonth} with a distinguished score of ${average}% (Passing Threshold: 80%), and have been AUTOMATICALLY PROMOTED to Month ${selectedEvolutionMonth + 1}!\n\nHere are your month's assessment milestones:\n\n- Evolution 1 Score: ${record.evolution1}%\n- Evolution 2 Score: ${record.evolution2}%\n- Evolution 3 Score: ${record.evolution3}%\n- Evolution 4 Score: ${record.evolution4}%\n\n=================================\n📊 MONTHLY AGGREGATE SCORE: ${average}%\n🏅 PROMOTION STATUS: APPROVED & COMPLETED\n=================================\n\nAs a direct result of your marvelous continuous dedication, class engagement, and milestone performance, your curriculum level has been updated.\n\nKeep pushing limits!\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute\nsupport@learnora.in | www.learnora.in`;
          onSendEmail(studentEmail, emailSubject, emailBody, 'evolution-board@learnora.in');
        }
      }

      const nextList = [...prev];
      if (existingIdx > -1) {
        nextList[existingIdx] = record;
      } else {
        nextList.push(record);
      }
      return nextList;
    });

    setEvolutionSuccessMessage(`Successfully updated evolution database snapshot for ${studentName} (Month ${selectedEvolutionMonth}).`);
    setTimeout(() => setEvolutionSuccessMessage(''), 5000);

    // Reset scores & feedbacks
    setEv1Score('');
    setEv2Score('');
    setEv3Score('');
    setEv4Score('');
    setEv1Feedback('');
    setEv2Feedback('');
    setEv3Feedback('');
    setEv4Feedback('');
  };

  const handleResetMonth = (studentId: string, monthNum: number) => {
    if (!onUpdateStudentEvolutions) return;
    onUpdateStudentEvolutions(prev => {
      return prev.map(ev => {
        if (ev.studentId === studentId && ev.month === monthNum) {
          return {
            ...ev,
            evolution1: undefined,
            evolution2: undefined,
            evolution3: undefined,
            evolution4: undefined,
            feedback1: undefined,
            feedback2: undefined,
            feedback3: undefined,
            feedback4: undefined,
            week1Submission: undefined,
            week1SubmissionDate: undefined,
            week2Submission: undefined,
            week2SubmissionDate: undefined,
            week3Submission: undefined,
            week3SubmissionDate: undefined,
            week4Submission: undefined,
            week4SubmissionDate: undefined,
            overallScore: undefined,
            promoted: false,
            promotedDate: undefined,
            lastUpdated: new Date().toISOString()
          };
        }
        return ev;
      });
    });
  };

  // New Record state
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [score, setScore] = useState(85);
  const [attendance, setAttendance] = useState<'present' | 'absent' | 'excused'>('present');
  const [academicPerformance, setAcademicPerformance] = useState<'excellent' | 'good' | 'average' | 'needs-improvement'>('good');
  const [feedback, setFeedback] = useState('');

  // Handle Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !classId || !feedback) return;

    // Find supplementary details
    const chosenStudent = students.find(s => s.id === studentId);
    const chosenClass = schedules.find(c => c.id === classId);
    if (!chosenStudent || !chosenClass) return;

    onAddProgressRecord({
      studentId,
      studentName: chosenStudent.name,
      classId,
      className: chosenClass.title,
      subject: chosenClass.subject,
      score,
      attendanceStatus: attendance,
      academicPerformance,
      feedback
    });

    // Reset Form
    setStudentId('');
    setClassId('');
    setFeedback('');
    setScore(80);
    setShowAddForm(false);
  };

  // Determine which records display depending on user Role
  const authorizedRecords = progressRecords.filter(rec => {
    if (currentUser.role === 'student') {
      return rec.studentId === currentUser.id;
    }
    // Instructors can see everything, or filter by assigned adviser (we can let them view all for broad dashboard integration!)
    return true;
  });

  // Apply search/filters
  const filteredRecords = authorizedRecords.filter(rec => {
    const matchesSearch = rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerformance = performanceFilter === 'all' || rec.academicPerformance === performanceFilter;
    const matchesSubject = subjectFilter === 'all' || rec.subject === subjectFilter;
    return matchesSearch && matchesPerformance && matchesSubject;
  });

  // Calculate Average score of filtered records
  const averageScore = filteredRecords.length > 0
    ? (filteredRecords.reduce((acc, r) => acc + r.score, 0) / filteredRecords.length).toFixed(1)
    : '0.0';

  const getPerformanceColor = (perf: ProgressRecord['academicPerformance']) => {
    switch (perf) {
      case 'excellent': return 'text-emerald-555 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/20';
      case 'good': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-950/20';
      case 'average': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/20';
      case 'needs-improvement': return 'text-rose-500 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-955/20';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  if (currentUser.role === 'student') {
    const handleOpenWeekWorkspace = (weekIdx: number, evoRec: StudentEvolution | undefined) => {
      setSelectedActiveWeekIndex(weekIdx);
      let subValue = '';
      let testcases = '';
      if (weekIdx === 1) { subValue = evoRec?.week1Submission || ''; testcases = evoRec?.week1TestCases || ''; }
      else if (weekIdx === 2) { subValue = evoRec?.week2Submission || ''; testcases = evoRec?.week2TestCases || ''; }
      else if (weekIdx === 3) { subValue = evoRec?.week3Submission || ''; testcases = evoRec?.week3TestCases || ''; }
      else if (weekIdx === 4) { subValue = evoRec?.week4Submission || ''; testcases = evoRec?.week4TestCases || ''; }
      
      if (!subValue) {
        if (weekIdx === 1 && evoRec?.week1Type === 'dsa') subValue = evoRec.week1TemplateCode || '';
        else if (weekIdx === 2 && evoRec?.week2Type === 'dsa') subValue = evoRec.week2TemplateCode || '';
        else if (weekIdx === 3 && evoRec?.week3Type === 'dsa') subValue = evoRec.week3TemplateCode || '';
        else if (weekIdx === 4 && evoRec?.week4Type === 'dsa') subValue = evoRec.week4TemplateCode || '';
      }
      
      setDraftResponse(subValue);
      setTestcaseInput(testcases);
      setWorkspaceSuccessMsg('');
      setLeftActiveTab('description');
      setRunResult(null);
    };

    const handleSubmitWeekSubmission = (weekIdx: number, evoRec: StudentEvolution | undefined) => {
      if (!onUpdateStudentEvolutions || !evoRec) return;
      onUpdateStudentEvolutions(prev => {
        return prev.map(ev => {
          // match by studentId, month and course or ID
          if (ev.studentId === currentUser.id && ev.month === studentSelectedMonth) {
            const updated = { ...ev, lastUpdated: new Date().toISOString() };
            if (weekIdx === 1) { updated.week1Submission = draftResponse; updated.week1SubmissionDate = new Date().toLocaleString(); }
            if (weekIdx === 2) { updated.week2Submission = draftResponse; updated.week2SubmissionDate = new Date().toLocaleString(); }
            if (weekIdx === 3) { updated.week3Submission = draftResponse; updated.week3SubmissionDate = new Date().toLocaleString(); }
            if (weekIdx === 4) { updated.week4Submission = draftResponse; updated.week4SubmissionDate = new Date().toLocaleString(); }
            return updated;
          }
          return ev;
        });
      });
      setWorkspaceSuccessMsg('Congratulations! Your checkpoint solution has been successfully submitted to your Instructor for review.');
      setTimeout(() => {
        setSelectedActiveWeekIndex(null);
      }, 2500);
    };

    const handleRunCode = () => {
      setIsRunningCode(true);
      setRunResult(null);
      setTerminalOpen(true);
      
      setTimeout(() => {
        const startTime = performance.now();
        try {
          const codeToRun = draftResponse;
          let targetFuncName = 'twoSum';
          if (codeToRun.includes('isValid')) targetFuncName = 'isValid';
          else if (codeToRun.includes('maxProfit')) targetFuncName = 'maxProfit';
          else if (codeToRun.includes('lengthOfLongestSubstring')) targetFuncName = 'lengthOfLongestSubstring';
          else if (codeToRun.includes('maxArea')) targetFuncName = 'maxArea';
          else if (codeToRun.includes('threeSum')) targetFuncName = 'threeSum';
          else if (codeToRun.includes('trap')) targetFuncName = 'trap';
          else if (codeToRun.includes('findMedianSortedArrays')) targetFuncName = 'findMedianSortedArrays';

          let parsedInput: any[] = [];
          if (targetFuncName === 'twoSum') {
            parsedInput = [[2, 7, 11, 15], 9];
          } else if (targetFuncName === 'isValid') {
            parsedInput = ["()[]{}"];
          } else if (targetFuncName === 'maxProfit') {
            parsedInput = [[7, 1, 5, 3, 6, 4]];
          } else if (targetFuncName === 'lengthOfLongestSubstring') {
            parsedInput = ["abcabcbb"];
          } else if (targetFuncName === 'maxArea') {
            parsedInput = [[1, 8, 6, 2, 5, 4, 8, 3, 7]];
          } else if (targetFuncName === 'threeSum') {
            parsedInput = [[-1, 0, 1, 2, -1, -4]];
          } else if (targetFuncName === 'trap') {
            parsedInput = [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]];
          } else if (targetFuncName === 'findMedianSortedArrays') {
            parsedInput = [[1, 3], [2]];
          }

          if (testcaseInput && testcaseInput.trim()) {
            try {
              const rawInp = testcaseInput.trim();
              if (rawInp.startsWith('[') && rawInp.endsWith(']')) {
                const parsed = JSON.parse(rawInp);
                if (Array.isArray(parsed)) {
                  parsedInput = parsed;
                } else {
                  parsedInput = [parsed];
                }
              } else {
                parsedInput = [rawInp];
              }
            } catch (e) {
              // use default
            }
          }

          const fullExecutionJs = `
            ${codeToRun}
            return ${targetFuncName}.apply(null, ${JSON.stringify(parsedInput)});
          `;

          const evaluator = new Function(fullExecutionJs);
          const returnVal = evaluator();
          const endTime = performance.now();
          const timeElapsed = (endTime - startTime).toFixed(2);

          setRunResult({
            success: true,
            stdout: `Executed entrypoint: ${targetFuncName}() with args: ${JSON.stringify(parsedInput)}`,
            outputVal: JSON.stringify(returnVal),
            timeMs: parseFloat(timeElapsed)
          });
        } catch (err: any) {
          setRunResult({
            success: false,
            error: err?.message || 'SyntaxError during browser static execution context analysis.'
          });
        } finally {
          setIsRunningCode(false);
        }
      }, 1000);
    };

    const studentAssignmentsList = assignments.filter(asg => {
      const matchesCourse = !asg.course || asg.course === 'All' || (currentUser.course && asg.course.toLowerCase() === currentUser.course.toLowerCase());
      const matchesBatch = !asg.batch || asg.batch === 'All' || (currentUser.batch && asg.batch.toLowerCase() === currentUser.batch.toLowerCase());
      const matchingClass = schedules.find(s => s.id === asg.classId);
      const isEnrolledInClass = matchingClass?.enrolledStudentIds?.includes(currentUser.id);
      return (matchesCourse && matchesBatch) || isEnrolledInClass;
    });

    const currentCourseInfo = (() => {
      if (!currentUser.course || !courses || courses.length === 0) return undefined;
      const userCourseClean = currentUser.course.trim().replace(/\.+$/, "").toLowerCase();
      const userBatchClean = currentUser.batch?.trim().toLowerCase() || "";
      
      let matched = undefined;
      if (userBatchClean) {
        matched = courses.find(c => {
          const cId = c.id?.trim().toLowerCase() || "";
          const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
          const cCode = c.code?.trim().toLowerCase() || "";
          const cBatch = c.batchNumber?.trim().toLowerCase() || "";
          const isCourseMatch = cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
          const isBatchMatch = cBatch === userBatchClean || cCode === userBatchClean;
          return isCourseMatch && isBatchMatch;
        });
      }
      if (matched) return matched;
      return courses.find(c => c.name.toLowerCase() === userCourseClean);
    })();
    const totalEvolutionsCount = currentCourseInfo?.roadmap?.length || currentCourseInfo?.durationMonths || 6;

    const studentClearedEvolutions = studentEvolutions.filter(ev => 
      ev.studentId === currentUser.id && ev.promoted === true
    );

    const totalEvaluations = totalEvolutionsCount;
    const completedEvaluations = studentClearedEvolutions.length;
    const progressPercentage = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;
    const isComplete = totalEvaluations > 0 && completedEvaluations >= totalEvaluations;

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const certNo = currentUser.universalId ? `LRN-${currentUser.universalId}` : `LRN-2024-${currentUser.id.slice(0, 6).toUpperCase()}`;
    const studentIdNo = currentUser.universalId ? `STU-${currentUser.universalId}` : `STU-2024-${currentUser.id.slice(0, 6).toUpperCase()}`;
    const courseName = currentUser.course || 'Learnora Elite Coaching Program';

    const downloadCertificateAsPNG = () => {
      setIsGenerating(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // 1. Off-white clean background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1920, 1080);

      // Fine grid dots pattern for high-end academic feel
      ctx.fillStyle = 'rgba(74, 85, 104, 0.05)';
      for (let x = 60; x < 1860; x += 30) {
        for (let y = 60; y < 1020; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Solid Navy & Red Top-Right Curves (Matches reference shape)
      ctx.save();
      // Navy curved shape
      ctx.fillStyle = '#102a43';
      ctx.beginPath();
      ctx.moveTo(1350, 0);
      ctx.lineTo(1920, 0);
      ctx.lineTo(1920, 480);
      ctx.bezierCurveTo(1800, 310, 1600, 150, 1350, 0);
      ctx.closePath();
      ctx.fill();

      // Red sweep accent
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(1310, 0);
      ctx.bezierCurveTo(1570, 170, 1770, 315, 1920, 485);
      ctx.lineTo(1920, 520);
      ctx.bezierCurveTo(1740, 320, 1540, 190, 1270, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Code Watermark on Navy Shape
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.font = 'bold 150px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(1730, 190);
      ctx.rotate(0.25);
      ctx.fillText('</>', 0, 0);
      ctx.restore();

      // 3. Elegant Outer Navy Frame Border
      ctx.strokeStyle = '#102a43';
      ctx.lineWidth = 12;
      ctx.strokeRect(36, 36, 1920 - 72, 1080 - 72);

      // Thin inner gap line
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(52, 52, 1920 - 104, 1080 - 104);

      // Curved thin geometric wireframe overlay on lower-left background
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.03)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        ctx.moveTo(50, 300 + i * 15);
        ctx.bezierCurveTo(500, 400 - i * 10, 200, 950 + i * 10, 50, 1000 - i * 5);
      }
      ctx.stroke();
      ctx.restore();

      // 4. Logo Brand Header (Top Left Context)
      ctx.save();
      // Draw standard "Learn" in navy and "ora" in red
      ctx.font = '700 60px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#102a43';
      ctx.fillText('Learn', 110, 150);
      const learnWidth = ctx.measureText('Learn').width;
      ctx.fillStyle = '#e11d48';
      ctx.fillText('ora', 110 + learnWidth, 150);
      const totalLogoWidth = learnWidth + ctx.measureText('ora').width;

      // Draw academic tilted graduation cap over the 'o' of Learnora
      const capX = 110 + learnWidth + 24;
      const capY = 90;
      ctx.fillStyle = '#102a43';
      ctx.beginPath();
      ctx.moveTo(capX, capY - 18);
      ctx.lineTo(capX + 32, capY);
      ctx.lineTo(capX, capY + 18);
      ctx.lineTo(capX - 32, capY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(capX, capY + 5, 14, 0, Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(capX, capY);
      ctx.lineTo(capX + 22, capY + 16);
      ctx.stroke();

      // Sub-brand tagline: "LEARN. GROW. SUCCEED."
      ctx.fillStyle = '#627d98';
      ctx.font = '600 13.5px monospace';
      ctx.fillText('L E A R N .   G R O W .   S U C C E E D .', 110, 195);

      // Small logo horizontal underlines
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(110, 210);
      ctx.lineTo(110 + totalLogoWidth + 20, 210);
      ctx.stroke();
      ctx.restore();

      // 5. High-End Top Right Certificate ID & Student ID
      ctx.save();
      ctx.textAlign = 'right';
      ctx.fillStyle = '#102a43';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`CERTIFICATE ID: ${certNo}`, 1800, 105);
      ctx.fillStyle = '#486581';
      ctx.font = '600 14px monospace';
      ctx.fillText(`STUDENT ID NO: ${studentIdNo}`, 1800, 130);
      ctx.restore();

      // 6. Centered Title Blocks
      const contentCenterX = 1920 / 2 + 100; // Offset center for side-perks visual balance

      // Heading "C E R T I F I C A T E"
      ctx.textAlign = 'center';
      ctx.fillStyle = '#102a43';
      ctx.font = '800 86px "Plus Jakarta Sans", "Arial Black", sans-serif';
      ctx.fillText('CERTIFICATE', contentCenterX, 310);

      // Subtitle "OF COMPLETION"
      ctx.fillStyle = '#e11d48';
      ctx.font = '700 24px monospace';
      ctx.fillText('O F   C O M P L E T I O N', contentCenterX, 370);

      // Small graphic lines framing OF COMPLETION
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(contentCenterX - 300, 362);
      ctx.lineTo(contentCenterX - 180, 362);
      ctx.moveTo(contentCenterX + 180, 362);
      ctx.lineTo(contentCenterX + 300, 362);
      ctx.stroke();

      // Intro sentence
      ctx.fillStyle = '#486581';
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillText('This is to certify that', contentCenterX, 425);

      // 7. Student Name - Signature Cursive Font Callout
      ctx.fillStyle = '#102a43';
      ctx.font = 'italic 72px "Great Vibes", "Alex Brush", "Brush Script MT", cursive';
      ctx.fillText(currentUser.name, contentCenterX, 500);

      // Signature underline accent
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(contentCenterX - 280, 525);
      ctx.lineTo(contentCenterX + 280, 525);
      ctx.stroke();

      // Description words
      ctx.fillStyle = '#486581';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('has successfully completed the online course', contentCenterX, 570);

      // Course Name
      ctx.fillStyle = '#102a43';
      ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(courseName, contentCenterX, 620);

      // Course Red Underline Anchor
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(contentCenterX - 100, 642, 200, 4);

      // Broad Description Paragraph
      ctx.fillStyle = '#627d98';
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillText('This course covered essential concepts, hands-on projects, and practical skills', contentCenterX, 680);
      ctx.fillText('to strengthen your knowledge and expertise in advanced industrial applications.', contentCenterX, 705);

      // 8. Vertical Left Benefit Icons & Badges (Laptop, Expert, Career Boost)
      ctx.save();
      const colX = 170;
      const drawVerticalBadgeCount = (y, numberLabel, textLabel) => {
        // Rounded light icon background
        ctx.fillStyle = '#f0f4f8';
        ctx.beginPath();
        ctx.arc(colX + 30, y, 30, 0, Math.PI * 2);
        ctx.fill();

        // Little red anchor notch
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(colX + 5, y - 10, 4, 20);

        // Badge Numbering & labels
        ctx.fillStyle = '#102a43';
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(numberLabel, colX + 80, y - 5);
        ctx.fillStyle = '#486581';
        ctx.font = '600 11px monospace';
        ctx.fillText(textLabel, colX + 80, y + 13);
      };

      // Draw online laptop stylized
      drawVerticalBadgeCount(580, 'ONLINE COURSE', 'FLEXIBLE ACCESS');
      ctx.strokeStyle = '#102a43';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(colX + 18, 570, 24, 16);
      ctx.strokeStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(colX + 11, 587);
      ctx.lineTo(colX + 49, 587);
      ctx.stroke();

      // Draw Expert ribbon stylized
      drawVerticalBadgeCount(670, 'EXPERT INSTRUCTORS', 'ADVISORY BOARD APPROVED');
      ctx.strokeStyle = '#102a43';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(colX + 30, 665, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(colX + 27, 675);
      ctx.lineTo(colX + 22, 690);
      ctx.lineTo(colX + 30, 683);
      ctx.lineTo(colX + 38, 690);
      ctx.lineTo(colX + 33, 675);
      ctx.fill();

      // Draw Analytics chart stylized
      drawVerticalBadgeCount(760, 'SKILL ADVANCEMENT', 'CURRICULUM DIRECTIVE');
      ctx.fillStyle = '#102a43';
      ctx.fillRect(colX + 20, 755, 5, 12);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(colX + 28, 747, 5, 20);
      ctx.fillStyle = '#102a43';
      ctx.fillRect(colX + 36, 751, 5, 16);
      ctx.restore();

      // 9. Signatures Block
      const sigLeftX = contentCenterX - 250;
      const sigRightX = contentCenterX + 250;
      const sigLineY = 880;

      // Draw signature line paths
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sigLeftX - 120, sigLineY);
      ctx.lineTo(sigLeftX + 120, sigLineY);
      ctx.moveTo(sigRightX - 120, sigLineY);
      ctx.lineTo(sigRightX + 120, sigLineY);
      ctx.stroke();

      // Handwriting signature overlays
      ctx.fillStyle = '#102a43';
      ctx.font = 'italic 34px "Great Vibes", "Alex Brush", cursive';
      ctx.fillText('Anand Sharma', sigLeftX, sigLineY - 30);
      ctx.fillStyle = '#e11d48';
      ctx.fillText('Priya Verma', sigRightX, sigLineY - 30);

      // Printed designations
      ctx.fillStyle = '#102a43';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Anand Sharma', sigLeftX, sigLineY + 25);
      ctx.fillStyle = '#627d98';
      ctx.font = '500 13px sans-serif';
      ctx.fillText('Founder & CEO, Learnora', sigLeftX, sigLineY + 45);

      ctx.fillStyle = '#102a43';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Priya Verma', sigRightX, sigLineY + 25);
      ctx.fillStyle = '#627d98';
      ctx.font = '500 13px sans-serif';
      ctx.fillText('Lead Academic Instructor', sigRightX, sigLineY + 45);

      // 10. Center Crest Seal with laurels
      const sealX = contentCenterX;
      const sealY = 840;

      // Gold badge circular background
      ctx.save();
      ctx.fillStyle = '#102a43';
      ctx.beginPath();
      ctx.arc(sealX, sealY, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inside mini graduation hat emblem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sealX, sealY - 14);
      ctx.lineTo(sealX + 22, sealY - 2);
      ctx.lineTo(sealX, sealY + 10);
      ctx.lineTo(sealX - 22, sealY - 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sealX, sealY + 2, 8, 0, Math.PI);
      ctx.fill();

      // Wreath Left Wreath Right
      ctx.strokeStyle = '#627d98';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sealX - 44, sealY, 35, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sealX + 44, sealY, 35, Math.PI * 1.5, Math.PI * 2.5);
      ctx.stroke();
      ctx.restore();

      // 11. Scannable QR Code element at Bottom Right
      const qrBoxX = 1680;
      const qrBoxY = 780;
      const qrSize = 120;

      // Draw neat outer line card for QR
      ctx.strokeStyle = 'rgba(16, 42, 67, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(qrBoxX - 8, qrBoxY - 8, qrSize + 16, qrSize + 16);

      // Labeled subtitle under QR
      ctx.textAlign = 'center';
      ctx.fillStyle = '#102a43';
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Verify Certificate', qrBoxX + qrSize / 2, qrBoxY + qrSize + 28);
      ctx.fillStyle = '#e11d48';
      ctx.font = '600 10.5px monospace';
      ctx.fillText('learnora.in/verify', qrBoxX + qrSize / 2, qrBoxY + qrSize + 43);

      // Load scan QR code asynchronously
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';

      const triggerDownloadPng = () => {
        try {
          const url = canvas.toDataURL('image/png');
          const element = document.createElement('a');
          element.download = `learnora_certificate_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}.png`;
          element.href = url;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        } catch (err) {
          console.error('PNG download failure', err);
        } finally {
          setIsGenerating(false);
        }
      };

      qrImg.onload = () => {
        try {
          ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);
        } catch (e) {
          console.error('Could not draw QR code image', e);
        }
        triggerDownloadPng();
      };

      qrImg.onerror = () => {
        // Fallback Vector authentic representation
        ctx.fillStyle = '#000000';
        ctx.fillRect(qrBoxX, qrBoxY, qrSize, qrSize);
        // Finder patterns in corners
        const findPattern = (px, py) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px, py, 34, 34);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 6, py + 6, 22, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 11, py + 11, 12, 12);
        };
        findPattern(qrBoxX + 4, qrBoxY + 4);
        findPattern(qrBoxX + qrSize - 38, qrBoxY + 4);
        findPattern(qrBoxX + 4, qrBoxY + qrSize - 38);

        // Dynamic points inside mock codes
        ctx.fillStyle = '#ffffff';
        for (let idx = 0; idx < 20; idx++) {
          const rx = qrBoxX + 40 + Math.random() * 40;
          const ry = qrBoxY + 40 + Math.random() * 40;
          ctx.fillRect(rx, ry, 6, 6);
        }
        triggerDownloadPng();
      };

      // Set API QR source
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://learnora.in/verify/${certNo}`;

      // 12. Solid Blue Footer bar
      ctx.fillStyle = '#102a43';
      ctx.fillRect(36, 1020, 1920 - 72, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 11.5px monospace';
      ctx.textAlign = 'center';
      const footerY = 1036;
      ctx.fillText(`www.learnora.in     |     Issued on: ${todayStr}     |     support@learnora.in`, 1920 / 2, footerY);
    };

    const getCertificateHTML = (isForDownload: boolean) => {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate Of Completion - ${currentUser.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Great+Vibes&family=JetBrains+Mono:wght@400;600&display=swap');
    
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: ${isForDownload ? '40px' : '0'};
      background-color: ${isForDownload ? '#f0f4f8' : '#ffffff'};
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cert-container {
      width: 1000px;
      height: 700px;
      background: #ffffff;
      padding: 24px;
      position: relative;
      ${isForDownload ? 'box-shadow: 0 25px 50px -12px rgba(16, 42, 67, 0.25); border-radius: 16px;' : ''}
      overflow: hidden;
    }
    
    .navy-curve {
      position: absolute;
      top: 0;
      right: 0;
      width: 320px;
      height: 320px;
      background: #102a43;
      border-bottom-left-radius: 100%;
      z-index: 1;
    }
    .red-curve {
      position: absolute;
      top: 0;
      right: 0;
      width: 340px;
      height: 340px;
      background: #e11d48;
      border-bottom-left-radius: 100%;
      z-index: 0;
    }
    .code-bg {
      position: absolute;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 800;
      font-size: 80px;
      color: rgba(255, 255, 255, 0.08);
      top: 70px;
      right: 70px;
      z-index: 2;
      transform: rotate(15deg);
      user-select: none;
    }
    
    .outer-border {
      width: 100%;
      height: 100%;
      border: 8px solid #102a43;
      position: relative;
      z-index: 3;
    }
    .inner-border {
      width: 100%;
      height: 100%;
      border: 1.5px solid rgba(16, 42, 67, 0.15);
      margin: 0;
      padding: 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    
    .dot-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: radial-gradient(rgba(72, 101, 129, 0.08) 1.5px, transparent 1.5px);
      background-size: 24px 24px;
      z-index: -1;
    }

    .logo-container {
      text-align: left;
      font-size: 32px;
      font-weight: 800;
      color: #102a43;
      line-height: 1;
      display: inline-block;
      position: relative;
    }
    .logo-txt-red {
      color: #e11d48;
    }
    .tagline {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      color: #627d98;
      letter-spacing: 2px;
      margin-top: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    
    .header-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .ids-block {
      text-align: right;
      font-size: 11px;
      font-weight: 700;
      color: #102a43;
      margin-top: 5px;
    }
    .student-id {
      color: #486581;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      margin-top: 2px;
    }
    
    .main-content {
      text-align: center;
      margin-left: 140px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .main-title {
      font-size: 44px;
      font-weight: 800;
      color: #102a43;
      letter-spacing: 2px;
      margin: 0;
      line-height: 1;
    }
    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #e11d48;
      letter-spacing: 4px;
      margin: 6px 0 15px;
    }
    .present-text {
      font-style: italic;
      color: #486581;
      font-size: 13px;
      margin-bottom: 8px;
      font-family: serif;
    }
    .student-name {
      font-family: 'Great Vibes', cursive;
      font-size: 48px;
      color: #102a43;
      margin: 0 auto;
      line-height: 1.1;
      border-bottom: 1.5px solid rgba(16, 42, 67, 0.15);
      padding-bottom: 2px;
      display: inline-block;
      min-width: 320px;
    }
    .course-intro {
      font-size: 11.5px;
      color: #486581;
      margin: 15px 0 5px;
      font-weight: 500;
    }
    .course-title {
      font-size: 22px;
      font-weight: 800;
      color: #102a43;
      margin: 0;
    }
    .course-underline {
      width: 100px;
      height: 3px;
      background: #e11d48;
      margin: 8px auto 12px;
    }
    .course-description {
      font-size: 10.5px;
      color: #627d98;
      max-width: 520px;
      margin: 0 auto;
      line-height: 1.5;
      font-style: italic;
      font-family: serif;
    }

    .benefit-sidebar {
      position: absolute;
      left: 30px;
      top: 135px;
      width: 180px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .benefit-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f0f4f8;
      border-left: 2.5px solid #e11d48;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .benefit-svg {
      width: 14px;
      height: 14px;
      color: #102a43;
    }
    .benefit-details {
      display: flex;
      flex-direction: column;
    }
    .benefit-title {
      font-size: 8px;
      font-weight: 800;
      color: #102a43;
    }
    .benefit-subtitle {
      font-size: 7px;
      font-family: 'JetBrains Mono', monospace;
      color: #627d98;
      font-weight: 600;
    }
    
    .footer-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
      padding: 0 10px;
    }
    .signature-block {
      text-align: center;
      width: 180px;
    }
    .signature-handwriting {
      font-family: 'Great Vibes', cursive;
      font-size: 24px;
      margin-bottom: -5px;
      line-height: 1;
    }
    .sig-ceo {
      color: #102a43;
    }
    .sig-inst {
      color: #e11d48;
    }
    .signature-line {
      border-top: 1px solid rgba(16, 42, 67, 0.3);
      padding-top: 4px;
    }
    .signature-name {
      font-weight: 700;
      color: #102a43;
      font-size: 10px;
    }
    .signature-title {
      color: #627d98;
      font-size: 8px;
      font-weight: 500;
      margin-top: 1px;
    }
    
    .crest-seal {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .seal-circle {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #102a43;
      border: 2px solid #e11d48;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 15px;
    }
    .laurel-leaves {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #627d98;
      margin-top: 4px;
    }
    
    .qr-block {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }
    .qr-img-box {
      width: 64px;
      height: 64px;
      border: 1px solid rgba(16, 42, 67, 0.15);
      padding: 2px;
      background: #ffffff;
    }
    .qr-img {
      width: 58px;
      height: 58px;
      display: block;
    }
    .qr-txt-box {
      display: flex;
      flex-direction: column;
    }
    .qr-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #102a43;
    }
    .qr-link {
      font-size: 7.5px;
      font-family: 'JetBrains Mono', monospace;
      color: #e11d48;
      font-weight: 600;
      margin-top: 2px;
    }
    
    .blue-footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 16px;
      background: #102a43;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5px;
      font-weight: 600;
      letter-spacing: 1.5px;
    }
    
    .actions-bar {
      margin-top: 25px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn-action {
      padding: 10px 20px;
      background: #102a43;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 750;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(16, 42, 67, 0.15);
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: #e11d48;
    }
    
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .actions-bar {
        display: none !important;
      }
      .cert-container {
        box-shadow: none;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="cert-container" id="cert-wrapper">
    <div class="navy-curve"></div>
    <div class="red-curve"></div>
    <div class="code-bg">&lt;/&gt;</div>
    
    <div class="outer-border">
      <div class="inner-border">
        <div class="dot-pattern"></div>
        
        <div class="header-block">
          <div class="logo-container">
            <span>Learn</span><span class="logo-txt-red">ora</span>
            <div class="tagline">L E A R N .   G R O W .   S U C C E E D .</div>
          </div>
          
          <div class="ids-block">
            <div>CERTIFICATE ID: ${certNo}</div>
            <div class="student-id">STUDENT ID NO: ${studentIdNo}</div>
          </div>
        </div>
        
        <div style="display: flex; flex-grow: 1; align-items: center; position: relative;">
          <div class="benefit-sidebar">
            <div class="benefit-item">
              <div class="benefit-icon-box">
                <svg class="benefit-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div class="benefit-details">
                <span class="benefit-title">ONLINE COURSE</span>
                <span class="benefit-subtitle">FLEXIBLE ACCESS</span>
              </div>
            </div>
            
            <div class="benefit-item">
              <div class="benefit-icon-box">
                <svg class="benefit-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <div class="benefit-details">
                <span class="benefit-title">EXPERT INSTRUCTORS</span>
                <span class="benefit-subtitle">BOARD APPROVED</span>
              </div>
            </div>
            
            <div class="benefit-item">
              <div class="benefit-icon-box">
                <svg class="benefit-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"></path>
                  <path d="M9 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"></path>
                </svg>
              </div>
              <div class="benefit-details">
                <span class="benefit-title">SKILL ADVANCEMENT</span>
                <span class="benefit-subtitle">DIRECTIVE CERT</span>
              </div>
            </div>
          </div>
          
          <div class="main-content">
            <h1 class="main-title">CERTIFICATE</h1>
            <div class="subtitle">O F   C O M P L E T I O N</div>
            
            <div class="present-text">This is proudly presented to</div>
            <div class="student-name">${currentUser.name}</div>
            
            <div class="course-intro">has successfully completed the online course</div>
            <h2 class="course-title">"${courseName}"</h2>
            <div class="course-underline"></div>
            
            <p class="course-description">
              This course covered essential concepts, hands-on projects, and practical skills to strengthen your knowledge and expertise in advanced industrial applications.
            </p>
          </div>
        </div>
        
        <div class="footer-block">
          <div class="signature-block">
            <div class="signature-handwriting sig-ceo">Anand Sharma</div>
            <div class="signature-line">
              <div class="signature-name">Anand Sharma</div>
              <div class="signature-title">Founder & CEO, Learnora</div>
            </div>
          </div>
          
          <div class="crest-seal">
            <div class="seal-circle">🛡️</div>
            <div class="laurel-leaves">OFFICIAL SEAL</div>
          </div>
          
          <div class="signature-block">
            <div class="signature-handwriting sig-inst">Priya Verma</div>
            <div class="signature-line">
              <div class="signature-name">Priya Verma</div>
              <div class="signature-title">Lead Academic Instructor</div>
            </div>
          </div>
          
          <div class="qr-block">
            <div class="qr-img-box">
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://learnora.in/verify/${certNo}" alt="Verification QR Code" />
            </div>
            <div class="qr-txt-box">
              <span class="qr-title">Verify Certificate</span>
              <span class="qr-link">learnora.in/verify</span>
            </div>
          </div>
        </div>
        
        <div class="blue-footer-bar">
          WWW.LEARNORA.IN &nbsp;|&nbsp; ISSUED ON: ${todayStr} &nbsp;|&nbsp; SUPPORT@LEARNORA.IN
        </div>
      </div>
    </div>
  </div>
  
  ${isForDownload ? `
  <div class="actions-bar">
    <button class="btn-action" onclick="window.print()">
      Print or Save as PDF
    </button>
  </div>
  ` : `
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
  `}
</body>
</html>`;
    };

    const downloadCertificateAsHTML = () => {
      const htmlContent = getCertificateHTML(true);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `learnora_certificate_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}.html`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const isWeeks = currentCourseInfo?.durationUnit === 'weeks';
    const unitLabel = isWeeks ? 'Week' : 'Month';
    const subUnitLabel = isWeeks ? 'Day' : 'Week';

    return (
      <div className="space-y-6 font-sans">
        {/* Toggle switch for student view */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl max-w-md border border-slate-200 shadow-sm mb-6">
          <button
            onClick={() => setActiveSubTab('traditional')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'traditional'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Certificate Milestones
          </button>
          <button
            onClick={() => setActiveSubTab('evolution')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'evolution'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {isWeeks ? 'Weekly' : 'Monthly'} Evolution Track
          </button>
        </div>

        {activeSubTab === 'traditional' ? (
          <div className="space-y-6">
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Progress Hub Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
                      <Award className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Certificate Milestones</h2>
                      <p className="text-xs text-slate-400 font-medium">Verify completion stages to unlock your credentials</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    Each {isWeeks ? 'week' : 'month'} requires completing all weekly assignments and continuous evolution challenges. Reach an average of <span className="font-semibold text-slate-900">80% or higher</span> to advance.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Syllabus Progress</span>
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute top-0 left-0 bottom-0 right-0 w-full h-full animate-shimmer" style={{
                        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)',
                        backgroundSize: '200% 100%'
                      }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {completedEvaluations} of {totalEvaluations} {isWeeks ? 'week' : 'month'} evolutions verified
                  </p>
                </div>
              </div>

              {/* Status Side Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-28 h-28 text-slate-100 opacity-40 pointer-events-none select-none">
                  <Award className="w-full h-full" />
                </div>
                
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Security Status
                  </span>
                  
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1 tracking-tight">Credential Status</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isComplete 
                      ? "Congratulations! Your completion certificate has been generated and signed successfully." 
                      : `Keep completing your modules. Your certificate will be issued automatically upon reaching 100% completion.`}
                  </p>
                </div>

                <div className="relative z-10 pt-6">
                  {isComplete ? (
                    <button
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                      onClick={() => setShowCertificateModal(true)}
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      Download Certificate
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Course in Progress
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Congratulations Banner */}
            {isComplete && (
              <div className="p-5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-emerald-950">Certificate unlocked!</h4>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed max-w-2xl">
                    All required monthly/weekly evolutions have been graded and approved. You can download your official certificate of completion above.
                  </p>
                </div>
              </div>
            )}

            {/* Milestones List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Milestone Modules</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Standard passing rate is 80%</span>
              </div>

              <div className="space-y-4">
                {Array.from({ length: totalEvaluations }, (_, i) => i + 1).map((m) => {
                  const evoRec = studentEvolutions.find(ev => ev.studentId === currentUser.id && ev.month === m && ev.status !== 'draft');
                  const scoresCount = evoRec ? [evoRec.evolution1, evoRec.evolution2, evoRec.evolution3, evoRec.evolution4].filter(s => s !== undefined).length : 0;
                  const overallPass = evoRec?.overallScore !== undefined && evoRec.overallScore >= 80;
                  const isCleared = evoRec?.promoted === true;
                  const isRedo = scoresCount === 4 && !overallPass;
                  const isLocked = m > (currentUser.currentMonth || 1);
                  const isInProgress = m === (currentUser.currentMonth || 1) && !isCleared;

                  return (
                    <div 
                      key={m} 
                      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                        isCleared 
                          ? 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/[0.01]' 
                          : isRedo 
                          ? 'bg-white border-slate-200 hover:border-red-300 hover:bg-red-50/[0.01]' 
                          : isInProgress 
                          ? 'bg-white border-indigo-200 hover:border-indigo-300 shadow-[0_4px_12px_rgba(79,70,229,0.03)] ring-1 ring-indigo-50/20'
                          : 'bg-slate-50 border-slate-100 opacity-75'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Dynamic Clean Circular Badge Icon */}
                        <div className="shrink-0 mt-0.5">
                          {isCleared ? (
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm text-emerald-600">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                          ) : isRedo ? (
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm text-red-600">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                          ) : isInProgress ? (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm text-indigo-600">
                              <Clock className="w-5 h-5 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100/60 flex items-center justify-center border border-slate-200 text-slate-400">
                              <span className="text-sm font-semibold">0{m}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-[14px] font-bold tracking-tight ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                              Study {unitLabel} {m} Evaluation
                            </h4>
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Locked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {isCleared 
                              ? `Cleared successfully with an outstanding overall average of ${evoRec?.overallScore}%.` 
                              : isRedo 
                              ? `Current average of ${evoRec?.overallScore}% did not satisfy the 80% target. Reset required.` 
                              : isInProgress 
                              ? `Currently active. ${scoresCount} of 4 ${isWeeks ? 'daily' : 'weekly'} submissions graded.` 
                              : `Requires clearing all prerequisites and Study ${unitLabel} ${m - 1} evaluation.`}
                          </p>
                        </div>
                      </div>

                      {/* Status / Button Right Block */}
                      <div className="w-full md:w-auto flex items-center justify-end border-t md:border-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 gap-3 shrink-0">
                        {isCleared ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg tracking-tight uppercase">
                              Passed &bull; {evoRec?.overallScore}%
                            </span>
                          </div>
                        ) : isRedo ? (
                          <div className="flex flex-col items-end gap-2 w-full">
                            <span className="text-[11px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg tracking-tight uppercase">
                              Failed &bull; {evoRec?.overallScore}%
                            </span>
                            <button
                              onClick={() => handleResetMonth(currentUser.id, m)}
                              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" /> Start Over
                            </button>
                          </div>
                        ) : isInProgress ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg tracking-tight uppercase">
                              In Progress
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg tracking-tight uppercase">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* THE NEW STUDENT MONTHLY EVOLUTION SYSTEM VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    {unitLabel} Evolution Track
                  </h1>
                  <p className="text-xs text-slate-500 max-w-xl mt-1 leading-relaxed">
                    Continuous syllabus structured in 4 {subUnitLabel.toLowerCase()} evaluations. Reach an average of <span className="font-semibold text-slate-900">80% or above</span> to clear this module level.
                  </p>
                </div>

                {/* Month selector */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 pl-2">Select Study {unitLabel}:</span>
                  <select
                    value={studentSelectedMonth}
                    onChange={(e) => setStudentSelectedMonth(parseInt(e.target.value))}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-800 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
                  >
                    {Array.from({ length: totalEvaluations }, (_, idx) => idx + 1).map(m => (
                      <option key={m} value={m}>{unitLabel} {m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Overall Monthly summary performance card */}
              {(() => {
                const evoRec = studentEvolutions.find(ev => ev.studentId === currentUser.id && ev.month === studentSelectedMonth && ev.status !== 'draft');
                const scoresCount = [evoRec?.evolution1, evoRec?.evolution2, evoRec?.evolution3, evoRec?.evolution4].filter(s => s !== undefined).length;
                const overallPass = evoRec?.overallScore !== undefined && evoRec.overallScore >= 80;
                const isPromoted = evoRec?.promoted === true;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Month card */}
                      <div className="group relative p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-indigo-600/90 tracking-wider uppercase bg-indigo-50 px-2.5 py-0.5 rounded-md">Active Level</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center border border-indigo-100/30 group-hover:bg-indigo-50 transition-colors">
                              <Layers className="w-4 h-4 text-indigo-500" />
                            </div>
                          </div>
                          <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">{unitLabel} {studentSelectedMonth}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-50 font-medium">Course: {currentUser.course || 'All-Inclusive Track'}</p>
                      </div>

                      {/* Progress card */}
                      <div className="group relative p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-blue-600/90 tracking-wider uppercase bg-blue-50 px-2.5 py-0.5 rounded-md">Overall Average Score</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center border border-blue-100/30 group-hover:bg-blue-50 transition-colors">
                              <Trophy className="w-4 h-4 text-blue-500" />
                            </div>
                          </div>
                          <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
                            {evoRec?.overallScore !== undefined ? `${evoRec.overallScore}%` : 'Pending'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-50 font-medium">
                          {scoresCount} of 4 continuous evaluations recorded
                        </p>
                      </div>

                      {/* Status badge and promotion card */}
                      <div className={`group relative p-6 bg-white border rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between ${
                        isPromoted 
                          ? 'border-emerald-100 hover:border-emerald-200' 
                          : scoresCount === 4 && !overallPass
                          ? 'border-red-100 hover:border-red-200'
                          : scoresCount > 0 
                          ? 'border-amber-100 hover:border-amber-200'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${
                              isPromoted 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : scoresCount === 4 && !overallPass
                                ? 'bg-red-50 text-red-700'
                                : scoresCount > 0 
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-50 text-slate-600'
                            }`}>Evolution Status</span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                              isPromoted 
                                ? 'bg-emerald-50/50 border-emerald-100/30 group-hover:bg-emerald-50 text-emerald-500' 
                                : scoresCount === 4 && !overallPass
                                ? 'bg-red-50/50 border-red-100/30 group-hover:bg-red-50 text-red-500'
                                : scoresCount > 0 
                                ? 'bg-amber-50/50 border-amber-100/30 group-hover:bg-amber-50 text-amber-500'
                                : 'bg-slate-50/50 border-slate-100/30 group-hover:bg-slate-50 text-slate-500'
                            }`}>
                              {isPromoted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : scoresCount === 4 && !overallPass ? (
                                <AlertCircle className="w-4 h-4" />
                              ) : (
                                <TrendingUp className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isPromoted ? (
                              <span className="text-2xl font-bold text-emerald-600 tracking-tight">🏆 Cleared!</span>
                            ) : scoresCount === 4 && !overallPass ? (
                              <span className="text-2xl font-bold text-red-600 tracking-tight flex items-center gap-1.5">
                                Redo Required
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-slate-800 tracking-tight">In Progress</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-50">
                          <p className={`text-xs font-medium ${
                            isPromoted 
                              ? 'text-emerald-600'
                              : scoresCount === 4 && !overallPass
                              ? 'text-red-500'
                              : 'text-slate-400'
                          }`}>
                            {isPromoted 
                              ? `Automatically promoted on ${evoRec?.promotedDate || 'this Level'}`
                              : scoresCount === 4 && !overallPass
                              ? `Did not meet the 80% threshold. You must redo this stage.`
                              : `Passing mark: Average score >= 80% with all 4 evaluations completed`
                            }
                          </p>
                          {scoresCount === 4 && !overallPass && (
                            <button
                              onClick={() => handleResetMonth(currentUser.id, studentSelectedMonth)}
                              className="mt-3 w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reset & Restart {unitLabel} {studentSelectedMonth}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Exam/Assessment Banner */}
                    {(evoRec?.examDate || evoRec?.examTime || evoRec?.examDuration) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 bg-slate-100 text-slate-750 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/50">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              📢 Official Continuous Assessment Schedule
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                              {unitLabel} {studentSelectedMonth} Summative Evolution Assessment
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              All {subUnitLabel.toLowerCase()} submissions must be completed before the designated time limit.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 font-sans">
                          {evoRec.examDate && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs text-slate-600 shadow-sm">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Date: <strong className="text-slate-900 font-bold">{new Date(evoRec.examDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
                            </div>
                          )}
                          {evoRec.examTime && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs text-slate-600 shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Time: <strong className="text-slate-900 font-bold">{evoRec.examTime}</strong></span>
                            </div>
                          )}
                          {evoRec.examDuration && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs text-slate-600 shadow-sm">
                              <Award className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Duration: <strong className="text-slate-900 font-bold">{evoRec.examDuration}</strong></span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* 4 evolution week blocks */}
                    <div>
                      <div className="pb-3 border-b border-slate-100 mb-6">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          Continuous {isWeeks ? 'Daily' : 'Weekly'} Evaluations ({unitLabel} {studentSelectedMonth})
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Click on any {subUnitLabel.toLowerCase()} evolution card to open the interactive workspace, view problem statements, and submit your coding or text solution.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((weekNum) => {
                          const getWeekFields = (index: number) => {
                            if (index === 1) {
                              return {
                                type: evoRec?.week1Type || 'instruction',
                                title: cleanMilestoneTitle(evoRec?.title1 || 'Evolution 1'),
                                desc: evoRec?.desc1 || `${subUnitLabel} Milestone task`,
                                feedback: evoRec?.feedback1,
                                score: evoRec?.evolution1,
                                submission: evoRec?.week1Submission,
                              };
                            }
                            if (index === 2) {
                              return {
                                type: evoRec?.week2Type || 'instruction',
                                title: cleanMilestoneTitle(evoRec?.title2 || 'Evolution 2'),
                                desc: evoRec?.desc2 || 'Weekly Milestone task',
                                feedback: evoRec?.feedback2,
                                score: evoRec?.evolution2,
                                submission: evoRec?.week2Submission,
                              };
                            }
                            if (index === 3) {
                              return {
                                type: evoRec?.week3Type || 'instruction',
                                title: cleanMilestoneTitle(evoRec?.title3 || 'Evolution 3'),
                                desc: evoRec?.desc3 || 'Weekly Milestone task',
                                feedback: evoRec?.feedback3,
                                score: evoRec?.evolution3,
                                submission: evoRec?.week3Submission,
                              };
                            }
                            return {
                              type: evoRec?.week4Type || 'instruction',
                              title: cleanMilestoneTitle(evoRec?.title4 || 'Evolution 4'),
                              desc: evoRec?.desc4 || 'Weekly Milestone task',
                              feedback: evoRec?.feedback4,
                              score: evoRec?.evolution4,
                              submission: evoRec?.week4Submission,
                            };
                          };

                          const fields = getWeekFields(weekNum);
                          const hasScore = fields.score !== undefined;
                          const scoreNum = fields.score || 0;
                          const hasSub = !!fields.submission;

                          return (
                            <div 
                              key={weekNum} 
                              onClick={() => handleOpenWeekWorkspace(weekNum, evoRec)}
                              className={`group p-5 rounded-2xl border flex flex-col justify-between cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.05)] hover:border-indigo-200 transition-all duration-300 ${
                                hasScore 
                                  ? scoreNum >= 80
                                    ? 'bg-white border-slate-100 hover:border-emerald-200'
                                    : 'bg-white border-slate-100 hover:border-amber-200'
                                  : hasSub
                                    ? 'bg-white border-indigo-100/85 hover:border-indigo-250'
                                    : 'bg-slate-50/40 border-slate-200/80 border-dashed hover:bg-white hover:border-slate-350'
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100/40">
                                      W0{weekNum}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                                      {fields.type}
                                    </span>
                                  </div>
                                  {hasScore && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                      scoreNum >= 80
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${scoreNum >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                      {scoreNum}%
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-[14px] font-bold text-slate-800 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                                  {fields.title}
                                </h4>
                                <p className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2">
                                  {fields.desc}
                                </p>
                                {fields.feedback ? (
                                  <div className="mt-3 p-3 bg-slate-50 border-l-2 border-indigo-500 rounded-r-xl text-[11px] text-slate-500 leading-normal italic relative">
                                    <span className="absolute top-1 right-2 text-indigo-250/30 text-lg font-serif">“</span>
                                    {fields.feedback}
                                  </div>
                                ) : (
                                  hasSub && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/50 border border-indigo-100/20 text-[10.5px] text-indigo-600 font-medium italic">
                                      <Clock className="w-3 h-3 animate-pulse" />
                                      Awaiting instructor review
                                    </div>
                                  )
                                )}
                              </div>

                              <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center justify-between">
                                {hasScore ? (
                                  <div className="w-full">
                                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                                      <span>Performance</span>
                                      <span className={scoreNum >= 80 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                        {scoreNum >= 80 ? 'Mastery Met' : 'Review Advised'}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100/70 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          scoreNum >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${scoreNum}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ) : hasSub ? (
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                      Under Evaluation
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">View submission &rarr;</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full group-hover:text-indigo-600 transition-colors">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                      <Code className="w-3.5 h-3.5 text-indigo-500" />
                                      Start Challenge
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Promotion details panel */}
                    {isPromoted ? (
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-200">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-emerald-950">
                            Evolution Milestone Passed & Grade Level Escalated!
                          </h4>
                          <p className="text-xs text-emerald-700 mt-1 leading-relaxed max-w-3xl">
                            By clearing all 4 {subUnitLabel.toLowerCase()} milestones in Study {unitLabel} {studentSelectedMonth} with an aggregate average score of <strong>{evoRec?.overallScore}%</strong> (Passing Benchmark: 80%), you have triggered our immediate <strong>Automatic Promotion protocol</strong>. Your account registration is instantly updated to the subsequent {unitLabel.toLowerCase()} milestone on the server, and a credentialed dispatch and progress receipt has been transmitted to: <strong className="underline">{currentUser.email}</strong>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-start gap-3.5 shadow-xs">
                        <div className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                          <span className="font-semibold text-slate-800 block mb-0.5">Continuous Evolution Track</span>
                          Learnora operates on a 4-{subUnitLabel.toLowerCase()} continuous evaluation schedule. Once all 4 milestones are reviewed and graded by an instructor with an aggregate average score of <strong className="text-indigo-600 font-semibold">80% or higher</strong>, the system triggers automatic promotion and progresses your registration parameters.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Dynamic Interactive Student Workstation Modal */}
        <AnimatePresence>
          {selectedActiveWeekIndex !== null && (() => {
            const evoRec = studentEvolutions.find(ev => ev.studentId === currentUser.id && ev.month === studentSelectedMonth && ev.status !== 'draft');
            const weekNum = selectedActiveWeekIndex;
            
            const getWeekFields = (index: number) => {
              if (index === 1) {
                return {
                  type: evoRec?.week1Type || 'instruction',
                  title: cleanMilestoneTitle(evoRec?.title1 || 'Evolution 1'),
                  desc: evoRec?.desc1 || 'Weekly Milestone task',
                  question: evoRec?.week1Question || 'Compile and present your milestone findings.',
                  constraints: evoRec?.week1Constraints || 'No constraints specified.',
                  testCases: evoRec?.week1TestCases || 'Demonstrate execution parameters.',
                  templateCode: evoRec?.week1TemplateCode || '// Write code here\n',
                  submission: evoRec?.week1Submission,
                  submissionDate: evoRec?.week1SubmissionDate,
                  feedback: evoRec?.feedback1,
                  score: evoRec?.evolution1,
                };
              }
              if (index === 2) {
                return {
                  type: evoRec?.week2Type || 'instruction',
                  title: cleanMilestoneTitle(evoRec?.title2 || 'Evolution 2'),
                  desc: evoRec?.desc2 || 'Weekly Milestone task',
                  question: evoRec?.week2Question || 'Compile and present your milestone findings.',
                  constraints: evoRec?.week2Constraints || 'No constraints specified.',
                  testCases: evoRec?.week2TestCases || 'Demonstrate execution parameters.',
                  templateCode: evoRec?.week2TemplateCode || '// Write code here\n',
                  submission: evoRec?.week2Submission,
                  submissionDate: evoRec?.week2SubmissionDate,
                  feedback: evoRec?.feedback2,
                  score: evoRec?.evolution2,
                };
              }
              if (index === 3) {
                return {
                  type: evoRec?.week3Type || 'instruction',
                  title: cleanMilestoneTitle(evoRec?.title3 || 'Evolution 3'),
                  desc: evoRec?.desc3 || 'Weekly Milestone task',
                  question: evoRec?.week3Question || 'Compile and present your milestone findings.',
                  constraints: evoRec?.week3Constraints || 'No constraints specified.',
                  testCases: evoRec?.week3TestCases || 'Demonstrate execution parameters.',
                  templateCode: evoRec?.week3TemplateCode || '// Write code here\n',
                  submission: evoRec?.week3Submission,
                  submissionDate: evoRec?.week3SubmissionDate,
                  feedback: evoRec?.feedback3,
                  score: evoRec?.evolution3,
                };
              }
              return {
                type: evoRec?.week4Type || 'instruction',
                title: cleanMilestoneTitle(evoRec?.title4 || 'Evolution 4'),
                desc: evoRec?.desc4 || 'Weekly Milestone task',
                question: evoRec?.week4Question || 'Compile and present your milestone findings.',
                constraints: evoRec?.week4Constraints || 'No constraints specified.',
                testCases: evoRec?.week4TestCases || 'Demonstrate execution parameters.',
                templateCode: evoRec?.week4TemplateCode || '// Write code here\n',
                submission: evoRec?.week4Submission,
                submissionDate: evoRec?.week4SubmissionDate,
                feedback: evoRec?.feedback4,
                score: evoRec?.evolution4,
              };
            };

            const fields = getWeekFields(weekNum);
            const isGraderFinished = fields.score !== undefined;
            const isSubmitted = !!fields.submission;
            // Line numbers display count helper
            const lineNumbersCount = Math.max(draftResponse.split('\n').length || 1, 22);
            const lineNumbers = Array.from({ length: lineNumbersCount }, (_, idx) => idx + 1);

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#0c0c0e] text-stone-200 flex flex-col font-mono w-full h-full select-none"
              >
                {/* Leetcode Header Bar */}
                <header className="h-12 bg-[#1b1b20] border-b border-[#2e2e38] px-4 flex items-center justify-between shrink-0 select-none text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-gradient-to-tr from-amber-500 to-orange-400 text-neutral-900 font-extrabold px-2.5 py-1 rounded-md text-[12px] tracking-tight uppercase">
                      <Code className="w-4 h-4 text-neutral-955" />
                      <span>Learnora Arena</span>
                    </div>
                    <span className="text-zinc-700 font-bold">|</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedActiveWeekIndex(null)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition py-1 px-2 rounded hover:bg-white/5 cursor-pointer font-sans"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Problem List</span>
                      </button>
                      <span className="text-zinc-700">/</span>
                      <span className="text-zinc-300 font-extrabold bg-[#2a2a34] px-2.5 py-0.5 rounded text-[11px] font-sans">
                        Study {unitLabel} {studentSelectedMonth} &bull; {subUnitLabel} {weekNum} Milestone
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-4 text-[10.5px]">
                    <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded font-sans">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>🔥 5 Day Streak</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-400 bg-slate-800/40 px-3 py-1 rounded font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{new Date().toISOString().slice(11, 16)} UTC</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedActiveWeekIndex(null)}
                      className="p-1 px-3 bg-red-600/20 hover:bg-red-605 text-red-400 hover:text-white border border-red-500/30 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer font-sans"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Exit Playground</span>
                    </button>
                  </div>
                </header>

                {/* Main Split Console Grid */}
                <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0">
                  
                  {/* Left Column Description Tab Block */}
                  <div className="w-1/2 flex flex-col bg-[#141417] rounded-xl border border-[#2e2e38] overflow-hidden">
                    <div className="h-10 bg-[#1d1d23] border-b border-[#2e2e38] flex items-center px-1.5 gap-1 shrink-0">
                      {[
                        { id: 'description', label: 'Description', icon: BookOpenText },
                        { id: 'editorial', label: 'Editorial Solution', icon: Sparkles },
                        { id: 'submissions', label: 'Submissions History', icon: History }
                      ].map((tb) => {
                        const Icon = tb.icon;
                        return (
                          <button
                            key={tb.id}
                            onClick={() => setLeftActiveTab(tb.id as any)}
                            className={`px-3 h-8 text-[11px] font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer font-sans ${
                              leftActiveTab === tb.id
                                ? 'bg-[#292933] text-white shadow-xs'
                                : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tb.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto font-sans leading-relaxed text-stone-300">
                      {leftActiveTab === 'description' && (
                        <div className="space-y-5">
                          <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                              {weekNum}. {fields.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase ${
                                fields.type === 'dsa'
                                  ? 'bg-[#1b3d2b] text-emerald-400 border border-emerald-500/10'
                                  : 'bg-indigo-950 text-indigo-400 border border-indigo-500/10'
                              }`}>
                                {fields.type === 'dsa' ? 'DSA Milestone' : 'Milestone Project'}
                              </span>

                              {fields.type === 'dsa' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#332211] text-amber-500 border border-amber-500/10 uppercase">
                                  LeetCode Tracked
                                </span>
                              )}

                              {isGraderFinished ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Graded: {fields.score}% Passed
                                </span>
                              ) : isSubmitted ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  Submitted (Awaiting Grading)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2a1315] text-rose-450 border border-rose-500/10 animate-pulse">
                                  Incomplete
                                </span>
                              )}
                            </div>
                          </div>

                          {(evoRec?.examDate || evoRec?.examTime || evoRec?.examDuration) && (
                            <div className="bg-[#1c1c24] border border-[#2e2e38] rounded-xl p-3 flex flex-wrap items-center gap-3 text-[11px] text-stone-300">
                              <span className="text-amber-500 font-extrabold uppercase tracking-wide mr-1">Assessment Schedule:</span>
                              {evoRec.examDate && (
                                <div className="flex items-center gap-1 bg-[#15151b] px-2.5 py-1 rounded-lg border border-white/[0.03]">
                                  <Calendar className="w-3 h-3 text-indigo-400" />
                                  <span>Date: <span className="text-white font-semibold">{new Date(evoRec.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                                </div>
                              )}
                              {evoRec.examTime && (
                                <div className="flex items-center gap-1 bg-[#15151b] px-2.5 py-1 rounded-lg border border-white/[0.03]">
                                  <Clock className="w-3 h-3 text-sky-400" />
                                  <span>Time: <span className="text-white font-semibold">{evoRec.examTime}</span></span>
                                </div>
                              )}
                              {evoRec.examDuration && (
                                <div className="flex items-center gap-1 bg-[#15151b] px-2.5 py-1 rounded-lg border border-white/[0.03]">
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Duration: <span className="text-white font-semibold">{evoRec.examDuration}</span></span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Problem Core description */}
                          <div className="space-y-3">
                            <h3 className="text-slate-200 text-[11px] font-bold uppercase tracking-wider">Milestone Description</h3>
                            <div className="bg-[#1b1b20] p-4 rounded-xl border border-[#2e2e38] text-xs text-stone-300 whitespace-pre-wrap leading-relaxed font-sans">
                              {fields.desc}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-slate-200 text-[11px] font-bold uppercase tracking-wider">Evaluation Prompt</h3>
                            <div className="bg-[#1b1b21] p-4 rounded-xl border border-[#2d2d38] text-xs text-sky-400 font-mono whitespace-pre-wrap">
                              {fields.question}
                            </div>
                          </div>

                          {/* Technical constraints parameters */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[10px]">
                            <div className="space-y-1.5 flex flex-col">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans">Constraints & Scope</h4>
                              <div className="bg-[#121216] p-3 rounded-lg border border-[#2d2d38] text-stone-400 whitespace-pre-wrap flex-1">
                                {fields.constraints || 'Memory: 256MB\nTime: 1.0s\nStandard execution bounds apply.'}
                              </div>
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans">Initial Setup Cases</h4>
                              <div className="bg-[#121216] p-3 rounded-lg border border-[#2d2d38] text-stone-400 whitespace-pre-wrap flex-1">
                                {fields.testCases || 'Input: standard arguments\nOutput: validated outcomes.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {leftActiveTab === 'editorial' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-[#1b323c] text-cyan-400 p-3 rounded-xl border border-cyan-500/10 text-xs">
                            <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400" />
                            <span><strong>Prerequisite & Optimal Solution Design guide:</strong> Learnora verified reference analysis.</span>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-white text-xs font-bold uppercase tracking-wide text-zinc-300">Asymptotic Time & Space targets:</h4>
                            <p className="text-xs text-stone-400">
                              Choose the optimal linear O(N) index scan hashing complement algorithm over quadratic constraints.
                            </p>
                          </div>

                          <div className="bg-[#1c1c21] p-4 rounded-xl border border-[#2a2a35] space-y-3">
                            <h5 className="text-[11px] font-extrabold uppercase tracking-wide text-amber-500">Suggested Approach:</h5>
                            <p className="text-xs text-stone-300 leading-relaxed">
                              Use an object acts as a dictionary of values seen. Iterate over the input structure and check if current element matches constraints. If yes, return indices or completion values immediately.
                            </p>
                            <pre className="text-[10px] bg-stone-950 p-2.5 rounded border border-zinc-900 font-mono text-emerald-400 overflow-x-auto">
                              {`// JS Pseudocode complement lookups:\nconst map = {};\nfor(let idx=0; idx<nums.length; idx++) {\n  let diff = target - nums[idx];\n  if (diff in map) return [map[diff], idx];\n  map[nums[idx]] = idx;\n}`}
                            </pre>
                          </div>
                        </div>
                      )}

                      {leftActiveTab === 'submissions' && (
                        <div className="space-y-4">
                          <h3 className="text-white font-bold text-xs uppercase tracking-wide">Historical Milestone Submissions</h3>
                          
                          {fields.submission ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-[#1e1e26] border border-[#2e2e3a] rounded-xl flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-[#2cc0e2] flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Milestone Checkpoint Submission Saved</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500">Submitted at: {fields.submissionDate || 'Live Session record'}</span>
                                </div>
                                {isGraderFinished && (
                                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] rounded">
                                    GRADED: {fields.score}%
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Saved Solution Code:</span>
                                <pre className="bg-stone-950 p-3 rounded-lg text-emerald-400 text-[10px] font-mono overflow-x-auto border border-white/5 whitespace-pre">
                                  {fields.submission}
                                </pre>
                              </div>

                              {evoRec?.recordedVideoUrl && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs mt-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-rose-400 font-bold">Proctored Session Recording</span>
                                  </div>
                                  <a
                                    href={evoRec.recordedVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-extrabold text-[10px] rounded transition"
                                  >
                                    View Video
                                  </a>
                                </div>
                              )}

                              {fields.feedback && (
                                <div className="p-4 bg-[#1b253c] border border-blue-500/20 text-[#85b5ff] text-xs rounded-xl space-y-1">
                                  <span className="font-extrabold uppercase text-[10px] tracking-widest text-[#bfdaff] flex items-center gap-1">
                                    <Award className="w-3.5 h-3.5" />
                                    Review feedback from Instructor:
                                  </span>
                                  <p className="italic font-sans leading-relaxed">&ldquo;{fields.feedback}&rdquo;</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-stone-500 text-xs">
                              <History className="w-8 h-8 mx-auto mb-2 opacity-35" />
                              <p>No previous milestone submissions located for {unitLabel} {studentSelectedMonth} {subUnitLabel} {weekNum}.</p>
                              <p className="text-[10px] mt-1 text-stone-600">Your live draft in the Workspace Draft Editor will be recorded.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column Core IDE & Test Runners */}
                  <div className="w-1/2 flex flex-col gap-2 overflow-hidden min-h-0">
                    
                    {/* Code Editor Panel */}
                    <div className="flex-1 flex flex-col bg-[#141417] rounded-xl border border-[#2e2e38] overflow-hidden min-h-0">
                      <div className="h-10 bg-[#1d1d23] border-b border-[#2e2e38] flex items-center justify-between px-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Solution Editor</label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-[#121215] border border-[#2e2e38] rounded px-2 py-0.5 text-[10.5px] text-[#5cd9ff] font-bold focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="JavaScript">JavaScript (Local Live Run)</option>
                            <option value="Python">Python 3</option>
                            <option value="C++">C++ (GCC 11)</option>
                            <option value="Java">Java 17 (JDK)</option>
                          </select>
                          <span className="h-4 w-[1px] bg-stone-700" />
                          <span className="text-[9px] text-[#2cc0e2] font-semibold animate-pulse font-sans">● Environment Auto Synced</span>
                        </div>

                        <div className="flex items-center gap-1 font-sans">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(draftResponse);
                              setCopiedIndex(true);
                              setTimeout(() => setCopiedIndex(false), 2000);
                            }}
                            className="px-2 py-1 text-[10.5px] hover:bg-stone-800 text-stone-405 hover:text-white rounded transition flex items-center gap-1 cursor-pointer"
                            title="Copy Draft Code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedIndex ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Revert your editor back to the original milestone boilerplate?")) {
                                setDraftResponse(fields.templateCode || '');
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-805 cursor-pointer"
                            title="Reset Code Templates"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Interactive IDE Area */}
                      <div className="flex-grow flex overflow-hidden min-h-0 bg-[#0c0c0e]">
                        {/* Line number rail */}
                        <div className="w-9 bg-[#111114] text-stone-600 font-mono text-[11px] flex flex-col items-end pr-2 pt-3 select-none leading-5 font-bold border-r border-[#1a1a20] shrink-0">
                          {lineNumbers.map((num) => (
                            <span key={num}>{num}</span>
                          ))}
                        </div>

                        {/* Editable Area */}
                        <textarea
                          disabled={isGraderFinished}
                          value={draftResponse}
                          onChange={(e) => setDraftResponse(e.target.value)}
                          placeholder="// Enter your code solution script here...\n"
                          className="flex-1 bg-[#0c0c0e] text-[#6fe3ff] font-mono text-xs p-3 focus:outline-none resize-none leading-5 border-0 focus:ring-0 whitespace-pre overflow-auto selection:bg-indigo-500/30 selection:text-white"
                        />
                      </div>
                    </div>

                    {/* Integrated Sandbox Execution Console Terminal */}
                    {terminalOpen && (
                      <div className="h-60 bg-[#121215] rounded-xl border border-[#2e2e38] flex flex-col overflow-hidden shrink-0">
                        <div className="h-8 bg-[#1a1a20] border-b border-[#2e2e38] flex items-center justify-between px-3 shrink-0 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-sans">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Execution Sandbox Terminal</span>
                          </span>
                          <button
                            onClick={() => {
                              setTestcaseInput(fields.testCases || '');
                              setRunResult(null);
                            }}
                            className="hover:text-white hover:underline uppercase text-[9px] cursor-pointer font-sans"
                          >
                            Reset Test
                          </button>
                        </div>

                        <div className="flex-1 flex divide-x divide-[#2e2e38] leading-tight text-[11px] min-h-0">
                          {/* Testcase Input Box */}
                          <div className="w-1/2 p-3 flex flex-col gap-1.5 overflow-hidden">
                            <span className="text-stone-450 font-extrabold uppercase text-[9px] tracking-wide font-sans">Testcase arguments input (JSON)</span>
                            <textarea
                              value={testcaseInput}
                              onChange={(e) => setTestcaseInput(e.target.value)}
                              placeholder={`E.g. [[2, 7, 11, 15], 9]`}
                              className="flex-grow bg-[#0c0c0e] border border-[#282832] rounded-lg p-2 font-mono text-[10.5px] text-stone-200 focus:outline-none resize-none focus:border-cyan-500/70"
                            />
                          </div>

                          {/* Sandbox Result Output Box */}
                          <div className="w-1/2 p-3 overflow-y-auto bg-[#0a0a0c] flex flex-col gap-1.5 font-mono">
                            <span className="text-stone-450 font-extrabold uppercase text-[9px] tracking-wide font-sans">Live Test outputs</span>
                            {isRunningCode ? (
                              <div className="flex-grow flex flex-col items-center justify-center text-slate-500 gap-2">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] text-cyan-400 animate-pulse font-bold font-sans">Executing secure sandbox runner...</span>
                              </div>
                            ) : runResult ? (
                              <div className="space-y-2 text-[10.5px]">
                                {runResult.success ? (
                                  <>
                                    <div className="text-emerald-450 font-extrabold flex items-center gap-1 uppercase tracking-wide font-sans">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Execution Completed</span>
                                    </div>
                                    <div className="space-y-1">
                                      {runResult.stdout && (
                                        <div className="text-[10px] text-stone-500 select-all border-b border-[#222] pb-1">
                                          {runResult.stdout}
                                        </div>
                                      )}
                                      <div className="flex flex-col gap-1 mt-1 font-sans">
                                        <span className="text-stone-500 text-[10px] font-semibold">Returned Value:</span>
                                        <span className="text-white bg-[#15151b] px-2 py-1 rounded border border-[#2d2d3d] text-[11px] font-mono font-bold text-cyan-400 select-all whitespace-pre-wrap">
                                          {runResult.outputVal}
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-stone-500 mt-1 font-sans">
                                        Execution Latency: <span className="text-stone-400 font-bold">{runResult.timeMs || '0.2'} ms</span>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-rose-500 font-extrabold uppercase tracking-wide flex items-center gap-1 font-sans">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                      <span>Runtime Evaluation Error</span>
                                    </div>
                                    <div className="p-2 bg-rose-950/25 border border-rose-900/50 rounded text-rose-400 text-[10px] select-all whitespace-pre-wrap">
                                      {runResult.error}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex-grow flex flex-col items-center justify-center text-stone-500 text-center px-4 self-center py-6">
                                <Terminal className="w-5 h-5 text-zinc-650 mb-1" />
                                <p className="text-[10px] font-sans leading-relaxed">No tests executed yet. Click "Run Code" down below to compile solution instantly against parameters.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Footer Controls */}
                        <div className="h-10 bg-[#15151b] border-t border-[#2e2e38] flex items-center justify-between px-3 shrink-0 text-xs">
                          <div className="flex items-center text-[10px] text-stone-500 font-sans">
                            <span>Sandbox execution evaluates JavaScript in real-time</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedLanguage === 'JavaScript' ? (
                              <button
                                type="button"
                                onClick={handleRunCode}
                                disabled={isRunningCode || isGraderFinished}
                                className="px-3 h-6 text-[10.5px] font-bold bg-[#292934] hover:bg-[#343442] border border-[#3e3e4a] text-slate-350 hover:text-white rounded flex items-center gap-1 transition cursor-pointer font-sans"
                              >
                                <Play className="w-3 h-3 fill-current text-emerald-450" />
                                <span>Run Code</span>
                              </button>
                            ) : (
                              <span className="text-[9.5px] text-slate-500 italic pr-2 font-sans">Direct browser run format supports JS</span>
                            )}

                            {isGraderFinished ? (
                              <button
                                disabled
                                className="px-3 h-6 text-[10.5px] font-bold bg-[#14261b] text-emerald-400 border border-emerald-950 rounded flex items-center gap-1 font-sans"
                              >
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                <span>Assigned Score Verified</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSubmitWeekSubmission(weekNum, evoRec)}
                                className="px-3 h-6 text-[10.5px] font-bold bg-indigo-600 hover:bg-indigo-750 text-white rounded flex items-center gap-1 transition shadow-xs cursor-pointer font-sans"
                              >
                                <Send className="w-3 h-3 text-indigo-300" />
                                <span>Submit Solution</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Success Celebrating Banner Overlay */}
                {workspaceSuccessMsg && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[120] flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="max-w-md p-8 bg-[#1e1e24] border border-[#2e2e38] rounded-3xl space-y-4"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                        🎉
                      </div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-wider font-sans">Solution Recorded</h3>
                      <p className="text-xs text-stone-300 leading-relaxed font-sans mt-2">
                        {workspaceSuccessMsg}
                      </p>
                      <div className="text-[10px] text-[#2cc0e2] uppercase tracking-widest animate-pulse font-bold pt-2">
                        Returning to central learning workspace...
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Dynamic Interactive Certificate Modal */}
        <AnimatePresence>
          {showCertificateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl w-full max-w-4xl p-6 md:p-8 flex flex-col space-y-6 relative max-h-[92vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Official Academic Certificate
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify, print, or download your credentials file below.
                  </p>
                </div>

                {/* Certificate Realistic Visual Box */}
                <div className="border border-amber-500/30 rounded-2xl p-4 bg-amber-50/10 dark:bg-[#090a0f] relative overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="w-full aspect-[1.414/1] max-w-3xl border-8 double border-amber-500/80 bg-stone-50 text-stone-900 p-6 md:p-10 flex flex-col justify-between text-center relative select-none">
                    {/* Corner Embellishments */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600/60"></div>
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600/60"></div>
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600/60"></div>
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600/60"></div>

                    <div className="space-y-2 md:space-y-4">
                      <h4 className="font-serif text-amber-950 text-base md:text-xl font-bold tracking-[0.25em]">
                        LEARNORA INSTITUTE
                      </h4>
                      <div className="w-20 h-0.5 bg-amber-500 mx-auto"></div>
                      <h1 className="font-serif text-amber-700 text-lg md:text-2xl font-black italic tracking-wide">
                        Certificate of Achievement
                      </h1>
                    </div>

                    <div className="space-y-2 md:space-y-4">
                      <p className="text-xs md:text-sm text-stone-550 italic font-serif">This is proudly presented to</p>
                      <h2 className="text-xl md:text-3.5xl font-serif font-extrabold text-stone-900 border-b-2 border-stone-800 display: inline-block px-4 pb-1">
                        {currentUser.name}
                      </h2>
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                      <p className="text-[11px] md:text-xs text-stone-750 font-serif leading-relaxed">
                        for successfully fulfilling all course curriculum directives and passing all required evaluations for the
                        <br />
                        <span className="font-serif font-extrabold text-indigo-750 text-xs md:text-sm">
                          &ldquo;{courseName}&rdquo;
                        </span>
                      </p>
                      <p className="text-[9px] text-stone-600 font-serif font-semibold uppercase tracking-wider">
                        CERTIFICATE ID: {certNo} &bull; STUDENT ID NO: {studentIdNo}
                      </p>
                    </div>

                    {/* Bottom Signature Line & Ribbon Seal */}
                    <div className="grid grid-cols-3 items-end pt-4">
                      {/* Signature left */}
                      <div className="text-center flex flex-col justify-end">
                        <span className="font-serif text-indigo-800 text-xs md:text-sm italic font-medium translate-y-2">Anand Sharma</span>
                        <div className="border-t border-stone-400 mt-2 pt-1">
                          <p className="text-[9px] md:text-[10px] font-bold text-stone-800">Anand Sharma</p>
                          <p className="text-[7.5px] md:text-[8.5px] text-stone-500">Founder & CEO, Learnora</p>
                        </div>
                      </div>

                      {/* Seal middle */}
                      <div className="flex flex-col items-center justify-center relative translate-y-1 md:translate-y-2">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 border-2 border-rose-500 shadow-md flex items-center justify-center text-white relative">
                          <span className="text-[6.5px] md:text-[8.5px] font-extrabold tracking-widest text-slate-100 font-sans text-center">
                            OFFICIAL<br />SEAL
                          </span>
                        </div>
                      </div>

                      {/* Signature right */}
                      <div className="text-center flex flex-col justify-end">
                        <span className="font-serif text-rose-600 text-xs md:text-sm italic font-medium translate-y-2">Priya Verma</span>
                        <div className="border-t border-stone-400 mt-2 pt-1">
                          <p className="text-[9px] md:text-[10px] font-bold text-stone-800">Priya Verma</p>
                          <p className="text-[7.5px] md:text-[8.5px] text-stone-500">Lead Academic Instructor</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exporters and download actions bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    disabled={isGenerating}
                    onClick={downloadCertificateAsPNG}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer select-none"
                  >
                    <Download className="w-4 h-4" />
                    {isGenerating ? 'Rendering PNG Image...' : 'Save as PNG Image'}
                  </button>

                  <button
                    disabled={isGenerating}
                    onClick={downloadCertificateAsHTML}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer select-none"
                  >
                    <FileCode className="w-4 h-4" />
                    Save as HTML Web Certificate
                  </button>

                  <button
                    onClick={() => {
                      const iframe = document.createElement('iframe');
                      iframe.style.position = 'fixed';
                      iframe.style.right = '0';
                      iframe.style.bottom = '0';
                      iframe.style.width = '0';
                      iframe.style.height = '0';
                      iframe.style.border = '0';
                      iframe.style.visibility = 'hidden';
                      iframe.style.pointerEvents = 'none';
                      document.body.appendChild(iframe);

                      const htmlContent = getCertificateHTML(false);
                      const doc = iframe.contentWindow?.document || iframe.contentDocument;
                      if (doc) {
                        doc.open();
                        doc.write(htmlContent);
                        doc.close();
                      }

                      // Cleanup iframe after some time
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 10000);
                    }}
                    className="py-3 px-4 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer select-none"
                  >
                    <Printer className="w-4 h-4" />
                    Print Certificate
                  </button>

                  <button
                    onClick={() => setShowCertificateModal(false)}
                    className="py-3 px-4 border border-transparent bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer select-none"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-tab Selector for Instructors & Admins */}
      <div className="flex bg-slate-100 dark:bg-white/[0.03] p-1 rounded-2xl max-w-sm border border-slate-200/50 dark:border-white/5 shadow-sm">
        <button
          onClick={() => setActiveSubTab('traditional')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
            activeSubTab === 'traditional'
              ? 'bg-white dark:bg-[#1c1d22] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-white/5'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Class Grades
        </button>
        <button
          onClick={() => setActiveSubTab('evolution')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
            activeSubTab === 'evolution'
              ? 'bg-white dark:bg-[#1c1d22] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/40 dark:border-white/5'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Monthly Evolutions
        </button>
      </div>

      {activeSubTab === 'traditional' ? (
        <>
          {/* Tracker metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Reported Average Score</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white">{averageScore}%</p>
            <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Target &gt;80%</span>
          </div>
          <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Calculated over {filteredRecords.length} evaluations</p>
        </div>

        <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Honor Roll Ratio</p>
          <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
            {authorizedRecords.length > 0
              ? ((authorizedRecords.filter(r => r.academicPerformance === 'excellent').length / authorizedRecords.length) * 100).toFixed(0)
              : '0'}%
          </p>
          <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Perfect academic performance</p>
        </div>

        <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Attendance Rate</p>
          <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1.5">
            {authorizedRecords.length > 0
              ? ((authorizedRecords.filter(r => r.attendanceStatus === 'present').length / authorizedRecords.length) * 100).toFixed(0)
              : '100'}%
          </p>
          <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">On-time classroom attendance</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Academic Progress & Grading
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Add evaluations and track grading progress across published classes.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer select-none flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Hide Progress Evaluator' : 'Submit Score & Review'}
          </button>
        </div>

        {/* Evaluation Drawer Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <form
                onSubmit={handleSubmit}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-150 dark:border-white/5 grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
              >
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Select Student</label>
                  <select
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Choose Student Player</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Select Completed Lesson</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Choose Lesson</option>
                    {schedules.map(cl => (
                      <option key={cl.id} value={cl.id}>
                        {cl.subject}: {cl.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Attendance</label>
                  <select
                    value={attendance}
                    onChange={e => setAttendance(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#070708] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Score ({score}%)</label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={score}
                    onChange={e => setScore(parseInt(e.target.value))}
                    className="w-full text-blue-500 cursor-pointer accent-blue-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Overall Tier</label>
                  <select
                    value={academicPerformance}
                    onChange={e => setAcademicPerformance(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#070708] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="excellent">Excellent Performance</option>
                    <option value="good">Good Progress</option>
                    <option value="average">Satisfactory Average</option>
                    <option value="needs-improvement">Re-evaluation Needed</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-4">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Adviser Feedback Message</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter actionable comment or suggestions e.g. solid mastery of theory modules."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#070708] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="md:col-span-6 flex justify-end gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-xs font-semibold tracking-tight shadow transition cursor-pointer select-none"
                  >
                    Log Student Assessment Record
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Filters & Seek */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-4xl">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search students or lesson assignments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3.5 py-2.5 text-xs border border-slate-200/80 dark:border-white/10 dark:bg-[#070708] rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10 rounded-xl px-2.5 bg-white dark:bg-[#070708]">
            <Filter className="w-3 text-blue-500" />
            <select
              value={performanceFilter}
              onChange={e => setPerformanceFilter(e.target.value as any)}
              className="py-2.5 text-xs bg-transparent text-slate-700 dark:text-gray-300 focus:outline-none border-0"
            >
              <option value="all">Performance: All</option>
              <option value="excellent">Excellent Tier (Honor Roll)</option>
              <option value="good">Good Tier</option>
              <option value="average">Average Satisfactory</option>
              <option value="needs-improvement">Needs Improvement</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10 rounded-xl px-2.5 bg-white dark:bg-[#070708]">
            <BookOpen className="w-3 text-blue-500" />
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="py-2.5 text-xs bg-transparent text-slate-700 dark:text-gray-300 focus:outline-none border-0"
            >
              <option value="all">Subject: All</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Coding">Coding</option>
              <option value="Logic">Logic</option>
            </select>
          </div>
        </div>

        {/* Interactive evaluations grid */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="border border-dashed border-slate-200/80 dark:border-white/10 rounded-2xl p-10 text-center text-slate-401">
              No academic records logged yet.
            </div>
          ) : (
            filteredRecords.map(rec => {
              const isExcellent = rec.academicPerformance === 'excellent';
              return (
                <div
                  key={rec.id}
                  className={`bg-white dark:bg-[#070708] p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 transition hover:-translate-y-0.5 ${
                    isExcellent
                      ? '!border-blue-500/30 dark:!border-blue-500/25 ring-1 ring-blue-500/5 bg-gradient-to-r from-blue-500/5 to-[#070708]/50'
                      : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {currentUser.role !== 'student' && (
                          <span className="font-extrabold text-sm text-slate-950 dark:text-white">
                            {rec.studentName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {rec.subject}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getPerformanceColor(rec.academicPerformance)}`}>
                          {rec.academicPerformance.replace('-', ' ')}
                        </span>
                        {isExcellent && (
                          <span className="text-blue-500 text-[10px] flex items-center gap-0.5 font-bold">
                            <Sparkles className="w-3 h-3 text-blue-500 animate-pulse fill-blue-500" /> Goal Met!
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs md:text-sm mt-1.5 flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                        {rec.className}
                      </h4>

                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-3 font-medium mt-1 pt-1">
                        <span>Advisor: {rec.instructorName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {rec.evaluationDate}
                        </span>
                        <span>•</span>
                        <span className="font-semibold capitalize text-slate-650 dark:text-slate-300">
                          Class Status: {rec.attendanceStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                      {/* Interactive Feedback Text */}
                      <div className="max-w-md hidden md:block">
                        <p className="text-xs text-slate-500 dark:text-slate-401 leading-relaxed italic pr-6 border-r border-slate-100 dark:border-slate-800">
                          &ldquo;{rec.feedback}&rdquo;
                        </p>
                      </div>

                      <div className="text-right select-none">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{rec.score}%</span>
                        <p className="text-[9px] font-bold text-slate-550 dark:text-gray-400 uppercase tracking-wider">Grade Value</p>
                      </div>
                    </div>
                  </div>

                  {/* Responsive block for smaller screens regarding feedback messages */}
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed italic block md:hidden mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                    &ldquo;{rec.feedback}&rdquo;
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Evolution Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Enrolled Student Players</p>
              <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1.5">{students.length}</p>
              <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Active classroom learners</p>
            </div>

            <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Total Active Monthly Trackers</p>
              <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1.5">{studentEvolutions.length}</p>
              <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Evaluations registered in database</p>
            </div>

            <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Promotions Granted</p>
              <p className="text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1.5">
                {studentEvolutions.filter(ev => ev.promoted).length}
              </p>
              <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Automatic progression checkpoints met</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Monthly Evolution Grading Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Select a student and study month to review their weekly code/text submissions, assign scores, and log academic feedback.
              </p>
            </div>

            {evolutionSuccessMessage && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {evolutionSuccessMessage}
              </div>
            )}

            {/* Selection row */}
            <form onSubmit={handleUpdateEvolutionScore} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">1. Select Student</label>
                  <select
                    value={selectedEvolutionStudentId}
                    onChange={(e) => setSelectedEvolutionStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Month {s.currentMonth || 1})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">2. Select Study Month</label>
                  <select
                    value={selectedEvolutionMonth}
                    onChange={(e) => setSelectedEvolutionMonth(parseInt(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {Array.from({ length: 6 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Month {m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Registered Course Context</label>
                  <input
                    type="text"
                    disabled
                    value={selectedEvolutionCourse || 'Automatic course discovery'}
                    className="w-full px-3 py-2 text-xs border border-slate-100 dark:border-slate-800/40 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {selectedEvolutionStudentId ? (
                <>
                  {/* Scores Inputs Grid */}
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-extrabold uppercase text-slate-500 dark:text-gray-400 tracking-wider">
                      Weekly Score Cards & Student Solution Submissions
                    </h3>
                    
                    {(() => {
                      const currentEvo = studentEvolutions.find(
                        ev => ev.studentId === selectedEvolutionStudentId && ev.month === selectedEvolutionMonth && ev.status !== 'draft'
                      );
                      const isWeeksForAdmin = courses.find(c => c.name === selectedEvolutionCourse)?.durationUnit === 'weeks';
                      const subUnitLabel = isWeeksForAdmin ? 'Day' : 'Week';

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Week 1 */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {subUnitLabel} 1: {cleanMilestoneTitle(currentEvo?.title1 || 'Evolution Milestone 1')}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded capitalize">
                                {currentEvo?.week1Type || 'code/text'}
                              </span>
                            </div>
                            
                            {/* Student submission preview */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Solution:</p>
                              {currentEvo?.week1Submission ? (
                                <div className="p-3 bg-white dark:bg-black/45 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                                  {currentEvo.week1Submission}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No solution submitted yet.</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                              <div className="sm:col-span-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Grade Score %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ev1Score}
                                  onChange={(e) => setEv1Score(e.target.value)}
                                  placeholder="Pending"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Actionable Feedback</label>
                                <input
                                  type="text"
                                  value={ev1Feedback}
                                  onChange={(e) => setEv1Feedback(e.target.value)}
                                  placeholder="Well done, masterfully done!"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Week 2 */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {subUnitLabel} 2: {cleanMilestoneTitle(currentEvo?.title2 || 'Evolution Milestone 2')}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded capitalize">
                                {currentEvo?.week2Type || 'code/text'}
                              </span>
                            </div>
                            
                            {/* Student submission preview */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Solution:</p>
                              {currentEvo?.week2Submission ? (
                                <div className="p-3 bg-white dark:bg-black/45 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                                  {currentEvo.week2Submission}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No solution submitted yet.</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                              <div className="sm:col-span-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Grade Score %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ev2Score}
                                  onChange={(e) => setEv2Score(e.target.value)}
                                  placeholder="Pending"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Actionable Feedback</label>
                                <input
                                  type="text"
                                  value={ev2Feedback}
                                  onChange={(e) => setEv2Feedback(e.target.value)}
                                  placeholder="Excellent algorithmic logic."
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Week 3 */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {subUnitLabel} 3: {cleanMilestoneTitle(currentEvo?.title3 || 'Evolution Milestone 3')}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded capitalize">
                                {currentEvo?.week3Type || 'code/text'}
                              </span>
                            </div>
                            
                            {/* Student submission preview */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Solution:</p>
                              {currentEvo?.week3Submission ? (
                                <div className="p-3 bg-white dark:bg-black/45 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                                  {currentEvo.week3Submission}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No solution submitted yet.</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                              <div className="sm:col-span-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Grade Score %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ev3Score}
                                  onChange={(e) => setEv3Score(e.target.value)}
                                  placeholder="Pending"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Actionable Feedback</label>
                                <input
                                  type="text"
                                  value={ev3Feedback}
                                  onChange={(e) => setEv3Feedback(e.target.value)}
                                  placeholder="Correctly satisfies edge cases."
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Week 4 */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                                {subUnitLabel} 4: {cleanMilestoneTitle(currentEvo?.title4 || 'Evolution Milestone 4')}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded capitalize">
                                {currentEvo?.week4Type || 'code/text'}
                              </span>
                            </div>
                            
                            {/* Student submission preview */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Solution:</p>
                              {currentEvo?.week4Submission ? (
                                <div className="p-3 bg-white dark:bg-black/45 border border-slate-200/50 dark:border-white/5 rounded-xl text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                                  {currentEvo.week4Submission}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No solution submitted yet.</p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                              <div className="sm:col-span-1 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Grade Score %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={ev4Score}
                                  onChange={(e) => setEv4Score(e.target.value)}
                                  placeholder="Pending"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-slate-450 uppercase block">Actionable Feedback</label>
                                <input
                                  type="text"
                                  value={ev4Feedback}
                                  onChange={(e) => setEv4Feedback(e.target.value)}
                                  placeholder="Fantastic summative project execution!"
                                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Calculated Average */}
                    {(() => {
                      const s1 = ev1Score !== '' ? parseInt(ev1Score) : NaN;
                      const s2 = ev2Score !== '' ? parseInt(ev2Score) : NaN;
                      const s3 = ev3Score !== '' ? parseInt(ev3Score) : NaN;
                      const s4 = ev4Score !== '' ? parseInt(ev4Score) : NaN;
                      const nums = [s1, s2, s3, s4].filter(n => !isNaN(n));
                      const avg = nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
                      const hasAll = nums.length === 4;
                      const pass = avg >= 80;

                      return (
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-400">Monthly Aggregate Benchmark</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-1">
                              Current Average Score: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-base">{avg}%</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {hasAll 
                                ? pass 
                                  ? '🏆 Meets 80% automatic promotion target.'
                                  : '⚠️ Redo required: score is below 80% passing target.'
                                : `${nums.length} of 4 continuous evaluations scored.`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Wipe scores and submissions for this month to let the student redo?')) {
                                  handleResetMonth(selectedEvolutionStudentId, selectedEvolutionMonth);
                                }
                              }}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reset Month
                            </button>

                            <button
                              type="submit"
                              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md select-none"
                            >
                              <Check className="w-3.5 h-3.5" /> Save Evaluation Grades
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-250/50 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.01]">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Please choose a student to start grading their continuous evolution metrics.</p>
                </div>
              )}
            </form>

            {/* Students List in Evolution tab */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                Registered Student Monthly Tracking Metrics
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {students.map(st => {
                  const evos = studentEvolutions.filter(ev => ev.studentId === st.id);
                  const currentMonthEvo = evos.find(e => e.month === (st.currentMonth || 1));
                  const currentMonthScores = currentMonthEvo ? [currentMonthEvo.evolution1, currentMonthEvo.evolution2, currentMonthEvo.evolution3, currentMonthEvo.evolution4].filter(s => s !== undefined) : [];
                  const lastUpdateStr = currentMonthEvo?.lastUpdated ? new Date(currentMonthEvo.lastUpdated).toLocaleDateString() : 'Never';

                  return (
                    <div 
                      key={st.id} 
                      onClick={() => {
                        setSelectedEvolutionStudentId(st.id);
                        setSelectedEvolutionMonth(st.currentMonth || 1);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 select-none ${
                        selectedEvolutionStudentId === st.id 
                          ? 'bg-indigo-500/5 border-indigo-500/30' 
                          : 'bg-white dark:bg-[#0c0d12]/40 border-slate-200 dark:border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-200">{st.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                          Month {st.currentMonth || 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Course: {st.course || 'Unassigned'}</p>
                      
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Current Month Progress:</span>
                        <span className="font-bold text-indigo-500">{currentMonthScores.length} of 4 Graded</span>
                      </div>
                      
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Current Month Avg:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">
                          {currentMonthEvo?.overallScore !== undefined ? `${currentMonthEvo.overallScore}%` : 'Pending'}
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[9px] text-slate-450">
                        <span>Last Updated: {lastUpdateStr}</span>
                        <span className="text-indigo-500 font-bold hover:underline">Select &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
