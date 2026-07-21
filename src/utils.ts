/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { supabase, getSupabaseState, setSupabaseState, subscribeSupabaseState } from './supabase';
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
    specialization: 'Software Engineering & System Architecture',
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
    universalId: '100001',
    username: 'john',
    password: 'john',
    assignedInstructorId: 'instructor-1',
    batch: 'stb_001',
    course: 'Java Masterclass',
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
    universalId: '100002',
    username: 'alex',
    password: 'alex',
    assignedInstructorId: 'instructor-1',
    batch: 'stb_002',
    course: 'Full-Stack JavaScript Development',
    paymentStatus: 'paid',
    paymentId: 'pay_OM92hJasda91',
    paymentDate: '2024-05-24',
    paidAmount: 11999
  }
];

export const INITIAL_SCHEDULES: ClassSchedule[] = [
  {
    id: 'class-1',
    title: 'Object-Oriented Programming Foundations',
    subject: 'Java OOPs',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    date: '2026-06-05',
    time: '15:00',
    duration: 90,
    maxStudents: 15,
    enrolledStudentIds: ['student-1'],
    location: 'Lab 2B (Software Wing)',
    status: 'scheduled',
    batch: 'stb_001',
    course: 'Java Masterclass'
  },
  {
    id: 'class-2',
    title: 'Asynchronous Event Loop and Promises',
    subject: 'JavaScript Core',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    date: '2026-06-06',
    time: '14:00',
    duration: 60,
    maxStudents: 10,
    enrolledStudentIds: [],
    location: 'Web Lab, Main Campus',
    status: 'scheduled',
    batch: 'stb_002',
    course: 'Full-Stack JavaScript Development'
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
  { id: 'batch-1', name: 'stb_001', description: 'Primary Morning Java Group', createdDate: '2024-05-20', status: 'ongoing' },
  { id: 'batch-2', name: 'stb_002', description: 'Mid-Day JavaScript Intensive', createdDate: '2024-05-21', status: 'ongoing' },
  { id: 'batch-3', name: 'stb_003', description: 'Python AI Evening Track', createdDate: '2024-05-22', status: 'completed' },
  { id: 'batch-4', name: 'stb_004', description: 'SDET Automation Weekend Practical Lab', createdDate: '2024-05-23', status: 'upcoming' },
  { id: 'batch-5', name: 'stb_005', description: 'UI/UX Design Studio Group', createdDate: '2024-05-24', status: 'ongoing' },
  { id: 'batch-6', name: 'stb_006', description: 'Cybersecurity Network Security Track', createdDate: '2024-05-25', status: 'ongoing' }
];

export const INITIAL_MASTER_COURSES: MasterCourse[] = [
  {
    id: 'master-1',
    name: 'Java Masterclass',
    durationMonths: 3,
    description: 'OOPs Foundations, Core Java, Collections, Multi-threading, and DSA with Java',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'OOPs Foundations & Core Syntax', description: 'Classes, Objects, Inheritance, Polymorphism, Encapsulation, JVM memory limits.' },
      { month: 2, title: 'Collections, Threads & Exceptions', description: 'Java Collection Framework, exception hierarchy, multi-threading basics.' },
      { month: 3, title: 'DSA with Java Mastery', description: 'Stacks, Queues, Linked Lists, Trees, Graph theory algorithms.' }
    ],
    createdDate: '2024-05-18'
  },
  {
    id: 'master-2',
    name: 'Full-Stack JavaScript Development',
    durationMonths: 3,
    description: 'Advanced ES6+, Async Programming, Node.js, Express, React, and MongoDB',
    imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=80',
    roadmap: [
      { month: 1, title: 'Advanced JavaScript & Async Loops', description: 'Scope, closures, event loop, Promise chain, asynchronous event loops.' },
      { month: 2, title: 'Backend APIs & Databases', description: 'NodeJS runtime, Express routing, MongoDB ODM, REST protocols.' },
      { month: 3, title: 'Frontend Frameworks & Ecosystem', description: 'React architecture, React hooks, state management, and Tailwind CSS.' }
    ],
    createdDate: '2024-05-19'
  }
];

