/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, StudentBatch, Course } from '../types';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle, Ban, Filter, Search, User, Trash2, GraduationCap, Sparkles, Pencil, Download, BookOpen, GitBranch, GitCommit } from 'lucide-react';
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
  onUpdateCourse?: (updatedCourse: Course) => void;
  onDeleteCourse?: (id: string) => void;
  onUpdateClass?: (updatedClass: ClassSchedule) => void;
  showAddForm?: boolean;
  setShowAddForm?: (val: boolean) => void;
  showBatchManager?: boolean;
  setShowBatchManager?: (val: boolean) => void;
  showCourseDashboard?: boolean;
  setShowCourseDashboard?: (val: boolean) => void;
}

const getSubjectIconObj = (subject?: string) => {
  const norm = (subject || '').trim().toLowerCase();
  if (norm.includes('physic')) {
    return { icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' };
  } else if (norm.includes('math')) {
    return { icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' };
  } else if (norm.includes('code') || norm.includes('coding') || norm.includes('program')) {
    return { icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' };
  } else if (norm.includes('logic')) {
    return { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' };
  } else if (norm.includes('biolog')) {
    return { icon: Users, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' };
  }
  return { icon: Calendar, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10 dark:bg-slate-500/20' };
};

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
  onUpdateCourse,
  onDeleteCourse,
  onUpdateClass,
  showAddForm: controlledShowAddForm,
  setShowAddForm: controlledSetShowAddForm,
  showBatchManager: controlledShowBatchManager,
  setShowBatchManager: controlledSetShowBatchManager,
  showCourseDashboard: controlledShowCourseDashboard,
  setShowCourseDashboard: controlledSetShowCourseDashboard,
}: ScheduleManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');
  const [instructorFilter, setInstructorFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [batchFilter, setBatchFilter] = useState<'all' | string>('all');
  const [courseFilter, setCourseFilter] = useState<'all' | string>('all');
  
  const [localShowAddForm, localSetShowAddForm] = useState(false);
  const [localShowBatchManager, localSetShowBatchManager] = useState(false);
  const [localShowCourseDashboard, localSetShowCourseDashboard] = useState(false);

  const showAddForm = controlledShowAddForm !== undefined ? controlledShowAddForm : localShowAddForm;
  const setShowAddForm = (val: boolean) => {
    if (controlledSetShowAddForm) controlledSetShowAddForm(val);
    else localSetShowAddForm(val);
  };

  const showBatchManager = controlledShowBatchManager !== undefined ? controlledShowBatchManager : localShowBatchManager;
  const setShowBatchManager = (val: boolean) => {
    if (controlledSetShowBatchManager) controlledSetShowBatchManager(val);
    else localSetShowBatchManager(val);
  };

  const showCourseDashboard = controlledShowCourseDashboard !== undefined ? controlledShowCourseDashboard : localShowCourseDashboard;
  const setShowCourseDashboard = (val: boolean) => {
    if (controlledSetShowCourseDashboard) controlledSetShowCourseDashboard(val);
    else localSetShowCourseDashboard(val);
  };

  // New Batch Form State
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');

  // Course Management Form State
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseWeeks, setNewCourseWeeks] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseStatus, setNewCourseStatus] = useState<'ongoing' | 'upcoming' | 'completed'>('ongoing');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // New Class Form State
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState('2026-06-01');
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState('90');
  const [maxStudents, setMaxStudents] = useState('10');
  const [location, setLocation] = useState('');
  const [classBatch, setClassBatch] = useState('All');
  const [classCourse, setClassCourse] = useState('All');

  // Pre-select instructor if current logged in user has the role 'instructor'
  React.useEffect(() => {
    if (currentUser && currentUser.role === 'instructor') {
      const match = instructors.find(i => i.id === currentUser.id || i.email === currentUser.email);
      if (match) {
        setInstructorId(match.id);
      } else if (currentUser.id) {
        setInstructorId(currentUser.id);
      }
    }
  }, [currentUser, instructors]);

  // State for internal delete confirmation
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<StudentBatch | null>(null);

  const startEditSchedule = (sch: ClassSchedule) => {
    setEditingSchedule(sch);
    setTitle(sch.title);
    setSubject(sch.subject || 'General');
    setInstructorId(sch.instructorId);
    setDate(sch.date);
    setTime(sch.time);
    setDuration(String(sch.duration));
    setMaxStudents(String(sch.maxStudents));
    setLocation(sch.location);
    setClassBatch(sch.batch || 'All');
    setClassCourse(sch.course || 'All');
    setShowAddForm(true);
  };

  const cancelEditSchedule = () => {
    setEditingSchedule(null);
    setTitle('');
    setSubject('General');
    if (currentUser && currentUser.role === 'instructor') {
      const match = instructors.find(i => i.id === currentUser.id || i.email === currentUser.email);
      setInstructorId(match ? match.id : (currentUser.id || ''));
    } else {
      setInstructorId('');
    }
    setDuration('90');
    setMaxStudents('10');
    setLocation('');
    setClassBatch('All');
    setClassCourse('All');
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructorId || !location) return;

    const chosenInstructor = instructors.find(i => i.id === instructorId);
    if (!chosenInstructor) return;

    if (editingSchedule) {
      if (onUpdateClass) {
        onUpdateClass({
          ...editingSchedule,
          title,
          subject,
          instructorId,
          instructorName: chosenInstructor.name,
          date,
          time,
          duration: parseInt(duration) || 60,
          maxStudents: parseInt(maxStudents) || 10,
          location,
          batch: classBatch,
          course: classCourse
        });
      }
      setEditingSchedule(null);
    } else {
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
    }

    // Reset Form
    setTitle('');
    if (currentUser && currentUser.role === 'instructor') {
      const match = instructors.find(i => i.id === currentUser.id || i.email === currentUser.email);
      setInstructorId(match ? match.id : (currentUser.id || ''));
    } else {
      setInstructorId('');
    }
    setDuration('90');
    setMaxStudents('10');
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
    
    if (editingCourse) {
      if (onUpdateCourse) {
        onUpdateCourse({
          ...editingCourse,
          name: newCourseName.trim(),
          code: newCourseCode.trim().toUpperCase(),
          durationWeeks: newCourseWeeks.trim() || undefined,
          description: newCourseDesc.trim() || undefined,
          status: newCourseStatus
        });
      }
      setEditingCourse(null);
    } else {
      if (onAddCourse) {
        onAddCourse({
          name: newCourseName.trim(),
          code: newCourseCode.trim().toUpperCase(),
          durationWeeks: newCourseWeeks.trim() || undefined,
          description: newCourseDesc.trim() || undefined,
          status: newCourseStatus
        });
      }
    }
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseStatus('ongoing');
  };

  const startEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourseName(course.name);
    setNewCourseCode(course.code);
    setNewCourseWeeks(course.durationWeeks || '');
    setNewCourseDesc(course.description || '');
    setNewCourseStatus(course.status || 'ongoing');
  };

  const cancelEditCourse = () => {
    setEditingCourse(null);
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseStatus('ongoing');
  };

  const filteredSchedules = schedules.filter(cl => {
    const matchesSearch = cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cl.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || cl.subject === subjectFilter;
    const matchesInstructor = instructorFilter === 'all' || cl.instructorId === instructorFilter;
    const matchesStatus = statusFilter === 'all' || cl.status === statusFilter;

    // Role specific display constraints (Students see only classes they are enrolled in or that are assigned to their course or Course 'All')
    if (currentUser.role === 'student') {
      const isExplicitlyEnrolled = cl.enrolledStudentIds.includes(currentUser.id);
      
      const isMyCourse = cl.course && currentUser.course && cl.course.toLowerCase() === currentUser.course.toLowerCase();
      const isAllCourse = !cl.course || cl.course === 'All';

      const matchesCourse = isMyCourse || isAllCourse || isExplicitlyEnrolled;

      if (!matchesCourse) {
        return false;
      }
    }

    const matchesCourseFilter = courseFilter === 'all' || cl.course === courseFilter;

    // Do not show sessions / timetables for courses that are completed
    if (cl.course && cl.course !== 'All') {
      const parentCourse = courses.find(c => c.name === cl.course || c.code === cl.course);
      if (parentCourse && parentCourse.status === 'completed') {
        return false;
      }
    }

    return matchesSearch && matchesSubject && matchesInstructor && matchesStatus && matchesCourseFilter;
  });

  const isEnrolled = (cl: ClassSchedule) => {
    return cl.enrolledStudentIds.includes(currentUser.id);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
        <div className="border-b border-slate-100 dark:border-white/5 pb-4.5 mb-6">
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Class Scheduling & Timekeeping
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            Set schedules, coordinate instructor workloads, or reserve online/offline study spaces.
          </p>
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
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2 font-sans">
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
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      {editingCourse ? 'Edit Published Course' : 'Publish New Course'}
                    </h4>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block font-sans">Course Name</label>
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
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block font-sans">Course Code</label>
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
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block font-sans">Duration (Months)</label>
                      <input
                        type="number"
                        placeholder="e.g. 12"
                        value={newCourseWeeks}
                        onChange={e => setNewCourseWeeks(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block font-sans">Description State</label>
                      <input
                        type="text"
                        placeholder="e.g. Entrance preparation"
                        value={newCourseDesc}
                        onChange={e => setNewCourseDesc(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block font-sans">Course Academic Status</label>
                      <select
                        value={newCourseStatus}
                        onChange={e => setNewCourseStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-895 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="ongoing">Current Course (Ongoing)</option>
                        <option value="upcoming">Upcoming Course</option>
                        <option value="completed">Complete Course</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 rounded-xl text-xs font-bold shadow-md transition cursor-pointer mt-2"
                      >
                        {editingCourse ? 'Update Course Details' : 'Publish Course Registry'}
                      </button>
                      {editingCourse && (
                        <button
                          type="button"
                          onClick={cancelEditCourse}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-650 dark:text-zinc-300 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer mt-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List of active courses */}
                  <div className="lg:col-span-2 space-y-6 max-h-[500px] overflow-y-auto pr-1">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-350 font-sans mb-2 flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-2">
                      Registered Faculty Courses ({courses.length})
                    </h4>

                    {[
                      { title: 'Current Courses (Ongoing)', data: courses.filter(c => !c.status || c.status === 'ongoing'), badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' },
                      { title: 'Upcoming Courses', data: courses.filter(c => c.status === 'upcoming'), badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-450 border-blue-500/10' },
                      { title: 'Completed Courses', data: courses.filter(c => c.status === 'completed'), badgeColor: 'bg-slate-500/10 text-slate-500 dark:text-gray-400 border-slate-500/20' }
                    ].map(sect => (
                      <div key={sect.title} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${sect.title.includes('Current') ? 'bg-emerald-500' : sect.title.includes('Upcoming') ? 'bg-blue-500' : 'bg-slate-400'}`} />
                          <h5 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-sans select-none">
                            {sect.title} ({sect.data.length})
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {sect.data.map(c => (
                            <div key={c.id} className="p-3 bg-white dark:bg-[#060608] border border-slate-200/60 dark:border-white/5 rounded-xl flex justify-between items-start gap-4 hover:shadow-xs transition duration-200">
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-sans">
                                    {c.code}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 rounded font-sans">
                                    {c.durationWeeks ? `${c.durationWeeks} Months` : 'Ongoing'}
                                  </span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-sans ${sect.badgeColor}`}>
                                    {c.status || 'ongoing'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{c.name}</p>
                                <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal">{c.description || 'No summary overview provided.'}</p>
                                <p className="text-[9px] text-slate-400 font-sans">Date Published: {c.createdDate}</p>
                              </div>

                              <div className="flex flex-col gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditCourse(c)}
                                  className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 rounded transition cursor-pointer"
                                  title="Edit Course Details"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCourseToDelete(c)}
                                  className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                                  title="Decommission Course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {sect.data.length === 0 && (
                            <div className="col-span-full py-4 text-center text-[10.5px] text-slate-400 dark:text-slate-500 font-sans border border-dashed border-slate-200/50 dark:border-white/5 rounded-xl">
                              No active courses in this section.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                {editingSchedule && (
                  <div className="col-span-full flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 pb-2.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        Editing Scheduled Session: <span className="text-amber-600 dark:text-amber-400 font-mono text-[11.5px]">{editingSchedule.title}</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={cancelEditSchedule}
                      className="text-[10.5px] font-semibold text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-white transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Session Title</label>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Lecturer / Instructor</label>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Duration (min)</label>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Max Students Capacity</label>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Target Student Course</label>
                  <select
                    value={classCourse}
                    onChange={e => setClassCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="All">All Courses</option>
                    {courses.filter(c => c.status !== 'completed').map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Location (Room or Online link)</label>
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
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold shadow transition cursor-pointer"
                  >
                    {editingSchedule ? 'Save Lecture Changes' : 'Publish to Classroom Calendar'}
                  </button>
                  {editingSchedule && (
                    <button
                      type="button"
                      onClick={cancelEditSchedule}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sending / Receiving Tab buttons mimicking Resend.com layout */}
        <div className="flex items-center gap-4 mb-5 border-b border-zinc-100 dark:border-white/5 pb-2.5 font-sans select-none animate-fade-in">
          <button
            type="button"
            onClick={() => setStatusFilter('scheduled')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'scheduled'
                ? 'bg-[#f4f4f5] dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100 font-bold'
                : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Scheduled Lectures
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#f4f4f5] dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100 font-bold'
                : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            All Sessions History
          </button>
        </div>

        {/* Universal Filter Toolbar mimicking Resend.com layout */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6 font-sans">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search schedules by title or subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200/40 dark:border-white/5 bg-[#f4f4f5]/60 dark:bg-zinc-900/40 rounded-xl text-slate-900 dark:text-gray-150 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
            >
              <option value="all">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Coding">Coding</option>
              <option value="Logic">Logic</option>
              <option value="Biology">Biology</option>
            </select>

            {/* Instructor Filter */}
            {currentUser.role !== 'student' && (
              <select
                value={instructorFilter}
                onChange={e => setInstructorFilter(e.target.value)}
                className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
              >
                <option value="all">All Lecturers</option>
                {instructors.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            )}

            {/* Fine status selection if needed (only visible if tab is 'all') */}
            {statusFilter !== 'scheduled' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
              >
                <option value="all">Any Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            {/* Course Filter */}
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
            >
              <option value="all">All Active Courses</option>
              {courses.filter(c => c.status !== 'completed').map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Export data button replicating the download button */}
            <button
              type="button"
              onClick={() => {
                const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredSchedules, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute('href', dataStr);
                downloadAnchor.setAttribute('download', 'class_schedule_export.json');
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="p-2.5 bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition cursor-pointer flex items-center justify-center"
              title="Export Current Timetable"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Schedules Grid / List styled like Vercel Deployments layout */}
        <div className="space-y-3 animate-fade-in font-sans">
          {filteredSchedules.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-sans border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708]/50">
              No active classes found matching the parameters.
            </div>
          ) : (
            <div className="border border-slate-200/60 dark:border-white/5 rounded-xl bg-white dark:bg-[#070708] overflow-hidden divide-y divide-slate-100 dark:divide-white/5 shadow-xs">
              {filteredSchedules.map(cl => {
                const fullCapacity = cl.enrolledStudentIds.length >= cl.maxStudents;
                const isUserEnrolledVal = isEnrolled(cl);

                return (
                  <div
                    key={cl.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition duration-150 text-xs group"
                  >
                    {/* Left block: Title, status dot, and tag */}
                    <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1 md:mr-6">
                      {/* Pulse Status Bullet */}
                      <div className="flex-shrink-0 mt-1 md:mt-0">
                        {cl.status === 'scheduled' ? (
                          <div className="flex items-center justify-center">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                          </div>
                        ) : cl.status === 'completed' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-450 dark:bg-zinc-550 block" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                        )}
                      </div>

                      {/* Title & Status Metadata */}
                      <div className="min-w-0 flex-1 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3">
                        <span className="font-bold text-slate-950 dark:text-white text-[14px]" title={cl.title}>
                          {cl.title}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold whitespace-nowrap bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded">
                          {cl.status === 'scheduled' ? 'Ready' : cl.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </span>

                        {cl.course && cl.course !== 'All' ? (
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border tracking-tight ${
                            isUserEnrolledVal
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/10'
                              : 'bg-slate-50 dark:bg-[#0c0c0e] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/10'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${isUserEnrolledVal ? 'bg-blue-500' : 'bg-slate-405'}`} />
                            {cl.course}
                            {isUserEnrolledVal && (
                              <span className="ml-1 text-[8.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Enrolled</span>
                            )}
                          </div>
                        ) : isUserEnrolledVal ? (
                          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border tracking-tight bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/10">
                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                            Enrolled
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Middle block: Instructor & Location details mapped as Git commit/branch */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium md:flex-shrink-0">
                      <div className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-zinc-200 transition">
                        <GitCommit className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                        <span className="font-mono text-[11.5px] text-slate-500 dark:text-zinc-400">{cl.instructorName || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-zinc-200 transition">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-555" />
                        <span className="text-[11px] font-mono">{cl.location}</span>
                      </div>
                    </div>

                    {/* Right block: Time relative, Avatars, Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:flex-shrink-0">
                      {/* Date details */}
                      <div className="text-left md:text-right flex flex-col">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          {cl.date}
                        </span>
                        <span className="text-[10px] text-slate-450 dark:text-zinc-455 font-sans mt-0.5 flex items-center justify-start md:justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {cl.time} ({cl.duration}m)
                        </span>
                      </div>

                      {/* Instructor Avatar with letter initials + student counter bubble */}
                      <div className="flex items-center -space-x-1.5">
                        <div 
                          className="w-6.5 h-6.5 rounded-full border border-white dark:border-[#070708] bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-xs select-none"
                          title={`Instructor: ${cl.instructorName}`}
                        >
                          {(cl.instructorName || 'U')[0]}
                        </div>
                        <div 
                          className="w-6.5 h-6.5 rounded-full border border-white dark:border-[#070708] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center text-[10px] font-bold shadow-xs select-none"
                          title={`${cl.enrolledStudentIds.length} enrolled / max ${cl.maxStudents}`}
                        >
                          {cl.enrolledStudentIds.length}
                        </div>
                      </div>

                      {/* Vercel-style Actions */}
                      <div className="flex items-center gap-2">
                        {cl.status === 'scheduled' && (
                          <div className="flex items-center gap-2">
                            {((['admin', 'sub-admin'].includes(currentUser.role)) || (currentUser.role === 'instructor' && currentUser.id === cl.instructorId)) ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditSchedule(cl);
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer font-sans"
                                  title="Edit session details"
                                >
                                  <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(cl.id, 'completed');
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10.5px] font-bold transition flex items-center gap-0.5 cursor-pointer font-sans"
                                  title="Mark completed"
                                >
                                  ✓ Done
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateStatus(cl.id, 'cancelled');
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[10.5px] font-bold transition flex items-center gap-0.5 cursor-pointer font-sans"
                                  title="Cancel session"
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            ) : currentUser.role === 'student' ? (
                              <button
                                onClick={(e) => {
                                  if (isUserEnrolledVal) return;
                                  e.stopPropagation();
                                  onSelfEnroll(cl.id);
                                }}
                                disabled={isUserEnrolledVal || fullCapacity}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  isUserEnrolledVal
                                    ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-default'
                                    : fullCapacity
                                      ? 'bg-slate-150 text-slate-400 cursor-not-allowed dark:bg-white/5'
                                      : 'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95'
                                }`}
                              >
                                {isUserEnrolledVal ? 'Enrolled' : fullCapacity ? 'Full' : 'Join Class'}
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {courseToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Decommission Course?
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Are you sure you want to decommission and delete <span className="font-bold text-slate-900 dark:text-white">{courseToDelete.name}</span>? This will remove it from admission listings.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-body/50 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteCourse) onDeleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {batchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Delete Batch?
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Are you sure you want to unregister and decommission <span className="font-bold text-slate-900 dark:text-white">{batchToDelete.name}</span>?
            </p>
             <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-body/50 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteBatch) onDeleteBatch(batchToDelete.id);
                  setBatchToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
