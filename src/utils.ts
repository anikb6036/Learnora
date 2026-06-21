/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserAccount, ClassSchedule, ProgressRecord, AppNotification, BackupHistory, StudentBatch, Course, MasterCourse, StudentAssignment, AssignmentBankItem, EvolutionBankItem } from './types';

// Initial seed data for the Coaching Center
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'admin-1',
    name: 'Anik Baidya',
    email: 'baidyaanik18@gmail.com',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150',
    phone: '+1 (555) 0100',
    joinedDate: '2024-05-20',
    username: 'anik',
    password: 'anik'
  },
  {
    id: 'instructor-1',
    name: 'Prof. Sarah Connor',
    email: 'sarah@learnora.com',
    role: 'instructor',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    phone: '+1 (555) 0121',
    joinedDate: '2024-05-21',
    specialization: 'Advanced Science & Physics',
    username: 'sarah',
    password: 'sarah'
  },
  {
    id: 'subadmin-1',
    name: 'Marcus Wright',
    email: 'marcus@learnora.com',
    role: 'sub-admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+1 (555) 0122',
    joinedDate: '2024-05-22',
    username: 'marcus',
    password: 'marcus'
  },
  {
    id: 'student-1',
    name: 'John Connor',
    email: 'john@learnora.com',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '+1 (555) 0123',
    joinedDate: '2024-05-23',
    username: 'john',
    password: 'john',
    assignedInstructorId: 'instructor-1',
    batch: 'Batch A',
    course: 'IIT-JEE Master Preparation',
    paymentStatus: 'pending'
  },
  {
    id: 'student-2',
    name: 'Alex Mercer',
    email: 'alex@learnora.com',
    role: 'student',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+1 (555) 0124',
    joinedDate: '2024-05-24',
    username: 'alex',
    password: 'alex',
    assignedInstructorId: 'instructor-1',
    batch: 'Batch B',
    course: 'Medical NEET Crash Course',
    paymentStatus: 'paid',
    paymentId: 'pay_OM92hJasda91',
    paymentDate: '2024-05-24',
    paidAmount: 11999
  }
];

export const INITIAL_SCHEDULES: ClassSchedule[] = [
  {
    id: 'class-1',
    title: 'Introductory Mechanics & Forces',
    subject: 'Physics',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    date: '2026-06-05',
    time: '15:00',
    duration: 90,
    maxStudents: 15,
    enrolledStudentIds: ['student-1'],
    location: 'Lab 2B (Mechanical Wing)',
    status: 'scheduled',
    batch: 'Batch A',
    course: 'IIT-JEE Master Preparation'
  },
  {
    id: 'class-2',
    title: 'Organic Chemistry Principles',
    subject: 'Chemistry',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    date: '2026-06-06',
    time: '14:00',
    duration: 60,
    maxStudents: 10,
    enrolledStudentIds: [],
    location: 'Room 304, Main Campus',
    status: 'scheduled',
    batch: 'Batch B',
    course: 'Medical NEET Crash Course'
  },
  {
    id: 'class-3',
    title: 'Calculus Foundation & Series',
    subject: 'Mathematics',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    date: '2026-06-07',
    time: '10:00',
    duration: 120,
    maxStudents: 30,
    enrolledStudentIds: [],
    location: 'Auditorium A',
    status: 'scheduled',
    batch: 'All',
    course: 'All'
  }
];

export const INITIAL_PROGRESS: ProgressRecord[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Coaching Center Initialized',
    message: 'Welcome to your clean coaching portal administration space. Clear of simulated dummy records.',
    timestamp: new Date().toISOString(),
    read: false,
    type: 'general',
    channel: 'system'
  }
];

export const INITIAL_BACKUPS: BackupHistory[] = [];

export const INITIAL_BATCHES: StudentBatch[] = [
  { id: 'batch-1', name: 'Batch A', description: 'Primary Morning Group', createdDate: '2024-05-20', status: 'ongoing' },
  { id: 'batch-2', name: 'Batch B', description: 'Mid-Day Intensive Group', createdDate: '2024-05-21', status: 'ongoing' },
  { id: 'batch-3', name: 'Batch C', description: 'Evening Fast-Track Group', createdDate: '2024-05-22', status: 'completed' },
  { id: 'batch-4', name: 'Batch D', description: 'Weekend Practical Lab Group', createdDate: '2024-05-23', status: 'upcoming' }
];

