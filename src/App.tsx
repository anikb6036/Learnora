/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord, AppNotification, BackupHistory, RegistrationRequest, SimulatedEmail, StudentBatch, Course } from './types';
import {
  INITIAL_USERS,
  INITIAL_SCHEDULES,
  INITIAL_PROGRESS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BACKUPS,
  INITIAL_BATCHES,
  INITIAL_COURSES,
  getSavedState,
  saveState,
  useFirebaseState
} from './utils';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import NotificationCenter from './components/NotificationCenter';
import EnrollmentManager from './components/EnrollmentManager';
import ScheduleManager from './components/ScheduleManager';
import ProgressTracker from './components/ProgressTracker';
import ReportingDashboard from './components/ReportingDashboard';
import CloudBackup from './components/CloudBackup';
import MailboxManager from './components/MailboxManager';
import ProfileSettings from './components/ProfileSettings';
import HomePage from './components/HomePage';
import Logo from './components/Logo';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Award,
  BarChart3,
  CloudLightning,
  LogOut,
  Bell,
  Sun,
  Moon,
  Clock,
  Briefcase,
  User,
  Activity,
  ChevronRight,
  ShieldAlert,
  Shield,
  Key,
  Smartphone,
  Check,
  Mail,
  Lock,
  Sparkles,
  MapPin,
  GraduationCap,
  Camera,
  Trash2,
  Plus,
  Upload,
  X,
  AlertCircle,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { COUNTRY_PHONE_CONFIGS } from './countryPhoneData';
import { GEO_COUNTRIES, getSmartPostOffices } from './geoAddressData';
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, sendEmailVerification, checkActionCode, applyActionCode, ConfirmationResult } from 'firebase/auth';

// Auto-detect and perform a one-time clean-up migration of old dummy/simulation storage data
if (typeof window !== 'undefined' && !localStorage.getItem('db-migrated-to-real-v5')) {
  localStorage.removeItem('db-users');
  localStorage.removeItem('db-schedules');
  localStorage.removeItem('db-progress');
  localStorage.removeItem('db-notifications');
  localStorage.removeItem('db-backups');
  localStorage.removeItem('db-registration-requests');
  localStorage.removeItem('db-simulated-emails');
  localStorage.removeItem('active-user');
  localStorage.setItem('db-migrated-to-real-v5', 'true');
}

const generateUniqueId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

