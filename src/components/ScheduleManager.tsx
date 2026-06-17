/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, StudentBatch, Course, MasterCourse } from '../types';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle, Ban, Filter, Search, User, Trash2, GraduationCap, Sparkles, Pencil, Download, BookOpen, GitBranch, GitCommit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduleManagerProps {
  currentUser: UserAccount;
  schedules: ClassSchedule[];
  instructors: UserAccount[];
  students: UserAccount[];
  batches?: StudentBatch[];
  courses?: Course[];
  masterCourses?: MasterCourse[];
  onAddClass: (newClass: Omit<ClassSchedule, 'id' | 'enrolledStudentIds' | 'course'> & { course?: string }) => void;
  onUpdateStatus: (classId: string, status: 'scheduled' | 'completed' | 'cancelled') => void;
  onSelfEnroll: (classId: string) => void;
  onAddBatch?: (newBatch: Omit<StudentBatch, 'id' | 'createdDate'>) => void;
  onDeleteBatch?: (id: string) => void;
  onAddCourse?: (newCourse: Omit<Course, 'id' | 'createdDate'>) => void;
  onUpdateCourse?: (updatedCourse: Course) => void;
  onDeleteCourse?: (id: string) => void;
  onAddMasterCourse?: (newMaster: Omit<MasterCourse, 'id' | 'createdDate'>) => void;
  onUpdateMasterCourse?: (updatedMaster: MasterCourse) => void;
  onDeleteMasterCourse?: (id: string) => void;
  onUpdateClass?: (updatedClass: ClassSchedule) => void;
  showAddForm?: boolean;
  setShowAddForm?: (val: boolean) => void;
  showBatchManager?: boolean;
  setShowBatchManager?: (val: boolean) => void;
  showCourseDashboard?: boolean;
  setShowCourseDashboard?: (val: boolean) => void;
  editingCourse?: Course | null;
  setEditingCourse?: (val: Course | null) => void;
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
  masterCourses = [],
  onAddClass,
  onUpdateStatus,
  onSelfEnroll,
  onAddBatch,
  onDeleteBatch,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddMasterCourse,
  onUpdateMasterCourse,
  onDeleteMasterCourse,
  onUpdateClass,
  showAddForm: controlledShowAddForm,
  setShowAddForm: controlledSetShowAddForm,
  showBatchManager: controlledShowBatchManager,
  setShowBatchManager: controlledSetShowBatchManager,
  showCourseDashboard: controlledShowCourseDashboard,
  setShowCourseDashboard: controlledSetShowCourseDashboard,
  editingCourse: propsEditingCourse,
  setEditingCourse: propsSetEditingCourse,
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
  const [newCourseWeeks, setNewCourseWeeks] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseStatus, setNewCourseStatus] = useState<'ongoing' | 'upcoming' | 'completed'>('upcoming');
  const [newCoursePublishDate, setNewCoursePublishDate] = useState('2026-06-15');
  const [newCourseAdmissionLastDate, setNewCourseAdmissionLastDate] = useState('2026-06-14');
  const [newCourseBatchNumber, setNewCourseBatchNumber] = useState('');
  const [roadmapDetails, setRoadmapDetails] = useState<{ month: number; title: string; description: string }[]>([]);
  const [selectedRoadmapMonth, setSelectedRoadmapMonth] = useState<number>(1);
  const [internalEditingCourse, setInternalEditingCourse] = useState<Course | null>(null);
  const editingCourse = propsEditingCourse !== undefined ? propsEditingCourse : internalEditingCourse;
  const setEditingCourse = propsSetEditingCourse !== undefined ? propsSetEditingCourse : setInternalEditingCourse;
  const [courseDashboardTab, setCourseDashboardTab] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');
  const [expandedCourseRoadmapId, setExpandedCourseRoadmapId] = useState<string | null>(null);

  // Master Course registration form state
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterDuration, setNewMasterDuration] = useState('6');
  const [newMasterDesc, setNewMasterDesc] = useState('');
  const [masterRoadmap, setMasterRoadmap] = useState<{ month: number; title: string; description: string }[]>([]);
  const [selectedMasterRoadmapMonth, setSelectedMasterRoadmapMonth] = useState<number>(1);
  const [editingMasterCourse, setEditingMasterCourse] = useState<MasterCourse | null>(null);

  // Publish Batch form state
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [customBatchName, setCustomBatchName] = useState('');
  const [publishBatchDate, setPublishBatchDate] = useState('2026-06-15');
  const [publishAdmissionLastDate, setPublishAdmissionLastDate] = useState('2026-06-14');
  const [publishStatus, setPublishStatus] = useState<'ongoing' | 'upcoming' | 'completed'>('upcoming');

  const [courseDashboardSubTab, setCourseDashboardSubTab] = useState<'publish' | 'master'>('publish');

  // Synchronize master roadmap milestones with the durationMonths (represented by newMasterDuration)
  React.useEffect(() => {
    const numMonths = parseInt(newMasterDuration);
    if (!isNaN(numMonths) && numMonths > 0 && numMonths <= 36) {
      if (selectedMasterRoadmapMonth > numMonths) {
        setSelectedMasterRoadmapMonth(1);
      }
      setMasterRoadmap(prev => {
        const updated = Array.from({ length: numMonths }, (_, idx) => {
          const monthNum = idx + 1;
          const existing = prev.find(p => p.month === monthNum);
          if (existing) return existing;
          
          let defaultTitle = `Month ${monthNum} Milestone`;
          let defaultDesc = `Objectives and syllabus for month ${monthNum}.`;
          
          if (newMasterName.trim()) {
            defaultTitle = `Month ${monthNum}: Core ${newMasterName.trim()} Concepts`;
            defaultDesc = `Advanced modules and practical assignments regarding ${newMasterName.trim()} in month ${monthNum}.`;
          }
          
          return {
            month: monthNum,
            title: defaultTitle,
            description: defaultDesc
          };
        });
        return updated;
      });
    } else {
      setMasterRoadmap([]);
      setSelectedMasterRoadmapMonth(1);
    }
  }, [newMasterDuration, newMasterName, selectedMasterRoadmapMonth]);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInfo, setAiInfo] = useState<string | null>(null);

  const handleAiGenerateCourse = async () => {
    const activeName = courseDashboardSubTab === 'master' ? newMasterName : newCourseName;
    const activeMonths = courseDashboardSubTab === 'master' ? newMasterDuration : newCourseWeeks;

    if (!activeName.trim()) {
      setAiError("Please enter a Course Name first.");
      return;
    }
    const months = parseInt(activeMonths);
    if (isNaN(months) || months < 1 || months > 36) {
      setAiError("Please specify a valid Duration (1-36 Months) first.");
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);
    setAiInfo(null);

    try {
      const response = await fetch("/api/generate-course-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName: activeName,
          durationMonths: months,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Non-JSON API Response received:", textResponse);
        throw new Error("Server returned an unexpected non-JSON response.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate AI data.");
      }
      
      const mappedRoadmap = Array.isArray(data.roadmap)
        ? data.roadmap
            .filter((item: any) => item && typeof item.month === "number")
            .map((item: any) => ({
              month: item.month,
              title: String(item.title || `Month ${item.month} Topic`),
              description: String(item.description || `Syllabus for Month ${item.month}`)
            }))
            .sort((a: any, b: any) => a.month - b.month)
        : [];

      if (courseDashboardSubTab === 'master') {
        if (data.description) setNewMasterDesc(data.description);
        setMasterRoadmap(mappedRoadmap);
        if (mappedRoadmap.length > 0) setSelectedMasterRoadmapMonth(mappedRoadmap[0].month);
        setAiInfo("Syllabus details generated successfully for Master Course!");
      } else {
        if (data.description) setNewCourseDesc(data.description);
        setRoadmapDetails(mappedRoadmap);
        if (mappedRoadmap.length > 0) setSelectedRoadmapMonth(mappedRoadmap[0].month);
        setAiInfo("Syllabus details generated successfully for Published Batch!");
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setAiError(err.message || "An unexpected error occurred while generating course details.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Synchronize roadmap milestones with the durationMonths (represented by newCourseWeeks)
  React.useEffect(() => {
    const numMonths = parseInt(newCourseWeeks);
    if (!isNaN(numMonths) && numMonths > 0 && numMonths <= 36) {
      if (selectedRoadmapMonth > numMonths) {
        setSelectedRoadmapMonth(1);
      }
      setRoadmapDetails(prev => {
        const updated = Array.from({ length: numMonths }, (_, idx) => {
          const monthNum = idx + 1;
          const existing = prev.find(p => p.month === monthNum);
          if (existing) return existing;
          
          let defaultTitle = `Month ${monthNum} Milestone`;
          let defaultDesc = `Objectives and syllabus for month ${monthNum}.`;
          
          if (newCourseName.trim()) {
            defaultTitle = `Month ${monthNum}: Core ${newCourseName.trim()} Concepts`;
            defaultDesc = `Advanced modules and practical assignments regarding ${newCourseName.trim()} in month ${monthNum}.`;
          }
          
          return {
            month: monthNum,
            title: defaultTitle,
            description: defaultDesc
          };
        });
        return updated;
      });
    } else {
      setRoadmapDetails([]);
      setSelectedRoadmapMonth(1);
    }
  }, [newCourseWeeks, newCourseName, selectedRoadmapMonth]);

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
  const [masterToDelete, setMasterToDelete] = useState<MasterCourse | null>(null);

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
    if (!newCourseName.trim()) return;
    
    const parsedDurationMonths = parseInt(newCourseWeeks) || undefined;
    
    const finalBatchNumber = newCourseBatchNumber.trim() || `stb_00${courses.length + 1}`;
    const generatedCode = finalBatchNumber.toUpperCase();
    if (editingCourse) {
      if (onUpdateCourse) {
        onUpdateCourse({
          ...editingCourse,
          name: newCourseName.trim(),
          code: generatedCode,
          batchNumber: finalBatchNumber,
          durationWeeks: newCourseWeeks.trim() || undefined,
          description: newCourseDesc.trim() || undefined,
          status: newCourseStatus,
          publishDate: newCoursePublishDate,
          admissionLastDate: newCourseAdmissionLastDate,
          durationMonths: parsedDurationMonths,
          roadmap: roadmapDetails
        });
      }
      setEditingCourse(null);
    } else {
      if (onAddCourse) {
        onAddCourse({
          name: newCourseName.trim(),
          code: generatedCode,
          batchNumber: finalBatchNumber,
          durationWeeks: newCourseWeeks.trim() || undefined,
          description: newCourseDesc.trim() || undefined,
          status: 'upcoming',
          publishDate: newCoursePublishDate,
          admissionLastDate: newCourseAdmissionLastDate,
          durationMonths: parsedDurationMonths,
          roadmap: roadmapDetails
        });
      }
    }
    setNewCourseName('');
    setNewCourseBatchNumber('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseStatus('upcoming');
    setNewCoursePublishDate('2026-06-15');
    setNewCourseAdmissionLastDate('2026-06-14');
    setRoadmapDetails([]);
  };

  const startEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourseName(course.name);
    setNewCourseBatchNumber(course.batchNumber || '');
    setNewCourseWeeks(course.durationWeeks || '');
    setNewCourseDesc(course.description || '');
    setNewCourseStatus(course.status || 'upcoming');
    setNewCoursePublishDate(course.publishDate || course.createdDate || '2026-06-15');
    setNewCourseAdmissionLastDate(course.admissionLastDate || '2026-06-14');
    setRoadmapDetails(course.roadmap || []);
  };

  const cancelEditCourse = () => {
    setEditingCourse(null);
    setNewCourseName('');
    setNewCourseBatchNumber('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseStatus('upcoming');
    setNewCoursePublishDate('2026-06-15');
    setNewCourseAdmissionLastDate('2026-06-14');
    setRoadmapDetails([]);
    setAiError(null);
    setAiInfo(null);
    setSelectedRoadmapMonth(1);
  };

  const handleMasterCourseFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) return;

    if (editingMasterCourse) {
      if (onUpdateMasterCourse) {
        onUpdateMasterCourse({
          ...editingMasterCourse,
          name: newMasterName.trim(),
          durationMonths: parseInt(newMasterDuration) || undefined,
          description: newMasterDesc.trim() || undefined,
          roadmap: masterRoadmap
        });
      }
      setEditingMasterCourse(null);
    } else {
      if (onAddMasterCourse) {
        onAddMasterCourse({
          name: newMasterName.trim(),
          durationMonths: parseInt(newMasterDuration) || undefined,
          description: newMasterDesc.trim() || undefined,
          roadmap: masterRoadmap
        });
      }
    }

    setNewMasterName('');
    setNewMasterDuration('6');
    setNewMasterDesc('');
    setMasterRoadmap([]);
    setAiInfo("Master course registered successfully!");
  };

  const startEditMasterCourse = (master: MasterCourse) => {
    setEditingMasterCourse(master);
    setNewMasterName(master.name);
    setNewMasterDuration(String(master.durationMonths || '6'));
    setNewMasterDesc(master.description || '');
    setMasterRoadmap(master.roadmap || []);
    setCourseDashboardSubTab('master');
  };

  const cancelEditMasterCourse = () => {
    setEditingMasterCourse(null);
    setNewMasterName('');
    setNewMasterDuration('6');
    setNewMasterDesc('');
    setMasterRoadmap([]);
  };

  const handlePublishBatchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterId) return;

    const matchedMaster = masterCourses.find(m => m.id === selectedMasterId);
    if (!matchedMaster) return;

    const writtenBatch = customBatchName.trim() || `stb_00${courses.length + 1}`;
    
    // Create an elegant custom course code from course initials and batch number
    const initials = matchedMaster.name.split(' ').map(w => w[0]).join('').toUpperCase();
    const generatedCode = `${initials}-${writtenBatch.toUpperCase()}`;

    if (onAddCourse) {
      onAddCourse({
        name: matchedMaster.name,
        code: generatedCode,
        batchNumber: writtenBatch,
        durationWeeks: matchedMaster.durationMonths ? String(matchedMaster.durationMonths * 4) : undefined,
        durationMonths: matchedMaster.durationMonths,
        description: matchedMaster.description,
        status: publishStatus,
        publishDate: publishBatchDate,
        admissionLastDate: publishAdmissionLastDate,
        roadmap: matchedMaster.roadmap
      });
    }

    setSelectedMasterId('');
    setCustomBatchName('');
    setPublishStatus('upcoming');
    setPublishAdmissionLastDate('2026-06-14');
    setAiInfo(`Successfully published batch "${writtenBatch}" for course "${matchedMaster.name}"!`);
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
            {showAddForm 
              ? 'Schedule New Live Class' 
              : showCourseDashboard 
                ? 'Courses Publish Dashboard' 
                : 'Scheduled Lectures & History'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            {showAddForm 
              ? 'Create and launch a new live interactive session, complete with lecturer assignments and target batched classrooms.' 
              : showCourseDashboard 
                ? 'Deploy curriculum schedules, register primary courses, and manage the student academy directories.' 
                : 'Manage class workflows, coordinate instructor sessions, and analyze course progress histories.'}
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
              <div className="p-5 md:p-6 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-100/80 dark:border-white/5 space-y-6">
                
                {/* Dashboard Header */}
                <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-zinc-100 font-sans leading-none mb-1">
                        Academy Course & Batch Publisher
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        First define the master curriculum template, then publish active or upcoming course batches for student enrollments.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      cancelEditCourse();
                      cancelEditMasterCourse();
                      setShowCourseDashboard(false);
                    }}
                    className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                    type="button"
                    title="Close Course Dashboard"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Sub Tab selection between Define Base Course and Publish Batch */}
                <div className="flex border-b border-slate-200 dark:border-white/5 pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCourseDashboardSubTab('master');
                      cancelEditCourse();
                    }}
                    className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      courseDashboardSubTab === 'master'
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                        : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    1. Define Course Curriculum
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseDashboardSubTab('publish');
                      cancelEditMasterCourse();
                      // Auto-select first masterCourse if available
                      if (!selectedMasterId && masterCourses.length > 0) {
                        setSelectedMasterId(masterCourses[0].id);
                      }
                    }}
                    className={`px-5 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      courseDashboardSubTab === 'publish'
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                        : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    2. Publish Batch Classrooms
                  </button>
                </div>

                {courseDashboardSubTab === 'master' ? (
                  /* TAB 1: DEFINE MASTER CURRICULUM */
                  <form onSubmit={handleMasterCourseFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Column: Core Definition details */}
                      <div className="lg:col-span-5 space-y-4 bg-white dark:bg-[#060608] border border-slate-200/65 dark:border-white/5 p-5 rounded-2xl shadow-xs">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 font-sans border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          {editingMasterCourse ? 'Edit Master Definition' : 'Add New Curriculum Template'}
                        </h4>

                        <div className="space-y-1.5 font-sans">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">Course Name</label>
                            <button
                              type="button"
                              onClick={handleAiGenerateCourse}
                              disabled={isAiGenerating}
                              className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                                isAiGenerating
                                  ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed"
                                  : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-500/40 shadow-3xs"
                              }`}
                              title="Generate description and syllabus milestone roadmap using Gemini"
                            >
                              <Sparkles className={`w-2.5 h-2.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                              {isAiGenerating ? 'Generating...' : 'Fill with Gemini AI'}
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mechanical Engineering fundamentals"
                            value={newMasterName}
                            onChange={e => setNewMasterName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-805 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          {aiError && (
                            <p className="text-[10px] text-red-500 font-semibold font-sans mt-0.5 flex items-center gap-1 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 animate-shake">
                              <span>⚠️ {aiError}</span>
                            </p>
                          )}
                          {aiInfo && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-sans mt-1 flex items-start gap-1 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                              <span>{aiInfo}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">Course Duration (Months)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="36"
                            placeholder="e.g. 6"
                            value={newMasterDuration}
                            onChange={e => setNewMasterDuration(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">Course Description</label>
                          <textarea
                            placeholder="Provide a comprehensive syllabus overview..."
                            value={newMasterDesc}
                            rows={4}
                            required
                            onChange={e => setNewMasterDesc(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y min-h-[96px]"
                          />
                        </div>
                      </div>

                      {/* Right Column: Roadmap Progression Track (7 out of 12 columns) */}
                      <div className="lg:col-span-7 space-y-4 bg-white dark:bg-[#060608] border border-slate-200/65 dark:border-white/5 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 font-sans">
                            <GitBranch className="w-4 h-4" />
                            <span>{masterRoadmap.length || 0}-Month Interactive Curriculum Roadmap</span>
                          </div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                            Live Sync
                          </span>
                        </div>

                        {masterRoadmap.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#060608]/40">
                            <GitBranch className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2 animate-pulse" />
                            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs font-medium leading-relaxed">
                              Syllabus milestones generate automatically. Specify Course Name and Duration, or use Gemini to outline high-quality targets.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[420px] overflow-y-auto pl-1 pr-3 py-1.5 bg-slate-50 dark:bg-black/15 border border-slate-150 dark:border-white/5 rounded-xl shadow-inner scrollbar-thin">
                            {masterRoadmap.map((milestone) => (
                              <div key={milestone.month} className="p-4 bg-white dark:bg-[#08080a] border border-slate-200/85 dark:border-white/10 rounded-xl space-y-2.5 shadow-2xs group transition-all hover:border-amber-500/20">
                                <div className="flex items-center justify-between font-sans">
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase flex items-center gap-1">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Month {milestone.month} Roadmap Title
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  placeholder={`Month ${milestone.month} Target Theme`}
                                  value={milestone.title}
                                  onChange={e => {
                                    const newVal = e.target.value;
                                    setMasterRoadmap(prev => prev.map(p => p.month === milestone.month ? { ...p, title: newVal } : p));
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#060608] text-slate-805 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/25"
                                />
                                <textarea
                                  placeholder={`Milestone Objectives for Month ${milestone.month}`}
                                  rows={3}
                                  value={milestone.description}
                                  onChange={e => {
                                    const newVal = e.target.value;
                                    setMasterRoadmap(prev => prev.map(p => p.month === milestone.month ? { ...p, description: newVal } : p));
                                  }}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#060608] text-slate-705 dark:text-zinc-350 focus:outline-none focus:ring-1 focus:ring-amber-500/25 leading-relaxed resize-y min-h-[64px]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unified Footer Controls */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-200/50 dark:border-white/5 pt-4 font-sans">
                      {editingMasterCourse && (
                        <button
                          type="button"
                          onClick={cancelEditMasterCourse}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                      >
                        {editingMasterCourse ? 'Save Definition' : 'Save To Curriculum Bank'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* TAB 2: PUBLISH BATCH WITH CHOSEN MASTER COURSE */
                  <form onSubmit={handlePublishBatchFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Column: Select Master Course & write batch */}
                      <div className="lg:col-span-5 space-y-4 bg-white dark:bg-[#060608] border border-slate-200/65 dark:border-white/5 p-5 rounded-2xl shadow-xs animate-fade-in">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 font-sans border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Publish Custom Batch
                        </h4>

                        <div className="space-y-1.5 font-sans">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-355 block font-sans">1. Select Core Course Curriculum</label>
                          <select
                            required
                            value={selectedMasterId}
                            onChange={e => setSelectedMasterId(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-805 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          >
                            <option value="">-- Choose Curriculum --</option>
                            {masterCourses.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.durationMonths || 6} Months Template)
                              </option>
                            ))}
                          </select>
                          {masterCourses.length === 0 && (
                            <p className="text-[10px] text-red-500 font-semibold mt-1 bg-red-500/5 p-2 rounded">
                              ⚠️ No course templates in curriculum bank. Define one in Tab 1 first!
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">2. Write Batch Name / Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Batch A, stb_02, Evening March"
                            value={customBatchName}
                            onChange={e => setCustomBatchName(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-805 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">Publish Date (Start)</label>
                            <input
                              type="date"
                              required
                              value={publishBatchDate}
                              onChange={e => setPublishBatchDate(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-350 block">Admission Last Date</label>
                            <input
                              type="date"
                              required
                              value={publishAdmissionLastDate}
                              onChange={e => setPublishAdmissionLastDate(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-355 block">Batch Status</label>
                            <select
                              value={publishStatus}
                              onChange={e => setPublishStatus(e.target.value as any)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#0A0A0B] text-slate-805 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            >
                              <option value="upcoming">Upcoming (Accepting Applications)</option>
                              <option value="ongoing">Ongoing (Current Active Class)</option>
                              <option value="completed">Completed (Archived Batch)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Selected template preview */}
                      <div className="lg:col-span-7 space-y-4 bg-white dark:bg-[#060608] border border-slate-200/65 dark:border-white/5 p-5 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2 mb-1">
                          <span className="text-xs font-bold text-slate-705 dark:text-zinc-300">Linked Curriculum Syllabus Preview</span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            Live Template Link
                          </span>
                        </div>

                        {!selectedMasterId ? (
                          <div className="p-8 text-center text-xs text-slate-400 dark:text-zinc-555 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#060608]/20">
                            Select a core course to preview its linked duration, curriculum, and target milestones.
                          </div>
                        ) : (() => {
                          const linked = masterCourses.find(m => m.id === selectedMasterId);
                          if (!linked) return null;
                          return (
                            <div className="space-y-3.5 animate-fade-in font-sans">
                              <div>
                                <h5 className="text-xs font-bold text-slate-805 dark:text-zinc-200">{linked.name}</h5>
                                <p className="text-[11px] text-slate-550 dark:text-zinc-405 leading-relaxed mt-1">{linked.description}</p>
                              </div>
                              <div className="border-t border-slate-100 dark:border-white/5 pt-3">
                                <h6 className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 mb-2 font-mono uppercase tracking-wider">Milestone Roadmap ({linked.durationMonths || 6} Months)</h6>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                  {linked.roadmap && linked.roadmap.length > 0 ? (
                                    linked.roadmap.map(rm => (
                                      <div key={rm.month} className="p-2.5 bg-slate-50 dark:bg-black/25 rounded-lg border border-slate-150 dark:border-white/5">
                                        <div className="text-[10px] font-bold text-slate-705 dark:text-zinc-300">Month {rm.month}: {rm.title}</div>
                                        <div className="text-[9.5px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">{rm.description}</div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic">No milestones defined in template.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Unified Footer Controls */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-200/50 dark:border-white/5 pt-4 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          cancelEditCourse();
                          setShowCourseDashboard(false);
                        }}
                        className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        Close Registry
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedMasterId}
                        className="px-5.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Publish Batch
                      </button>
                    </div>
                  </form>
                )}

                {/* DOUBLE MANAGEMENT VIEW PANELS */}
                <div className="border-t border-slate-200/80 dark:border-white/5 pt-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Panel A: Curriculum Base Courses */}
                    <div className="space-y-3 bg-white dark:bg-[#070709] border border-slate-150 dark:border-white/5 p-4.5 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <div className="flex items-center gap-1.5 flex-1 select-none">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-slate-805 dark:text-white">Curriculum Course Bank ({masterCourses.length})</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {masterCourses.map(master => (
                          <div key={master.id} className="p-3 bg-slate-50 dark:bg-[#0c0c0e] rounded-xl border border-slate-150 dark:border-white/5 group relative">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-slate-805 dark:text-zinc-200">{master.name}</h5>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">{master.durationMonths || 6} Months Duration</div>
                                <p className="text-[10px] text-slate-550 dark:text-zinc-405 mt-1 leading-normal line-clamp-2">{master.description}</p>
                              </div>

                              <div className="flex items-center gap-1 font-sans">
                                <button
                                  type="button"
                                  onClick={() => startEditMasterCourse(master)}
                                  className="p-1 hover:bg-slate-200 dark:hover:bg-white/5 rounded text-amber-600 dark:text-amber-400 transition cursor-pointer"
                                  title="Edit Template Description"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteMasterCourse && (
                                  <button
                                    type="button"
                                    onClick={() => setMasterToDelete(master)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-red-500/10 rounded text-rose-500 transition cursor-pointer"
                                    title="Delete from curriculum bank"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {masterCourses.length === 0 && (
                          <div className="text-center py-8 text-[11px] text-slate-400 font-sans">No core curricula templates registered.</div>
                        )}
                      </div>
                    </div>

                    {/* Panel B: Active Published Batches */}
                    <div className="space-y-3 bg-white dark:bg-[#070709] border border-slate-150 dark:border-white/5 p-4.5 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <div className="flex items-center gap-1.5 flex-1 select-none font-sans">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-bold text-slate-805 dark:text-white">Active Published Batches ({courses.length})</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                        {courses.map(pub => (
                          <div key={pub.id} className="p-3 bg-slate-50 dark:bg-[#0c0c0e] rounded-xl border border-slate-150 dark:border-white/5 relative hover:border-slate-300 dark:hover:border-zinc-700 transition">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <h5 className="text-xs font-bold text-slate-805 dark:text-zinc-200">{pub.name}</h5>
                                  <span className="text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md tracking-wider">{pub.batchNumber || 'Batch A'}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                    pub.status === 'ongoing'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : pub.status === 'upcoming'
                                        ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                        : 'bg-slate-200 dark:bg-white/5 text-slate-500'
                                  }`}>
                                    {pub.status}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-550 dark:text-zinc-405 font-mono mt-1">Course Code: {pub.code}</div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Launches: {pub.publishDate || pub.createdDate}</div>
                                {pub.admissionLastDate && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Admission Deadline: {pub.admissionLastDate}</div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {onDeleteCourse && (
                                  <button
                                    type="button"
                                    onClick={() => setCourseToDelete(pub)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-red-500/10 rounded text-rose-500 transition cursor-pointer"
                                    title="Archive Published Batch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {courses.length === 0 && (
                          <div className="text-center py-8 text-[11px] text-slate-400 font-sans">No published batches listings exist.</div>
                        )}
                      </div>
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
                      <option key={c.id} value={c.name}>{c.name} (Batch: {c.batchNumber || 'stb_001'})</option>
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

        {!showAddForm && !showCourseDashboard && (
          <>
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
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-[#f4f4f5] dark:bg-white/[0.08] text-slate-900 dark:text-zinc-100 font-bold'
                : 'text-slate-500 hover:text-slate-850 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Completed Classes
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
                const classStart = new Date(`${cl.date}T${cl.time}`);
                const now = new Date();
                const timeDiffMinutes = (classStart.getTime() - now.getTime()) / (1000 * 60);
                const isTimeOver = -timeDiffMinutes > Number(cl.duration);

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
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 dark:bg-blue-500/25 dark:text-blue-400 font-bold text-[10px]">
                            ✓
                          </div>
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                        )}
                      </div>

                      {/* Title & Status Metadata */}
                      <div className="min-w-0 flex-1 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3">
                        <span className={`font-bold text-slate-950 dark:text-white text-[14px] ${cl.status === 'completed' ? 'opacity-65 line-through decoration-slate-400/55' : ''}`} title={cl.title}>
                          {cl.title}
                        </span>

                        <span className={`text-[11px] font-semibold whitespace-nowrap px-2.5 py-0.5 rounded border ${
                          cl.status === 'scheduled'
                            ? 'bg-slate-100 text-slate-500 border-slate-200/60 dark:bg-white/5 dark:text-zinc-400 dark:border-white/5'
                            : cl.status === 'completed'
                              ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/10'
                              : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/10'
                        }`}>
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
                              isTimeOver ? null : (
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
                              )
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
          </>
        )}
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

      {masterToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" /> Delete Curriculum Template?
            </h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Are you sure you want to delete the base course curriculum template for <span className="font-bold text-slate-900 dark:text-white">{masterToDelete.name}</span>? This will remove it from the Curriculum Bank.
            </p>
             <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5 font-sans">
              <button
                type="button"
                onClick={() => setMasterToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-body/50 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMasterCourse) onDeleteMasterCourse(masterToDelete.id);
                  setMasterToDelete(null);
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
