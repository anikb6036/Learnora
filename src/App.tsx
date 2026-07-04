/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord, AppNotification, BackupHistory, RegistrationRequest, SimulatedEmail, StudentBatch, Course, MasterCourse, StudentAssignment, AssignmentBankItem, StudentEvolution, EvolutionBankItem } from './types';
import {
  INITIAL_USERS,
  INITIAL_SCHEDULES,
  INITIAL_PROGRESS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BACKUPS,
  INITIAL_BATCHES,
  INITIAL_COURSES,
  INITIAL_MASTER_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_BANK,
  INITIAL_EVOLUTION_BANK,
  getSavedState,
  saveState,
  useFirebaseState
} from './utils';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { AssignmentPipeline } from './components/AssignmentPipeline';
import { compressImage } from './imageUtils';

let globalSendEmailInterceptor: ((to: string, subject: string, text: string, html?: string) => Promise<{ success: boolean; error?: string }>) | null = null;

const sendSystemEmail = async (to: string, subject: string, text: string, html?: string): Promise<{ success: boolean; error?: string }> => {
  if (globalSendEmailInterceptor) {
    return globalSendEmailInterceptor(to, subject, text, html);
  }
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, subject, text, html })
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn("Real email failed:", data.error);
      return { success: false, error: data.error || "Failed to send email" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Failed to call send-email API:", err);
    return { success: false, error: err.message || "Network error communicating with mail API" };
  }
};

import NotificationCenter from './components/NotificationCenter';
import EnrollmentManager from './components/EnrollmentManager';
import ScheduleManager from './components/ScheduleManager';
import { CourseDirectory } from './components/CourseDirectory';
import ProgressTracker from './components/ProgressTracker';
import ReportingDashboard from './components/ReportingDashboard';
import CloudBackup from './components/CloudBackup';
import MailboxManager from './components/MailboxManager';
import ProfileSettings from './components/ProfileSettings';
import AssignmentTracker from './components/AssignmentTracker';
import HomePage from './components/HomePage';
import Logo from './components/Logo';
import AdmissionsExamModal from './components/AdmissionsExamModal';
import StudentHomeworkModal from './components/StudentHomeworkModal';
import { RazorpayPayment } from './components/RazorpayPayment';
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
  BookOpen,
  GraduationCap,
  Camera,
  Trash2,
  Plus,
  Upload,
  Settings,
  X,
  AlertCircle,
  ChevronLeft,
  Menu,
  Search,
  ChevronDown,
  Download,
  Code,
  MoreHorizontal,
  GitBranch,
  ExternalLink,
  Eye,
  CheckCircle,
  EyeOff,
  Cpu,
  Layers,
  Globe,
  RefreshCw,
  Play,
  CheckCircle2,
  FileText,
  CheckSquare,
  Send,
  Star,
  ClipboardList,
  TrendingUp,
  Database
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

const generateUniversalId = (existingUsers?: UserAccount[]) => {
  let uid = '';
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 100) {
    uid = Math.floor(100000 + Math.random() * 900000).toString();
    if (!existingUsers) {
      isUnique = true;
    } else {
      isUnique = !existingUsers.some(u => u.universalId === uid);
    }
    attempts++;
  }
  return uid;
};

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
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

const isScheduleDateOnOrAfterJoinedDate = (scheduleDate: string, joinedDateStr: string | undefined): boolean => {
  if (!joinedDateStr) return true;
  try {
    const sDate = new Date(scheduleDate + 'T00:00:00');
    let jDate: Date;
    if (joinedDateStr.includes('-')) {
      const parts = joinedDateStr.split('-');
      if (parts[0].length === 4) {
        jDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
      } else {
        jDate = new Date(joinedDateStr);
      }
    } else if (joinedDateStr.includes('/')) {
      const parts = joinedDateStr.split('/');
      if (parts[2]?.length === 4) {
        jDate = new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10), 0, 0, 0, 0);
      } else if (parts[0]?.length === 4) {
        jDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
      } else {
        jDate = new Date(joinedDateStr);
      }
    } else {
      jDate = new Date(joinedDateStr);
    }
    
    sDate.setHours(0, 0, 0, 0);
    jDate.setHours(0, 0, 0, 0);
    
    if (isNaN(sDate.getTime()) || isNaN(jDate.getTime())) return true;
    return sDate.getTime() >= jDate.getTime();
  } catch (e) {
    return true;
  }
};