export const INITIAL_MASTER_COURSES: MasterCourse[] = [
  {
    id: 'master-1',
    name: 'IIT-JEE Master Preparation',
    durationMonths: 12,
    description: 'Advanced Physics, Chemistry & Mathematics Prep',
    roadmap: [
      { month: 1, title: 'Mechanics & Stoichiometry', description: 'Core kinematics, Newton laws, mole concept, basic calculus.' },
      { month: 2, title: 'Calculus & Quadratics', description: 'Limits, continuity, functions, quadratic equations, sequence and series.' },
      { month: 3, title: 'Electrodynamics & Chemical Bonding', description: 'Electrostatics, Gauss Law, molecular shape, hybridisation, covalent bond.' }
    ],
    createdDate: '2024-05-18'
  },
  {
    id: 'master-2',
    name: 'Medical NEET Crash Course',
    durationMonths: 6,
    description: 'Intensive Biology, Organic Chemistry & Physics',
    roadmap: [
      { month: 1, title: 'Human Physiology & Mechanics', description: 'Digestion, respiration, motion in straight line, physical chemistry basics.' },
      { month: 2, title: 'Plant Physiology & Thermodynamics', description: 'Photosynthesis, plant hormones, laws of thermodynamics, equilibrium.' }
    ],
    createdDate: '2024-05-19'
  },
  {
    id: 'master-3',
    name: 'Foundation Olympiad Prep',
    durationMonths: 9,
    description: 'Mathematics and Science Basics for Early Olympiad aspirants',
    roadmap: [
      { month: 1, title: 'Number Theory Logistics', description: 'Primes, divisibility, Euclid algorithms, basic indices structures.' }
    ],
    createdDate: '2024-05-19'
  }
];

export const INITIAL_COURSES: Course[] = [
  { id: 'course-1', name: 'IIT-JEE Master Preparation', code: 'IITJEE', batchNumber: 'stb_001', description: 'Advanced Physics, Chemistry & Mathematics Prep', durationWeeks: '12', createdDate: '2024-05-18', status: 'ongoing', publishDate: '2024-05-18', fee: 14999 },
  { id: 'course-2', name: 'Medical NEET Crash Course', code: 'NEET', batchNumber: 'stb_002', description: 'Intensive Biology, Organic Chemistry & Physics', durationWeeks: '6', createdDate: '2024-05-19', status: 'upcoming', publishDate: '2026-07-01', admissionLastDate: '2026-06-30', fee: 11999 },
  { id: 'course-3', name: 'Foundation Olympiad Prep', code: 'FOPrep', batchNumber: 'stb_003', description: 'Mathematics and Science Basics for Early Olympiad aspirants', durationWeeks: '9', createdDate: '2024-05-19', status: 'completed', fee: 5999 }
];

export const INITIAL_ASSIGNMENTS: StudentAssignment[] = [
  {
    id: 'asg-1',
    title: 'Newtonian Laws Practice Sheet',
    description: 'Solve all 15 numerical problems on inclined platforms and friction coefficients defined in the class handout.',
    classId: 'class-1',
    className: 'Introductory Mechanics & Forces',
    course: 'IIT-JEE Master Preparation',
    batch: 'Batch A',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    dueDate: '2026-06-25',
    maxPoints: 100,
    status: 'published',
    createdDate: '2026-06-15',
    submissions: [
      {
        id: 'sub-1',
        studentId: 'student-1',
        studentName: 'John Connor',
        submittedDate: '2026-06-16T18:30:00Z',
        answerText: 'Completed all problems 1 to 15. The forces resolve cleanly into mg*sin(theta) and friction matches mu*mg*cos(theta). Detailed equations attached.',
        fileUrn: 'newtonian_mechanics_john.pdf',
        score: 95,
        feedback: 'Excellent breakdown of vector resolutions. Your free-body diagram equations represent perfect professional standard execution.',
        status: 'graded'
      }
    ]
  },
  {
    id: 'asg-2',
    title: 'Functional Hydrocarbon Synthesis',
    description: 'Provide step-by-step synthetic mechanisms for transforming raw alkenes to aromatic complexes under standard laboratory pressures.',
    classId: 'class-2',
    className: 'Organic Chemistry Principles',
    course: 'Medical NEET Crash Course',
    batch: 'Batch B',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    dueDate: '2026-06-29',
    maxPoints: 50,
    status: 'published',
    createdDate: '2026-06-16',
    submissions: []
  }
];

export const INITIAL_ASSIGNMENT_BANK: AssignmentBankItem[] = [
  {
    id: 'bank-1',
    title: 'Newtonian Laws Practice Sheet',
    description: 'Solve all 15 numerical problems on inclined platforms and friction coefficients defined in the class handout.',
    course: 'IIT-JEE Master Preparation',
    batch: 'stb_001',
    month: 'Month 1',
    syllabus: 'Unit 1: Mechanics and Laws of Motion',
    maxPoints: 100,
    createdDate: '2024-06-15'
  },
  {
    id: 'bank-2',
    title: 'Functional Hydrocarbon Synthesis',
    description: 'Provide step-by-step synthetic mechanisms for transforming raw alkenes to aromatic complexes under standard laboratory pressures.',
    course: 'Medical NEET Crash Course',
    batch: 'stb_002',
    month: 'Month 1',
    syllabus: 'Unit 1: Organic Chemistry Structures',
    maxPoints: 50,
    createdDate: '2024-06-15'
  },
  {
    id: 'bank-3',
    title: 'Kinetic Theory of Gases Exam',
    description: 'Solve problems on velocity distribution curves, mean free path, and van der Waals parameters.',
    course: 'IIT-JEE Master Preparation',
    batch: 'stb_001',
    month: 'Month 2',
    syllabus: 'Unit 2: Thermodynamics & Gas Laws',
    maxPoints: 100,
    createdDate: '2024-06-16'
  }
];

