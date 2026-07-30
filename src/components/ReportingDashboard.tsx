/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, ClassSchedule, ProgressRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { Download, FileSpreadsheet, BarChart2, TrendingUp, Star, Users, GitCompare, Award, Percent } from 'lucide-react';
import { exportToCSV } from '../utils';

interface ReportingDashboardProps {
  currentUser?: UserAccount;
  users?: UserAccount[];
  students: UserAccount[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
}

export default function ReportingDashboard({
  currentUser,
  users = [],
  students,
  schedules,
  progressRecords
}: ReportingDashboardProps) {
  const [exportTarget, setExportTarget] = useState<'students' | 'schedules' | 'progress'>('students');

  const [studentIdA, setStudentIdA] = useState<string>('');
  const [studentIdB, setStudentIdB] = useState<string>('');

  useEffect(() => {
    if (students.length > 0 && !studentIdA) {
      setStudentIdA(students[0].id);
    }
    if (students.length > 1 && !studentIdB) {
      setStudentIdB(students[1].id);
    } else if (students.length > 0 && !studentIdB) {
      setStudentIdB(students[0].id);
    }
  }, [students, studentIdA, studentIdB]);

  const activeStudentA = students.find(s => s.id === studentIdA) || students[0];
  const activeStudentB = students.find(s => s.id === studentIdB) || students[1] || students[0];

  const studentNameA = activeStudentA?.name || 'Student A';
  const studentNameB = activeStudentB?.name || 'Student B';

  const studentRecordsA = progressRecords.filter(r => r.studentId === activeStudentA?.id);
  const studentRecordsB = progressRecords.filter(r => r.studentId === activeStudentB?.id);

  // Stats Student A
  const totalA = studentRecordsA.length;
  const sumScoreA = studentRecordsA.reduce((sum, r) => sum + r.score, 0);
  const avgA = totalA > 0 ? Math.round(sumScoreA / totalA) : 0;
  const maxA = totalA > 0 ? Math.max(...studentRecordsA.map(r => r.score)) : 0;
  const presentA = totalA > 0 ? studentRecordsA.filter(r => r.attendanceStatus === 'present').length : 0;
  const attendanceRateA = totalA > 0 ? Math.round((presentA / totalA) * 100) : 0;

  // Stats Student B
  const totalB = studentRecordsB.length;
  const sumScoreB = studentRecordsB.reduce((sum, r) => sum + r.score, 0);
  const avgB = totalB > 0 ? Math.round(sumScoreB / totalB) : 0;
  const maxB = totalB > 0 ? Math.max(...studentRecordsB.map(r => r.score)) : 0;
  const presentB = totalB > 0 ? studentRecordsB.filter(r => r.attendanceStatus === 'present').length : 0;
  const attendanceRateB = totalB > 0 ? Math.round((presentB / totalB) * 100) : 0;

  // Find all unique subjects graded for either student A or B
  const subjectsA = studentRecordsA.map(r => r.subject);
  const subjectsB = studentRecordsB.map(r => r.subject);
  const comparisonSubjects = Array.from(new Set([...subjectsA, ...subjectsB]));

  const subjectComparisonData = comparisonSubjects.map(sub => {
    const subA = studentRecordsA.filter(r => r.subject === sub);
    const subB = studentRecordsB.filter(r => r.subject === sub);
    
    const scoreA = subA.length > 0 ? Math.round(subA.reduce((s, r) => s + r.score, 0) / subA.length) : null;
    const scoreB = subB.length > 0 ? Math.round(subB.reduce((s, r) => s + r.score, 0) / subB.length) : null;

    return {
      subject: sub,
      [studentNameA]: scoreA,
      [studentNameB]: scoreB
    };
  });

  // Unique dates for evaluations
  const datesA = studentRecordsA.map(r => r.evaluationDate);
  const datesB = studentRecordsB.map(r => r.evaluationDate);
  const comparisonDates = Array.from(new Set([...datesA, ...datesB])).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const timelineComparisonData = comparisonDates.map(date => {
    const onDateA = studentRecordsA.filter(r => r.evaluationDate === date);
    const onDateB = studentRecordsB.filter(r => r.evaluationDate === date);

    const scoreA = onDateA.length > 0 ? Math.round(onDateA.reduce((s, r) => s + r.score, 0) / onDateA.length) : null;
    const scoreB = onDateB.length > 0 ? Math.round(onDateB.reduce((s, r) => s + r.score, 0) / onDateB.length) : null;

    return {
      date,
      [studentNameA]: scoreA,
      [studentNameB]: scoreB
    };
  });

  // 1. Chart Data: Subject Average Scores
  const subjectGroups = progressRecords.reduce((acc: { [key: string]: number[] }, rec) => {
    if (!acc[rec.subject]) acc[rec.subject] = [];
    acc[rec.subject].push(rec.score);
    return acc;
  }, {});

  const subjectChartData = Object.keys(subjectGroups).map(sub => {
    const scores = subjectGroups[sub];
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return {
      name: sub,
      "Average Score": Math.round(avg),
      "Assessments Count": scores.length
    };
  });

  // 2. Chart Data: Enrollment Counts by Subject
  const enrollmentSubjectCounts = schedules.reduce((acc: { [key: string]: number }, cl) => {
    cl.enrolledStudentIds.forEach(() => {
      acc[cl.subject] = (acc[cl.subject] || 0) + 1;
    });
    return acc;
  }, {});

  const enrollmentChartData = Object.keys(enrollmentSubjectCounts).map(sub => ({
    name: sub,
    "Enrolled Count": enrollmentSubjectCounts[sub]
  }));

  // 3. Chart Data: Student Progress Timeline
  const timelineData = [...progressRecords]
    .sort((a, b) => new Date(a.evaluationDate).getTime() - new Date(b.evaluationDate).getTime())
    .map(rec => ({
      date: rec.evaluationDate,
      score: rec.score,
      student: rec.studentName,
      subject: rec.subject
    }));

  // 5. Chart Data: Monthly Attendance Trends (Batch vs Overall)
  const attendanceRecords = progressRecords.map(rec => {
    const student = students.find(s => s.id === rec.studentId);
    const dateObj = new Date(rec.evaluationDate);
    const month = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
    return {
      month,
      batch: student?.batch || 'Unassigned',
      isPresent: rec.attendanceStatus === 'present' ? 1 : 0,
      timestamp: dateObj.getTime()
    };
  });

  const monthlyData = {};
  attendanceRecords.forEach(rec => {
    if (!monthlyData[rec.month]) {
      monthlyData[rec.month] = { total: 0, present: 0, batches: {}, timestamp: rec.timestamp };
    }
    
    monthlyData[rec.month].total += 1;
    monthlyData[rec.month].present += rec.isPresent;
    
    if (!monthlyData[rec.month].batches[rec.batch]) {
      monthlyData[rec.month].batches[rec.batch] = { total: 0, present: 0 };
    }
    
    monthlyData[rec.month].batches[rec.batch].total += 1;
    monthlyData[rec.month].batches[rec.batch].present += rec.isPresent;
  });

  const allBatches = new Set<string>();
  
  const attendanceTrendData = Object.keys(monthlyData)
    .sort((a, b) => monthlyData[a].timestamp - monthlyData[b].timestamp)
    .map(month => {
      const data = monthlyData[month];
      const result = {
        month,
        "Overall Class": Math.round((data.present / data.total) * 100) || 0
      };
      
      Object.keys(data.batches).forEach(batch => {
        allBatches.add(batch);
        const batchData = data.batches[batch];
        result[batch] = Math.round((batchData.present / batchData.total) * 100) || 0;
      });
      
      return result;
    });

  const batchList = Array.from(allBatches);
  const batchColors = ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

  // 4. Chart Data: Grade Distribution Histogram
  const gradeBuckets = [
    { range: 'Below 50%', count: 0, min: 0, max: 49 },
    { range: '50-59%', count: 0, min: 50, max: 59 },
    { range: '60-69%', count: 0, min: 60, max: 69 },
    { range: '70-79%', count: 0, min: 70, max: 79 },
    { range: '80-89%', count: 0, min: 80, max: 89 },
    { range: '90-100%', count: 0, min: 90, max: 100 },
  ];

  progressRecords.forEach(rec => {
    const score = rec.score;
    const bucket = gradeBuckets.find(b => score >= b.min && score <= b.max);
    if (bucket) {
      bucket.count += 1;
    } else {
      if (score > 100) {
        const topBucket = gradeBuckets.find(b => b.range === '90-100%');
        if (topBucket) topBucket.count += 1;
      } else {
        const bottomBucket = gradeBuckets.find(b => b.range === 'Below 50%');
        if (bottomBucket) bottomBucket.count += 1;
      }
    }
  });

  const histogramData = gradeBuckets.map(b => ({
    range: b.range,
    "Record Count": b.count,
  }));

  const handleExport = () => {
    if (exportTarget === 'students') {
      const exportData = students.map(({ id, name, email, phone, joinedDate, assignedInstructorId }) => ({
        id, name, email, phone, joinedDate, assignedInstructorId
      }));
      exportToCSV(exportData, 'coaching_center_students_export');
    } else if (exportTarget === 'schedules') {
      const exportData = schedules.map(({ id, title, subject, instructorName, date, time, duration, location, status }) => ({
        id, title, subject, instructorName, date, time, duration, location, status
      }));
      exportToCSV(exportData, 'coaching_center_schedules_export');
    } else if (exportTarget === 'progress') {
      const exportData = progressRecords.map(({ id, studentName, className, subject, score, attendanceStatus, academicPerformance, feedback, evaluationDate }) => ({
        id, studentName, className, subject, score, attendanceStatus, academicPerformance, feedback, evaluationDate
      }));
      exportToCSV(exportData, 'coaching_center_academic_records_export');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {currentUser?.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-[#0B0C10] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Enrolled Courses</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2 mb-4">
              {schedules.filter(s => s.enrolledStudentIds.includes(currentUser.id)).length}
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B0C10] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">My Average Score</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2 mb-4">
              {progressRecords.filter(r => r.studentId === currentUser.id).length > 0
                ? (progressRecords.filter(r => r.studentId === currentUser.id).reduce((acc, r) => acc + r.score, 0) / progressRecords.filter(r => r.studentId === currentUser.id).length).toFixed(0)
                : '0'}%
            </p>
          </div>

          <div className="bg-white dark:bg-[#0B0C10] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Assigned Advisor</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mt-3 mb-5">
              {users.find(i => i.id === currentUser.assignedInstructorId)?.name || 'Not Assigned'}
            </p>
            <p className="text-[13px] text-slate-500">Profile synced</p>
          </div>
        </div>
      )}

      {/* Student Peer-to-Peer Progress Comparison Console */}
      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-500" />
              Student Peer-to-Peer Comparison Console
            </h1>
            <p className="text-sm text-slate-555 dark:text-gray-400 mt-0.5">
              Select two students to evaluate their chronological performance trends and subject score averages side-by-side.
            </p>
          </div>
        </div>

        {students.length < 2 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-[#070708]/50 rounded-2xl border border-slate-100 dark:border-white/5">
            <Award className="w-12 h-12 text-slate-350 dark:text-gray-650 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-650 dark:text-gray-300">At least two students are required to conduct side-by-side comparative analysis.</p>
            <p className="text-xs text-slate-400 mt-1">Please register additional students with academic evaluations to unlock.</p>
          </div>
        ) : (
          <>
            {/* Dropdown selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-[#0c0c0e]/60 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-400 dark:text-gray-500 font-bold block">First Student</label>
                <select
                  value={studentIdA}
                  onChange={e => {
                    const nextId = e.target.value;
                    setStudentIdA(nextId);
                    if (nextId === studentIdB) {
                      const other = students.find(s => s.id !== nextId);
                      if (other) setStudentIdB(other.id);
                    }
                  }}
                  className="w-full text-xs font-semibold bg-white dark:bg-[#161618] border border-slate-150 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center font-mono font-bold text-amber-500 text-xs uppercase px-1 pt-4">
                VS
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-400 dark:text-gray-500 font-bold block">Second Student</label>
                <select
                  value={studentIdB}
                  onChange={e => {
                    const nextId = e.target.value;
                    setStudentIdB(nextId);
                    if (nextId === studentIdA) {
                      const other = students.find(s => s.id !== nextId);
                      if (other) setStudentIdA(other.id);
                    }
                  }}
                  className="w-full text-xs font-semibold bg-white dark:bg-[#161618] border border-slate-150 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side stats matchups */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat 1: Average Score Matchup */}
              <div className="p-4 bg-slate-50/50 dark:bg-[#0c0c0e]/50 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Average Score</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    avgA > avgB
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : avgB > avgA
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {avgA > avgB ? `${studentNameA} Lead` : avgB > avgA ? `${studentNameB} Lead` : 'Match Tie'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameA}</p>
                    <p className="text-base font-mono font-bold text-amber-500 mt-0.5">{avgA}%</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-gray-500 font-bold">vs</span>
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameB}</p>
                    <p className="text-base font-mono font-bold text-yellow-600 dark:text-[#beaf9a] mt-0.5">{avgB}%</p>
                  </div>
                </div>
              </div>

              {/* Stat 2: Peak Score Matchup */}
              <div className="p-4 bg-slate-50/50 dark:bg-[#0c0c0e]/50 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Best Assessment Marks</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    maxA > maxB
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : maxB > maxA
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {maxA > maxB ? `${studentNameA} Peak` : maxB > maxA ? `${studentNameB} Peak` : 'Match Tie'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameA}</p>
                    <p className="text-base font-mono font-bold text-emerald-500 mt-0.5">{maxA}%</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-gray-500 font-bold">vs</span>
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameB}</p>
                    <p className="text-base font-mono font-bold text-[#becdba] mt-0.5">{maxB}%</p>
                  </div>
                </div>
              </div>

              {/* Stat 3: Attendance Ratio Matchup */}
              <div className="p-4 bg-slate-50/50 dark:bg-[#0c0c0e]/50 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Attendance Rate (Present)</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    attendanceRateA > attendanceRateB
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : attendanceRateB > attendanceRateA
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {attendanceRateA > attendanceRateB ? `${studentNameA} High` : attendanceRateB > attendanceRateA ? `${studentNameB} High` : 'Match Tie'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameA}</p>
                    <p className="text-base font-mono font-bold text-teal-500 mt-0.5">{attendanceRateA}%</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-gray-500 font-bold">vs</span>
                  <div className="text-center flex-1 py-1.5 bg-white dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-medium text-slate-400 dark:text-gray-500 truncate px-1">{studentNameB}</p>
                    <p className="text-base font-mono font-bold text-[#babebe] mt-0.5">{attendanceRateB}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
              {/* Chart 1: Subject average comparison */}
              <div className="bg-slate-50/20 dark:bg-[#0c0c0e]/20 border border-slate-150/50 dark:border-white/5 rounded-2xl p-5">
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-amber-500" />
                    Subject Average scores Comparison
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Average marks achieved per instructional subject domain</p>
                </div>
                
                {subjectComparisonData.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10 font-medium">No recorded subject scores found to visualize.</p>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="subject" fontSize={10} stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} fontSize={10} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey={studentNameA} fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={25} />
                        <Bar dataKey={studentNameB} fill="#9ca3af" radius={[6, 6, 0, 0]} maxBarSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart 2: Progress progression index timeline comparison */}
              <div className="bg-slate-50/20 dark:bg-[#0c0c0e]/20 border border-slate-150/50 dark:border-white/5 rounded-2xl p-5">
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-slate-400 dark:text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Historical Progression Side-by-Side
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Chronological grade progression across continuous assessments</p>
                </div>
                
                {timelineComparisonData.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10 font-medium font-serif italic">No chronological evaluations available to formulate comparative charts.</p>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineComparisonData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" fontSize={10} stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} fontSize={10} stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey={studentNameA} stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line type="monotone" dataKey={studentNameB} stroke="#9ca3af" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analytics Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Subject KPI Scoring */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Instructional Domains Academic Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Average grades scored across distinct student sectors</p>
            </div>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="Average Score" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Distribution */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Student Enrollment Concentration
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Ratio distribution of seats registered by courses</p>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="Enrolled Count" fill="#9ca3af" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Grade Distribution Histogram */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-500" />
                Student Grade Distribution Histogram
              </h3>
              <p className="text-xs text-slate-550 dark:text-gray-400 mt-0.5">
                Frequency analysis representing the count of students falling into distinct score ranges across all evaluative progress records
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="range" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="Record Count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temporal Progress Chart */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Academic Progression Index (Timeline)
              </h3>
              <p className="text-xs text-slate-550 dark:text-gray-400 mt-0.5">Continuous tracking of lesson evaluations, showing grade trends over dates</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} fontSize={11} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#070708', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Attendance Trends */}
        <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Monthly Attendance Trends
              </h3>
              <p className="text-xs text-slate-550 dark:text-gray-400 mt-0.5">
                Comparing individual batch attendance percentages against the overall class average over time
              </p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickMargin={10} />
                <YAxis domain={[0, 100]} fontSize={11} stroke="#94a3b8" tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ background: '#0F0F11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                
                {/* Overall Class Performance Line */}
                <Line
                  type="monotone"
                  dataKey="Overall Class"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Individual Batch Lines */}
                {batchList.map((batch, idx) => (
                  <Line
                    key={batch}
                    type="monotone"
                    dataKey={batch}
                    stroke={batchColors[idx % batchColors.length]}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: batchColors[idx % batchColors.length], strokeWidth: 1.5, stroke: '#fff' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CSV Export Desk */}
      <div className="bg-gradient-to-r from-neutral-900 via-[#070708] to-slate-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden border border-white/10 relative shadow-md">
        <div className="absolute right-0 bottom-0 opacity-5 rotate-12 pointer-events-none">
          <FileSpreadsheet className="w-60 h-60 text-blue-500" />
        </div>
        
        <div className="space-y-1.5 z-10">
          <h3 className="text-lg font-bold font-sans text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            Performance & Analytics Export
          </h3>
          <p className="text-xs text-slate-300 dark:text-gray-400 pr-4 leading-relaxed max-w-2xl font-sans">
            Audit coaching performance externally. Pick the target module sector from the list below to instantaneously save structured Spreadsheet layouts with fully compiled student, class timings, and feedback logs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto z-10 font-sans">
          <select
            value={exportTarget}
            onChange={e => setExportTarget(e.target.value as any)}
            className="bg-slate-800 dark:bg-[#070708] text-white dark:text-gray-300 border border-slate-700 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="students">Student Registry Directory</option>
            <option value="schedules">Live Classes Timetable</option>
            <option value="progress">Academic Evaluative Records</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white whitespace-nowrap text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 select-none"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