function AppContent() {
  const { isDark } = useTheme();

  // Root states synchronized with Firebase Live Queries
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getSavedState('active-user', null));
  const [originalAdminUser, setOriginalAdminUser] = useState<UserAccount | null>(() => getSavedState('original-admin-user', null));
  const [users, setUsers, usersLoaded] = useFirebaseState<UserAccount[]>('db-users', INITIAL_USERS);
  const [schedules, setSchedules, schedulesLoaded] = useFirebaseState<ClassSchedule[]>('db-schedules', INITIAL_SCHEDULES);
  const [progressRecords, setProgressRecords, progressLoaded] = useFirebaseState<ProgressRecord[]>('db-progress', INITIAL_PROGRESS);
  const [notifications, setNotifications, notificationsLoaded] = useFirebaseState<AppNotification[]>('db-notifications', INITIAL_NOTIFICATIONS);
  const [backupHistory, setBackupHistory, backupsLoaded] = useFirebaseState<BackupHistory[]>('db-backups', INITIAL_BACKUPS);
  const [assignments, setAssignments, assignmentsLoaded] = useFirebaseState<StudentAssignment[]>('db-assignments', INITIAL_ASSIGNMENTS);
  const [assignmentBank, setAssignmentBank, assignmentBankLoaded] = useFirebaseState<AssignmentBankItem[]>('db-assignment-bank', INITIAL_ASSIGNMENT_BANK);
  const [evolutionBank, setEvolutionBank, evolutionBankLoaded] = useFirebaseState<EvolutionBankItem[]>('db-evolution-bank', INITIAL_EVOLUTION_BANK);

  useEffect(() => {
    saveState('active-user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveState('original-admin-user', originalAdminUser);
  }, [originalAdminUser]);

  // Pending admission registration requests state
  const [registrationRequests, setRegistrationRequests, registrationLoaded] = useFirebaseState<RegistrationRequest[]>('db-registration-requests', []);

  const [studentScheduleTab, setStudentScheduleTab] = useState<'schedule'|'tasks'|'completed'|'assignments'>('schedule');

  // Instructor assignment flow states
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningClass, setAssigningClass] = useState<ClassSchedule | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxPoints, setAssignmentMaxPoints] = useState(100);
  const [assignmentMonth, setAssignmentMonth] = useState('Month 1');
  const [assignmentSyllabus, setAssignmentSyllabus] = useState('');
  const [selectedBankTemplateIdForModal, setSelectedBankTemplateIdForModal] = useState('');

  // Grading / Submission state
  const [gradingAssignmentId, setGradingAssignmentId] = useState<string | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(100);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Student submission workflow states
  const [activeStudentModalAssignment, setActiveStudentModalAssignment] = useState<StudentAssignment | undefined>(undefined);
  const [activeStudentModalEvolution, setActiveStudentModalEvolution] = useState<StudentEvolution | undefined>(undefined);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  
  // Backward compatibility with legacy state (though we won't strictly need them, we keep them so older code doesn't crash before being refactored)
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFileUrn, setSubmissionFileUrn] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Simulated student mailbox communications
  const [simulatedEmails, setSimulatedEmails, emailsLoaded] = useFirebaseState<SimulatedEmail[]>('db-simulated-emails', []);

  // Student batches published by admin/sub-admin
  const [batches, setBatches, batchesLoaded] = useFirebaseState<StudentBatch[]>('db-batches', INITIAL_BATCHES);

  // Student courses published by admin/sub-admin
  const [rawCourses, setCourses, coursesLoaded] = useFirebaseState<Course[]>('db-courses', INITIAL_COURSES);
  const courses = rawCourses.map(c => ({
    ...c,
    name: c.name ? c.name.replace(/\.+$/, '').trim() : ''
  }));

  const getStudentEnrolledCourse = (user: UserAccount | null) => {
    if (!user || !user.course || !courses || courses.length === 0) return undefined;
    const userCourseClean = user.course.trim().replace(/\.+$/, "").toLowerCase();
    const userBatchClean = user.batch?.trim().toLowerCase() || "";
    
    if (userBatchClean) {
      const batchMatched = courses.find(c => {
        const cId = c.id?.trim().toLowerCase() || "";
        const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
        const cCode = c.code?.trim().toLowerCase() || "";
        const cBatch = c.batchNumber?.trim().toLowerCase() || "";
        const isCourseMatch = cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
        const isBatchMatch = cBatch === userBatchClean || cCode === userBatchClean;
        return isCourseMatch && isBatchMatch;
      });
      if (batchMatched) return batchMatched;
    }
    
    let matched = courses.find(c => {
      const cId = c.id?.trim().toLowerCase() || "";
      const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
      const cCode = c.code?.trim().toLowerCase() || "";
      return cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
    });
    if (matched) return matched;
    
    matched = courses.find(c => {
      const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
      return cName.includes(userCourseClean) || userCourseClean.includes(cName);
    });
    return matched;
  };

  const getTrialInfo = (user: UserAccount | null) => {
    const course = getStudentEnrolledCourse(user);
    if (!course || !course.trialDays) {
      return { hasTrial: false, isTrialActive: false, daysLeft: 0, startDate: null, endDate: null };
    }

    const startDateStr = course.publishDate || course.createdDate || '';
    if (!startDateStr) {
      return { hasTrial: true, isTrialActive: false, daysLeft: 0, startDate: null, endDate: null };
    }

    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const now = new Date();
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + course.trialDays);
    endDate.setHours(23, 59, 59, 999);

    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // trial starts on the course starting day.
    // If we are before the startDate, the trial is also active.
    const isTrialActive = now.getTime() <= endDate.getTime();

    return {
      hasTrial: true,
      isTrialActive: isTrialActive,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      startDate,
      endDate
    };
  };

  // Master base courses bank
  const [masterCourses, setMasterCourses, masterCoursesLoaded] = useFirebaseState<MasterCourse[]>('db-master-courses', INITIAL_MASTER_COURSES);

  // Student evolution months and scores (four evolutions system)
  const [studentEvolutions, setStudentEvolutions, studentEvolutionsLoaded] = useFirebaseState<StudentEvolution[]>('db-student-evolutions', []);

  const isDataLoaded = usersLoaded && schedulesLoaded && progressLoaded && notificationsLoaded && 
                       backupsLoaded && registrationLoaded && emailsLoaded && batchesLoaded && coursesLoaded && masterCoursesLoaded && assignmentsLoaded && studentEvolutionsLoaded && evolutionBankLoaded;

  // Navigation tab state
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'enrollments' | 'schedule' | 'lectures' | 'courses-directory' | 'progress' | 'reports' | 'backup' | 'inbox' | 'profile' | 'assignment-pipeline' | 'assignment-tracker' | 'evolution-pipeline'>('dashboard');

  // Control individual show variables inside ScheduleManager from the main sidebar
  const [scheduleShowAddForm, setScheduleShowAddForm] = useState(false);
  const [scheduleShowBatchManager, setScheduleShowBatchManager] = useState(false);
  const [scheduleShowCourseDashboard, setScheduleShowCourseDashboard] = useState(false);
  const [sharedEditingCourse, setSharedEditingCourse] = useState<Course | null>(null);

  // Vercel-style dashboard states
  const [adminDashboardSubTab, setAdminDashboardSubTab] = useState<'deployments' | 'overview' | 'logs' | 'env' | 'domains'>('deployments');
  const [vercelBranchFilter, setVercelBranchFilter] = useState('all');
  const [vercelAuthorFilter, setVercelAuthorFilter] = useState('all');
  const [vercelEnvironmentFilter, setVercelEnvironmentFilter] = useState('all');
  const [vercelDateFilter, setVercelDateFilter] = useState('all');
  const [vercelStatusFilter, setVercelStatusFilter] = useState('all');
  const [customDeployments, setCustomDeployments] = useState<any[]>([]);
  const [isSimulatedBuilding, setIsSimulatedBuilding] = useState(false);
  const [revealedEnvSecrets, setRevealedEnvSecrets] = useState<Record<string, boolean>>({});
  const [domainCheckStatus, setDomainCheckStatus] = useState<Record<string, 'idle' | 'checking' | 'active'>>({
    'learnora.edu': 'active',
    'learnora-preview.vercel.app': 'active',
    'learnora-dev.vercel.app': 'active'
  });

  useEffect(() => {
    if (activeTab !== 'schedule') {
      setScheduleShowAddForm(false);
      setScheduleShowBatchManager(false);
      setScheduleShowCourseDashboard(false);
    }
  }, [activeTab]);

  const getCurrentDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Automatically move upcoming courses to ongoing when start date or admission deadline is met
  useEffect(() => {
    if (!coursesLoaded || !courses || courses.length === 0) return;

    const todayStr = getCurrentDateString();
    let hasChanges = false;
    const updatedCourses = courses.map(course => {
      if (course.status === 'upcoming') {
        const hasStarted = course.publishDate && todayStr >= course.publishDate;
        const admissionClosed = course.admissionLastDate && todayStr > course.admissionLastDate;

        if (hasStarted || admissionClosed) {
          hasChanges = true;
          const reason = hasStarted ? "course start date reached" : "admission last date has passed";
          console.log(`Auto-transitioning course "${course.name}" to 'ongoing' status because ${reason}.`);
          return {
            ...course,
            status: 'ongoing' as const
          };
        }
      }
      return course;
    });

    if (hasChanges) {
      setCourses(updatedCourses);

      const notif: AppNotification = {
        id: generateUniqueId('notif'),
        title: 'Class Cohort Auto-Transitioned',
        message: 'One or more upcoming courses have officially started or passed their admission deadline, transferring them to current ongoing courses and closing new admissions.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
      triggerToast(notif);
    }
  }, [courses, coursesLoaded]);

  // Security Session Activity Auto-Logout
  const AUTO_LOGOUT_TIME_MS = 4 * 60 * 60 * 1000; // 4 hours of inactivity
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : true
  );
  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [ignoreHover, setIgnoreHover] = useState<boolean>(false);

  // Collapsible sidebar sub-menu states
  const [isStudentAcademicExpanded, setIsStudentAcademicExpanded] = useState<boolean>(true);
  const [isStaffAcademicExpanded, setIsStaffAcademicExpanded] = useState<boolean>(true);
  const [isSystemCategoriesExpanded, setIsSystemCategoriesExpanded] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [lastEmailStatus, setLastEmailStatus] = useState<{ success: boolean; error?: string; sending: boolean } | null>(null);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);


  const [fastFirstNameError, setFastFirstNameError] = useState('');
  const [fastLastNameError, setFastLastNameError] = useState('');
  const [fastEmailError, setFastEmailError] = useState('');
  const [fastEmailSuccess, setFastEmailSuccess] = useState('');
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
  const [emailOtpCooldown, setEmailOtpCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpHash, setOtpHash] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Queued email verification state for CAPTCHA interception
  const [emailChallengeQueue, setEmailChallengeQueue] = useState<{
    to: string;
    subject: string;
    text: string;
    html?: string;
    resolve: (value: { success: boolean; error?: string }) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  useEffect(() => {
    globalSendEmailInterceptor = (to: string, subject: string, text: string, html?: string) => {
      return new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
        setEmailChallengeQueue({ to, subject, text, html, resolve, reject });
      });
    };
    return () => {
      globalSendEmailInterceptor = null;
    };
  }, []);

  const [emailChallengeInput, setEmailChallengeInput] = useState('');
  const [emailChallengeText, setEmailChallengeText] = useState('');
  const [emailChallengeToken, setEmailChallengeToken] = useState('');
  const [emailChallengeError, setEmailChallengeError] = useState('');
  const [emailChallengeHoneypot, setEmailChallengeHoneypot] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    if (emailChallengeQueue) {
      setEmailChallengeInput('');
      setEmailChallengeError('');
      setEmailChallengeHoneypot('');
      setIsSendingEmail(false);
      
      const fetchNewChallenge = async () => {
        try {
          const res = await fetch('/api/get-challenge');
          if (res.ok) {
            const data = await res.json();
            setEmailChallengeText(data.challengeText);
            setEmailChallengeToken(data.challengeToken);
          } else {
            setEmailChallengeError("Could not load security check system. Please retry.");
          }
        } catch (err) {
          setEmailChallengeError("Network error initializing security check. Please check connection.");
        }
      };
      
      fetchNewChallenge();
    }
  }, [emailChallengeQueue]);

  const handleVerifyAndSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailChallengeQueue) return;
    
    if (emailChallengeHoneypot) {
      console.warn("Honeypot triggered inside email challenge.");
      emailChallengeQueue.resolve({ success: false, error: "Automated submission blocked." });
      setEmailChallengeQueue(null);
      return;
    }

    if (!emailChallengeInput) {
      setEmailChallengeError("Please solve the security challenge first.");
      return;
    }

    setIsSendingEmail(true);
    setEmailChallengeError('');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailChallengeQueue.to,
          subject: emailChallengeQueue.subject,
          text: emailChallengeQueue.text,
          html: emailChallengeQueue.html,
          challengeToken: emailChallengeToken,
          challengeAnswer: emailChallengeInput,
          secondaryEmail: emailChallengeHoneypot
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setEmailChallengeError(data.error || "Incorrect answer or dispatch rate limit exceeded. Please try again.");
        setIsSendingEmail(false);
        const chalRes = await fetch('/api/get-challenge');
        if (chalRes.ok) {
          const chalData = await chalRes.json();
          setEmailChallengeText(chalData.challengeText);
          setEmailChallengeToken(chalData.challengeToken);
          setEmailChallengeInput('');
        }
      } else {
        setIsSendingEmail(false);
        emailChallengeQueue.resolve({ success: true });
        setEmailChallengeQueue(null);
        
        const toastNotif: AppNotification = {
          id: 'email-sent-toast-' + Date.now(),
          title: 'Secure Email Dispatched',
          message: `Your message to ${emailChallengeQueue.to} has been cryptographically verified and sent.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'general',
          channel: 'system'
        };
        triggerToast(toastNotif);
      }
    } catch (err: any) {
      setEmailChallengeError(err.message || "Failed to communicate with the verification server.");
      setIsSendingEmail(false);
    }
  };

  const handleCancelEmailDispatch = () => {
    if (emailChallengeQueue) {
      emailChallengeQueue.resolve({ success: false, error: "Human verification challenge was not solved." });
      setEmailChallengeQueue(null);
    }
  };

  // Human verification states to prevent automated bot / attacker spam
  const [challengeText, setChallengeText] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [challengeInput, setChallengeInput] = useState('');
  const [showChallenge, setShowChallenge] = useState(false);
  const [secondaryEmail, setSecondaryEmail] = useState('');

  const fetchChallenge = async () => {
    try {
      const res = await fetch('/api/get-challenge');
      if (res.ok) {
        const data = await res.json();
        setChallengeText(data.challengeText);
        setChallengeToken(data.challengeToken);
        setChallengeInput('');
        setShowChallenge(true);
      }
    } catch (err) {
      console.error("Failed to fetch math challenge:", err);
    }
  };

  useEffect(() => {
    let timer: any;
    if (emailOtpCooldown > 0) {
      timer = setInterval(() => setEmailOtpCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpCooldown]);

  const handleSendEmailOtp = async () => {
    if (!fastEmail || !/\S+@\S+\.\S+/.test(fastEmail)) {
      setFastEmailError("Enter a valid email first");
      return;
    }

    if (!showChallenge) {
      await fetchChallenge();
      setFastEmailError("Please solve the human verification check below.");
      return;
    }

    if (!challengeInput) {
      setFastEmailError("Please solve the human verification check below.");
      return;
    }

    const emailLower = fastEmail.toLowerCase();
    
    // Check if email already registered
    const isRegistered = users.some(u => u.email.toLowerCase() === emailLower);
    const isPending = registrationRequests.some(r => r.email.toLowerCase() === emailLower && r.status === 'pending');
    
    if (isRegistered || isPending) {
      setFastEmailError("Mail id is already register");
      return;
    }

    setFastEmailError("");
    setFastEmailSuccess("");
    setSandboxOtp(null);
    setEmailVerState('sending');
    
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: fastEmail,
          challengeToken: challengeToken,
          challengeAnswer: challengeInput,
          secondaryEmail: secondaryEmail
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Refresh challenge immediately so they can solve a new one if it failed
        fetchChallenge();
        
        if (data.developerSandboxOtp) {
          setSandboxOtp(data.developerSandboxOtp);
          setEmailVerState('sent');
          setFastEmailError(data.error || "Sandbox restriction detected");
          return;
        } else {
          setEmailVerState('idle');
          throw new Error(data.error || "Failed to send OTP");
        }
      }
      
      setOtpHash(data.hash || "");
      if (data.developerSandboxOtp) {
        setSandboxOtp(data.developerSandboxOtp);
      }
      setEmailVerState('sent');
      setEmailOtpCooldown(60);
      if (data.note) {
        setFastEmailSuccess(data.note);
      }
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
    
    // Developer Sandbox Bypass
    if (sandboxOtp) {
      if (otpCode === sandboxOtp) {
        setEmailVerified(true);
        setFastEmailSuccess("Sandbox Email Verified!");
        setEmailVerState('idle');
        return;
      }
    }
    
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fastEmail, code: otpCode, hash: otpHash })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }
      
      setEmailVerified(true);
      setEmailVerState('idle');
      setFastEmailError('');
      setFastEmailSuccess('');
    } catch (err: any) {
      setFastEmailError(err.message || 'Invalid OTP');
      if (err.message?.toLowerCase().includes("request a new one")) {
        setEmailVerState('idle'); // allows them to request a new one
        setOtpCode('');
      }
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

  // English Placement Test Modal and Request state
  const [showExamModal, setShowExamModal] = useState(false);
  const [examRequest, setExamRequest] = useState<RegistrationRequest | null>(null);



  // Push notifications toast overlay state
  const [toastAlert, setToastAlert] = useState<AppNotification | null>(null);

  useEffect(() => {
    // Look for exam link in URL to trigger admission exam automatically
    const params = new URLSearchParams(window.location.search);
    const examEmail = params.get('examemail');
    if (examEmail && registrationRequests.length > 0 && !showExamModal && !examRequest) {
      const q = registrationRequests.find(r => r.email.toLowerCase() === examEmail.toLowerCase() && r.status === 'pending');
      if (q) {
        setExamRequest(q);
        setShowExamModal(true);
        // Clear param from URL so it doesn't trigger again continuously on re-renders if closed
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [registrationRequests, showExamModal, examRequest]);

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

  const handleImpersonateStudent = (student: UserAccount) => {
    if (!currentUser) return;
    if (!['admin', 'sub-admin'].includes(currentUser.role)) return;

    // Save original user
    setOriginalAdminUser(currentUser);
    // Switch active user to student
    setCurrentUser(student);

    triggerToast({
      id: `impersonate-${Date.now()}`,
      title: 'Emergency View Mode',
      message: `Impersonating student: ${student.name}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    });
  };

  const handleExitImpersonation = () => {
    if (!originalAdminUser) return;

    // Restore original user
    setCurrentUser(originalAdminUser);
    setOriginalAdminUser(null);

    triggerToast({
      id: `exit-impersonate-${Date.now()}`,
      title: 'View Mode Ended',
      message: 'Returned to administrator panel',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    });
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
    const generatedUsername = studentData.username || studentData.email.toLowerCase();
    const generatedPassword = studentData.password || `pass_${Math.floor(1000 + Math.random() * 9000)}`;
    const studentUid = generateUniversalId(users);

    const newStudent: UserAccount = {
      ...studentData,
      id: generateUniqueId('student'),
      joinedDate: new Date().toLocaleDateString('en-US'),
      universalId: studentUid,
      username: generatedUsername,
      password: generatedPassword,
      avatarUrl: studentData.avatarUrl || `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1506794778202-cad84cf45f1d', '1517841905240-472988babdf9', '1492562080023-ab3db95bfbce'][Math.floor(Math.random() * 4)]}?w=150`,
    };

    setUsers(prev => [...prev, newStudent]);

    const emailBodyTxt = `Dear ${newStudent.name},\n\nWelcome to Learnora Institute! An administrator has manually created and registered your student profile in our directory.\n\nYour profile is now active and ready for scheduling course timetables, joining live classes, or working with your assigned coach.\n\nPlease find your secure system access credentials and Universal ID below:\n\n-----------------------------\nUNIVERSAL STUDENT ID: ${studentUid}\nUSERNAME: ${generatedUsername}\nPASSWORD: ${generatedPassword}\n-----------------------------\n\nYou can use these credentials to sign in directly from the login tab. Keep this information confidential and do not share it with other students.\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`;
    sendSystemEmail(
      newStudent.email,
      'Welcome to Learnora! - Access Credentials & Quick Start',
      emailBodyTxt,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to Learnora!</h2>
        <p>Dear ${newStudent.name},</p>
        <p>Welcome to Learnora Institute! An administrator has manually created and registered your student profile in our directory.</p>
        <p>Your profile is now active and ready for scheduling course timetables, joining live classes, or working with your assigned coach.</p>
        <p>Please find your secure system access credentials and Universal ID below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
          <p style="margin: 0;"><strong>UNIVERSAL STUDENT ID:</strong> ${studentUid}</p>
          <p style="margin: 0;"><strong>USERNAME:</strong> ${generatedUsername}</p>
          <p style="margin: 0;"><strong>PASSWORD:</strong> ${generatedPassword}</p>
        </div>
        <p>You can use these credentials to sign in directly from the login tab. Keep this information confidential and do not share it with other students.</p>
        <p>Best regards,<br>Anik Baidya,<br>Head Administrator, Learnora Institute</p>
      </div>`
    );

    // System Notification Action
    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Student Account Registered',
      message: `Successful registration folder instantiated for ${newStudent.name} (Universal ID: ${studentUid}). Profile active and welcome email dispatched.`,
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

    const emailBodyTxt = `Dear ${newInstructor.name},\n\nWelcome to Learnora Institute! An administrator has manually created and registered your instructor profile in our directory.\n\nYour profile is now active and ready for managing schedules, conducting live classes, and tracking student progress.\n\nPlease find your secure system access credentials below:\n\n-----------------------------\nUSERNAME: ${newInstructor.username}\nPASSWORD: ${newInstructor.password}\n-----------------------------\n\nYou can use these credentials to sign in directly from the login tab. Keep this information confidential.\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`;
    sendSystemEmail(
      newInstructor.email,
      'Welcome to Learnora! - Instructor Access Credentials',
      emailBodyTxt,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to Learnora!</h2>
        <p>Dear ${newInstructor.name},</p>
        <p>Welcome to Learnora Institute! An administrator has manually created and registered your instructor profile in our directory.</p>
        <p>Your profile is now active and ready for managing schedules, conducting live classes, and tracking student progress.</p>
        <p>Please find your secure system access credentials below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
          <p style="margin: 0;"><strong>USERNAME:</strong> ${newInstructor.username}</p>
          <p style="margin: 0;"><strong>PASSWORD:</strong> ${newInstructor.password}</p>
        </div>
        <p>You can use these credentials to sign in directly from the login tab. Keep this information confidential.</p>
        <p>Best regards,<br>Anik Baidya,<br>Head Administrator, Learnora Institute</p>
      </div>`
    );

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Instructor Account Created',
      message: `New Instructor account configured for ${newInstructor.name} (${newInstructor.specialization || 'General'}). Credentialed access is active and welcome email dispatched.`,
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

    const emailBodyTxt = `Dear ${newSubAdmin.name},\n\nWelcome to Learnora Institute! An administrator has manually created and registered your sub-admin profile in our directory.\n\nYour professional access is now granted.\n\nPlease find your secure system access credentials below:\n\n-----------------------------\nUSERNAME: ${newSubAdmin.username}\nPASSWORD: ${newSubAdmin.password}\n-----------------------------\n\nYou can use these credentials to sign in directly from the login tab. Keep this information confidential.\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`;
    sendSystemEmail(
      newSubAdmin.email,
      'Welcome to Learnora! - Sub-Admin Access Credentials',
      emailBodyTxt,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2>Welcome to Learnora!</h2>
        <p>Dear ${newSubAdmin.name},</p>
        <p>Welcome to Learnora Institute! An administrator has manually created and registered your sub-admin profile in our directory.</p>
        <p>Your professional access is now granted.</p>
        <p>Please find your secure system access credentials below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
          <p style="margin: 0;"><strong>USERNAME:</strong> ${newSubAdmin.username}</p>
          <p style="margin: 0;"><strong>PASSWORD:</strong> ${newSubAdmin.password}</p>
        </div>
        <p>You can use these credentials to sign in directly from the login tab. Keep this information confidential.</p>
        <p>Best regards,<br>Anik Baidya,<br>Head Administrator, Learnora Institute</p>
      </div>`
    );

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Sub-Admin Account Created',
      message: `New Sub-Admin account configured for ${newSubAdmin.name}. Professional access is granted and welcome email dispatched.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleRemoveStudent = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    if (student) {
      setRegistrationRequests(prev => prev.filter(r => r.email.toLowerCase() !== student.email.toLowerCase()));
    }
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

  const handleUpdateClass = (updatedClass: ClassSchedule) => {
    setSchedules(prev => prev.map(cl => cl.id === updatedClass.id ? updatedClass : cl));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Class Schedule Updated',
      message: `The details for "${updatedClass.title}" have been successfully updated.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
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

  const handleAddMasterCourse = (newMaster: Omit<MasterCourse, 'id' | 'createdDate'>) => {
    const master: MasterCourse = {
      ...newMaster,
      id: generateUniqueId('master-course'),
      createdDate: new Date().toISOString().split('T')[0]
    };
    setMasterCourses(prev => [...prev, master]);

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'New Base Course Added',
      message: `Base Course "${master.name}" has been successfully added to the curriculum list.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleUpdateMasterCourse = (updatedMaster: MasterCourse) => {
    setMasterCourses(prev => prev.map(m => m.id === updatedMaster.id ? updatedMaster : m));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Base Course Updated',
      message: `Base Course "${updatedMaster.name}" has been updated.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleDeleteMasterCourse = (masterId: string) => {
    const masterToDelete = masterCourses.find(m => m.id === masterId);
    if (!masterToDelete) return;

    setMasterCourses(prev => prev.filter(m => m.id !== masterId));

    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Base Course Deleted',
      message: `Base Course "${masterToDelete.name}" has been removed.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    // 1. Get original course
    const originalCourse = courses.find(c => c.id === updatedCourse.id);

    // 2. Update courses
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));

    // 3. Dynamically sync course and batch details to all student records, lectures, assignments, registrations
    if (originalCourse) {
      const origName = originalCourse.name.trim().toLowerCase();
      const origCode = originalCourse.code?.trim().toLowerCase();
      const origBatchNumber = originalCourse.batchNumber?.trim().toLowerCase();

      // Sync student user records (including their assigned course and batch names/numbers)
      setUsers(prevUsers => prevUsers.map(u => {
        let updatedUser = { ...u };
        let matched = false;

        if (u.course) {
          const uCourseLower = u.course.trim().toLowerCase();
          if (uCourseLower === origName || (origCode && uCourseLower === origCode)) {
            updatedUser.course = updatedCourse.name;
            matched = true;
          }
        }

        if (matched || (u.batch && (
          (origBatchNumber && u.batch.trim().toLowerCase() === origBatchNumber) ||
          (origCode && u.batch.trim().toLowerCase() === origCode) ||
          (origBatchNumber && u.batch.trim().toLowerCase() === `batch ${origBatchNumber}`)
        ))) {
          if (u.batch && u.batch.toLowerCase().startsWith('batch ')) {
            updatedUser.batch = `Batch ${updatedCourse.batchNumber || 'stb_001'}`;
          } else {
            updatedUser.batch = updatedCourse.batchNumber || 'stb_001';
          }
        }
        return updatedUser;
      }));

      // Synchronize currently logged-in student profile if applicable
      if (currentUser) {
        let updatedCurrentUser = { ...currentUser };
        let matched = false;

        if (currentUser.course) {
          const uCourseLower = currentUser.course.trim().toLowerCase();
          if (uCourseLower === origName || (origCode && uCourseLower === origCode)) {
            updatedCurrentUser.course = updatedCourse.name;
            matched = true;
          }
        }

        if (matched || (currentUser.batch && (
          (origBatchNumber && currentUser.batch.trim().toLowerCase() === origBatchNumber) ||
          (origCode && currentUser.batch.trim().toLowerCase() === origCode) ||
          (origBatchNumber && currentUser.batch.trim().toLowerCase() === `batch ${origBatchNumber}`)
        ))) {
          if (currentUser.batch && currentUser.batch.toLowerCase().startsWith('batch ')) {
            updatedCurrentUser.batch = `Batch ${updatedCourse.batchNumber || 'stb_001'}`;
          } else {
            updatedCurrentUser.batch = updatedCourse.batchNumber || 'stb_001';
          }
        }

        if (matched || updatedCurrentUser.course !== currentUser.course || updatedCurrentUser.batch !== currentUser.batch) {
          setCurrentUser(updatedCurrentUser);
        }
      }

      // Sync class lectures / schedules (ClassSchedule)
      setSchedules(prevSchedules => prevSchedules.map(cl => {
        let updatedSchedule = { ...cl };
        let matched = false;

        if (cl.course) {
          const clCourseLower = cl.course.trim().toLowerCase();
          if (clCourseLower === origName || (origCode && clCourseLower === origCode)) {
            updatedSchedule.course = updatedCourse.name;
            matched = true;
          }
        }

        if (cl.batch) {
          const clBatchLower = cl.batch.trim().toLowerCase();
          if (
            clBatchLower === origName ||
            (origCode && clBatchLower === origCode) ||
            (origBatchNumber && clBatchLower === origBatchNumber) ||
            (origBatchNumber && clBatchLower === `batch ${origBatchNumber}`)
          ) {
            updatedSchedule.batch = updatedCourse.batchNumber || 'stb_001';
          }
        }

        return updatedSchedule;
      }));

      // Sync active student assignments (StudentAssignment)
      setAssignments(prevAssignments => prevAssignments.map(asg => {
        let updatedAsg = { ...asg };
        let matched = false;

        if (asg.course) {
          const asgCourseLower = asg.course.trim().toLowerCase();
          if (asgCourseLower === origName || (origCode && asgCourseLower === origCode)) {
            updatedAsg.course = updatedCourse.name;
            matched = true;
          }
        }

        if (asg.batch) {
          const asgBatchLower = asg.batch.trim().toLowerCase();
          if (
            asgBatchLower === origName ||
            (origCode && asgBatchLower === origCode) ||
            (origBatchNumber && asgBatchLower === origBatchNumber) ||
            (origBatchNumber && asgBatchLower === `batch ${origBatchNumber}`)
          ) {
            if (asgBatchLower !== 'all') {
              updatedAsg.batch = updatedCourse.batchNumber || 'stb_001';
            }
          }
        }

        return updatedAsg;
      }));

      // Sync and adapt registration intake requests (RegistrationRequest)
      setRegistrationRequests(prevRequests => prevRequests.map(r => {
        let updatedReq = { ...r };
        let matched = false;

        if (r.course) {
          const rCourseLower = r.course.trim().toLowerCase();
          if (rCourseLower === origName || (origCode && rCourseLower === origCode)) {
            updatedReq.course = updatedCourse.name;
            matched = true;
          }
        }

        if (r.batch) {
          const rBatchLower = r.batch.trim().toLowerCase();
          if (
            rBatchLower === origName ||
            (origCode && rBatchLower === origCode) ||
            (origBatchNumber && rBatchLower === origBatchNumber) ||
            (origBatchNumber && rBatchLower === `batch ${origBatchNumber}`)
          ) {
            if (r.batch.toLowerCase().startsWith('batch ')) {
              updatedReq.batch = `Batch ${updatedCourse.batchNumber || 'stb_001'}`;
            } else {
              updatedReq.batch = updatedCourse.batchNumber || 'stb_001';
            }
          }
        }

        return updatedReq;
      }));
    }

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

        // Auto mark as absent for students who didn't join!
        if (status === 'completed') {
          const targetStudents = users.filter(u => {
            if (u.role !== 'student') return false;
            const isExplicitlyEnrolled = cls.enrolledStudentIds?.includes(u.id);
            const isMyCourse = cls.course && u.course && cls.course.toLowerCase() === u.course.toLowerCase();
            const isAllCourse = !cls.course || cls.course === 'All';
            const matchesCourse = isMyCourse || isAllCourse || isExplicitlyEnrolled;

            const isMyBatch = cls.batch && u.batch && cls.batch.toLowerCase() === u.batch.toLowerCase();
            const isAllBatch = !cls.batch || cls.batch === 'All';
            const matchesBatch = isMyBatch || isAllBatch || isExplicitlyEnrolled;

            return matchesCourse && matchesBatch;
          });

          setProgressRecords(prev => {
            const newRecords: ProgressRecord[] = [];
            targetStudents.forEach(st => {
              const hasRecord = prev.some(r => r.studentId === st.id && r.classId === classId);
              if (!hasRecord) {
                const attended = cls.enrolledStudentIds?.includes(st.id);
                newRecords.push({
                  id: generateUniqueId('progress'),
                  studentId: st.id,
                  studentName: st.name,
                  classId: cls.id,
                  className: cls.title,
                  instructorId: cls.instructorId || 'admin-1',
                  instructorName: cls.instructorName || 'Center Administrator',
                  evaluationDate: new Date().toISOString().slice(0, 10),
                  subject: cls.subject,
                  score: attended ? 100 : 0,
                  attendanceStatus: attended ? 'present' : 'absent',
                  feedback: attended
                    ? 'Automatically marked present for attending the live session.'
                    : 'Automatically marked absent as student did not attend the live session.',
                  academicPerformance: attended ? 'excellent' : 'needs-improvement'
                });
              }
            });

            if (newRecords.length > 0) {
              return [...newRecords, ...prev];
            }
            return prev;
          });
        }
      }
    }
  };

  const handleAssignAssignment = (
    title: string,
    desc: string,
    dueDate: string,
    maxPts: number,
    cls: ClassSchedule,
    month?: string,
    syllabus?: string
  ) => {
    if (!currentUser) return;
    const newAsg: StudentAssignment = {
      id: generateUniqueId('asg'),
      title,
      description: desc,
      classId: cls.id,
      className: cls.title,
      course: cls.course || 'All',
      batch: cls.batch || 'All',
      instructorId: currentUser.id,
      instructorName: currentUser.name,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      maxPoints: maxPts || 100,
      status: 'published',
      createdDate: new Date().toISOString().split('T')[0],
      submissions: [],
      month,
      syllabus
    };

    setAssignments(prev => [newAsg, ...prev]);

    // Send Notifications to enrolled students
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (newAsg.batch === 'All' || u.batch === newAsg.batch) &&
      (newAsg.course === 'All' || u.course === newAsg.course)
    );

    targetStudents.forEach(st => {
      const notif: AppNotification = {
        id: generateUniqueId('notif-asg'),
        title: `📄 New Assignment: ${newAsg.title}`,
        message: `Instructor ${currentUser.name} assigned homework for class "${cls.title}". Due date: ${newAsg.dueDate}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
    });

    // Toast notice
    const toastNotif: AppNotification = {
      id: generateUniqueId('notif-toast'),
      title: 'Assignment Assigned',
      message: `Successfully published course assignment: "${newAsg.title}" for ${newAsg.batch}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    triggerToast(toastNotif);
  };

  const handleStudentSubmitAssignment = (
    asgId: string,
    ansText: string,
    fileUrnVal?: string,
    proctoringLogs?: any[],
    recordedVideoUrl?: string
  ) => {
    if (!currentUser) return;
    setAssignments(prev => prev.map(asg => {
      if (asg.id === asgId) {
        const existingSubIdx = asg.submissions.findIndex(s => s.studentId === currentUser.id);
        const newSub = {
          id: generateUniqueId('sub'),
          studentId: currentUser.id,
          studentName: currentUser.name,
          submittedDate: new Date().toISOString(),
          answerText: ansText,
          fileUrn: fileUrnVal || 'homework_solution_uploaded.pdf',
          status: 'pending' as const,
          proctoringLogs,
          recordedVideoUrl
        };

        let updatedSubmissions = [...asg.submissions];
        if (existingSubIdx >= 0) {
          updatedSubmissions[existingSubIdx] = newSub;
        } else {
          updatedSubmissions.push(newSub);
        }

        return {
          ...asg,
          submissions: updatedSubmissions
        };
      }
      return asg;
    }));

    // Toast
    const toastNotif: AppNotification = {
      id: generateUniqueId('notif-toast'),
      title: 'Assignment Submitted',
      message: `Your work has been submitted successfully and queued for grading.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
    };
    triggerToast(toastNotif);
  };

  const handleGradeSubmission = (
    asgId: string,
    subId: string,
    score: number,
    feedback: string
  ) => {
    if (!currentUser) return;
    let studentId = '';
    let studentName = '';
    let asgTitle = '';

    setAssignments(prev => prev.map(asg => {
      if (asg.id === asgId) {
        asgTitle = asg.title;
        const updatedSubs = asg.submissions.map(sub => {
          if (sub.id === subId) {
            studentId = sub.studentId;
            studentName = sub.studentName;
            return {
              ...sub,
              score,
              feedback,
              status: 'graded' as const
            };
          }
          return sub;
        });
        return {
          ...asg,
          submissions: updatedSubs
        };
      }
      return asg;
    }));

    // Inform student with notification
    if (studentId) {
      const notif: AppNotification = {
        id: generateUniqueId('notif-graded'),
        title: `⭐ Homework Graded: ${asgTitle}`,
        message: `Your solution for "${asgTitle}" was evaluated. Score: ${score}. Feedback: "${feedback || 'Excellent work!'}"`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'grade',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);

      const toastNotif: AppNotification = {
         id: generateUniqueId('notif-toast'),
         title: 'Grade Recorded',
         message: `Successfully graded ${studentName}'s homework. Saved: ${score} points.`,
         timestamp: new Date().toISOString(),
         read: false,
         type: 'general',
         channel: 'system'
      };
      triggerToast(toastNotif);
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

    const cls = schedules.find(c => c.id === classId);
    if (cls) {
      setProgressRecords(prev => {
        const hasRecord = prev.some(r => r.studentId === currentUser.id && r.classId === classId);
        if (!hasRecord) {
          return [{
            id: generateUniqueId('progress'),
            studentId: currentUser.id,
            studentName: currentUser.name,
            classId: classId,
            className: cls.title,
            instructorId: cls.instructorId || 'admin-1',
            instructorName: cls.instructorName || 'Center Administrator',
            evaluationDate: new Date().toISOString().slice(0, 10),
            subject: cls.subject,
            score: 100,
            attendanceStatus: 'present',
            feedback: 'Joined the live interactive class session.',
            academicPerformance: 'excellent'
          }, ...prev];
        }
        return prev;
      });
    }

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

  const handleStudentJoinClass = (classId: string) => {
    if (!currentUser || currentUser.role !== 'student') return;
    const cl = schedules.find(s => s.id === classId);
    if (!cl) return;

    // Check if progress record already exists
    const hasRecord = progressRecords.some(r => r.studentId === currentUser.id && r.classId === classId);
    if (!hasRecord) {
      const recordData: ProgressRecord = {
        id: generateUniqueId('progress'),
        studentId: currentUser.id,
        studentName: currentUser.name,
        classId: cl.id,
        className: cl.title,
        instructorId: cl.instructorId || 'admin-1',
        instructorName: cl.instructorName || 'Center Administrator',
        evaluationDate: new Date().toISOString().slice(0, 10),
        subject: cl.subject,
        score: 100, // full positive score for attending
        attendanceStatus: 'present',
        feedback: 'Student attended the class by clicking Join Class.',
        academicPerformance: 'good'
      };
      setProgressRecords(prev => [recordData, ...prev]);

      // Trigger a toast notifying student they've been marked present
      const notif: AppNotification = {
        id: generateUniqueId('notif'),
        title: 'Attendance Recorded',
        message: `Your attendance of "Present" has been recorded for session "${cl.title}".`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'enrollment',
        channel: 'system'
      };
      setNotifications(prev => [notif, ...prev]);
      triggerToast(notif);
    }
  };

  const handleSaveClassAttendance = (
    classId: string,
    studentAttendanceList: { studentId: string; status: 'present' | 'absent' | 'excused' }[]
  ) => {
    const cl = schedules.find(s => s.id === classId);
    if (!cl) return;

    setProgressRecords(prev => {
      // Filter out any existing records for this class for the targeted students
      const targetStudentIds = studentAttendanceList.map(a => a.studentId);
      const filtered = prev.filter(r => !(r.classId === classId && targetStudentIds.includes(r.studentId)));

      const newRecords: ProgressRecord[] = studentAttendanceList.map(item => {
        const student = users.find(u => u.id === item.studentId);
        return {
          id: generateUniqueId('progress'),
          studentId: item.studentId,
          studentName: student ? student.name : 'Unknown Student',
          classId: cl.id,
          className: cl.title,
          instructorId: cl.instructorId || 'admin-1',
          instructorName: cl.instructorName || 'Center Administrator',
          evaluationDate: new Date().toISOString().slice(0, 10),
          subject: cl.subject,
          score: item.status === 'present' ? 100 : 0, // Score 100 if present, 0 if absent/excused
          attendanceStatus: item.status,
          feedback: item.status === 'present' 
            ? 'Attendance marked: Student was Present.' 
            : item.status === 'absent' 
              ? 'Attendance marked: Student was Absent.' 
              : 'Attendance marked: Student was Excused.',
          academicPerformance: item.status === 'present' ? 'good' : 'needs-improvement'
        };
      });

      return [...newRecords, ...filtered];
    });

    // Notify
    const notif: AppNotification = {
      id: generateUniqueId('notif'),
      title: 'Attendance Sheet Updated',
      message: `Successfully saved attendance sheet with ${studentAttendanceList.length} student records for "${cl.title}".`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'system'
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
    course?: string,
    batch?: string
  ) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    
    // Auto-generate credentials
    const username = cleanEmail;
    
    const titleName = cleanName.split(' ')[0] || 'Student';
    const randomNum = Math.floor(100 + Math.random() * 900);
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
      course: course,
      batch: batch
    };

    setRegistrationRequests(prev => [newRequest, ...prev]);

    // Send a real email with the placement exam link
    const examUrl = `${window.location.protocol}//${window.location.host}/?examemail=${encodeURIComponent(cleanEmail)}`;
    setLastEmailStatus({ success: false, error: undefined, sending: true });
    sendSystemEmail(
      cleanEmail,
      'Learnora Admissions: Mandatory English Placement Exam Link',
      `Dear ${cleanName},\n\nThank you for applying to Learnora Institute. We've received your fast student admission registration details!\n\nTo complete your enrollment automatically, you are required to take a brief, mandatory English Placement Examination. This test evaluates:\n\n1. English Reading Comprehension Test (2 multiple choice questions)\n2. English Speaking voice articulation evaluation test (read passage aloud)\n\nPassing Criteria: A score of 25% or more on this test will trigger INSTANT AUTOMATIC ADMISSION.\n\nTake the exam now by clicking this link:\n${examUrl}\n\nGood luck!`,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #f59e0b;">Learnora Admissions</h2>
        <p>Dear ${cleanName},</p>
        <p>Thank you for applying to Learnora Institute. We've received your fast student admission registration details!</p>
        <p>To complete your enrollment automatically, you are required to take a brief, mandatory English Placement Examination. This test evaluates:</p>
        <ol>
          <li>English Reading Comprehension Test (2 multiple choice questions)</li>
          <li>English Speaking voice articulation evaluation test (read passage aloud)</li>
        </ol>
        <p><strong>Passing Criteria:</strong> A score of 25% or more on this test will trigger <strong>INSTANT AUTOMATIC ADMISSION</strong> under the administration rules. Your permanent student username and login credentials will then be automatically generated and sent to you!</p>
        <div style="margin: 30px 0;">
          <a href="${examUrl}" style="background-color: #f59e0b; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">Launch Admission Exam Now &rarr;</a>
        </div>
        <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${examUrl}</small></p>
      </div>`
    ).then(res => {
      setLastEmailStatus({ success: res.success, error: res.error, sending: false });
    });

    // Send a system event notice to the logs
    const notif: AppNotification = {
      id: generateUniqueId('notif-req'),
      title: 'Admission Request Pending',
      message: `${cleanName} registered via fast student registration. English selection test dispatched to student inbox.`,
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

    const studentUid = generateUniversalId(users);

    // Add user profile
    const newStudent: UserAccount = {
      id: generateUniqueId('student'),
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: 'student',
      joinedDate: new Date().toLocaleDateString('en-US'),
      assignedInstructorId: r.assignedInstructorId,
      universalId: studentUid,
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

    const loginUrl = `${window.location.protocol}//${window.location.host}/`;
    const emailBodyTxt = `Dear ${r.name},\n\nWe are absolutely delighted to inform you that your Enrollment Request has been APPROVED and your profile instantiated within our main Student Ledger database. Your auto-generated security credentials and Universal ID are listed below:\n\n-----------------------------\nUNIVERSAL STUDENT ID: ${studentUid}\nUSERNAME: ${r.username}\nPASSWORD: ${r.password}\n-----------------------------\n\nPlease log in here: ${loginUrl}\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`;
    
    sendSystemEmail(
      r.email,
      'Learnora Admission Approved! - Credentials Enclosed',
      emailBodyTxt,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2>Learnora Admissions</h2>
        <p>Dear ${r.name},</p>
        <p>We are absolutely delighted to inform you that your Enrollment Request has been <strong>APPROVED</strong> and your profile instantiated within our main Student Ledger database. Your auto-generated security credentials and Universal ID are listed below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
          <p style="margin: 0;"><strong>UNIVERSAL STUDENT ID:</strong> ${studentUid}</p>
          <p style="margin: 0;"><strong>USERNAME:</strong> ${r.username}</p>
          <p style="margin: 0;"><strong>PASSWORD:</strong> ${r.password}</p>
        </div>
        <p><a href="${loginUrl}" style="background-color: #10b981; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">Log In Now</a></p>
        <p>Best regards,<br>Anik Baidya,<br>Head Administrator, Learnora Institute</p>
      </div>`
    );

    // Trigger Notification
    const notif: AppNotification = {
      id: generateUniqueId('notif-appr'),
      title: 'Admissions Request Accepted',
      message: `Student account created for ${r.name} (Universal ID: ${studentUid}). Security credentials dispatched to email.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };

    setUsers(u => [...u, newStudent]);
    setNotifications(n => [notif, ...n]);
    triggerToast(notif);

    setRegistrationRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'approved' };
      }
      return req;
    }));
  };

  const handleAutoApproveRegistration = (requestId: string, score: number) => {
    let r = registrationRequests.find(req => req.id === requestId);
    if (!r && examRequest && examRequest.id === requestId) {
      r = examRequest;
    }
    if (!r) return;

    // Check if user already exists to prevent duplicate profiles
    const alreadyAdmitted = users.some(u => u.email.toLowerCase() === r!.email.toLowerCase());
    if (alreadyAdmitted) {
      console.log("User already exists with email, skipping duplicate creation:", r.email);
      return;
    }

    const studentUid = generateUniversalId(users);

    // Add user profile
    const newStudent: UserAccount = {
      id: generateUniqueId('student'),
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: 'student',
      joinedDate: new Date().toLocaleDateString('en-US'),
      assignedInstructorId: r.assignedInstructorId,
      universalId: studentUid,
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

    const loginUrl = `${window.location.protocol}//${window.location.host}/`;
    const emailBodyTxt = `Dear ${r.name},\n\nWe are absolutely delighted to inform you that you have PASSED the Mandatory English Placement Exam with a qualifying score of ${score}% (Threshold: 25% for auto-admission)!\n\nAs a result, your enrollment has been AUTOMATICALLY APPROVED and instantiated within our main Student Ledger database. Your auto-generated security credentials and Universal ID are listed below:\n\n-----------------------------\nUNIVERSAL STUDENT ID: ${studentUid}\nUSERNAME: ${r.username}\nPASSWORD: ${r.password}\n-----------------------------\n\nPlease log in here: ${loginUrl}\n\nBest regards,\nAnik Baidya,\nHead Administrator, Learnora Institute`;
    
    sendSystemEmail(
      r.email,
      'Learnora Admission Automatic Approval! - Credentials Enclosed',
      emailBodyTxt,
      `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
        <h2>Learnora Admissions</h2>
        <p>Dear ${r.name},</p>
        <p>We are absolutely delighted to inform you that you have <strong>PASSED</strong> the Mandatory English Placement Exam with a qualifying score of <strong>${score}%</strong> (Threshold: 25% for auto-admission)!</p>
        <p>As a result, your enrollment has been <strong>AUTOMATICALLY APPROVED</strong> and instantiated within our main Student Ledger database. Your auto-generated security credentials and Universal ID are listed below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace;">
          <p style="margin: 0;"><strong>UNIVERSAL STUDENT ID:</strong> ${studentUid}</p>
          <p style="margin: 0;"><strong>USERNAME:</strong> ${r.username}</p>
          <p style="margin: 0;"><strong>PASSWORD:</strong> ${r.password}</p>
        </div>
        <p><a href="${loginUrl}" style="background-color: #10b981; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">Log In Now</a></p>
        <p>Best regards,<br>Anik Baidya,<br>Head Administrator, Learnora Institute</p>
      </div>`
    );

    // Trigger Notification
    const notif: AppNotification = {
      id: generateUniqueId('notif-appr'),
      title: 'Auto Admission Passed!',
      message: `${r.name} (Universal ID: ${studentUid}) achieved a scoring grade of ${score}% on their entrance test. Admitted automatically.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };

    setUsers(u => [...u, newStudent]);
    setNotifications(n => [notif, ...n]);
    triggerToast(notif);

    const rId = r.id;
    const existsInRequests = registrationRequests.some(req => req.id === rId);
    if (existsInRequests) {
      setRegistrationRequests(prev => prev.map(req => {
        if (req.id === rId) {
          return { 
            ...req, 
            status: 'approved',
            examScore: score,
            examPassed: true
          };
        }
        return req;
      }));
    } else {
      const updatedReq: RegistrationRequest = {
        ...r,
        status: 'approved',
        examScore: score,
        examPassed: true
      };
      setRegistrationRequests(prev => [updatedReq, ...prev]);
    }
  };

  const handleExamFinished = (requestId: string, score: number) => {
    if (score >= 25) {
      handleAutoApproveRegistration(requestId, score);
      return;
    }

    // Fail case: record failed state but keep status as pending
    let r = registrationRequests.find(req => req.id === requestId);
    if (!r && examRequest && examRequest.id === requestId) {
      r = examRequest;
    }
    if (!r) return;

    const rId = r.id;
    const existsInRequests = registrationRequests.some(req => req.id === rId);
    if (existsInRequests) {
      setRegistrationRequests(prev => prev.map(req => {
        if (req.id === rId) {
          return { 
            ...req, 
            status: 'pending',
            examScore: score,
            examPassed: false
          };
        }
        return req;
      }));
    } else {
      const updatedReq: RegistrationRequest = {
        ...r,
        status: 'pending',
        examScore: score,
        examPassed: false
      };
      setRegistrationRequests(prev => [updatedReq, ...prev]);
    }

    // Send failure/encouragement email to the student (never send approval details if failed)
    const emailBodyTxt = `Dear ${r.name},\n\nThank you for taking the Language Placement Exam for Learnora.\n\nYour score is ${score}%, which is below our auto-approval threshold of 25%.\n\nDo not worry! You have 3 total attempts to clear the exam. Please prepare and try again.\n\nBest regards,\nAdmissions Office,\nLearnora Institute`;
    sendSystemEmail(
      r.email,
      'Learnora Placement Exam Update - Attention Required',
      emailBodyTxt
    );

    // Trigger Fail Notification
    const notif: AppNotification = {
      id: generateUniqueId('notif-fail'),
      title: 'Entrance Exam Attempt Completed',
      message: `${r.name} completed their entrance test with a grade of ${score}%. Minimum 25% required for auto-admission.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };
    setNotifications(n => [notif, ...n]);
    triggerToast(notif);
  };

  const handleRejectRegistration = (requestId: string) => {
    const r = registrationRequests.find(req => req.id === requestId);
    if (!r || r.status !== 'pending') return;

    const emailBodyTxt = `Dear ${r.name},\n\nThank you for submitting your Fast Student Registration Request with Learnora.\n\nAfter reviewing your application coordinates, we regret to inform you that our classes are currently at maximum capacity, and we cannot approve your enrollment at this time.\n\nWe have retained your interest profile on our priority waiting list. Should seats open up in upcoming sessions, we will reach out immediately.\n\nBest regards,\nCenter Administration,\nLearnora Institute`;

    sendSystemEmail(
      r.email,
      'Learnora Registration Status Update',
      emailBodyTxt
    );

    setRegistrationRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleUpdateRegistrationRequest = (updatedReq: RegistrationRequest) => {
    const originalReq = registrationRequests.find(r => r.id === updatedReq.id);
    const dateChanged = originalReq?.interviewDate !== updatedReq.interviewDate || originalReq?.interviewTime !== updatedReq.interviewTime;
    const statusChanged = originalReq?.interviewStatus !== updatedReq.interviewStatus;

    if (updatedReq.interviewStatus === 'scheduled' && (dateChanged || statusChanged)) {
      // Send real interview invite email
      const emailBodyTxt = `Dear ${updatedReq.name},\n\nWe are pleased to inform you that we have scheduled an interview regarding your admission application at Learnora Institute.\n\nHere are your scheduled details:\n\n- Date: ${updatedReq.interviewDate || 'To be selected'}\n- Time: ${updatedReq.interviewTime || 'To be selected'}\n- Status: Scheduled\n- Notes: ${updatedReq.interviewNotes || 'No notes provided.'}\n\nPlease make sure to be available at this designated slot.\n\nBest regards,\nAdmissions Office,\nLearnora Institute`;
      sendSystemEmail(
        updatedReq.email,
        `Learnora Admission - Interview Scheduled for ${updatedReq.name}`,
        emailBodyTxt
      );
    }

    setRegistrationRequests(prev => prev.map(req => req.id === updatedReq.id ? updatedReq : req));
    
    const notif: AppNotification = {
      id: generateUniqueId('notif-int'),
      title: 'Interview System Sync',
      message: `Interview details for ${updatedReq.name} have been updated.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'enrollment',
      channel: 'push'
    };
    setNotifications(prev => [notif, ...prev]);
    triggerToast(notif);
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

    // Send real email
    sendSystemEmail(toEmail, subject, body, body.replace(/\n/g, '<br>'));

    // Record in local database/state for visual mailbox tracking
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
    } else if (!/\S+@\S+\.\S+/.test(fastEmail)) {
      setFastEmailError('Please enter a valid email address');
      hasError = true;
    } else if (!emailVerified) {
      setFastEmailError('Please verify your email address via OTP');
      hasError = true;
    } else if (users.some(u => u.email.toLowerCase() === fastEmail.toLowerCase()) || 
               registrationRequests.some(r => r.email.toLowerCase() === fastEmail.toLowerCase() && r.status === 'pending')) {
      setFastEmailError('Mail id is already register');
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

    const parsedCourse = fastCourse.includes('::') ? fastCourse.split('::')[0] : fastCourse;
    const parsedBatch = fastCourse.includes('::') ? fastCourse.split('::')[1] || '' : '';

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
      parsedCourse,
      parsedBatch
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
      
      {originalAdminUser && currentUser && (
        <div className="sticky top-0 z-[9999] w-full bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 font-sans border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-100 animate-pulse flex-shrink-0" />
            <p className="text-xs md:text-sm font-semibold tracking-wide">
              EMERGENCY IMPERSONATION: Currently viewing student profile for <span className="underline font-bold">{currentUser.name}</span> ({currentUser.username || currentUser.email})
            </p>
          </div>
          <button
            type="button"
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-amber-700 dark:text-amber-800 hover:bg-amber-50 font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Exit View Mode
          </button>
        </div>
      )}

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
              <p className="text-sm text-gray-300 leading-relaxed mt-0.5">{toastAlert.message}</p>
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

                    {/* Interactive Exam Link / Action Button */}
                    {selectedMail.subject.includes("Mandatory English Placement Exam Link") && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center text-center space-y-2 mt-4">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          Learnora Admissions Online Placement System
                        </p>
                        <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md leading-relaxed">
                          Clicking this button opens the remote examination interface, administering synchronous English Reading and Vocal speaking modules.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const req = registrationRequests.find(r => r.email.toLowerCase() === selectedMail.to.toLowerCase());
                            if (req) {
                              setExamRequest(req);
                              setShowExamModal(true);
                              setShowMailbox(false);
                            } else {
                              triggerToast({
                                id: generateUniqueId('notif-err'),
                                title: 'Exam System Error',
                                message: 'No registered applicant record matched this email address in the database ledger.',
                                timestamp: new Date().toISOString(),
                                read: false,
                                type: 'enrollment',
                                channel: 'system'
                              });
                            }
                          }}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-955 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md animate-pulse"
                        >
                          Launch Admission Exam Now &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Emails List View */
                  <div className="space-y-3">
                    <p className="text-sm font-mono uppercase text-slate-400 tracking-wider">Simulated Inbound Transmissions ({simulatedEmails.filter(m => m.to.toLowerCase() === activeMailboxEmail.toLowerCase()).length})</p>
                    {simulatedEmails.filter(m => m.to.toLowerCase() === activeMailboxEmail.toLowerCase()).length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-gray-500 font-mono text-xs">
                        No emails detected in this sandbox ledger yet.<br />
                        <span className="text-sm block mt-2.5 text-amber-500 font-bold bg-amber-500/5 p-3 rounded-xl max-w-sm mx-auto border border-amber-500/10">
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
                                <span className="font-mono text-sm text-amber-500 font-bold">{mail.from}</span>
                                <span className="text-sm text-slate-400">{new Date(mail.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate">{mail.subject}</p>
                              <p className="text-sm text-slate-500 dark:text-gray-400 truncate leading-none mt-1">{mail.body.substring(0, 90)}...</p>
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
          <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 bg-white dark:bg-[#070708] dark:text-gray-200 animate-fadeIn font-sans z-0">
            {/* Background elements removed for a clean look */}

            <div className={`w-full bg-white/80 backdrop-blur-xl dark:bg-[#0F0F11]/90 border border-white/40 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 z-10 ${
              onboardingTab === 'fastReg' ? 'max-w-2xl' : 'max-w-[460px] flex flex-col gap-6'
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
                    className="text-xs font-sans font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 py-1 px-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-2xs active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 -ml-0.5" /> Back to Home
                  </button>
                </div>
              )}

              {/* Left section: Sandbox switch, quick profiles accounts, and student mail client */}
              {onboardingTab !== 'fastReg' && (
                <div className="w-full space-y-3 flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-slate-800 origin-left scale-90">
                      <Logo size="sm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPortal(false)}
                      className="text-xs font-sans font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 py-1 px-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 shadow-2xs active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 -ml-0.5" /> Back
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                    Interactive educational control center. Experience student sandbox, administrators, and automated flows.
                  </p>
                </div>
              )}

              {/* Right section: Signup workspace and authentication */}
              <div className={onboardingTab === 'fastReg' ? 'w-full' : 'w-full bg-white dark:bg-[#111112] p-6 rounded-2xl border border-slate-150 dark:border-white/5 space-y-5 flex flex-col justify-start shadow-md relative animate-fadeIn'}>
                <div className="absolute top-0 right-0 h-32 w-32 bg-radial-gradient from-amber-500/10 to-transparent rounded-full pointer-events-none" />
                
                {/* Onboarding Mode Selection Tabs */}
                {onboardingTab !== 'fastReg' && (
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 dark:bg-[#070708] rounded-2xl border border-slate-150 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => { setOnboardingTab('authLogin'); setLoginError(''); }}
                      className={`py-3 px-3 rounded-xl text-center font-bold text-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                        onboardingTab === 'authLogin'
                          ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5 scale-[1.02]'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 hover:bg-slate-50/50 dark:hover:bg-white/5'
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
                          ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/5 scale-[1.02]'
                          : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 hover:bg-slate-50/50 dark:hover:bg-white/5'
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
                    <div className="mb-6">
                      <h3 className="text-3xl font-serif italic text-slate-900 dark:text-white font-bold tracking-tight mb-3">Student Admission Portal</h3>
                      <p className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed font-sans mt-2">
                        Register to enter our coaching workflow. Administrators dynamically review queue requests, issue verified account records upon acceptance, and securely dispatch login details to your inbox.
                      </p>
                    </div>

                    {fastRegSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-6 space-y-6 font-sans max-w-xl text-slate-900 dark:text-white"
                      >
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                          Admission Enrolled
                        </h2>
                        
                        <div className="space-y-4 text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-350">
                          <p>
                            Student application details for <strong className="font-semibold text-slate-900 dark:text-white">{fastRegSuccess.name}</strong> have been securely enqueued in the active admin queue.
                          </p>
                          <p>
                            The assigned email address is <strong className="font-semibold text-slate-900 dark:text-white">{fastRegSuccess.email}</strong>, and the selected course track is <strong className="font-semibold text-slate-900 dark:text-white">{fastRegSuccess.course || "Default"}</strong>.
                          </p>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                          {(() => {
                            const req = registrationRequests.find(r => r.id === fastRegSuccess.id);
                            if (req?.status === 'approved') {
                              return (
                                <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium px-5 py-2.5 rounded-xl text-sm text-center">
                                  You have already cleared the exam.
                                </div>
                              );
                            }
                            
                            const attempts = parseInt(localStorage.getItem(`exam_attempts_${fastRegSuccess.id}`) || '0', 10);
                            if (attempts >= 3) {
                              return (
                                <div className="bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium px-5 py-2.5 rounded-xl text-sm text-center">
                                  You have run out of attempts (3/3 used).
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setExamRequest(fastRegSuccess);
                                  setShowExamModal(true);
                                }}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer hover:opacity-90 flex items-center justify-center gap-1.5"
                              >
                                {attempts > 0 ? `Retake Exam (${3 - attempts} left)` : 'Launch Exam Now'}
                              </button>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => {
                              setFastRegSuccess(null);
                              setCurrentRegStep(1);
                              setLastEmailStatus(null);
                            }}
                            className="text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-4 py-2.5 transition-all text-center rounded-xl bg-slate-100 hover:bg-slate-150 dark:bg-white/5 dark:hover:bg-white/10"
                          >
                            New Student Application &rarr;
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        {/* Interactive Form Fields */}
                        <form onSubmit={handleFastStudentSubmit} className="space-y-6" noValidate>
                        
                          {/* Profile Photo Upload */}
                          <div className="space-y-2 p-4 bg-slate-50 dark:bg-[#080809] rounded-2xl border border-slate-200/60 dark:border-white/5">
                                <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Profile Photo Asset (Maximum 2MB) *</label>
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
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          setFastAvatarError('');
                                          const compressedUrl = await compressImage(file);
                                          setFastAvatarUrl(compressedUrl);
                                        } catch (err) {
                                          setFastAvatarError("Could not process photo");
                                          setFastAvatarUrl('');
                                        }
                                        e.target.value = '';
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="fast-student-avatar-upload"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#111112] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                      {fastAvatarUrl ? 'Change Avatar Asset' : 'Upload Student Photo'}
                                    </label>
                                    <p className="text-[11px] text-slate-450 dark:text-gray-500 leading-snug">
                                      Supports JPEG, PNG, WebP format. Maximum file size budget: 2MB.
                                    </p>
                                    {fastAvatarError && (
                                      <p className="text-sm text-rose-500 dark:text-rose-455 font-bold leading-tight mt-1">
                                        {fastAvatarError}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Student Legal Name */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">First Name *</label>
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
                                    <p className="text-sm text-rose-500 mt-1 font-semibold">{fastFirstNameError}</p>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Last Name *</label>
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
                                    <p className="text-sm text-rose-500 mt-1 font-semibold">{fastLastNameError}</p>
                                  )}
                                </div>
                              </div>

                              {/* Student Target Program Course Selection */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Desired Professional Course *</label>
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
                                  {courses.filter(c => c.status === 'upcoming').map(c => (
                                    <option key={c.id} value={`${c.name}::${c.batchNumber || ''}`}>{c.name} {c.batchNumber ? `(Batch: ${c.batchNumber})` : ''}</option>
                                  ))}
                                </select>
                                {fastCourseError && (
                                  <p className="text-sm text-rose-500 mt-1 font-semibold">{fastCourseError}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email address */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Email Address *</label>
                                  <div className="flex flex-col gap-2">
                                    {/* Honeypot field - hidden from humans */}
                                    <div className="absolute overflow-hidden -top-96 -left-96 w-0 h-0 opacity-0 pointer-events-none select-none" aria-hidden="true">
                                      <label htmlFor="secondaryEmail">Secondary Email (Leave Blank)</label>
                                      <input 
                                        id="secondaryEmail"
                                        type="email"
                                        name="secondaryEmail"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={secondaryEmail}
                                        onChange={e => setSecondaryEmail(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                            if (/\S+@\S+\.\S+/.test(e.target.value) && !showChallenge) {
                                              fetchChallenge();
                                            }
                                          }}
                                          className={`w-full pl-9 pr-3 py-3 text-xs bg-slate-50 dark:bg-[#070708] rounded-xl border ${fastEmailError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/5'} focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-855 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 transition-all font-sans disabled:opacity-75 disabled:cursor-not-allowed`}
                                        />
                                      </div>
                                      {!emailVerified && (
                                        <button
                                          type="button"
                                          onClick={handleSendEmailOtp}
                                          disabled={emailVerState === 'sending' || emailOtpCooldown > 0}
                                          className="px-4 bg-slate-800 dark:bg-amber-500 hover:bg-slate-900 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                                        >
                                          {emailVerState === 'sending' 
                                            ? 'Sending...' 
                                            : emailOtpCooldown > 0 
                                              ? `Resend in ${emailOtpCooldown}s` 
                                              : emailVerState === 'sent' 
                                                ? 'Resend OTP' 
                                                : 'Send OTP'}
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* Advanced Human Cryptographic Verification Check */}
                                    {showChallenge && !emailVerified && (
                                      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 p-3 rounded-xl space-y-2.5 mt-1 transition-all animate-fadeIn">
                                        <div className="flex justify-between items-center">
                                          <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Human Verification Required
                                          </label>
                                          <button 
                                            type="button" 
                                            onClick={fetchChallenge} 
                                            className="text-[10px] text-amber-500 hover:underline font-medium"
                                            title="Get a new question"
                                          >
                                            Refresh Challenge
                                          </button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                          <div className="text-xs font-bold font-mono text-slate-700 dark:text-zinc-100 bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/5 select-none whitespace-nowrap tracking-wide">
                                            {challengeText} =
                                          </div>
                                          <input
                                            type="text"
                                            required
                                            maxLength={3}
                                            placeholder="?"
                                            value={challengeInput}
                                            onChange={e => setChallengeInput(e.target.value.replace(/\D/g, ''))}
                                            className="w-16 px-2.5 py-1.5 text-xs bg-white dark:bg-[#070708] rounded-lg border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-100 font-bold text-center"
                                          />
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-gray-500 leading-normal">
                                          Please solve the simple math puzzle above before requesting or resending an OTP code.
                                        </p>
                                      </div>
                                    )}
                                    {emailVerState === 'sent' && !emailVerified && (
                                      <div className="flex flex-col gap-2 animate-fadeIn">
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP"
                                            value={otpCode}
                                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                            className="flex-1 px-3 py-3 text-sm bg-slate-50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 dark:text-gray-100 transition-all text-center"
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
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium px-1">
                                          An OTP has been sent to your email.
                                        </p>
                                        {sandboxOtp && (
                                          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-3 text-[11px] font-medium text-slate-600 dark:text-gray-400 mt-1">
                                            <p className="font-bold flex items-center gap-1 text-slate-700 dark:text-gray-300">
                                              <Shield className="w-3.5 h-3.5" /> Developer Sandbox Bypass OTP
                                            </p>
                                            <p className="mt-1">
                                              Because of email quota limits, please enter this code to complete verification: <span className="font-mono bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-slate-800 dark:text-white select-all whitespace-nowrap">{sandboxOtp}</span>
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {emailVerified && (
                                      <p className="text-xs text-emerald-500 mt-1 font-bold flex items-center gap-1.5 animate-fadeIn">
                                        <Check className="w-3.5 h-3.5" /> Email successfully verified.
                                      </p>
                                    )}
                                    {fastEmailError && (
                                      <p className="text-xs text-rose-500 mt-1.5 font-medium px-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fastEmailError}</p>
                                    )}
                                  </div>
                                  {fastEmailSuccess && (
                                    <p className="text-xs text-amber-500 mt-1.5 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-normal">{fastEmailSuccess}</p>
                                  )}
                                </div>

                                {/* Phone number */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Phone Number *</label>
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
                                    <p className="text-sm text-rose-500 mt-1 font-semibold">{fastPhoneError}</p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Gender selection */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Gender *</label>
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
                                    <p className="text-sm text-rose-500 mt-1 font-semibold">{fastGenderError}</p>
                                  )}
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Date of Birth *</label>
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
                                    <p className="text-sm text-rose-500 mt-1 font-semibold">{fastDobError}</p>
                                  )}
                                </div>
                              </div>

                              {/* Father's name */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Father's Full Name *</label>
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
                                  <p className="text-sm text-rose-500 mt-1 font-semibold">{fastFatherNameError}</p>
                                )}
                              </div>

                              {/* Prior Academic background status */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Last Completed Qualification *</label>
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
                                      <label className="text-xs font-medium text-slate-550 dark:text-gray-400 block mb-1">Standard Class Level *</label>
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
                                      <label className="text-xs font-medium text-slate-550 dark:text-gray-400 block mb-1">Degree / Specialization Name *</label>
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
                                  <p className="text-sm text-rose-500 mt-1 font-semibold">{fastLastQualificationError}</p>
                                )}
                              </div>

                              {/* Address */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-550 dark:text-gray-400 block mb-1">Full Residential Address *</label>
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
                                  <p className="text-sm text-rose-500 mt-1 font-semibold">{fastAddressError}</p>
                                )}
                              </div>

                          {/* Submit Admission Application */}
                          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                              <button
                                type="submit"
                                disabled={!emailVerified}
                                className={`px-6 py-3.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-md flex items-center justify-center w-full sm:w-auto gap-2 ml-auto ${emailVerified ? 'bg-[#111112] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-black active:scale-[0.98] cursor-pointer' : 'bg-slate-200 dark:bg-[#1C1C1F] text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                              >
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
                    <div className="mb-6">
                      <h3 className="text-2xl font-serif italic text-slate-900 dark:text-white font-bold tracking-tight mb-3">Approved Account Login</h3>
                      <p className="text-[9px] text-slate-500 dark:text-gray-400 leading-relaxed font-sans mt-2">
                        Access your profile, courses, and educational schedules using the verified credentials (USERNAME &amp; PASSWORD) delivered to your registered email address.
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
                        <label className="text-[12px] font-sans text-slate-600 dark:text-slate-400 block font-semibold mb-1">Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Username"
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 text-slate-800 dark:text-gray-100 placeholder-slate-450 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[12px] font-sans text-slate-600 dark:text-slate-400 block font-semibold">Security Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmailInput('');
                              setForgotModalSuccess('');
                              setForgotModalError('');
                              setForgotEmailModalOpen(true);
                            }}
                            className="text-xs text-slate-500 dark:text-amber-500 hover:text-slate-800 dark:hover:text-amber-400 font-semibold transition cursor-pointer select-none outline-none"
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
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 text-slate-800 dark:text-gray-100 placeholder-slate-450 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#111112] hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2"
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
                        className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-medium"
                      >
                        Need admission? <span className="text-slate-900 dark:text-white hover:underline font-bold">Apply for Learnora admission &rarr;</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Form 3: Administrator Sign In */}
              {onboardingTab === 'adminLogin' && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-0.5 px-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 rounded-md text-sm font-sans font-bold uppercase tracking-widest border border-slate-200 dark:border-white/5 shadow-sm">
                           Restricted Entry
                        </span>
                      </div>
                      <h3 className="text-3xl font-serif italic text-slate-900 dark:text-white font-bold tracking-tight mb-3">Administrator Terminal</h3>
                      <p className="text-[9px] text-slate-500 dark:text-gray-400 leading-relaxed font-sans mt-2">
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
                        <label className="text-[12px] font-sans text-slate-600 dark:text-slate-400 block font-semibold mb-1">Admin Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Admin"
                            value={loginUsername}
                            onChange={e => setLoginUsername(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 text-slate-800 dark:text-gray-100 placeholder-slate-450 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[12px] font-sans text-slate-600 dark:text-slate-400 block font-semibold">Override Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotEmailInput('');
                              setForgotModalSuccess('');
                              setForgotModalError('');
                              setForgotEmailModalOpen(true);
                            }}
                            className="text-xs text-slate-500 dark:text-amber-500 hover:text-slate-800 dark:hover:text-amber-400 font-semibold transition cursor-pointer select-none outline-none"
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
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/50 dark:bg-[#070708] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 text-slate-800 dark:text-gray-100 placeholder-slate-450 dark:placeholder-gray-600 transition-all font-sans"
                          />
                        </div>
                      </div>



                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#111112] hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2"
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
            onEnterPortal={(tab, courseName) => {
              setShowPortal(true);
              setOnboardingTab(tab);
              if (courseName) {
                setFastCourse(courseName);
              }
            }}
          />
        )
      ) : (
        /* Core UI Application Shell */
        <div className="h-screen flex flex-col md:flex-row relative z-0 overflow-hidden font-sans bg-white dark:bg-[#070708]">

          
          {/* Mobile Top Bar */}
          <div className="md:hidden w-full h-16 px-5 border-b border-slate-200 dark:border-white/5 bg-[#fafafa] dark:bg-[#080809] flex items-center justify-between z-20 shrink-0">
            <div className="scale-[0.55] origin-left">
              <Logo size="sm" withStrapline={false} />
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-3 -mr-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
              aria-label="Open Navigation Menu"
              aria-expanded={!isSidebarCollapsed}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Backdrop on Mobile */}
          {!isSidebarCollapsed && (
            <div 
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
              onClick={() => setIsSidebarCollapsed(true)}
            />
          )}

          {/* Responsive Navigation Rail / Drawer */}
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
            className={`
              fixed inset-y-0 left-0 z-50 w-72 md:relative md:inset-auto md:z-auto md:flex-shrink-0
              ${isActuallyCollapsed ? 'md:w-20 px-3' : 'md:w-64 px-5'} 
              ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
              py-5 bg-[#fafafa] dark:bg-[#080809] border-r border-slate-200 dark:border-white/5 
              flex flex-col justify-between transition-all duration-300 ease-in-out select-none overflow-y-auto h-full md:h-auto
            `}
          >
            <div className="space-y-6">
              {/* Header Branding */}
              <div className="flex items-center justify-between md:justify-center select-none">
                <div className="flex items-center gap-2">
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
                
                {/* Mobile Menu Close Toggle inside Drawer */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="md:hidden p-3 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items Container */}
              <div className="flex flex-col gap-6 md:gap-6">
                {/* Logged profile banner */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className={`bg-slate-50 dark:bg-[#161618] hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl border ${activeTab === 'profile' ? 'border-amber-500' : 'border-slate-100 dark:border-white/5'} flex items-center ${isActuallyCollapsed ? 'justify-center p-1.5' : 'gap-3 p-3'} select-none transition-all cursor-pointer`}
                  title={currentUser.role === 'student' ? "Click to Open My Profile" : "Click to Open Profile Settings"}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        try {
                          const compressedUrl = await compressImage(file);
                          setCurrentUser(prev => prev ? { ...prev, avatarUrl: compressedUrl } : null);
                          setUsers(prev => prev.map(u => {
                            if (u.id === currentUser.id) {
                              return { ...u, avatarUrl: compressedUrl };
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
                        } catch (err) {
                          const errNotif: AppNotification = {
                            id: generateUniqueId('notif-err'),
                            title: 'Avatar Update Failed',
                            message: 'Could not process the selected image.',
                            timestamp: new Date().toISOString(),
                            read: false,
                            type: 'general',
                            channel: 'push'
                          };
                          triggerToast(errNotif);
                        }
                        e.target.value = '';
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
                      <p className="text-[13px] font-bold text-slate-900 dark:text-gray-200 truncate">{currentUser.name}</p>
                      <span className="inline-flex items-center text-[9px] uppercase font-bold tracking-wider text-amber-500 border border-slate-200 dark:border-white/10 shadow-sm bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5">
                        {currentUser.role}
                      </span>
                    </div>
                  )}
                </div>

                {/* Central Navigation lists */}
                <nav className="space-y-1">
                  {currentUser && currentUser.role === 'student' && currentUser.paymentStatus !== 'paid' && !getTrialInfo(currentUser).isTrialActive ? (
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold"
                    >
                      <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                      {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Fee Settle Required</span>}
                    </button>
                  ) : (
                    <>
                      {/* Student Academic Sub-Menu */}
                      {currentUser && currentUser.role === 'student' ? (
                        <div className="space-y-1">
                          {!isActuallyCollapsed && (
                            <button
                              type="button"
                              onClick={() => setIsStudentAcademicExpanded(!isStudentAcademicExpanded)}
                              className="w-full flex items-center justify-between pt-2 pb-1.5 pl-3.5 pr-2 group/header text-left cursor-pointer"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Academic Portal</p>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover/header:text-amber-500 transition-transform duration-200 ${isStudentAcademicExpanded ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                          )}
                          <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isStudentAcademicExpanded || isActuallyCollapsed ? 'max-h-[350px] opacity-100 visible' : 'max-h-0 opacity-0 invisible pointer-events-none'}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('dashboard');
                                setStudentScheduleTab('schedule');
                                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                              }}
                              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                activeTab === 'dashboard' && studentScheduleTab === 'schedule'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                  : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                              }`}
                              title={isActuallyCollapsed ? "My Schedule" : undefined}
                            >
                              <Calendar className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              {!isActuallyCollapsed && <span className="truncate animate-fadeIn">My Schedule</span>}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('dashboard');
                                setStudentScheduleTab('tasks');
                                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                              }}
                              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                activeTab === 'dashboard' && studentScheduleTab === 'tasks'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                  : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                              }`}
                              title={isActuallyCollapsed ? "Pending Tasks" : undefined}
                            >
                              <Clock className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Pending Tasks</span>}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('dashboard');
                                setStudentScheduleTab('completed');
                                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                              }}
                              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                activeTab === 'dashboard' && studentScheduleTab === 'completed'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                  : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                              }`}
                              title={isActuallyCollapsed ? "Completed Classes" : undefined}
                            >
                              <CheckCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              {!isActuallyCollapsed && <span className="truncate animate-fadeIn font-sans">Completed Classes</span>}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('dashboard');
                                setStudentScheduleTab('assignments');
                                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                              }}
                              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                activeTab === 'dashboard' && studentScheduleTab === 'assignments'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                  : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                              }`}
                              title={isActuallyCollapsed ? "Assignments & Homework" : undefined}
                            >
                              <ClipboardList className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Assignments & Homework</span>}
                            </button>
                          </div>
                        </div>
                      ) : (
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
                      )}

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
                        title={isActuallyCollapsed ? (currentUser.role === 'student' ? 'My Profile' : "Profile & Password Settings") : undefined}
                      >
                        <User className="w-4 h-4 flex-shrink-0 text-amber-500" />
                        {!isActuallyCollapsed && (
                          <span className="truncate animate-fadeIn">
                            {currentUser.role === 'student' ? 'My Profile' : 'Profile Settings'}
                          </span>
                        )}
                      </button>

                      {currentUser.role !== 'student' && (
                        <div className="space-y-1">
                          {!isActuallyCollapsed && (
                            <button
                              type="button"
                              onClick={() => setIsStaffAcademicExpanded(!isStaffAcademicExpanded)}
                              className="w-full flex items-center justify-between pt-4 pb-1.5 pl-3.5 pr-2 group/header text-left cursor-pointer"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Academic shortcuts</p>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover/header:text-amber-500 transition-transform duration-200 ${isStaffAcademicExpanded ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                          )}
                          <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isStaffAcademicExpanded || isActuallyCollapsed ? 'max-h-[500px] opacity-100 visible' : 'max-h-0 opacity-0 invisible pointer-events-none'}`}>
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
                              title={isActuallyCollapsed ? (currentUser.role === 'admin' ? 'Accounts & Enrollments' : currentUser.role === 'sub-admin' ? 'Enrollments & Faculty' : currentUser.role === 'instructor' ? 'Student Profiles Registry' : '') : undefined}
                            >
                              <Users className="w-4 h-4 flex-shrink-0" />
                              {!isActuallyCollapsed && (
                                <span className="truncate animate-fadeIn">
                                  {currentUser.role === 'admin' 
                                    ? 'Accounts & Enrollments' 
                                    : currentUser.role === 'sub-admin' 
                                      ? 'Enrollments & Faculty' 
                                      : 'Student Profiles Registry'}
                                </span>
                              )}
                            </button>

                            {['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
                              <>
                                {/* First-level: Schedule New Live Class */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeTab === 'schedule' && scheduleShowAddForm) {
                                      setScheduleShowAddForm(false);
                                    } else {
                                      setActiveTab('schedule');
                                      setScheduleShowAddForm(true);
                                      setScheduleShowCourseDashboard(false);
                                      setScheduleShowBatchManager(false);
                                    }
                                    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                                  }}
                                  className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                    activeTab === 'schedule' && scheduleShowAddForm
                                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                      : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                                  }`}
                                  title={isActuallyCollapsed ? "Schedule New Live Class" : undefined}
                                >
                                  <Plus className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                  {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Schedule New Live Class</span>}
                                </button>

                                {/* First-level: Courses Publish Dashboard */}
                                {['admin', 'sub-admin'].includes(currentUser.role) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeTab === 'schedule' && scheduleShowCourseDashboard) {
                                        setScheduleShowCourseDashboard(false);
                                      } else {
                                        setActiveTab('schedule');
                                        setScheduleShowCourseDashboard(true);
                                        setScheduleShowAddForm(false);
                                        setScheduleShowBatchManager(false);
                                      }
                                      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                                    }}
                                    className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                      activeTab === 'schedule' && scheduleShowCourseDashboard
                                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                        : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                                    }`}
                                    title={isActuallyCollapsed ? "Courses Publish Dashboard" : undefined}
                                  >
                                    <GraduationCap className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                    {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Courses Publish Dashboard</span>}
                                  </button>
                                )}

                                {/* First-level: Scheduled Lectures */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('lectures');
                                    setScheduleShowAddForm(false);
                                    setScheduleShowCourseDashboard(false);
                                    setScheduleShowBatchManager(false);
                                    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                                  }}
                                  className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                    activeTab === 'lectures'
                                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                      : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                                  }`}
                                  title={isActuallyCollapsed ? "Scheduled Lectures" : undefined}
                                >
                                  <Calendar className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                  {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Scheduled Lectures</span>}
                                </button>

                                {/* Consolidated Academic & Evolution Pipeline */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('assignment-pipeline');
                                    setScheduleShowAddForm(false);
                                    setScheduleShowCourseDashboard(false);
                                    setScheduleShowBatchManager(false);
                                    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                                  }}
                                  className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                    activeTab === 'assignment-pipeline'
                                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                      : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                                  }`}
                                  title={isActuallyCollapsed ? "Academic & Evolution Pipeline" : undefined}
                                >
                                  <Layers className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                  {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Academic & Evolution Pipeline</span>}
                                </button>

                                {/* First-level: Assignment Submission Tracker */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('assignment-tracker');
                                    setScheduleShowAddForm(false);
                                    setScheduleShowCourseDashboard(false);
                                    setScheduleShowBatchManager(false);
                                    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                                  }}
                                  className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                    activeTab === 'assignment-tracker'
                                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                      : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                                  }`}
                                  title={isActuallyCollapsed ? "Assignment Status Tracker" : undefined}
                                >
                                  <CheckCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                  {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Assignment Status Tracker</span>}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* System Categories Sub-Menu */}
                      <div className="space-y-1">
                        {!isActuallyCollapsed && (
                          <button
                            type="button"
                            onClick={() => setIsSystemCategoriesExpanded(!isSystemCategoriesExpanded)}
                            className="w-full flex items-center justify-between pt-4 pb-1.5 pl-3.5 pr-2 group/header text-left cursor-pointer"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">System Categories</p>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover/header:text-amber-500 transition-transform duration-200 ${isSystemCategoriesExpanded ? 'rotate-0' : '-rotate-90'}`} />
                          </button>
                        )}
                        <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isSystemCategoriesExpanded || isActuallyCollapsed ? 'max-h-[350px] opacity-100 visible' : 'max-h-0 opacity-0 invisible pointer-events-none'}`}>
                          {['admin', 'sub-admin'].includes(currentUser.role) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('courses-directory');
                                setScheduleShowAddForm(false);
                                setScheduleShowCourseDashboard(false);
                                setScheduleShowBatchManager(false);
                                if (window.innerWidth < 768) setIsSidebarCollapsed(true);
                              }}
                              className={`w-full flex items-center ${isActuallyCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-xl text-xs transition relative cursor-pointer ${
                                activeTab === 'courses-directory'
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold'
                                  : 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-[#161618] border border-transparent'
                              }`}
                              title={isActuallyCollapsed ? "Academic Course Roadmap" : undefined}
                            >
                              <BookOpen className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              {!isActuallyCollapsed && <span className="truncate animate-fadeIn">Academic Course Roadmap</span>}
                            </button>
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
                            title={isActuallyCollapsed ? "Certificate Progress" : undefined}
                          >
                            <Award className="w-4 h-4 flex-shrink-0" />
                            {!isActuallyCollapsed && <span className="truncate animate-fadeIn">{currentUser.role === 'student' ? 'Certificate Progress' : 'Grading Progress Books'}</span>}
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
                              <span className={`absolute ${isActuallyCollapsed ? 'top-1 right-1' : 'right-3.5 top-1/2 -translate-y-1/2'} min-w-[16px] h-4 leading-none text-sm font-mono font-bold bg-amber-500 text-amber-950 px-1 rounded-full flex items-center justify-center border border-white dark:border-[#161618] transition-all`}>
                                {simulatedEmails.filter(m => m.to.toLowerCase() === currentUser.email.toLowerCase()).length}
                              </span>
                            )}
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
                        </div>
                      </div>
                    </>
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
            {currentUser && currentUser.role === 'student' && currentUser.paymentStatus !== 'paid' && !getTrialInfo(currentUser).isTrialActive ? (
              <RazorpayPayment
                currentUser={currentUser}
                users={users}
                setUsers={setUsers}
                courses={courses}
                setNotifications={setNotifications}
                onLogout={handleLogout}
              />
            ) : (
              <>
                {/* Active Render Panels Routing based on Tab */}
                {activeTab === 'dashboard' && (
              <div className="space-y-6 max-w-6xl mx-auto w-full pt-4 font-sans animate-fadeIn">
                {['admin', 'sub-admin'].includes(currentUser.role) ? (
                  <div className="space-y-6 max-w-6xl mx-auto w-full pt-2 font-sans">
                    {/* Vercel Header Breadcrumb */}
                    <div className="border-b border-slate-200 dark:border-white/10 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold font-mono text-sm leading-none shrink-0 shadow-xs shadow-black/20 animate-pulse">
                            ▲
                          </div>
                          <span className="text-sm font-semibold text-slate-500 dark:text-gray-400 font-mono">learnora</span>
                          <span className="text-slate-300 dark:text-neutral-700">/</span>
                          <span className="text-sm font-semibold text-slate-950 dark:text-white font-sans flex items-center gap-1.5">
                            admin-centre
                            <span className="text-sm bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono uppercase font-bold tracking-wider">hobby</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-450 dark:text-slate-500 font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Ledger Containers Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Greeting Header */}
                    <div className="py-2">
                      <h1 className="text-[28px] font-bold text-slate-950 dark:text-white mb-1 tracking-tight">Administrative Overview</h1>
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        Welcome, {currentUser.name}. Track students, study courses pathways, and manage schedules.
                      </p>
                    </div>

                    {/* Premium Bento Grid Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Card 1: Total Students */}
                      <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs">
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Total Ledger Students</p>
                        <p className="text-3xl font-bold text-slate-950 dark:text-white mt-2 mb-4">
                          {users.filter(u => u.role === 'student').length}
                        </p>
                        <button
                          onClick={() => setActiveTab('enrollments')}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          View Student Registry <ChevronRight className="w-3" />
                        </button>
                      </div>

                      {/* Card 2: Instructors */}
                      <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs">
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Faculty Instructors</p>
                        <p className="text-3xl font-bold text-slate-950 dark:text-white mt-2 mb-4">
                          {users.filter(u => u.role === 'instructor').length}
                        </p>
                        <button
                          onClick={() => setActiveTab('enrollments')}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Manage Staff <ChevronRight className="w-3" />
                        </button>
                      </div>

                      {/* Card 3: Schedules */}
                      <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs">
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Active Classes Scheduled</p>
                        <p className="text-3xl font-bold text-slate-950 dark:text-white mt-2 mb-4">
                          {schedules.filter(s => s.status === 'scheduled').length}
                        </p>
                        <button
                          onClick={() => setActiveTab('schedule')}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Open Time Editor <ChevronRight className="w-3" />
                        </button>
                      </div>

                      {/* Card 4: Average Score */}
                      <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs">
                        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Average Evaluation Grade</p>
                        <p className="text-3xl font-bold text-slate-950 dark:text-white mt-2 mb-4">
                          {progressRecords.length > 0 ? (progressRecords.reduce((acc, r) => acc + r.score, 0) / progressRecords.length).toFixed(0) : '0'}%
                        </p>
                        <button
                          onClick={() => setActiveTab('reports')}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Explore Report Metrics <ChevronRight className="w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-6 pb-2 mb-8">
                      {/* Vercel Header Breadcrumb */}
                      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold font-mono text-sm leading-none shrink-0 shadow-xs shadow-black/20 animate-pulse">
                              ▲
                            </div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-gray-400 font-mono">learnora</span>
                            <span className="text-slate-300 dark:text-neutral-700">/</span>
                            <span className="text-sm font-semibold text-slate-950 dark:text-white font-sans flex items-center gap-1.5 font-mono">
                              {currentUser.role === 'student' ? 'student-centre' : 'faculty-centre'}
                              <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono uppercase font-bold tracking-wider">
                                {currentUser.role === 'student' ? 'hobby' : 'pro'}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-450 dark:text-slate-500 font-mono flex items-center gap-1.5">
                              {currentUser.role === 'student' 
                                ? 'Live Learning Sync Connected' 
                                : 'Live Faculty Registry Connected'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Greeting Header */}
                      <div className="py-2">
                        <h1 className="text-[28px] font-bold text-slate-950 dark:text-white mb-1 tracking-tight">
                          {currentUser.role === 'student' ? 'Student Workspace' : 'Faculty Overview'}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                          Welcome, {currentUser.name}. {currentUser.role === 'student' 
                            ? "Manage your schedules, completed classes, and pending tasks." 
                            : 'Track student records, updates, and upcoming lessons.'}
                        </p>
                      </div>
                    </div>

                    {currentUser.role === 'student' && (
                      <>
                        {(() => {
                          const enrolledCourseConfig = (() => {
                            if (!currentUser.course || !courses || courses.length === 0) return undefined;
                            const userCourseClean = currentUser.course.trim().replace(/\.+$/, "").toLowerCase(); const userBatchClean = currentUser.batch?.trim().toLowerCase() || ""; let batchMatched = undefined; if (userBatchClean) { batchMatched = courses.find(c => { const cId = c.id?.trim().toLowerCase() || ""; const cName = c.name.trim().replace(/\.+$/, "").toLowerCase(); const cCode = c.code?.trim().toLowerCase() || ""; const cBatch = c.batchNumber?.trim().toLowerCase() || ""; const isCourseMatch = cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean; const isBatchMatch = cBatch === userBatchClean || cCode === userBatchClean; return isCourseMatch && isBatchMatch; }); } if (batchMatched) return batchMatched;
                            
                            // 1. Exact/Normalized check
                            let matched = courses.find(c => {
                              const cId = c.id?.trim().toLowerCase() || "";
                              const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                              const cCode = c.code?.trim().toLowerCase() || "";
                              return cId === userCourseClean || cName === userCourseClean || cCode === userCourseClean;
                            });
                            
                            if (matched) return matched;
                            
                            // 2. Substring fallback
                            matched = courses.find(c => {
                              const cName = c.name.trim().replace(/\.+$/, "").toLowerCase();
                              return cName.includes(userCourseClean) || userCourseClean.includes(cName);
                            });
                            
                            return matched;
                          })();
                          if (!enrolledCourseConfig) return null;

                          const trial = getTrialInfo(currentUser);

                          return (
                            <div className="space-y-4 animate-fadeIn">
                              {enrolledCourseConfig.status === 'upcoming' && (
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg shrink-0">
                                      <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm">You are enrolled in an Upcoming Program!</h3>
                                      <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-0.5">
                                        <strong className="font-semibold">{enrolledCourseConfig.name}</strong> will Start on <span className="font-bold underline decoration-blue-500/30 underline-offset-2">{new Date(enrolledCourseConfig.publishDate || enrolledCourseConfig.createdDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {currentUser.paymentStatus !== 'paid' && trial.isTrialActive && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-1.5">
                                        Active Free Trial Pass Enabled!
                                      </h3>
                                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        You have full, unlocked access to classes, assessments, and curriculum features. 
                                        Your trial ends on <strong className="font-semibold">{trial.endDate?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong> 
                                        {' '}(<span className="font-bold text-amber-700 dark:text-amber-400">{trial.daysLeft} {trial.daysLeft === 1 ? 'day' : 'days'} remaining</span>).
                                      </p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setActiveTab('enrollments')}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all duration-200 shadow-sm whitespace-nowrap self-start md:self-auto"
                                  >
                                    Secure Academic Gateway Pass
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    {/* Enrolled Classes List for Student */}
                    <div className="space-y-4 pt-4 font-sans">
                      <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#070708] p-4 md:p-6 shadow-sm">
                        {studentScheduleTab === 'schedule' ? (
                          <div className="space-y-6">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-white/5 inline-block pr-12">
                              {(() => {
                                const today = new Date();
                                const endDate = new Date();
                                endDate.setDate(today.getDate() + 13);
                                const startMonth = today.toLocaleString('default', { month: 'short' });
                                const endMonth = endDate.toLocaleString('default', { month: 'short' });
                                if (startMonth === endMonth) {
                                  return `${startMonth} ${today.getDate()} - ${endDate.getDate()}`;
                                }
                                return `${startMonth} ${today.getDate()} - ${endMonth} ${endDate.getDate()}`;
                              })()}
                            </div>

                            <div className="space-y-3">
                              {Array.from({ length: 14 }).map((_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() + i);
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                const dateStr = `${yyyy}-${mm}-${dd}`;
                                
                                const dayAbbr = d.toLocaleString('default', { weekday: 'short' });
                                const dayNum = d.getDate();

                                const daySchedules = schedules.filter(s => {
                                  if (s.date !== dateStr) return false;
                                  if (s.status === 'completed') return false;
                                  if (!isScheduleDateOnOrAfterJoinedDate(s.date, currentUser.joinedDate)) return false;
                                  
                                  const isExplicitlyEnrolled = s.enrolledStudentIds.includes(currentUser.id);
                                  
                                  const isMyCourse = s.course && currentUser.course && s.course.toLowerCase() === currentUser.course.toLowerCase();
                                  const isAllCourse = !s.course || s.course === 'All';
                                  const matchesCourse = isMyCourse || isAllCourse || isExplicitlyEnrolled;

                                  const isMyBatch = s.batch && currentUser.batch && s.batch.toLowerCase() === currentUser.batch.toLowerCase();
                                  const isAllBatch = !s.batch || s.batch === 'All';
                                  const matchesBatch = isMyBatch || isAllBatch || isExplicitlyEnrolled;

                                  return matchesCourse && matchesBatch;
                                });

                                const dayEvolutions = studentEvolutions.filter(ev => {
                                  if (ev.studentId !== currentUser.id || ev.status === 'draft') return false;
                                  if (!ev.examDate) return false;
                                  return ev.examDate === dateStr;
                                });

                                return (
                                  <div key={dateStr} className="flex flex-col md:flex-row gap-4">
                                    <div className={`w-14 h-14 shrink-0 flex flex-col items-center justify-center rounded-xl text-center border ${
                                      i === 0 
                                        ? 'bg-[#437bef] border-[#437bef] text-white' 
                                        : 'bg-white border-transparent text-slate-700 dark:bg-transparent dark:text-slate-300'
                                    }`}>
                                      <span className="text-xs font-bold tracking-tight">{dayAbbr}</span>
                                      <span className="text-sm font-bold leading-none mt-0.5">{dayNum}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      {daySchedules.length === 0 && dayEvolutions.length === 0 ? (
                                        <div className="h-full w-full flex items-center px-5 py-4 bg-white border border-slate-200 rounded-[10px] text-[13px] text-slate-500 dark:bg-[#161618] dark:border-white/10 dark:text-slate-400">
                                          No sessions scheduled for the day
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          {daySchedules.map(cl => {
                                            const { icon: SubjectIcon, color: iconColor, bg: iconBg } = getSubjectIconObj(cl.subject);
                                            const classStart = new Date(`${cl.date}T${cl.time}`);
                                            const now = new Date();
                                            const timeDiffMinutes = (classStart.getTime() - now.getTime()) / (1000 * 60);
                                            const isTimeOver = -timeDiffMinutes > Number(cl.duration);
                                            const isLinkActive = timeDiffMinutes <= 5 && !isTimeOver && cl.status === 'scheduled';
                                            return (
                                              <div key={cl.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-3 bg-white border border-slate-200 rounded-[10px] hover:border-blue-200 transition-colors dark:bg-[#161618] dark:border-white/10 dark:hover:border-blue-500/30 items-center">
                                                <div className="md:col-span-4 flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-lg ${iconBg} border border-zinc-250/30 dark:border-white/5 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                                    <SubjectIcon className="w-4 h-4" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <h4 className={`font-bold text-slate-900 dark:text-white text-sm truncate ${cl.status === 'completed' ? 'opacity-60 line-through decoration-slate-400' : ''}`} title={cl.title}>
                                                        {cl.title}
                                                      </h4>
                                                      {cl.status === 'completed' && (
                                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/10 uppercase tracking-tight">
                                                          Done
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                                                      by {cl.instructorName} • <span className="text-amber-600 dark:text-amber-450 font-bold">{cl.subject}</span>
                                                    </p>
                                                  </div>
                                                </div>
                                                
                                                <div className="md:col-span-3">
                                                   <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${
                                                      cl.status === 'scheduled'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/10'
                                                        : cl.status === 'completed'
                                                          ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/10'
                                                          : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/10'
                                                     }`}>
                                                      {cl.status === 'scheduled' ? 'Scheduled' : cl.status === 'completed' ? 'Completed' : 'Cancelled'}
                                                    </span>
                                                </div>
 
                                                <div className="md:col-span-5 min-w-0 flex items-center justify-between gap-4">
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Room / Link</p>
                                                    {cl.status === 'cancelled' ? (
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/10 rounded-md text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                                                          ❌ Cancelled
                                                        </div>
                                                      </div>
                                                    ) : cl.status === 'completed' || isTimeOver ? (
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/10 rounded-md text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                                                          ✓ Completed
                                                        </div>
                                                      </div>
                                                    ) : cl.location && (cl.location.includes('http') || cl.location.includes('zoom.us') || cl.location.includes('meet.google')) ? (
                                                      <div className="flex items-center gap-2 mt-1">
                                                        {isLinkActive ? (
                                                          <a href={cl.location.startsWith('http') ? cl.location : `https://${cl.location}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-500 rounded-md text-xs font-bold transition">Join Class</a>
                                                        ) : (
                                                          <button disabled className="px-2.5 py-1 bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 rounded-md text-xs font-bold cursor-not-allowed">Join Class</button>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5"><span className="opacity-75">Location:</span> {cl.location}</p>
                                                    )}
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                    <div className="text-xs font-bold text-slate-900 dark:text-white">{cl.time}</div>
                                                    <div className="text-[11px] text-slate-450 dark:text-slate-550 font-medium">{cl.duration}m</div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {dayEvolutions.map(ev => {
                                            return (
                                              <div key={ev.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-3 bg-white border border-indigo-200 dark:bg-[#161618] dark:border-indigo-500/30 rounded-[10px] items-center animate-fadeIn shadow-sm">
                                                <div className="md:col-span-4 flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                                                    <TrendingUp className="w-4 h-4" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate" title="Continuous Evolution Exam">
                                                        Continuous Evolution
                                                      </h4>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                                                      Month {ev.month} • <span className="font-bold text-indigo-600 dark:text-indigo-400">Evaluation</span>
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="md:col-span-3">
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/10">
                                                    Scheduled
                                                  </span>
                                                </div>

                                                <div className="md:col-span-5 min-w-0 flex items-center justify-between gap-4">
                                                  <div className="min-w-0">
                                                    <p className="font-bold text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Exam Details</p>
                                                    <button onClick={() => {
                                                      setActiveStudentModalEvolution(ev);
                                                      setActiveStudentModalAssignment(undefined);
                                                      setIsStudentModalOpen(true);
                                                    }} className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 rounded-md text-xs font-bold transition">Start Exam</button>
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                    <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.examTime || 'TBA'}</div>
                                                    <div className="text-[11px] text-slate-450 dark:text-slate-550 font-medium">{ev.examDuration ? `${ev.examDuration}m` : 'Duration TBA'}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : studentScheduleTab === 'assignments' ? (
                          <div className="space-y-6">
                            <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-indigo-500" />
                                Course Homework & Evaluations
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                View assignments published after your class sessions, submit your solutions, and review grades and instructor feedback.
                              </p>
                            </div>

                            {(() => {
                              const studentAssignments = assignments.filter(asg => {
                                // Must match course and batch
                                const matchesCourse = !asg.course || asg.course === 'All' || (currentUser.course && asg.course.toLowerCase() === currentUser.course.toLowerCase());
                                const matchesBatch = !asg.batch || asg.batch === 'All' || (currentUser.batch && asg.batch.toLowerCase() === currentUser.batch.toLowerCase());
                                
                                // Alternatively, check if explicitly enrolled in the scheduling class
                                const matchingClass = schedules.find(s => s.id === asg.classId);
                                const isEnrolledInClass = matchingClass?.enrolledStudentIds?.includes(currentUser.id);

                                return (matchesCourse && matchesBatch) || isEnrolledInClass;
                              });

                              if (studentAssignments.length === 0) {
                                return (
                                  <div className="py-20 text-center text-xs text-slate-400 font-sans border border-dashed border-slate-200 dark:border-white/5 bg-[#fafafa] dark:bg-[#070708] rounded-2xl p-6">
                                    <ClipboardList className="w-12 h-12 text-slate-305 dark:text-white/5 mx-auto mb-3" />
                                    No homework has been assigned for your courses yet. Complete lessons first!
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-5">
                                  {studentAssignments.map(asg => {
                                    const submission = asg.submissions.find(s => s.studentId === currentUser.id);
                                    const isSubmitted = !!submission;
                                    const isGraded = submission?.status === 'graded';

                                    return (
                                      <div key={asg.id} className="p-5 border border-slate-200 dark:border-white/5 rounded-2xl bg-[#fafafa] dark:bg-[#0c0d12]/40 shadow-xs relative overflow-hidden text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-gray-500">Assignment Post</span>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{asg.title}</h4>
                                            <p className="text-[11px] text-slate-505 dark:text-gray-500 mt-1 font-sans">
                                              Class Ref: <span className="text-slate-700 dark:text-zinc-350 font-semibold">{asg.className}</span> | Published: {asg.createdDate}
                                            </p>
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                                              Due Date: {asg.dueDate}
                                            </span>
                                            <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                                              Max Points: {asg.maxPoints}
                                            </span>
                                            {isGraded ? (
                                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                                                ★ Graded
                                              </span>
                                            ) : isSubmitted ? (
                                              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                                                ✓ Submitted
                                              </span>
                                            ) : (
                                              <span className="bg-rose-500/10 text-rose-605 dark:text-rose-450 px-2.5 py-0.5 rounded text-[10px] font-bold border border-rose-550/20 animate-pulse">
                                                Pending Submission
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <p className="text-xs text-slate-600 dark:text-slate-405 mb-4 bg-white dark:bg-white/[0.01] p-3 rounded-xl border border-slate-150 dark:border-white/5 leading-relaxed whitespace-pre-line font-medium text-left">
                                          {asg.description}
                                        </p>

                                        {/* Status / Submission form details */}
                                        <div className="pt-2">
                                          {isGraded ? (
                                            <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/15 p-4 rounded-xl space-y-2 font-sans text-left">
                                              <div className="flex items-center gap-2 text-emerald-650 dark:text-emerald-400 font-bold text-xs">
                                                <Award className="w-4 h-4" /> Homework Score Details
                                              </div>
                                              <div className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                                                You scored {submission.score} out of {asg.maxPoints} points possible.
                                              </div>
                                              {submission.feedback && (
                                                <div className="mt-3 p-3 bg-white dark:bg-white/[0.01] rounded-lg border border-emerald-500/5 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed italic text-left">
                                                  <span className="font-bold text-slate-850 dark:text-zinc-300 block not-italic mb-1">Instructor Feedback:</span>
                                                  "{submission.feedback}"
                                                </div>
                                              )}
                                            </div>
                                          ) : isSubmitted ? (
                                            <div className="bg-indigo-500/5 border border-indigo-505/10 p-4 rounded-xl space-y-3 text-left">
                                              <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div className="text-xs font-bold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                                                  <Check className="w-4 h-4 text-emerald-500 border border-emerald-500/20 rounded-full" /> Solution Submitted Successfully
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    setActiveStudentModalAssignment(asg);
                                                    setActiveStudentModalEvolution(undefined);
                                                    setIsStudentModalOpen(true);
                                                  }}
                                                  className="text-[11px] text-indigo-600 dark:text-zinc-400 hover:text-indigo-650 font-bold underline transition cursor-pointer"
                                                >
                                                  Edit Submission
                                                </button>
                                              </div>
                                              <div className="bg-white dark:bg-white/[0.01] border border-slate-150 dark:border-white/5 p-3 rounded-lg text-xs font-sans text-slate-655 dark:text-zinc-350 whitespace-pre-line leading-relaxed text-left">
                                                {submission.answerText}
                                              </div>
                                              {submission.fileUrn && (
                                                <p className="text-[10px] text-slate-400 dark:text-gray-500 flex items-center gap-1">
                                                  <FileText className="w-3.5 h-3.5 text-zinc-450" /> Solution Document: <span className="font-sans text-indigo-600 dark:text-indigo-400 underline">{submission.fileUrn}</span>
                                                </p>
                                              )}
                                              <p className="text-[10.5px] italic text-slate-455 dark:text-gray-500 mt-1">
                                                Our servers queued your response at {new Date(submission.submittedDate).toLocaleString()}. It will be graded by {asg.instructorName} shortly.
                                              </p>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setActiveStudentModalAssignment(asg);
                                                setActiveStudentModalEvolution(undefined);
                                                setIsStudentModalOpen(true);
                                              }}
                                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:scale-[1.01] duration-150 cursor-pointer"
                                            >
                                              <CheckSquare className="w-4 h-4" /> Submit Homework Solution
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        ) : studentScheduleTab === 'tasks' ? (
                          <div className="space-y-6">
                            <div className="border-b border-slate-100 dark:border-white/5 pb-3">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                Pending Tasks
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-gray-400">
                                Complete and submit your pending homework assignments.
                              </p>
                            </div>

                            {(() => {
                              const studentAssignments = assignments.filter(asg => {
                                const matchesCourse = !asg.course || asg.course === 'All' || (currentUser.course && asg.course.toLowerCase() === currentUser.course.toLowerCase());
                                const matchesBatch = !asg.batch || asg.batch === 'All' || (currentUser.batch && asg.batch.toLowerCase() === currentUser.batch.toLowerCase());
                                const matchingClass = schedules.find(s => s.id === asg.classId);
                                const isEnrolledInClass = matchingClass?.enrolledStudentIds?.includes(currentUser.id);
                                return (matchesCourse && matchesBatch) || isEnrolledInClass;
                              });

                              const pendingTasks = studentAssignments.filter(asg => {
                                const submission = asg.submissions.find(s => s.studentId === currentUser.id);
                                return !submission;
                              });

                              if (pendingTasks.length === 0) {
                                return (
                                  <div className="py-24 text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No pending tasks found</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-5">
                                  {pendingTasks.map(asg => {
                                    return (
                                      <div key={asg.id} className="p-5 border border-slate-200 dark:border-white/5 rounded-2xl bg-[#fafafa] dark:bg-[#0c0d12]/40 shadow-xs relative overflow-hidden text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
                                          <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-gray-500">Assignment Post</span>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{asg.title}</h4>
                                            <p className="text-[11px] text-slate-505 dark:text-gray-500 mt-1 font-sans">
                                              Class Ref: <span className="text-slate-700 dark:text-zinc-350 font-semibold">{asg.className}</span> | Published: {asg.createdDate}
                                            </p>
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                                              Due Date: {asg.dueDate}
                                            </span>
                                            <span className="bg-rose-500/10 text-rose-605 dark:text-rose-450 px-2.5 py-0.5 rounded text-[10px] font-bold border border-rose-550/20 animate-pulse">
                                              Pending Submission
                                            </span>
                                          </div>
                                        </div>

                                        <p className="text-xs text-slate-600 dark:text-slate-405 mb-4 bg-white dark:bg-white/[0.01] p-3 rounded-xl border border-slate-150 dark:border-white/5 leading-relaxed whitespace-pre-line font-medium text-left">
                                          {asg.description}
                                        </p>

                                        <div className="pt-2">
                                          <button
                                            onClick={() => {
                                              setActiveStudentModalAssignment(asg);
                                              setActiveStudentModalEvolution(undefined);
                                              setIsStudentModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:scale-[1.01] duration-150 cursor-pointer"
                                          >
                                            <CheckSquare className="w-4 h-4" /> Submit Homework Solution
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-white/5 inline-block pr-12">
                              Past Completed Classes
                            </div>
                            <div className="space-y-3">
                              {(() => {
                                const completedClasses = schedules.filter(s => {
                                  if (s.status !== 'completed') return false;
                                  if (!isScheduleDateOnOrAfterJoinedDate(s.date, currentUser.joinedDate)) return false;
                                  
                                  const isExplicitlyEnrolled = s.enrolledStudentIds.includes(currentUser.id);
                                  const isMyCourse = s.course && currentUser.course && s.course.toLowerCase() === currentUser.course.toLowerCase();
                                  const isAllCourse = !s.course || s.course === 'All';
                                  const matchesCourse = isMyCourse || isAllCourse || isExplicitlyEnrolled;
                                  const isMyBatch = s.batch && currentUser.batch && s.batch.toLowerCase() === currentUser.batch.toLowerCase();
                                  const isAllBatch = !s.batch || s.batch === 'All';
                                  const matchesBatch = isMyBatch || isAllBatch || isExplicitlyEnrolled;
                                  return matchesCourse && matchesBatch;
                                });

                                if (completedClasses.length === 0) {
                                  return (
                                    <div className="py-24 text-center">
                                      <p className="text-sm text-slate-500 dark:text-slate-400">No completed classes found</p>
                                    </div>
                                  );
                                }

                                return completedClasses.map(cl => {
                                  const { icon: SubjectIcon, color: iconColor, bg: iconBg } = getSubjectIconObj(cl.subject);
                                  return (
                                    <div key={cl.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-4 bg-white border border-slate-200 rounded-[10px] hover:border-blue-200 transition-colors dark:bg-[#161618] dark:border-white/10 dark:hover:border-blue-500/30 items-center">
                                      <div className="md:col-span-4 flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${iconBg} border border-zinc-250/30 dark:border-white/5 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                          <SubjectIcon className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-[13px] truncate opacity-60 line-through decoration-slate-400" title={cl.title}>
                                              {cl.title}
                                            </h4>
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/10 uppercase tracking-tight">
                                              Done
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                                            by {cl.instructorName} • <span className="text-amber-600 dark:text-amber-450 font-bold">{cl.subject}</span>
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="md:col-span-3">
                                         <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-tight bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/10">
                                            Completed
                                          </span>
                                      </div>

                                      <div className="md:col-span-5 min-w-0 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-400 dark:text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">Date & Time</p>
                                          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                                            {cl.date} at {cl.time} ({cl.duration}m)
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/10 rounded-md text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight">
                                            ✓ Completed
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    </>
                  )}

                  {currentUser.role === 'instructor' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white dark:bg-[#0B0C10] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Live Sessions</p>
                          <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2 mb-4">
                            {schedules.filter(s => s.instructorId === currentUser.id && s.status === 'scheduled').length}
                          </p>
                          <button onClick={() => setActiveTab('schedule')} className="text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors animate-pulseFast">
                            Manage schedule <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="bg-white dark:bg-[#0B0C10] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Evaluations Logged</p>
                          <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2 mb-4">
                            {progressRecords.filter(r => r.instructorId === currentUser.id).length}
                          </p>
                          <button onClick={() => setActiveTab('progress')} className="text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                            Open gradebook <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </>
                  )}

                  </div>
                  )}
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
                onUpdateRegistrationRequest={handleUpdateRegistrationRequest}
                onImpersonateStudent={handleImpersonateStudent}
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
                masterCourses={masterCourses}
                progressRecords={progressRecords}
                onSaveClassAttendance={handleSaveClassAttendance}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onUpdateStatus={handleUpdateClassStatus}
                onSelfEnroll={handleSelfEnroll}
                onAddBatch={handleAddBatch}
                onDeleteBatch={handleDeleteBatch}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                onAddMasterCourse={handleAddMasterCourse}
                onUpdateMasterCourse={handleUpdateMasterCourse}
                onDeleteMasterCourse={handleDeleteMasterCourse}
                showAddForm={scheduleShowAddForm}
                setShowAddForm={setScheduleShowAddForm}
                showBatchManager={scheduleShowBatchManager}
                setShowBatchManager={setScheduleShowBatchManager}
                showCourseDashboard={scheduleShowCourseDashboard}
                setShowCourseDashboard={setScheduleShowCourseDashboard}
                editingCourse={sharedEditingCourse}
                setEditingCourse={setSharedEditingCourse}
              />
            )}

            {activeTab === 'lectures' && (
              <ScheduleManager
                currentUser={currentUser}
                schedules={schedules}
                instructors={users.filter(u => u.role === 'instructor')}
                students={users.filter(u => u.role === 'student')}
                batches={batches}
                courses={courses}
                masterCourses={masterCourses}
                progressRecords={progressRecords}
                onSaveClassAttendance={handleSaveClassAttendance}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onUpdateStatus={handleUpdateClassStatus}
                onSelfEnroll={handleSelfEnroll}
                onAddBatch={handleAddBatch}
                onDeleteBatch={handleDeleteBatch}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                onAddMasterCourse={handleAddMasterCourse}
                onUpdateMasterCourse={handleUpdateMasterCourse}
                onDeleteMasterCourse={handleDeleteMasterCourse}
                showAddForm={false}
                showBatchManager={false}
                showCourseDashboard={false}
              />
            )}

            {activeTab === 'courses-directory' && ['admin', 'sub-admin'].includes(currentUser.role) && (
              <CourseDirectory
                currentUser={currentUser}
                courses={courses}
                users={users}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
                onTriggerEdit={(course) => {
                  setSharedEditingCourse(course);
                  setScheduleShowCourseDashboard(true);
                  setActiveTab('schedule');
                }}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTracker
                currentUser={currentUser}
                students={users.filter(u => u.role === 'student')}
                courses={courses}
                schedules={schedules}
                progressRecords={progressRecords}
                assignments={assignments}
                onAddProgressRecord={handleAddProgressRecord}
                studentEvolutions={studentEvolutions}
                onUpdateStudentEvolutions={setStudentEvolutions}
                onSendEmail={handleSendEmail}
                onUpdateUsers={setUsers}
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

            {activeTab === 'assignment-pipeline' && ['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
              <AssignmentPipeline
                currentUser={currentUser}
                courses={courses}
                batches={batches}
                assignmentBank={assignmentBank}
                setAssignmentBank={setAssignmentBank}
                assignments={assignments}
                setAssignments={setAssignments}
                evolutionBank={evolutionBank}
                setEvolutionBank={setEvolutionBank}
                studentEvolutions={studentEvolutions}
                setStudentEvolutions={setStudentEvolutions}
                users={users}
                setNotifications={setNotifications}
                onSendEmail={handleSendEmail}
              />
            )}

            {activeTab === 'assignment-tracker' && ['admin', 'sub-admin', 'instructor'].includes(currentUser.role) && (
              <AssignmentTracker
                currentUser={currentUser}
                users={users}
                courses={courses}
                batches={batches}
                assignments={assignments}
                setAssignments={setAssignments}
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
              </>
            )}
          </main>
        </div>
      )}

      {forgotEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                    
                    setForgotModalSuccess(`We have successfully matched user account @${matchedUser.username}. A security recovery dispatch has been routed to your registered email address: ${matchedUser.email}. Please check your email inbox to retrieve your credentials.`);
                  } else {
                    setForgotModalError('No active student, teacher, or administrative record matches this registered email address within our master databases.');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-mono text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Registered Email Address</label>
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
                  <p className="text-sm text-slate-400 dark:text-gray-500 leading-relaxed font-sans mt-1">
                    Once requested, you will receive an email shortly with your recovery credentials containing your username and password.
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


      {showExamModal && examRequest && (
        <AdmissionsExamModal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            setExamRequest(null);
          }}
          request={examRequest}
          onExamPassBg={(score) => {
            handleExamFinished(examRequest.id, score);
          }}
          onExamPass={(score) => {
            handleExamFinished(examRequest.id, score);
            setShowExamModal(false);
            setExamRequest(null);
          }}
        />
      )}
      {isStudentModalOpen && (
        <StudentHomeworkModal
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setActiveStudentModalAssignment(undefined);
            setActiveStudentModalEvolution(undefined);
          }}
          assignment={activeStudentModalAssignment}
          evolution={activeStudentModalEvolution}
          onSubmit={(id, text, fileUrn, proctorLogs, videoUrl) => {
             if (activeStudentModalAssignment) {
               handleStudentSubmitAssignment(id, text, fileUrn, proctorLogs, videoUrl);
             } else if (activeStudentModalEvolution) {
               setStudentEvolutions(prev => prev.map(ev => {
                 if (ev.id === id) {
                   return {
                     ...ev,
                     isCompleted: true,
                     week1Submission: text,
                     week1SubmissionDate: new Date().toLocaleDateString(),
                     proctoringLogs: proctorLogs,
                     recordedVideoUrl: videoUrl,
                   };
                 }
                 return ev;
               }));
               
               const toastNotif: AppNotification = {
                 id: generateUniqueId('notif-toast'),
                 title: 'Evolution Exam Submitted',
                 message: `Your monthly evaluation exam has been securely submitted with live proctoring telemetry.`,
                 timestamp: new Date().toISOString(),
                 read: false,
                 type: 'general',
                 channel: 'system'
               };
               triggerToast(toastNotif);
             }
             setIsStudentModalOpen(false);
             setActiveStudentModalAssignment(undefined);
             setActiveStudentModalEvolution(undefined);
          }}
        />
      )}

       {emailChallengeQueue && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                 <ShieldAlert className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                   Security Check Required
                 </h3>
                 <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                   Verifying transaction authenticity to prevent resource abuse.
                 </p>
               </div>
             </div>

             <div className="bg-slate-50 dark:bg-[#111113] border dark:border-white/5 rounded-2xl p-4 mb-4">
               <span className="text-[10px] uppercase text-amber-500 font-bold tracking-widest block mb-2">
                 Cryptographic Proof-of-Work
               </span>
               <p className="text-xs text-slate-600 dark:text-gray-300 mb-3 leading-relaxed">
                 To dispatch this email securely to <strong className="font-semibold text-slate-800 dark:text-gray-100">{emailChallengeQueue.to}</strong>, please solve this math puzzle:
               </p>

               <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#0A0A0B] border dark:border-white/5 px-4 py-3 rounded-xl shadow-xs">
                 {emailChallengeText ? (
                   <span className="text-sm font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">
                     {emailChallengeText} = ?
                   </span>
                 ) : (
                   <span className="text-xs text-slate-400 animate-pulse">
                     Generating security challenge...
                   </span>
                 )}
                 
                 <button
                   type="button"
                   onClick={async () => {
                     setEmailChallengeText('');
                     const res = await fetch('/api/get-challenge');
                     if (res.ok) {
                       const data = await res.json();
                       setEmailChallengeText(data.challengeText);
                       setEmailChallengeToken(data.challengeToken);
                     }
                   }}
                   className="text-[10px] text-blue-500 hover:underline font-bold"
                   disabled={!emailChallengeText}
                 >
                   Reload Puzzle
                 </button>
               </div>
             </div>

             <form onSubmit={handleVerifyAndSendEmail} className="space-y-4">
               <input
                 type="email"
                 value={emailChallengeHoneypot}
                 onChange={(e) => setEmailChallengeHoneypot(e.target.value)}
                 className="hidden"
                 placeholder="Secondary verification email"
               />

               <div>
                 <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                   Your Solution
                 </label>
                 <input
                   type="text"
                   required
                   value={emailChallengeInput}
                   onChange={(e) => setEmailChallengeInput(e.target.value)}
                   className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-[#0C0C0D] border border-slate-200/80 dark:border-white/5 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition font-mono"
                   placeholder="Enter evaluation result"
                   disabled={isSendingEmail || !emailChallengeText}
                   autoFocus
                 />
               </div>

               {emailChallengeError && (
                 <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500 rounded-xl text-xs flex items-start gap-2">
                   <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                   <span>{emailChallengeError}</span>
                 </div>
               )}

               <div className="flex gap-2.5 pt-2">
                 <button
                   type="button"
                   onClick={handleCancelEmailDispatch}
                   className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#161618] dark:hover:bg-[#1e1e21] text-slate-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   disabled={isSendingEmail || !emailChallengeText}
                   className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-amber-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                 >
                   {isSendingEmail ? (
                     <>
                       <Clock className="w-3.5 h-3.5 animate-spin" /> Verifying...
                     </>
                   ) : (
                     <>
                       <Check className="w-3.5 h-3.5" /> Verify & Dispatch
                     </>
                   )}
                 </button>
               </div>
             </form>
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
