/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord, StudentAssignment } from '../types';
import { Award, BookOpen, Clock, Plus, CornerDownRight, CheckCircle, Search, Sparkles, Filter, Download, Printer, X, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressTrackerProps {
  currentUser: UserAccount;
  students: UserAccount[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
  assignments?: StudentAssignment[];
  onAddProgressRecord: (record: Omit<ProgressRecord, 'id' | 'evaluationDate' | 'instructorId' | 'instructorName'>) => void;
}

export default function ProgressTracker({
  currentUser,
  students,
  schedules,
  progressRecords,
  assignments = [],
  onAddProgressRecord
}: ProgressTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'excellent' | 'good' | 'average' | 'needs-improvement'>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    const studentAssignmentsList = assignments.filter(asg => {
      const matchesCourse = !asg.course || asg.course === 'All' || (currentUser.course && asg.course.toLowerCase() === currentUser.course.toLowerCase());
      const matchesBatch = !asg.batch || asg.batch === 'All' || (currentUser.batch && asg.batch.toLowerCase() === currentUser.batch.toLowerCase());
      const matchingClass = schedules.find(s => s.id === asg.classId);
      const isEnrolledInClass = matchingClass?.enrolledStudentIds?.includes(currentUser.id);
      return (matchesCourse && matchesBatch) || isEnrolledInClass;
    });

    const gradedAssignments = studentAssignmentsList.filter(asg => {
      const submission = asg.submissions.find(s => s.studentId === currentUser.id);
      return submission && submission.score !== undefined;
    });

    const totalEvaluations = studentAssignmentsList.length;
    const completedEvaluations = gradedAssignments.length;
    const progressPercentage = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;
    const isComplete = totalEvaluations > 0 && completedEvaluations === totalEvaluations;

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const certNo = `LRNA-2026-${currentUser.id.slice(0, 6).toUpperCase()}`;
    const courseName = currentUser.course || 'Learnora Elite Coaching Program';

    const downloadCertificateAsPNG = () => {
      setIsGenerating(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Off-white bg
      ctx.fillStyle = '#fbfbfa';
      ctx.fillRect(0, 0, 1920, 1080);

      // Gold elegant frame
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 1920 - 60, 1080 - 60);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(52, 52, 1920 - 104, 1080 - 104);

      // Inner thin frame
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(62, 62, 1920 - 124, 1080 - 124);

      // Corner gold designs
      ctx.fillStyle = '#d97706';
      const cSize = 45;
      ctx.fillRect(72, 72, cSize, 5);
      ctx.fillRect(72, 72, 5, cSize);
      ctx.fillRect(1920 - 72 - cSize, 72, cSize, 5);
      ctx.fillRect(1920 - 72, 72, 5, cSize);
      ctx.fillRect(72, 1080 - 72 - 5, cSize, 5);
      ctx.fillRect(72, 1080 - 72 - cSize, 5, cSize);
      ctx.fillRect(1920 - 72 - cSize, 1080 - 72 - 5, cSize, 5);
      ctx.fillRect(1920 - 72, 1080 - 72 - cSize, 5, cSize);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Header Brand
      ctx.fillStyle = '#1e1b4b';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillText('L E A R N O R A   I N S T I T U T E', 1920 / 2, 160);

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1920 / 2 - 140, 200);
      ctx.lineTo(1920 / 2 + 140, 200);
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 55px Georgia, serif';
      ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 1920 / 2, 260);

      ctx.fillStyle = '#4b5563';
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText('This is proudly presented to', 1920 / 2, 360);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 64px Georgia, serif';
      ctx.fillText(currentUser.name, 1920 / 2, 450);

      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1920 / 2 - 300, 500);
      ctx.lineTo(1920 / 2 + 300, 500);
      ctx.stroke();

      ctx.fillStyle = '#374151';
      ctx.font = '20px Georgia, serif';
      ctx.fillText('for successfully fulfilling all course curriculum directives and passing all required evaluations for the', 1920 / 2, 560);
      
      ctx.font = 'bold 26px Georgia, serif';
      ctx.fillStyle = '#4f46e5';
      ctx.fillText(`"${courseName}"`, 1920 / 2, 610);

      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Georgia, serif';
      ctx.fillText('Honoring outstanding dedication, class engagement, and verification milestone completions.', 1920 / 2, 660);

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`CERTIFICATE ID: ${certNo}  •  Issued: ${todayStr}`, 1920 / 2, 720);

      // Gold Seal Ring
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(1920 / 2, 850, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Seal Ribbon
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(1920 / 2 - 20, 905);
      ctx.lineTo(1920 / 2 - 40, 985);
      ctx.lineTo(1920 / 2, 965);
      ctx.lineTo(1920 / 2 + 40, 985);
      ctx.lineTo(1920 / 2 + 20, 905);
      ctx.fill();

      // Seal Label
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 15px "SF Pro", sans-serif';
      ctx.fillText('OFFICIAL', 1920 / 2, 840);
      ctx.font = 'bold 13px "SF Pro", sans-serif';
      ctx.fillText('SEAL', 1920 / 2, 860);

      // Left Faculty Sign
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(340, 880);
      ctx.lineTo(580, 880);
      ctx.stroke();

      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(350, 855);
      ctx.bezierCurveTo(390, 815, 430, 875, 470, 825);
      ctx.bezierCurveTo(490, 805, 540, 845, 570, 835);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText('Anik Baidya', 460, 910);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Georgia, serif';
      ctx.fillText('Head & Lead Administrator', 460, 935);

      // Right Exam Board Sign
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1340, 880);
      ctx.lineTo(1580, 880);
      ctx.stroke();

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(1360, 855);
      ctx.quadraticCurveTo(1410, 815, 1450, 865);
      ctx.quadraticCurveTo(1510, 825, 1560, 850);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText('Learnora Exam Board', 1460, 910);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Georgia, serif';
      ctx.fillText('Academic Verification Dept', 1460, 935);

      setTimeout(() => {
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
      }, 500);
    };

    const downloadCertificateAsHTML = () => {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${currentUser.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Montserrat:wght@400;600&display=swap');
    body {
      margin: 0;
      padding: 40px;
      background-color: #f3f4f6;
      font-family: 'Montserrat', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .cert-container {
      width: 1000px;
      height: 700px;
      background: #fbfbfa;
      padding: 24px;
      box-sizing: border-box;
      position: relative;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border-radius: 12px;
    }
    .outer-border {
      width: 100%;
      height: 100%;
      border: 12px double #d97706;
      box-sizing: border-box;
      padding: 30px;
      position: relative;
    }
    .inner-border {
      width: 100%;
      height: 100%;
      border: 2px solid #fbbf24;
      box-sizing: border-box;
      padding: 20px;
      text-align: center;
    }
    .header {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      color: #1e1b4b;
      letter-spacing: 5px;
      margin-bottom: 5px;
      font-weight: 800;
    }
    .divider {
      width: 120px;
      height: 2px;
      background-color: #d97706;
      margin: 10px auto;
    }
    .sub-header {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      color: #b45309;
      font-weight: 800;
      margin-bottom: 25px;
      letter-spacing: 2px;
    }
    .present-text {
      font-style: italic;
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 42px;
      font-weight: bold;
      color: #111827;
      border-bottom: 2px solid #1e1b4b;
      display: inline-block;
      padding-bottom: 8px;
      margin-bottom: 20px;
      font-family: 'Cinzel', serif;
    }
    .sentence {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;
      max-width: 700px;
      margin: 0 auto 20px;
    }
    .course-title {
      font-weight: 700;
      color: #4f46e5;
      font-size: 18px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: absolute;
      bottom: 50px;
      left: 80px;
      right: 80px;
    }
    .signature-block {
      text-align: center;
      width: 250px;
    }
    .signature-line {
      border-top: 1.5px solid #4b5563;
      margin-top: 40px;
      padding-top: 8px;
    }
    .signature-name {
      font-weight: bold;
      color: #1e1b4b;
      font-size: 13px;
    }
    .signature-title {
      color: #718096;
      font-size: 11px;
      margin-top: 2px;
    }
    .seal-block {
      text-align: center;
    }
    .seal {
      width: 80px;
      height: 80px;
      background: #fbbf24;
      border-radius: 50%;
      border: 3px solid #d97706;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #78350f;
      font-weight: bold;
      font-size: 10px;
      letter-spacing: 1px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    .seal::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 20px;
      width: 0;
      height: 0;
      border-left: 20px solid transparent;
      border-right: 20px solid transparent;
      border-top: 35px solid #92400e;
      z-index: -1;
    }
    .cert-meta {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 15px;
      letter-spacing: 1px;
    }
    .actions {
      margin-top: 30px;
      display: flex;
      gap: 15px;
    }
    .print-btn {
      padding: 12px 24px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
      transition: all 0.15s ease;
    }
    .print-btn:hover {
      background: #4338ca;
    }
    @media print {
      .actions, .print-btn { display: none !important; }
      body { background: transparent; padding: 0; }
      .cert-container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="cert-container" id="cert-print">
    <div class="outer-border">
      <div class="inner-border">
        <div class="header">LEARNORA INSTITUTE</div>
        <div class="divider"></div>
        <div class="sub-header">CERTIFICATE OF ACHIEVEMENT</div>
        
        <div class="present-text">This is proudly presented to</div>
        <div class="student-name">${currentUser.name}</div>
        
        <div class="sentence">
          for successfully fulfilling all course curriculum directives and passing all required evaluations for the
          <br><span class="course-title">"${courseName}"</span>
          <br>
          <span style="font-size: 12px; color: #718096; display: block; margin-top: 8px;">
            Honoring outstanding dedication, class engagement, and verification milestone completions.
          </span>
          <br>
          <span class="cert-meta">CERTIFICATE ID: ${certNo} &bull; Issued: ${todayStr}</span>
        </div>
        
        <div class="footer">
          <div class="signature-block">
            <div style="font-family: 'Cinzel', serif; font-size: 16px; color: #4f46e5; font-style: italic; margin-bottom: -32px;">Anik Baidya</div>
            <div class="signature-line">
              <div class="signature-name">Anik Baidya</div>
              <div class="signature-title">Head & Lead Administrator</div>
            </div>
          </div>
          
          <div class="seal-block">
            <div class="seal">
              <span style="text-align: center;">LEARNORA<br>SEAL</span>
            </div>
          </div>
          
          <div class="signature-block">
            <div style="font-family: 'Cinzel', serif; font-size: 16px; color: #059669; font-style: italic; margin-bottom: -32px;">Verified</div>
            <div class="signature-line">
              <div class="signature-name">Learnora Exam Board</div>
              <div class="signature-title">Academic Verification Dept</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="actions">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;

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

    return (
      <div className="space-y-6 font-sans">
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
            <div>
              <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                <Award className="w-8 h-8 text-amber-500" />
                Certificate Progress
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Track your course evaluation milestones to automatically unlock your completion certificate.
              </p>
            </div>
            {isComplete && (
              <button
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                onClick={() => setShowCertificateModal(true)}
              >
                <Award className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                View & Download Certificate
              </button>
            )}
          </div>

          <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  Course Completion
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {completedEvaluations} of {totalEvaluations} evaluations cleared
                </p>
              </div>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {Math.round(progressPercentage)}%
              </p>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-[#161618] rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute top-0 left-0 bottom-0 right-0 w-full h-full animate-shimmer" style={{
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
                  backgroundSize: '200% 100%'
                }}></div>
              </div>
            </div>
            
            {isComplete && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Congratulations!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                    You have successfully cleared all required evaluations for this course. Your certificate has been automatically generated and is now ready for download.
                  </p>
                  <button
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-block cursor-pointer"
                    onClick={() => setShowCertificateModal(true)}
                  >
                    Open Certificate Drawer
                  </button>
                </div>
              </div>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Evaluation Milestones
          </h3>
          
          {studentAssignmentsList.length === 0 ? (
            <div className="text-center py-12 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">No evaluations assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentAssignmentsList.map((asg, idx) => {
                const submission = asg.submissions.find(s => s.studentId === currentUser.id);
                const isCleared = submission && submission.score !== undefined;
                
                return (
                  <div key={asg.id} className="p-4 bg-white dark:bg-[#0c0d12]/40 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        {isCleared ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#161618] border border-slate-200 dark:border-white/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isCleared ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-zinc-300'}`}>
                          {asg.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Class Ref: {asg.className}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/5">
                      {isCleared ? (
                        <div className="text-right flex-1 sm:flex-none">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block">
                            Cleared &bull; {submission.score}/{asg.maxPoints} pts
                          </p>
                        </div>
                      ) : (
                        <div className="text-right flex-1 sm:flex-none">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 px-2 py-1 rounded inline-block">
                            Pending Evaluation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                      <p className="text-[9px] text-stone-500 font-serif font-medium uppercase tracking-wider">
                        CERTIFICATE ID: {certNo} &bull; Issued On {todayStr}
                      </p>
                    </div>

                    {/* Bottom Signature Line & Ribbon Seal */}
                    <div className="grid grid-cols-3 items-end pt-4">
                      {/* Signature left */}
                      <div className="text-center flex flex-col justify-end">
                        <span className="font-serif text-indigo-700 text-xs md:text-sm italic font-medium translate-y-2">Anik Baidya</span>
                        <div className="border-t border-stone-400 mt-2 pt-1">
                          <p className="text-[9px] md:text-[10px] font-bold text-stone-800">Anik Baidya</p>
                          <p className="text-[7.5px] md:text-[8.5px] text-stone-500">Head Administrator</p>
                        </div>
                      </div>

                      {/* Seal middle */}
                      <div className="flex flex-col items-center justify-center relative translate-y-1 md:translate-y-2">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-500 border-2 border-amber-600 shadow-md flex items-center justify-center text-white relative">
                          <span className="text-[6.5px] md:text-[8.5px] font-extrabold tracking-widest text-amber-950 font-sans text-center">
                            LEARNORA<br />SEAL
                          </span>
                          {/* hanging ribbons */}
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-amber-700 clip-ribbon z-[-1] opacity-75"></div>
                        </div>
                      </div>

                      {/* Signature right */}
                      <div className="text-center flex flex-col justify-end">
                        <span className="font-serif text-emerald-700 text-xs md:text-sm italic font-medium translate-y-2">Verified</span>
                        <div className="border-t border-stone-400 mt-2 pt-1">
                          <p className="text-[9px] md:text-[10px] font-bold text-stone-800">Exam Ledger Board</p>
                          <p className="text-[7.5px] md:text-[8.5px] text-stone-500">Learnora Academic Dept</p>
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

                      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${currentUser.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Montserrat:wght@400;600&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: 'Montserrat', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cert-container {
      width: 1000px;
      height: 700px;
      background: #fbfbfa;
      padding: 24px;
      box-sizing: border-box;
      position: relative;
    }
    .outer-border {
      width: 100%;
      height: 100%;
      border: 12px double #d97706;
      box-sizing: border-box;
      padding: 30px;
      position: relative;
    }
    .inner-border {
      width: 100%;
      height: 100%;
      border: 2px solid #fbbf24;
      box-sizing: border-box;
      padding: 20px;
      text-align: center;
    }
    .header {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      color: #1e1b4b;
      letter-spacing: 5px;
      margin-bottom: 5px;
      font-weight: 800;
      margin-top: 10px;
    }
    .divider {
      width: 120px;
      height: 2px;
      background-color: #d97706;
      margin: 10px auto;
    }
    .sub-header {
      font-family: 'Cinzel', serif;
      font-size: 32px;
      color: #b45309;
      font-weight: 800;
      margin-bottom: 25px;
      letter-spacing: 2px;
    }
    .present-text {
      font-style: italic;
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 42px;
      font-weight: bold;
      color: #111827;
      border-bottom: 2px solid #1e1b4b;
      display: inline-block;
      padding-bottom: 8px;
      margin-bottom: 20px;
      font-family: 'Cinzel', serif;
    }
    .sentence {
      font-size: 15px;
      color: #374151;
      line-height: 1.8;
      max-width: 700px;
      margin: 0 auto 20px;
    }
    .course-title {
      font-weight: 700;
      color: #4f46e5;
      font-size: 18px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: absolute;
      bottom: 50px;
      left: 80px;
      right: 80px;
    }
    .signature-block {
      text-align: center;
      width: 250px;
    }
    .signature-line {
      border-top: 1.5px solid #4b5563;
      margin-top: 40px;
      padding-top: 8px;
    }
    .signature-name {
      font-weight: bold;
      color: #1e1b4b;
      font-size: 13px;
    }
    .signature-title {
      color: #718096;
      font-size: 11px;
      margin-top: 2px;
    }
    .seal-block {
      text-align: center;
    }
    .seal {
      width: 80px;
      height: 80px;
      background: #fbbf24;
      border-radius: 50%;
      border: 3px solid #d97706;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #78350f;
      font-weight: bold;
      font-size: 10px;
      letter-spacing: 1px;
      position: relative;
    }
    .seal::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 20px;
      width: 0;
      height: 0;
      border-left: 20px solid transparent;
      border-right: 20px solid transparent;
      border-top: 35px solid #92400e;
      z-index: -1;
    }
    .cert-meta {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 15px;
      letter-spacing: 1px;
    }
    @page {
      size: landscape;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="outer-border">
      <div class="inner-border">
        <div class="header">LEARNORA INSTITUTE</div>
        <div class="divider"></div>
        <div class="sub-header">CERTIFICATE OF ACHIEVEMENT</div>
        
        <div class="present-text">This is proudly presented to</div>
        <div class="student-name">${currentUser.name}</div>
        
        <div class="sentence">
          for successfully fulfilling all course curriculum directives and passing all required evaluations for the
          <br><span class="course-title">"${courseName}"</span>
          <br>
          <span style="font-size: 12px; color: #718096; display: block; margin-top: 8px;">
            Honoring outstanding dedication, class engagement, and verification milestone completions.
          </span>
          <br>
          <span class="cert-meta">CERTIFICATE ID: ${certNo} &bull; Issued: ${todayStr}</span>
        </div>
        
        <div class="footer">
          <div class="signature-block">
            <div style="font-family: 'Cinzel', serif; font-size: 16px; color: #4f46e5; font-style: italic; margin-bottom: -32px;">Anik Baidya</div>
            <div class="signature-line">
              <div class="signature-name">Anik Baidya</div>
              <div class="signature-title">Head & Lead Administrator</div>
            </div>
          </div>
          
          <div class="seal-block">
            <div class="seal">
              <span style="text-align: center;">LEARNORA<br>SEAL</span>
            </div>
          </div>
          
          <div class="signature-block">
            <div style="font-family: 'Cinzel', serif; font-size: 16px; color: #059669; font-style: italic; margin-bottom: -32px;">Verified</div>
            <div class="signature-line">
              <div class="signature-name">Learnora Exam Board</div>
              <div class="signature-title">Academic Verification Dept</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

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
    </div>
  );
}
