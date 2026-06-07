/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserAccount, ClassSchedule, ProgressRecord, AppNotification, BackupHistory, StudentBatch, Course } from './types';

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
    course: 'IIT-JEE Master Preparation'
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
    course: 'Medical NEET Crash Course'
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
  { id: 'batch-1', name: 'Batch A', description: 'Primary Morning Group', createdDate: '2024-05-20' },
  { id: 'batch-2', name: 'Batch B', description: 'Mid-Day Intensive Group', createdDate: '2024-05-21' },
  { id: 'batch-3', name: 'Batch C', description: 'Evening Fast-Track Group', createdDate: '2024-05-22' },
  { id: 'batch-4', name: 'Batch D', description: 'Weekend Practical Lab Group', createdDate: '2024-05-23' }
];

export const INITIAL_COURSES: Course[] = [
  { id: 'course-1', name: 'IIT-JEE Master Preparation', code: 'IITJEE', description: 'Advanced Physics, Chemistry & Mathematics Prep', durationWeeks: '52', createdDate: '2024-05-18' },
  { id: 'course-2', name: 'Medical NEET Crash Course', code: 'NEET', description: 'Intensive Biology, Organic Chemistry & Physics', durationWeeks: '24', createdDate: '2024-05-19' },
  { id: 'course-3', name: 'Foundation Olympiad Prep', code: 'FOPrep', description: 'Mathematics and Science Basics for Early Olympiad aspirants', durationWeeks: '36', createdDate: '2024-05-19' }
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

export function useFirebaseState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Try to load any existing local data while Firebase fetches
  const [state, setState] = useState<T>(() => getSavedState<T>(key, defaultValue));

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
      },
      error: (err) => {
        console.warn(`Firebase read failing for ${key}, falling back to local.`, err);
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

  return [state, setFirebaseState];
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
