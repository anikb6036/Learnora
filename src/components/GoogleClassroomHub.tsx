/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BookOpen,
  Plus,
  RefreshCw,
  ExternalLink,
  Megaphone,
  ClipboardList,
  Users,
  Settings,
  Trash2,
  Send,
  FolderPlus,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Shield,
  LogOut,
  X,
  FileText,
  GraduationCap,
  Search,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount } from '../types';
import GoogleSignInButton from './GoogleSignInButton';
import {
  clearWorkspaceToken,
  getWorkspaceAccessToken,
  getWorkspaceUser,
  initWorkspaceAuth,
  signInWithGoogleWorkspace,
} from '../googleWorkspaceAuth';
import {
  ClassroomAnnouncement,
  ClassroomCourse,
  ClassroomCourseWork,
  ClassroomMaterial,
  ClassroomRosterMember,
  ClassroomStudentSubmission,
  ClassroomTopic,
  createAnnouncement,
  createClassroomCourse,
  createCourseTopic,
  createCourseWork,
  createCourseWorkMaterial,
  deleteAnnouncement,
  deleteClassroomCourse,
  deleteCourseWork,
  gradeStudentSubmission,
  inviteStudentToCourse,
  listAnnouncements,
  listClassroomCourses,
  listCourseStudents,
  listCourseTeachers,
  listCourseTopics,
  listCourseWork,
  listCourseWorkMaterials,
  listStudentSubmissions,
  removeStudentFromCourse,
  updateClassroomCourse,
} from '../googleClassroom';

interface GoogleClassroomHubProps {
  currentUser: UserAccount;
}

type CourseSubTab = 'stream' | 'classwork' | 'people' | 'settings';

interface PendingConfirmation {
  title: string;
  description: string;
  details: string[];
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (activeToken: string) => Promise<void>;
}

