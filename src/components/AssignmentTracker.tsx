import React, { useState } from 'react';
import { UserAccount, Course, StudentBatch, StudentAssignment, StudentSubmission } from '../types';
import { ClipboardList, CheckCircle2, AlertCircle, Clock, Mail, MessageSquare, Award, AlertTriangle } from 'lucide-react';

interface AssignmentTrackerProps {
  currentUser: UserAccount;
  users: UserAccount[];
  courses: Course[];
  batches: StudentBatch[];
  assignments: StudentAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<StudentAssignment[]>>;
}

export default function AssignmentTracker({
  currentUser,
  users,
  courses,
  batches,
  assignments,
  setAssignments,
}: AssignmentTrackerProps) {
  // Permission Guard
  if (!['admin', 'sub-admin', 'instructor'].includes(currentUser.role)) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#070708] rounded-md border border-slate-200 dark:border-white/10 max-w-lg mx-auto my-12" id="tracker-access-error">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Only administrators, sub-admins, and course instructors are authorized to access the Assignment Status Tracker.
        </p>
      </div>
    );
  }

  // Selection states
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedAsgId, setSelectedAsgId] = useState<string>('');
  const [filterOption, setFilterOption] = useState<'submitted' | 'not-submitted'>('submitted');

  // Inline grading state
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [inlineScore, setInlineScore] = useState<number>(100);
  const [inlineFeedback, setInlineFeedback] = useState<string>('');
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Filter students (students only)
  const allStudents = users.filter((u) => u.role === 'student');

  // Find unique course/batch options actually represented in courses/batches lists, or among students
  const activeCourses = courses.length > 0 ? courses : Array.from(new Set(allStudents.map((s) => s.course).filter(Boolean))) as unknown as Course[];
  
  const getBatchDisplayLabel = (nameOrId: string): string => {
    if (!nameOrId) return '';
    const valLower = nameOrId.toLowerCase().trim();
    if (valLower === 'stb_001' || valLower === 'batch a' || valLower === 'batch-1' || valLower === 'batch_a') return 'stb_001';
    if (valLower === 'stb_002' || valLower === 'batch b' || valLower === 'batch-2' || valLower === 'batch_b') return 'stb_002';
    if (valLower === 'stb_003' || valLower === 'batch c' || valLower === 'batch-3' || valLower === 'batch_c') return 'stb_003';
    if (valLower === 'stb_004' || valLower === 'batch d' || valLower === 'batch-4' || valLower === 'batch_d') return 'stb_004';
    return nameOrId;
  };

  const areBatchesEquivalent = (batchA: string | undefined, batchB: string | undefined): boolean => {
    if (!batchA || !batchB) return false;
    const a = batchA.toLowerCase().trim();
    const b = batchB.toLowerCase().trim();
    if (a === b) return true;
    
    const map: Record<string, string[]> = {
      'stb_001': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'stb_002': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'stb_003': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'stb_004': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
      'batch a': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'batch b': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'batch c': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'batch d': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
    };
    
    return !!(map[a] && map[a].includes(b));
  };

  const activeBatches = React.useMemo(() => {
    // 1. Collect all raw batches. Some can be objects, some strings (if from fallback)
    const rawList: StudentBatch[] = batches.length > 0 
      ? batches 
      : Array.from(new Set(allStudents.map((s) => s.batch).filter(Boolean))).map(
          name => ({ id: name, name, createdDate: '', status: 'ongoing' as const } as StudentBatch)
        );

    // 2. Normalize and filter strictly to only show ongoing batches (status is 'ongoing' or not explicitly completed/upcoming)
    const ongoingBatches = rawList.filter((b) => {
      if (!b) return false;
      
      // If b is an object and has a status, check it
      if (b.status) {
        return b.status === 'ongoing';
      }
      
      // If it has no status, check if it's in the batches list with a non-ongoing status
      const dbMatch = batches.find(db => db.name === b.name || db.id === b.id);
      if (dbMatch && dbMatch.status) {
        return dbMatch.status === 'ongoing';
      }
      
      // Default to true if not explicitly set to completed or upcoming
      return true;
    });

    // 3. Filter these ongoing batches based on the selected course
    if (!selectedCourse) {
      return ongoingBatches.map(b => ({
        ...b,
        name: getBatchDisplayLabel(b.name)
      }));
    }

    const courseObj = courses.find((c) => c.name.toLowerCase() === selectedCourse.toLowerCase());
    const courseBatchNumberVal = courseObj?.batchNumber?.toLowerCase();

    // Collect any batch keys associated with this course from students, assignments, or configurations
    const courseRelatedBatches: string[] = [];
    if (courseBatchNumberVal) {
      courseRelatedBatches.push(courseBatchNumberVal);
    }
    
    allStudents.forEach(s => {
      if (s.course?.toLowerCase() === selectedCourse.toLowerCase() && s.batch) {
        courseRelatedBatches.push(s.batch.toLowerCase());
      }
    });

    assignments.forEach(asg => {
      if (asg.course?.toLowerCase() === selectedCourse.toLowerCase() && asg.batch) {
        courseRelatedBatches.push(asg.batch.toLowerCase());
      }
    });

    const uniqueCourseRelated = Array.from(new Set(courseRelatedBatches));

    // Filter ongoing batches to show ONLY the ones matching any of these keys or equivalents
    const filteredOngoing = ongoingBatches.filter((b) => {
      const bNameLower = b.name.toLowerCase();
      const bIdLower = b.id.toLowerCase();

      return uniqueCourseRelated.some(key => 
        key === bNameLower || 
        key === bIdLower || 
        areBatchesEquivalent(key, bNameLower) || 
        areBatchesEquivalent(key, bIdLower)
      );
    });

    // Fallback: If filteredOngoing is empty, we must show some option rather than empty dropdown so the teacher can assign/view!
    if (filteredOngoing.length === 0) {
      // If the course explicitly has a 'batchNumber' or 'id', construct a clean synthetic option for it
      const targetBatchKey = courseObj?.batchNumber || courseObj?.id || 'stb_001';
      const cleanName = getBatchDisplayLabel(targetBatchKey);
      
      return [{
        id: targetBatchKey,
        name: cleanName,
        createdDate: '',
        status: 'ongoing'
      }];
    }

    return filteredOngoing.map(b => ({
      ...b,
      name: getBatchDisplayLabel(b.name)
    }));
  }, [batches, allStudents, selectedCourse, courses, assignments]);

  // Automatically select first course & batch if not set, or adjust selection if invalid
  React.useEffect(() => {
    if (!selectedCourse && activeCourses.length > 0) {
      setSelectedCourse(activeCourses[0].name);
    }
  }, [activeCourses, selectedCourse]);

  React.useEffect(() => {
    if (activeBatches.length > 0) {
      const isValid = activeBatches.some((b) => b.name === selectedBatch || areBatchesEquivalent(b.name, selectedBatch));
      if (!isValid) {
        setSelectedBatch(activeBatches[0].name);
      }
    } else {
      setSelectedBatch('');
    }
  }, [activeBatches, selectedBatch]);

  // Filter students based on selected Course & Batch
  const filteredStudents = allStudents.filter(
    (s) =>
      s.course?.toLowerCase() === selectedCourse?.toLowerCase() &&
      (s.batch === selectedBatch || areBatchesEquivalent(s.batch, selectedBatch))
  );

  // Filter assignments based on selected Course & Batch
  const matchedAssignments = assignments.filter(
    (asg) =>
      asg.course?.toLowerCase() === selectedCourse?.toLowerCase() &&
      (asg.batch === selectedBatch || areBatchesEquivalent(asg.batch, selectedBatch))
  );

  // Automatically select the first matched assignment if current selection is invalid
  React.useEffect(() => {
    if (matchedAssignments.length > 0) {
      const exists = matchedAssignments.some((a) => a.id === selectedAsgId);
      if (!exists) {
        setSelectedAsgId(matchedAssignments[0].id);
      }
    } else {
      setSelectedAsgId('');
    }
  }, [matchedAssignments, selectedAsgId]);

  // Retrieve current selected assignment details
  const activeAsg = assignments.find((asg) => asg.id === selectedAsgId);

  // Calculate who has submitted and who has not
  const submittedSubmissions = activeAsg ? activeAsg.submissions : [];
  const submittedStudentIds = new Set(submittedSubmissions.map((sub) => sub.studentId));

  // Students who submitted
  const submittedStudents = filteredStudents.filter((s) => submittedStudentIds.has(s.id));

  // Students who haven't submitted
  const notSubmittedStudents = filteredStudents.filter((s) => !submittedStudentIds.has(s.id));

  // Handle grade submission
  const handleGradeSubmission = (submissionId: string) => {
    if (!activeAsg) return;

    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.id === activeAsg.id) {
          const updatedSubmissions = asg.submissions.map((sub) => {
            if (sub.id === submissionId) {
              return {
                ...sub,
                score: inlineScore,
                feedback: inlineFeedback,
                status: 'graded' as const,
              };
            }
            return sub;
          });
          return {
            ...asg,
            submissions: updatedSubmissions,
          };
        }
        return asg;
      })
    );

    showNotification('Grade and feedback saved successfully!', 'success');
    setGradingSubId(null);
  };

  // Trigger inline grading mode
  const startGrading = (sub: StudentSubmission, maxPoints: number) => {
    setGradingSubId(sub.id);
    setInlineScore(sub.score ?? maxPoints);
    setInlineFeedback(sub.feedback ?? '');
  };

  // Helper notice
  const showNotification = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Simulated Reminder Dispatch
  const sendReminderEmail = (student: UserAccount) => {
    if (!activeAsg) return;
    setSendingReminderId(student.id);

    // Simulate async email delivery API
    setTimeout(() => {
      setSendingReminderId(null);
      showNotification(`Reminder alert check successfully dispatched to ${student.name}'s mailbox!`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6" id="assignment-submission-tracker">
      {/* Toast Announcement */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded border text-xs font-medium animate-slideIn ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-800' 
            : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-[#0F0F11]/90 dark:text-indigo-300 dark:border-white/5'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200 dark:border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div>
          <span className="text-xs bg-amber-500/10 text-amber-700 px-2.5 py-0.5 rounded font-bold uppercase select-none tracking-wider">
            Curriculum Management
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-850 dark:text-white mt-2 mb-1 tracking-tight">
            Assignment Submission Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Select course and student batch parameters below to verify who has turned in their homework assignments, grade submitted files, or coordinate overdue warnings.
          </p>
        </div>
      </div>

      {/* Control Selection Panel */}
      <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200 dark:border-white/10 p-5 font-sans">
        <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-3 border-b border-slate-150 dark:border-white/5 pb-2">Filter Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Select Course */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-705 dark:text-slate-300 block">Course Track</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F0F11] rounded-md border border-slate-300 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-200"
            >
              {activeCourses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Batch */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-705 dark:text-slate-300 block">Class Cohort / Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F0F11] rounded-md border border-slate-300 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-200"
            >
              <option value="">-- Choose Cohort --</option>
              {activeBatches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Assignment */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-750 dark:text-slate-300 block">Target Homework Assignment</label>
            {matchedAssignments.length === 0 ? (
              <div className="text-sm text-rose-500 bg-rose-500/5 border border-rose-200 dark:border-rose-900/30 px-3 py-2 rounded-md font-medium">
                No active assignments for this selection.
              </div>
            ) : (
              <select
                value={selectedAsgId}
                onChange={(e) => setSelectedAsgId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0F0F11] rounded-md border border-slate-300 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-gray-200"
              >
                <option value="">-- Choose Assignment --</option>
                {matchedAssignments.map((asg) => (
                  <option key={asg.id} value={asg.id}>
                    {asg.title} (Due: {asg.dueDate})
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>
      </div>

      {/* Main Analysis Content */}
      {!activeAsg ? (
        <div className="bg-white dark:bg-[#070708] rounded-lg border border-dashed border-slate-300 dark:border-white/10 p-12 text-center text-slate-400 font-sans">
          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-white mb-1">No Active Assignment Selected</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please publish an assignment under the "Assignment Pipeline" or change the Course / Batch selections above to render active student submissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Info Card on Assignment */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200 dark:border-white/10 shadow-xs p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assignment Info</h3>
                <h2 className="text-base font-bold text-slate-850 dark:text-white leading-tight">{activeAsg.title}</h2>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3 pt-2">
                <p className="leading-relaxed bg-slate-50 dark:bg-[#0f0f11] p-3 rounded border border-slate-200 dark:border-white/5 italic">
                  "{activeAsg.description}"
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 dark:bg-[#0f0f11]/50 p-2.5 rounded border border-slate-200 dark:border-white/5">
                    <span className="text-xs text-slate-405 dark:text-gray-500 uppercase block font-semibold">Max Score</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{activeAsg.maxPoints} Points</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0f0f11]/50 p-2.5 rounded border border-slate-200 dark:border-white/5">
                    <span className="text-xs text-slate-405 dark:text-gray-500 uppercase block font-semibold">Due Date</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {activeAsg.dueDate}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Class Cohort:</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{activeAsg.batch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Curriculum Course:</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200 truncate max-w-[150px]" title={activeAsg.course}>{activeAsg.course}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Assigned By:</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{activeAsg.instructorName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General metrics summary */}
            <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200 dark:border-white/10 shadow-xs p-5">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest mb-3">Participation Rates</h3>
              
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-white/5"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-550"
                      strokeWidth="3.5"
                      strokeDasharray={`${filteredStudents.length > 0 ? (submittedStudents.length / filteredStudents.length) * 100 : 0}, 100`}
                      strokeLinecap="square"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-gray-200">
                    {filteredStudents.length > 0
                      ? Math.round((submittedStudents.length / filteredStudents.length) * 100)
                      : 0}%
                  </div>
                </div>

                <div className="text-sm text-slate-500 space-y-1 flex-1">
                  <div className="flex justify-between">
                    <span>Enrolled:</span>
                    <strong className="text-slate-850 dark:text-white">{filteredStudents.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <strong className="text-emerald-600">{submittedStudents.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Not Submitted:</span>
                    <strong className="text-rose-500">{notSubmittedStudents.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission and Non-submission list toggle option */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Folder Toggle Buttons */}
            <div className="flex bg-slate-50 dark:bg-[#070708] p-1 rounded-md border border-slate-200 dark:border-white/10 gap-2">
              <button
                type="button"
                onClick={() => setFilterOption('submitted')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded transition cursor-pointer ${
                  filterOption === 'submitted'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/10'
                    : 'text-slate-505 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-550" />
                Submitted ({submittedStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterOption('not-submitted')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded transition cursor-pointer ${
                  filterOption === 'not-submitted'
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-white/10'
                    : 'text-slate-505 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Who Haven't Submitted ({notSubmittedStudents.length})
              </button>
            </div>

            {/* Rendering matching lists */}
            {filterOption === 'submitted' ? (
              <div className="space-y-3">
                {submittedStudents.length === 0 ? (
                  <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200/80 dark:border-white/10 p-10 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto mb-2.5" />
                    <p className="text-sm font-medium">No students in this cohort have submitted this assignment yet.</p>
                  </div>
                ) : (
                  submittedStudents.map((student) => {
                    const submission = submittedSubmissions.find((sub) => sub.studentId === student.id);
                    if (!submission) return null;

                    const isGradingNow = gradingSubId === submission.id;

                    return (
                      <div
                        key={student.id}
                        className="bg-white dark:bg-[#070708] p-5 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs space-y-4"
                      >
                        {/* Student avatar and layout */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-[#f3f4f6] dark:bg-[#1f1f23] text-slate-700 dark:text-zinc-200 font-bold text-sm flex items-center justify-center">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{student.name}</h4>
                              <p className="text-xs text-slate-400">{student.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 dark:bg-white/5 py-0.5 px-2.5 rounded border border-slate-200 dark:border-white/10">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(submission.submittedDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {submission.status === 'graded' ? (
                              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 py-0.5 px-2.5 rounded border border-emerald-150 dark:border-emerald-500/20">
                                Graded • {submission.score}/{activeAsg.maxPoints} pts
                              </span>
                            ) : (
                              <span className="text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 py-0.5 px-2.5 rounded border border-amber-150 dark:border-amber-500/20">
                                Pending Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Submission Deliverables Answer contents */}
                        <div className="space-y-2.5">
                          <div className="text-sm text-slate-650 dark:text-slate-400">
                            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">Attached Answers:</p>
                            {submission.answerText ? (
                              <div className="p-3 bg-slate-50 dark:bg-[#0F0F11] rounded border border-slate-200 dark:border-white/5 text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-mono text-xs">
                                {submission.answerText}
                              </div>
                            ) : (
                              <p className="italic text-slate-400 text-xs">No text answer provided.</p>
                            )}
                          </div>

                          {submission.fileUrn && (
                            <div className="flex items-center gap-2 p-2 bg-blue-500/5 rounded border border-blue-100 dark:border-blue-500/10 max-w-sm">
                              <span className="text-xs text-blue-600 font-bold bg-blue-100 dark:bg-[#070708] px-1.5 py-0.5 rounded">ZIP</span>
                              <span className="text-xs text-slate-700 dark:text-gray-300 truncate">{submission.fileUrn}</span>
                            </div>
                          )}

                          {/* Render Feedback if graded and not actively grading */}
                          {submission.status === 'graded' && !isGradingNow && (
                            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-150 dark:border-indigo-500/10 rounded space-y-1 mt-2">
                              <p className="text-xs font-semibold text-slate-700 dark:text-indigo-300 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Instructor Evaluation Feedback:
                              </p>
                              <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed italic">
                                "{submission.feedback || 'No comments logged.'}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Inline Grading Form toggling */}
                        {isGradingNow ? (
                          <div className="p-4 bg-slate-50 dark:bg-[#0f0f11] rounded border border-slate-200 dark:border-white/10 space-y-3 mt-3 animate-fadeIn">
                            <h5 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wider">Evaluate Submission</h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Score selector */}
                              <div className="sm:col-span-1 space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block">Marks/Points Given</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={activeAsg.maxPoints}
                                  value={inlineScore}
                                  onChange={(e) => setInlineScore(Math.min(activeAsg.maxPoints, Math.max(0, Number(e.target.value))))}
                                  className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-[#070708] border border-slate-300 dark:border-white/10 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                                <span className="text-xs text-slate-400 font-medium">Max Allowed: {activeAsg.maxPoints}</span>
                              </div>
                              
                              {/* Feedback text */}
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block">Feedback / Comments</label>
                                <input
                                  type="text"
                                  placeholder="Great job! Excellent layout structure..."
                                  value={inlineFeedback}
                                  onChange={(e) => setInlineFeedback(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-[#070708] border border-slate-300 dark:border-white/10 rounded text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setGradingSubId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGradeSubmission(submission.id)}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition shadow-xs cursor-pointer"
                              >
                                Save Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => startGrading(submission, activeAsg.maxPoints)}
                              className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:text-white hover:bg-amber-600 rounded border border-amber-500/15 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" />
                              {submission.status === 'graded' ? 'Modify Grade / Feedback' : 'Grade Assignment'}
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {notSubmittedStudents.length === 0 ? (
                  <div className="bg-white dark:bg-[#070708] rounded-lg border border-slate-200/80 dark:border-white/10 p-10 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Flawless 100% Submission rate!</p>
                    <p className="text-xs text-slate-500 mt-0.5">All students in this class section have successfully turned in this homework.</p>
                  </div>
                ) : (
                  notSubmittedStudents.map((student) => {
                    const isDueTodayOrOver = new Date(activeAsg.dueDate).getTime() < new Date().getTime();
                    
                    return (
                      <div
                        key={student.id}
                        className="bg-white dark:bg-[#070708] p-4 rounded-lg border border-slate-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-rose-500/10 text-rose-600 font-bold text-sm flex items-center justify-center">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {student.name}
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                isDueTodayOrOver 
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 border border-amber-100'
                              }`}>
                                {isDueTodayOrOver ? 'Overdue' : 'Awaiting Submission'}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            disabled={sendingReminderId === student.id}
                            onClick={() => sendReminderEmail(student)}
                            className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-500/5 dark:bg-rose-500/10 rounded transition flex items-center justify-center gap-1.5 border border-rose-500/15 cursor-pointer disabled:opacity-50"
                          >
                            {sendingReminderId === student.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                            Send Alert Reminder
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
