/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, RegistrationRequest, StudentBatch, Course, ProgressRecord } from '../types';
import { UserPlus, Search, User, Filter, Trash2, Mail, Phone, Calendar, ArrowRight, BookOpen, Check, X, ShieldAlert, MapPin, GraduationCap, Camera, Upload, Pencil, Clock, Video, CheckCircle2, Eye, AlertTriangle, Users, UserCheck, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRY_PHONE_CONFIGS } from '../countryPhoneData';
import { compressImage } from '../imageUtils';

interface EnrollmentManagerProps {
  currentUser: UserAccount;
  students: UserAccount[];
  instructors: UserAccount[];
  subAdmins?: UserAccount[];
  schedules: ClassSchedule[];
  batches?: StudentBatch[];
  courses?: Course[];
  progressRecords?: ProgressRecord[];
  onAddStudent: (student: Omit<UserAccount, 'id' | 'joinedDate'>) => void;
  onAddInstructor?: (instructor: Omit<UserAccount, 'id' | 'joinedDate'>) => void;
  onAddSubAdmin?: (subAdmin: Omit<UserAccount, 'id' | 'joinedDate'>) => void;
  onRemoveStudent: (id: string) => void;
  onRemoveInstructor?: (id: string) => void;
  onRemoveSubAdmin?: (id: string) => void;
  onEnrollStudentInClass: (studentId: string, classId: string) => void;
  registrationRequests: RegistrationRequest[];
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onUpdateStudent?: (updatedStudent: UserAccount) => void;
  onUpdateRegistrationRequest?: (updatedReq: RegistrationRequest) => void;
  onImpersonateStudent?: (student: UserAccount) => void;
}