export default function GoogleClassroomHub({ currentUser }: GoogleClassroomHubProps) {
  const isStaff = ['admin', 'sub-admin', 'instructor'].includes(currentUser.role);

  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getWorkspaceAccessToken());
  const [token, setToken] = useState<string | null>(() => getWorkspaceAccessToken());
  const [googleUser, setGoogleUser] = useState<User | null>(() => getWorkspaceUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<CourseSubTab>('stream');

  // Create Course state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('');
  const [newCourseRoom, setNewCourseRoom] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Course details state
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [topics, setTopics] = useState<ClassroomTopic[]>([]);
  const [courseWork, setCourseWork] = useState<ClassroomCourseWork[]>([]);
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [teachers, setTeachers] = useState<ClassroomRosterMember[]>([]);
  const [students, setStudents] = useState<ClassroomRosterMember[]>([]);

  // Forms inside course
  const [announcementText, setAnnouncementText] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [showCreateWork, setShowCreateWork] = useState(false);
  const [workMode, setWorkMode] = useState<'assignment' | 'material'>('assignment');
  const [workTitle, setWorkTitle] = useState('');
  const [workDesc, setWorkDesc] = useState('');
  const [workMaxPoints, setWorkMaxPoints] = useState('100');
  const [workTopicId, setWorkTopicId] = useState('');
  const [workDueDate, setWorkDueDate] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Submissions & grading state
  const [activeSubmissionsWork, setActiveSubmissionsWork] = useState<ClassroomCourseWork | null>(null);
  const [submissions, setSubmissions] = useState<ClassroomStudentSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  // Course edit state
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseSection, setEditCourseSection] = useState('');
  const [editCourseRoom, setEditCourseRoom] = useState('');
  const [editCourseState, setEditCourseState] = useState<'ACTIVE' | 'ARCHIVED' | 'PROVISIONED'>('ACTIVE');

  // Feedback & confirmation modal
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user, activeToken) => {
        setGoogleUser(user);
        setToken(activeToken);
        setNeedsAuth(false);
      },
      () => {
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (token && !needsAuth && courses.length === 0) {
      void fetchCourses(token);
    }
  }, [token, needsAuth]);

  const handleApiError = (err: any) => {
    if (err?.status === 401) {
      setToken(null);
      setNeedsAuth(true);
      setFeedback({
        type: 'error',
        text: 'Your Google Classroom session expired. Please sign in with Google again.',
      });
      return;
    }
    setFeedback({
      type: 'error',
      text: err?.message || 'Google Classroom request failed.',
    });
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleWorkspace();
      setToken(result.accessToken);
      setGoogleUser(result.user);
      setNeedsAuth(false);
      await fetchCourses(result.accessToken);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to connect Google Classroom.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    await clearWorkspaceToken(false);
    setToken(null);
    setNeedsAuth(true);
    setCourses([]);
    setSelectedCourse(null);
    setFeedback(null);
  };

  const fetchCourses = async (overrideToken?: string) => {
    const activeToken = overrideToken || token || getWorkspaceAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    setIsLoadingCourses(true);
    setFeedback(null);
    try {
      const list = await listClassroomCourses(activeToken);
      setCourses(list);
      if (list.length > 0 && !selectedCourse) {
        await selectAndLoadCourse(list[0], activeToken);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const selectAndLoadCourse = async (course: ClassroomCourse, overrideToken?: string) => {
    const activeToken = overrideToken || token || getWorkspaceAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setSelectedCourse(course);
    setEditCourseName(course.name || '');
    setEditCourseSection(course.section || '');
    setEditCourseRoom(course.room || '');
    setEditCourseState(
      course.courseState === 'ARCHIVED' || course.courseState === 'PROVISIONED'
        ? course.courseState
        : 'ACTIVE'
    );
    setActiveSubmissionsWork(null);
    setSubmissions([]);
    setIsLoadingDetails(true);

    try {
      const [ann, top, work, mats, tchs, studs] = await Promise.all([
        listAnnouncements(activeToken, course.id).catch(() => []),
        listCourseTopics(activeToken, course.id).catch(() => []),
        listCourseWork(activeToken, course.id).catch(() => []),
        listCourseWorkMaterials(activeToken, course.id).catch(() => []),
        listCourseTeachers(activeToken, course.id).catch(() => []),
        listCourseStudents(activeToken, course.id).catch(() => []),
      ]);
      setAnnouncements(ann);
      setTopics(top);
      setCourseWork(work);
      setMaterials(mats);
      setTeachers(tchs);
      setStudents(studs);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const executeConfirmation = async () => {
    if (!pendingConfirm) return;
    const activeToken = token || getWorkspaceAccessToken();
    if (!activeToken) {
      setPendingConfirm(null);
      setNeedsAuth(true);
      return;
    }

    setIsExecutingConfirm(true);
    setFeedback(null);
    try {
      await pendingConfirm.onConfirm(activeToken);
      setPendingConfirm(null);
    } catch (err) {
      setPendingConfirm(null);
      handleApiError(err);
    } finally {
      setIsExecutingConfirm(false);
    }
  };

  const handleRequestCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    setPendingConfirm({
      title: 'Create Google Classroom Course',
      description: `Create "${newCourseName.trim()}" in your Google Classroom account?`,
      details: [
        `Course Name: ${newCourseName.trim()}`,
        newCourseSection ? `Section: ${newCourseSection.trim()}` : 'Section: None',
        newCourseRoom ? `Room: ${newCourseRoom.trim()}` : 'Room: None',
      ],
      confirmLabel: 'Confirm Create Course',
      onConfirm: async (activeToken) => {
        const created = await createClassroomCourse(activeToken, {
          name: newCourseName.trim(),
          section: newCourseSection.trim() || undefined,
          room: newCourseRoom.trim() || undefined,
          description: newCourseDesc.trim() || undefined,
          courseState: 'ACTIVE',
        });
        setCourses(prev => [created, ...prev]);
        setShowCreateCourse(false);
        setNewCourseName('');
        setNewCourseSection('');
        setNewCourseRoom('');
        setNewCourseDesc('');
        setFeedback({ type: 'success', text: `Created Google Classroom course "${created.name}".` });
        await selectAndLoadCourse(created, activeToken);
      },
    });
  };

  const handleRequestPostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !announcementText.trim()) return;
    const text = announcementText.trim();
    setPendingConfirm({
      title: 'Post Course Announcement',
      description: `Post this announcement to "${selectedCourse.name}"?`,
      details: [`Message: "${text.length > 140 ? `${text.slice(0, 140)}...` : text}"`],
      confirmLabel: 'Confirm Post',
      onConfirm: async (activeToken) => {
        const created = await createAnnouncement(activeToken, selectedCourse.id, text, 'PUBLISHED');
        setAnnouncements(prev => [created, ...prev]);
        setAnnouncementText('');
        setFeedback({ type: 'success', text: 'Announcement posted to Google Classroom stream.' });
      },
    });
  };

  const handleRequestDeleteAnnouncement = (ann: ClassroomAnnouncement) => {
    if (!selectedCourse) return;
    setPendingConfirm({
      title: 'Delete Announcement',
      description: `Permanently delete this announcement from "${selectedCourse.name}"?`,
      details: [`"${ann.text.length > 120 ? `${ann.text.slice(0, 120)}...` : ann.text}"`],
      confirmLabel: 'Delete Announcement',
      destructive: true,
      onConfirm: async (activeToken) => {
        await deleteAnnouncement(activeToken, selectedCourse.id, ann.id);
        setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
        setFeedback({ type: 'success', text: 'Announcement deleted.' });
      },
    });
  };

  const handleRequestCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newTopicName.trim()) return;
    const topicName = newTopicName.trim();
    setPendingConfirm({
      title: 'Create Classwork Topic',
      description: `Add topic "${topicName}" to "${selectedCourse.name}"?`,
      details: [`Topic Name: ${topicName}`],
      confirmLabel: 'Create Topic',
      onConfirm: async (activeToken) => {
        const created = await createCourseTopic(activeToken, selectedCourse.id, topicName);
        setTopics(prev => [...prev, created]);
        setNewTopicName('');
        setFeedback({ type: 'success', text: `Topic "${created.name}" created.` });
      },
    });
  };

  const handleRequestCreateWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !workTitle.trim()) return;
    const title = workTitle.trim();
    setPendingConfirm({
      title: workMode === 'assignment' ? 'Publish Assignment' : 'Publish Course Material',
      description: `Publish "${title}" to "${selectedCourse.name}"?`,
      details: [
        `Type: ${workMode === 'assignment' ? 'Assignment' : 'Material'}`,
        ...(workMode === 'assignment' ? [`Max Points: ${Number(workMaxPoints) || 100}`] : []),
        ...(workDueDate ? [`Due Date: ${workDueDate}`] : []),
      ],
      confirmLabel: workMode === 'assignment' ? 'Publish Assignment' : 'Publish Material',
      onConfirm: async (activeToken) => {
        if (workMode === 'assignment') {
          let dueDateObj: { year: number; month: number; day: number } | undefined;
          if (workDueDate) {
            const [y, m, d] = workDueDate.split('-').map(Number);
            if (y && m && d) dueDateObj = { year: y, month: m, day: d };
          }
          const created = await createCourseWork(activeToken, selectedCourse.id, {
            title,
            description: workDesc.trim() || undefined,
            maxPoints: Number(workMaxPoints) || 100,
            topicId: workTopicId || undefined,
            dueDate: dueDateObj,
            dueTime: dueDateObj ? { hours: 23, minutes: 59 } : undefined,
            state: 'PUBLISHED',
          });
          setCourseWork(prev => [created, ...prev]);
          setFeedback({ type: 'success', text: `Assignment "${created.title}" published.` });
        } else {
          const created = await createCourseWorkMaterial(activeToken, selectedCourse.id, {
            title,
            description: workDesc.trim() || undefined,
            topicId: workTopicId || undefined,
            state: 'PUBLISHED',
          });
          setMaterials(prev => [created, ...prev]);
          setFeedback({ type: 'success', text: `Material "${created.title}" published.` });
        }
        setShowCreateWork(false);
        setWorkTitle('');
        setWorkDesc('');
        setWorkDueDate('');
      },
    });
  };

  const handleRequestDeleteWork = (cw: ClassroomCourseWork) => {
    if (!selectedCourse) return;
    setPendingConfirm({
      title: 'Delete Assignment',
      description: `Delete assignment "${cw.title}" from "${selectedCourse.name}"?`,
      details: ['All associated student submission records for this assignment in Google Classroom will be removed.'],
      confirmLabel: 'Delete Assignment',
      destructive: true,
      onConfirm: async (activeToken) => {
        await deleteCourseWork(activeToken, selectedCourse.id, cw.id);
        setCourseWork(prev => prev.filter(w => w.id !== cw.id));
        if (activeSubmissionsWork?.id === cw.id) {
          setActiveSubmissionsWork(null);
          setSubmissions([]);
        }
        setFeedback({ type: 'success', text: `Deleted assignment "${cw.title}".` });
      },
    });
  };

  const handleLoadSubmissions = async (cw: ClassroomCourseWork) => {
    if (!selectedCourse) return;
    const activeToken = token || getWorkspaceAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setActiveSubmissionsWork(cw);
    setIsLoadingSubmissions(true);
    try {
      const list = await listStudentSubmissions(activeToken, selectedCourse.id, cw.id);
      setSubmissions(list);
      const nextInputs: Record<string, string> = {};
      list.forEach(s => {
        nextInputs[s.id] = s.assignedGrade !== undefined ? String(s.assignedGrade) : s.draftGrade !== undefined ? String(s.draftGrade) : '';
      });
      setGradeInputs(nextInputs);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleRequestSaveGrade = (sub: ClassroomStudentSubmission) => {
    if (!selectedCourse || !activeSubmissionsWork) return;
    const numericGrade = Number(gradeInputs[sub.id]);
    if (Number.isNaN(numericGrade) || numericGrade < 0) {
      setFeedback({ type: 'error', text: 'Please enter a valid numeric grade.' });
      return;
    }
    const studentName =
      students.find(st => st.userId === sub.userId)?.profile?.name?.fullName || sub.userId;

    setPendingConfirm({
      title: 'Update Student Grade',
      description: `Assign grade ${numericGrade} to ${studentName} for "${activeSubmissionsWork.title}"?`,
      details: [
        `Assigned Grade: ${numericGrade}${activeSubmissionsWork.maxPoints ? ` / ${activeSubmissionsWork.maxPoints}` : ''}`,
      ],
      confirmLabel: 'Confirm Grade',
      onConfirm: async (activeToken) => {
        const updated = await gradeStudentSubmission(
          activeToken,
          selectedCourse.id,
          activeSubmissionsWork.id,
          sub.id,
          numericGrade,
          numericGrade
        );
        setSubmissions(prev => prev.map(item => (item.id === updated.id ? updated : item)));
        setFeedback({ type: 'success', text: `Saved grade (${numericGrade}) for ${studentName}.` });
      },
    });
  };

  const handleRequestInviteStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !inviteEmail.trim()) return;
    const target = inviteEmail.trim();
    setPendingConfirm({
      title: 'Invite Student to Course',
      description: `Send a Google Classroom student invitation to "${target}" for "${selectedCourse.name}"?`,
      details: [`Recipient: ${target}`, 'Role: STUDENT'],
      confirmLabel: 'Send Invitation',
      onConfirm: async (activeToken) => {
        await inviteStudentToCourse(activeToken, selectedCourse.id, target);
        setInviteEmail('');
        setFeedback({ type: 'success', text: `Invitation sent to ${target}.` });
      },
    });
  };

  const handleRequestRemoveStudent = (member: ClassroomRosterMember) => {
    if (!selectedCourse) return;
    const displayName = member.profile?.name?.fullName || member.profile?.emailAddress || member.userId;
    setPendingConfirm({
      title: 'Remove Student from Roster',
      description: `Remove ${displayName} from "${selectedCourse.name}"?`,
      details: ['The student will lose access to this Google Classroom course.'],
      confirmLabel: 'Remove Student',
      destructive: true,
      onConfirm: async (activeToken) => {
        await removeStudentFromCourse(activeToken, selectedCourse.id, member.userId);
        setStudents(prev => prev.filter(s => s.userId !== member.userId));
        setFeedback({ type: 'success', text: `Removed ${displayName} from course roster.` });
      },
    });
  };

  const handleRequestUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !editCourseName.trim()) return;
    setPendingConfirm({
      title: 'Update Course Settings',
      description: `Save updated course details for "${selectedCourse.name}"?`,
      details: [
        `Name: ${editCourseName.trim()}`,
        `Section: ${editCourseSection.trim() || 'None'}`,
        `Room: ${editCourseRoom.trim() || 'None'}`,
        `State: ${editCourseState}`,
      ],
      confirmLabel: 'Save Changes',
      onConfirm: async (activeToken) => {
        const updated = await updateClassroomCourse(activeToken, selectedCourse.id, {
          name: editCourseName.trim(),
          section: editCourseSection.trim(),
          room: editCourseRoom.trim(),
          courseState: editCourseState,
        });
        setSelectedCourse(updated);
        setCourses(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        setFeedback({ type: 'success', text: `Updated course "${updated.name}".` });
      },
    });
  };

  const handleRequestDeleteCourse = () => {
    if (!selectedCourse) return;
    const targetCourse = selectedCourse;
    setPendingConfirm({
      title: 'Delete Google Classroom Course',
      description: `Permanently delete "${targetCourse.name}"? This action cannot be undone.`,
      details: [
        `Course ID: ${targetCourse.id}`,
        'Note: Google Classroom requires a course to be ARCHIVED before permanent deletion.',
      ],
      confirmLabel: 'Delete Course Permanently',
      destructive: true,
      onConfirm: async (activeToken) => {
        await deleteClassroomCourse(activeToken, targetCourse.id);
        const remaining = courses.filter(c => c.id !== targetCourse.id);
        setCourses(remaining);
        setSelectedCourse(remaining[0] || null);
        setFeedback({ type: 'success', text: `Deleted course "${targetCourse.name}".` });
      },
    });
  };

  const filteredCourses = courses.filter(c => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.section || '').toLowerCase().includes(q) ||
      (c.room || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Google Classroom
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Sync and manage Google Classroom courses, stream announcements, assignments, materials, rosters, and student grades.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!needsAuth && token ? (
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2">
              {googleUser?.photoURL ? (
                <img src={googleUser.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                  {googleUser?.displayName || 'Google Connected'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                  {googleUser?.email || 'Classroom API Active'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                title="Disconnect Google session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
          )}
        </div>
      </div>

      {/* Auth Gate */}
      {needsAuth && (
        <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Shield className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Connect Google Classroom
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Sign in with your Google account to browse your Google Classroom courses, view classwork and announcements, and manage assignments and rosters.
            </p>
          </div>
          {authError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {authError}
            </div>
          )}
          <div className="pt-1 flex justify-center">
            <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {feedback.text}
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      {!needsAuth && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Courses List */}
          <div className="lg:col-span-4 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Courses ({courses.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void fetchCourses()}
                  disabled={isLoadingCourses}
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  title="Refresh courses"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCourses ? 'animate-spin' : ''}`} />
                </button>
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(!showCreateCourse)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                )}
              </div>
            </div>

            {showCreateCourse && isStaff && (
              <form
                onSubmit={handleRequestCreateCourse}
                className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-2.5"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">Create Classroom Course</p>
                <input
                  type="text"
                  required
                  placeholder="Course name (e.g. Physics 101)"
                  value={newCourseName}
                  onChange={e => setNewCourseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Section (e.g. Batch A)"
                    value={newCourseSection}
                    onChange={e => setNewCourseSection(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Room"
                    value={newCourseRoom}
                    onChange={e => setNewCourseRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={newCourseDesc}
                  onChange={e => setNewCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(false)}
                    className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter courses..."
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {isLoadingCourses ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading Google Classroom courses...</p>
            ) : filteredCourses.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-zinc-400">
                No Google Classroom courses found for this account.
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredCourses.map(c => {
                  const isActive = selectedCourse?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => void selectAndLoadCourse(c)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-zinc-300 shrink-0">
                          {c.courseState || 'ACTIVE'}
                        </span>
                      </div>
                      {(c.section || c.room) && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                          {[c.section, c.room].filter(Boolean).join(' • ')}
                        </p>
                      )}
                      {c.enrollmentCode && (
                        <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                          Code: {c.enrollmentCode}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Selected Course Details */}
          <div className="lg:col-span-8 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5">
            {!selectedCourse ? (
              <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-400">
                Select a Google Classroom course on the left to view its stream, classwork, roster, and settings.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedCourse.name}</h3>
                      {selectedCourse.enrollmentCode && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold">
                          Class Code: {selectedCourse.enrollmentCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {[selectedCourse.section, selectedCourse.room, selectedCourse.description].filter(Boolean).join(' • ') || 'Google Classroom Course'}
                    </p>
                  </div>
                  {selectedCourse.alternateLink && (
                    <a
                      href={selectedCourse.alternateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 w-fit"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Classroom
                    </a>
                  )}
                </div>

                {/* Course Sub-tabs */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCourseSubTab('stream')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      courseSubTab === 'stream'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Stream ({announcements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseSubTab('classwork')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      courseSubTab === 'classwork'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Classwork ({courseWork.length + materials.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseSubTab('people')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      courseSubTab === 'people'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> People ({teachers.length + students.length})
                  </button>
                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => setCourseSubTab('settings')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        courseSubTab === 'settings'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                  )}
                </div>

                {isLoadingDetails ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Loading course data from Google Classroom...</p>
                ) : (
                  <>
                    {/* STREAM TAB */}
                    {courseSubTab === 'stream' && (
                      <div className="space-y-4">
                        {isStaff && (
                          <form onSubmit={handleRequestPostAnnouncement} className="space-y-2.5">
                            <textarea
                              rows={3}
                              placeholder="Announce something to your Google Classroom class..."
                              value={announcementText}
                              onChange={e => setAnnouncementText(e.target.value)}
                              className="w-full p-3.5 text-xs border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] text-slate-900 dark:text-white focus:outline-none"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={!announcementText.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" /> Post Announcement
                              </button>
                            </div>
                          </form>
                        )}

                        {announcements.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 py-8 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                            No announcements posted in this course yet.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {announcements.map(ann => (
                              <div
                                key={ann.id}
                                className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                    {ann.text}
                                  </p>
                                  {isStaff && (
                                    <button
                                      type="button"
                                      onClick={() => handleRequestDeleteAnnouncement(ann)}
                                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                      title="Delete announcement"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>{ann.creationTime ? new Date(ann.creationTime).toLocaleString() : ''}</span>
                                  {ann.alternateLink && (
                                    <a
                                      href={ann.alternateLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CLASSWORK TAB */}
                    {courseSubTab === 'classwork' && (
                      <div className="space-y-5">
                        {isStaff && (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <form onSubmit={handleRequestCreateTopic} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="New topic name..."
                                value={newTopicName}
                                onChange={e => setNewTopicName(e.target.value)}
                                className="px-3 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              />
                              <button
                                type="submit"
                                disabled={!newTopicName.trim()}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <FolderPlus className="w-3.5 h-3.5" /> Add Topic
                              </button>
                            </form>

                            <button
                              type="button"
                              onClick={() => setShowCreateWork(!showCreateWork)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create Classwork
                            </button>
                          </div>
                        )}

                        {showCreateWork && isStaff && (
                          <form
                            onSubmit={handleRequestCreateWork}
                            className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setWorkMode('assignment')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                                  workMode === 'assignment'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                                }`}
                              >
                                Assignment
                              </button>
                              <button
                                type="button"
                                onClick={() => setWorkMode('material')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                                  workMode === 'material'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-zinc-300'
                                }`}
                              >
                                Reference Material
                              </button>
                            </div>

                            <input
                              type="text"
                              required
                              placeholder={workMode === 'assignment' ? 'Assignment title' : 'Material title'}
                              value={workTitle}
                              onChange={e => setWorkTitle(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                            />
                            <textarea
                              rows={2}
                              placeholder="Instructions / description"
                              value={workDesc}
                              onChange={e => setWorkDesc(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <select
                                value={workTopicId}
                                onChange={e => setWorkTopicId(e.target.value)}
                                className="px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              >
                                <option value="">No Topic</option>
                                {topics.map(t => (
                                  <option key={t.topicId} value={t.topicId}>{t.name}</option>
                                ))}
                              </select>
                              {workMode === 'assignment' && (
                                <>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Max points"
                                    value={workMaxPoints}
                                    onChange={e => setWorkMaxPoints(e.target.value)}
                                    className="px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                                  />
                                  <input
                                    type="date"
                                    value={workDueDate}
                                    onChange={e => setWorkDueDate(e.target.value)}
                                    className="px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                                  />
                                </>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowCreateWork(false)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Publish
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Assignments List */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                            Assignments ({courseWork.length})
                          </h4>
                          {courseWork.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-center">
                              No coursework assignments yet.
                            </p>
                          ) : (
                            courseWork.map(cw => {
                              const topicName = topics.find(t => t.topicId === cw.topicId)?.name;
                              return (
                                <div
                                  key={cw.id}
                                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{cw.title}</span>
                                        {topicName && (
                                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                                            {topicName}
                                          </span>
                                        )}
                                        {cw.maxPoints !== undefined && (
                                          <span className="text-[10px] font-mono text-slate-500">{cw.maxPoints} pts</span>
                                        )}
                                      </div>
                                      {cw.description && (
                                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">{cw.description}</p>
                                      )}
                                      {cw.dueDate && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                          Due: {cw.dueDate.year}-{String(cw.dueDate.month).padStart(2, '0')}-{String(cw.dueDate.day).padStart(2, '0')}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => void handleLoadSubmissions(cw)}
                                        className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <Award className="w-3 h-3" /> {isStaff ? 'Submissions & Grade' : 'My Submission'}
                                      </button>
                                      {cw.alternateLink && (
                                        <a
                                          href={cw.alternateLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-white/10"
                                          title="Open in Google Classroom"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      {isStaff && (
                                        <button
                                          type="button"
                                          onClick={() => handleRequestDeleteWork(cw)}
                                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                                          title="Delete assignment"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Submissions Drawer */}
                        {activeSubmissionsWork && (
                          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                Submissions: {activeSubmissionsWork.title}
                              </h5>
                              <button
                                type="button"
                                onClick={() => setActiveSubmissionsWork(null)}
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {isLoadingSubmissions ? (
                              <p className="text-xs text-slate-500">Loading submissions...</p>
                            ) : submissions.length === 0 ? (
                              <p className="text-xs text-slate-500">No student submissions found.</p>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {submissions.map(sub => {
                                  const studentName =
                                    students.find(st => st.userId === sub.userId)?.profile?.name?.fullName ||
                                    sub.userId;
                                  return (
                                    <div
                                      key={sub.id}
                                      className="p-3 rounded-xl bg-white dark:bg-[#0A0A0B] border border-slate-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-800 dark:text-white">{studentName}</span>
                                        <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300">
                                          {sub.state || 'CREATED'}{sub.late ? ' (LATE)' : ''}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isStaff ? (
                                          <>
                                            <input
                                              type="number"
                                              min={0}
                                              placeholder="Score"
                                              value={gradeInputs[sub.id] ?? ''}
                                              onChange={e =>
                                                setGradeInputs(prev => ({ ...prev, [sub.id]: e.target.value }))
                                              }
                                              className="w-20 px-2 py-1 text-xs border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#070708] text-slate-900 dark:text-white"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleRequestSaveGrade(sub)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                                            >
                                              Save Grade
                                            </button>
                                          </>
                                        ) : (
                                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {sub.assignedGrade !== undefined
                                              ? `${sub.assignedGrade}${activeSubmissionsWork.maxPoints ? ` / ${activeSubmissionsWork.maxPoints}` : ''}`
                                              : 'Ungraded'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Materials List */}
                        {materials.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                              Reference Materials ({materials.length})
                            </h4>
                            {materials.map(mat => (
                              <div
                                key={mat.id}
                                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{mat.title}</p>
                                    {mat.description && (
                                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{mat.description}</p>
                                    )}
                                  </div>
                                </div>
                                {mat.alternateLink && (
                                  <a
                                    href={mat.alternateLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0 hover:underline"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Open
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PEOPLE TAB */}
                    {courseSubTab === 'people' && (
                      <div className="space-y-5">
                        {isStaff && (
                          <form onSubmit={handleRequestInviteStudent} className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="email"
                              required
                              placeholder="Student email to invite to Google Classroom..."
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                              className="flex-1 px-3.5 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Invite Student
                            </button>
                          </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                              Teachers ({teachers.length})
                            </h4>
                            <div className="space-y-2">
                              {teachers.map(t => (
                                <div
                                  key={t.userId}
                                  className="p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 flex items-center gap-2.5"
                                >
                                  {t.profile?.photoUrl ? (
                                    <img
                                      src={t.profile.photoUrl.startsWith('//') ? `https:${t.profile.photoUrl}` : t.profile.photoUrl}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-[11px] font-bold">
                                      {(t.profile?.name?.fullName || 'T')[0]}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {t.profile?.name?.fullName || t.userId}
                                    </p>
                                    {t.profile?.emailAddress && (
                                      <p className="text-[10px] text-slate-500 truncate">{t.profile.emailAddress}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                              Students ({students.length})
                            </h4>
                            {students.length === 0 ? (
                              <p className="text-xs text-slate-500">No enrolled students yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-72 overflow-y-auto">
                                {students.map(s => (
                                  <div
                                    key={s.userId}
                                    className="p-3 rounded-2xl border border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {s.profile?.photoUrl ? (
                                        <img
                                          src={s.profile.photoUrl.startsWith('//') ? `https:${s.profile.photoUrl}` : s.profile.photoUrl}
                                          alt=""
                                          className="w-7 h-7 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center text-[11px] font-bold">
                                          {(s.profile?.name?.fullName || 'S')[0]}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {s.profile?.name?.fullName || s.userId}
                                        </p>
                                        {s.profile?.emailAddress && (
                                          <p className="text-[10px] text-slate-500 truncate">{s.profile.emailAddress}</p>
                                        )}
                                      </div>
                                    </div>
                                    {isStaff && (
                                      <button
                                        type="button"
                                        onClick={() => handleRequestRemoveStudent(s)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                        title="Remove student"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SETTINGS TAB */}
                    {courseSubTab === 'settings' && isStaff && (
                      <div className="space-y-5">
                        <form onSubmit={handleRequestUpdateCourse} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                                Course Name
                              </label>
                              <input
                                type="text"
                                required
                                value={editCourseName}
                                onChange={e => setEditCourseName(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                                Section
                              </label>
                              <input
                                type="text"
                                value={editCourseSection}
                                onChange={e => setEditCourseSection(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                                Room
                              </label>
                              <input
                                type="text"
                                value={editCourseRoom}
                                onChange={e => setEditCourseRoom(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                                Course State
                              </label>
                              <select
                                value={editCourseState}
                                onChange={e =>
                                  setEditCourseState(e.target.value as 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED')
                                }
                                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                                <option value="PROVISIONED">PROVISIONED</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                            <button
                              type="button"
                              onClick={handleRequestDeleteCourse}
                              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Course
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Save Course Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Confirmation Modal */}
      <AnimatePresence>
        {pendingConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${
                    pendingConfirm.destructive
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{pendingConfirm.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {pendingConfirm.description}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 rounded-2xl p-3.5 text-[11px] text-slate-600 dark:text-zinc-300">
                {pendingConfirm.details.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  disabled={isExecutingConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void executeConfirmation()}
                  disabled={isExecutingConfirm}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-60 ${
                    pendingConfirm.destructive
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isExecutingConfirm ? 'Processing...' : pendingConfirm.confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