export const INITIAL_COURSES: Course[] = [
  { id: 'course-1', name: 'Java Masterclass', code: 'JAVA', batchNumber: 'stb_001', description: 'Deep-dive OOPs foundations and advanced software engineering with Java.', durationWeeks: '12', createdDate: '2024-05-18', status: 'ongoing', publishDate: '2024-05-18', fee: 14999, imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80' },
  { id: 'course-2', name: 'Full-Stack JavaScript Development', code: 'JS', batchNumber: 'stb_002', description: 'Modern full-stack web engineering using JavaScript and TypeScript.', durationWeeks: '12', createdDate: '2024-05-19', status: 'ongoing', publishDate: '2026-06-01', fee: 11999, imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=80' },
  { id: 'course-3', name: 'Python AI & Data Science', code: 'PY', batchNumber: 'stb_003', description: 'Advanced Python, Machine Learning libraries, and Neural Networks.', durationWeeks: '12', createdDate: '2024-05-19', status: 'ongoing', fee: 12999, imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80' },
  { id: 'course-4', name: 'SDET Specialization (QA Automation)', code: 'SDET', batchNumber: 'stb_004', description: 'Professional Selenium WebDriver, manual testing basics, API automation pipelines.', durationWeeks: '12', createdDate: '2024-05-20', status: 'upcoming', fee: 9999, imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=600&auto=format&fit=crop&q=80' },
  { id: 'course-5', name: 'UI/UX Design Academy', code: 'UIUX', batchNumber: 'stb_005', description: 'User interfaces design, user research, wireframing, high-fi Figma mockups.', durationWeeks: '12', createdDate: '2024-05-21', status: 'ongoing', fee: 8999, imageUrl: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=80' },
  { id: 'course-6', name: 'Cybersecurity Professional', code: 'CYBER', batchNumber: 'stb_006', description: 'Linux architectures, network security protocols, vulnerability analysis.', durationWeeks: '12', createdDate: '2024-05-22', status: 'ongoing', fee: 15999, imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80' }
];

export const INITIAL_ASSIGNMENTS: StudentAssignment[] = [
  {
    id: 'asg-1',
    title: 'Two Sum Algorithmic Puzzle',
    description: 'Find two indices in an integer array that add up to a specific target sum.',
    classId: 'class-1',
    className: 'Object-Oriented Programming Foundations',
    course: 'Java Masterclass',
    batch: 'stb_001',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    dueDate: '2026-06-25',
    maxPoints: 100,
    status: 'published',
    createdDate: '2026-06-15',
    questionType: 'dsa',
    dsaQuestion: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    dsaConstraints: '`2 <= nums.length <= 10^4`\n`-10^9 <= nums[i] <= 10^9`\n`-10^9 <= target <= 10^9`',
    dsaTestCases: 'nums = [2,7,11,15], target = 9 -> [0,1]\nnums = [3,2,4], target = 6 -> [1,2]\nnums = [3,3], target = 6 -> [0,1]',
    dsaTemplateCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[0];\n    }\n}',
    submissions: [
      {
        id: 'sub-1',
        studentId: 'student-1',
        studentName: 'John Connor',
        submittedDate: '2026-06-16T18:30:00Z',
        answerText: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            } \n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}',
        fileUrn: 'two_sum_submission.java',
        score: 100,
        feedback: 'Perfect solution! Linear time O(n) complexity with HashMap optimization.',
        status: 'graded'
      }
    ]
  },
  {
    id: 'asg-2',
    title: 'Interactive Web Form Design',
    description: 'Using standard CSS styles and vanilla JS, create a fully validation-compliant multi-page registration layout.',
    classId: 'class-2',
    className: 'Asynchronous Event Loop and Promises',
    course: 'Full-Stack JavaScript Development',
    batch: 'stb_002',
    instructorId: 'instructor-1',
    instructorName: 'Prof. Sarah Connor',
    dueDate: '2026-06-29',
    maxPoints: 50,
    status: 'published',
    createdDate: '2026-06-16',
    questionType: 'instruction',
    submissions: []
  }
];

export const INITIAL_ASSIGNMENT_BANK: AssignmentBankItem[] = [
  {
    id: 'bank-1',
    title: 'Valid Parentheses Parser',
    description: 'Verify if input string has balanced parenthesis grouping utilizing stack data structures.',
    course: 'Java Masterclass',
    batch: 'stb_001',
    month: 'Month 1',
    syllabus: 'Unit 1: Syntax & Core Structures',
    maxPoints: 100,
    createdDate: '2024-06-15',
    questionType: 'dsa',
    dsaQuestion: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    dsaConstraints: '`1 <= s.length <= 10^4`\n`s` consists of parentheses only.',
    dsaTestCases: 's = "()" -> true\ns = "()[]{}" -> true\ns = "(]" -> false',
    dsaTemplateCode: 'class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}'
  },
  {
    id: 'bank-2',
    title: 'REST API Challenge',
    description: 'Review API structures by completing a basic Node.js Express server mapped to resource routes.',
    course: 'Full-Stack JavaScript Development',
    batch: 'stb_002',
    month: 'Month 1',
    syllabus: 'Unit 1: Server Routing Architecture',
    maxPoints: 50,
    createdDate: '2024-06-15',
    questionType: 'instruction'
  }
];

// Supported standard local storage caching fallback to prevent layout shifts and session loss on reload.
export function getSavedState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (err) {
    console.warn(`Failed to read local cache for ${key}`, err);
  }
  return defaultValue;
}

export function saveState<T>(key: string, data: T): void {
  try {
    if (data === undefined || data === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Failed to write local cache for ${key}`, err);
  }
}

export function useFirebaseState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  // Try to load any existing local data while loading server state
  const [state, setState] = useState<T>(() => getSavedState<T>(key, defaultValue));
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubFirebase: (() => void) | null = null;
    let unsubSupabase: (() => void) | null = null;

    async function initAndSync() {
      // 1. If Supabase is available, attempt to load from it first
      let supabaseData: any = null;
      if (supabase) {
        supabaseData = await getSupabaseState(key);
        if (supabaseData !== null && active) {
          setState(supabaseData);
          saveState(key, supabaseData);
          isLoadedRef.current = true;
          setIsLoaded(true);
        }
      }

      // 2. Load from Firebase as well (acting as master sync source if Supabase is fresh)
      unsubFirebase = onSnapshot(doc(db, "app_state", key), {
        next: (docSnap) => {
          if (!active) return;
          if (docSnap.exists() && docSnap.data()?.data !== undefined) {
            const firebaseData = docSnap.data().data as T;
            
            // If Supabase was empty or not initialized yet but Firebase has data, sync it to Supabase!
            if (supabase && supabaseData === null) {
              setSupabaseState(key, firebaseData).then((success) => {
                if (success) {
                  console.log(`Successfully migrated Firebase state to Supabase for key: ${key}`);
                  supabaseData = firebaseData; // Mark as populated
                }
              });
            }

            // Only update local state from Firebase if we don't have a newer Supabase state
            if (!supabase || supabaseData === null) {
              setState(firebaseData);
              saveState(key, firebaseData);
            }
            
            isLoadedRef.current = true;
            setIsLoaded(true);
          } else if (!docSnap.metadata.fromCache) {
            // Document doesn't exist on Firebase. Check if we can init it from Supabase or Local
            const currentData = supabaseData !== null ? supabaseData : getSavedState<T>(key, defaultValue);
            setDoc(doc(db, "app_state", key), { data: currentData }, { merge: true }).catch(err => {
              console.error(`Failed to init remote Firebase state for ${key}`, err);
            });
            isLoadedRef.current = true;
            setIsLoaded(true);
          }
        },
        error: (err) => {
          console.warn(`Firebase read failed or restricted for ${key}.`, err);
          // If Supabase is loaded, we are good. Otherwise fall back to local
          if (!isLoadedRef.current) {
            isLoadedRef.current = true;
            setIsLoaded(true);
          }
        }
      });

      // 3. Set up real-time subscription for Supabase
      if (supabase) {
        unsubSupabase = subscribeSupabaseState(key, (newData) => {
          if (!active) return;
          if (newData !== undefined && newData !== null) {
            setState(newData);
            saveState(key, newData);
            isLoadedRef.current = true;
            setIsLoaded(true);
          }
        });
      }
    }

    initAndSync();

    return () => {
      active = false;
      if (unsubFirebase) unsubFirebase();
      if (unsubSupabase) unsubSupabase();
    };
  }, [key]);
  
  const setFirebaseState: React.Dispatch<React.SetStateAction<T>> = React.useCallback((value) => {
    setState((prevState) => {
      const nextState = value instanceof Function ? value(prevState) : value;
      saveState(key, nextState); // maintain local copy
      
      const cleanState = JSON.parse(JSON.stringify(nextState));

      // Push changes back ONLY after we've finished the initial load!
      if (isLoadedRef.current) {
        // 1. Sync to Supabase
        if (supabase) {
          setSupabaseState(key, cleanState).catch(err => {
            console.error(`Failed to push sync to Supabase for ${key}`, err);
          });
        }
        // 2. Sync to Firestore (always do both to prevent any data loss during migration)
        setDoc(doc(db, "app_state", key), { data: cleanState }, { merge: true }).catch(err => {
          console.error(`Failed to push sync to Firebase for ${key}`, err);
        });
      } else {
        console.warn(`Prevented writing unloaded state back for key: ${key}`);
      }
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
    course: 'Java Masterclass',
    month: 1,
    title: 'Java Masterclass Month 1 OOPs & Array Structures',
    description: 'Continuous comprehensive evaluations tracking OOP design patterns, recursive trace routes, and core Array/ArrayList DSA complexity.',
    week1Title: 'Object Identification & Inheritance',
    week1Desc: 'Design an abstract vehicle engine hierarchy mapping fuel consumption methods.',
    week1Type: 'instruction',
    week2Title: 'DSA: Recursive Grid Traveler',
    week2Desc: 'Implement a memoized recursion solving path traversals on an N x M matrix.',
    week2Type: 'dsa',
    week2Question: 'Given a grid of size `m x n`, count all possible unique paths from top-left to bottom-right corner. You can only move down or right.',
    week2Constraints: '`1 <= m, n <= 100`\nExpected time complexity: `O(m * n)`',
    week2TestCases: 'm=3, n=7 -> 28\nm=3, n=2 -> 3\nm=3, n=3 -> 6',
    week2TemplateCode: 'class Solution {\n    public int uniquePaths(int m, int n) {\n        // Your grid recursion logic here\n        return 0;\n    }\n}',
    week3Title: 'Interface Polymorphism Lab',
    week3Desc: 'Build interfaces for multi-threaded stock transaction systems.',
    week3Type: 'instruction',
    week4Title: 'DSA: Balanced Binary Trees Check',
    week4Desc: 'Evaluate tree hierarchies for depth balance verification.',
    week4Type: 'dsa',
    week4Question: 'Determine if a binary tree is height-balanced. A height-balanced binary tree is defined as a binary tree in which the left and right subtrees of every node differ in height by no more than 1.',
    week4Constraints: 'The number of nodes is in range `[0, 5000]`.',
    week4TestCases: 'root = [3,9,20,null,null,15,7] -> true\nroot = [1,2,2,3,3,null,null,4,4] -> false',
    week4TemplateCode: '/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n * }\n */\nclass Solution {\n    public boolean isBalanced(TreeNode root) {\n        return true;\n    }\n}',
    createdDate: '2026-06-01'
  },
  {
    id: 'evo-bank-2',
    course: 'Full-Stack JavaScript Development',
    month: 1,
    title: 'JavaScript Month 1 Callbacks, Promises, and Node API Security',
    description: 'Track and evaluate asynchronous loops, fetch proxies, middleware authentication, and environment security rules.',
    week1Title: 'Asynchronous Fetch Loop',
    week1Desc: 'Create nested API fetching routes returning clean JSON responses.',
    week1Type: 'instruction',
    week2Title: 'DSA: Valid Palindrome Check',
    week2Desc: 'Optimized string pointer check validating alphanumeric characters.',
    week2Type: 'dsa',
    week2Question: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    week2Constraints: '`1 <= s.length <= 2 * 10^5`\n`s` consists only of printable ASCII characters.',
    week2TestCases: 's = "A man, a plan, a canal: Panama" -> true\ns = "race a car" -> false',
    week2TemplateCode: 'function isPalindrome(s) {\n    // Write your code here\n    return false;\n}',
    week3Title: 'Secure JWT Middleware',
    week3Desc: 'Construct secure JSON Web Token parse and verify middleware functions.',
    week3Type: 'instruction',
    week4Title: 'DSA: Bubble and Merge Sorting',
    week4Desc: 'Implement O(N log N) recursive sorting algorithms.',
    week4Type: 'dsa',
    week4Question: 'Given an array of integers, sort the array in ascending order.',
    week4Constraints: '`1 <= nums.length <= 5 * 10^4`',
    week4TestCases: 'nums = [5,2,3,1] -> [1,2,3,5]',
    week4TemplateCode: 'function sortArray(nums) {\n    return nums;\n}',
    createdDate: '2026-06-02'
  }
];