export default function EnrollmentManager({
  currentUser,
  students,
  instructors,
  subAdmins = [],
  schedules,
  batches = [],
  courses = [],
  progressRecords = [],
  onAddStudent,
  onAddInstructor,
  onAddSubAdmin,
  onRemoveStudent,
  onRemoveInstructor,
  onRemoveSubAdmin,
  onEnrollStudentInClass,
  registrationRequests,
  onApproveRequest,
  onRejectRequest,
  onUpdateStudent,
  onUpdateRegistrationRequest,
  onImpersonateStudent
}: EnrollmentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<'all' | string>('all');
  const [selectedCourseName, setSelectedCourseName] = useState<'all' | string>('all');
  const [selectedBatchName, setSelectedBatchName] = useState<'all' | string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'good' | 'low' | 'none'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormType, setAddFormType] = useState<'student' | 'instructor' | 'sub-admin'>('student');
  const [activeListView, setActiveListView] = useState<'students' | 'instructors' | 'sub-admins'>('students');

  // Interview schedule system states
  const [schedulingRequest, setSchedulingRequest] = useState<RegistrationRequest | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewStatus, setInterviewStatus] = useState<'not_scheduled' | 'scheduled' | 'completed' | 'cancelled'>('not_scheduled');
  const [interviewNotes, setInterviewNotes] = useState('');

  const handleOpenInterviewScheduler = (req: RegistrationRequest) => {
    setSchedulingRequest(req);
    setInterviewDate(req.interviewDate || '');
    setInterviewTime(req.interviewTime || '');
    setInterviewStatus(req.interviewStatus || 'not_scheduled');
    setInterviewNotes(req.interviewNotes || '');
  };

  const handleSaveInterview = () => {
    if (!schedulingRequest || !onUpdateRegistrationRequest) return;
    onUpdateRegistrationRequest({
      ...schedulingRequest,
      interviewDate,
      interviewTime,
      interviewStatus,
      interviewNotes
    });
    setSchedulingRequest(null);
  };

  // Edit Student level states
  const [editingStudent, setEditingStudent] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; role: 'student' | 'instructor' | 'sub-admin' } | null>(null);
  const [pendingStudentUpdate, setPendingStudentUpdate] = useState<UserAccount | null>(null);
  const [paymentSettleStudent, setPaymentSettleStudent] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoneRaw, setEditPhoneRaw] = useState('');
  const [editPhonePrefix, setEditPhonePrefix] = useState('+91');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [editAssignedInstructorId, setEditAssignedInstructorId] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editFatherPhoneRaw, setEditFatherPhoneRaw] = useState('');
  const [editFatherPhonePrefix, setEditFatherPhonePrefix] = useState('+91');
  const [editFatherPhoneError, setEditFatherPhoneError] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLastQualification, setEditLastQualification] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editAvatarError, setEditAvatarError] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  React.useEffect(() => {
    if (currentUser.role === 'instructor' && activeListView !== 'students') {
      setActiveListView('students');
    } else if (currentUser.role === 'sub-admin' && activeListView === 'sub-admins') {
      setActiveListView('students');
    }
  }, [currentUser.role, activeListView]);

  // New Student state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInstructorId, setNewInstructorId] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newFatherPhone, setNewFatherPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLastQualification, setNewLastQualification] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newAvatarError, setNewAvatarError] = useState('');
  const [newBatch, setNewBatch] = useState('Batch A');
  const [editBatch, setEditBatch] = useState('Batch A');
  const [newCourse, setNewCourse] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pending' | 'paid'>('pending');

  // Phone country verification states
  const [newPhonePrefix, setNewPhonePrefix] = useState('+91');
  const [newPhoneError, setNewPhoneError] = useState('');
  const [newFatherPhonePrefix, setNewFatherPhonePrefix] = useState('+91');
  const [newFatherPhoneError, setNewFatherPhoneError] = useState('');

  // New Instructor state
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newInstructorUsername, setNewInstructorUsername] = useState('');
  const [newInstructorPassword, setNewInstructorPassword] = useState('');

  // Class enrollment state
  const [enrollmentStudentId, setEnrollmentStudentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate main phone number length if input is present
    if (newPhone) {
      const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix);
      const reqLen = config ? config.length : 10;
      if (newPhone.length !== reqLen) {
        setNewPhoneError(`Phone number must be exactly ${reqLen} digits for ${newPhonePrefix}`);
        return;
      }
    }
    setNewPhoneError('');

    // Validate father's phone number length if student form has input present
    if (addFormType === 'student' && newFatherPhone) {
      const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === newFatherPhonePrefix);
      const reqLen = config ? config.length : 10;
      if (newFatherPhone.length !== reqLen) {
        setNewFatherPhoneError(`Father's phone number must be exactly ${reqLen} digits for ${newFatherPhonePrefix}`);
        return;
      }
    }
    setNewFatherPhoneError('');

    const formattedPhone = newPhone ? `${newPhonePrefix} ${newPhone}` : undefined;
    const formattedFatherPhone = newFatherPhone ? `${newFatherPhonePrefix} ${newFatherPhone}` : undefined;

    if (addFormType === 'instructor' && ['admin', 'sub-admin'].includes(currentUser.role)) {
      if (!newName || !newEmail || !newInstructorUsername || !newInstructorPassword) return;
      if (onAddInstructor) {
        onAddInstructor({
          name: newName,
          email: newEmail,
          phone: formattedPhone,
          role: 'instructor',
          specialization: newSpecialization || undefined,
          username: newInstructorUsername,
          password: newInstructorPassword,
          avatarUrl: newAvatarUrl || undefined
        });
      }

      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPhonePrefix('+91');
      setNewPhoneError('');
      setNewSpecialization('');
      setNewInstructorUsername('');
      setNewInstructorPassword('');
      setNewAvatarUrl('');
      setNewAvatarError('');
      setShowAddForm(false);
    } else if (addFormType === 'sub-admin' && ['admin', 'sub-admin'].includes(currentUser.role)) {
      if (!newName || !newEmail || !newInstructorUsername || !newInstructorPassword) return;
      if (onAddSubAdmin) {
        onAddSubAdmin({
          name: newName,
          email: newEmail,
          phone: formattedPhone,
          role: 'sub-admin',
          username: newInstructorUsername,
          password: newInstructorPassword,
          avatarUrl: newAvatarUrl || undefined
        });
      }

      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPhonePrefix('+91');
      setNewPhoneError('');
      setNewInstructorUsername('');
      setNewInstructorPassword('');
      setNewAvatarUrl('');
      setNewAvatarError('');
      setShowAddForm(false);
    } else {
      if (!newName || !newEmail) return;
      onAddStudent({
        name: newName,
        email: newEmail,
        phone: formattedPhone,
        role: 'student',
        assignedInstructorId: newInstructorId || undefined,
        fatherName: newFatherName || undefined,
        fatherPhone: formattedFatherPhone,
        address: newAddress || undefined,
        lastQualification: newLastQualification || undefined,
        gender: newGender || undefined,
        dob: newDob || undefined,
        avatarUrl: newAvatarUrl || undefined,
        batch: newBatch,
        course: newCourse || undefined
      });

      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPhonePrefix('+91');
      setNewPhoneError('');
      setNewInstructorId('');
      setNewFatherName('');
      setNewFatherPhone('');
      setNewFatherPhonePrefix('+91');
      setNewFatherPhoneError('');
      setNewAddress('');
      setNewLastQualification('');
      setNewGender('');
      setNewDob('');
      setNewAvatarUrl('');
      setNewAvatarError('');
      setNewBatch('Batch A');
      setNewCourse('');
      setShowAddForm(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (currentUser.role === 'student' && student.id !== currentUser.id) {
      return false;
    }
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.universalId && student.universalId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesInstructor = selectedInstructorId === 'all' || student.assignedInstructorId === selectedInstructorId;
    const matchesCourse = selectedCourseName === 'all' || student.course === selectedCourseName;
    const matchesBatch = selectedBatchName === 'all' || student.batch === selectedBatchName;

    // Calculate attendance rate for filtering
    const studentRecords = progressRecords.filter(r => r.studentId === student.id);
    const totalClasses = studentRecords.length;
    const presentClasses = studentRecords.filter(r => r.attendanceStatus === 'present').length;
    const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

    let matchesAttendance = true;
    if (attendanceFilter === 'good') {
      matchesAttendance = attendanceRate !== null && attendanceRate >= 80;
    } else if (attendanceFilter === 'low') {
      matchesAttendance = attendanceRate !== null && attendanceRate < 80;
    } else if (attendanceFilter === 'none') {
      matchesAttendance = attendanceRate === null;
    }

    return matchesSearch && matchesInstructor && matchesCourse && matchesBatch && matchesAttendance;
  });

  const filteredInstructors = instructors.filter(ins => {
    return ins.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           ins.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (ins.specialization && ins.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredSubAdmins = subAdmins.filter(sa => {
    return sa.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           sa.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInstructorName = (instructorId?: string) => {
    if (!instructorId) return 'Not Assigned';
    const found = instructors.find(i => i.id === instructorId);
    return found ? found.name : 'Unknown Instructor';
  };

  const getEnrolledClasses = (studentId: string) => {
    return schedules.filter(cl => cl.enrolledStudentIds.includes(studentId));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      {currentUser.role !== 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Enrolled */}
          <div className="relative overflow-hidden bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 transition-all duration-200 hover:shadow-md group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-6 -mt-6 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-sans">Total Enrolled</p>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight font-sans">
                  {students.length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <span>Durable Cloud Sync Active</span>
            </div>
          </div>

          {/* Card 2: No Primary Mentor Assigned */}
          <div className="relative overflow-hidden bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 transition-all duration-200 hover:shadow-md group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-sans font-sans">Pending Mentor Assignment</p>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight font-sans">
                  {students.filter(s => !s.assignedInstructorId || !instructors.some(i => i.id === s.assignedInstructorId)).length}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <UserX className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Requires administrator review</span>
            </div>
          </div>

          {/* Card 3: Average Courses / Student */}
          <div className="relative overflow-hidden bg-white dark:bg-[#09090b] rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 transition-all duration-200 hover:shadow-md group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 transition-transform duration-300 group-hover:scale-110" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-sans">Average Classes / Student</p>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2.5 tracking-tight font-sans">
                  {students.length > 0
                    ? (students.reduce((acc, s) => acc + getEnrolledClasses(s.id).length, 0) / students.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#062016] text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              <span>Active course curriculums</span>
            </div>
          </div>
        </div>
      )}

      {['admin', 'sub-admin'].includes(currentUser.role) && (
        <div className="p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-slate-50/50 to-white dark:from-[#09090b] dark:to-[#070708] shadow-xs mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 font-sans">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Fast Student Admissions
                </h3>
                {registrationRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse">
                    {registrationRequests.filter(r => r.status === 'pending').length} pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Approve or manage fast-registration requests from the public portal. Approved submissions will automatically provision secure accounts and send notification records.
              </p>
            </div>
          </div>

          {registrationRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="py-12 px-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-[#070708]/30">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/40 dark:border-white/5 flex items-center justify-center mx-auto mb-3.5 text-slate-400">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-200 font-sans">All Registration Queues Cleared</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-550 mt-1 max-w-sm mx-auto leading-relaxed">
                There are no pending tickets in the portal queue. External registrations will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {registrationRequests.filter(r => r.status === 'pending').map(req => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200/60 dark:border-white/5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs transition duration-200"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        {req.avatarUrl ? (
                          <img 
                            src={req.avatarUrl} 
                            alt={req.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shadow-xs flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 flex-shrink-0 font-bold">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight font-sans">{req.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 font-sans">Submitted: {req.submittedDate}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        PENDING
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                      <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="truncate text-slate-600 dark:text-zinc-300 font-medium">{req.email}</span>
                      </div>
                      {req.phone && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <Phone className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">{req.phone}</span>
                        </div>
                      )}
                      {req.gender && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">Gender: <strong className="text-slate-800 dark:text-white font-semibold">{req.gender}</strong></span>
                        </div>
                      )}
                      {req.dob && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">DOB: <strong className="text-slate-800 dark:text-white font-semibold">{req.dob}</strong></span>
                        </div>
                      )}
                      {req.fatherName && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">Father: <strong className="text-slate-800 dark:text-white font-semibold">{req.fatherName}</strong></span>
                        </div>
                      )}
                      {req.address && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="truncate text-slate-600 dark:text-zinc-300 font-medium">Address: <strong className="text-slate-800 dark:text-white font-semibold">{req.address}</strong></span>
                        </div>
                      )}
                      {req.lastQualification && (
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">Degree: <strong className="text-slate-800 dark:text-white font-semibold">{req.lastQualification}</strong></span>
                        </div>
                      )}
                      {req.course && (
                        <div className="flex items-center gap-2 bg-emerald-500/5 dark:bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 sm:col-span-2">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">Course: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{req.course}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 p-2 rounded-xl border border-slate-100 dark:border-white/5 sm:col-span-2">
                        <User className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-zinc-300 font-medium">Mentor Slot: <strong className="text-slate-800 dark:text-white font-semibold">{getInstructorName(req.assignedInstructorId)}</strong></span>
                      </div>
                    </div>

                    {/* Interview Schedule information */}
                    <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-white/5 space-y-2 mt-3 font-sans">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Admission Interview</p>
                        {req.interviewStatus === 'scheduled' ? (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            Scheduled
                          </span>
                        ) : req.interviewStatus === 'completed' ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        ) : req.interviewStatus === 'cancelled' ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded-full">
                            Not Scheduled
                          </span>
                        )}
                      </div>

                      {req.interviewStatus && req.interviewStatus !== 'not_scheduled' ? (
                        <div className="text-xs space-y-1.5 pt-1">
                          {req.interviewDate && (
                            <p className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              <span>Date: <strong className="text-slate-850 dark:text-white">{req.interviewDate}</strong></span>
                            </p>
                          )}
                          {req.interviewTime && (
                            <p className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              <span>Time: <strong className="text-slate-850 dark:text-white">{req.interviewTime}</strong></span>
                            </p>
                          )}
                          {req.interviewNotes && (
                            <p className="text-xs bg-white dark:bg-black/20 p-2 rounded-lg text-slate-550 dark:text-zinc-400 font-sans italic border border-slate-150/50 dark:border-white/5 leading-relaxed">
                              "{req.interviewNotes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-zinc-500 leading-snug pt-0.5">
                          No interview details configured. Use the scheduler to record feedback or interview slots.
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-950/30 mt-3 text-xs font-sans">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">Security Credentials Drafted:</p>
                      <div className="flex justify-between text-slate-500 dark:text-zinc-400 border-t border-indigo-100/30 dark:border-indigo-950/20 mt-1.5 pt-1.5">
                        <span>Username: <strong className="text-slate-800 dark:text-white font-mono">{req.username}</strong></span>
                        <span>Password: <strong className="text-slate-800 dark:text-white font-mono">{req.password}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-white/5 font-sans">
                    <button
                      type="button"
                      onClick={() => handleOpenInterviewScheduler(req)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-350 transition rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Interview
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectRequest(req.id)}
                      className="px-3 py-1.5 border border-rose-200 dark:border-rose-950/30 hover:border-rose-350 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveRequest(req.id)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white dark:text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Enroll Student
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2.5 font-sans">
              <User className="w-5 h-5 text-indigo-500" />
              Student Enrollment & Profiles
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
              Archive records, modify primary instructors, or view courses specific to each student.
            </p>
          </div>

          {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-xl text-xs font-bold tracking-tight transition duration-200 cursor-pointer select-none flex items-center gap-2 shadow-sm font-sans"
            >
              <UserPlus className="w-4 h-4" />
              {showAddForm ? 'Hide Registration Panel' : ['admin', 'sub-admin'].includes(currentUser.role) ? 'Register Account' : 'Register Student'}
            </button>
          )}
        </div>

        {/* Dynamic Add Student Form */}
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
                {/* Manual Photo Upload Section */}
                <div className="md:col-span-2 lg:col-span-4">
                  <div className="space-y-1.5 max-w-xl">
                    <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Profile Photo (Maximum 150KB)</label>
                    <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      {newAvatarUrl ? (
                        <div className="relative">
                          <img 
                            src={newAvatarUrl} 
                            alt="Preview" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewAvatarUrl('');
                              setNewAvatarError('');
                            }}
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition shadow"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          id="manual-avatar-upload"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setNewAvatarError('');
                              const compressedUrl = await compressImage(file);
                              setNewAvatarUrl(compressedUrl);
                            } catch (err) {
                              setNewAvatarError("Could not process photo.");
                              setNewAvatarUrl('');
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="manual-avatar-upload"
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-slate-705 dark:text-slate-300 transition"
                        >
                          <Upload className="w-3 h-3" />
                          {newAvatarUrl ? 'Change' : 'Select Photo'}
                        </label>
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                          Strictly maximum file size 150KB.
                        </p>
                        {newAvatarError && (
                          <p className="text-xs text-rose-500 font-bold">
                            {newAvatarError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {['admin', 'sub-admin'].includes(currentUser.role) && (
                  <div className="md:col-span-2 lg:col-span-4 mb-2 flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-2xl w-full max-w-md">
                    <button
                      type="button"
                      onClick={() => setAddFormType('student')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                        addFormType === 'student'
                          ? 'bg-white dark:bg-slate-850 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200/30 dark:border-white/5'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Student Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddFormType('instructor')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                        addFormType === 'instructor'
                          ? 'bg-white dark:bg-slate-850 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200/30 dark:border-white/5'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Instructor Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddFormType('sub-admin')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                        addFormType === 'sub-admin'
                          ? 'bg-white dark:bg-slate-850 text-amber-600 dark:text-amber-500 shadow-sm border border-slate-200/30 dark:border-white/5'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Sub-Admin Profile
                    </button>
                  </div>
                )}

                {addFormType === 'instructor' ? (
                  <>
                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Instructor Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Professor Sarah Connor"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Work Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@learnora.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Phone (Optional)</label>
                      <div className="flex gap-1.5">
                        <select
                          value={newPhonePrefix}
                          onChange={e => {
                            setNewPhonePrefix(e.target.value);
                            setNewPhone('');
                            setNewPhoneError('');
                          }}
                          className="px-2 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans animate-fade-in"
                        >
                          {COUNTRY_PHONE_CONFIGS.map(c => (
                            <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.placeholder || '9876543210'}
                          value={newPhone}
                          maxLength={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setNewPhone(raw);
                            const len = COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10;
                            if (raw && raw.length !== len) {
                              setNewPhoneError(`Must be exactly ${len} digits`);
                            } else {
                              setNewPhoneError('');
                            }
                          }}
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 `}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-xs text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Specialization Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus & Linear Algebra"
                        value={newSpecialization}
                        onChange={e => setNewSpecialization(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-amber-500 dark:text-amber-500 block font-bold">
                        Instructor Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. sarah_math"
                        value={newInstructorUsername}
                        onChange={e => setNewInstructorUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 "
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-amber-500 dark:text-amber-500 block font-bold">
                        Instructor Password
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Access password"
                        value={newInstructorPassword}
                        onChange={e => setNewInstructorPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 "
                      />
                    </div>
                  </>
                ) : addFormType === 'sub-admin' ? (
                  <>
                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Sub-Admin Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Assistant John"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Work Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@learnora.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block font-bold">Phone (Optional)</label>
                      <div className="flex gap-1.5">
                        <select
                          value={newPhonePrefix}
                          onChange={e => {
                            setNewPhonePrefix(e.target.value);
                            setNewPhone('');
                            setNewPhoneError('');
                          }}
                          className="px-2 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                        >
                          {COUNTRY_PHONE_CONFIGS.map(c => (
                            <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.placeholder || '9876543210'}
                          value={newPhone}
                          maxLength={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setNewPhone(raw);
                            const len = COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10;
                            if (raw && raw.length !== len) {
                              setNewPhoneError(`Must be exactly ${len} digits`);
                            } else {
                              setNewPhoneError('');
                            }
                          }}
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 `}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-xs text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2 col-span-1">
                      <span className="text-xs  text-slate-400   block font-bold">Operational Scope</span>
                      <div className="text-xs p-2 bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl font-medium leading-relaxed">
                        Authorized to manage class schedules and evaluate student progress folders. Cannot build other sub-admin or faculty credentials.
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-amber-500 dark:text-amber-500 block font-bold">
                        Sub-Admin Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. john_assistant"
                        value={newInstructorUsername}
                        onChange={e => setNewInstructorUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 "
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-amber-500 dark:text-amber-500 block font-bold">
                        Sub-Admin Password
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Access password"
                        value={newInstructorPassword}
                        onChange={e => setNewInstructorPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 "
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Smith"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Phone Number (Optional)</label>
                      <div className="flex gap-1.5">
                        <select
                          value={newPhonePrefix}
                          onChange={e => {
                            setNewPhonePrefix(e.target.value);
                            setNewPhone('');
                            setNewPhoneError('');
                          }}
                          className="px-2 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                        >
                          {COUNTRY_PHONE_CONFIGS.map(c => (
                            <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.placeholder || '9876543210'}
                          value={newPhone}
                          maxLength={COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setNewPhone(raw);
                            const len = COUNTRY_PHONE_CONFIGS.find(c => c.code === newPhonePrefix)?.length || 10;
                            if (raw && raw.length !== len) {
                              setNewPhoneError(`Must be exactly ${len} digits`);
                            } else {
                              setNewPhoneError('');
                            }
                          }}
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 `}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-xs text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-1 lg:col-span-2">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Assign Advisor Mentor</label>
                      <select
                        value={newInstructorId}
                        onChange={e => setNewInstructorId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="">Unassigned</option>
                        {instructors.map(ins => (
                          <option key={ins.id} value={ins.id}>
                            {ins.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Gender</label>
                      <select
                        value={newGender}
                        onChange={e => setNewGender(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Date of Birth</label>
                      <input
                        type="date"
                        value={newDob}
                        onChange={e => setNewDob(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Father's Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Father's Legal Name"
                        value={newFatherName}
                        onChange={e => setNewFatherName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Residential Address (Optional)</label>
                      <input
                        type="text"
                        placeholder="Permanent Address"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Last Qualification (Optional)</label>
                      <input
                        type="text"
                        placeholder="Academic degree/diploma"
                        value={newLastQualification}
                        onChange={e => setNewLastQualification(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs   text-slate-500 dark:text-slate-400 block">Enrolled Professional Course & Batch</label>
                      <select
                        value={newCourse && newBatch ? `${newCourse}::${newBatch}` : newCourse || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.includes('::')) {
                            const [cName, cBatch] = val.split('::');
                            setNewCourse(cName);
                            setNewBatch(cBatch);
                          } else {
                            setNewCourse(val);
                            setNewBatch('');
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                      >
                        <option value="">-- No Enrolled Course/Optional --</option>
                        {courses.filter(c => c.status === 'upcoming' || c.status === 'ongoing').map(c => (
                          <option key={c.id} value={`${c.name}::${c.batchNumber || ''}`}>{c.name} (Batch: {c.batchNumber || 'stb_001'}){c.status === 'ongoing' ? ' [Ongoing]' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-amber-950 rounded-xl text-xs font-bold shadow transition"
                  >
                    {addFormType === 'instructor' 
                      ? 'Create Instructor Account' 
                      : addFormType === 'sub-admin' 
                        ? 'Create Sub-Admin Account' 
                        : 'Register Student Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Segmented Tab Selector */}
        <div className="flex p-1 bg-slate-100/70 dark:bg-[#070708] rounded-2xl border border-slate-200/40 dark:border-white/5 mb-8 w-fit font-sans">
          <button
            type="button"
            onClick={() => { setActiveListView('students'); setSearchTerm(''); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-2 ${
              activeListView === 'students'
                ? 'bg-white dark:bg-[#161618] text-indigo-600 dark:text-white shadow-xs border border-slate-200/30 dark:border-white/5'
                : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{currentUser.role === 'student' ? 'My Student Profile' : 'Students'}</span>
            {currentUser.role !== 'student' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeListView === 'students' ? 'bg-indigo-50 text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-slate-200/55 text-slate-500 dark:bg-zinc-800/40 dark:text-zinc-400'}`}>
                {students.length}
              </span>
            )}
          </button>
          
          {['admin', 'sub-admin'].includes(currentUser.role) && (
            <button
              type="button"
              onClick={() => { setActiveListView('instructors'); setSearchTerm(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-2 ${
                activeListView === 'instructors'
                  ? 'bg-white dark:bg-[#161618] text-indigo-600 dark:text-white shadow-xs border border-slate-200/30 dark:border-white/5'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Instructors</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeListView === 'instructors' ? 'bg-indigo-50 text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-slate-200/55 text-slate-500 dark:bg-zinc-800/40 dark:text-zinc-400'}`}>
                {instructors.length}
              </span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => { setActiveListView('sub-admins'); setSearchTerm(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-2 ${
                activeListView === 'sub-admins'
                  ? 'bg-white dark:bg-[#161618] text-indigo-600 dark:text-white shadow-xs border border-slate-200/30 dark:border-white/5'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Sub-Admins</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeListView === 'sub-admins' ? 'bg-indigo-50 text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-slate-200/55 text-slate-500 dark:bg-zinc-800/40 dark:text-zinc-400'}`}>
                {subAdmins?.length || 0}
              </span>
            </button>
          )}
        </div>

        {/* Universal Filter Toolbar */}
        {currentUser.role !== 'student' && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6 font-sans">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={
                  activeListView === 'students'
                    ? "Search students by name or email ID..."
                    : activeListView === 'instructors'
                      ? "Search instructors by name, email, or specialization topic..."
                      : "Search sub-administrators by name or email..."
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f0f12] rounded-lg text-xs text-slate-850 dark:text-gray-150 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/25 dark:focus:ring-white/20 transition-all shadow-2xs"
              />
            </div>

            {activeListView === 'students' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={selectedInstructorId}
                    onChange={e => setSelectedInstructorId(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 block border border-slate-200 dark:border-white/5 rounded-lg text-xs bg-white dark:bg-[#0f0f12] text-slate-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/25 dark:focus:ring-white/20 font-medium transition shadow-2xs"
                  >
                    <option value="all">Mentor: All</option>
                    {instructors.map(ins => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedCourseName}
                    onChange={e => setSelectedCourseName(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 block border border-slate-200 dark:border-white/5 rounded-lg text-xs bg-white dark:bg-[#0f0f12] text-slate-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/25 dark:focus:ring-white/20 font-medium transition shadow-2xs"
                  >
                    <option value="all">Course: All</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedBatchName}
                    onChange={e => setSelectedBatchName(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 block border border-slate-200 dark:border-white/5 rounded-lg text-xs bg-white dark:bg-[#0f0f12] text-slate-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/25 dark:focus:ring-white/20 font-medium transition shadow-2xs"
                  >
                    <option value="all">Batch: All</option>
                    {Array.from(new Set(courses.map(c => c.batchNumber).filter(Boolean))).map(batch => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={attendanceFilter}
                    onChange={e => setAttendanceFilter(e.target.value as any)}
                    className="appearance-none pl-3 pr-8 py-2 block border border-slate-200 dark:border-white/5 rounded-lg text-xs bg-white dark:bg-[#0f0f12] text-slate-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/25 dark:focus:ring-white/20 font-medium transition shadow-2xs"
                  >
                    <option value="all">Attendance: All</option>
                    <option value="good">Attendance: Good (≥80%)</option>
                    <option value="low">Attendance: Low (&lt;80%)</option>
                    <option value="none">Attendance: No Records</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeListView === 'students' ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#080809] animate-fade-in font-sans shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header Row */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none items-center">
              <div className="col-span-4 md:col-span-4">Student Profile</div>
              <div className="col-span-2 md:col-span-2">Status</div>
              <div className="col-span-2 md:col-span-2">Attendance</div>
              <div className="col-span-4 md:col-span-2">Advisor</div>
              <div className="hidden md:block md:col-span-2 text-right">Registered</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  No student registrations found matching filters.
                </div>
              ) : (
                filteredStudents.map(student => {
                  const enrolled = getEnrolledClasses(student.id);
                  const getRelativeTime = (dateStr?: string) => {
                    if (!dateStr) return 'about 23 hours ago';
                    try {
                      const joined = new Date(dateStr);
                      const now = new Date('2026-06-15T01:47:11-07:00');
                      const diffMs = now.getTime() - joined.getTime();
                      if (isNaN(diffMs)) return 'about 23 hours ago';
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      if (diffHrs < 24) {
                        return `about ${diffHrs > 0 ? diffHrs : 5} hours ago`;
                      }
                      const diffDays = Math.floor(diffHrs / 24);
                      if (diffDays < 30) {
                        return `about ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                      }
                      const diffMonths = Math.floor(diffDays / 30);
                      return `about ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
                    } catch (e) {
                      return 'about 2 days ago';
                    }
                  };
                  
                  const joinedRelative = getRelativeTime(student.joinedDate);
                  
                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group relative"
                    >
                      {/* Name & Avatar */}
                      <div className="col-span-4 md:col-span-4 flex items-center gap-3.5 min-w-0">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-[13px] truncate" title={student.name}>
                              {student.name}
                            </p>
                            {student.course && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {student.course}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate" title={student.email}>{student.email}</span>
                            <span className="opacity-50">·</span>
                            <span className="font-mono">ID: {student.universalId || student.id.slice(0, 6)}</span>
                            {student.batch && (
                              <>
                                <span className="opacity-50">·</span>
                                <span>{student.batch}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Column */}
                      <div className="col-span-2 md:col-span-2 flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Registered</span>
                        </div>
                        {student.paymentStatus === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (['admin', 'sub-admin'].includes(currentUser.role)) {
                                setPaymentSettleStudent(student);
                              }
                            }}
                            className={`text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 ${
                              ['admin', 'sub-admin'].includes(currentUser.role) ? 'hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer' : ''
                            }`}
                            title={
                              ['admin', 'sub-admin'].includes(currentUser.role)
                                ? `Click to mark as UNPAID (Ref: ${student.paymentId || 'N/A'})`
                                : `Transaction Ref: ${student.paymentId || 'N/A'}`
                            }
                          >
                            ₹{(student.paidAmount || 9999).toLocaleString('en-IN')} Paid
                            {['admin', 'sub-admin'].includes(currentUser.role) && <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (['admin', 'sub-admin'].includes(currentUser.role)) {
                                setPaymentSettleStudent(student);
                              }
                            }}
                            className={`text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 ${
                              ['admin', 'sub-admin'].includes(currentUser.role) ? 'hover:text-amber-700 cursor-pointer' : ''
                            }`}
                            title={
                              ['admin', 'sub-admin'].includes(currentUser.role)
                                ? 'Click to settle fees & mark as PAID'
                                : 'Payment Pending'
                            }
                          >
                            Unpaid (₹{(() => {
                              if (!student.course || !courses || courses.length === 0) return 9999;
                              const userCourseClean = student.course.trim().replace(/\.+$/, "").toLowerCase(); const userBatchClean = student.batch?.trim().toLowerCase() || ""; let batchMatched = undefined; if (userBatchClean) { batchMatched = courses.find(c => { const cId = c.id?.trim().toLowerCase() || ""; const cName = c.name.trim().replace(/\.+$/, "").toLowerCase(); const cCode = c.code?.trim().toLowerCase() || ""; const cBatch = c.batchNumber?.trim().toLowerCase() || ""; const isCourseMatch = cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean; const isBatchMatch = cBatch === userBatchClean || cCode === userBatchClean; return isCourseMatch && isBatchMatch; }); } if (batchMatched) return batchMatched.fee || 9999;
                              
                              let matched = courses.find(c => {
                                const cId = c.id?.trim().toLowerCase() || "";
                                const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                const cCode = c.code?.trim().toLowerCase() || "";
                                return cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
                              });
                              if (matched) return matched.fee || 9999;
                              matched = courses.find(c => {
                                const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                return cName.includes(userCourseClean) || userCourseClean.includes(cName);
                              });
                              return (matched || courses[0])?.fee || 9999;
                            })().toLocaleString('en-IN')})
                            {['admin', 'sub-admin'].includes(currentUser.role) && <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        )}
                        {student.phone && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={student.phone}>
                            {student.phone}
                          </span>
                        )}
                      </div>

                      {/* Attendance Column */}
                      <div className="col-span-2 md:col-span-2 flex flex-col justify-center gap-1.5 pr-2">
                        {(() => {
                          const studentRecords = progressRecords.filter(r => r.studentId === student.id);
                          const totalClasses = studentRecords.length;
                          const presentClasses = studentRecords.filter(r => r.attendanceStatus === 'present').length;
                          const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : null;

                          if (attendanceRate === null) {
                            return (
                              <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                                  No Session
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">0 records</span>
                              </div>
                            );
                          }
                          
                          let colorClass = "bg-emerald-500";
                          let textClass = "text-emerald-700 dark:text-emerald-400";
                          let label = "Good";
                          
                          if (attendanceRate < 80) {
                            colorClass = "bg-rose-500";
                            textClass = "text-rose-600 dark:text-rose-400";
                            label = "Low";
                          } else if (attendanceRate < 90) {
                            colorClass = "bg-amber-500";
                            textClass = "text-amber-600 dark:text-amber-400";
                            label = "Avg";
                          }

                          return (
                            <div className="w-full flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={`font-medium ${textClass}`}>{Math.round(attendanceRate)}% {label}</span>
                                <span className="text-slate-400 dark:text-slate-500">{presentClasses}/{totalClasses}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className={`${colorClass} h-full rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Advisor & Courses Column */}
                      <div className="col-span-4 md:col-span-2 min-w-0 flex flex-col gap-1 items-start justify-center">
                        <p className="text-[12px] font-medium text-slate-900 dark:text-slate-100 truncate w-full">
                          {student.assignedInstructorId ? getInstructorName(student.assignedInstructorId) : 'Not Assigned'}
                        </p>
                        <div className="flex items-center gap-2">
                          {['admin', 'sub-admin'].includes(currentUser.role) && onImpersonateStudent && (
                            <button
                              onClick={() => onImpersonateStudent(student)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                              title="Emergency View Student Account"
                            >
                              Impersonate
                            </button>
                          )}
                          {enrolled.length > 0 && (
                             <span className="text-[11px] text-slate-500 dark:text-slate-400">
                               {enrolled.length} enrolled
                             </span>
                          )}
                        </div>

                        {/* Interactive Assign Classes Dropdown popover */}
                        {enrollmentStudentId === student.id && (
                          <div className="absolute z-50 mt-8 bg-white dark:bg-[#0F0F11] border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl w-52 max-h-48 overflow-y-auto left-auto right-4 md:right-auto">
                            <div className="flex justify-between items-center mb-1 text-xs text-slate-500 border-b dark:border-white/10 pb-1">
                              <span>Choose Course:</span>
                              <button onClick={() => setEnrollmentStudentId(null)} className="text-rose-500 hover:underline cursor-pointer">Close</button>
                            </div>
                            {schedules
                              .filter(cl => !cl.enrolledStudentIds.includes(student.id))
                              .map(cl => (
                                <button
                                  key={cl.id}
                                  onClick={() => {
                                    onEnrollStudentInClass(student.id, cl.id);
                                    setEnrollmentStudentId(null);
                                  }}
                                  className="w-full text-left py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 truncate block cursor-pointer transition-colors"
                                >
                                  {cl.subject}: {cl.title}
                                </button>
                              ))}
                            {schedules.filter(cl => !cl.enrolledStudentIds.includes(student.id)).length === 0 && (
                              <p className="p-1 pt-2 text-[11px] text-slate-400 text-center">Enrolled in everything</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Registered Date & Actions column */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {joinedRelative}
                        </span>

                        {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {['admin', 'sub-admin'].includes(currentUser.role) && (
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  setEditName(student.name || '');
                                  setEditEmail(student.email || '');
                                  setEditAssignedInstructorId(student.assignedInstructorId || '');
                                  setEditFatherName(student.fatherName || '');
                                  setEditAddress(student.address || '');
                                  setEditLastQualification(student.lastQualification || '');
                                  setEditGender(student.gender || '');
                                  setEditDob(student.dob || '');
                                  setEditAvatarUrl(student.avatarUrl || '');
                                  setEditUsername(student.username || '');
                                  setEditPassword(student.password || '');
                                  setEditBatch(student.batch || 'Batch A');
                                  setEditCourse(student.course || '');
                                  setEditPaymentStatus(student.paymentStatus || 'pending');
                                  setEditPhoneError('');
                                  setEditFatherPhoneError('');
 
                                  if (student.phone) {
                                    const match = COUNTRY_PHONE_CONFIGS.find(cfg => student.phone?.startsWith(cfg.code));
                                    setEditPhonePrefix(match ? match.code : '+91');
                                    setEditPhoneRaw(match ? student.phone.slice(match.code.length) : student.phone);
                                  } else {
                                    setEditPhoneRaw('');
                                    setEditPhonePrefix('+91');
                                  }
 
                                  if (student.fatherPhone) {
                                    const match = COUNTRY_PHONE_CONFIGS.find(cfg => student.fatherPhone?.startsWith(cfg.code));
                                    setEditFatherPhonePrefix(match ? match.code : '+91');
                                    setEditFatherPhoneRaw(match ? student.fatherPhone.slice(match.code.length) : student.fatherPhone);
                                  } else {
                                    setEditFatherPhoneRaw('');
                                    setEditFatherPhonePrefix('+91');
                                  }
                                }}
                                className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 rounded-lg transition"
                                title="Edit Student Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {['admin', 'sub-admin'].includes(currentUser.role) && onImpersonateStudent && (
                              <button
                                onClick={() => onImpersonateStudent(student)}
                                className="p-1.5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-lg transition cursor-pointer"
                                title="Emergency View Student Account"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setUserToDelete({ id: student.id, name: student.name, role: 'student' })}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                              title="Remove Student Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
            </div>
          </div>
        ) : activeListView === 'instructors' ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#080809] animate-fade-in font-sans shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header Row */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none items-center">
              <div className="col-span-5 md:col-span-4">Instructor</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-4 md:col-span-4">Specialization</div>
              <div className="hidden md:block md:col-span-2 text-right">Joined</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredInstructors.length === 0 ? (
                <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  No instructors registered.
                </div>
              ) : (
                filteredInstructors.map(ins => {
                  // Helper to format dynamic relative time
                  const getRelativeTime = (dateStr?: string) => {
                    if (!dateStr) return 'about 23 hours ago';
                    try {
                      const joined = new Date(dateStr);
                      const now = new Date('2026-06-12T07:05:49-07:00');
                      const diffMs = now.getTime() - joined.getTime();
                      if (isNaN(diffMs)) return 'about 23 hours ago';
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      if (diffHrs < 24) {
                        return `about ${diffHrs > 0 ? diffHrs : 5} hours ago`;
                      }
                      const diffDays = Math.floor(diffHrs / 24);
                      if (diffDays < 30) {
                        return `about ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                      }
                      const diffMonths = Math.floor(diffDays / 30);
                      return `about ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
                    } catch (e) {
                      return 'about 2 days ago';
                    }
                  };

                  const joinedRelative = getRelativeTime(ins.joinedDate);
                  return (
                    <div
                      key={ins.id}
                      className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group relative"
                    >
                      {/* Profile Column */}
                      <div className="col-span-5 md:col-span-4 flex items-center gap-3.5 min-w-0">
                        <img
                          src={ins.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={ins.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100 text-[13px] truncate" title={ins.name}>
                            {ins.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={ins.email}>
                            {ins.email}
                          </p>
                        </div>
                      </div>

                      {/* STATUS Column */}
                      <div className="col-span-3 md:col-span-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Faculty
                        </span>
                      </div>

                      {/* SUBJECT/Specialization Column */}
                      <div className="col-span-4 md:col-span-4 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-[13px] truncate">
                          {ins.specialization || 'General Mentor / Coach'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          Username: {ins.username}
                        </p>
                      </div>

                      {/* SENT/Joined Column + Actions */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {joinedRelative}
                        </span>

                        {['admin', 'sub-admin'].includes(currentUser.role) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingStudent(ins);
                                setEditName(ins.name || '');
                                setEditEmail(ins.email || '');
                                setEditUsername(ins.username || '');
                                setEditPassword(ins.password || '');
                                setEditSpecialization(ins.specialization || '');
                                setEditAvatarUrl(ins.avatarUrl || '');
                                
                                if (ins.phone) {
                                  const match = COUNTRY_PHONE_CONFIGS.find(cfg => ins.phone?.startsWith(cfg.code));
                                  setEditPhonePrefix(match ? match.code : '+91');
                                  setEditPhoneRaw(match ? ins.phone.slice(match.code.length) : ins.phone);
                                } else {
                                  setEditPhoneRaw('');
                                  setEditPhonePrefix('+91');
                                }
                              }}
                              className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 rounded-lg transition"
                              title="Edit Instructor Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUserToDelete({ id: ins.id, name: ins.name, role: 'instructor' })}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition"
                              title="Remove Faculty Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
            </div>
          </div>
        ) : (
          /* Sub-admins list view */
          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#080809] animate-fade-in font-sans shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header Row */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none items-center">
              <div className="col-span-5 md:col-span-4">Sub-Admin</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-4 md:col-span-4">Authority Role</div>
              <div className="hidden md:block md:col-span-2 text-right">Joined</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredSubAdmins.length === 0 ? (
                <div className="p-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  No sub-admins found matching search criteria.
                </div>
              ) : (
                filteredSubAdmins.map(sa => {
                  // Helper to format dynamic relative time
                  const getRelativeTime = (dateStr?: string) => {
                    if (!dateStr) return 'about 23 hours ago';
                    try {
                      const joined = new Date(dateStr);
                      const now = new Date('2026-06-12T07:05:49-07:00');
                      const diffMs = now.getTime() - joined.getTime();
                      if (isNaN(diffMs)) return 'about 23 hours ago';
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      if (diffHrs < 24) {
                        return `about ${diffHrs > 0 ? diffHrs : 5} hours ago`;
                      }
                      const diffDays = Math.floor(diffHrs / 24);
                      if (diffDays < 30) {
                        return `about ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                      }
                      const diffMonths = Math.floor(diffDays / 30);
                      return `about ${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
                    } catch (e) {
                      return 'about 2 days ago';
                    }
                  };

                  const joinedRelative = getRelativeTime(sa.joinedDate);
                  return (
                    <div
                      key={sa.id}
                      className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group relative"
                    >
                      {/* Profile Column */}
                      <div className="col-span-5 md:col-span-4 flex items-center gap-3.5 min-w-0">
                        <img
                          src={sa.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={sa.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100 text-[13px] truncate" title={sa.name}>
                            {sa.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={sa.email}>
                            {sa.email}
                          </p>
                        </div>
                      </div>

                      {/* STATUS Column */}
                      <div className="col-span-3 md:col-span-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          Authorized
                        </span>
                      </div>

                      {/* SUBJECT/Authority Column */}
                      <div className="col-span-4 md:col-span-4 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-[13px] truncate">
                          Coordinating Officer / Sub-Administrator
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          Username: {sa.username}
                        </p>
                      </div>

                      {/* SENT/Joined Column + Actions */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {joinedRelative}
                        </span>

                        {currentUser.role === 'admin' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingStudent(sa);
                                setEditName(sa.name || '');
                                setEditEmail(sa.email || '');
                                setEditUsername(sa.username || '');
                                setEditPassword(sa.password || '');
                                setEditAvatarUrl(sa.avatarUrl || '');
                                
                                if (sa.phone) {
                                  const match = COUNTRY_PHONE_CONFIGS.find(cfg => sa.phone?.startsWith(cfg.code));
                                  setEditPhonePrefix(match ? match.code : '+91');
                                  setEditPhoneRaw(match ? sa.phone.slice(match.code.length) : sa.phone);
                                } else {
                                  setEditPhoneRaw('');
                                  setEditPhonePrefix('+91');
                                }
                              }}
                              className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 rounded-lg transition"
                              title="Edit Sub-Admin Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUserToDelete({ id: sa.id, name: sa.name, role: 'sub-admin' })}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition"
                              title="Remove Sub-Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
            </div>
          </div>
        )}
        {/* Modal - Edit Student Details */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="text-base font-serif italic font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" /> Edit {editingStudent.role === 'instructor' ? 'Instructor' : editingStudent.role === 'sub-admin' ? 'Sub-Admin' : 'Student'} Details ({editingStudent.name})
                </h3>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditPhoneError('');
                  setEditFatherPhoneError('');

                  // Validation
                  if (editPhoneRaw) {
                    const cleaned = editPhoneRaw.replace(/\D/g, '');
                    const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === editPhonePrefix);
                    const reqLen = config ? config.length : 10;
                    if (cleaned.length !== reqLen) {
                      setEditPhoneError(`Phone number must be exactly ${reqLen} digits for ${editPhonePrefix}`);
                      return;
                    }
                  }

                  if (editFatherPhoneRaw) {
                    const cleaned = editFatherPhoneRaw.replace(/\D/g, '');
                    const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === editFatherPhonePrefix);
                    const reqLen = config ? config.length : 10;
                    if (cleaned.length !== reqLen) {
                      setEditFatherPhoneError(`Father's phone number must be exactly ${reqLen} digits for ${editFatherPhonePrefix}`);
                      return;
                    }
                  }

                  const finalPhone = editPhoneRaw.replace(/\D/g, '') ? `${editPhonePrefix}${editPhoneRaw.replace(/\D/g, '')}` : '';
                  const finalFatherPhone = editFatherPhoneRaw.replace(/\D/g, '') ? `${editFatherPhonePrefix}${editFatherPhoneRaw.replace(/\D/g, '')}` : '';

                  const updatedStudent: UserAccount = {
                    ...editingStudent,
                    name: editName.trim(),
                    email: editEmail.trim(),
                    phone: finalPhone,
                    assignedInstructorId: editAssignedInstructorId || undefined,
                    fatherName: editFatherName.trim() || undefined,
                    fatherPhone: finalFatherPhone || undefined,
                    address: editAddress.trim() || undefined,
                    lastQualification: editLastQualification.trim() || undefined,
                    gender: editGender || undefined,
                    dob: editDob || undefined,
                    avatarUrl: editAvatarUrl || undefined,
                    username: editUsername.trim() || undefined,
                    password: editPassword.trim() || undefined,
                    batch: editBatch,
                    course: editCourse || undefined,
                    paymentStatus: editPaymentStatus,
                    paidAmount: editPaymentStatus === 'paid' ? (editingStudent.paidAmount || 9999) : undefined,
                    paymentId: editPaymentStatus === 'paid' ? (editingStudent.paymentId || 'ADMIN_VERIFIED') : undefined,
                    specialization: editSpecialization.trim() || undefined,
                  };

                  setPendingStudentUpdate(updatedStudent);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">
                      {editingStudent.role === 'instructor' ? 'Instructor Name' : editingStudent.role === 'sub-admin' ? 'Sub-Admin Name' : 'Student Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Primary Contact Phone</label>
                    <div className="flex gap-1.5">
                      <select
                        value={editPhonePrefix}
                        onChange={e => setEditPhonePrefix(e.target.value)}
                        className="px-2 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 focus:outline-none"
                      >
                        {COUNTRY_PHONE_CONFIGS.map(c => (
                          <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editPhoneRaw}
                        onChange={e => setEditPhoneRaw(e.target.value)}
                        placeholder="Enter digits"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    {editPhoneError && <p className="text-xs text-rose-500  mt-0.5">{editPhoneError}</p>}
                  </div>

                  {/* Instructor only fields */}
                  {editingStudent.role === 'instructor' && (
                    <div className="space-y-1">
                      <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Specialization</label>
                      <input
                        type="text"
                        value={editSpecialization}
                        onChange={e => setEditSpecialization(e.target.value)}
                        placeholder="e.g. Advanced AI Models"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Student only fields */}
                  {editingStudent.role === 'student' && (
                  <>
                  {/* Tutor Assignment */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Assigned Instructor / Tutor</label>
                    <select
                      value={editAssignedInstructorId}
                      onChange={e => setEditAssignedInstructorId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Unassigned</option>
                      {instructors.map(ins => (
                        <option key={ins.id} value={ins.id}>{ins.name} ({ins.specialization || 'Coaching'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Student Payment / Fee Settle Status
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={e => setEditPaymentStatus(e.target.value as 'pending' | 'paid')}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                    >
                      <option value="pending" className="text-rose-500 dark:text-rose-400 font-semibold bg-white dark:bg-[#161618]">Unpaid / Fee Settle Required (Locked out of Panel)</option>
                      <option value="paid" className="text-emerald-500 dark:text-emerald-450 font-semibold bg-white dark:bg-[#161618]">Paid / Settle Accomplished (Full Access Granted)</option>
                    </select>
                  </div>
                  </>
                  )}

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Username for Login</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Password for Login</label>
                    <input
                      type="text"
                      required
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {editingStudent.role === 'student' && (
                  <>
                  {/* Father Name */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Father / Guardian Name</label>
                    <input
                      type="text"
                      value={editFatherName}
                      onChange={e => setEditFatherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Last Qualification */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Last Academic Qualification</label>
                    <input
                      type="text"
                      value={editLastQualification}
                      onChange={e => setEditLastQualification(e.target.value)}
                      placeholder="e.g. Higher Secondary Certificate"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Gender</label>
                    <select
                      value={editGender}
                      onChange={e => setEditGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Choose gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={e => setEditDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  {/* Enrolled Professional Course & Batch */}
                  <div className="space-y-1">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Enrolled Professional Course & Batch</label>
                    <select
                      value={editCourse && editBatch ? `${editCourse}::${editBatch}` : editCourse || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.includes('::')) {
                          const [cName, cBatch] = val.split('::');
                          setEditCourse(cName);
                          setEditBatch(cBatch);
                        } else {
                          setEditCourse(val);
                          setEditBatch('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">-- No Enrolled Course/Optional --</option>
                      {courses.filter(c => c.status === 'upcoming' || c.status === 'ongoing').map(c => (
                        <option key={c.id} value={`${c.name}::${c.batchNumber || ''}`}>{c.name} (Batch: {c.batchNumber || 'stb_001'}){c.status === 'ongoing' ? ' [Ongoing]' : ''}</option>
                      ))}
                    </select>
                  </div>
                  </>
                  )}

                  {/* Profile Photo Upload Section */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Profile Photo (Maximum 150KB)</label>
                    <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5">
                      {editAvatarUrl ? (
                        <div className="relative">
                          <img 
                            src={editAvatarUrl} 
                            alt="Preview" 
                            className="w-10 h-10 rounded-full object-cover border border-amber-500 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditAvatarUrl('');
                              setEditAvatarError('');
                            }}
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600 transition shadow"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 pl-2">
                        <input
                          type="file"
                          id="edit-avatar-upload"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setEditAvatarError('');
                              const compressedUrl = await compressImage(file);
                              setEditAvatarUrl(compressedUrl);
                            } catch (err) {
                              setEditAvatarError("Could not process photo.");
                              setEditAvatarUrl('');
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-avatar-upload"
                          className="inline-flex items-center self-start gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-slate-700 dark:text-slate-300 transition"
                        >
                          <Upload className="w-3 h-3" />
                          {editAvatarUrl ? 'Change' : 'Select Photo'}
                        </label>
                        {editAvatarError && (
                          <p className="text-xs text-rose-500 font-bold mt-1">
                            {editAvatarError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address - spans full width */}
                <div className="space-y-1">
                  <label className="text-xs  text-slate-500 dark:text-gray-400  font-semibold">Postal / Residental Address</label>
                  <textarea
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl transition shadow-md active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        <AnimatePresence>
          {userToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#161618] rounded-2xl border border-slate-100 dark:border-white/5 p-6 shadow-2xl relative"
              >
                <div className="flex items-center gap-3 text-rose-500 mb-4">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                      Confirm Permanent Deletion
                    </h3>
                    <p className="text-xs    text-slate-400">
                      Irreversible Operation
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-gray-350 leading-relaxed mb-6">
                  Are you absolutely sure you want to delete the record of <strong className="font-bold text-slate-900 dark:text-white">{userToDelete.name}</strong> ({userToDelete.role})? This will permanently purge their profile logs, class registers, and academic histories.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2.5 text-xs bg-slate-100 dark:bg-white/5 text-slate-705 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition active:scale-[0.98]"
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (userToDelete.role === 'student') {
                        onRemoveStudent(userToDelete.id);
                      } else if (userToDelete.role === 'instructor') {
                        if (onRemoveInstructor) onRemoveInstructor(userToDelete.id);
                      } else if (userToDelete.role === 'sub-admin') {
                        if (onRemoveSubAdmin) onRemoveSubAdmin(userToDelete.id);
                      }
                      setUserToDelete(null);
                    }}
                    className="px-5 py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl cursor-pointer transition shadow-md active:scale-[0.98]"
                  >
                    Yes, Delete Record
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Student Confirmation Modal */}
        <AnimatePresence>
          {pendingStudentUpdate && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#161618] rounded-2xl border border-slate-100 dark:border-white/5 p-6 shadow-2xl relative"
              >
                <div className="flex items-center gap-3 text-amber-500 mb-4">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl">
                    <Pencil className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                      Confirm Profile Modifications
                    </h3>
                    <p className="text-xs    text-slate-400">
                      Directory Updates
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-gray-350 leading-relaxed mb-6">
                  Do you want to save the new information for <strong className="font-bold text-slate-900 dark:text-white">{pendingStudentUpdate.name}</strong>? These updates will immediately synchronize with our secure Firebase storage and react on other browsers.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingStudentUpdate(null)}
                    className="px-4 py-2.5 text-xs bg-slate-100 dark:bg-white/5 text-slate-705 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition active:scale-[0.98]"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateStudent) {
                        onUpdateStudent(pendingStudentUpdate);
                      }
                      setPendingStudentUpdate(null);
                      setEditingStudent(null);
                    }}
                    className="px-5 py-2.5 text-xs bg-amber-500 hover:bg-amber-600 text-amber-955 font-bold rounded-xl cursor-pointer transition shadow-md active:scale-[0.98]"
                  >
                    Confirm & Update
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Quick Payment Settlement Modal */}
          {paymentSettleStudent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#161618] rounded-2xl border border-slate-100 dark:border-white/5 p-6 shadow-2xl relative"
              >
                {paymentSettleStudent.paymentStatus === 'paid' ? (
                  <>
                    <div className="flex items-center gap-3 text-rose-500 mb-4">
                      <div className="p-2.5 bg-rose-500/10 rounded-xl">
                        <X className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                          Revert Student Payment Status
                        </h3>
                        <p className="text-xs text-slate-400">
                          Lock Access Ledger
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-350 leading-relaxed mb-6">
                      Are you sure you want to mark <strong className="font-bold text-slate-900 dark:text-white">{paymentSettleStudent.name}</strong> as <strong className="text-rose-500 font-bold">Unpaid</strong>? 
                      This will lock them out of their student dashboard panel, requiring payment resolution or administrator override to restore access.
                    </p>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentSettleStudent(null)}
                        className="px-4 py-2.5 text-xs bg-slate-100 dark:bg-white/5 text-slate-705 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateStudent) {
                            const updated: UserAccount = {
                              ...paymentSettleStudent,
                              paymentStatus: 'pending',
                              paidAmount: undefined,
                              paymentId: undefined,
                            };
                            onUpdateStudent(updated);
                          }
                          setPaymentSettleStudent(null);
                        }}
                        className="px-5 py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl cursor-pointer transition shadow-md active:scale-[0.98]"
                      >
                        Yes, Mark as Unpaid
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-emerald-500 mb-4">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                          Settle Student Account Payment
                        </h3>
                        <p className="text-xs text-slate-400">
                          Bypass Fee Gate
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-350 leading-relaxed mb-6">
                      Are you sure you want to mark <strong className="font-bold text-slate-900 dark:text-white">{paymentSettleStudent.name}</strong> as <strong className="text-emerald-500 font-bold">Paid</strong>? 
                      This will instantly bypass the payment gateway, register their account as fully settled, and grant them complete access to their student dashboard.
                    </p>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentSettleStudent(null)}
                        className="px-4 py-2.5 text-xs bg-slate-100 dark:bg-white/5 text-slate-705 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateStudent) {
                            // Calculate fee helper
                            const getFee = () => {
                              if (!paymentSettleStudent.course || !courses || courses.length === 0) return 9999;
                              const userCourseClean = paymentSettleStudent.course.trim().replace(/\.+$/, "").toLowerCase(); const userBatchClean = paymentSettleStudent.batch?.trim().toLowerCase() || ""; let batchMatched = undefined; if (userBatchClean) { batchMatched = courses.find(c => { const cId = c.id?.trim().toLowerCase() || ""; const cName = c.name.trim().replace(/\.+$/, "").toLowerCase(); const cCode = c.code?.trim().toLowerCase() || ""; const cBatch = c.batchNumber?.trim().toLowerCase() || ""; const isCourseMatch = cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean; const isBatchMatch = cBatch === userBatchClean || cCode === userBatchClean; return isCourseMatch && isBatchMatch; }); } if (batchMatched) return batchMatched.fee || 9999;
                              let matched = courses.find(c => {
                                const cId = c.id?.trim().toLowerCase() || "";
                                const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                const cCode = c.code?.trim().toLowerCase() || "";
                                return cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
                              });
                              if (matched) return matched.fee || 9999;
                              matched = courses.find(c => {
                                const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                return cName.includes(userCourseClean) || userCourseClean.includes(cName);
                              });
                              return (matched || courses[0])?.fee || 9999;
                            };

                            const fee = getFee();
                            const updated: UserAccount = {
                              ...paymentSettleStudent,
                              paymentStatus: 'paid',
                              paidAmount: fee,
                              paymentId: 'ADMIN_VERIFIED_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                            };
                            onUpdateStudent(updated);
                          }
                          setPaymentSettleStudent(null);
                        }}
                        className="px-5 py-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer transition shadow-md active:scale-[0.98]"
                      >
                        Yes, Mark as Paid
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}

          {/* Interview Scheduler Modal */}
          {schedulingRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-default"
                onClick={() => setSchedulingRequest(null)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md p-6 bg-white dark:bg-[#0C0D0E] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-gray-100 font-sans">
                      Admission Interview Scheduler
                    </h3>
                    <p className="text-xs    text-slate-400 font-bold">
                      Prospect: {schedulingRequest.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSchedulingRequest(null)}
                    className="absolute top-5 right-5 p-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 my-4">
                  {/* Status Selection */}
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs  text-slate-400 dark:text-gray-500  font-semibold">Interview Status *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInterviewStatus('not_scheduled')}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${interviewStatus === 'not_scheduled' ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161618] text-slate-500 dark:text-gray-400'}`}
                      >
                        Not Scheduled
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewStatus('scheduled')}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${interviewStatus === 'scheduled' ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161618] text-slate-500 dark:text-gray-400'}`}
                      >
                        Scheduled
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewStatus('completed')}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${interviewStatus === 'completed' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161618] text-slate-500 dark:text-gray-400'}`}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterviewStatus('cancelled')}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${interviewStatus === 'cancelled' ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold' : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#161618] text-slate-500 dark:text-gray-400'}`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>

                  {/* Date & Time */}
                  {interviewStatus !== 'not_scheduled' && (
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1.5">
                        <label className="text-xs  text-slate-400 dark:text-gray-500  font-semibold">Interview Date</label>
                        <input
                          type="date"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-transparent rounded-xl px-3 py-2 text-slate-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs  text-slate-400 dark:text-gray-500  font-semibold">Interview Time</label>
                        <input
                          type="time"
                          value={interviewTime}
                          onChange={(e) => setInterviewTime(e.target.value)}
                          className="w-full text-xs bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-transparent rounded-xl px-3 py-2 text-slate-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Interviewer Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs  text-slate-400 dark:text-gray-500  font-semibold">Interviewer Comments / Notes</label>
                    <textarea
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      rows={3}
                      placeholder="Enter details such as interviewer name, questions checklist, or remarks from previous contact..."
                      className="w-full text-xs bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-slate-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans placeholder-slate-400 dark:placeholder-gray-600 leading-relaxed"
                    />
                  </div>

                  {interviewStatus === 'scheduled' && (
                    <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-500 dark:text-blue-400 flex gap-2">
                      <Video className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Saving with 'Scheduled' status will trigger educational email notifications to {schedulingRequest.email}.</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setSchedulingRequest(null)}
                    className="px-4 py-2.5 text-xs bg-slate-100 dark:bg-white/5 text-slate-705 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInterview}
                    className="px-5 py-2.5 text-xs bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl cursor-pointer transition shadow-md active:scale-[0.98]"
                  >
                    Save Schedule
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