function AppContent() {
  const { isDark } = useTheme();

  // Root states synchronized with Firebase Live Queries
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getSavedState('active-user', null));
  const [users, setUsers, usersLoaded] = useFirebaseState<UserAccount[]>('db-users', INITIAL_USERS);
  const [schedules, setSchedules, schedulesLoaded] = useFirebaseState<ClassSchedule[]>('db-schedules', INITIAL_SCHEDULES);
  const [progressRecords, setProgressRecords, progressLoaded] = useFirebaseState<ProgressRecord[]>('db-progress', INITIAL_PROGRESS);
  const [notifications, setNotifications, notificationsLoaded] = useFirebaseState<AppNotification[]>('db-notifications', INITIAL_NOTIFICATIONS);
  const [backupHistory, setBackupHistory, backupsLoaded] = useFirebaseState<BackupHistory[]>('db-backups', INITIAL_BACKUPS);

  useEffect(() => {
    saveState('active-user', currentUser);
  }, [currentUser]);

  // Pending admission registration requests state
  const [registrationRequests, setRegistrationRequests, registrationLoaded] = useFirebaseState<RegistrationRequest[]>('db-registration-requests', []);

  // Simulated student mailbox communications
  const [simulatedEmails, setSimulatedEmails, emailsLoaded] = useFirebaseState<SimulatedEmail[]>('db-simulated-emails', []);

  // Student batches published by admin/sub-admin
  const [batches, setBatches, batchesLoaded] = useFirebaseState<StudentBatch[]>('db-batches', INITIAL_BATCHES);

  // Student courses published by admin/sub-admin
  const [courses, setCourses, coursesLoaded] = useFirebaseState<Course[]>('db-courses', INITIAL_COURSES);

  const isDataLoaded = usersLoaded && schedulesLoaded && progressLoaded && notificationsLoaded && 
                       backupsLoaded && registrationLoaded && emailsLoaded && batchesLoaded && coursesLoaded;

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'enrollments' | 'schedule' | 'progress' | 'reports' | 'backup' | 'inbox' | 'profile'>('dashboard');

  // Control individual show variables inside ScheduleManager from the main sidebar
  const [scheduleShowAddForm, setScheduleShowAddForm] = useState(false);
  const [scheduleShowBatchManager, setScheduleShowBatchManager] = useState(false);
  const [scheduleShowCourseDashboard, setScheduleShowCourseDashboard] = useState(false);

  useEffect(() => {
    if (activeTab !== 'schedule') {
      setScheduleShowAddForm(false);
      setScheduleShowBatchManager(false);
      setScheduleShowCourseDashboard(false);
    }
  }, [activeTab]);

  // Security Session Activity Auto-Logout
  const AUTO_LOGOUT_TIME_MS = 15 * 60 * 1000; // 15 mins of inactivity
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentUser) return;
    
    // Auto logout timer check
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > AUTO_LOGOUT_TIME_MS) {
        handleLogout('Your session expired due to inactivity. For your security, you have been logged out.');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Throttle the state update to avoid overwhelming renders
    let throttleTimeout: NodeJS.Timeout | null = null;
    const updateActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          lastActivityRef.current = Date.now();
          throttleTimeout = null;
        }, 5000); // only update at most once every 5 seconds
      }
    };
    
    // Listen to standard interaction events
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [currentUser]);

  // Sidebar expand/collapse and hover active state checks
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [ignoreHover, setIgnoreHover] = useState<boolean>(false);

  // Onboarding screens and fast registration workflow states
  const [onboardingTab, setOnboardingTab] = useState<'fastReg' | 'authLogin' | 'adminLogin'>('authLogin');
  const [currentRegStep, setCurrentRegStep] = useState<number>(1);
  const [showPortal, setShowPortal] = useState<boolean>(false);
  const [fastFirstName, setFastFirstName] = useState('');
  const [fastLastName, setFastLastName] = useState('');
  const [fastEmail, setFastEmail] = useState('');
  const [fastPhone, setFastPhone] = useState('');
  const [fastInstructorId, setFastInstructorId] = useState('');
  const [fastFatherName, setFastFatherName] = useState('');
  const [fastAddress, setFastAddress] = useState('');
  const [fastCourse, setFastCourse] = useState('');


  const [fastFirstNameError, setFastFirstNameError] = useState('');
  const [fastLastNameError, setFastLastNameError] = useState('');
  const [fastEmailError, setFastEmailError] = useState('');
  const [fastGenderError, setFastGenderError] = useState('');
  const [fastDobError, setFastDobError] = useState('');
  const [fastFatherNameError, setFastFatherNameError] = useState('');
  const [fastAddressError, setFastAddressError] = useState('');
  const [fastLastQualificationError, setFastLastQualificationError] = useState('');
  const [fastCourseError, setFastCourseError] = useState('');
  const [fastLastQualification, setFastLastQualification] = useState('');
  const [lastQualificationCategory, setLastQualificationCategory] = useState('');
  const [schoolClassInput, setSchoolClassInput] = useState('');
  const [collegeDegreeInput, setCollegeDegreeInput] = useState('');

  useEffect(() => {
    if (lastQualificationCategory === 'school') {
      setFastLastQualification(schoolClassInput ? `School (Class: ${schoolClassInput})` : '');
    } else if (lastQualificationCategory === 'college') {
      setFastLastQualification(collegeDegreeInput ? `College (Degree: ${collegeDegreeInput})` : '');
    } else {
      setFastLastQualification('');
    }
  }, [lastQualificationCategory, schoolClassInput, collegeDegreeInput]);

  const [fastGender, setFastGender] = useState('');
  const [fastDob, setFastDob] = useState('');
  const [fastAvatarUrl, setFastAvatarUrl] = useState('');
  const [fastAvatarError, setFastAvatarError] = useState('');

  // Phone country verification states
  const [fastPhonePrefix, setFastPhonePrefix] = useState('+91');
  const [fastPhoneError, setFastPhoneError] = useState('');

  // Firebase Verification States - bypassed by user request
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerState, setPhoneVerState] = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle');
  const [emailVerState, setEmailVerState] = useState<'idle' | 'sending' | 'sent' | 'verifying'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleSendEmailOtp = async () => {
    if (!fastEmail || !/\S+@\S+\.\S+/.test(fastEmail)) {
      setFastEmailError("Enter a valid email first");
      return;
    }
    setFastEmailError("");
    setEmailVerState('sending');
    
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fastEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      
      setEmailVerState('sent');
    } catch (err: any) {
      setEmailVerState('idle');
      setFastEmailError(err.message || 'Error communicating with server');
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setFastEmailError('Enter the 6-digit code');
      return;
    }
    
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fastEmail, code: otpCode })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }
      
      setEmailVerified(true);
      setEmailVerState('idle');
      setFastEmailError('');
    } catch (err: any) {
      setFastEmailError(err.message || 'Invalid OTP');
    }
  };

  const [fastRegSuccess, setFastRegSuccess] = useState<RegistrationRequest | null>(null);



  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Login Security / Rate Limiting
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Forgot Password modal level states
  const [forgotEmailModalOpen, setForgotEmailModalOpen] = useState(false);
  const [forgotEmailInput, setForgotEmailInput] = useState('');
  const [forgotModalSuccess, setForgotModalSuccess] = useState('');
  const [forgotModalError, setForgotModalError] = useState('');

  const [mailSearchEmail, setMailSearchEmail] = useState('');
  const [activeMailboxEmail, setActiveMailboxEmail] = useState<string | null>(null);
  const [showMailbox, setShowMailbox] = useState(false);
  const [selectedMail, setSelectedMail] = useState<SimulatedEmail | null>(null);



  // Push notifications toast overlay state
  const [toastAlert, setToastAlert] = useState<AppNotification | null>(null);

  // Synchronize state of currently logged-in user with active database records or invalidate if deleted
  useEffect(() => {
    if (currentUser && currentUser.id !== 'admin-1') {
      const dbUser = users.find(u => u.id === currentUser.id);
      if (!dbUser) {
        setCurrentUser(null);
      } else if (JSON.stringify(dbUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(dbUser);
      }
    }
  }, [users, currentUser]);

  // Firebase Verification Logic
  const handleSendPhoneOTP = async () => {
    if (!fastPhone) {
      setFastPhoneError("Please enter phone number first.");
      return;
    }
    setPhoneVerState('sending');
    setFastPhoneError('');
    try {
      const calculatedPhone = `${fastPhonePrefix}${fastPhone}`;
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible'
        });
      }
      const result = await signInWithPhoneNumber(auth, calculatedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setPhoneVerState('sent');
      triggerToast({ id: generateUniqueId('notif'), title: 'Verification', message: 'SMS verification code sent.', timestamp: new Date().toISOString(), read: false, type: 'general', channel: 'system' });
    } catch (error: any) {
      console.error(error);
      setPhoneVerState('error');
      setFastPhoneError(error.message || 'Error sending OTP');
      if (window.recaptchaVerifier) {
         window.recaptchaVerifier.clear();
         window.recaptchaVerifier = null;
      }
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || !confirmationResult) return;
    setPhoneVerState('verifying');
    setFastPhoneError('');
    try {
      await confirmationResult.confirm(otpCode);
      setPhoneVerified(true);
      setPhoneVerState('verified');
      triggerToast({ id: generateUniqueId('notif'), title: 'Verification', message: 'Phone number verified successfully.', timestamp: new Date().toISOString(), read: false, type: 'general', channel: 'system' });
    } catch (error: any) {
      console.error(error);
      setPhoneVerState('error');
      setFastPhoneError(error.message || 'Invalid OTP code');
    }
  };

  const handleSendEmailLink = async () => {
     if (!fastEmail) {
       setFastEmailError("Please enter email first.");
       return;
     }
     setEmailVerState('sending');
     setFastEmailError('');
     try {
        const tempPass = generateUniqueId('pwd');
        const userCredential = await createUserWithEmailAndPassword(auth, fastEmail, tempPass);
        await sendEmailVerification(userCredential.user);
        setEmailVerState('sent');
        triggerToast({ id: generateUniqueId('notif'), title: 'Verification', message: 'Verification link sent to email.', timestamp: new Date().toISOString(), read: false, type: 'general', channel: 'system' });
     } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
           setFastEmailError('Email involves an existing Firebase account.');
        } else {
           setFastEmailError(error.message || 'Error sending email verification');
        }
        setEmailVerState('error');
     }
  };

  const handleCheckEmailVerified = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      setEmailVerified(true);
      setEmailVerState('verified');
      triggerToast({ id: generateUniqueId('notif'), title: 'Verification', message: 'Email address verified successfully.', timestamp: new Date().toISOString(), read: false, type: 'general', channel: 'system' });
    } else {
      setFastEmailError('Email is not verified yet. Please check your inbox.');
    }
  };

  // Push Notice trigger helper
  const triggerToast = (n: AppNotification) => {
    setToastAlert(n);
    setTimeout(() => {
      setToastAlert(null);
    }, 4500);
  };

  // Update Profile details or password handler
  const handleUpdateProfile = (updatedUser: UserAccount) => {
    // 1. Update active current user state if current user is the one updated
    if (currentUser && updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
    
    // 2. Update the user account in our central databases
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  // State modification Handlers
  const handleAddStudent = (studentData: Omit<UserAccount, 'id' | 'joinedDate'>) => {
    const generatedUsername = studentData.username || `stu_${studentData.name.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(100 + Math.random() * 900)}`;
    const generatedPassword = studentData.password || `pass_${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudent: UserAccount = {
      ...studentData,
      id: generateUniqueId('student'),
      joinedDate: new Date().toLocaleDateString('en-US'),
      username: generatedUsername,
      password: generatedPassword,
      avatarUrl: studentData.avatarUrl || `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1517841905240-472988babdf9', '1492562080023-ab3db95bfbce'][Math.floor(Math.random() * 4)]}?w=150`,
    };

    setUsers(prev => [...prev, newStudent]);

    // Send Simulated Welcome/Login Credentials Email to the student
    const welcomeEmail: SimulatedEmail = {
      id: generateUniqueId('mail'),
      to: newStudent.email,
      from: 'admissions@learnora.edu',
      subject: 'Welcome to Learnora! - Access Credentials & Quick Start',
      body: `Dear ${newStudent.name},\n\nWelcome to Learnora Institute! An administrator has manually created and registered your student profile in our directory.\n\nYour profile is now active and ready for scheduling course timetables, joining live classes, or working with your assigned coach.\n\nPlease find your secure system access credentials below:\n\n-----------------------------\nUSERNAME: ${generatedUsername}\nPASSWORD: ${generatedPassword}\n-----------------------------\n\nYou can use these credentials to sign in directly from the login tab. Keep this information confidential and do not share it with other students.\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`,
      timestamp: new Date().toISOString()
    };

    setSimulatedEmails(prev => [welcomeEmail, ...prev]);

    // System Notification Action
    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Student Account Registered',
      message: `Successful registration folder instantiated for ${newStudent.name}. Profile active and welcome email dispatched.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddInstructor = (instructorData: Omit<UserAccount, 'id' | 'joinedDate'>) => {
    const newInstructor: UserAccount = {
      ...instructorData,
      id: generateUniqueId('instructor'),
      joinedDate: new Date().toLocaleDateString('en-US'),
      role: 'instructor'
    };
    setUsers(prev => [...prev, newInstructor]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Instructor Account Created',
      message: `New Instructor account configured for ${newInstructor.name} (${newInstructor.specialization || 'General'}). Credentialed access is active.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddSubAdmin = (subAdminData: Omit<UserAccount, 'id' | 'joinedDate'>) => {
    const newSubAdmin: UserAccount = {
      ...subAdminData,
      id: generateUniqueId('subadmin'),
      joinedDate: new Date().toLocaleDateString('en-US'),
      role: 'sub-admin'
    };
    setUsers(prev => [...prev, newSubAdmin]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Sub-Admin Account Created',
      message: `New Sub-Admin account configured for ${newSubAdmin.name}. Professional access is granted.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleRemoveStudent = (studentId: string) => {
    setUsers(prev => prev.filter(u => u.id !== studentId));
    // Remove student enrollment from other schedules
    setSchedules(prev => prev.map(s => ({
      ...s,
      enrolledStudentIds: s.enrolledStudentIds.filter(id => id !== studentId)
    })));
    if (currentUser && currentUser.id === studentId) {
      setCurrentUser(null);
    }
  };

  const handleRemoveInstructor = (instructorId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.role === 'student' && u.assignedInstructorId === instructorId) {
        return { ...u, assignedInstructorId: undefined };
      }
      return u;
    }).filter(u => u.id !== instructorId));
    setSchedules(prev => prev.map(s => s.instructorId === instructorId ? { ...s, instructorId: '' } : s));
    if (currentUser && currentUser.id === instructorId) {
      setCurrentUser(null);
    }
  };

  const handleRemoveSubAdmin = (subAdminId: string) => {
    setUsers(prev => prev.filter(u => u.id !== subAdminId));
    if (currentUser && currentUser.id === subAdminId) {
      setCurrentUser(null);
    }
  };

  const handleEnrollStudentInClass = (studentId: string, classId: string) => {
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    setSchedules(prev => prev.map(cl => {
      if (cl.id === classId) {
        if (cl.enrolledStudentIds.includes(studentId)) return cl;
        return {
          ...cl,
          enrolledStudentIds: [...cl.enrolledStudentIds, studentId]
        };
      }
      return cl;
    }));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Student Added to Class Roll',
      message: `${student.name} is now registered in session. Syllabus curriculum synchronized correctly.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddClass = (classData: Omit<ClassSchedule, 'id' | 'enrolledStudentIds'>) => {
    const newClass: ClassSchedule = {
      ...classData,
      id: generateUniqueId('class'),
      enrolledStudentIds: []
    };
    setSchedules(prev => [...prev, newClass]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Lesson Schedule Live',
      message: `"${newClass.title}" (${newClass.subject}) added to active syllabus by ${newClass.instructorName}. Reserve slots now.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddBatch = (newBatch: Omit<StudentBatch, 'id' | 'createdDate'>) => {
    const batch: StudentBatch = {
      ...newBatch,
      id: generateUniqueId('batch'),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setBatches(prev => [...prev, batch]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'New Student Batch Published',
      message: `Batch "${batch.name}" has been registered and published to the live class scheduler.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleDeleteBatch = (batchId: string) => {
    const batchToDelete = batches.find(b => b.id === batchId);
    if (!batchToDelete) return;

    setBatches(prev => prev.filter(b => b.id !== batchId));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Student Batch Unregistered',
      message: `Batch "${batchToDelete.name}" has been removed from active cohorts.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddCourse = (newCourse: Omit<Course, 'id' | 'createdDate'>) => {
    const course: Course = {
      ...newCourse,
      id: generateUniqueId('course'),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setCourses(prev => [...prev, course]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'New Course Registered & Published',
      message: `Course "${course.name}" (${course.code}) has been successfully registered and is now available.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Course Updated',
      message: `Course "${updatedCourse.name}" (${updatedCourse.code}) has been successfully updated.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleDeleteCourse = (courseId: string) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    if (!courseToDelete) return;

    setCourses(prev => prev.filter(c => c.id !== courseId));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Course Decommissioned',
      message: `Course "${courseToDelete.name}" has been decommissioned from active directories.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleUpdateClassStatus = (classId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    setSchedules(prev => prev.map(cl => {
      if (cl.id === classId) {
        return { ...cl, status };
      }
      return cl;
    }));

    // Raise real notification trigger on completes
    if (status === 'completed' || status === 'cancelled') {
      const cls = schedules.find(c => c.id === classId);
      if (cls) {
        const notif: AppNotification = {
          id: generateUniqueId('notif'),
          title: `Class Session ${status.toUpperCase()}`,
          message: `The session "${cls.title}" was updated to ${status}. All attendance indices saved.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'general',
          channel: 'system'
        };
        setNotifications(prev => [notif, ...prev]);
        triggerToast(notif);
      }
    }
  };

  const handleSelfEnroll = (classId: string) => {
    if (!currentUser) return;
    setSchedules(prev => prev.map(cl => {
      if (cl.id === classId) {
        if (cl.enrolledStudentIds.includes(currentUser.id)) return cl;
        return {
          ...cl,
          enrolledStudentIds: [...cl.enrolledStudentIds, currentUser.id]
        };
      }
      return cl;
    }));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Self-Enrollment Approved',
      message: `You successfully self-registered into the course session. Timetable logged!`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'email'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleAddProgressRecord = (recordData: Omit<ProgressRecord, 'id' | 'evaluationDate' | 'instructorId' | 'instructorName'>) => {
    const newRecord: ProgressRecord = {
      ...recordData,
      id: generateUniqueId('progress'),
      evaluationDate: new Date().toISOString().slice(0, 10),
      instructorId: currentUser?.id || 'admin-1',
      instructorName: currentUser?.name || 'Center Administrator'
    };
    setProgressRecords(prev => [newRecord, ...prev]);

    // Send push trigger immediately
    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Academic Score Evaluated',
      message: `Evaluated score of ${newRecord.score}% added for ${newRecord.studentName} in "${newRecord.className}".`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'grade',
      channel: 'push'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleTriggerBackup = () => {
    const timestamp = new Date().toISOString();
    const newBackup: BackupHistory = {
      id: generateUniqueId('backup'),
      timestamp,
      fileName: `coaching_backup_${timestamp.slice(0, 10).replace(/-/g, '')}_manual.json`,
      fileSize: `${(Math.random() * 2 + 3).toFixed(2)} KB`,
      recordCount: {
        students: users.filter(u => u.role === 'student').length,
        instructors: users.filter(u => u.role === 'instructor').length,
        classes: schedules.length,
        progress: progressRecords.length
      },
      status: 'success'
    };
    setBackupHistory(prev => [newBackup, ...prev]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Durable Cloud Backup Complete',
      message: 'Secure cloud databases backup succeeded. All active academic ledger databases synced safely in external bucket.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleRestoreState = (newState: { students: UserAccount[]; schedules: ClassSchedule[]; progress: ProgressRecord[] }) => {
    setUsers(prev => {
      // Retain current administrators and instructors, pull only students
      return [
        ...prev.filter(u => u.role !== 'student'),
        ...newState.students
      ];
    });
    setSchedules(newState.schedules);
    setProgressRecords(newState.progress);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Cloud State Reinstated',
      message: 'Successfully validated and restored student databases registry. Registers synchronized.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleTriggerTestNotification = (type: 'reminder' | 'grade' | 'enrollment') => {
    let title = 'Test Warning';
    let message = 'This is testing simulated events pipeline.';
    if (type === 'reminder') {
      title = 'Automated Reminder Dispatched';
      message = 'Simulated cron system transmitted WhatsApp and email reminder transcripts to students.';
    } else if (type === 'grade') {
      title = 'Dynamic Goal Progress Alert';
      message = 'Jordan achieved high scores. Automated milestone alert and certificate transcript created.';
    } else if (type === 'enrollment') {
      title = 'Student Admitted';
      message = 'Administrative registry updated student enrollments folder in high-perf fileserver.';
    }

    const testNotif: AppNotification = {
      id: generateUniqueId('test'),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      channel: type === 'reminder' ? 'email' : 'push'
    };
    setNotifications(prev => [testNotif, ...prev]);
    triggerToast(testNotif);
  };



  const handleCreateRegistrationRequest = (
    name: string, 
    email: string, 
    phone?: string, 
    instructorId?: string,
    fatherName?: string,
    fatherPhone?: string,
    address?: string,
    lastQualification?: string,
    gender?: string,
    dob?: string,
    avatarUrl?: string,
    course?: string
  ) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    
    // Auto-generate credentials
    const usernamePrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = `${usernamePrefix}_${randomNum}`;
    
    const titleName = cleanName.split(' ')[0] || 'Student';
    const password = `Learn@${titleName}${randomNum}`;
  
    const newRequest: RegistrationRequest = {
      id: generateUniqueId('req'),
      name: cleanName,
      email: cleanEmail,
      phone: phone?.trim() || undefined,
      status: 'pending',
      submittedDate: new Date().toLocaleDateString('en-US'),
      assignedInstructorId: instructorId || undefined,
      username,
      password,
      fatherName: fatherName?.trim() || undefined,
      fatherPhone: fatherPhone?.trim() || undefined,
      address: address?.trim() || undefined,
      lastQualification: lastQualification?.trim() || undefined,
      gender: gender?.trim() || undefined,
      dob: dob?.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      course: course
    };

    setRegistrationRequests(prev => [newRequest, ...prev]);

    // Send a system event notice to the logs
    const notif: AppNotification = {
      id: generateUniqueId('notif-req'),
      title: 'Admission Request Pending',
      message: `${cleanName} registered via fast student registration. Administrator approval required to release credentials.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);

    return newRequest;
  };

  const handleApproveRegistration = (requestId: string) => {
    const r = registrationRequests.find(req => req.id === requestId);
    if (!r || r.status !== 'pending') return;

    // Add user profile
    const newStudent: UserAccount = {
      id: generateUniqueId('student'),
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: 'student',
      joinedDate: new Date().toLocaleDateString('en-US'),
      assignedInstructorId: r.assignedInstructorId,
      username: r.username,
      password: r.password,
      avatarUrl: r.avatarUrl || `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1517841905240-472988babdf9', '1492562080023-ab3db95bfbce'][Math.floor(Math.random() * 4)]}?w=150`,
      fatherName: r.fatherName,
      fatherPhone: r.fatherPhone,
      address: r.address,
      lastQualification: r.lastQualification,
      gender: r.gender,
      dob: r.dob,
      batch: r.batch || 'Batch A',
      course: r.course
    };

    // Send simulated email
    const newEmail: SimulatedEmail = {
      id: generateUniqueId('mail'),
      to: r.email,
      from: 'admissions@learnora.edu',
      subject: 'Learnora Enrollment Accepted! - Your Credentials Enclosed',
      body: `Dear ${r.name},\n\nWe are absolutely delighted to inform you that your Enrollment & Fast Student Registration Request has been reviewed and APPROVED by our Administration panel!\n\nYour profile has been fully instantiated into our student information database. You can now log in using the newly auto-generated security credentials enclosed below:\n\n-----------------------------\nUSERNAME: ${r.username}\nPASSWORD: ${r.password}\n-----------------------------\n\nPlease keep these credentials secure. Once signed in, you will be able to enroll into classes, audit tutor feedback records, and track your ongoing learning achievements.\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`,
      timestamp: new Date().toISOString()
    };

    // Trigger Notification
    const notif: AppNotification = {
      id: generateUniqueId('notif-appr'),
      title: 'Admissions Request Accepted',
      message: `Student account created for ${r.name}. Security credentials dispatched via simulated mail.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };

    setUsers(u => [...u, newStudent]);
    setSimulatedEmails(m => [newEmail, ...m]);
    setNotifications(n => [notif, ...n]);
    triggerToast(notif);

    setRegistrationRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'approved' };
      }
      return req;
    }));
  };

  const handleRejectRegistration = (requestId: string) => {
    const r = registrationRequests.find(req => req.id === requestId);
    if (!r || r.status !== 'pending') return;

    // Send simulated email
    const newEmail: SimulatedEmail = {
      id: generateUniqueId('mail'),
      to: r.email,
      from: 'admissions@learnora.edu',
      subject: 'Learnora Registration Status Update',
      body: `Dear ${r.name},\n\nThank you for submitting your Fast Student Registration Request with Learnora.\n\nAfter reviewing your application coordinates, we regret to inform you that our classes are currently at maximum capacity, and we cannot approve your enrollment at this time.\n\nWe have retained your interest profile on our priority waiting list. Should seats open up in upcoming sessions, we will reach out immediately.\n\nBest regards,\nCenter Administration,\nLearnora Institute`,
      timestamp: new Date().toISOString()
    };

    setSimulatedEmails(m => [newEmail, ...m]);

    setRegistrationRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'rejected' };
      }
      return req;
    }));
  };

  const handleSendEmail = (toEmail: string, subject: string, body: string, fromOverride?: string) => {
    const senderEmail = fromOverride || (currentUser ? currentUser.email : 'anik.baidya@hotmail.com');
    const newEmail: SimulatedEmail = {
      id: generateUniqueId('mail'),
      to: toEmail,
      from: senderEmail,
      subject: subject,
      body: body,
      timestamp: new Date().toISOString()
    };

    setSimulatedEmails(prev => [newEmail, ...prev]);

    // If the recipient is indeed in our system, let's trigger a push notice
    const targetUser = users.find(u => u.email.toLowerCase() === toEmail.toLowerCase());
    if (targetUser) {
      const displaySenderName = fromOverride ? "System Security Dispatch" : (currentUser ? currentUser.name : "System Security Dispatch");
      const notif: AppNotification = {
        id: generateUniqueId('notif-mail'),
        title: `New Message Delivered`,
        message: `Simulated mail from ${displaySenderName} dispatched to ${targetUser.name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'reminder',
        channel: 'email'
      };
      setNotifications(n => [notif, ...n]);
      triggerToast(notif);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      let err = false;
      setFastFirstNameError('');
      setFastLastNameError('');
      setFastCourseError('');
      setFastAvatarError('');

      if (!fastFirstName.trim()) {
        setFastFirstNameError('First name is required');
        err = true;
      }
      if (!fastLastName.trim()) {
        setFastLastNameError('Last name is required');
        err = true;
      }
      if (!fastCourse) {
        setFastCourseError('Please select a course program');
        err = true;
      }
      if (fastAvatarError) {
        err = true;
      } else if (!fastAvatarUrl) {
        setFastAvatarError('Please upload a profile photo under 2MB');
        err = true;
      }
      return !err;
    }

    if (step === 2) {
      let err = false;
      setFastEmailError('');
      setFastPhoneError('');
      setFastGenderError('');
      setFastDobError('');

      if (!fastEmail.trim()) {
        setFastEmailError('Email address is required');
        err = true;
      } else if (!/\S+@\S+\.\S+/.test(fastEmail)) {
        setFastEmailError('Please enter a valid email address');
        err = true;
      } else if (!emailVerified) {
        setFastEmailError('Please verify your email address via OTP');
        err = true;
      }

      if (!fastPhone) {
        setFastPhoneError('Phone number is required');
        err = true;
      } else {
        const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === fastPhonePrefix);
        const reqLen = config ? config.length : 10;
        if (fastPhone.length !== reqLen) {
          setFastPhoneError(`Phone number must be exactly ${reqLen} digits for ${fastPhonePrefix}`);
          err = true;
        }
      }

      if (!fastGender) {
        setFastGenderError('Gender selection is required');
        err = true;
      }

      if (!fastDob) {
        setFastDobError('Date of birth is required');
        err = true;
      }

      return !err;
    }

    return true;
  };

  const handleFastStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset all errors
    setFastFirstNameError('');
    setFastLastNameError('');
    setFastEmailError('');
    setFastGenderError('');
    setFastDobError('');
    setFastFatherNameError('');
    setFastLastQualificationError('');
    setFastPhoneError('');
    setFastAddressError('');

    let hasError = false;

    // Check Name
    if (!fastFirstName.trim()) {
      setFastFirstNameError('First name is required');
      hasError = true;
    }
    if (!fastLastName.trim()) {
      setFastLastNameError('Last name is required');
      hasError = true;
    }

    // Check Email
    if (!fastEmail.trim()) {
      setFastEmailError('Email address is required');
      hasError = true;
    }

    // Check Gender
    if (!fastGender) {
      setFastGenderError('Gender selection is required');
      hasError = true;
    }

    // Check Date of Birth
    if (!fastDob) {
      setFastDobError('Date of birth is required');
      hasError = true;
    }

    // Check Course
    if (!fastCourse) {
      setFastCourseError('Desired course selection is required');
      hasError = true;
    } else {
      setFastCourseError('');
    }

    // Check Father Name
    if (!fastFatherName.trim()) {
      setFastFatherNameError("Father's name is required");
      hasError = true;
    }

    // Check Last Qualification
    if (!lastQualificationCategory) {
      setFastLastQualificationError('Please select if your last qualification was School or College');
      hasError = true;
    } else if (lastQualificationCategory === 'school' && !schoolClassInput.trim()) {
      setFastLastQualificationError('Please select your class');
      hasError = true;
    } else if (lastQualificationCategory === 'college' && !collegeDegreeInput.trim()) {
      setFastLastQualificationError('Please specify your degree name');
      hasError = true;
    }



    // Check profile photo (mandatory + size limit check)
    if (fastAvatarError) {
      hasError = true;
    } else if (!fastAvatarUrl) {
      setFastAvatarError("photo size more then 2mb please upload photo under 2mb");
      hasError = true;
    }

    // Check Phone number length
    if (!fastPhone) {
      setFastPhoneError("Phone number is required");
      hasError = true;
    } else {
      const config = COUNTRY_PHONE_CONFIGS.find(c => c.code === fastPhonePrefix);
      const reqLen = config ? config.length : 10;
      if (fastPhone.length !== reqLen) {
        setFastPhoneError(`Phone number must be exactly ${reqLen} digits for ${fastPhonePrefix}`);
        hasError = true;
      }
    }

    // Check Full Address
    if (!fastAddress.trim()) {
      setFastAddressError('Full resident address is required');
      hasError = true;
    } else {
      setFastAddressError('');
    }

    if (hasError) {
      return;
    }

    const calculatedPhone = `${fastPhonePrefix} ${fastPhone}`;
    const assembledAddress = fastAddress.trim();

    const req = handleCreateRegistrationRequest(
      `${fastFirstName.trim()} ${fastLastName.trim()}`, 
      fastEmail, 
      calculatedPhone, 
      fastInstructorId,
      fastFatherName,
      undefined, // fatherPhone removed
      assembledAddress,
      fastLastQualification,
      fastGender,
      fastDob,
      fastAvatarUrl,
      fastCourse
    );
    setFastRegSuccess(req);
    
    // Reset form states
    setFastFirstName('');
    setFastLastName('');
    setFastEmail('');
    setFastPhone('');
    setFastPhonePrefix('+91');
    setFastPhoneError('');
    setFastInstructorId('');
    setFastFatherName('');
    setFastAddress('');
    setFastAddressError('');
    setFastCourse('');
    setFastCourseError('');
    


    setFastLastQualification('');
    setLastQualificationCategory('');
    setSchoolClassInput('');
    setCollegeDegreeInput('');
    setFastGender('');
    setFastDob('');
    setFastAvatarUrl('');
    setFastAvatarError('');
    setPhoneVerified(true);
    setEmailVerified(true);
    setPhoneVerState('idle');
    setEmailVerState('idle');
    setOtpCode('');
    setCurrentRegStep(1);
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setLoginError(`Terminal locked due to too many failed attempts. Please try again in ${Math.ceil((lockoutUntil - Date.now()) / 1000)} seconds.`);
      return;
    }
    
    setLoginError('');
    const matched = users.find(u => 
      u.username && u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
      u.password && u.password === loginPassword.trim()
    );
    if (matched) {
      setCurrentUser(matched);
      setLoginUsername('');
      setLoginPassword('');
      setLoginAttempts(0); // reset on success
    } else {
      const remainingAttempts = 4 - loginAttempts;
      if (remainingAttempts <= 0) {
        setLockoutUntil(Date.now() + 60000); // 1 minute lockout
        setLoginError('Too many failed attempts. Terminal locked for 60 seconds.');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(prev => prev + 1);
        setLoginError(`Invalid Username/Password. (${remainingAttempts} attempts remaining)`);
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setLoginError(`Terminal locked due to too many failed attempts. Please try again in ${Math.ceil((lockoutUntil - Date.now()) / 1000)} seconds.`);
      return;
    }

    setLoginError('');
    const matched = users.find(u => 
      u.username && u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
      u.password && u.password === loginPassword.trim()
    );
    if (matched) {
      if (matched.role === 'admin' || matched.role === 'sub-admin') {
        setCurrentUser(matched);
        setLoginUsername('');
        setLoginPassword('');
        setLoginAttempts(0);
      } else {
        setLoginError('Access Denied. This terminal is restricted to Administrator and Sub-Admin roles only.');
      }
    } else {
      const remainingAttempts = 4 - loginAttempts;
      if (remainingAttempts <= 0) {
        setLockoutUntil(Date.now() + 60000); // 1 minute lockout
        setLoginError('Too many failed attempts. Admin terminal locked for 60 seconds.');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(prev => prev + 1);
        setLoginError(`Invalid Administrator or Sub-Admin credentials. (${remainingAttempts} attempts remaining)`);
      }
    }
  };

  const handleLogout = (message?: string) => {
    setCurrentUser(null);
    if (message) {
      triggerToast({
        id: `notif-logout-${Date.now()}`,
        title: 'Session Ended',
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'push'
      });
    }
  };

  const isActuallyCollapsed = isSidebarCollapsed && !(isSidebarHovered && !ignoreHover);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070708] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-white/10 border-t-amber-500 animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-gray-500 text-center">
            Synchronizing with<br />Live Database
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF3F5] via-[#FFF8F9] to-[#FFFBFB] text-slate-800 dark:from-[#110D12] dark:via-[#160E14] dark:to-[#0A0A0B] dark:text-gray-200 transition-colors duration-300 font-sans">
      
      {/* Real-time Toast Popups */}
      <AnimatePresence>
        {toastAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full bg-[#161618] border border-amber-500/30 text-white p-4 rounded-2xl shadow-xl flex gap-3.5"
          >
            <Smartphone className="w-5 h-5 text-amber-500 mt-0.5 animate-bounce flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold font-sans tracking-wide text-amber-500 uppercase">PUSH ALERT: {toastAlert.title}</p>
              <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">{toastAlert.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Email Pop-up Modal */}
      <AnimatePresence>
        {showMailbox && activeMailboxEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-[#0F0F11]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif italic text-slate-900 dark:text-white font-bold">Inbox Simulator</h3>
                    <p className="text-xs text-amber-500 font-semibold font-mono">{activeMailboxEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMailbox(false);
                    setSelectedMail(null);
                  }}
                  className="p-1 px-3.5 rounded-lg bg-red-700 hover:bg-red-800 text-xs text-white shadow-sm border border-red-800 cursor-pointer font-bold transition active:scale-95"
                >
                  Close Mailbox
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-5 min-h-[350px]">
                {selectedMail ? (
                  /* Single Email Read View */
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMail(null)}
                      className="text-xs text-amber-500 hover:underline flex items-center gap-1 mb-2 font-bold cursor-pointer"
                    >
                      &larr; Back to Inbox List
                    </button>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border dark:border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs border-b dark:border-white/5 pb-2 font-mono">
                        <p><span className="text-slate-400">From:</span> <b className="text-amber-500">{selectedMail.from}</b></p>
                        <p className="text-slate-400">{new Date(selectedMail.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-xs font-mono"><span className="text-slate-400 font-sans">To:</span> {selectedMail.to}</p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">{selectedMail.subject}</h4>
                    </div>
                    <div className="p-5 rounded-2xl border dark:border-white/5 bg-slate-50 dark:bg-[#0A0A0B] whitespace-pre-line text-xs leading-relaxed text-slate-800 dark:text-gray-300 font-sans border-l-2 border-l-amber-500">
                      {selectedMail.body}
                    </div>
                  </div>
                ) : (
                  /* Emails List View */
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Simulated Inbound Transmissions ({simulatedEmails.filter(m => m.to.toLowerCase() === activeMailboxEmail.toLowerCase()).length})</p>
                    {simulatedEmails.filter(m => m.to.toLowerCase() === activeMailboxEmail.toLowerCase()).length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-gray-500 font-mono text-xs">
                        No emails detected in this sandbox ledger yet.<br />
                        <span className="text-[11px] block mt-2.5 text-amber-500 font-bold bg-amber-500/5 p-3 rounded-xl max-w-sm mx-auto border border-amber-500/10">
                          If you submitted an application, switch simulator profile to Admin (Anik Baidya) on the landing page, open Student Profiles, and approve it.
                        </span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {simulatedEmails
                          .filter(m => m.to.toLowerCase() === activeMailboxEmail.toLowerCase())
                          .map(mail => (
                            <button
                              key={mail.id}
                              type="button"
                              onClick={() => setSelectedMail(mail)}
                              className="w-full text-left py-3.5 px-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 flex flex-col gap-1 transition block border border-transparent hover:border-slate-150 dark:hover:border-white/5 cursor-pointer"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-[10px] text-amber-500 font-bold">{mail.from}</span>
                                <span className="text-[10px] text-slate-400">{new Date(mail.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate">{mail.subject}</p>
                              <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate leading-none mt-1">{mail.body.substring(0, 90)}...</p>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentUser ? (
        showPortal ? (
          /* Dynamic Role-Based Sandbox Access & Create Account Page */
          <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 bg-[#cfd1d4] dark:bg-[#0A0A0B] dark:text-gray-200 animate-fadeIn font-sans z-0">
            {/* Background Blob - Orange/Peach top right */}
            <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-bl from-[#ff7a45] via-[#ff9a5e] to-transparent opacity-60 dark:opacity-20 blur-[100px] md:blur-[140px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten z-0" />
            
            {/* Background Blob - Light blue bottom left */}
            <div className="absolute bottom-[-20%] left-[-10%] w-[70vw] h-[70vw] md:w-[50vw] md:h-[50vw] rounded-full bg-gradient-to-tr from-[#8ab4f8] via-[#a8c7fa] to-transparent opacity-50 dark:opacity-15 blur-[100px] md:blur-[140px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten z-0" />

            <div className={`w-full bg-white/80 backdrop-blur-xl dark:bg-[#0F0F11]/90 border border-white/40 dark:border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 z-10 ${
              onboardingTab === 'fastReg' ? 'max-w-2xl' : 'max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch'
            }`}>

              
              {/* Ambient branding ornament */}
              <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full pointer-events-none" />

              {/* Standalone Header for Admission form when Left column is hidden */}
              {onboardingTab === 'fastReg' && (
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block scale-90 origin-left text-slate-800">
                       <Logo size="sm" withStrapline={false} />
                    </div>
                    <span className="sm:hidden font-mono uppercase tracking-widest text-black dark:text-gray-300 font-bold text-xs mt-1">Learnora</span>
                    <h1 className="text-lg font-serif italic text-slate-600 dark:text-gray-400 font-semibold tracking-tight ml-2 border-l border-amber-500/20 pl-3">Admissions</h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPortal(false)}
                    className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 p-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm"
                  >
                    ← Back To Home
                  </button>
                </div>
              )}

              {/* Left section: Sandbox switch, quick profiles accounts, and student mail client */}
              {onboardingTab !== 'fastReg' && (
                <div className="md:col-span-12 lg:col-span-5 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-slate-800 mb-2 origin-left scale-90 sm:scale-100">
                        <Logo size="md" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPortal(false)}
                        className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 hover:text-amber-500 transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 p-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm"
                      >
                        ← Back To Home
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 pr-2 leading-relaxed">
                      Interactive educational control center. Experience our multi-role workflows: student registers, administrators review/accept, and credentials dispatch automatically.
                    </p>
                  </div>

                  {/* Simulated Mail Client Mini-App */}
                  <div className="p-4 rounded-2xl bg-slate-500/5 dark:bg-[#161618] border border-slate-200 dark:border-white/5 space-y-3 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-duration-1000"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1.5">
                        📧 Student Mailbox Simulator
                      </p>
                    </div>
                    <p className="text-[10.5px] text-slate-500 dark:text-gray-400 leading-snug">
                      Inspect secure admissions emails containing login details. Type any registered email (e.g. <b>samantha.wilson@demo.com</b> or your newly registered email) and click Open.
                    </p>
                    
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        placeholder="student.email@demo.com"
                        value={mailSearchEmail}
                        onChange={(e) => setMailSearchEmail(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#0F0F11] border border-slate-250 dark:border-white/5 rounded-xl text-slate-900 dark:text-gray-200 focus:outline-none placeholder-slate-400 dark:placeholder-gray-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (mailSearchEmail.trim()) {
                            setActiveMailboxEmail(mailSearchEmail.trim().toLowerCase());
                            setShowMailbox(true);
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl text-xs transition cursor-pointer font-sans"
                      >
                        Open Mail
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Right section: Signup workspace and authentication */}
              <div className={onboardingTab === 'fastReg' ? 'w-full' : 'md:col-span-12 lg:col-span-7 bg-white dark:bg-[#111112] p-8 rounded-3xl border border-slate-150 dark:border-white/5 space-y-6 flex flex-col justify-start shadow-xl relative animate-fadeIn'}>
                <div className="absolute top-0 right-0 h-32 w-32 bg-radial-gradient from-amber-500/10 to-transparent rounded-full pointer-events-none" />
                
                {/* Onboarding Mode Selection Tabs */}
                {onboardingTab !== 'fastReg' && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 dark:bg-[#070708] rounded-2xl border border-slate-150 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => { setOnboardingTab('authLogin'); setLoginError(''); }}
                      className={`py-3 px-3 rounded-xl text-center font-bold text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                        onboardingTab === 'authLogin'
                          ? 'bg-white dark:bg-[#1C1C1E] text-amber-500 dark:text-amber-500 shadow-md border border-slate-100 dark:border-white/5 scale-[1.02]'
                          : 'text-slate-500 dark:text-gray-400 hover:text-amber-500 hover:bg-slate-50/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Approved Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOnboardingTab('adminLogin'); setLoginError(''); }}
                      className={`py-3 px-3 rounded-xl text-center font-bold text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                        onboardingTab === 'adminLogin'
                          ? 'bg-white dark:bg-[#1C1C1E] text-amber-500 dark:text-amber-500 shadow-md border border-slate-100 dark:border-white/5 scale-[1.02]'
                          : 'text-slate-500 dark:text-gray-400 hover:text-amber-500 hover:bg-slate-50/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin Sign In
                    </button>
                  </div>
                )}

                           {/* Form 1: Fast Student Registration */}
              {onboardingTab === 'fastReg' && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-serif italic text-amber-500 font-bold tracking-tight">Student Admission Portal</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Register to enter our coaching workflow. Administrators dynamically review queue requests, issue verified account records upon acceptance, and securely dispatch login details to your inbox.
                      </p>
                    </div>

                    {fastRegSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/20 space-y-4 text-xs text-slate-705 dark:text-emerald-400 shadow-inner"
                      >
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                          <span className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="w-4 h-4" />
                          </span>
                          <span>Admission Form Logged Successfully!</span>
                        </div>
                        <p className="leading-relaxed text-slate-650 dark:text-gray-300">
                          The admissions queue ticket for student <b className="text-slate-800 dark:text-white">{fastRegSuccess.name}</b> has been securely enqueued in the active admin ledger.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setFastRegSuccess(null);
                            setCurrentRegStep(1);
                          }}
                          className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer block transition-all"
                        >
                          Submit another fast onboarding request &rarr;
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        {/* Interactive Form Fields */}
                        <form onSubmit={handleFastStudentSubmit} className="space-y-6" noValidate>
                        
                          {/* Profile Photo Upload */}
                          <div className="space-y-2 p-4 bg-slate-50 dark:bg-[#080809] rounded-2xl border border-slate-200/60 dark:border-white/5">
                                <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Profile Photo Asset (Maximum 2MB) *</label>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                  {fastAvatarUrl ? (
                                    <div className="relative group/avatar">
                                      <img 
                                        src={fastAvatarUrl} 
                                        alt="Preview" 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-md transition-transform group-hover/avatar:scale-105"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFastAvatarUrl('');
                                          setFastAvatarError('');
                                        }}
                                        className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 transition shadow-md cursor-pointer active:scale-90"
                                        title="Remove Photo"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-inner">
                                      <Camera className="w-6 h-6 animate-pulse" />
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                                    <input
                                      type="file"
                                      id="fast-student-avatar-upload"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const limit = 2 * 1024 * 1024;
                                        if (file.size > limit) {
                                          setFastAvatarError("photo size more then 2mb please upload photo under 2mb");
                                          setFastAvatarUrl('');
                                          e.target.value = '';
                                          return;
                                        }
                                        setFastAvatarError('');
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setFastAvatarUrl(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="fast-student-avatar-upload"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 text-amber-950 text-xs font-extrabold rounded-xl border border-amber-500/20 hover:bg-amber-600 transition shadow-sm cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      {fastAvatarUrl ? 'Change Avatar Asset' : 'Upload Student Photo'}
                                    </label>
                                    <p className="text-[9.5px] text-slate-450 dark:text-gray-500 leading-snug">
                                      Supports JPEG, PNG, WebP format. Maximum file size budget: 2MB.
                                    </p>
                                    {fastAvatarError && (
                                      <p className="text-[10.5px] text-rose-500 dark:text-rose-455 font-bold leading-tight mt-1">
                                        {fastAvatarError}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Student Legal Name */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">First Name *</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                      <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Samuel"
                                      value={fastFirstName}
                                      onChange={e => {
                                        setFastFirstName(e.target.value);
                                        if (e.target.value.trim()) setFastFirstNameError('');
                                      }}
                                      className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastFirstNameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-850 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans`}
                                    />
                                  </div>
                                  {fastFirstNameError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastFirstNameError}</p>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Last Name *</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                      <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                    </div>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Wilson"
                                      value={fastLastName}
                                      onChange={e => {
                                        setFastLastName(e.target.value);
                                        if (e.target.value.trim()) setFastLastNameError('');
                                      }}
                                      className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastLastNameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-850 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans`}
                                    />
                                  </div>
                                  {fastLastNameError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastLastNameError}</p>
                                  )}
                                </div>
                              </div>

                              {/* Student Target Program Course Selection */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Desired Professional Course *</label>
                                <select
                                  required
                                  value={fastCourse}
                                  onChange={e => {
                                    setFastCourse(e.target.value);
                                    if (e.target.value) setFastCourseError('');
                                  }}
                                  className={`w-full px-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastCourseError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 transition-all font-sans`}
                                >
                                  <option value="">-- Select Course Program --</option>
                                  {courses.map(c => (
                                    <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
                                  ))}
                                </select>
                                {fastCourseError && (
                                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastCourseError}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email address */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Email Address *</label>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                          <Mail className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                        </div>
                                        <input
                                          type="email"
                                          required
                                          placeholder="sam@example.com"
                                          value={fastEmail}
                                          disabled={emailVerified}
                                          onChange={e => {
                                            setFastEmail(e.target.value);
                                            if (e.target.value.trim()) setFastEmailError('');
                                          }}
                                          className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastEmailError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans disabled:opacity-75 disabled:cursor-not-allowed`}
                                        />
                                      </div>
                                      {!emailVerified && (
                                        <button
                                          type="button"
                                          onClick={handleSendEmailOtp}
                                          disabled={emailVerState === 'sending' || emailVerState === 'sent'}
                                          className="px-4 bg-slate-800 dark:bg-amber-500 hover:bg-slate-900 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                                        >
                                          {emailVerState === 'sending' ? 'Sending...' : emailVerState === 'sent' ? 'Resend' : 'Send OTP'}
                                        </button>
                                      )}
                                    </div>
                                    {emailVerState === 'sent' && !emailVerified && (
                                      <div className="flex flex-col gap-2 animate-fadeIn">
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP"
                                            value={otpCode}
                                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="flex-1 px-3 py-3 text-xs font-mono tracking-widest bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 transition-all text-center"
                                          />
                                          <button
                                            type="button"
                                            onClick={handleVerifyEmailOtp}
                                            disabled={otpCode.length !== 6}
                                            className="px-6 bg-emerald-500 hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                                          >
                                            Verify
                                          </button>
                                        </div>
                                        <p className="text-[10px] text-amber-500 font-medium px-1">
                                          An OTP has been sent to your email. (Please set RESEND_API_KEY if not receiving)
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {emailVerified && (
                                    <p className="text-[10.5px] text-emerald-500 mt-1 font-bold flex items-center gap-1.5 animate-fadeIn">
                                      <Check className="w-3.5 h-3.5" /> Email successfully verified.
                                    </p>
                                  )}
                                  {fastEmailError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastEmailError}</p>
                                  )}
                                </div>

                                {/* Phone number */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Phone Number *</label>
                                  <div className="flex gap-2">
                                    <select
                                      value={fastPhonePrefix}
                                      onChange={e => {
                                        setFastPhonePrefix(e.target.value);
                                        setFastPhone('');
                                        setFastPhoneError('');
                                      }}
                                      className="px-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 font-sans"
                                    >
                                      {COUNTRY_PHONE_CONFIGS.map(c => (
                                        <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>
                                      ))}
                                    </select>
                                    <div className="relative flex-1">
                                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Smartphone className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                      </div>
                                      <input
                                        type="text"
                                        required
                                        placeholder={COUNTRY_PHONE_CONFIGS.find(c => c.code === fastPhonePrefix)?.placeholder || '9876543210'}
                                        value={fastPhone}
                                        maxLength={COUNTRY_PHONE_CONFIGS.find(c => c.code === fastPhonePrefix)?.length || 10}
                                        onChange={e => {
                                          const raw = e.target.value.replace(/\D/g, '');
                                          setFastPhone(raw);
                                          const len = COUNTRY_PHONE_CONFIGS.find(c => c.code === fastPhonePrefix)?.length || 10;
                                          if (!raw) {
                                            setFastPhoneError('Phone number is required');
                                          } else if (raw.length !== len) {
                                            setFastPhoneError(`Must be exactly ${len} digits`);
                                          } else {
                                            setFastPhoneError('');
                                          }
                                        }}
                                        className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastPhoneError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-mono`}
                                      />
                                    </div>
                                  </div>
                                  {fastPhoneError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastPhoneError}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Gender selection */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Gender *</label>
                                  <select
                                    required
                                    value={fastGender}
                                    onChange={e => {
                                      setFastGender(e.target.value);
                                      if (e.target.value) setFastGenderError('');
                                    }}
                                    className={`w-full px-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastGenderError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 transition-all font-sans`}
                                  >
                                    <option value="" disabled>Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-Binary">Non-Binary</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                  </select>
                                  {fastGenderError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastGenderError}</p>
                                  )}
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Date of Birth *</label>
                                  <input
                                    type="date"
                                    required
                                    value={fastDob}
                                    onChange={e => {
                                      setFastDob(e.target.value);
                                      if (e.target.value) setFastDobError('');
                                    }}
                                    className={`w-full px-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastDobError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 transition-all font-sans select-none`}
                                  />
                                  {fastDobError && (
                                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastDobError}</p>
                                  )}
                                </div>
                              </div>

                              {/* Father's name */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Father's Full Name *</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                  </div>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Arthur Wilson"
                                    value={fastFatherName}
                                    onChange={e => {
                                      setFastFatherName(e.target.value);
                                      if (e.target.value.trim()) setFastFatherNameError('');
                                    }}
                                    className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastFatherNameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans`}
                                  />
                                </div>
                                {fastFatherNameError && (
                                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastFatherNameError}</p>
                                )}
                              </div>

                              {/* Prior Academic background status */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Last Completed Qualification *</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLastQualificationCategory('school');
                                      setFastLastQualificationError('');
                                    }}
                                    className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                      lastQualificationCategory === 'school'
                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                                        : 'bg-slate-50 dark:bg-[#070708] border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <GraduationCap className="h-4 w-4" />
                                    Schooling
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLastQualificationCategory('college');
                                      setFastLastQualificationError('');
                                    }}
                                    className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                      lastQualificationCategory === 'college'
                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                                        : 'bg-slate-50 dark:bg-[#070708] border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <GraduationCap className="h-4 w-4" />
                                    College / University
                                  </button>
                                </div>

                                <AnimatePresence mode="wait">
                                  {lastQualificationCategory === 'school' && (
                                    <motion.div
                                      key="school-options"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="space-y-1 mt-1.5 overflow-hidden"
                                    >
                                      <label className="text-[9px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold">Standard Class Level *</label>
                                      <select
                                        required
                                        value={schoolClassInput}
                                        onChange={e => {
                                          setSchoolClassInput(e.target.value);
                                          setFastLastQualificationError('');
                                        }}
                                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#121214] rounded-lg border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-100 font-sans"
                                      >
                                        <option value="">-- Select Class --</option>
                                        <option value="Class 10 (Secondary)">Class 10 (Secondary)</option>
                                        <option value="Class 12 / Higher Secondary (10+2)">Class 12 / Higher Secondary (10+2)</option>
                                        <option value="Class 11">Class 11</option>
                                        <option value="Class 9">Class 9</option>
                                        <option value="Other Schooling">Other Schooling</option>
                                      </select>
                                    </motion.div>
                                  )}

                                  {lastQualificationCategory === 'college' && (
                                    <motion.div
                                      key="college-options"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="space-y-1 mt-1.5 overflow-hidden"
                                    >
                                      <label className="text-[9px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold">Degree / Specialization Name *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. BCA, B.Sc, B.Tech, MCA, B.Com"
                                        value={collegeDegreeInput}
                                        onChange={e => {
                                          setCollegeDegreeInput(e.target.value);
                                          setFastLastQualificationError('');
                                        }}
                                        className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#121214] rounded-lg border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-100 font-sans"
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {fastLastQualificationError && (
                                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastLastQualificationError}</p>
                                )}
                              </div>

                              {/* Address */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Full Residential Address *</label>
                                <div className="relative">
                                  <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none">
                                    <MapPin className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                  </div>
                                  <textarea
                                    required
                                    placeholder="Enter complete residential address details"
                                    value={fastAddress}
                                    onChange={e => {
                                      setFastAddress(e.target.value);
                                      if (e.target.value.trim()) setFastAddressError('');
                                    }}
                                    rows={3}
                                    className={`w-full pl-10 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastAddressError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans resize-none`}
                                  />
                                </div>
                                {fastAddressError && (
                                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{fastAddressError}</p>
                                )}
                              </div>

                          {/* Submit Admission Application */}
                          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                              <button
                                type="submit"
                                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 rounded-xl text-xs font-extrabold transition-all duration-150 active:scale-95 shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5 text-amber-955 font-sans ml-auto"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Submit Admission Application
                              </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Back link to login panel for student */}
                    <div className="pt-5 border-t border-slate-150 dark:border-white/5 text-center mt-4">
                      <button
                        type="button"
                        onClick={() => { setOnboardingTab('authLogin'); setLoginError(''); }}
                        className="text-xs text-slate-500 hover:text-amber-500 transition-colors cursor-pointer font-medium"
                      >
                        Already applied? <span className="text-amber-500 hover:underline font-bold">Go to login portal instead &rarr;</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Form 2: Username/Password authentication login */}
              {onboardingTab === 'authLogin' && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-serif italic text-amber-500 font-bold tracking-tight">Approved Account Login</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Access your profile, courses, and educational schedules using the verified credentials (USERNAME & PASSWORD) delivered to your simulated student inbox.
                      </p>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs leading-relaxed flex gap-2">
                        <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Approved Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. samantha_wilson_822"
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider font-semibold">Security Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmailInput('');
                              setForgotModalSuccess('');
                              setForgotModalError('');
                              setForgotEmailModalOpen(true);
                            }}
                            className="text-[10px] text-amber-500 hover:underline hover:text-amber-600 font-bold transition cursor-pointer select-none outline-none"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/15 transition-all active:scale-98 cursor-pointer mt-3 flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Sign In with Credentials &rarr;
                      </button>
                    </form>

                    {/* Redirect log-in panel to core admissions form */}
                    <div className="pt-5 border-t border-slate-150 dark:border-white/5 text-center mt-5">
                      <button
                        type="button"
                        onClick={() => { setOnboardingTab('fastReg'); setLoginError(''); }}
                        className="text-xs text-slate-500 hover:text-amber-500 transition-colors cursor-pointer font-medium"
                      >
                        Need admission? <span className="text-amber-500 hover:underline font-bold">Apply for Learnora admission &rarr;</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Form 3: Administrator Sign In */}
              {onboardingTab === 'adminLogin' && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-0.5 px-2 bg-amber-500/15 border border-amber-500/25 text-amber-500 rounded-lg text-[9px] font-mono font-bold uppercase select-none tracking-wider">
                          🛡️ RESTRICTED ENTRY
                        </span>
                      </div>
                      <h3 className="text-xl font-serif italic text-amber-500 font-bold tracking-tight">Admin Terminal Sign In</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Access Learnora's administrative panel, review student profiles, dispatch registration emails, and perform full ledger cleanups.
                      </p>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-xs leading-relaxed flex gap-2">
                        <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider">Admin Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. anik"
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono uppercase text-slate-400 dark:text-gray-500 block font-bold tracking-wider font-semibold">Security Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmailInput('');
                              setForgotModalSuccess('');
                              setForgotModalError('');
                              setForgotEmailModalOpen(true);
                            }}
                            className="text-[10px] text-amber-500 hover:underline hover:text-amber-600 font-bold transition cursor-pointer select-none outline-none"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Key className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={e => setLoginPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>



                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-955 font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/15 transition-all active:scale-98 cursor-pointer mt-3 flex items-center justify-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Acknowledge & Sign In to Console &rarr;
                      </button>
                    </form>

                    {/* Redirect log-in admin panel to core admissions form */}
                    <div className="pt-5 border-t border-slate-150 dark:border-white/5 text-center mt-5">
                      <button
                        type="button"
                        onClick={() => { setOnboardingTab('fastReg'); setLoginError(''); }}
                        className="text-xs text-slate-500 hover:text-amber-500 transition-colors cursor-pointer font-medium"
                      >
                        Register a new student? <span className="text-amber-500 hover:underline font-bold">Open Admissions form &rarr;</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        ) : (
          <HomePage
            isDark={isDark}
            courses={courses}
            onEnterPortal={(tab) => {
              setShowPortal(true);
              setOnboardingTab(tab);
            }}
          />
        )
      ) : (
        /* Core UI Application Shell */
        <div className="min-h-screen flex flex-col md:flex-row relative z-0 overflow-hidden font-sans bg-[linear-gradient(135deg,#E0E6ED_0%,#EDF2F7_50%,#E2E8F0_100%)] dark:bg-[linear-gradient(135deg,#0E131F_0%,#151D30_50%,#090D16_100%)]">
          
          {/* High-Resolution Modern Geometric & Wave Background (Matching the reference picture) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
            {/* Subtle split plane layout backgrounds */}
            <div className="absolute top-0 right-0 w-[60%] h-full bg-[#E5ECF6] dark:bg-[#131A2C] opacity-40 dark:opacity-20 [clip-path:polygon(40%_0,100%_0,100%_100%,0_100%)]" />
            <div className="absolute bottom-0 left-0 w-[40%] h-full bg-[#D9E2EC] dark:bg-[#0D1525] opacity-35 dark:opacity-15 [clip-path:polygon(0_0,100%_100%,0_100%)]" />

            <svg className="absolute w-full h-full opacity-80 dark:opacity-45" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wave1App" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7"/>
                  <stop offset="50%" stopColor="#D9E4F5" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#C4D4EC" stopOpacity="0.8"/>
                </linearGradient>
                <linearGradient id="wave2App" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#B0CBE9" stopOpacity="0.3"/>
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#9BBEE3" stopOpacity="0.25"/>
                </linearGradient>
                <linearGradient id="lineGradApp" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#8DA9C4" stopOpacity="0"/>
                  <stop offset="25%" stopColor="#8DA9C4" stopOpacity="0.35"/>
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8"/>
                  <stop offset="75%" stopColor="#6C8EBF" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#6C8EBF" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="darkLineGradApp" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#334E68" stopOpacity="0"/>
                  <stop offset="30%" stopColor="#486581" stopOpacity="0.4"/>
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6"/>
                  <stop offset="70%" stopColor="#243B53" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#243B53" stopOpacity="0"/>
                </linearGradient>
              </defs>

              <path d="M-100,280 C300,120 500,450 900,220 C1100,105 1300,200 1600,150 L1600,850 L-100,850 Z" fill="url(#wave1App)" />
              <path d="M-50,380 C250,520 600,180 1000,380 C1200,480 1350,350 1550,420 L1550,850 L-50,850 Z" fill="url(#wave2App)" />

              <g stroke="url(#lineGradApp)" fill="none" strokeWidth="1.2" className="dark:hidden">
                <path d="M-100,290 Q200,380 500,240 T1100,350 T1600,210" />
                <path d="M-100,310 Q200,400 500,260 T1100,370 T1600,230" />
                <path d="M-100,330 Q200,420 500,280 T1100,390 T1600,250" />
                <path d="M-100,350 Q200,440 500,300 T1100,410 T1600,270" />
                <path d="M-100,370 Q200,460 500,320 T1100,430 T1600,290" />
                <path d="M-100,390 Q200,480 500,340 T1100,450 T1600,310" />
                <path d="M-100,410 Q200,500 500,360 T1100,470 T1600,330" />
                <path d="M-100,430 Q200,520 500,380 T1100,490 T1600,350" />
                <path d="M-100,450 Q200,540 500,400 T1100,510 T1600,370" />
                <path d="M-100,470 Q200,560 500,420 T1100,530 T1600,390" />
                <path d="M-100,490 Q200,580 500,440 T1100,550 T1600,410" />
              </g>

              <g stroke="url(#darkLineGradApp)" fill="none" strokeWidth="1.2" className="hidden dark:g">
                <path d="M-100,290 Q200,380 500,240 T1100,350 T1600,210" />
                <path d="M-100,310 Q200,400 500,260 T1100,370 T1600,230" />
                <path d="M-100,330 Q200,420 500,280 T1100,390 T1600,250" />
                <path d="M-100,350 Q200,440 500,300 T1100,410 T1600,270" />
                <path d="M-100,370 Q200,460 500,320 T1100,430 T1600,290" />
                <path d="M-100,390 Q200,480 500,340 T1100,450 T1600,310" />
                <path d="M-100,410 Q200,500 500,360 T1100,470 T1600,330" />
                <path d="M-100,430 Q200,520 500,380 T1100,490 T1600,350" />
                <path d="M-100,450 Q200,540 500,400 T1100,510 T1600,370" />
              </g>
            </svg>

            <div className="absolute right-[10%] top-[25%] w-[450px] h-[450px] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-[120px]" />
            <div className="absolute left-[5%] bottom-[15%] w-[350px] h-[350px] rounded-full bg-slate-300/30 dark:bg-indigo-900/15 blur-[100px]" />
          </div>

          
          {/* Responsive Navigation Rail */}
          <aside 
            onMouseEnter={() => {
              if (!ignoreHover) {
                setIsSidebarHovered(true);
              }
            }}
            onMouseLeave={() => {
              setIsSidebarHovered(false);
              setIgnoreHover(false);
            }}
            className={`w-full ${isActuallyCollapsed ? 'md:w-20' : 'md:w-64'} relative z-10 bg-white/80 dark:bg-[#0A0A0C]/70 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-white/5 flex flex-col justify-between p-5 mr-0 transition-all duration-300 ease-in-out select-none`}
          >
            <div className="space-y-6">
              {/* Header Branding */}
              <div className={`flex items-center justify-between md:justify-center select-none`}>
                <div className={`flex items-center gap-2`}>
                  {!isActuallyCollapsed ? (
                    <div className="leading-none animate-fadeIn">
                      <div className="origin-left scale-[0.65] -mb-1 relative -left-1">
                        <Logo size="sm" withStrapline={false} />
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 font-sans ml-1 text-slate-400 dark:text-gray-500">Active Scheduler</p>
                    </div>
                  ) : (
                    <div className="scale-[0.45] origin-center -ml-3 -mb-1">
                      <Logo size="sm" withStrapline={false} />
                    </div>
                  )}
                </div>
                
                {/* Mobile Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Collapsed items wrapped in responsive block. On mobile, we hide menus when collapsed. */}
              <div className={`md:flex md:flex-col md:gap-6 ${isSidebarCollapsed ? 'hidden md:block' : 'block animate-fadeIn'}`}>
                {/* Logged profile banner */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className={`p-3 bg-slate-50 dark:bg-[#161618] hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl border ${activeTab === 'profile' ? 'border-amber-500' : 'border-slate-100 dark:border-white/5'} flex items-center ${isActuallyCollapsed ? 'justify-center p-2' : 'gap-3'} select-none transition-all cursor-pointer`}
                  title="Click to Open Profile Settings"
                >
                  <div className="relative group/avatar cursor-pointer flex-shrink-0">
                    <img
                      id="sidebar-user-avatar-image"
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 group-hover/avatar:brightness-75 transition"
                    />
                    <input
                      type="file"
                      id="user-sidebar-avatar-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const limit = 2 * 1024 * 1024;
                        if (file.size > limit) {
                          const errNotif: AppNotification = {
                            id: generateUniqueId('notif-err'),
                            title: 'Upload Limitation Met',
                            message: 'Photo size exceeds the 2MB size threshold. Please resize or select an alternate.',
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'general',
                            channel: 'push'
                          };
                          triggerToast(errNotif);
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64Url = reader.result as string;
                          // Update currentUser state
                          setCurrentUser(prev => prev ? { ...prev, avatarUrl: base64Url } : null);
                          // Update users state
                          setUsers(prev => prev.map(u => {
                            if (u.id === currentUser.id) {
                              return { ...u, avatarUrl: base64Url };
                            }
                            return u;
                          }));
                          // Trigger Notification
                          const notif: AppNotification = {
                            id: generateUniqueId('notif-avatar'),
                            title: 'Profile Photo Updated',
                            message: 'Your profile photo has been updated successfully and is now active across all administrative registers.',
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'enrollment',
                            channel: 'push'
                          };
                          setNotifications(prev => [notif, ...prev]);
                          triggerToast(notif);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="user-sidebar-avatar-upload"
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 bg-black/40 rounded-full text-white transition cursor-pointer"
                      title="Change Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                  </div>
                  {!isActuallyCollapsed && (
                    <div className="min-w-0 flex-1 animate-fadeIn">
                      <p className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate">{currentUser.name}</p>
                      <span className="inline-flex items-center text-[9px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded mt-0.5">
                        {currentUser.role}
                      </span>
                    </div>
                  )}
                </div>

                {/* Central Navigation lists */}
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Center Dashboard" : undefined}
                  >
                    <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Center Dashboard</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('enrollments');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'enrollments'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? (currentUser.role === 'admin' ? 'Accounts & Enrollments' : currentUser.role === 'sub-admin' ? 'Enrollments & Faculty' : currentUser.role === 'instructor' ? 'Student Profiles Registry' : 'My Profile') : undefined}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && (
                      <span className="truncate animate-fadeIn">
                        {currentUser.role === 'admin' 
                          ? 'Accounts & Enrollments' 
                          : currentUser.role === 'sub-admin' 
                            ? 'Enrollments & Faculty' 
                            : currentUser.role === 'instructor' 
                              ? 'Student Profiles Registry' 
                              : 'My Profile'}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('schedule');
                      setScheduleShowAddForm(false);
                      setScheduleShowBatchManager(false);
                      setScheduleShowCourseDashboard(false);
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'schedule'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Class Timetable Scheduling" : undefined}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Class Timetable Scheduling</span>}
                  </button>

                  {/* Sub-menu options nested beneath Class Timetable Scheduling */}
                  {!isActuallyCollapsed && activeTab === 'schedule' && ['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                    <div className="pl-4 pr-1 py-1 space-y-1 bg-slate-50/20 dark:bg-white/[0.01] rounded-xl border border-dotted border-slate-200/50 dark:border-white/5 animate-fadeIn">
                      {/* Sub-item 1: Schedule New Class */}
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleShowAddForm(!scheduleShowAddForm);
                          setScheduleShowBatchManager(false);
                          setScheduleShowCourseDashboard(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10.5px] transition cursor-pointer ${
                          scheduleShowAddForm
                            ? 'bg-amber-500/15 text-amber-500 font-bold'
                            : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-[#161618]'
                        }`}
                      >
                        <Plus className="w-3 h-3 flex-shrink-0 text-amber-500" />
                        <span className="truncate">Schedule New Live Class</span>
                      </button>

                      {/* Sub-item 3: Courses Publish */}
                      {['admin', 'sub-admin'].includes(currentUser.role) && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleShowCourseDashboard(!scheduleShowCourseDashboard);
                            setScheduleShowAddForm(false);
                            setScheduleShowBatchManager(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10.5px] transition cursor-pointer ${
                            scheduleShowCourseDashboard
                              ? 'bg-amber-500/15 text-amber-500 font-bold'
                              : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-[#161618]'
                          }`}
                        >
                          <GraduationCap className="w-3 h-3 flex-shrink-0 text-amber-500" />
                          <span className="truncate">Courses Publish Dashboard</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('progress');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'progress'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Grading Progress Books" : undefined}
                  >
                    <Award className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Grading Progress Books</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reports');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'reports'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Analytics Reports & Exports" : undefined}
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Analytics Reports & Exports</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inbox');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'inbox'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Secure Mailbox" : undefined}
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Secure Mailbox</span>}
                    {simulatedEmails.filter(m => m.to.toLowerCase() === currentUser.email.toLowerCase()).length > 0 && (
                      <span className={`absolute ${isActuallyCollapsed ? 'top-1 right-1' : 'right-3.5 top-1/2 -translate-y-1/2'} min-w-[16px] h-4 leading-none text-[9.5px] font-mono font-bold bg-amber-500 text-amber-950 px-1 rounded-full flex items-center justify-center border border-white dark:border-[#161618] transition-all`}>
                        {simulatedEmails.filter(m => m.to.toLowerCase() === currentUser.email.toLowerCase()).length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                    }}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                    }`}
                    title={isActuallyCollapsed ? "Profile & Password Settings" : undefined}
                  >
                    <User className="w-4 h-4 flex-shrink-0 text-amber-500" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Profile Settings</span>}
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('backup');
                        if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                      }}
                      className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                        activeTab === 'backup'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                          : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                      }`}
                      title={isActuallyCollapsed ? "Secure Backups" : undefined}
                    >
                      <CloudLightning className="w-4 h-4 flex-shrink-0" />
                      {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Secure Backups</span>}
                    </button>
                  )}
                </nav>

                {/* Logout anchor workspace */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => handleLogout()}
                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-3' : 'gap-3.5 px-3.5 py-3'} rounded-xl border border-slate-100 dark:border-white/5 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-500 font-bold text-xs text-slate-550 dark:text-gray-400 transition cursor-pointer`}
                    title={isActuallyCollapsed ? "Change Simulator Role" : undefined}
                  >
                    <LogOut className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Change Simulator Role</span>}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Context Stage */}
          <main className="flex-1 relative z-10 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            
            {/* Active Render Panels Routing based on Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Welcomes banner custom header */}
                <div 
                  className="p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden select-none text-white"
                  style={{
                    backgroundColor: "#0B0C10",
                    backgroundImage: `
                      radial-gradient(at 20% 20%, #2f326a 0px, transparent 50%),
                      radial-gradient(at 80% 0%, #4f549c 0px, transparent 50%),
                      radial-gradient(at 100% 80%, #9194c4 0px, transparent 50%),
                      radial-gradient(at 0% 100%, #1e1f3f 0px, transparent 50%)
                    `
                  }}
                >
                  {/* Branding background shape ornament */}
                  <div className="absolute right-0 bottom-0 h-32 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1 relative z-10">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      COACHING OFFICE SERVER CONNECTED
                    </p>
                    <h1 className="text-2xl md:text-3xl font-serif italic text-white font-bold tracking-tight mt-1">
                      Welcome Back, {currentUser.name}!
                    </h1>
                    <p className="text-xs text-slate-300 pr-4 mt-0.5 leading-relaxed">
                      Auditing center coordinates. Time check: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. All automated reminders ready in queue.
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-xs space-y-1 font-mono text-white relative z-10">
                    <p className="font-bold">
                      STATUS Dashboard <span className="text-emerald-400 animate-pulse inline-block">Live</span>
                    </p>
                    <p className="text-slate-300 text-[10px]">RECORDS: {users.length} registered</p>
                  </div>
                </div>

                {/* Dashboard summary stats based on current user role */}
                {['admin', 'sub-admin'].includes(currentUser.role) && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Total Students</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">{users.filter(u => u.role === 'student').length}</p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('enrollments')}>
                        View folder registry &rarr;
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Instructors</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">{users.filter(u => u.role === 'instructor').length}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-4">Full instructor workloads configured</p>
                    </div>

                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Scheduled Classes</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">{schedules.filter(s => s.status === 'scheduled').length}</p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('schedule')}>
                        Organize calendar &rarr;
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Academic average</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">
                          {(progressRecords.reduce((acc, r) => acc + r.score, 0) / progressRecords.length).toFixed(0)}%
                        </p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('reports')}>
                        Explore insights &rarr;
                      </span>
                    </div>
                  </div>
                )}

                {currentUser.role === 'student' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Your Enrolled Courses</p>
                          <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">
                            {schedules.filter(s => s.enrolledStudentIds.includes(currentUser.id)).length}
                          </p>
                        </div>
                        <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('schedule')}>
                          Check Timetables &rarr;
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">My Evaluative Average Score</p>
                          <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">
                            {progressRecords.filter(r => r.studentId === currentUser.id).length > 0
                              ? (progressRecords.filter(r => r.studentId === currentUser.id).reduce((acc, r) => acc + r.score, 0) / progressRecords.filter(r => r.studentId === currentUser.id).length).toFixed(0)
                              : '0'}%
                          </p>
                        </div>
                        <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('progress')}>
                          View My Feedbacks &rarr;
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Assigned Mentor Advisor</p>
                          <p className="text-xl font-serif text-amber-500 mt-2 italic font-bold">
                            {users.find(i => i.id === currentUser.assignedInstructorId)?.name || 'No Assigned Advisor'}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-4">Profile synced successfully</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Upcoming Events Panel */}
                      <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-serif italic">
                          <Calendar className="w-4 h-4 text-amber-500" /> Upcoming Events & Classes
                        </h3>
                        <div className="space-y-3">
                          {schedules.filter(s => s.enrolledStudentIds.includes(currentUser.id) && s.status === 'scheduled').length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-sans">No upcoming events scheduled at the moment.</p>
                          ) : (
                            schedules.filter(s => s.enrolledStudentIds.includes(currentUser.id) && s.status === 'scheduled').slice(0, 3).map(sch => (
                              <div key={sch.id} className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 transition hover:shadow-sm">
                                <div className="flex justify-between items-start mb-1.5">
                                  <p className="text-xs font-bold text-slate-800 dark:text-gray-100 leading-snug">{sch.title}</p>
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">{sch.subject}</span>
                                </div>
                                <p className="text-[10.5px] text-slate-500 dark:text-gray-400 flex items-center gap-1.5 font-sans mt-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {sch.date} at {sch.time}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <button onClick={() => setActiveTab('schedule')} className="w-full text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-50/50 dark:bg-amber-500/5 py-2.5 mt-4 rounded-xl transition">
                          View Academic Calendar
                        </button>
                      </div>

                      {/* Recent Evaluations Panel */}
                      <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-serif italic">
                          <Award className="w-4 h-4 text-emerald-500" /> Recent Evaluation Dates
                        </h3>
                        <div className="space-y-3">
                          {progressRecords.filter(r => r.studentId === currentUser.id).length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-sans">No evaluations recorded yet.</p>
                          ) : (
                            progressRecords.filter(r => r.studentId === currentUser.id).sort((a,b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime()).slice(0, 3).map(rec => (
                              <div key={rec.id} className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 flex items-center justify-between transition hover:shadow-sm">
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-gray-100">{rec.className}</p>
                                  <p className="text-[10.5px] text-slate-500 dark:text-gray-400 mt-1 font-sans flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-slate-400" /> Evaluated on: {rec.evaluationDate}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-serif font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{rec.score}%</span>
                                  <p className="text-[9px] text-slate-400 dark:text-gray-500 capitalize mt-1.5 font-mono">{rec.academicPerformance.replace('-', ' ')}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <button onClick={() => setActiveTab('progress')} className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 py-2.5 mt-4 rounded-xl transition">
                          View Detailed Progress
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentUser.role === 'instructor' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Your Teaching Live Sessions</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">
                          {schedules.filter(s => s.instructorId === currentUser.id && s.status === 'scheduled').length}
                        </p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('schedule')}>
                        Mark Timetable completion &rarr;
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-slate-401 dark:text-gray-500 font-mono uppercase tracking-widest font-semibold">Registered Evaluations Logged</p>
                        <p className="text-3xl font-serif text-slate-900 dark:text-white mt-1.5">
                          {progressRecords.filter(r => r.instructorId === currentUser.id).length}
                        </p>
                      </div>
                      <span className="text-[10.5px] font-semibold text-[#000080] dark:text-[#000080] hover:text-[#0000CD] dark:hover:text-[#0000CD] hover:underline cursor-pointer flex items-center gap-0.5 mt-4" onClick={() => setActiveTab('progress')}>
                        Grade more schedules progress &rarr;
                      </span>
                    </div>
                  </div>
                )}

                {/* Main alerts panels & Notification workspace inside Dashboard */}
                <NotificationCenter
                  currentUser={currentUser}
                  notifications={notifications}
                  onMarkAsRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                  onClearAll={() => setNotifications([])}
                  onTriggerTestNotification={handleTriggerTestNotification}
                />

                {/* Mini Schedule overview feed inside main Dashboard */}
                <div className="bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 p-6 md:p-8 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-serif italic text-slate-900 dark:text-white">Active Classroom Sessions Timetable</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-sans">Quick lookup of classes registered currently</p>
                    </div>
                    <button onClick={() => setActiveTab('schedule')} className="text-xs font-bold text-[#FF3B5C] hover:text-[#E11D48] hover:underline">
                      See full list &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schedules.slice(0, 4).map(sch => (
                      <div key={sch.id} className="p-4 rounded-xl bg-slate-50/50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161618] text-slate-700 dark:text-gray-400 border dark:border-white/5">{sch.subject}</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-gray-100 leading-snug">{sch.title}</p>
                          <p className="text-[10.5px] text-slate-500 dark:text-gray-500 flex items-center gap-1 font-sans">
                            <Clock className="w-3.5 h-3.5" /> {sch.date} • {sch.time}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-500 capitalize">{sch.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'enrollments' && (
              <EnrollmentManager
                currentUser={currentUser}
                students={users.filter(u => u.role === 'student')}
                instructors={users.filter(u => u.role === 'instructor')}
                subAdmins={users.filter(u => u.role === 'sub-admin')}
                schedules={schedules}
                batches={batches}
                courses={courses}
                onAddStudent={handleAddStudent}
                onAddInstructor={handleAddInstructor}
                onAddSubAdmin={handleAddSubAdmin}
                onRemoveStudent={handleRemoveStudent}
                onRemoveInstructor={handleRemoveInstructor}
                onRemoveSubAdmin={handleRemoveSubAdmin}
                onEnrollStudentInClass={handleEnrollStudentInClass}
                registrationRequests={registrationRequests}
                onApproveRequest={handleApproveRegistration}
                onRejectRequest={handleRejectRegistration}
                onUpdateStudent={handleUpdateProfile}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleManager
                currentUser={currentUser}
                schedules={schedules}
                instructors={users.filter(u => u.role === 'instructor')}
                students={users.filter(u => u.role === 'student')}
                batches={batches}
                courses={courses}
                onAddClass={handleAddClass}
                onUpdateStatus={handleUpdateClassStatus}
                onSelfEnroll={handleSelfEnroll}
                onAddBatch={handleAddBatch}
                onDeleteBatch={handleDeleteBatch}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                showAddForm={scheduleShowAddForm}
                setShowAddForm={setScheduleShowAddForm}
                showBatchManager={scheduleShowBatchManager}
                setShowBatchManager={setScheduleShowBatchManager}
                showCourseDashboard={scheduleShowCourseDashboard}
                setShowCourseDashboard={setScheduleShowCourseDashboard}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTracker
                currentUser={currentUser}
                students={users.filter(u => u.role === 'student')}
                schedules={schedules}
                progressRecords={progressRecords}
                onAddProgressRecord={handleAddProgressRecord}
              />
            )}

            {activeTab === 'reports' && (
              <ReportingDashboard
                students={users.filter(u => u.role === 'student')}
                schedules={schedules}
                progressRecords={progressRecords}
              />
            )}

            {activeTab === 'inbox' && (
              <MailboxManager
                currentUser={currentUser}
                users={users}
                simulatedEmails={simulatedEmails}
                onSendEmail={handleSendEmail}
              />
            )}

            {activeTab === 'backup' && currentUser.role === 'admin' && (
              <CloudBackup
                students={users.filter(u => u.role === 'student')}
                instructors={users.filter(u => u.role === 'instructor')}
                schedules={schedules}
                progressRecords={progressRecords}
                backupHistory={backupHistory}
                onTriggerBackup={handleTriggerBackup}
                onRestoreState={handleRestoreState}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileSettings
                currentUser={currentUser}
                instructors={users.filter(u => u.role === 'instructor')}
                onUpdateProfile={handleUpdateProfile}
                onTriggerToast={triggerToast}
                users={users}
                onSendEmail={handleSendEmail}
              />
            )}

          </main>
        </div>
      )}

      {forgotEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-serif italic font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500" /> Recover Account Credentials
              </h3>
              <button 
                onClick={() => {
                  setForgotEmailModalOpen(false);
                  setForgotEmailInput('');
                  setForgotModalSuccess('');
                  setForgotModalError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotModalSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs space-y-2">
                  <p className="font-bold">Credential Recovery Email Sent!</p>
                  <p className="leading-relaxed font-sans">{forgotModalSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmailModalOpen(false);
                    setForgotEmailInput('');
                    setForgotModalSuccess('');
                    setForgotModalError('');
                  }}
                  className="w-full py-2.5 bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotModalError('');
                  setForgotModalSuccess('');
                  const targetEmail = forgotEmailInput.trim().toLowerCase();
                  
                  const matchedUser = users.find(u => u.email?.toLowerCase() === targetEmail);
                  
                  if (matchedUser) {
                    const subject = `[SECURITY DISPATCH] Recovered Platform Credentials`;
                    const body = `Dear ${matchedUser.name || matchedUser.username},\n\nWe received a dynamic password lookup request for your platform account. Your security credentials are listed below:\n\n-----------------------------\nUSERNAME: ${matchedUser.username || 'n/a'}\nPASSWORD: ${matchedUser.password || 'n/a'}\n-----------------------------\n\nPlease make sure to memorize these credentials or change your password under Profile Settings once logged in.\n\nBest regards,\nLearnora Sandbox Security Dispatch Team`;
                    
                    handleSendEmail(matchedUser.email, subject, body, 'anik.baidya@hotmail.com');
                    
                    // Trigger a toast
                    const notif: AppNotification = {
                      id: `notif-forgot-${Date.now()}`,
                      title: `Credentials Dispatched`,
                      message: `Security recovery ledger packet transmitted to ${matchedUser.email}.`,
                      timestamp: new Date().toISOString(),
                      read: false,
                      type: 'reminder',
                      channel: 'push'
                    };
                    triggerToast(notif);
                    
                    setForgotModalSuccess(`We have successfully matched user account @${matchedUser.username}. A security recovery dispatch has been routed to the simulated mailbox: ${matchedUser.email}. Please use the Student Mailbox Simulator on the login screen, enter your email address to open the mailbox, and retrieve your credentials.`);
                  } else {
                    setForgotModalError('No active student, teacher, or administrative record matches this registered email address within our master databases.');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. email@domain.io"
                      value={forgotEmailInput}
                      onChange={e => setForgotEmailInput(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-gray-100 font-sans"
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-400 dark:text-gray-500 leading-relaxed font-sans mt-1">
                    Once sent, you can log in to your email inbox using the **Student Mailbox Simulator** at the bottom of the landing page's left panel to audit the dispatch message.
                  </p>
                </div>

                {forgotModalError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{forgotModalError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 text-amber-950 font-bold hover:bg-amber-600 rounded-xl text-xs transition shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <Mail className="w-3.5 h-3.5" /> Send Credentials Email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
