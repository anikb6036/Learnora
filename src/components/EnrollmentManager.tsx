/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, RegistrationRequest, StudentBatch, Course } from '../types';
import { UserPlus, Search, User, Filter, Trash2, Mail, Phone, Calendar, ArrowRight, BookOpen, Check, X, ShieldAlert, MapPin, GraduationCap, Camera, Upload, Pencil, Clock, Video, CheckCircle2 } from 'lucide-react';
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
}

export default function EnrollmentManager({
  currentUser,
  students,
  instructors,
  subAdmins = [],
  schedules,
  batches = [],
  courses = [],
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
  onUpdateRegistrationRequest
}: EnrollmentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<'all' | string>('all');
  const [selectedCourseName, setSelectedCourseName] = useState<'all' | string>('all');
  const [selectedBatchName, setSelectedBatchName] = useState<'all' | string>('all');
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
    return matchesSearch && matchesInstructor && matchesCourse && matchesBatch;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
            <p className="text-xs    text-slate-400">Total Enrolled</p>
            <p className="text-3xl font-bold font-sans text-slate-800 dark:text-white mt-1.5">{students.length}</p>
            <div className="mt-2 text-xs text-blue-500 font-semibold flex items-center gap-1">
              <span>All records permanently stored</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
            <p className="text-xs    text-slate-400">No Primary Mentor Assigned</p>
            <p className="text-3xl font-bold font-sans text-slate-800 dark:text-white mt-1.5">
              {students.filter(s => !s.assignedInstructorId || !instructors.some(i => i.id === s.assignedInstructorId)).length}
            </p>
            <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Requires review by administrator</p>
          </div>

          <div className="bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-sm">
            <p className="text-xs    text-slate-400">Average Courses / Student</p>
            <p className="text-3xl font-bold font-sans text-slate-800 dark:text-white mt-1.5">
              {students.length > 0
                ? (students.reduce((acc, s) => acc + getEnrolledClasses(s.id).length, 0) / students.length).toFixed(1)
                : '0.0'}
            </p>
            <p className="mt-2 text-xs text-slate-450 dark:text-gray-500">Diverse curricula across the center</p>
          </div>
        </div>
      )}

      {['admin', 'sub-admin'].includes(currentUser.role) && (
        <div className="p-6 rounded-3xl border border-blue-500/25 bg-blue-500/[0.02] dark:bg-[#070708] dark:border-white/10 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
            <div>
              <h3 className="text-base font-sans text-blue-500 font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Pending Fast Student Registration Requests ({registrationRequests.filter(r => r.status === 'pending').length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Review submitted applications from the public fast-registration portal. Accepting generates their profile and sends their username/password via simulated mail.
              </p>
            </div>
          </div>

          {registrationRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-gray-500  bg-slate-50/50 dark:bg-[#0F0F11]/50 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl select-none">
              No pending student registration tickets in queue. Use "Fast Student Registration" on the login screen to submit requests.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {registrationRequests.filter(r => r.status === 'pending').map(req => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0F0F11] border border-slate-150/80 dark:border-white/5 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        {req.avatarUrl ? (
                          <img 
                            src={req.avatarUrl} 
                            alt={req.name} 
                            className="w-10 h-10 rounded-full object-cover border border-amber-500 shadow-sm flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-600 flex-shrink-0 font-bold">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-gray-100 font-serif leading-tight">{req.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Submitted: {req.submittedDate}</p>
                        </div>
                      </div>
                      <span className="text-xs  font-bold  text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full  flex-shrink-0">
                        PENDING
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-gray-400">
                      <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                        <Mail className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{req.email}</span>
                      </p>
                      {req.phone && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{req.phone}</span>
                        </p>
                      )}
                      {req.gender && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Gender: <strong className="text-slate-800 dark:text-gray-200">{req.gender}</strong></span>
                        </p>
                      )}
                      {req.dob && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Date of Birth: <strong className="text-slate-800 dark:text-gray-200">{req.dob}</strong></span>
                        </p>
                      )}
                      {req.fatherName && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Father's Name: <strong className="text-slate-800 dark:text-gray-200">{req.fatherName}</strong></span>
                        </p>
                      )}
                      {req.address && (
                        <p className="flex items-start gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5 text-left">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug truncate">Address: <strong className="text-slate-800 dark:text-gray-200">{req.address}</strong></span>
                        </p>
                      )}
                      {req.lastQualification && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Qualification: <strong className="text-slate-800 dark:text-gray-200">{req.lastQualification}</strong></span>
                        </p>
                      )}
                      {req.course && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Desired Course: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{req.course}</strong></span>
                        </p>
                      )}
                      <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                        <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>Pre-assigned Mentor: <strong className="text-amber-500 font-semibold">{getInstructorName(req.assignedInstructorId)}</strong></span>
                      </p>

                      {/* Interview Schedule information */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161618] border dark:border-white/5 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold   text-slate-400 dark:text-gray-500 ">Admission Interview</p>
                          {req.interviewStatus === 'scheduled' ? (
                            <span className="text-xs  font-bold  text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full ">
                              Scheduled
                            </span>
                          ) : req.interviewStatus === 'completed' ? (
                            <span className="text-xs  font-bold  text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ">
                              Completed
                            </span>
                          ) : req.interviewStatus === 'cancelled' ? (
                            <span className="text-xs  font-bold  text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full ">
                              Cancelled
                            </span>
                          ) : (
                            <span className="text-xs  font-bold  text-slate-400 bg-slate-550/10 border border-slate-500/25 px-2 py-0.5 rounded-full ">
                              Not Scheduled
                            </span>
                          )}
                        </div>

                        {req.interviewStatus && req.interviewStatus !== 'not_scheduled' ? (
                          <div className="text-xs space-y-1">
                            {req.interviewDate && (
                              <p className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                                <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>Date: <strong className="text-slate-800 dark:text-gray-200">{req.interviewDate}</strong></span>
                              </p>
                            )}
                            {req.interviewTime && (
                              <p className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>Time: <strong className="text-slate-800 dark:text-gray-200">{req.interviewTime}</strong></span>
                              </p>
                            )}
                            {req.interviewNotes && (
                              <p className="text-xs bg-white dark:bg-black/20 p-1.5 rounded-md text-slate-500 dark:text-gray-400 font-sans italic border border-slate-150/50 dark:border-white/5">
                                "{req.interviewNotes}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-gray-500 leading-snug">
                            No interview details configured. Use the scheduler below to record interview slots or feedback.
                          </p>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-orange-500/[0.02] border border-amber-500/10 mt-2  text-xs space-y-1 select-none">
                        <p className="font-bold text-amber-500 text-xs  ">Security Credentials Drafted:</p>
                        <div className="flex justify-between text-slate-500 dark:text-gray-400 border-t dark:border-white/5 pt-1">
                          <span>User: <strong className="text-slate-800 dark:text-gray-200">{req.username}</strong></span>
                          <span>Pass: <strong className="text-slate-800 dark:text-gray-200">{req.password}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 justify-end pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => handleOpenInterviewScheduler(req)}
                      className="px-2.5 py-1.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-300 transition rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Interview
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectRequest(req.id)}
                      className="px-2.5 py-1.5 border border-slate-200 dark:border-white/5 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 text-slate-500 transition rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveRequest(req.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-955 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
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
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Student Enrollment & Profiles
            </h1>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Archive records, modify primary instructors, or view courses specific to each student.
            </p>
          </div>

          {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer select-none flex items-center gap-2 shadow"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddForm ? 'Hide Registration Form' : ['admin', 'sub-admin'].includes(currentUser.role) ? 'Register Account' : 'Register New Student'}
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

        {/* Directory View Selector Tabs */}
        <div className="flex border-b border-slate-100 dark:border-white/5 mb-6 gap-6 text-xs font-bold leading-relaxed">
          <button
            type="button"
            onClick={() => { setActiveListView('students'); setSearchTerm(''); }}
            className={`pb-3 relative transition-all cursor-pointer ${
              activeListView === 'students'
                ? 'text-amber-500'
                : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {currentUser.role === 'student' ? 'My Student Profile' : `Students Directory (${students.length})`}
            {activeListView === 'students' && (
              <motion.div layoutId="activeDirLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
          
          {['admin', 'sub-admin'].includes(currentUser.role) && (
            <button
              type="button"
              onClick={() => { setActiveListView('instructors'); setSearchTerm(''); }}
              className={`pb-3 relative transition-all cursor-pointer ${
                activeListView === 'instructors'
                  ? 'text-amber-500'
                  : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Instructors Directory ({instructors.length})
              {activeListView === 'instructors' && (
                <motion.div layoutId="activeDirLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => { setActiveListView('sub-admins'); setSearchTerm(''); }}
              className={`pb-3 relative transition-all cursor-pointer ${
                activeListView === 'sub-admins'
                  ? 'text-amber-500'
                  : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Sub-Administrators Directory ({subAdmins.length})
              {activeListView === 'sub-admins' && (
                <motion.div layoutId="activeDirLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
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
              </div>
            )}
          </div>
        )}

        {activeListView === 'students' ? (
          <>
            {/* Table Header Row looking like the Vercel/Resend layout */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#f4f4f5]/70 dark:bg-white/[0.02] border border-slate-200/30 dark:border-white/5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400  tracking-tight select-none mb-3 items-center font-sans">
              <div className="col-span-5 md:col-span-4">Student Profile</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-4 md:col-span-4">Assigned Advisor & Courses</div>
              <div className="hidden md:block md:col-span-2 text-right pr-4">Registered</div>
            </div>

            <div className="space-y-1.5 animate-fade-in font-sans">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400  border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708]/50">
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
                      className="grid grid-cols-12 gap-4 px-4 py-4 border border-slate-200/40 dark:border-white/5 rounded-xl bg-white dark:bg-[#080809] hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group shadow-3xs"
                    >
                      {/* Name & Avatar */}
                      <div className="col-span-5 md:col-span-4 flex items-center gap-3.5 min-w-0">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-250/30 dark:border-white/5 bg-slate-50 dark:bg-zinc-850"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-850 dark:text-zinc-150 text-[13px] leading-snug truncate" title={student.name}>
                            {student.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-gray-500 truncate " title={student.email}>
                            {student.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20 font-bold" title="6-digit Universal Student ID">
                              UID: {student.universalId || student.id.slice(0, 6)}
                            </span>
                            {student.course && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10">
                                {student.course}
                              </span>
                            )}
                            {student.batch && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 font-bold">
                                {student.batch}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Column */}
                      <div className="col-span-3 md:col-span-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/10 shadow-3xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Registered
                          </span>
                          {student.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 text-[10px] font-bold" title={`Transaction Ref: ${student.paymentId || 'N/A'}`}>
                              <span>₹{(student.paidAmount || 9999).toLocaleString('en-IN')} Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              <span>₹{(() => {
                                if (!student.course || !courses || courses.length === 0) return 9999;
                                const userCourseClean = student.course.trim().replace(/\.+$/, "").toLowerCase();
                                
                                // 1. Exact/Normalized check
                                let matched = courses.find(c => {
                                  const cId = c.id?.trim().toLowerCase() || "";
                                  const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                  const cCode = c.code?.trim().toLowerCase() || "";
                                  return cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
                                });
                                
                                if (matched) return matched.fee || 9999;
                                
                                // 2. Substring fallback
                                matched = courses.find(c => {
                                  const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                                  return cName.includes(userCourseClean) || userCourseClean.includes(cName);
                                });
                                
                                return (matched || courses[0])?.fee || 9999;
                              })().toLocaleString('en-IN')} Unpaid</span>
                            </span>
                          )}
                          {student.phone ? (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate max-w-full " title={student.phone}>
                              <Phone className="w-3" /> {student.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-gray-500  italic">No phone added</span>
                          )}
                        </div>
                      </div>

                      {/* Advisor & Courses Column */}
                      <div className="col-span-4 md:col-span-4 min-w-0">
                        <div className="space-y-1.5">
                          {/* Advisor name */}
                          <p className="font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 truncate">
                            <GraduationCap className="w-4 h-4 text-amber-500" />
                            Advisor: <span className="text-slate-900 dark:text-white font-medium">{getInstructorName(student.assignedInstructorId)}</span>
                          </p>
                          
                          {/* Active courses tags */}
                          <div className="flex flex-wrap gap-1 items-center">
                            {enrolled.map(cl => (
                              <span
                                key={cl.id}
                                className="inline-flex items-center gap-1.5 border border-slate-200/50 bg-white dark:bg-[#161618] dark:border-white/5 text-slate-705 dark:text-blue-300 px-2 py-0.5 rounded text-xs h-fit shadow-2xs"
                              >
                                <BookOpen className="w-2.5 h-2.5 text-amber-500" />
                                {cl.subject}
                              </span>
                            ))}
                            {currentUser.role !== 'student' && (
                              <button
                                onClick={() => setEnrollmentStudentId(student.id)}
                                className="text-xs font-bold text-amber-500 hover:underline px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                              >
                                + Enroll Class
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Assign Classes Dropdown popover */}
                        {enrollmentStudentId === student.id && (
                          <div className="absolute z-50 mt-2 bg-white dark:bg-[#0F0F11] border border-slate-200 dark:border-white/5 p-3 rounded-xl shadow-lg w-52 max-h-48 overflow-y-auto">
                            <div className="flex justify-between items-center mb-1 text-xs text-slate-400  border-b dark:border-white/5 pb-1">
                              <span>Choose Course:</span>
                              <button onClick={() => setEnrollmentStudentId(null)} className="text-rose-500 hover:underline">Close</button>
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
                                  className="w-full text-left py-1 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs text-slate-755 dark:text-slate-350 truncate block cursor-pointer"
                                >
                                  {cl.subject}: {cl.title}
                                </button>
                              ))}
                            {schedules.filter(cl => !cl.enrolledStudentIds.includes(student.id)).length === 0 && (
                              <p className="p-1 pt-2 text-xs text-slate-400 text-center ">Enrolled in everything</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Registered Date & Actions column */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                        <span className="text-xs text-slate-400 ">
                          {joinedRelative}
                        </span>

                        {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                          <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 transition whitespace-nowrap">
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
                                className="p-1.5 hover:bg-amber-500/10 text-slate-444 hover:text-amber-500 rounded-lg transition"
                                title="Edit Student Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setUserToDelete({ id: student.id, name: student.name, role: 'student' })}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-444 hover:text-rose-500 rounded-lg transition cursor-pointer"
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
          </>
        ) : activeListView === 'instructors' ? (
          <div className="space-y-1.5 animate-fade-in font-sans">
            {/* Table Header Row looking like the Resend.com layout */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#f4f4f5]/70 dark:bg-white/[0.02] border border-slate-200/30 dark:border-white/5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400  tracking-tight select-none mb-3 items-center font-sans">
              <div className="col-span-5 md:col-span-4">Instructor</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-4 md:col-span-4">Specialization</div>
              <div className="hidden md:block md:col-span-2 text-right pr-4">Joined</div>
            </div>

            {filteredInstructors.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400  border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708]/50">
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
                    className="grid grid-cols-12 gap-4 px-4 py-4 border border-slate-200/40 dark:border-white/5 rounded-xl bg-white dark:bg-[#080809] hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group shadow-3xs"
                  >
                    {/* TO/Profile Column */}
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/50 dark:border-white/5 flex items-center justify-center flex-shrink-0 text-blue-500 shadow-2xs">
                        {ins.avatarUrl ? (
                          <img
                            src={ins.avatarUrl}
                            alt={ins.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-150 truncate" title={ins.email}>
                          {ins.email}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 truncate">
                          {ins.name}
                        </p>
                      </div>
                    </div>

                    {/* STATUS Column */}
                    <div className="col-span-3 md:col-span-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg border text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/10">
                        Faculty
                      </span>
                    </div>

                    {/* SUBJECT/Specialization Column */}
                    <div className="col-span-4 md:col-span-4 min-w-0">
                      <p className="font-semibold text-slate-850 dark:text-zinc-200 truncate">
                        {ins.specialization || 'General Mentor / Coach'}
                      </p>
                      <p className="text-xs text-slate-400  mt-0.5">
                        User: {ins.username} • Pass: {ins.password}
                      </p>
                    </div>

                    {/* SENT/Joined Column + Actions */}
                    <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                      <span className="text-xs text-slate-400 ">
                        {joinedRelative}
                      </span>

                      {['admin', 'sub-admin'].includes(currentUser.role) && (
                        <div className="flex items-center gap-1">
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
                            className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-505 rounded-lg transition"
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
        ) : (
          /* Sub-admins list view (Pixel-replica Resend grid layout) */
          <div className="space-y-1.5 animate-fade-in font-sans">
            {/* Table Header Row looking like the Resend.com layout */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#f4f4f5]/70 dark:bg-white/[0.02] border border-slate-200/30 dark:border-white/5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400  tracking-tight select-none mb-3 items-center">
              <div className="col-span-5 md:col-span-4">Sub-Admin</div>
              <div className="col-span-3 md:col-span-2">Status</div>
              <div className="col-span-4 md:col-span-4">Authority Role</div>
              <div className="hidden md:block md:col-span-2 text-right pr-4">Joined</div>
            </div>

            {filteredSubAdmins.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400  border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-[#070708]/50">
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
                    className="grid grid-cols-12 gap-4 px-4 py-4 border border-slate-200/40 dark:border-white/5 rounded-xl bg-white dark:bg-[#080809] hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition duration-150 items-center text-xs group shadow-3xs font-sans"
                  >
                    {/* TO/Profile Column */}
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/50 dark:border-white/5 flex items-center justify-center flex-shrink-0 text-blue-500 shadow-2xs">
                        {sa.avatarUrl ? (
                          <img
                            src={sa.avatarUrl}
                            alt={sa.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-150 truncate" title={sa.email}>
                          {sa.email}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 truncate">
                          {sa.name}
                        </p>
                      </div>
                    </div>

                    {/* STATUS Column */}
                    <div className="col-span-3 md:col-span-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg border text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/10">
                        Authorized
                      </span>
                    </div>

                    {/* SUBJECT/Authority Column */}
                    <div className="col-span-4 md:col-span-4 min-w-0">
                      <p className="font-semibold text-slate-850 dark:text-zinc-200 truncate">
                        Coordinating Officer / Sub-Administrator
                      </p>
                      <p className="text-xs text-slate-400  mt-0.5">
                        User: {sa.username} • Pass: {sa.password}
                      </p>
                    </div>

                    {/* SENT/Joined Column + Actions */}
                    <div className="hidden md:flex md:col-span-2 items-center justify-end text-right gap-3">
                      <span className="text-xs text-slate-400 ">
                        {joinedRelative}
                      </span>

                      {currentUser.role === 'admin' && (
                        <div className="flex items-center gap-1">
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
                            className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-505 rounded-lg transition"
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
