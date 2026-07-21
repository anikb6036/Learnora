/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, SimulatedEmail } from '../types';
import { Mail, Send, Inbox, ExternalLink, ArrowLeft, Plus, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MailboxManagerProps {
  currentUser: UserAccount;
  users: UserAccount[];
  simulatedEmails: SimulatedEmail[];
  onSendEmail: (toEmail: string, subject: string, body: string) => void;
}

export default function MailboxManager({
  currentUser,
  users,
  simulatedEmails,
  onSendEmail
}: MailboxManagerProps) {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Form states
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  const myEmail = currentUser.email.toLowerCase();

  // Filter messages
  const receivedMails = simulatedEmails.filter(
    m => m.to.toLowerCase() === myEmail
  );
  
  const sentMails = simulatedEmails.filter(
    m => m.from.toLowerCase() === myEmail
  );

  const displayedMails = activeFolder === 'inbox' ? receivedMails : sentMails;
  const selectedMail = simulatedEmails.find(m => m.id === selectedMailId);

  // Auto-populated list of potential recipients
  const getRecipientsOption = () => {
    if (currentUser.role === 'student') {
      const parentInstructor = users.find(u => u.id === currentUser.assignedInstructorId);
      const options = [
        { email: 'admissions@learnora.edu', label: 'Admissions & Admin Desk (Anik Baidya)' }
      ];
      if (parentInstructor) {
        options.push({ email: parentInstructor.email, label: `My Mentor Advisor (${parentInstructor.name})` });
      }
      return options;
    } else {
      // Instructors and admins can email any student or other staff
      return users
        .filter(u => u.id !== currentUser.id)
        .map(u => ({
          email: u.email,
          label: `${u.name} (${u.role.toUpperCase()})`
        }));
    }
  };

  const recipients = getRecipientsOption();

  // Set default recipient on compose init
  const handleStartCompose = () => {
    setIsComposing(true);
    setSelectedMailId(null);
    setSendSuccess(false);
    if (recipients.length > 0) {
      setComposeTo(recipients[0].email);
    } else {
      setComposeTo('');
    }
    setComposeSubject('');
    setComposeBody('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) return;

    onSendEmail(composeTo, composeSubject, composeBody);
    
    setSendSuccess(true);
    setComposeSubject('');
    setComposeBody('');
    
    setTimeout(() => {
      setSendSuccess(false);
      setIsComposing(false);
      setActiveFolder('sent');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="bg-white dark:bg-[#070708] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="p-1 px-3 border border-blue-550/15 bg-blue-500/5 text-blue-500 rounded-full text-[10px] font-bold uppercase select-none tracking-widest leading-none">
            📥 Internal Message Dispatch
          </span>
          <h1 className="text-[28px] font-bold text-slate-900 dark:text-white mt-2 mb-1 tracking-tight">
            Secure Student Communications
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
            Send, receive, and browse secure simulated emails within our administrative network.
          </p>
        </div>

        <button
          onClick={handleStartCompose}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-xs font-semibold rounded-xl tracking-tight cursor-pointer shadow-md select-none"
        >
          <Plus className="w-4 h-4" />
          Compose Message
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left pane: Feed Folders & Correspondence list */}
        <div className="lg:col-span-5 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-sm min-h-[500px]">
          <div className="space-y-4">
            
            {/* Folder Toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-[#0A0A0B] rounded-2xl border dark:border-white/5">
              <button
                onClick={() => {
                  setActiveFolder('inbox');
                  setIsComposing(false);
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeFolder === 'inbox' && !isComposing
                    ? 'bg-white dark:bg-[#161618] text-amber-500 border dark:border-white/5 shadow-xs'
                    : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Inbox ({receivedMails.length})
              </button>
              <button
                onClick={() => {
                  setActiveFolder('sent');
                  setIsComposing(false);
                }}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeFolder === 'sent' && !isComposing
                    ? 'bg-white dark:bg-[#161618] text-amber-500 border dark:border-white/5 shadow-xs'
                    : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                <Send className="w-4 h-4" />
                Sent Messages ({sentMails.length})
              </button>
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              <p className="text-[10px] uppercase text-slate-400 dark:text-gray-500 tracking-wider font-bold">
                {activeFolder === 'inbox' ? 'Inbound Letters' : 'Outbound Despatches'}
              </p>

              {displayedMails.length === 0 ? (
                <div className="text-center py-16 text-slate-401 dark:text-gray-500 text-xs border border-dashed border-slate-150 dark:border-white/5 rounded-2xl bg-slate-50/20 dark:bg-transparent">
                  No matches in this folder repository.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {displayedMails.map(mail => (
                    <button
                      key={mail.id}
                      onClick={() => {
                        setSelectedMailId(mail.id);
                        setIsComposing(false);
                      }}
                      className={`w-full text-left py-3.5 px-3.5 rounded-2xl transition flex flex-col gap-1 cursor-pointer border ${
                        selectedMailId === mail.id
                          ? 'bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/20 text-amber-500'
                          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] text-amber-500 font-bold max-w-[70%] truncate">
                          {activeFolder === 'inbox' ? mail.from : `To: ${mail.to}`}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-snug truncate ${
                        selectedMailId === mail.id ? 'text-amber-500' : 'text-slate-900 dark:text-gray-200'
                      }`}>
                        {mail.subject}
                      </p>
                      <p className="text-[11px] text-slate-550 dark:text-gray-400 truncate mt-0.5">
                        {mail.body}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-4 text-[10px] text-slate-400 flex items-center gap-2 select-none">
            Email Dispatch: Online & Ready
          </div>
        </div>

        {/* Right pane: View or Compose Interface */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161618] border border-slate-150/80 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col min-h-[500px] justify-between h-full relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {isComposing ? (
              /* Compose view */
              <motion.div
                key="compose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                    <h3 className="text-base font-sans text-slate-900 dark:text-white font-bold">New Despatch Communication</h3>
                    <button
                      onClick={() => setIsComposing(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      Cancel Compose
                    </button>
                  </div>

                  {sendSuccess ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3.5">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-3 bg-semibold bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20"
                      >
                        <CheckCircle className="w-8 h-8" />
                      </motion.div>
                      <p className="text-sm font-bold text-slate-800 dark:text-gray-200 font-sans">Message Dispatched Successfully</p>
                      <p className="text-[11px] text-slate-400 text-center max-w-xs leading-relaxed">
                        Secure connection established. Recipient inbox model parsed and updated in local ledger database.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 dark:text-gray-500 block font-bold">Recipient Account</label>
                        {recipients.length === 0 ? (
                          <input
                            type="text"
                            required
                            placeholder="e.g. admissions@learnora.edu"
                            value={composeTo}
                            onChange={(e) => setComposeTo(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#0F0F11] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-slate-800 dark:text-gray-200"
                          />
                        ) : (
                          <select
                            value={composeTo}
                            onChange={(e) => setComposeTo(e.target.value)}
                            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#0F0F11] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-slate-800 dark:text-gray-200 font-sans font-bold cursor-pointer"
                          >
                            {recipients.map(r => (
                              <option key={r.email} value={r.email}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 dark:text-gray-500 block font-bold">Subject Line Header</label>
                        <input
                          type="text"
                          required
                          placeholder="Regarding upcoming mock tests, homework schedule, etc..."
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#0F0F11] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-slate-800 dark:text-gray-200 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400 dark:text-gray-500 block font-bold">Inbound Message Body Envelope</label>
                        <textarea
                          required
                          rows={8}
                          placeholder="Compose your message here..."
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-[#0F0F11] rounded-xl border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500/30 text-slate-800 dark:text-gray-200 resize-none font-sans leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-amber-950 font-bold rounded-xl text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Dispatch Communications Package
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            ) : selectedMail ? (
              /* Mail view */
              <motion.div
                key="read"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5 flex-1 flex flex-col justify-start"
              >
                <div>
                  <button
                    onClick={() => setSelectedMailId(null)}
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1 mb-4 font-bold cursor-pointer"
                  >
                    &larr; Back to Listings
                  </button>

                  <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-[#0F0F11] border border-slate-100 dark:border-white/5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                    
                    <div className="flex justify-between items-start border-b border-slate-150 dark:border-white/5 pb-2.5 text-xs gap-4">
                      <div className="space-y-0.5 truncate">
                        <p className="truncate"><span className="text-slate-402 dark:text-gray-500 text-[10px]">FROM:</span> <b className="text-amber-500">{selectedMail.from}</b></p>
                        <p className="truncate"><span className="text-slate-402 dark:text-gray-500 text-[10px]">TO:</span> <b className="text-slate-700 dark:text-gray-300">{selectedMail.to}</b></p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                        {new Date(selectedMail.timestamp).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{selectedMail.subject}</h4>
                  </div>

                  <div className="mt-5 p-5 bg-slate-50/50 dark:bg-[#0A0A0B]/30 rounded-2xl border border-slate-100 dark:border-white/5 text-xs leading-relaxed text-slate-800 dark:text-gray-300 font-sans whitespace-pre-wrap min-h-[220px]">
                    {selectedMail.body}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Welcome/Selection call action */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-center items-center py-16 text-center space-y-4"
              >
                <div className="p-4 bg-blue-500/5 rounded-full border border-blue-500/10">
                  <Mail className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-sans text-slate-900 dark:text-white font-bold">Select a Correspondence Package</h4>
                  <p className="text-[11.5px] text-slate-500 dark:text-gray-400 mt-1 max-w-sm leading-relaxed">
                    Click any communications item in the left folder pane list to open its details, or compose a new package.
                  </p>
                </div>
                <button
                  onClick={handleStartCompose}
                  className="px-4 py-1.5 border border-blue-500/30 hover:bg-blue-500/5 text-blue-500 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Create New Despatch Package
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
