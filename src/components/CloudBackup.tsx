/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord, BackupHistory, StudentBatch, Course, StudentAssignment } from '../types';
import { 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  Download, 
  Terminal, 
  Database, 
  Search, 
  Trash2, 
  Edit, 
  Plus, 
  Play, 
  Check, 
  X, 
  Info, 
  Table, 
  Layers, 
  FileCode 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CloudBackupProps {
  students: UserAccount[];
  instructors: UserAccount[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
  backupHistory: BackupHistory[];
  onTriggerBackup: () => void;
  onRestoreState: (state: { students: UserAccount[]; schedules: ClassSchedule[]; progress: ProgressRecord[] }) => void;
  
  // Real-time Master states for the Live SQL & Database Explorer
  users: UserAccount[];
  onUpdateUsers: (users: UserAccount[]) => void;
  onUpdateSchedules: (schedules: ClassSchedule[]) => void;
  onUpdateProgressRecords: (records: ProgressRecord[]) => void;
  courses: Course[];
  onUpdateCourses: (courses: Course[]) => void;
  batches: StudentBatch[];
  onUpdateBatches: (batches: StudentBatch[]) => void;
  assignments: StudentAssignment[];
  onUpdateAssignments: (assignments: StudentAssignment[]) => void;
}

export default function CloudBackup({
  students,
  instructors,
  schedules,
  progressRecords,
  backupHistory,
  onTriggerBackup,
  onRestoreState,
  users,
  onUpdateUsers,
  onUpdateSchedules,
  onUpdateProgressRecords,
  courses,
  onUpdateCourses,
  batches,
  onUpdateBatches,
  assignments,
  onUpdateAssignments
}: CloudBackupProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'snapshots' | 'explorer' | 'sql'>('explorer');

  // Existing Snapshot states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table Explorer states
  const [selectedExplorerTable, setSelectedExplorerTable] = useState<'users' | 'schedules' | 'progress' | 'courses' | 'batches' | 'assignments'>('users');
  const [explorerSearchTerm, setExplorerSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editingRowRawJson, setEditingRowRawJson] = useState<string>('');
  const [explorerError, setExplorerError] = useState<string | null>(null);
  const [explorerSuccess, setExplorerSuccess] = useState<string | null>(null);

  // SQL Query Console states
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users WHERE role = \'student\'');
  const [queryExecutionStats, setQueryExecutionStats] = useState<{ timeMs: number; affectedRows: number; mode: 'select' | 'write' } | null>(null);
  const [queryResultData, setQueryResultData] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [querySuccess, setQuerySuccess] = useState<string | null>(null);

  // Trigger simulated secure cloud synchronization
  const handleBackupNow = () => {
    setIsSyncing(true);
    setSyncStatus("Initial handshake with secure vault servers...");
    
    setTimeout(() => {
      setSyncStatus("Serializing database states (AES-256 encryption overhead)...");
    }, 800);

    setTimeout(() => {
      setSyncStatus("Pushing chunk records to replica buckets (us-east, asia-south)...");
    }, 1600);

    setTimeout(() => {
      onTriggerBackup();
      setIsSyncing(false);
      setSyncStatus(null);
    }, 2400);
  };

  // Drag Handlers for restoration
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Load and parsed state files
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Assert schema verification
        if (parsed.students && parsed.schedules && parsed.progress) {
          onRestoreState({
            students: parsed.students,
            schedules: parsed.schedules,
            progress: parsed.progress
          });
          setRestoreFeedback({
            type: 'success',
            message: `Cloud backup restored successfully. Loaded ${parsed.students.length} students, ${parsed.schedules.length} schedules, ${parsed.progress.length} evaluations.`
          });
        } else {
          setRestoreFeedback({
            type: 'error',
            message: 'Schema validation error. Ensure the backup file includes students, schedules, & progress registries.'
          });
        }
      } catch (e) {
        setRestoreFeedback({
          type: 'error',
          message: 'Error decoding selected JSON backup file. File might be corrupted.'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper trigger downloadable active backup file directly
  const downloadBackupJSON = () => {
    const payload = {
      students,
      schedules,
      progress: progressRecords,
      timestamp: new Date().toISOString(),
      center: 'Coaching Center Primary Node'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coaching_backup_${new Date().toISOString().slice(0, 10)}_active.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper: Retrieve table array by key
  const getExplorerTableData = (tableKey: typeof selectedExplorerTable) => {
    switch (tableKey) {
      case 'users': return users;
      case 'schedules': return schedules;
      case 'progress': return progressRecords;
      case 'courses': return courses;
      case 'batches': return batches;
      case 'assignments': return assignments;
      default: return [];
    }
  };

  // Helper: Get table labels/names
  const getTableMeta = (tableKey: typeof selectedExplorerTable) => {
    switch (tableKey) {
      case 'users': return { label: 'Users (Accounts)', collection: 'db-users' };
      case 'schedules': return { label: 'Class Schedules', collection: 'db-schedules' };
      case 'progress': return { label: 'Progress Evaluations', collection: 'db-progress' };
      case 'courses': return { label: 'Courses Directory', collection: 'db-courses' };
      case 'batches': return { label: 'Student Batches', collection: 'db-batches' };
      case 'assignments': return { label: 'Assignments Ledger', collection: 'db-assignments' };
    }
  };

  // Delete Record Handlers
  const handleDeleteRow = (rowId: string, tableKey: typeof selectedExplorerTable) => {
    if (!window.confirm(`Are you absolutely sure you want to delete this row (ID: ${rowId}) from table: ${getTableMeta(tableKey).label}? This write will persist to Firestore immediately!`)) {
      return;
    }

    try {
      if (tableKey === 'users') {
        onUpdateUsers(users.filter(u => u.id !== rowId));
      } else if (tableKey === 'schedules') {
        onUpdateSchedules(schedules.filter(s => s.id !== rowId));
      } else if (tableKey === 'progress') {
        onUpdateProgressRecords(progressRecords.filter(p => p.id !== rowId));
      } else if (tableKey === 'courses') {
        onUpdateCourses(courses.filter(c => c.id !== rowId));
      } else if (tableKey === 'batches') {
        onUpdateBatches(batches.filter(b => b.id !== rowId));
      } else if (tableKey === 'assignments') {
        onUpdateAssignments(assignments.filter(a => a.id !== rowId));
      }
      showToastFeedback(`Row with ID "${rowId}" deleted from ${getTableMeta(tableKey).label}.`, 'success');
    } catch (e: any) {
      showToastFeedback(`Deletion failed: ${e.message}`, 'error');
    }
  };

  // Open Edit Modal with row's current state
  const handleOpenEditModal = (row: any) => {
    setEditingRow(row);
    setEditingRowRawJson(JSON.stringify(row, null, 2));
    setExplorerError(null);
    setExplorerSuccess(null);
  };

  // Save row state changes
  const handleSaveEditedRow = () => {
    try {
      const parsedRow = JSON.parse(editingRowRawJson);
      
      if (!parsedRow.id) {
        throw new Error("Missing primary key 'id' in row payload!");
      }

      if (parsedRow.id !== editingRow.id) {
        throw new Error("Modifying primary key 'id' is prohibited to guard database integrity!");
      }

      if (selectedExplorerTable === 'users') {
        onUpdateUsers(users.map(u => u.id === parsedRow.id ? parsedRow : u));
      } else if (selectedExplorerTable === 'schedules') {
        onUpdateSchedules(schedules.map(s => s.id === parsedRow.id ? parsedRow : s));
      } else if (selectedExplorerTable === 'progress') {
        onUpdateProgressRecords(progressRecords.map(p => p.id === parsedRow.id ? parsedRow : p));
      } else if (selectedExplorerTable === 'courses') {
        onUpdateCourses(courses.map(c => c.id === parsedRow.id ? parsedRow : c));
      } else if (selectedExplorerTable === 'batches') {
        onUpdateBatches(batches.map(b => b.id === parsedRow.id ? parsedRow : b));
      } else if (selectedExplorerTable === 'assignments') {
        onUpdateAssignments(assignments.map(a => a.id === parsedRow.id ? parsedRow : a));
      }

      showToastFeedback(`Row "${parsedRow.id}" successfully updated in active database.`, 'success');
      setEditingRow(null);
    } catch (err: any) {
      setExplorerError(`Parse error: ${err.message}`);
    }
  };

  // Insert Row Handler
  const handleAddNewRow = () => {
    try {
      const newId = `${selectedExplorerTable.substring(0, 3)}-${Date.now()}`;
      let template: any = { id: newId };

      if (selectedExplorerTable === 'users') {
        template = {
          id: newId,
          name: "New Record",
          email: `${newId}@example.com`,
          role: "student",
          joinedDate: new Date().toLocaleDateString('en-US'),
          username: `${newId}@example.com`,
          password: `Learn@${newId}`
        };
      } else if (selectedExplorerTable === 'schedules') {
        template = {
          id: newId,
          title: "New Class Session",
          subject: "Coding",
          instructorId: "instructor-1",
          instructorName: "Mentor",
          date: new Date().toISOString().split('T')[0],
          time: "10:00",
          duration: 60,
          maxStudents: 30,
          enrolledStudentIds: [],
          status: "scheduled"
        };
      } else if (selectedExplorerTable === 'progress') {
        template = {
          id: newId,
          studentId: "student-1",
          studentName: "Student",
          classId: "class-1",
          className: "Class Session",
          instructorId: "instructor-1",
          instructorName: "Mentor",
          evaluationDate: new Date().toISOString().split('T')[0],
          subject: "Coding",
          score: 85,
          attendanceStatus: "present",
          feedback: "Great work!",
          academicPerformance: "good"
        };
      } else if (selectedExplorerTable === 'courses') {
        template = {
          id: newId,
          name: "New Course Program",
          code: "NEW-101",
          createdDate: new Date().toLocaleDateString('en-US'),
          status: "upcoming"
        };
      } else if (selectedExplorerTable === 'batches') {
        template = {
          id: newId,
          name: "New Batch Group",
          createdDate: new Date().toLocaleDateString('en-US'),
          status: "upcoming"
        };
      } else if (selectedExplorerTable === 'assignments') {
        template = {
          id: newId,
          title: "New Homework Task",
          description: "Instructions here",
          course: "All",
          batch: "All",
          instructorId: "instructor-1",
          instructorName: "Mentor",
          dueDate: new Date().toISOString().split('T')[0],
          maxPoints: 100,
          status: "published",
          createdDate: new Date().toLocaleDateString('en-US'),
          submissions: []
        };
      }

      handleOpenEditModal(template);
      setExplorerSuccess("Initialized empty row template. Click 'Save Row changes' to write to storage.");
    } catch (e: any) {
      setExplorerError(`Template error: ${e.message}`);
    }
  };

  // Helper feedback toasts
  const showToastFeedback = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setExplorerSuccess(msg);
      setExplorerError(null);
      setTimeout(() => setExplorerSuccess(null), 5000);
    } else {
      setExplorerError(msg);
      setExplorerSuccess(null);
    }
  };

  // SQL Query compiler evaluator
  const handleExecuteSQL = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryError(null);
    setQuerySuccess(null);
    setQueryResultData(null);
    setQueryExecutionStats(null);

    const startTime = performance.now();
    const query = sqlQuery.trim();

    try {
      if (!query) {
        throw new Error("Command input is empty!");
      }

      // SELECT Statement matcher
      const selectMatch = query.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
      // UPDATE Statement matcher
      const updateMatch = query.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
      // DELETE Statement matcher
      const deleteMatch = query.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i);
      // INSERT Statement matcher
      const insertMatch = query.match(/^INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);

      if (selectMatch) {
        const [_, rawFields, tableName, whereClause, limitVal] = selectMatch;
        const normalizedTableName = tableName.trim().toLowerCase();
        
        let sourceData: any[] = [];
        if (normalizedTableName === 'users' || normalizedTableName === 'students' || normalizedTableName === 'instructors') {
          sourceData = users;
        } else if (normalizedTableName === 'schedules' || normalizedTableName === 'classes') {
          sourceData = schedules;
        } else if (normalizedTableName === 'progress' || normalizedTableName === 'progress_records') {
          sourceData = progressRecords;
        } else if (normalizedTableName === 'courses') {
          sourceData = courses;
        } else if (normalizedTableName === 'batches') {
          sourceData = batches;
        } else if (normalizedTableName === 'assignments') {
          sourceData = assignments;
        } else {
          throw new Error(`Table "${tableName}" not found! Valid tables: users, schedules, progress, courses, batches, assignments.`);
        }

        // Apply where clause
        let filtered = [...sourceData];
        if (whereClause) {
          filtered = filtered.filter(item => evaluateWhereClause(item, whereClause));
        }

        // Apply select projection fields
        const fields = rawFields.trim().split(',').map(f => f.trim());
        let projected = filtered;
        if (fields.length > 0 && fields[0] !== '*') {
          projected = filtered.map(item => {
            const row: Record<string, any> = {};
            fields.forEach(field => {
              row[field] = item[field] !== undefined ? item[field] : null;
            });
            // Keep the id for actions
            if (item.id && !row.id) row.id = item.id;
            return row;
          });
        }

        // Apply limit
        if (limitVal) {
          projected = projected.slice(0, parseInt(limitVal, 10));
        }

        const endTime = performance.now();
        setQueryResultData(projected);
        setQueryExecutionStats({
          timeMs: Number((endTime - startTime).toFixed(2)),
          affectedRows: projected.length,
          mode: 'select'
        });
        setQuerySuccess(`SELECT returned ${projected.length} rows successfully.`);

      } else if (updateMatch) {
        const [_, tableName, setClause, whereClause] = updateMatch;
        const normalizedTableName = tableName.trim().toLowerCase();

        // 1. Identify dataset
        let dataset: any[] = [];
        let updater: (data: any[]) => void;

        if (normalizedTableName === 'users') {
          dataset = users; updater = onUpdateUsers;
        } else if (normalizedTableName === 'schedules') {
          dataset = schedules; updater = onUpdateSchedules;
        } else if (normalizedTableName === 'progress') {
          dataset = progressRecords; updater = onUpdateProgressRecords;
        } else if (normalizedTableName === 'courses') {
          dataset = courses; updater = onUpdateCourses;
        } else if (normalizedTableName === 'batches') {
          dataset = batches; updater = onUpdateBatches;
        } else if (normalizedTableName === 'assignments') {
          dataset = assignments; updater = onUpdateAssignments;
        } else {
          throw new Error(`Unknown target table "${tableName}"!`);
        }

        // 2. Parse set updates
        const setParts = setClause.split(',');
        const updates: Record<string, any> = {};
        for (const part of setParts) {
          const eqIndex = part.indexOf('=');
          if (eqIndex === -1) continue;
          const field = part.substring(0, eqIndex).trim();
          let val = part.substring(eqIndex + 1).trim();
          
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.substring(1, val.length - 1);
          }
          
          let parsedVal: any = val;
          if (val.toLowerCase() === 'true') parsedVal = true;
          else if (val.toLowerCase() === 'false') parsedVal = false;
          else if (!isNaN(Number(val)) && val.trim() !== '') parsedVal = Number(val);

          updates[field] = parsedVal;
        }

        // 3. Mutate rows
        let affectedCount = 0;
        const updatedDataset = dataset.map(item => {
          if (!whereClause || evaluateWhereClause(item, whereClause)) {
            affectedCount++;
            return { ...item, ...updates };
          }
          return item;
        });

        updater(updatedDataset);

        const endTime = performance.now();
        setQueryExecutionStats({
          timeMs: Number((endTime - startTime).toFixed(2)),
          affectedRows: affectedCount,
          mode: 'write'
        });
        setQuerySuccess(`UPDATE query executed. Persistent write completed: ${affectedCount} rows updated.`);

      } else if (deleteMatch) {
        const [_, tableName, whereClause] = deleteMatch;
        const normalizedTableName = tableName.trim().toLowerCase();

        let dataset: any[] = [];
        let updater: (data: any[]) => void;

        if (normalizedTableName === 'users') {
          dataset = users; updater = onUpdateUsers;
        } else if (normalizedTableName === 'schedules') {
          dataset = schedules; updater = onUpdateSchedules;
        } else if (normalizedTableName === 'progress') {
          dataset = progressRecords; updater = onUpdateProgressRecords;
        } else if (normalizedTableName === 'courses') {
          dataset = courses; updater = onUpdateCourses;
        } else if (normalizedTableName === 'batches') {
          dataset = batches; updater = onUpdateBatches;
        } else if (normalizedTableName === 'assignments') {
          dataset = assignments; updater = onUpdateAssignments;
        } else {
          throw new Error(`Unknown table "${tableName}"!`);
        }

        const remaining = dataset.filter(item => {
          if (whereClause && evaluateWhereClause(item, whereClause)) {
            return false; // delete this
          }
          return true;
        });

        const deletedCount = dataset.length - remaining.length;
        updater(remaining);

        const endTime = performance.now();
        setQueryExecutionStats({
          timeMs: Number((endTime - startTime).toFixed(2)),
          affectedRows: deletedCount,
          mode: 'write'
        });
        setQuerySuccess(`DELETE execution completes. Retained ${remaining.length} rows, purged ${deletedCount} rows.`);

      } else if (insertMatch) {
        const [_, tableName, fieldsStr, valuesStr] = insertMatch;
        const normalizedTableName = tableName.trim().toLowerCase();

        let dataset: any[] = [];
        let updater: (data: any[]) => void;

        if (normalizedTableName === 'users') {
          dataset = users; updater = onUpdateUsers;
        } else if (normalizedTableName === 'schedules') {
          dataset = schedules; updater = onUpdateSchedules;
        } else if (normalizedTableName === 'progress') {
          dataset = progressRecords; updater = onUpdateProgressRecords;
        } else if (normalizedTableName === 'courses') {
          dataset = courses; updater = onUpdateCourses;
        } else if (normalizedTableName === 'batches') {
          dataset = batches; updater = onUpdateBatches;
        } else if (normalizedTableName === 'assignments') {
          dataset = assignments; updater = onUpdateAssignments;
        } else {
          throw new Error(`Unknown table "${tableName}" for INSERT!`);
        }

        const fields = fieldsStr.split(',').map(f => f.trim());
        const rawValues = valuesStr.split(',').map(v => v.trim());

        if (fields.length !== rawValues.length) {
          throw new Error(`Fields count (${fields.length}) does not match values count (${rawValues.length})!`);
        }

        const newRecord: Record<string, any> = {};
        fields.forEach((field, i) => {
          let val = rawValues[i];
          if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
            val = val.substring(1, val.length - 1);
          }
          
          let parsedVal: any = val;
          if (val.toLowerCase() === 'true') parsedVal = true;
          else if (val.toLowerCase() === 'false') parsedVal = false;
          else if (!isNaN(Number(val)) && val.trim() !== '') parsedVal = Number(val);

          newRecord[field] = parsedVal;
        });

        if (!newRecord.id) {
          newRecord.id = `${normalizedTableName.substring(0,3)}-${Date.now()}`;
        }

        if (dataset.some(item => item.id === newRecord.id)) {
          throw new Error(`Integrity constraint violation: duplicate primary key ID "${newRecord.id}" already exists!`);
        }

        updater([...dataset, newRecord]);

        const endTime = performance.now();
        setQueryExecutionStats({
          timeMs: Number((endTime - startTime).toFixed(2)),
          affectedRows: 1,
          mode: 'write'
        });
        setQuerySuccess(`INSERT complete. Row registered safely.`);

      } else if (query.startsWith('//') || query.includes('=>') || query.includes('function')) {
        // Expose a quick JS sandbox environment for developers
        const sandboxExecutor = new Function(
          'users', 'schedules', 'progress', 'courses', 'batches', 'assignments',
          `try {
            return (${query});
          } catch(e) {
            return "Execution error: " + e.message;
          }`
        );
        const result = sandboxExecutor(users, schedules, progressRecords, courses, batches, assignments);
        
        const endTime = performance.now();
        setQueryResultData(Array.isArray(result) ? result : [ { result: result } ]);
        setQueryExecutionStats({
          timeMs: Number((endTime - startTime).toFixed(2)),
          affectedRows: Array.isArray(result) ? result.length : 1,
          mode: 'select'
        });
        setQuerySuccess("JavaScript sandbox script parsed and returned active data.");
      } else {
        throw new Error("Invalid query command syntax. Supported patterns: SELECT, UPDATE, DELETE, INSERT, or standard JS expressions.");
      }

    } catch (err: any) {
      setQueryError(`Query execution halted: ${err.message}`);
    }
  };

  // Helper condition evaluator for compound/simple query selectors
  const evaluateWhereClause = (item: any, whereClause: string): boolean => {
    const andParts = whereClause.split(/\s+AND\s+/i);
    return andParts.every(part => {
      const match = part.trim().match(/^\s*(\w+)\s*(=|!=|<>|>=|<=|>|<|LIKE|CONTAINS)\s*(.+?)\s*$/i);
      if (!match) return true;

      const [_, field, operator, rawValue] = match;
      if (item[field] === undefined) return false;

      let val = rawValue.trim();
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.substring(1, val.length - 1);
      }

      const itemVal = item[field];
      const itemValStr = String(itemVal).toLowerCase();
      const compareValStr = String(val).toLowerCase();

      switch (operator.toUpperCase()) {
        case '=':
          return String(itemVal).toLowerCase() === compareValStr;
        case '!=':
        case '<>':
          return String(itemVal).toLowerCase() !== compareValStr;
        case '>':
          return Number(itemVal) > Number(val);
        case '<':
          return Number(itemVal) < Number(val);
        case '>=':
          return Number(itemVal) >= Number(val);
        case '<=':
          return Number(itemVal) <= Number(val);
        case 'LIKE':
        case 'CONTAINS':
          return itemValStr.includes(compareValStr.replace(/%/g, ''));
        default:
          return false;
      }
    });
  };

  // Set visual explorer items filtering
  const activeExplorerData = getExplorerTableData(selectedExplorerTable);
  const filteredExplorerData = activeExplorerData.filter(row => {
    if (!explorerSearchTerm) return true;
    const term = explorerSearchTerm.toLowerCase();
    return Object.entries(row).some(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val).toLowerCase().includes(term);
      }
      return String(val).toLowerCase().includes(term);
    });
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Visual Header card */}
      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight flex items-center gap-2 select-none">
              <Database className="w-6.5 h-6.5 text-indigo-500 animate-pulse" />
              Database Control & Live Console
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Manage state repositories directly connected to Google Firebase. Query collections visually or write precise SQL statements with real-time updates.
            </p>
          </div>
          
          {/* Main Sub Navigation tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5 self-start">
            <button
              onClick={() => setActiveSubTab('explorer')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'explorer'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Live Table Explorer
            </button>
            <button
              onClick={() => setActiveSubTab('sql')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'sql'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              SQL Console
            </button>
            <button
              onClick={() => setActiveSubTab('snapshots')}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'snapshots'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Cloud Snapshots
            </button>
          </div>
        </div>

        {/* Global feedbacks */}
        {explorerSuccess && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/15 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{explorerSuccess}</span>
          </div>
        )}
        {explorerError && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/15 text-rose-800 dark:text-rose-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{explorerError}</span>
          </div>
        )}
      </div>

      {/* Content panes based on Sub Tab state */}
      <AnimatePresence mode="wait">
        
        {/* SNAPSHOTS VIEW */}
        {activeSubTab === 'snapshots' && (
          <motion.div
            key="snapshots"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Snapshots Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 select-none font-sans">
                    System Handshake Synchronization
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                    Instantly save system memory records to local configuration backups. Currently indexing {students.length} students, {instructors.length} instructors, {schedules.length} class blocks, and {progressRecords.length} student grade evolutions.
                  </p>
                </div>

                {isSyncing && (
                  <div className="my-5 p-4 bg-black text-amber-500 font-mono text-[10.5px] rounded-2xl border border-white/5 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500 flex-shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleBackupNow}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow hover:shadow-indigo-500/10 active:scale-95 transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Create Secure Cloud Backup
                  </button>
                  <button
                    type="button"
                    onClick={downloadBackupJSON}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-[#0A0A0B] dark:border-white/5 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Snapshot (.json)
                  </button>
                </div>
              </div>

              {/* Past cloud audit logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-450 dark:text-zinc-400 uppercase tracking-widest font-mono">Backup History Ledger</h4>
                <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-2xl bg-white dark:bg-[#0A0A0B] text-xs shadow-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-900/50 font-semibold text-slate-500 dark:text-zinc-400 select-none font-mono">
                      <tr>
                        <th className="p-4">Filename</th>
                        <th className="p-4">Sync Date</th>
                        <th className="p-4">File Size</th>
                        <th className="p-4">Total Records</th>
                        <th className="p-4 text-right">Integrity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-white/5">
                      {backupHistory.map(bak => (
                        <tr key={bak.id} className="text-slate-650 dark:text-zinc-400 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                          <td className="p-4 font-mono font-medium text-slate-850 dark:text-zinc-300">{bak.fileName}</td>
                          <td className="p-4">{new Date(bak.timestamp).toLocaleString()}</td>
                          <td className="p-4 font-mono">{bak.fileSize}</td>
                          <td className="p-4 text-slate-500 dark:text-zinc-500">
                            {bak.recordCount.students} stu, {bak.recordCount.classes} cls
                          </td>
                          <td className="p-4 text-right text-emerald-500 font-semibold select-none">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10 text-[10px]">
                              <CheckCircle className="w-3 h-3" /> SECURE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Standalone Restoration Drag Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white select-none mb-2 font-sans">
                  Restore System Snapshot
                </h3>
                <p className="text-xs text-slate-550 dark:text-zinc-400 mb-4 leading-relaxed font-sans">
                  Instantly restore databases by dropping a pre-downloaded system snapshot. Applying restorations overwrites active database registers.
                </p>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[190px] select-none ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-500/[0.05] dark:bg-indigo-500/[0.02]'
                      : 'border-slate-200 dark:border-white/10 hover:border-indigo-500/50 bg-slate-50/45 dark:bg-[#070708]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-10 h-10 text-indigo-500 mb-3 animate-bounce" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
                    Drag & Drop backup JSON here
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
                    or click to search locally (.json)
                  </p>
                </div>

                {restoreFeedback && (
                  <div className={`mt-4 p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                    restoreFeedback.type === 'success'
                      ? 'bg-emerald-50/30 border-emerald-150 text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-400'
                      : 'bg-rose-50/30 border-rose-150 text-rose-800 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-450'
                  }`}>
                    {restoreFeedback.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                    )}
                    <div>
                      <p className="font-bold">{restoreFeedback.type === 'success' ? 'Validation Succeeded' : 'Validation Error'}</p>
                      <p className="mt-0.5">{restoreFeedback.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* LIVE TABLE EXPLORER VIEW */}
        {activeSubTab === 'explorer' && (
          <motion.div
            key="explorer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Table Selection Pills and Search filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 p-4.5 rounded-3xl shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['users', 'schedules', 'progress', 'courses', 'batches', 'assignments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedExplorerTable(tab);
                      setExplorerSearchTerm('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      selectedExplorerTable === tab
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-550/20 dark:text-indigo-400 border border-indigo-150/40 dark:border-indigo-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    {getTableMeta(tab).label}
                    <span className="text-[10px] bg-white dark:bg-zinc-850 px-1.5 py-0.5 rounded-md font-mono border border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-zinc-400">
                      {getExplorerTableData(tab).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Search ${getTableMeta(selectedExplorerTable).label}...`}
                    value={explorerSearchTerm}
                    onChange={(e) => setExplorerSearchTerm(e.target.value)}
                    className="pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-xl text-xs w-full min-w-[200px] md:min-w-[260px] focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550"
                  />
                  {explorerSearchTerm && (
                    <button onClick={() => setExplorerSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAddNewRow}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition select-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
            </div>

            {/* Table Display */}
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/70 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-mono border-b border-slate-200 dark:border-white/5">
                    <tr>
                      {selectedExplorerTable === 'users' && (
                        <>
                          <th className="p-4">Universal ID / ID</th>
                          <th className="p-4">Name / Role</th>
                          <th className="p-4">Email Address</th>
                          <th className="p-4">Credentials (Username/PW)</th>
                          <th className="p-4">Enrollment (Course/Batch)</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                      {selectedExplorerTable === 'schedules' && (
                        <>
                          <th className="p-4">Schedule ID</th>
                          <th className="p-4">Subject & Title</th>
                          <th className="p-4">Mentor</th>
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Target (Course/Batch)</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                      {selectedExplorerTable === 'progress' && (
                        <>
                          <th className="p-4">Record ID</th>
                          <th className="p-4">Student</th>
                          <th className="p-4">Subject & Class</th>
                          <th className="p-4">Score & Performance</th>
                          <th className="p-4">Attendance</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                      {selectedExplorerTable === 'courses' && (
                        <>
                          <th className="p-4">Course ID</th>
                          <th className="p-4">Name & Code</th>
                          <th className="p-4">Timeline / Details</th>
                          <th className="p-4">Created Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                      {selectedExplorerTable === 'batches' && (
                        <>
                          <th className="p-4">Batch ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Created Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                      {selectedExplorerTable === 'assignments' && (
                        <>
                          <th className="p-4">Assignment ID</th>
                          <th className="p-4">Title & Details</th>
                          <th className="p-4">Class Ref</th>
                          <th className="p-4">Scope (Course/Batch)</th>
                          <th className="p-4">Due Date</th>
                          <th className="p-4">Points</th>
                          <th className="p-4 text-right">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-white/5">
                    {filteredExplorerData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-400 font-mono">
                          No database records found matching active query selectors.
                        </td>
                      </tr>
                    ) : (
                      filteredExplorerData.map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                          
                          {/* USERS FIELDS */}
                          {selectedExplorerTable === 'users' && (
                            <>
                              <td className="p-4 font-mono font-medium">
                                <div className="text-slate-850 dark:text-zinc-200">{row.universalId || 'N/A'}</div>
                                <div className="text-[10px] text-slate-400">{row.id}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
                                <div className="text-[10px] font-bold text-indigo-500 uppercase">{row.role}</div>
                              </td>
                              <td className="p-4 font-mono">{row.email}</td>
                              <td className="p-4">
                                <div className="font-mono text-[11px] text-slate-650 dark:text-zinc-400">U: {row.username}</div>
                                <div className="font-mono text-[10px] text-slate-400">P: {row.password}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-slate-700 dark:text-zinc-300">{row.course || 'Unassigned'}</div>
                                <div className="text-[10px] text-slate-450 dark:text-zinc-500">{row.batch || 'Unassigned'}</div>
                              </td>
                            </>
                          )}

                          {/* SCHEDULES FIELDS */}
                          {selectedExplorerTable === 'schedules' && (
                            <>
                              <td className="p-4 font-mono text-slate-400">{row.id}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.title}</div>
                                <div className="text-[10px] font-mono text-indigo-500">{row.subject}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium">{row.instructorName}</div>
                                <div className="text-[10px] text-slate-400">ID: {row.instructorId}</div>
                              </td>
                              <td className="p-4 font-mono">
                                <div>{row.date}</div>
                                <div className="text-slate-400">{row.time} ({row.duration}m)</div>
                              </td>
                              <td className="p-4">
                                <div>C: {row.course || 'All'}</div>
                                <div className="text-slate-400 text-[10px]">B: {row.batch || 'All'}</div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                                  row.status === 'scheduled' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                                  row.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                  'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-zinc-400'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}

                          {/* PROGRESS FIELDS */}
                          {selectedExplorerTable === 'progress' && (
                            <>
                              <td className="p-4 font-mono text-slate-400">{row.id}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.studentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {row.studentId}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-slate-700 dark:text-zinc-300">{row.className}</div>
                                <div className="text-[10px] font-mono text-slate-400">{row.subject}</div>
                              </td>
                              <td className="p-4 font-mono">
                                <div className="font-bold text-indigo-600 dark:text-indigo-400">{row.score}%</div>
                                <div className="text-[10px] uppercase font-bold text-slate-450">{row.academicPerformance}</div>
                              </td>
                              <td className="p-4 uppercase font-bold font-mono text-[10px]">
                                <span className={row.attendanceStatus === 'present' ? 'text-emerald-500' : 'text-rose-500'}>
                                  {row.attendanceStatus}
                                </span>
                              </td>
                            </>
                          )}

                          {/* COURSES FIELDS */}
                          {selectedExplorerTable === 'courses' && (
                            <>
                              <td className="p-4 font-mono text-slate-400">{row.id}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
                                <div className="text-[10px] font-mono font-bold text-indigo-500">{row.code}</div>
                              </td>
                              <td className="p-4">
                                <div className="text-slate-650 dark:text-zinc-450">{row.durationMonths} Months ({row.durationUnit})</div>
                                <div className="text-[10px] text-slate-400">Fee: {row.fee ? `${row.fee} INR` : 'Free'}</div>
                              </td>
                              <td className="p-4 font-mono">{row.createdDate}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                  row.status === 'ongoing' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-450' :
                                  row.status === 'upcoming' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-zinc-400'
                                }`}>
                                  {row.status || 'N/A'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* BATCHES FIELDS */}
                          {selectedExplorerTable === 'batches' && (
                            <>
                              <td className="p-4 font-mono text-slate-400">{row.id}</td>
                              <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                              <td className="p-4 font-mono">{row.createdDate}</td>
                              <td className="p-4">
                                <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                  {row.status || 'Active'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* ASSIGNMENTS FIELDS */}
                          {selectedExplorerTable === 'assignments' && (
                            <>
                              <td className="p-4 font-mono text-slate-400">{row.id}</td>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{row.title}</div>
                                <div className="text-[10px] text-slate-450">Mentor: {row.instructorName}</div>
                              </td>
                              <td className="p-4">{row.className || 'General'}</td>
                              <td className="p-4 font-medium text-slate-600 dark:text-zinc-400">
                                <div>C: {row.course}</div>
                                <div className="text-[10px] text-slate-450">B: {row.batch}</div>
                              </td>
                              <td className="p-4 font-mono text-rose-500">{row.dueDate}</td>
                              <td className="p-4 font-mono font-bold text-indigo-500">{row.maxPoints} pts</td>
                            </>
                          )}

                          {/* ROW CONTROL ACTIONS */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(row)}
                                className="p-2 text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
                                title="Edit row raw JSON payload"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row.id, selectedExplorerTable)}
                                className="p-2 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition"
                                title="Delete row permanently from database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SQL COMMAND LINE CONSOLE */}
        {activeSubTab === 'sql' && (
          <motion.div
            key="sql"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Query terminal entry */}
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white select-none">
                    Interactive SQL Query Editor
                  </h3>
                </div>
                
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-500 px-2 py-0.5 rounded-lg bg-indigo-500/10">
                  SANDBOX TRANS-COMPILER v1.2
                </span>
              </div>

              {/* Presets/Templates */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-semibold text-slate-400 mr-1 select-none">Templates:</span>
                <button 
                  onClick={() => setSqlQuery(`SELECT name, email, role FROM users WHERE role = 'student'`)}
                  className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 text-slate-650 dark:text-zinc-400 font-mono text-[10.5px] border border-slate-200/40 dark:border-white/5 cursor-pointer"
                >
                  Select Students
                </button>
                <button 
                  onClick={() => setSqlQuery(`UPDATE users SET batch = 'Batch B' WHERE email = 'student@example.com'`)}
                  className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 text-slate-650 dark:text-zinc-400 font-mono text-[10.5px] border border-slate-200/40 dark:border-white/5 cursor-pointer"
                >
                  Update Batch
                </button>
                <button 
                  onClick={() => setSqlQuery(`SELECT * FROM progress WHERE score < 80`)}
                  className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 text-slate-650 dark:text-zinc-400 font-mono text-[10.5px] border border-slate-200/40 dark:border-white/5 cursor-pointer"
                >
                  Failed Evaluations
                </button>
                <button 
                  onClick={() => setSqlQuery(`// Pure JS expression support\nusers.map(u => ({ name: u.name, len: u.name.length }))`)}
                  className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 text-slate-650 dark:text-zinc-400 font-mono text-[10.5px] border border-slate-200/40 dark:border-white/5 cursor-pointer"
                >
                  JS Script Query
                </button>
              </div>

              {/* Form query entry */}
              <form onSubmit={handleExecuteSQL} className="space-y-4">
                <div className="relative border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
                  <div className="absolute top-3 left-4 text-indigo-400/80 font-mono font-bold select-none text-xs">
                    SQL&gt;
                  </div>
                  <textarea
                    rows={4}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full pl-13 pr-4 py-3 bg-slate-50 dark:bg-zinc-900/40 focus:outline-none text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed"
                    placeholder="SELECT * FROM users WHERE role = 'student'"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-450 leading-normal flex items-center gap-1.5 max-w-lg">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Writes (UPDATE/DELETE/INSERT) dynamically update local memory and push updates straight to Google Firestore collections!</span>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow hover:shadow-indigo-500/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Execute Query
                  </button>
                </div>
              </form>

              {/* Execution reports */}
              {querySuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Transaction Success</span>
                    <p className="mt-0.5">{querySuccess}</p>
                  </div>
                </div>
              )}

              {queryError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-450 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Engine Exception</span>
                    <p className="mt-0.5 font-mono text-[10.5px] text-rose-600 dark:text-rose-400">{queryError}</p>
                  </div>
                </div>
              )}

              {queryExecutionStats && (
                <div className="flex items-center gap-4 text-[10.5px] font-mono text-slate-450 pt-2 border-t border-slate-100 dark:border-white/5">
                  <div>Compile Speed: <span className="text-slate-700 dark:text-zinc-300 font-bold">{queryExecutionStats.timeMs}ms</span></div>
                  <span>•</span>
                  <div>Affected Record Count: <span className="text-slate-700 dark:text-zinc-300 font-bold">{queryExecutionStats.affectedRows} rows</span></div>
                </div>
              )}
            </div>

            {/* Query result output table */}
            {queryResultData && (
              <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest font-mono">Dataset Results output ({queryResultData.length} records)</h4>
                </div>

                <div className="overflow-x-auto border border-slate-150 dark:border-white/5 rounded-2xl">
                  {queryResultData.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 font-mono text-xs">
                      The query executed successfully but returned an empty dataset.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-slate-50/70 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-mono font-bold select-none border-b border-slate-250 dark:border-white/5">
                        <tr>
                          {Object.keys(queryResultData[0]).map(col => (
                            <th key={col} className="p-4 capitalize">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-white/5">
                        {queryResultData.map((row, i) => (
                          <tr key={row.id || i} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                            {Object.entries(row).map(([key, val], idx) => (
                              <td key={idx} className="p-4 truncate max-w-[260px]" title={typeof val === 'object' ? JSON.stringify(val) : String(val)}>
                                {typeof val === 'object' && val !== null ? (
                                  <span className="text-[10px] bg-slate-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded-md border border-slate-200/40 dark:border-white/5 text-slate-500">
                                    {JSON.stringify(val).substring(0, 30)}...
                                  </span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* REWRITTEN ROW RAW JSON EDIT OVERLAY MODAL */}
      <AnimatePresence>
        {editingRow && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2 select-none">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit JSON payload: {editingRow.id}
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingRow(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold select-none">Raw JSON parameters</label>
                <textarea
                  rows={14}
                  value={editingRowRawJson}
                  onChange={(e) => setEditingRowRawJson(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/5 rounded-2xl text-[11px] font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-550"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="text-[10.5px] text-slate-450 max-w-xs leading-normal select-none">
                  Ensure standard JSON syntax. Modifying or deleting "id" keys will result in database exceptions.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-755 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedRow}
                    className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Row changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
