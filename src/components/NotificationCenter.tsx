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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500 animate-pulse" />
            {isStudent ? 'Notifications' : 'Notification & Email Dispatcher'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            {isStudent 
              ? 'Stay updated on your grades, schedule changes, and important alerts.'
              : 'Real-time triggers, live push notification previews, and automatic student/instructor reminders.'}
          </p>
        </div>

        {!isStudent && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTriggerTestNotification('grade')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white text-xs font-semibold rounded-xl tracking-tight transition cursor-pointer select-none"
            >
              + Test Grade Alert
            </button>
            <button
              onClick={() => onTriggerTestNotification('enrollment')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white text-xs font-semibold rounded-xl tracking-tight transition cursor-pointer select-none"
            >
              + Test Enrollment Alert
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
                          className="text-[10px] text-[#FF3B5C] hover:text-[#E11D48] font-semibold hover:underline flex items-center gap-0.5"
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


      </div>
    </div>
  );
}