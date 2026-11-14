/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Video,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Users,
  Film,
  Search,
  RefreshCw,
  Shield,
  AlertTriangle,
  PowerOff,
  Link2,
  Calendar,
  Clock,
  LogOut,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClassSchedule } from '../types';
import GoogleSignInButton from './GoogleSignInButton';
import {
  clearMeetToken,
  createMeetSpace,
  endActiveConference,
  getMeetAccessToken,
  getMeetSpace,
  getMeetUser,
  initMeetAuth,
  listConferenceParticipants,
  listConferenceRecordings,
  listConferenceRecords,
  MeetAccessType,
  MeetConferenceRecord,
  MeetEntryPointAccess,
  MeetModeration,
  MeetParticipant,
  MeetRecording,
  MeetSpace,
  signInWithGoogleMeet,
  updateMeetSpaceSettings,
} from '../googleMeet';

interface GoogleMeetHubProps {
  schedules: ClassSchedule[];
  onAttachMeetToSchedule: (scheduleId: string, space: MeetSpace) => void;
  initialInspectTarget?: string | null;
  onClearInspectTarget?: () => void;
}

type MeetTab = 'create' | 'inspector' | 'records';

interface PendingConfirmation {
  type: 'update_settings' | 'end_conference';
  spaceName: string;
  meetingCode: string;
  summary: string;
  details: string[];
  nextConfig?: {
    accessType: MeetAccessType;
    entryPointAccess: MeetEntryPointAccess;
    moderation: MeetModeration;
  };
}

