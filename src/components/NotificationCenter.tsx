/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppNotification, UserAccount } from '../types';
import { Bell, Mail, Smartphone, Trash2, Check, ArrowRight, ShieldCheck, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  currentUser: UserAccount;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onTriggerTestNotification: (type: 'reminder' | 'grade' | 'enrollment') => void;
}

export default function NotificationCenter({
  currentUser,
  notifications,
  onMarkAsRead,
  onClearAll,
  onTriggerTestNotification
}: NotificationCenterProps) {
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'push' | 'email'>('all');
  const [emailLogs, setEmailLogs] = useState<{ id: string; to: string; subject: string; body: string; sentAt: string }[]>([
    {
      id: 'log-1',
      to: 'chloe.b@student.edu',
      subject: '📚 Learning Progress Update - Coaching Center',
      body: 'Your instructor Eleonor Vance added a evaluation for limits module. Score: 88%. Go to dashboard for details.',
      sentAt: '2026-05-30 08:30:11'
    },
    {
      id: 'log-2',
      to: 'alex.rivera@student.edu',
      subject: '⚡ Upcoming Physics Session Tomorrow',
      body: 'Friendly reminder: "Kinematics Fundamentals" session starts on 2026-06-01 at 14:00. Room: Lab 3B.',
      sentAt: '2026-05-30 18:00:00'
    }
  ]);
  const [isSimulatingTrigger, setIsSimulatingTrigger] = useState(false);

  const isStudent = currentUser.role === 'student';

  // Filter criteria
  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'push') return n.channel === 'push';
    if (activeTab === 'email') return n.channel === 'email';
    return true;
  });

  const handleSimulateAutomatedEmails = () => {
    setIsSimulatingTrigger(true);
    setTimeout(() => {
      const newLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        to: 'all-students-enrolled@coachingcenter.edu',
        subject: '📅 Automated Weekly Class Schedule Alert',
        body: 'This is an automated system email summary. All classes for the week of June 1st have been consolidated and synced with student dashboards.',
        sentAt: new Date().toLocaleTimeString('en-US', { hour12: false })
      };
      setEmailLogs(prev => [newLog, ...prev]);
      setIsSimulatingTrigger(false);
      onTriggerTestNotification('reminder');
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-[#161618] rounded-3xl border border-slate-100 dark:border-white/5 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-amber-500 font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500 animate-pulse" />
            {isStudent ? 'Important Notifications' : 'Notification & Automated Email Dispatcher'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            {isStudent 
              ? 'Stay updated on your grades, schedule changes, and important alerts.'
              : 'Real-time triggers, live push notification previews, and automatic cron-based student/instructor reminders.'}
          </p>
        </div>

        {!isStudent && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTriggerTestNotification('grade')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#0F0F11] dark:hover:bg-white/5 text-slate-800 dark:text-amber-500 border dark:border-white/5 font-semibold text-xs rounded-xl transition duration-200"
            >
              + Test Grade Push Alert
            </button>
            <button
              onClick={() => onTriggerTestNotification('enrollment')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#0F0F11] dark:hover:bg-white/5 text-slate-800 dark:text-gray-300 border dark:border-white/5 font-semibold text-xs rounded-xl transition duration-200"
            >
              + Test Enrollment In-App
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Real-time Push Section */}
        <div className={`${isStudent ? 'xl:col-span-12' : 'xl:col-span-6'} bg-slate-50 dark:bg-[#0F0F11] rounded-2xl p-5 border border-slate-100 dark:border-white/5`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                <Smartphone className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm">
                In-App & Push Center ({unreadCount} unread)
              </h3>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={onClearAll}
                  className="text-xs text-rose-500 flex items-center gap-1 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              </div>
            )}
          </div>

          {/* Quick tab filters */}
          <div className="flex gap-2 mb-3">
            {(['all', 'push', 'email'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white dark:bg-amber-500 dark:text-amber-950'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 dark:bg-[#161618] dark:text-gray-400 dark:border-white/5'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400 dark:text-gray-500 font-mono">No notifications in current channel</p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex gap-3 transition ${
                    item.read
                      ? 'bg-white/60 dark:bg-[#161618]/60 border-slate-100 dark:border-white/5 opacity-70'
                      : 'bg-white dark:bg-[#161618] border-amber-100 dark:border-amber-500/30'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.channel === 'push' ? (
                      <Smartphone className={`w-4 h-4 ${item.read ? 'text-slate-400' : 'text-amber-500'}`} />
                    ) : item.channel === 'email' ? (
                      <Mail className={`w-4 h-4 ${item.read ? 'text-slate-400' : 'text-amber-400'}`} />
                    ) : (
                      <Bell className={`w-4 h-4 ${item.read ? 'text-slate-400' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-bold ${item.read ? 'text-slate-700 dark:text-gray-400' : 'text-slate-900 dark:text-gray-200'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-550 dark:text-gray-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-50 dark:border-white/5">
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#0F0F11] text-slate-550 dark:text-gray-400 border dark:border-white/5 px-1.5 py-0.5 rounded-md">
                        {item.type.toUpperCase()} • {item.channel.toUpperCase()}
                      </span>
                      {!item.read && (
                        <button
                          onClick={() => onMarkAsRead(item.id)}
                          className="text-[10px] text-amber-500 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Automated Email Service Dashboard */}
        {!isStudent && (
          <div className="xl:col-span-6 flex flex-col justify-between">
            <div className="bg-slate-800 text-slate-100 dark:bg-[#0F0F11] rounded-2xl p-5 border border-slate-700 dark:border-white/5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold tracking-tight text-white dark:text-gray-200 flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    SYSTEM Reminders Active & Ready
                  </h3>
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 select-none">
                    CRON SERVICE: ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-300 dark:text-gray-400 leading-relaxed max-w-md mb-4">
                  Students and parents automatically receive email updates prior to scheduled sessions, immediately following grade evaluations, and upon class registration changes.
                </p>

                {/* Action trigger to trigger simulated batch emails */}
                <div className="mb-4">
                  <button
                    onClick={handleSimulateAutomatedEmails}
                    disabled={isSimulatingTrigger}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-705 text-amber-950 shadow-md py-2.5 rounded-xl font-bold text-xs transition active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isSimulatingTrigger ? "Running Cron Dispatcher..." : "Force Trigger Mid-Week Email Dispatch"}
                  </button>
                </div>

                {/* Email logs terminal */}
                <div className="rounded-xl bg-slate-900 dark:bg-[#0A0A0B] px-3.5 py-3 border border-slate-850 dark:border-white/5 font-mono text-[11px] leading-relaxed max-h-[170px] overflow-y-auto">
                  <div className="flex items-center gap-1 text-slate-450 border-b border-slate-800 dark:border-white/5 pb-1.5 mb-2 select-none">
                    <span className="h-2 w-2 rounded-full bg-red-400"></span>
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span className="ml-1 text-[10px] text-gray-500">E-Mail Dispatch logs (live stream)</span>
                  </div>
                  {emailLogs.map((log, index) => (
                    <div key={log.id} className="mb-2 pb-1 border-b border-slate-850 dark:border-white/5 last:border-0 last:pb-0 text-slate-200">
                      <div className="flex justify-between text-slate-500 font-semibold select-none text-[10px]">
                        <span>TO: {log.to}</span>
                        <span>{log.sentAt}</span>
                      </div>
                      <div className="font-bold text-amber-500 truncate mt-0.5 font-sans">{log.subject}</div>
                      <p className="text-slate-400 dark:text-gray-400 line-clamp-1 text-[10.5px] mt-0.5">{log.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-405 dark:text-gray-500 select-none bg-slate-850/60 dark:bg-[#0A0A0B] px-3 py-2 rounded-lg border border-slate-750 dark:border-white/5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-pulse" />
                <span>Auto-retries on bounce & SPF/DKIM secure records applied correctly.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}