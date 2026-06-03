/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, ClassSchedule, RegistrationRequest, StudentBatch, Course } from '../types';
import { UserPlus, Search, User, Filter, Trash2, Mail, Phone, Calendar, ArrowRight, BookOpen, Check, X, ShieldAlert, MapPin, GraduationCap, Camera, Upload, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRY_PHONE_CONFIGS } from '../countryPhoneData';

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
  onUpdateStudent
}: EnrollmentManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<'all' | string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormType, setAddFormType] = useState<'student' | 'instructor' | 'sub-admin'>('student');
  const [activeListView, setActiveListView] = useState<'students' | 'instructors' | 'sub-admins'>('students');

  // Edit Student level states
  const [editingStudent, setEditingStudent] = useState<UserAccount | null>(null);
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
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstructor = selectedInstructorId === 'all' || student.assignedInstructorId === selectedInstructorId;
    return matchesSearch && matchesInstructor;
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
          <div className="bg-white dark:bg-[#161618] rounded-2xl border border-slate-150/80 dark:border-white/5 p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-400">Total Enrolled</p>
            <p className="text-3xl font-serif text-slate-800 dark:text-white mt-1.5">{students.length}</p>
            <div className="mt-2 text-xs text-amber-500 font-semibold flex items-center gap-1">
              <span>All records permanently stored</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161618] rounded-2xl border border-slate-150/80 dark:border-white/5 p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-400">No Primary Mentor Assigned</p>
            <p className="text-3xl font-serif text-slate-800 dark:text-white mt-1.5">
              {students.filter(s => !s.assignedInstructorId).length}
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-gray-500">Requires review by administrator</p>
          </div>

          <div className="bg-white dark:bg-[#161618] rounded-2xl border border-slate-150/80 dark:border-white/5 p-5 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-400">Average Courses / Student</p>
            <p className="text-3xl font-serif text-slate-800 dark:text-white mt-1.5">
              {students.length > 0
                ? (students.reduce((acc, s) => acc + getEnrolledClasses(s.id).length, 0) / students.length).toFixed(1)
                : '0.0'}
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-gray-500">Diverse curricula across the center</p>
          </div>
        </div>
      )}

      {['admin', 'sub-admin'].includes(currentUser.role) && (
        <div className="p-6 rounded-3xl border border-amber-500/25 bg-amber-500/[0.02] dark:bg-[#161618] dark:border-white/5 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
            <div>
              <h3 className="text-base font-serif italic text-amber-500 font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Pending Fast Student Registration Requests ({registrationRequests.filter(r => r.status === 'pending').length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Review submitted applications from the public fast-registration portal. Accepting generates their profile and sends their username/password via simulated mail.
              </p>
            </div>
          </div>

          {registrationRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-gray-500 font-mono bg-slate-50/50 dark:bg-[#0F0F11]/50 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl select-none">
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
                          <p className="text-sm font-bold text-slate-900 dark:text-gray-100 font-serif leading-tight">{req.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">Submitted: {req.submittedDate}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase flex-shrink-0">
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
                      {req.fatherPhone && (
                        <p className="flex items-center gap-2 bg-slate-50 dark:bg-[#161618] p-1.5 px-2 rounded-lg border dark:border-white/5">
                          <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Father's Phone: <strong className="text-slate-800 dark:text-gray-200">{req.fatherPhone}</strong></span>
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

                      <div className="p-2.5 rounded-xl bg-orange-500/[0.02] border border-amber-500/10 mt-2 font-mono text-[10px] space-y-1 select-none">
                        <p className="font-bold text-amber-500 text-[9px] uppercase tracking-wider">Security Credentials Drafted:</p>
                        <div className="flex justify-between text-slate-500 dark:text-gray-400 border-t dark:border-white/5 pt-1">
                          <span>User: <strong className="text-slate-800 dark:text-gray-200">{req.username}</strong></span>
                          <span>Pass: <strong className="text-slate-800 dark:text-gray-200">{req.password}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => onRejectRequest(req.id)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-white/5 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 text-slate-500 transition rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Decline Request
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveRequest(req.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept & Enroll Student
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#161618] rounded-3xl border border-slate-150/80 dark:border-white/5 shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-serif italic text-amber-500 font-bold tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              Student Enrollment & Profiles
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 font-sans">
              Archive records, modify primary instructors, or view courses specific to each student.
            </p>
          </div>

          {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 transition active:scale-95 scroll-smooth"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showAddForm ? 'Hide Registration Form' : ['admin', 'sub-admin'].includes(currentUser.role) ? 'Register Student/Instructor/Sub-Admin' : 'Register New Student'}
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
                    <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Profile Photo (Maximum 150KB)</label>
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const limit = 150 * 1024;
                            if (file.size > limit) {
                              setNewAvatarError("photo size more then 150kb please upload photo under 150kb");
                              setNewAvatarUrl('');
                              e.target.value = '';
                              return;
                            }
                            setNewAvatarError('');
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewAvatarUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
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
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                          Strictly maximum file size 150KB.
                        </p>
                        {newAvatarError && (
                          <p className="text-[10px] text-rose-500 font-bold">
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
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Instructor Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Professor Sarah Connor"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Work Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@prismcoaching.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Phone (Optional)</label>
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
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono`}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-[10px] text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Specialization Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Calculus & Linear Algebra"
                        value={newSpecialization}
                        onChange={e => setNewSpecialization(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-amber-500 dark:text-amber-500 block font-bold">
                        Instructor Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. sarah_math"
                        value={newInstructorUsername}
                        onChange={e => setNewInstructorUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-amber-500 dark:text-amber-500 block font-bold">
                        Instructor Password
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Access password"
                        value={newInstructorPassword}
                        onChange={e => setNewInstructorPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                      />
                    </div>
                  </>
                ) : addFormType === 'sub-admin' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Sub-Admin Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Assistant John"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Work Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="john@prismcoaching.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold">Phone (Optional)</label>
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
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono`}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-[10px] text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Operational Scope</span>
                      <div className="text-[10.5px] p-2 bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl font-medium leading-relaxed">
                        Authorized to manage class schedules and evaluate student progress folders. Cannot build other sub-admin or faculty credentials.
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-amber-500 dark:text-amber-500 block font-bold">
                        Sub-Admin Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. john_assistant"
                        value={newInstructorUsername}
                        onChange={e => setNewInstructorUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-amber-500 dark:text-amber-500 block font-bold">
                        Sub-Admin Password
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Access password"
                        value={newInstructorPassword}
                        onChange={e => setNewInstructorPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Alex Smith"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Phone Number (Optional)</label>
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
                          className={`flex-1 px-3 py-2 text-xs border ${newPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono`}
                        />
                      </div>
                      {newPhoneError && (
                        <p className="text-[10px] text-rose-500 font-semibold">{newPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Assign Advisor Mentor</label>
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
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Gender</label>
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
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Date of Birth</label>
                      <input
                        type="date"
                        value={newDob}
                        onChange={e => setNewDob(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Father's Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Father's Legal Name"
                        value={newFatherName}
                        onChange={e => setNewFatherName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Father's Phone (Optional)</label>
                      <div className="flex gap-1.5">
                        <select
                          value={newFatherPhonePrefix}
                          onChange={e => {
                            setNewFatherPhonePrefix(e.target.value);
                            setNewFatherPhone('');
                            setNewFatherPhoneError('');
                          }}
                          className="px-2 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                        >
                          {COUNTRY_PHONE_CONFIGS.map(c => (
                            <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={COUNTRY_PHONE_CONFIGS.find(c => c.code === newFatherPhonePrefix)?.placeholder || '9876543210'}
                          value={newFatherPhone}
                          maxLength={COUNTRY_PHONE_CONFIGS.find(c => c.code === newFatherPhonePrefix)?.length || 10}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setNewFatherPhone(raw);
                            const len = COUNTRY_PHONE_CONFIGS.find(c => c.code === newFatherPhonePrefix)?.length || 10;
                            if (raw && raw.length !== len) {
                              setNewFatherPhoneError(`Must be exactly ${len} digits`);
                            } else {
                              setNewFatherPhoneError('');
                            }
                          }}
                          className={`flex-1 px-3 py-2 text-xs border ${newFatherPhoneError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono`}
                        />
                      </div>
                      {newFatherPhoneError && (
                        <p className="text-[10px] text-rose-500 font-semibold">{newFatherPhoneError}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Residential Address (Optional)</label>
                      <input
                        type="text"
                        placeholder="Permanent Address"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Last Qualification (Optional)</label>
                      <input
                        type="text"
                        placeholder="Academic degree/diploma"
                        value={newLastQualification}
                        onChange={e => setNewLastQualification(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Student Batch Group</label>
                      <select
                        value={newBatch}
                        onChange={e => setNewBatch(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                      >
                        {batches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                        {batches.length === 0 && (
                          <>
                            <option value="Batch A">Batch A</option>
                            <option value="Batch B">Batch B</option>
                            <option value="Batch C">Batch C</option>
                            <option value="Batch D">Batch D</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Enrolled Professional Course</label>
                      <select
                        value={newCourse}
                        onChange={e => setNewCourse(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-sans"
                      >
                        <option value="">-- No Enrolled Course/Optional --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
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
          <div className="flex flex-col md:flex-row gap-3.5 mb-5 max-w-4xl font-sans">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
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
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 dark:border-white/5 dark:bg-[#0F0F11] rounded-xl text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {activeListView === 'students' && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedInstructorId}
                onChange={e => setSelectedInstructorId(e.target.value)}
                className="border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-[#0F0F11] text-slate-705 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-sans"
              >
                <option value="all">Mentor Filter: All</option>
                {instructors.map(ins => (
                  <option key={ins.id} value={ins.id}>
                    Mentor: {ins.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        )}

        {activeListView === 'students' ? (
          <>

            {/* Students Table/Grid */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Student Profile</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Contact Info</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Assigned Advisor</th>
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Active Enrollment Courses</th>
                    {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                      <th className="p-4 text-xs font-bold text-slate-550 dark:text-slate-400 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={['admin', 'sub-admin', 'instructor'].includes(currentUser.role) ? 5 : 4} className="p-10 text-center text-slate-400 font-mono">
                        No student registrations found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const enrolled = getEnrolledClasses(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={student.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                              alt={student.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{student.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <p className="text-[10px] font-mono text-slate-400">ID: {student.id}</p>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                                  {student.batch || 'Batch A'}
                                </span>
                                {student.course && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {student.course}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1.5 text-slate-650 dark:text-slate-400">
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {student.email}
                              </p>
                              {student.phone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  {student.phone}
                                </p>
                              )}
                              <p className="flex items-center gap-1.5 font-mono text-[10px]">
                                <Calendar className="w-3 h-3 text-slate-41" /> Registered: {student.joinedDate}
                              </p>

                              {(student.fatherName || student.address || student.lastQualification || student.gender || student.dob) && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1 text-[10.5px]">
                                  {student.gender && (
                                    <p className="text-slate-600 dark:text-gray-400">
                                      <strong className="text-slate-500">Gender:</strong> {student.gender}
                                    </p>
                                  )}
                                  {student.dob && (
                                    <p className="text-slate-600 dark:text-gray-400">
                                      <strong className="text-slate-500">D.O.B:</strong> {student.dob}
                                    </p>
                                  )}
                                  {student.fatherName && (
                                    <p className="text-slate-600 dark:text-gray-400" title={`Father's phone: ${student.fatherPhone || 'N/A'}`}>
                                      <strong className="text-slate-500">Father:</strong> {student.fatherName} {student.fatherPhone && `(${student.fatherPhone})`}
                                    </p>
                                  )}
                                  {student.lastQualification && (
                                    <p className="text-slate-600 dark:text-gray-400 truncate max-w-[220px]" title={student.lastQualification}>
                                      <strong className="text-slate-500">Qual:</strong> {student.lastQualification}
                                    </p>
                                  )}
                                  {student.address && (
                                    <p className="text-slate-600 dark:text-gray-400 truncate max-w-[220px]" title={student.address}>
                                      <strong className="text-slate-500">Addr:</strong> {student.address}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 bg-amber-550/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full font-bold">
                              <User className="w-3 h-3" />
                              {getInstructorName(student.assignedInstructorId)}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {enrolled.map(cl => (
                                <span
                                  key={cl.id}
                                  className="inline-flex items-center gap-1 border border-slate-150 bg-white dark:bg-[#161618] dark:border-white/5 text-slate-700 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] h-fit"
                                >
                                  <BookOpen className="w-2.5 h-2.5 text-amber-500" />
                                  {cl.subject}
                                </span>
                              ))}
                              {currentUser.role !== 'student' && (
                                <button
                                  onClick={() => setEnrollmentStudentId(student.id)}
                                  className="text-[10px] font-bold text-amber-500 hover:underline px-1.5 py-0.5"
                                >
                                  + Add class
                                </button>
                              )}
                            </div>

                            {/* Interactive Assign Classes Dropdown popover */}
                            {enrollmentStudentId === student.id && (
                              <div className="absolute z-10 mt-2 bg-white dark:bg-[#0F0F11] border border-slate-200 dark:border-white/5 p-3 rounded-xl shadow-lg w-52 max-h-48 overflow-y-auto">
                                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-mono border-b dark:border-white/5 pb-1">
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
                                      className="w-full text-left py-1 hover:bg-slate-50 dark:hover:bg-slate-900 text-[10.5px] text-slate-755 dark:text-slate-350 truncate block"
                                    >
                                      {cl.subject}: {cl.title}
                                    </button>
                                  ))}
                                {schedules.filter(cl => !cl.enrolledStudentIds.includes(student.id)).length === 0 && (
                                  <p className="p-1 pt-2 text-[10px] text-slate-400 text-center font-mono">Enrolled in everything</p>
                                )}
                              </div>
                            )}
                          </td>

                          {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                            <td className="p-4 text-right">
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
                                  className="p-1.5 hover:bg-amber-50/10 dark:hover:bg-amber-950/20 text-slate-444 hover:text-amber-500 rounded-lg transition mr-1.5"
                                  title="Edit Student Details"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onRemoveStudent(student.id)}
                                className="p-1.5 hover:bg-rose-50/10 dark:hover:bg-rose-950/20 text-slate-444 hover:text-rose-500 rounded-lg transition"
                                title="Remove Student Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : activeListView === 'instructors' ? (
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Instructor Profile</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Contact Info</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider font-sans">Specialization</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono">Credentials Info</th>
                  {['admin', 'sub-admin'].includes(currentUser.role) && (
                    <th className="p-4 text-xs font-bold text-slate-550 dark:text-slate-400 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredInstructors.length === 0 ? (
                  <tr>
                    <td colSpan={['admin', 'sub-admin'].includes(currentUser.role) ? 5 : 4} className="p-10 text-center text-slate-400 font-mono">
                      {searchTerm ? "No instructor registrations found matching search query." : "No instructor registrations found. Registered instructors will appear here."}
                    </td>
                  </tr>
                ) : (
                  filteredInstructors.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/5 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={ins.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'}
                          alt={ins.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border dark:border-white/10"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-gray-150 font-serif text-sm">{ins.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">ID: {ins.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-gray-300">{ins.email}</p>
                        {ins.phone && <p className="text-slate-400 dark:text-gray-500 text-[10.5px] mt-0.5">{ins.phone}</p>}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Joined: {ins.joinedDate}</p>
                      </td>
                      <td className="p-4">
                        <span className="p-1.5 px-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold">
                          {ins.specialization || 'General Mentor / Coach'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-[10.5px] bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-150 dark:border-white/5 inline-block text-left space-y-0.5">
                          <p className="text-slate-500 dark:text-slate-400"><span className="text-amber-500 font-bold select-none">User:</span> {ins.username}</p>
                          <p className="text-slate-500 dark:text-slate-400"><span className="text-amber-500 font-bold select-none">Pass:</span> {ins.password}</p>
                        </div>
                      </td>
                      {['admin', 'sub-admin'].includes(currentUser.role) && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onRemoveInstructor && onRemoveInstructor(ins.id)}
                            className="p-1.5 hover:bg-rose-50/10 dark:hover:bg-rose-950/20 text-slate-444 hover:text-rose-500 rounded-lg transition cursor-pointer"
                            title="Remove Faculty Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Sub-admins list view */
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Sub-Admin Profile</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Contact Info</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider font-sans">Role Authority</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono">Credentials Info</th>
                  {currentUser.role === 'admin' && (
                    <th className="p-4 text-xs font-bold text-slate-550 dark:text-slate-400 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredSubAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'admin' ? 5 : 4} className="p-10 text-center text-slate-400 font-mono">
                      {searchTerm ? "No sub-admin registrations found matching search query." : "No sub-admin registrations found. Registered sub-admin accounts will appear here."}
                    </td>
                  </tr>
                ) : (
                  filteredSubAdmins.map(sa => (
                    <tr key={sa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/5 transition">
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={sa.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                          alt={sa.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border dark:border-white/10"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-gray-150 font-serif text-sm">{sa.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">ID: {sa.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-gray-300">{sa.email}</p>
                        {sa.phone && <p className="text-slate-400 dark:text-gray-500 text-[10.5px] mt-0.5">{sa.phone}</p>}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Joined: {sa.joinedDate}</p>
                      </td>
                      <td className="p-4">
                        <span className="p-1.5 px-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold rounded-full text-[10px] uppercase font-mono tracking-wider">
                          Coordinating Officer
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-[10.5px] bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-150 dark:border-white/5 inline-block text-left space-y-0.5">
                          <p className="text-slate-550 dark:text-slate-400"><span className="text-amber-500 font-bold select-none">User:</span> {sa.username}</p>
                          <p className="text-slate-550 dark:text-slate-400"><span className="text-amber-500 font-bold select-none">Pass:</span> {sa.password}</p>
                        </div>
                      </td>
                      {currentUser.role === 'admin' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onRemoveSubAdmin && onRemoveSubAdmin(sa.id)}
                            className="p-1.5 hover:bg-rose-50/10 dark:hover:bg-rose-950/20 text-slate-444 hover:text-rose-500 rounded-lg transition cursor-pointer"
                            title="Remove Sub-Admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                  <Pencil className="w-4 h-4 text-amber-500" /> Edit Student Details ({editingStudent.name})
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
                  };

                  if (onUpdateStudent) {
                    onUpdateStudent(updatedStudent);
                  }
                  setEditingStudent(null);
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Student Name</label>
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
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Email Address</label>
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
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Primary Contact Phone</label>
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
                    {editPhoneError && <p className="text-[9px] text-rose-500 font-mono mt-0.5">{editPhoneError}</p>}
                  </div>

                  {/* Tutor Assignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Assigned Instructor / Tutor</label>
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

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Username for Login</label>
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
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Password for Login</label>
                    <input
                      type="text"
                      required
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Father Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Father / Guardian Name</label>
                    <input
                      type="text"
                      value={editFatherName}
                      onChange={e => setEditFatherName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 font-sans focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Father Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Father / Guardian Phone</label>
                    <div className="flex gap-1.5">
                      <select
                        value={editFatherPhonePrefix}
                        onChange={e => setEditFatherPhonePrefix(e.target.value)}
                        className="px-2 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none"
                      >
                        {COUNTRY_PHONE_CONFIGS.map(c => (
                          <option key={c.code + c.name} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editFatherPhoneRaw}
                        onChange={e => setEditFatherPhoneRaw(e.target.value)}
                        placeholder="Enter digits"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    {editFatherPhoneError && <p className="text-[9px] text-rose-500 font-mono mt-0.5">{editFatherPhoneError}</p>}
                  </div>

                  {/* Last Qualification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Last Academic Qualification</label>
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
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Gender</label>
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
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Date of Birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={e => setEditDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                   {/* Student Batch Group */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Student Batch Group</label>
                    <select
                      value={editBatch}
                      onChange={e => setEditBatch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                      {batches.length === 0 && (
                        <>
                          <option value="Batch A">Batch A</option>
                          <option value="Batch B">Batch B</option>
                          <option value="Batch C">Batch C</option>
                          <option value="Batch D">Batch D</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Enrolled Professional Course */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Enrolled Professional Course</label>
                    <select
                      value={editCourse}
                      onChange={e => setEditCourse(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">-- No Enrolled Course/Optional --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Avatar URL / Pic */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Avatar Image URL</label>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={e => setEditAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address - spans full width */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase font-semibold">Postal / Residental Address</label>
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
      </div>
    </div>
  );
}