export default function GoogleMeetHub({
  schedules,
  onAttachMeetToSchedule,
  initialInspectTarget,
  onClearInspectTarget,
}: GoogleMeetHubProps) {
  const [needsAuth, setNeedsAuth] = useState<boolean>(() => !getMeetAccessToken());
  const [token, setToken] = useState<string | null>(() => getMeetAccessToken());
  const [googleUser, setGoogleUser] = useState<User | null>(() => getMeetUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<MeetTab>('create');

  // Create Space state
  const [createAccessType, setCreateAccessType] = useState<MeetAccessType>('OPEN');
  const [createEntryPoint, setCreateEntryPoint] = useState<MeetEntryPointAccess>('ALL');
  const [createModeration, setCreateModeration] = useState<MeetModeration>('OFF');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdSpace, setCreatedSpace] = useState<MeetSpace | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inspector state
  const [lookupInput, setLookupInput] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedSpace, setInspectedSpace] = useState<MeetSpace | null>(null);
  const [editAccessType, setEditAccessType] = useState<MeetAccessType>('OPEN');
  const [editEntryPoint, setEditEntryPoint] = useState<MeetEntryPointAccess>('ALL');
  const [editModeration, setEditModeration] = useState<MeetModeration>('OFF');
  const [isMutatingSpace, setIsMutatingSpace] = useState(false);

  // Confirmation modal state (MANDATORY for mutating/destructive Google Meet API operations)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);

  // Conference Records state
  const [recordsFilterSpace, setRecordsFilterSpace] = useState('');
  const [records, setRecords] = useState<MeetConferenceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [expandedRecordName, setExpandedRecordName] = useState<string | null>(null);
  const [participantsMap, setParticipantsMap] = useState<Record<string, MeetParticipant[]>>({});
  const [recordingsMap, setRecordingsMap] = useState<Record<string, MeetRecording[]>>({});
  const [loadingDetailsFor, setLoadingDetailsFor] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initMeetAuth(
      (user, activeToken) => {
        setGoogleUser(user);
        setToken(activeToken);
        setNeedsAuth(false);
      },
      () => {
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialInspectTarget) {
      setLookupInput(initialInspectTarget);
      setActiveSubTab('inspector');
      if (token) {
        void handleInspectSpace(initialInspectTarget);
      }
      onClearInspectTarget?.();
    }
  }, [initialInspectTarget, token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleMeet();
      setToken(result.accessToken);
      setGoogleUser(result.user);
      setNeedsAuth(false);
      if (lookupInput.trim() && activeSubTab === 'inspector') {
        void handleInspectSpace(lookupInput.trim(), result.accessToken);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to connect with Google Meet.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    await clearMeetToken(false);
    setToken(null);
    setNeedsAuth(true);
    setActionMessage(null);
  };

  const handleApiError = (err: any) => {
    if (err?.status === 401) {
      setToken(null);
      setNeedsAuth(true);
      setActionMessage({
        type: 'error',
        text: 'Your Google Meet session expired. Please sign in with Google again.',
      });
      return;
    }
    setActionMessage({
      type: 'error',
      text: err?.message || 'Google Meet API request failed.',
    });
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = token || getMeetAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsCreating(true);
    setActionMessage(null);
    try {
      const space = await createMeetSpace(activeToken, {
        accessType: createAccessType,
        entryPointAccess: createEntryPoint,
        moderation: createModeration,
      });
      setCreatedSpace(space);

      if (selectedScheduleId) {
        onAttachMeetToSchedule(selectedScheduleId, space);
        const matched = schedules.find(s => s.id === selectedScheduleId);
        setActionMessage({
          type: 'success',
          text: `Google Meet space (${space.meetingCode}) created and linked to "${matched?.title || 'selected class'}".`,
        });
      } else {
        setActionMessage({
          type: 'success',
          text: `Google Meet space created: ${space.meetingUri}`,
        });
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInspectSpace = async (target?: string, overrideToken?: string) => {
    const query = (target ?? lookupInput).trim();
    const activeToken = overrideToken || token || getMeetAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }
    if (!query) {
      setActionMessage({ type: 'error', text: 'Enter a Meet link, code (e.g. abc-defg-hij), or space name.' });
      return;
    }

    setIsInspecting(true);
    setActionMessage(null);
    try {
      const space = await getMeetSpace(activeToken, query);
      setInspectedSpace(space);
      setEditAccessType(space.config?.accessType || 'OPEN');
      setEditEntryPoint(space.config?.entryPointAccess || 'ALL');
      setEditModeration(space.config?.moderation || 'OFF');
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsInspecting(false);
    }
  };

  const requestUpdateSettings = () => {
    if (!inspectedSpace) return;
    setPendingConfirm({
      type: 'update_settings',
      spaceName: inspectedSpace.name,
      meetingCode: inspectedSpace.meetingCode,
      summary: `Update Google Meet space settings for ${inspectedSpace.meetingCode}?`,
      details: [
        `Access Type: ${editAccessType}`,
        `Entry Point Access: ${editEntryPoint}`,
        `Moderation Mode: ${editModeration}`,
      ],
      nextConfig: {
        accessType: editAccessType,
        entryPointAccess: editEntryPoint,
        moderation: editModeration,
      },
    });
  };

  const requestEndConference = () => {
    if (!inspectedSpace) return;
    setPendingConfirm({
      type: 'end_conference',
      spaceName: inspectedSpace.name,
      meetingCode: inspectedSpace.meetingCode,
      summary: `End active Google Meet conference in ${inspectedSpace.meetingCode}?`,
      details: [
        'All currently connected participants will be immediately removed from this live meeting.',
        'The meeting link remains reusable for future scheduled sessions.',
      ],
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const activeToken = token || getMeetAccessToken();
    if (!activeToken) {
      setPendingConfirm(null);
      setNeedsAuth(true);
      return;
    }

    setIsMutatingSpace(true);
    setActionMessage(null);
    try {
      if (pendingConfirm.type === 'update_settings' && pendingConfirm.nextConfig) {
        const updated = await updateMeetSpaceSettings(
          activeToken,
          pendingConfirm.spaceName,
          pendingConfirm.nextConfig
        );
        setInspectedSpace(updated);
        setActionMessage({
          type: 'success',
          text: `Settings updated for Google Meet space ${updated.meetingCode}.`,
        });
      } else if (pendingConfirm.type === 'end_conference') {
        await endActiveConference(activeToken, pendingConfirm.spaceName);
        const refreshed = await getMeetSpace(activeToken, pendingConfirm.spaceName);
        setInspectedSpace(refreshed);
        setActionMessage({
          type: 'success',
          text: `Active conference ended for ${pendingConfirm.meetingCode}.`,
        });
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsMutatingSpace(false);
      setPendingConfirm(null);
    }
  };

  const handleLoadRecords = async () => {
    const activeToken = token || getMeetAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingRecords(true);
    setActionMessage(null);
    try {
      const list = await listConferenceRecords(activeToken, recordsFilterSpace.trim() || undefined);
      setRecords(list);
      if (list.length === 0) {
        setActionMessage({
          type: 'success',
          text: 'No conference records found for this account or filter.',
        });
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleToggleRecordDetails = async (recordName: string) => {
    if (expandedRecordName === recordName) {
      setExpandedRecordName(null);
      return;
    }
    setExpandedRecordName(recordName);

    const activeToken = token || getMeetAccessToken();
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    if (participantsMap[recordName] && recordingsMap[recordName]) {
      return;
    }

    setLoadingDetailsFor(recordName);
    try {
      const [participants, recordings] = await Promise.all([
        listConferenceParticipants(activeToken, recordName),
        listConferenceRecordings(activeToken, recordName),
      ]);
      setParticipantsMap(prev => ({ ...prev, [recordName]: participants }));
      setRecordingsMap(prev => ({ ...prev, [recordName]: recordings }));
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingDetailsFor(null);
    }
  };

  const upcomingSchedules = schedules.filter(s => s.status === 'scheduled');
  const meetLinkedSchedules = schedules.filter(
    s => s.meetingType === 'google_meet' || (s.meetingLink || '').toLowerCase().includes('meet.google.com')
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Google Meet Workspace
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Create live Google Meet rooms for classes, configure host moderation & access controls, and review conference attendance records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!needsAuth && token ? (
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2">
              {googleUser?.photoURL ? (
                <img src={googleUser.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                  {googleUser?.displayName || 'Google Connected'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                  {googleUser?.email || 'Meet API Active'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                title="Disconnect Google Meet session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
          )}
        </div>
      </div>

      {/* Auth Gate Banner if not connected */}
      {needsAuth && (
        <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Shield className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Connect your Google account for Google Meet
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Sign in with Google to generate real Google Meet spaces for scheduled lectures, manage room access settings, and inspect participant conference records.
            </p>
          </div>
          {authError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {authError}
            </div>
          )}
          <div className="pt-1 flex justify-center">
            <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
          </div>
        </div>
      )}

      {/* Action feedback toast/banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {actionMessage.text}
          </span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Tabs */}
      {!needsAuth && (
        <>
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#070708] p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setActiveSubTab('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'create'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Create & Link Spaces
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('inspector')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'inspector'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" /> Space Inspector & Settings
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('records');
                if (records.length === 0) {
                  void handleLoadRecords();
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'records'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Conference Records
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeSubTab === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Create Meet Space Card */}
                <form
                  onSubmit={handleCreateSpace}
                  className="lg:col-span-5 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4 h-fit"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-500" /> Generate New Google Meet Space
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      Creates a persistent Google Meet room via Meet API v2 and optionally attaches it to a scheduled class.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                      Access Type
                    </label>
                    <select
                      value={createAccessType}
                      onChange={e => setCreateAccessType(e.target.value as MeetAccessType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="OPEN">Open — Anyone with the Meet link can join</option>
                      <option value="TRUSTED">Trusted — Organization & invited guests without knocking</option>
                      <option value="RESTRICTED">Restricted — Knock required for uninvited guests</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                        Entry Points
                      </label>
                      <select
                        value={createEntryPoint}
                        onChange={e => setCreateEntryPoint(e.target.value as MeetEntryPointAccess)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="ALL">All Entry Points</option>
                        <option value="CREATOR_APP_ONLY">Creator App Only</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                        Host Moderation
                      </label>
                      <select
                        value={createModeration}
                        onChange={e => setCreateModeration(e.target.value as MeetModeration)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="OFF">Off (Standard)</option>
                        <option value="ON">On (Host controls enabled)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                      Attach to Scheduled Class (Optional)
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={e => setSelectedScheduleId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">Standalone Meet Room (Do not link yet)</option>
                      {upcomingSchedules.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.date} {s.time})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isCreating ? 'Creating Google Meet Space...' : 'Create Google Meet Space'}
                  </button>

                  {createdSpace && (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          Ready to Join
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {createdSpace.name}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
                        {createdSpace.meetingUri}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={createdSpace.meetingUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Meet
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText(createdSpace.meetingUri, 'created-uri')}
                          className="px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedId === 'created-uri' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === 'created-uri' ? 'Copied' : 'Copy Link'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLookupInput(createdSpace.name);
                            setActiveSubTab('inspector');
                            void handleInspectSpace(createdSpace.name);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" /> Settings
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Scheduled Classes Using Google Meet */}
                <div className="lg:col-span-7 bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-blue-500" /> Classes Linked with Google Meet
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        Scheduled sessions configured with a Google Meet room link
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-zinc-300">
                      {meetLinkedSchedules.length} {meetLinkedSchedules.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                  </div>

                  {meetLinkedSchedules.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                        No classes are linked to Google Meet yet.
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        Use the form on the left to generate a Meet space and attach it to a scheduled class, or pick Google Meet when scheduling a lecture.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {meetLinkedSchedules.map(cl => {
                        const uri = cl.meetingLink || '';
                        const inspectTarget = cl.meetSpaceName || cl.meetCode || uri;
                        return (
                          <div
                            key={cl.id}
                            className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {cl.title}
                                </span>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  {cl.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {cl.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {cl.time} ({cl.duration}m)
                                </span>
                              </div>
                              {uri && (
                                <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate">
                                  {uri}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              {uri && (
                                <a
                                  href={uri.startsWith('http') ? uri : `https://${uri}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Join
                                </a>
                              )}
                              {uri && (
                                <button
                                  type="button"
                                  onClick={() => copyText(uri, cl.id)}
                                  className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedId === cl.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                              {inspectTarget && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLookupInput(inspectTarget);
                                    setActiveSubTab('inspector');
                                    void handleInspectSpace(inspectTarget);
                                  }}
                                  className="px-2.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-200 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Settings className="w-3 h-3" /> Inspect
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeSubTab === 'inspector' && (
              <motion.div
                key="inspector"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lookupInput}
                      onChange={e => setLookupInput(e.target.value)}
                      placeholder="Paste Meet URL (https://meet.google.com/abc-defg-hij), code, or spaces/..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleInspectSpace()}
                    disabled={isInspecting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                    {isInspecting ? 'Fetching...' : 'Load Space'}
                  </button>
                </div>

                {inspectedSpace ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            Meeting Code
                          </span>
                          <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                            {inspectedSpace.meetingCode}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            inspectedSpace.activeConference
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-zinc-300'
                          }`}
                        >
                          {inspectedSpace.activeConference ? 'Live Conference Active' : 'Idle Space'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-slate-500 dark:text-zinc-400">
                          Resource: <span className="font-mono text-slate-800 dark:text-zinc-200">{inspectedSpace.name}</span>
                        </p>
                        <p className="text-slate-500 dark:text-zinc-400 break-all">
                          Join URI: <span className="font-mono text-blue-600 dark:text-blue-400">{inspectedSpace.meetingUri}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <a
                          href={inspectedSpace.meetingUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Google Meet
                        </a>
                        <button
                          type="button"
                          onClick={requestEndConference}
                          disabled={isMutatingSpace || !inspectedSpace.activeConference}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title={inspectedSpace.activeConference ? 'End active conference for all participants' : 'No active conference right now'}
                        >
                          <PowerOff className="w-3.5 h-3.5" /> End Active Conference
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-4 h-4 text-amber-500" /> Space Configuration
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                            Access Type
                          </label>
                          <select
                            value={editAccessType}
                            onChange={e => setEditAccessType(e.target.value as MeetAccessType)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="TRUSTED">TRUSTED</option>
                            <option value="RESTRICTED">RESTRICTED</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                            Entry Point Access
                          </label>
                          <select
                            value={editEntryPoint}
                            onChange={e => setEditEntryPoint(e.target.value as MeetEntryPointAccess)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                          >
                            <option value="ALL">ALL</option>
                            <option value="CREATOR_APP_ONLY">CREATOR_APP_ONLY</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 dark:text-zinc-300 block">
                            Moderation
                          </label>
                          <select
                            value={editModeration}
                            onChange={e => setEditModeration(e.target.value as MeetModeration)}
                            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white"
                          >
                            <option value="OFF">OFF</option>
                            <option value="ON">ON</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={requestUpdateSettings}
                          disabled={isMutatingSpace}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
                        >
                          Save Space Settings
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-zinc-400">
                    Enter a Google Meet URL, meeting code, or space resource name above to inspect live status and edit space settings.
                  </div>
                )}
              </motion.div>
            )}

            {activeSubTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recordsFilterSpace}
                      onChange={e => setRecordsFilterSpace(e.target.value)}
                      placeholder="Optional filter by Meet URL, code, or spaces/..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#0A0A0B] text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLoadRecords()}
                    disabled={isLoadingRecords}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
                    {isLoadingRecords ? 'Loading...' : 'Refresh Records'}
                  </button>
                </div>

                {records.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-zinc-400">
                    No conference records loaded yet. Click <strong>Refresh Records</strong> to list recent Google Meet sessions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map(rec => {
                      const isExpanded = expandedRecordName === rec.name;
                      const participants = participantsMap[rec.name] || [];
                      const recordings = recordingsMap[rec.name] || [];

                      return (
                        <div
                          key={rec.name}
                          className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => void handleToggleRecordDetails(rec.name)}
                            className="w-full p-4 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left cursor-pointer"
                          >
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                                {rec.space || rec.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                Started: {rec.startTime ? new Date(rec.startTime).toLocaleString() : 'Unknown'}
                                {rec.endTime ? ` • Ended: ${new Date(rec.endTime).toLocaleString()}` : ' • Active'}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              {isExpanded ? 'Hide Details' : 'View Participants & Recordings'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200/80 dark:border-white/10 space-y-4">
                              {loadingDetailsFor === rec.name ? (
                                <p className="text-xs text-slate-500">Loading participants and recordings...</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-blue-500" /> Participants ({participants.length})
                                    </h5>
                                    {participants.length === 0 ? (
                                      <p className="text-[11px] text-slate-400">No participant records returned.</p>
                                    ) : (
                                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {participants.map(p => {
                                          const name =
                                            p.signedinUser?.displayName ||
                                            p.anonymousUser?.displayName ||
                                            p.phoneUser?.displayName ||
                                            'Participant';
                                          return (
                                            <div
                                              key={p.name}
                                              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]"
                                            >
                                              <span className="font-semibold text-slate-800 dark:text-zinc-200">{name}</span>
                                              <span className="text-slate-400 font-mono">
                                                {p.earliestStartTime ? new Date(p.earliestStartTime).toLocaleTimeString() : ''}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                                      <Film className="w-3.5 h-3.5 text-emerald-500" /> Recordings ({recordings.length})
                                    </h5>
                                    {recordings.length === 0 ? (
                                      <p className="text-[11px] text-slate-400">No recordings available for this conference.</p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {recordings.map(r => (
                                          <div
                                            key={r.name}
                                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]"
                                          >
                                            <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                              {r.state || 'RECORDED'}
                                            </span>
                                            {r.driveDestination?.exportUri && (
                                              <a
                                                href={r.driveDestination.exportUri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline"
                                              >
                                                <ExternalLink className="w-3 h-3" /> Open Drive Recording
                                              </a>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Mandatory Confirmation Dialog for Mutating / Destructive Operations */}
      <AnimatePresence>
        {pendingConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 ${pendingConfirm.type === 'end_conference' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Confirm Google Meet Action
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {pendingConfirm.summary}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 rounded-2xl p-3.5 text-[11px] text-slate-600 dark:text-zinc-300">
                {pendingConfirm.details.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  disabled={isMutatingSpace}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void executeConfirmedAction()}
                  disabled={isMutatingSpace}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-60 ${
                    pendingConfirm.type === 'end_conference'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isMutatingSpace
                    ? 'Applying...'
                    : pendingConfirm.type === 'end_conference'
                    ? 'Confirm End Conference'
                    : 'Confirm Update'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