// Deprecated, maintained as a fallback. Replaced by useFirebaseState.
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        const deduplicated = parsed.filter(item => {
          if (item && typeof item === 'object' && 'id' in item) {
            const itemWithId = item as { id: string };
            if (seen.has(itemWithId.id)) {
              return false;
            }
            seen.add(itemWithId.id);
          }
          return true;
        });
        return deduplicated as unknown as T;
      }
      return parsed as T;
    }
  } catch (err) {
    console.error(`Error loading state standard local storage for key ${key}`, err);
  }
  return defaultValue;
}

export function saveState<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving standard local storage for key ${key}`, err);
  }
}

export function useFirebaseState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  // Try to load any existing local data while Firebase fetches
  const [state, setState] = useState<T>(() => getSavedState<T>(key, defaultValue));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_state", key), {
      next: (docSnap) => {
        if (docSnap.exists()) {
          const newData = docSnap.data().data as T;
          setState(newData);
          saveState(key, newData); // Sync to local storage
        } else {
          // Init record remotely if it doesn't exist
          const initialLocalData = getSavedState<T>(key, defaultValue);
          setDoc(doc(db, "app_state", key), { data: initialLocalData }, { merge: true });
        }
        setIsLoaded(true);
      },
      error: (err) => {
        console.warn(`Firebase read failing for ${key}, falling back to local.`, err);
        setIsLoaded(true);
      }
    });
    return () => unsub();
  }, [key]);
  
  const setFirebaseState: React.Dispatch<React.SetStateAction<T>> = React.useCallback((value) => {
    setState((prevState) => {
      const nextState = value instanceof Function ? value(prevState) : value;
      saveState(key, nextState); // maintain local copy just in case
      
      // Clean undefined values for Firestore
      const cleanState = JSON.parse(JSON.stringify(nextState));

      // Push changes back to Firestore
      setDoc(doc(db, "app_state", key), { data: cleanState }, { merge: true }).catch(err => {
          console.error(`Failed to push sync to Firebase for ${key}`, err);
      });
      return nextState;
    });
  }, [key]);

  return [state, setFirebaseState, isLoaded];
}

// Export tool implementation for external analytics (generates structured CSVs for user download)
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(item =>
    headers
      .map(header => {
        let val = item[header];
        if (val === undefined || val === null) return '""';
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        // Escape quotes
        const formatted = String(val).replace(/"/g, '""');
        return `"${formatted}"`;
      })
      .join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const INITIAL_EVOLUTION_BANK: EvolutionBankItem[] = [
  {
    id: 'evo-bank-1',
    course: 'IIT-JEE Master Preparation',
    month: 1,
    title: 'IIT-JEE Month 1 Mechanics & Kinematics',
    description: 'Comprehensive evaluations focusing on multi-body dynamics, relative motion vectors, constraint relations, and friction analysis.',
    week1Title: 'Evolution 1 (Week 1)',
    week1Desc: 'Kinematics & Inertial Frames',
    week2Title: 'Evolution 2 (Week 2)',
    week2Desc: 'Newtonian Forces & Multi-body Constraint Equations',
    week3Title: 'Evolution 3 (Week 3)',
    week3Desc: 'Friction, Normal Contact, and Inclined Planes',
    week4Title: 'Evolution 4 (Week 4)',
    week4Desc: 'Integrated Circular Motion & Work-Energy Theorem',
    createdDate: '2026-06-01'
  },
  {
    id: 'evo-bank-2',
    course: 'Medical NEET Crash Course',
    month: 1,
    title: 'NEET Month 1 Fundamentals of Life Science & Organic Bases',
    description: 'Continuous assessment tracks focused on cellular architecture, biomolecule classification, and fundamental hydrocarbon hybridization.',
    week1Title: 'Evolution 1 (Week 1)',
    week1Desc: 'Cell Theory & Organelle Functions',
    week2Title: 'Evolution 2 (Week 2)',
    week2Desc: 'Organic Nomenclature & Alkane Saturated Bonds',
    week3Title: 'Evolution 3 (Week 3)',
    week3Desc: 'Biomolecule Polymers & Enzyme Dynamics',
    week4Title: 'Evolution 4 (Week 4)',
    week4Desc: 'Consolidated Molecular NEET Exam',
    createdDate: '2026-06-02'
  }
];
