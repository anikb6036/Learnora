/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'sub-admin' | 'instructor' | 'student';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  joinedDate: string;
  specialization?: string; // For instructors
  assignedInstructorId?: string; // For students
  username?: string; // Optional username for credentials login
  password?: string; // Optional password for credentials login
  fatherName?: string;
  fatherPhone?: string;
  address?: string;
  lastQualification?: string;
  gender?: string;
  dob?: string;
  batch?: string; // Added student batch
  course?: string; // Added student course
  currentMonth?: number; // Added current active study month
  paymentStatus?: 'pending' | 'paid'; // Razorpay payment state
  paymentId?: string; // Razorpay transaction ref ID
  paymentDate?: string; // Razorpay payment date
  paidAmount?: number; // Razorpay paid amount in INR
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  assignedInstructorId?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  username: string; // Auto-generated username
  password: string; // Auto-generated password
  fatherName?: string;
  fatherPhone?: string;
  address?: string;
  lastQualification?: string;
  gender?: string;
  dob?: string;
  avatarUrl?: string;
  batch?: string; // Added student batch
  course?: string; // Added student course
  interviewDate?: string;
  interviewTime?: string;
  interviewStatus?: 'not_scheduled' | 'scheduled' | 'completed' | 'cancelled';
  interviewNotes?: string;
  examScore?: number;
  examPassed?: boolean;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
}


export interface ClassSchedule {
  id: string;
  title: string;
  subject: string;
  instructorId: string;
  instructorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  maxStudents: number;
  enrolledStudentIds: string[];
  location: string; // e.g. "Room 101", "Online - Zoom"
  status: 'scheduled' | 'completed' | 'cancelled';
  batch?: string; // Optional target batch (e.g. Batch A, Batch B, or All)
  course?: string; // Optional target course (e.g. Web Development, or All)
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  instructorId: string;
  instructorName: string;
  evaluationDate: string; // YYYY-MM-DD
  subject: string;
  score: number; // Percentage e.g. 85
  attendanceStatus: 'present' | 'absent' | 'excused';
  feedback: string;
  academicPerformance: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO String
  read: boolean;
  type: 'general' | 'reminder' | 'grade' | 'enrollment';
  channel: 'push' | 'email' | 'system';
}

export interface BackupHistory {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  recordCount: {
    students: number;
    instructors: number;
    classes: number;
    progress: number;
  };
  status: 'success' | 'failed';
}

export interface StudentBatch {
  id: string;
  name: string;
  description?: string;
  createdDate: string;
  status?: 'ongoing' | 'completed' | 'upcoming';
}

export interface Course {
  id: string;
  name: string;
  code: string;
  batchNumber?: string;
  description?: string;
  durationWeeks?: string;
  createdDate: string;
  status?: 'completed' | 'ongoing' | 'upcoming';
  publishDate?: string;
  admissionLastDate?: string;
  durationMonths?: number;
  fee?: number; // Course enrollment fee in INR
  roadmap?: {
    month: number;
    title: string;
    description: string;
  }[];
}

export interface MasterCourse {
  id: string;
  name: string;
  fee?: number;
  durationMonths?: number;
  description?: string;
  roadmap?: {
    month: number;
    title: string;
    description: string;
  }[];
  createdDate: string;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  submittedDate: string;
  answerText?: string;
  fileUrn?: string; // Optional simulated file name/url
  score?: number; // Graded score
  feedback?: string; // Instructor feedback
  status: 'pending' | 'graded';
}

export interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  classId?: string; // Links to the class schedule
  className?: string; // Associated class title
  course: string; // Associated course name
  batch: string; // Associated batch name
  instructorId: string;
  instructorName: string;
  dueDate: string; // YYYY-MM-DD
  maxPoints: number;
  status: 'published' | 'closed';
  createdDate: string;
  submissions: StudentSubmission[];
  month?: string; // Associated month, e.g. "Month 1"
  syllabus?: string; // Syllabus / Topic
  week?: string; // Target Week
  day?: string;  // Target Day
}

export interface AssignmentBankItem {
  id: string;
  title: string;
  description: string;
  course: string;
  batch: string;
  month: string; // Course Month
  syllabus: string; // Syllabus Topic
  maxPoints: number;
  createdDate: string;
  week?: string; // Target Week
  day?: string;  // Target Day
}

export interface StudentEvolution {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  month: number; // Month 1, Month 2, etc. (corresponds to active month)
  evolution1?: number; // Score for Evolution 1
  evolution2?: number; // Score for Evolution 2
  evolution3?: number; // Score for Evolution 3
  evolution4?: number; // Score for Evolution 4
  feedback1?: string;  // Feedback for Evolution 1
  feedback2?: string;  // Feedback for Evolution 2
  feedback3?: string;  // Feedback for Evolution 3
  feedback4?: string;  // Feedback for Evolution 4
  overallScore?: number; // Calculated percentage (passing mark >= 80%)
  promoted: boolean; // Automatic promotion trigger state
  promotedDate?: string;
  lastUpdated: string;
  
  // Custom deployed week metadata
  title1?: string;
  desc1?: string;
  title2?: string;
  desc2?: string;
  title3?: string;
  desc3?: string;
  title4?: string;
  desc4?: string;
  batch?: string; // Target batch deployed to
}

export interface EvolutionBankItem {
  id: string;
  course: string;
  month: number;
  title: string;
  description: string;
  week1Title: string;
  week1Desc: string;
  week2Title: string;
  week2Desc: string;
  week3Title: string;
  week3Desc: string;
  week4Title: string;
  week4Desc: string;
  createdDate: string;
}



