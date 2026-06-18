/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord } from '../types';
import { Award, BookOpen, Clock, Plus, CornerDownRight, CheckCircle, Search, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProgressTrackerProps {
  currentUser: UserAccount;
  students: UserAccount[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
  onAddProgressRecord: (record: Omit<ProgressRecord, 'id' | 'evaluationDate' | 'instructorId' | 'instructorName'>) => void;
}

export default function ProgressTracker({
  currentUser,
  students,
  schedules,
  progressRecords,
  onAddProgressRecord
}: ProgressTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'excellent' | 'good' | 'average' | 'needs-improvement'>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

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
              Review personal progress cards (for students) or add evaluations (for instructors/admins) below.
            </p>
          </div>

          {currentUser.role !== 'student' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer select-none flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? 'Hide Progress Evaluator' : 'Submit Score & Review'}
            </button>
          )}
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
              placeholder={currentUser.role === 'student' ? "Search lessons..." : "Search students or lesson assignments..."}
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
