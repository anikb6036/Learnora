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
  const [newCourseFee, setNewCourseFee] = useState('14999');
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
  const [newMasterFee, setNewMasterFee] = useState('14999');
  const [masterRoadmap, setMasterRoadmap] = useState<{ month: number; title: string; description: string }[]>([]);
  const [selectedMasterRoadmapMonth, setSelectedMasterRoadmapMonth] = useState<number>(1);
  const [editingMasterCourse, setEditingMasterCourse] = useState<MasterCourse | null>(null);

  // Publish Batch form state
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [customBatchName, setCustomBatchName] = useState('');
  const [publishFee, setPublishFee] = useState('14999');
  const [publishBatchDate, setPublishBatchDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [publishAdmissionLastDate, setPublishAdmissionLastDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [publishStatus, setPublishStatus] = useState<'ongoing' | 'upcoming' | 'completed'>('upcoming');

  const [courseDashboardSubTab, setCourseDashboardSubTab] = useState<'publish' | 'master'>('publish');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

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

  const uniqueActiveCourseNames = Array.from(
    new Set(courses.filter(c => c.status !== 'completed').map(c => c.name))
  );

  const availableBatchesForSelectedCourse = classCourse === 'All'
    ? ['All']
    : [
        'All',
        ...Array.from(
          new Set(
            courses
              .filter(c => c.name === classCourse)
              .map(c => c.batchNumber)
              .filter(Boolean) as string[]
          )
        )
      ];

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
    const finalFee = parseInt(newCourseFee) || 14999;
    
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
          roadmap: roadmapDetails,
          fee: finalFee
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
          roadmap: roadmapDetails,
          fee: finalFee
        });
      }
    }
    setNewCourseName('');
    setNewCourseBatchNumber('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseFee('14999');
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
    setNewCourseFee(course.fee ? String(course.fee) : '14999');
  };

  React.useEffect(() => {
    if (propsEditingCourse) {
      startEditCourse(propsEditingCourse);
    }
  }, [propsEditingCourse]);

  const cancelEditCourse = () => {
    setEditingCourse(null);
    setNewCourseName('');
    setNewCourseBatchNumber('');
    setNewCourseWeeks('');
    setNewCourseDesc('');
    setNewCourseFee('14999');
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

    const finalMasterFee = parseInt(newMasterFee) || 14999;

    if (editingMasterCourse) {
      if (onUpdateMasterCourse) {
        onUpdateMasterCourse({
          ...editingMasterCourse,
          name: newMasterName.trim(),
          durationMonths: parseInt(newMasterDuration) || undefined,
          description: newMasterDesc.trim() || undefined,
          roadmap: masterRoadmap,
          fee: finalMasterFee
        });
      }
      setEditingMasterCourse(null);
    } else {
      if (onAddMasterCourse) {
        onAddMasterCourse({
          name: newMasterName.trim(),
          durationMonths: parseInt(newMasterDuration) || undefined,
          description: newMasterDesc.trim() || undefined,
          roadmap: masterRoadmap,
          fee: finalMasterFee
        });
      }
    }

    setNewMasterName('');
    setNewMasterDuration('6');
    setNewMasterDesc('');
    setNewMasterFee('14999');
    setMasterRoadmap([]);
    setAiInfo("Master course registered successfully!");
  };

  const startEditMasterCourse = (master: MasterCourse) => {
    setEditingMasterCourse(master);
    setNewMasterName(master.name);
    setNewMasterDuration(String(master.durationMonths || '6'));
    setNewMasterDesc(master.description || '');
    setMasterRoadmap(master.roadmap || []);
    setNewMasterFee(master.fee ? String(master.fee) : '14999');
    setCourseDashboardSubTab('master');
  };

  const cancelEditMasterCourse = () => {
    setEditingMasterCourse(null);
    setNewMasterName('');
    setNewMasterDuration('6');
    setNewMasterDesc('');
    setNewMasterFee('14999');
    setMasterRoadmap([]);
  };

  const handlePublishBatchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterId) return;

    const matchedMaster = masterCourses.find(m => m.id === selectedMasterId);
    if (!matchedMaster) return;

    const finalPublishFee = parseInt(publishFee) || matchedMaster.fee || 14999;
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
        roadmap: matchedMaster.roadmap,
        fee: finalPublishFee
      });
    }

    setSelectedMasterId('');
    setCustomBatchName('');
    setPublishStatus('upcoming');
    setPublishFee('14999');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    setPublishAdmissionLastDate(futureDate.toISOString().split('T')[0]);
    setAiInfo(`Successfully published batch "${writtenBatch}" for course "${matchedMaster.name}" at ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(finalPublishFee)}!`);
  };

  const filteredSchedules = schedules.filter(cl => {
    const matchesSearch = cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cl.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || cl.subject === subjectFilter;
    const matchesInstructor = instructorFilter === 'all' || cl.instructorId === instructorFilter;
    
    // Auto-compute isTimeOver for this class
    const classStart = new Date(`${cl.date}T${cl.time}`);
    const now = new Date();
    const timeDiffMinutes = (classStart.getTime() - now.getTime()) / (1000 * 60);
    const isTimeOver = -timeDiffMinutes > Number(cl.duration);

    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'scheduled') {
      // In "Scheduled Lectures", only show classes with status 'scheduled' whose time is NOT yet over
      matchesStatus = cl.status === 'scheduled' && !isTimeOver;
    } else if (statusFilter === 'completed') {
      // In "Completed Classes", show explicitly completed classes or classes with scheduled status whose time IS over
      matchesStatus = cl.status === 'completed' || (cl.status === 'scheduled' && isTimeOver);
    } else {
      matchesStatus = cl.status === statusFilter;
    }

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
    const matchesBatchFilter = batchFilter === 'all' || cl.batch === batchFilter;

    // Do not show sessions / timetables for courses that are completed
    if (cl.course && cl.course !== 'All') {
      const parentCourse = courses.find(c => c.name === cl.course || c.code === cl.course);
      if (parentCourse && parentCourse.status === 'completed') {
        return false;
      }
    }

    return matchesSearch && matchesSubject && matchesInstructor && matchesStatus && matchesCourseFilter && matchesBatchFilter;
  });

  const isEnrolled = (cl: ClassSchedule) => {
    return cl.enrolledStudentIds.includes(currentUser.id);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Edit Course/Batch Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white dark:bg-[#09090B] border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden font-sans"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 dark:border-white/10 bg-slate-50 dark:bg-zinc-950">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-150 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Configure Course: {editingCourse.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={cancelEditCourse}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCourseSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Course Instance Name</label>
                    <input
                      type="text"
                      required
                      value={newCourseName}
                      onChange={e => setNewCourseName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Batch Number</label>
                    <input
                      type="text"
                      required
                      value={newCourseBatchNumber}
                      onChange={e => setNewCourseBatchNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Duration (Weeks)</label>
                    <input
                      type="number"
                      required
                      value={newCourseWeeks}
                      onChange={e => setNewCourseWeeks(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Tuition Fee (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newCourseFee}
                      onChange={e => setNewCourseFee(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Course / Batch Status</label>
                    <select
                      value={newCourseStatus}
                      onChange={e => setNewCourseStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    >
                      <option value="upcoming">Upcoming (Enrollment Open)</option>
                      <option value="ongoing">Ongoing (Class Active)</option>
                      <option value="completed">Completed (Class Over)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Course Start Date</label>
                    <input
                      type="date"
                      required
                      value={newCoursePublishDate}
                      onChange={e => setNewCoursePublishDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Admission Last Date</label>
                    <input
                      type="date"
                      required
                      value={newCourseAdmissionLastDate}
                      onChange={e => setNewCourseAdmissionLastDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Instance Overview Description</label>
                  <textarea
                    rows={3}
                    value={newCourseDesc}
                    onChange={e => setNewCourseDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-white/10">
                  <button
                    type="button"
                    onClick={cancelEditCourse}
                    className="px-4 py-2 text-xs font-bold rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-md bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
               <div className="p-6 rounded-lg bg-white dark:bg-[#08080a] border border-slate-200 dark:border-white/10 space-y-6">
                
                {/* Dashboard Header */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-sans mb-1">
                        Academy Course & Batch Publisher
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-zinc-400 font-sans">
                        Define curriculum templates and publish active course batches for student enrollments.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      cancelEditCourse();
                      cancelEditMasterCourse();
                      setShowCourseDashboard(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                    type="button"
                    title="Close Course Dashboard"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Sub Tab selection between Define Base Course and Publish Batch */}
                <div className="flex border-b border-react-tabs border-slate-100 dark:border-white/10 pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCourseDashboardSubTab('master');
                      cancelEditCourse();
                    }}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      courseDashboardSubTab === 'master'
                        ? 'border-amber-500 text-slate-900 dark:text-white font-semibold'
                        : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-850 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Define Course Curriculum
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
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                      courseDashboardSubTab === 'publish'
                        ? 'border-amber-500 text-slate-900 dark:text-white font-semibold'
                        : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-850 dark:hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Publish Batch Classrooms
                  </button>
                </div>

                {courseDashboardSubTab === 'master' ? (
                  /* TAB 1: DEFINE MASTER CURRICULUM */
                  <form onSubmit={handleMasterCourseFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Column: Core Definition details */}
                      <div className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg space-y-3.5">
                        <div className="border-b border-slate-250 dark:border-white/10 pb-2 mb-1.55">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 font-sans">
                            {editingMasterCourse ? 'Edit Master Definition' : 'Add New Curriculum Template'}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 font-sans">
                          <div className="space-y-1 md:col-span-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Course Name</label>
                              <button
                                type="button"
                                onClick={handleAiGenerateCourse}
                                disabled={isAiGenerating}
                                className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  isAiGenerating
                                    ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 cursor-not-allowed"
                                    : "bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:border-amber-500/40"
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
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                            {aiError && (
                              <p className="text-[11px] text-red-500 font-semibold font-sans mt-1 flex items-center gap-1 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                                <span>⚠️ {aiError}</span>
                              </p>
                            )}
                            {aiInfo && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold font-sans mt-1 flex items-start gap-1 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                <span>{aiInfo}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-1 col-span-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Course Duration (Months)</label>
                            <input
                              type="number"
                              required
                              min="1"
                              max="36"
                              placeholder="e.g. 6"
                              value={newMasterDuration}
                              onChange={e => setNewMasterDuration(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                          </div>

                          <div className="space-y-1 col-span-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Standard Tuition Fee (INR)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="e.g. 14999"
                              value={newMasterFee}
                              onChange={e => setNewMasterFee(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Course Description</label>
                            <textarea
                              placeholder="Provide a comprehensive syllabus overview..."
                              value={newMasterDesc}
                              rows={2}
                              required
                              onChange={e => setNewMasterDesc(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-y min-h-[64px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Roadmap Progression Track */}
                      <div className="space-y-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-lg">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2 mb-1.5 font-sans">
                          <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                            {masterRoadmap.length || 0}-Month Course Roadmap
                          </span>
                          <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3.5 py-0.5 rounded font-semibold">
                            Active Preview
                          </span>
                        </div>

                        {masterRoadmap.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#08080a]">
                            <GitBranch className="w-8 h-8 text-slate-300 dark:text-zinc-650 mb-2" />
                            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xs font-normal leading-relaxed font-sans">
                              Syllabus milestones generate automatically. Specify Course Name and Duration, or use Gemini to outline high-quality targets.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[320px] overflow-y-auto pl-1 pr-3 py-1.5 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-md scrollbar-thin">
                            {masterRoadmap.map((milestone) => (
                              <div key={milestone.month} className="p-4 bg-slate-50 dark:bg-[#08080a]/60 border border-slate-200 dark:border-white/10 rounded-md space-y-2.5 font-sans">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                    Month {milestone.month} Course Theme
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
                                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-medium"
                                />
                                <textarea
                                  placeholder={`Milestone Objectives for Month ${milestone.month}`}
                                  rows={2}
                                  value={milestone.description}
                                  onChange={e => {
                                    const newVal = e.target.value;
                                    setMasterRoadmap(prev => prev.map(p => p.month === milestone.month ? { ...p, description: newVal } : p));
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/30 leading-relaxed resize-y min-h-[50px]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unified Footer Controls */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/10 pt-4 font-sans">
                      {editingMasterCourse && (
                        <button
                          type="button"
                          onClick={cancelEditMasterCourse}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-705 dark:text-zinc-300 rounded-md text-sm font-medium transition cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-bold transition cursor-pointer"
                      >
                        {editingMasterCourse ? 'Save Definition' : 'Save Curriculum'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* TAB 2: PUBLISH BATCH WITH CHOSEN MASTER COURSE */
                  <form onSubmit={handlePublishBatchFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Column: Select Master Course & write batch */}
                      <div className="p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg animate-fade-in space-y-3.5">
                        <div className="border-b border-slate-250 dark:border-white/10 pb-2 mb-1.5">
                          <h4 className="text-sm font-bold text-slate-850 dark:text-zinc-200 flex items-center gap-1.5 font-sans">
                            Publish Custom Batch
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 font-sans">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Select Core Course Curriculum</label>
                            <select
                              required
                              value={selectedMasterId}
                              onChange={e => setSelectedMasterId(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-medium"
                            >
                              <option value="">-- Choose Curriculum --</option>
                              {masterCourses.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.durationMonths || 6} Months Template)
                                </option>
                              ))}
                            </select>
                            {masterCourses.length === 0 && (
                              <p className="text-xs text-red-500 font-semibold mt-1 bg-red-500/5 p-2 rounded">
                                ⚠️ No course templates in curriculum bank. Define one in Tab 1 first!
                              </p>
                            )}
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Write Batch Name / Number</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Batch A, stb_02, Evening March"
                              value={customBatchName}
                              onChange={e => setCustomBatchName(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Course Start Date</label>
                            <input
                              type="date"
                              required
                              value={publishBatchDate}
                              onChange={e => setPublishBatchDate(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Admission Last Date</label>
                            <input
                              type="date"
                              required
                              value={publishAdmissionLastDate}
                              onChange={e => setPublishAdmissionLastDate(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            />
                          </div>

                          <div className="space-y-1 animate-fadeIn">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block font-sans">Batch Enrollment Fee (INR)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="e.g. 14999"
                              value={publishFee}
                              onChange={e => setPublishFee(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-semibold text-emerald-600 dark:text-emerald-400"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 block">Batch Status</label>
                            <select
                              value={publishStatus}
                              onChange={e => setPublishStatus(e.target.value as any)}
                              className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-white/15 rounded-md bg-white dark:bg-[#050507] text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                            >
                              <option value="upcoming">Upcoming (Accepting Applications)</option>
                              <option value="ongoing">Ongoing (Current Active Class)</option>
                              <option value="completed">Completed (Archived Batch)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Selected template preview */}
                      <div className="space-y-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-lg font-sans">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2 mb-1.5">
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">Linked Curriculum Syllabus Preview</span>
                          <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3.5 py-0.5 rounded font-semibold">
                            Linked Template
                          </span>
                        </div>

                        {!selectedMasterId ? (
                          <div className="p-8 text-center text-sm text-slate-450 dark:text-zinc-500 border border-dashed border-slate-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#08080a]">
                            Select a core course to preview its linked duration, curriculum, and target milestones.
                          </div>
                        ) : (() => {
                          const linked = masterCourses.find(m => m.id === selectedMasterId);
                          if (!linked) return null;
                          return (
                            <div className="space-y-4 animate-fade-in font-sans">
                              <div>
                                <h5 className="text-sm font-bold text-slate-850 dark:text-zinc-200">{linked.name}</h5>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">{linked.description}</p>
                              </div>
                              <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                                <h6 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Milestone Roadmap ({linked.durationMonths || 6} Months)</h6>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                  {linked.roadmap && linked.roadmap.length > 0 ? (
                                    linked.roadmap.map(rm => (
                                      <div key={rm.month} className="p-3 bg-white dark:bg-[#0c0c0e] rounded border border-slate-200 dark:border-white/10 shadow-xs">
                                        <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                                          {rm.title.toLowerCase().startsWith("month") ? rm.title : `Month ${rm.month}: ${rm.title}`}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-snug">{rm.description}</div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-slate-400 italic">No milestones defined in template.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Unified Footer Controls */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/10 pt-4 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          cancelEditCourse();
                          setShowCourseDashboard(false);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-705 dark:text-zinc-300 rounded-md text-sm font-medium transition cursor-pointer"
                      >
                        Close Dashboard
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedMasterId}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Publish Course Batch
                      </button>
                    </div>
                  </form>
                )}
                            {/* COURSE BATCHES AND INVENTORY PANEL */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-6 mt-6 font-sans">
                  {/* Consolidated Batches Console */}
                  <div className="space-y-4 font-sans">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                          Published Course Batches
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 animate-pulse">Manage active or upcoming course cohorts and their associated curriculums.</p>
                      </div>
                      <div className="relative w-full sm:w-72 font-sans">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={courseSearchQuery}
                          onChange={e => setCourseSearchQuery(e.target.value)}
                          placeholder="Filter batches..."
                          className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-black/20 border border-slate-300 dark:border-white/15 rounded-md text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>

                    {/* Tabbed filters for Table selection */}
                    <div className="flex border-b border-slate-200 dark:border-white/10 pb-0">
                      <button
                        type="button"
                        onClick={() => setCourseDashboardTab('all')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                          courseDashboardTab === 'all'
                            ? 'border-amber-500 text-slate-900 dark:text-white font-semibold'
                            : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-350'
                        }`}
                      >
                        All Batches ({courses.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseDashboardTab('ongoing')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                          courseDashboardTab === 'ongoing'
                            ? 'border-amber-550 text-slate-900 dark:text-white font-semibold'
                            : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-350'
                        }`}
                      >
                        Ongoing ({courses.filter(c => c.status === 'ongoing').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseDashboardTab('upcoming')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                          courseDashboardTab === 'upcoming'
                            ? 'border-amber-550 text-slate-900 dark:text-white font-semibold'
                            : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-350'
                        }`}
                      >
                        Upcoming Admissions ({courses.filter(c => c.status === 'upcoming').length})
                      </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070708]">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-black/15 border-b border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-zinc-400">
                            <th className="px-4 py-3">Course Batch / Name</th>
                            <th className="px-4 py-3">Batch Code</th>
                            <th className="px-4 py-3">Cohort Identifier</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses
                            .filter(c => {
                              if (courseDashboardTab === 'all') return true;
                              return c.status === courseDashboardTab;
                            })
                            .filter(c => {
                              if (!courseSearchQuery) return true;
                              const q = courseSearchQuery.toLowerCase();
                              return (
                                c.name.toLowerCase().includes(q) ||
                                (c.code || '').toLowerCase().includes(q) ||
                                (c.batchNumber || '').toLowerCase().includes(q) ||
                                (c.description || '').toLowerCase().includes(q)
                              );
                            })
                            .map(classRow => {
                              return (
                                <tr key={classRow.id} className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 group text-sm transition-all">
                                  <td className="px-4 py-3.5">
                                    <div>
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200 block leading-tight">{classRow.name}</span>
                                      <span className="text-xs text-slate-500 dark:text-zinc-450 block mt-1 line-clamp-1 max-w-md">{classRow.description || 'No custom description attached.'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className="text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                                      {classRow.code || 'COURS-STB'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className="text-xs text-slate-700 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                                      Batch {classRow.batchNumber || 'stb_001'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                                      classRow.status === 'ongoing'
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15'
                                        : classRow.status === 'upcoming'
                                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/15'
                                          : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500'
                                    }`}>
                                      {classRow.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const matchedMaster = masterCourses.find(m => m.name === classRow.name);
                                          if (matchedMaster) {
                                            startEditMasterCourse(matchedMaster);
                                          } else {
                                            startEditCourse(classRow);
                                          }
                                        }}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded text-amber-700 dark:text-amber-400 transition"
                                        title="Configure curriculum parameters"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      {onDeleteCourse && (
                                        <button
                                          type="button"
                                          onClick={() => setCourseToDelete(classRow)}
                                          className="p-1.5 bg-slate-50 hover:bg-rose-500/10 dark:bg-zinc-900 rounded text-rose-500 transition"
                                          title="Decommission Batch"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {courses.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <span className="text-sm">No batches registered.</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Master Blueprint Catalog */}
                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            Curriculum Blueprints Bank ({masterCourses.length})
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Master definitions bank representing established academic syllabus templates.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {masterCourses
                          .filter(m => {
                            if (!courseSearchQuery) return true;
                            const q = courseSearchQuery.toLowerCase();
                            return m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q);
                          })
                          .map(master => (
                            <div key={master.id} className="p-4 bg-slate-50/50 dark:bg-[#0A0A0C]/40 hover:bg-slate-50/80 dark:hover:bg-[#0A0A0C]/80 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between space-y-3 group transition-all duration-250">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">{master.name}</h5>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">{master.durationMonths || 6} Months Duration</p>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{master.description || 'No course template summary provided.'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEditMasterCourse(master)}
                                    className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg text-amber-600 dark:text-amber-400 hover:scale-105 transition shadow-2xs"
                                    title="Edit Template Description"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteMasterCourse && (
                                    <button
                                      type="button"
                                      onClick={() => setMasterToDelete(master)}
                                      className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg text-rose-500 hover:bg-rose-500/10 dark:hover:bg-red-500/15 transition hover:scale-105"
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
                          <div className="col-span-full py-8 text-center text-xs text-slate-400 dark:text-zinc-650 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                            No base master courses configured. Click the first tab to register.
                          </div>
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
                    <div className="flex items-center">
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
                    onChange={e => {
                      const val = e.target.value;
                      setClassCourse(val);
                      setClassBatch('All'); // Reset batch selection when class/course changes
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="All">All Courses</option>
                    {uniqueActiveCourseNames.map(courseName => (
                      <option key={courseName} value={courseName}>{courseName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block font-sans">Target Student Batch</label>
                  <select
                    value={classBatch}
                    onChange={e => setClassBatch(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    {classCourse === 'All' ? (
                      <>
                        <option value="All">All Batches</option>
                        {Array.from(new Set(courses.map(c => c.batchNumber).filter(Boolean))).map(batchNumber => (
                          <option key={batchNumber} value={batchNumber}>{batchNumber}</option>
                        ))}
                      </>
                    ) : (
                      availableBatchesForSelectedCourse.map(batchNumber => (
                        <option key={batchNumber} value={batchNumber}>
                          {batchNumber === 'All' ? 'All Batches of Course' : `Batch ${batchNumber}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2 md:col-span-2">
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
              onChange={e => {
                setCourseFilter(e.target.value);
                setBatchFilter('all'); // Reset batch filter when changing active course filters
              }}
              className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
            >
              <option value="all">All Active Courses</option>
              {Array.from(new Set(courses.filter(c => c.status !== 'completed').map(c => c.name))).map(courseName => (
                <option key={courseName} value={courseName}>{courseName}</option>
              ))}
            </select>

            {/* Batch Filter */}
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="px-3 py-2.5 text-xs bg-[#f4f4f5]/60 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl text-slate-650 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer font-medium font-sans"
            >
              <option value="all">All Batches</option>
              {courseFilter === 'all' ? (
                Array.from(new Set(courses.map(c => c.batchNumber).filter(Boolean))).map(batchNumber => (
                  <option key={batchNumber} value={batchNumber}>Batch {batchNumber}</option>
                ))
              ) : (
                Array.from(new Set(courses.filter(c => c.name === courseFilter).map(c => c.batchNumber).filter(Boolean))).map(batchNumber => (
                  <option key={batchNumber} value={batchNumber}>Batch {batchNumber}</option>
                ))
              )}
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
                    {/* Left block: Title, status, and tag */}
                    <div className="flex items-start md:items-center min-w-0 flex-1 md:mr-6">
                      {/* Title & Status Metadata */}
                      <div className="min-w-0 flex-1 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3">
                        {(() => {
                          const displayStatus = (cl.status === 'scheduled' && isTimeOver) ? 'completed' : cl.status;
                          return (
                            <>
                              <span className={`font-bold text-slate-950 dark:text-white text-[14px] ${displayStatus === 'completed' ? 'opacity-65 line-through decoration-slate-400/55' : ''}`} title={cl.title}>
                                {cl.title}
                              </span>

                              <span className={`text-[11px] font-semibold whitespace-nowrap px-2.5 py-0.5 rounded border ${
                                displayStatus === 'scheduled'
                                  ? 'bg-slate-100 text-slate-500 border-slate-200/60 dark:bg-white/5 dark:text-zinc-400 dark:border-white/5'
                                  : displayStatus === 'completed'
                                    ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/10'
                                    : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/10'
                              }`}>
                                {displayStatus === 'scheduled' ? 'Ready' : displayStatus === 'completed' ? 'Completed' : 'Cancelled'}
                              </span>
                            </>
                          );
                        })()}

                        {cl.course && cl.course !== 'All' ? (
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center border tracking-tight ${
                            isUserEnrolledVal
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/10'
                              : 'bg-slate-50 dark:bg-[#0c0c0e] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/10'
                          }`}>
                            {cl.course}
                            {isUserEnrolledVal && (
                              <span className="ml-1 text-[8.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Enrolled</span>
                            )}
                          </div>
                        ) : isUserEnrolledVal ? (
                          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center border tracking-tight bg-blue-500/10 text-blue-650 dark:text-blue-400 border-blue-200 dark:border-blue-500/10">
                            Enrolled
                          </div>
                        ) : null}

                        {cl.batch && cl.batch !== 'All' && (
                          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 border border-purple-200/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:border-purple-500/10 tracking-tight">
                            Batch: {cl.batch}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle block: Instructor & Location details mapped as Git commit/branch */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium md:flex-shrink-0">
                      <div className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-zinc-200 transition">
                        <GitCommit className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550" />
                        <span className="text-[11.5px] text-slate-500 dark:text-zinc-400">{cl.instructorName || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-zinc-200 transition">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-555" />
                        <span className="text-[11px]">{cl.location}</span>
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
