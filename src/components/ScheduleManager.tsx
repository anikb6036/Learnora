/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, StudentBatch, Course } from '../types';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle, Ban, Filter, Search, User, Trash2, GraduationCap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleManagerProps {
  currentUser: UserAccount;
  schedules: ClassSchedule[];
  instructors: UserAccount[];
  students: UserAccount[];
  batches?: StudentBatch[];
  courses?: Course[];
  onAddClass: (newClass: Omit<ClassSchedule, 'id' | 'enrolledStudentIds' | 'course'> & { course?: string }) => void;
  onUpdateStatus: (classId: string, status: 'scheduled' | 'completed' | 'cancelled') => void;
  onSelfEnroll: (classId: string) => void;
  onAddBatch?: (newBatch: Omit<StudentBatch, 'id' | 'createdDate'>) => void;
  onDeleteBatch?: (id: string) => void;
  onAddCourse?: (newCourse: Omit<Course, 'id' | 'createdDate'>) => void;
  onDeleteCourse?: (id: string) => void;
}

export default function ScheduleManager({
  currentUser,
  schedules,
  instructors,
  students,
  batches = [],
  courses = [],
  onAddClass,
  onUpdateStatus,
  onSelfEnroll,
  onAddBatch,
  onDeleteBatch,
  onAddCourse,
  onDeleteCourse
}: ScheduleManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');
  const [instructorFilter, setInstructorFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [batchFilter, setBatchFilter] = useState<'all' | string>('all');
  const [courseFilter, setCourseFilter] = useState<'all' | string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [showCourseDashboard, setShowCourseDashboard] = useState(false);

  // New Batch Form State
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');

  // Course Management Form State
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseWeeks, setNewCourseWeeks] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // New Class Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('2026-06-01');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState('90');
  const [maxStudents, setMaxStudents] = useState('10');
  const [location, setLocation] = useState('');
  const [classBatch, setClassBatch] = useState('All');
  const [classCourse, setClassCourse] = useState('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructorId || !location) return;

    const chosenInstructor = instructors.find(i => i.id === instructorId);
    if (!chosenInstructor) return;

    onAddClass({
      title,
      subject,
      instructorId,
      instructorName: chosenInstructor.name,
      date,
      time,
      duration: parseInt(duration) || 60,
      maxStudents: parseInt(maxStudents) || 10,
      location,
      status: 'scheduled',
      batch: classBatch,
      course: classCourse
    });

    // Reset Form
    setTitle('');
    setInstructorId('');
    setLocation('');
    setClassBatch('All');
    setClassCourse('All');
    setShowAddForm(false);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    if (onAddBatch) {
      onAddBatch({
        name: newBatchName.trim(),
        description: newBatchDesc.trim() || undefined
      });
    }
    setNewBatchName('');
    setNewBatchDesc('');
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return;
    if (onAddCourse) {
      onAddCourse({
        name: newCourseName.trim(),
        code: newCourseCode.trim().toUpperCase(),
        durationWeeks: newCourseWeeks.trim() || undefined,
        description: newCourseDesc.trim() || undefined
      });
    }
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
  };

  const filteredSchedules = schedules.filter(cl => {
    const matchesSearch = cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cl.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || cl.subject === subjectFilter;
    const matchesInstructor = instructorFilter === 'all' || cl.instructorId === instructorFilter;
    const matchesStatus = statusFilter === 'all' || cl.status === statusFilter;

    // Role specific display constraints (Students see only classes they are enrolled in or that are assigned to their batch & course 'All')
    if (currentUser.role === 'student') {
      const isMyBatch = cl.batch && currentUser.batch && cl.batch.toLowerCase() === currentUser.batch.toLowerCase();
      const isAllBatch = !cl.batch || cl.batch === 'All';
      const isExplicitlyEnrolled = cl.enrolledStudentIds.includes(currentUser.id);
      
      const isMyCourse = cl.course && currentUser.course && cl.course.toLowerCase() === currentUser.course.toLowerCase();
      const isAllCourse = !cl.course || cl.course === 'All';

      const matchesBatch = isMyBatch || isAllBatch || isExplicitlyEnrolled;
      const matchesCourse = isMyCourse || isAllCourse;

      if (!matchesBatch || !matchesCourse) {
        return false;
      }
    }

    const matchesBatchFilter = batchFilter === 'all' || cl.batch === batchFilter;
    const matchesCourseFilter = courseFilter === 'all' || cl.course === courseFilter;

    return matchesSearch && matchesSubject && matchesInstructor && matchesStatus && matchesBatchFilter && matchesCourseFilter;
  });

  const isEnrolled = (cl: ClassSchedule) => {
    return cl.enrolledStudentIds.includes(currentUser.id);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white dark:bg-[#161618] rounded-3xl border border-slate-150/80 dark:border-white/5 shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-serif italic text-amber-500 font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Class Scheduling & Timekeeping
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
              Set schedules, coordinate instructor workloads, or reserve online/offline study spaces.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {['admin', 'sub-admin'].includes(currentUser.role) && (
              <>
                <button
                  onClick={() => {
                    setShowBatchManager(!showBatchManager);
                    setShowCourseDashboard(false);
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#0A0A0C] dark:hover:bg-white/5 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  {showBatchManager ? 'Close Batch Manager' : 'Manage & Publish Batches'}
                </button>

                <button
                  onClick={() => {
                    setShowCourseDashboard(!showCourseDashboard);
                    setShowBatchManager(false);
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#0A0A0C] dark:hover:bg-white/5 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                  {showCourseDashboard ? 'Close Course Dashboard' : 'Courses Publish Dashboard'}
                </button>
              </>
            )}

            {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowBatchManager(false);
                  setShowCourseDashboard(false);
                  if (currentUser.role === 'instructor') {
                    setInstructorId(currentUser.id);
                  }
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-955 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddForm ? 'Close Scheduler Creator' : 'Schedule New Live Class'}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Courses Publish Dashboard */}
        <AnimatePresence>
          {showCourseDashboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-500" />
                      Dynamic Course Publish Dashboard
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create, review, or decommission active courses. Decommissioning a course will unpublish it from future admissions directory.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Course creation form */}
                  <form onSubmit={handleCourseSubmit} className="space-y-3 bg-white dark:bg-[#060608] border border-slate-200/60 dark:border-white/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Publish New Course
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Course Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Medical NEET Prep"
                        value={newCourseName}
                        onChange={e => setNewCourseName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Course Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NEET2026"
                        value={newCourseCode}
                        onChange={e => setNewCourseCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Duration (Weeks)</label>
                      <input
                        type="number"
                        placeholder="e.g. 52"
                        value={newCourseWeeks}
                        onChange={e => setNewCourseWeeks(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Description State</label>
                      <input
                        type="text"
                        placeholder="e.g. Entrance preparation"
                        value={newCourseDesc}
                        onChange={e => setNewCourseDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 rounded-xl text-xs font-bold shadow-md transition cursor-pointer mt-2"
                    >
                      Publish Course Registry
                    </button>
                  </form>

                  {/* List of active courses */}
                  <div className="lg:col-span-2 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono mb-2">
                      Registered Faculty Courses ({courses.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {courses.map(c => (
                        <div key={c.id} className="p-3 bg-white dark:bg-[#060608] border border-slate-200/60 dark:border-white/5 rounded-xl flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded">
                                {c.code}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 rounded">
                                {c.durationWeeks ? `${c.durationWeeks} Wks` : 'Ongoing'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{c.name}</p>
                            <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-normal">{c.description || 'No summary overview provided.'}</p>
                            <p className="text-[9px] text-slate-400 font-mono">Date Published: {c.createdDate}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to decommission and delete ${c.name}? This will remove it from admission listings.`)) {
                                if (onDeleteCourse) onDeleteCourse(c.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded transition cursor-pointer flex-shrink-0"
                            title="Decommission Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {courses.length === 0 && (
                        <div className="col-span-full py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
                          No active courses published in this learning system.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Batch Manager */}
        <AnimatePresence>
          {showBatchManager && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
                      Active Student Batches Registry
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create, overview, or decommission batches. Decommissioned cohorts will no longer be available when scheduling new sessions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Publish form */}
                  <form onSubmit={handleBatchSubmit} className="space-y-3 bg-white dark:bg-[#060608] border border-slate-200/60 dark:border-white/5 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono">
                      Publish New Batch
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Batch Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Batch E"
                        value={newBatchName}
                        onChange={e => setNewBatchName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Evening Fast-Track Cohort"
                        value={newBatchDesc}
                        onChange={e => setNewBatchDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold shadow transition cursor-pointer mt-2"
                    >
                      Publish Batch Cohort
                    </button>
                  </form>

                  {/* List of active batches */}
                  <div className="lg:col-span-2 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest font-mono mb-2">
                      Registered Batches ({batches.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {batches.map(b => (
                        <div key={b.id} className="p-3 bg-white dark:bg-[#060608] border border-slate-200/60 dark:border-white/5 rounded-xl flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                              {b.name}
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1">{b.description || 'No description provided.'}</p>
                            <p className="text-[9px] text-slate-400 font-mono">Created: {b.createdDate}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to unregister and decommission ${b.name}?`)) {
                                if (onDeleteBatch) onDeleteBatch(b.id);
                              }
                            }}
                            className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {batches.length === 0 && (
                        <div className="col-span-full py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
                          No active batches published in the system.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Class Creator Form */}
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
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
              >
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Session Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Einstein Theory of Relativity"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Course Domain / Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Coding">Coding</option>
                    <option value="Logic">Logic</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Lecturer / Instructor</label>
                  <select
                    value={instructorId}
                    onChange={e => setInstructorId(e.target.value)}
                    required
                    disabled={currentUser.role === 'instructor'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map(ins => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name} ({ins.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Duration (min)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Max Students Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxStudents}
                    onChange={e => setMaxStudents(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Target Student Batch</label>
                  <select
                    value={classBatch}
                    onChange={e => setClassBatch(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="All">All Batches</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Target Student Course</label>
                  <select
                    value={classCourse}
                    onChange={e => setClassCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="All">All Courses</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Location (Room or Online link)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lab 3B, Room 202 or Zoom ID"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-2 flex justify-end gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold shadow transition cursor-pointer"
                  >
                    Publish to Classroom Calendar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtering Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search schedule subjects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3.5 py-2.5 text-xs border border-slate-200 dark:border-white/5 dark:bg-[#0A0A0B] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-white dark:bg-[#0A0A0B]">
            <Filter className="w-3 h-3 text-zinc-500" />
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full py-2 text-xs bg-transparent text-slate-705 dark:text-zinc-300 focus:outline-none border-0"
            >
              <option value="all">Subject: All</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Coding">Coding</option>
              <option value="Logic">Logic</option>
            </select>
          </div>

          {currentUser.role !== 'student' ? (
            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-white dark:bg-[#0A0A0B]">
              <User className="w-3 h-3 text-zinc-500" />
              <select
                value={instructorFilter}
                onChange={e => setInstructorFilter(e.target.value)}
                className="w-full py-2 text-xs bg-transparent text-slate-705 dark:text-zinc-300 focus:outline-none border-0"
              >
                <option value="all">Lecturer: All</option>
                {instructors.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-slate-50 dark:bg-[#0A0A0B] opacity-60">
              <User className="w-3 h-3 text-zinc-550" />
              <span className="text-xs text-slate-500 dark:text-zinc-400 select-none py-2 px-1">My Enrolled Lectures Only</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-white dark:bg-[#0A0A0B]">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-2 text-xs bg-transparent text-slate-705 dark:text-zinc-300 focus:outline-none border-0"
            >
              <option value="all">Any Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-white dark:bg-[#0A0A0B]">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="w-full py-2 text-xs bg-transparent text-slate-705 dark:text-zinc-300 focus:outline-none border-0"
            >
              <option value="all">Batch: All</option>
              {batches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/5 rounded-xl px-2.5 bg-white dark:bg-[#0A0A0B]">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="w-full py-2 text-xs bg-transparent text-slate-705 dark:text-zinc-300 focus:outline-none border-0"
            >
              <option value="all">Course: All</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.length === 0 ? (
            <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center">
              <p className="text-xs text-slate-400 font-mono">No active classes found match parameters.</p>
            </div>
          ) : (
            filteredSchedules.map(cl => {
              const fullCapacity = cl.enrolledStudentIds.length >= cl.maxStudents;
              const isUserEnrolledVal = isEnrolled(cl);
              return (
                <div
                  key={cl.id}
                  className={`rounded-2xl border transition relative flex flex-col justify-between overflow-hidden shadow-sm ${
                    isUserEnrolledVal
                      ? 'border-amber-500/30 dark:border-amber-500/20 bg-amber-500/[0.03] bg-white dark:bg-[#161618]'
                      : 'border-slate-150/85 dark:border-white/5 bg-white dark:bg-[#161618]'
                  }`}
                >
                  <div className="p-5 flex-1 select-none">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center mb-3 text-xs font-mono">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-zinc-300">
                          {cl.subject}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase bg-blue-500/10 text-blue-600 dark:text-blue-300">
                          Batch: {cl.batch || 'All'}
                        </span>
                        {cl.course && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Course: {cl.course}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          cl.status === 'scheduled'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            : cl.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450'
                        }`}
                      >
                        {cl.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight hover:text-amber-550 dark:hover:text-amber-500 cursor-pointer transition">
                      {cl.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-401 mt-1 font-semibold">
                      by {cl.instructorName}
                    </p>

                    {/* Timeline information */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-zinc-400">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{cl.date}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{cl.time} ({cl.duration} min duration)</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{cl.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>
                          Enrolled: {cl.enrolledStudentIds.length}/{cl.maxStudents} students{' '}
                          {fullCapacity && <span className="text-amber-500 font-bold ml-1 font-mono">MAXED</span>}
                        </span>
                      </p>
                    </div>

                    {isUserEnrolledVal && (
                      <div className="absolute top-0 right-0 p-1.5 bg-amber-500 text-amber-950 rounded-bl-xl shadow-sm">
                        <span className="text-[9px] font-mono font-extrabold px-1 select-none">ENROLLED</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar of the individual Class card */}
                  <div className="p-4 bg-slate-50/50 dark:bg-[#0F0F11]/30 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-2 justify-between">
                    {cl.status === 'scheduled' && (
                      <>
                        {/* Administrator or Assigned Instructor controls */}
                        {((['admin', 'sub-admin'].includes(currentUser.role)) || (currentUser.role === 'instructor' && currentUser.id === cl.instructorId)) ? (
                          <div className="flex gap-2 w-full justify-end font-sans">
                            <button
                              onClick={() => onUpdateStatus(cl.id, 'completed')}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-lg transition cursor-pointer"
                            >
                              ✓ Complete Session
                            </button>
                            <button
                              onClick={() => onUpdateStatus(cl.id, 'cancelled')}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-55 hover:bg-rose-50/10 text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-white/5 dark:bg-[#0A0A0B] rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : currentUser.role === 'student' ? (
                          <button
                            onClick={() => onSelfEnroll(cl.id)}
                            disabled={isUserEnrolledVal || fullCapacity}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer ${
                              isUserEnrolledVal
                                ? 'bg-slate-100 dark:bg-white/5 text-zinc-500 cursor-default shadow-none border border-slate-200 dark:border-white/5'
                                : fullCapacity
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-[#09090B] dark:border dark:border-white/5'
                                  : 'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95'
                            }`}
                          >
                            {isUserEnrolledVal ? 'Registered & Prepared' : fullCapacity ? 'Class Full' : 'Self-Enroll / Join Class'}
                          </button>
                        ) : null}
                      </>
                    )}

                    {cl.status !== 'scheduled' && (
                      <p className="text-[10px] text-slate-400 italic text-center w-full">
                        This session is {cl.status}. Action disabled.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
