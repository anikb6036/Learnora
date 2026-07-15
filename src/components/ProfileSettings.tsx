/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, AppNotification, VoiceNote } from '../types';
import { compressImage } from '../imageUtils';
import { COUNTRY_PHONE_CONFIGS } from '../countryPhoneData';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Shield, 
  Camera,
  BookOpen,
  X,
  LockKeyhole,
  UserCheck,
  Users,
  GraduationCap,
  Mic,
  MicOff,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Trash2,
  Play,
  Square,
  Search,
  FileText,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileSettingsProps {
  currentUser: UserAccount;
  instructors: UserAccount[];
  onUpdateProfile: (updatedUser: UserAccount) => void;
  onTriggerToast: (notif: AppNotification) => void;
  users?: UserAccount[];
  onSendEmail?: (to: string, subject: string, body: string, fromOverride?: string) => void;
}

export default function ProfileSettings({ 
  currentUser, 
  instructors,
  onUpdateProfile, 
  onTriggerToast,
  users,
  onSendEmail
}: ProfileSettingsProps) {
  // Active pill tab switcher
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'voiceNotes'>('profile');

  // Voice Notes States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState<'General' | 'Review' | 'Exam Prep' | 'Questions'>('General');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'All' | 'General' | 'Review' | 'Exam Prep' | 'Questions'>('All');
  
  // Inline editing states for saved voice notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTranscript, setEditingTranscript] = useState('');
  const [editingTag, setEditingTag] = useState<'General' | 'Review' | 'Exam Prep' | 'Questions'>('General');
  
  // Read aloud synthesis state
  const [isPlayingAloudId, setIsPlayingAloudId] = useState<string | null>(null);

  // Clipboard success tracker state
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Web Speech synthesis and recognition cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Flag for editing (only applicable for non-students)
  const isStudent = currentUser.role === 'student';
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // States
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState<UserAccount | null>(null);
  const [pendingPasswordUpdate, setPendingPasswordUpdate] = useState<UserAccount | null>(null);

  // Recovery email state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [gender, setGender] = useState(currentUser.gender || '');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [specialization, setSpecialization] = useState(currentUser.specialization || '');
  
  // Student guardian details
  const [fatherName, setFatherName] = useState(currentUser.fatherName || '');
  const [fatherPhone, setFatherPhone] = useState(currentUser.fatherPhone || '');
  const [lastQualification, setLastQualification] = useState(currentUser.lastQualification || '');
  
  const [fatherPhonePrefix, setFatherPhonePrefix] = useState(() => {
    if (currentUser.fatherPhone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.fatherPhone?.startsWith(cfg.code));
      return match ? match.code : '+91';
    }
    return '+91';
  });
  
  const [fatherPhoneRaw, setFatherPhoneRaw] = useState(() => {
    if (currentUser.fatherPhone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.fatherPhone?.startsWith(cfg.code));
      return match ? currentUser.fatherPhone.slice(match.code.length) : currentUser.fatherPhone;
    }
    return '';
  });

  const [phonePrefix, setPhonePrefix] = useState(() => {
    if (currentUser.phone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.phone?.startsWith(cfg.code));
      return match ? match.code : '+91';
    }
    return '+91';
  });
  
  const [phoneRaw, setPhoneRaw] = useState(() => {
    if (currentUser.phone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.phone?.startsWith(cfg.code));
      return match ? currentUser.phone.slice(match.code.length) : currentUser.phone;
    }
    return '';
  });

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password strength checker helper
  const checkPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Not entered', color: 'bg-slate-200 dark:bg-white/10' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score, text: 'Weak', color: 'bg-red-500' };
      case 2:
      case 3:
        return { score, text: 'Moderate', color: 'bg-amber-500' };
      case 4:
      case 5:
        return { score, text: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, text: 'Weak', color: 'bg-red-500' };
    }
  };

  const strength = checkPasswordStrength(newPassword);

  const activeVoiceNotes = currentUser.voiceNotes || [];

  const handleStartSpeechRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onTriggerToast({
        id: `err-${Date.now()}`,
        title: 'Browser Support Error',
        message: 'Your browser does not support Web Speech API recognition. Try Google Chrome.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'reminder',
        channel: 'push'
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        timerRef.current = setInterval(() => {
          setRecordingDuration(d => d + 1);
        }, 1000);
      };

      rec.onresult = (event: any) => {
        let finalText = '';
        for (let i = 0; i < event.results.length; i++) {
          finalText += event.results[i][0].transcript;
        }
        setTranscript(finalText);
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error || event);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      rec.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Speech initialization failed', e);
    }
  };

  const handleStopSpeechRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSaveVoiceNote = () => {
    if (!transcript.trim()) {
      onTriggerToast({
        id: `err-${Date.now()}`,
        title: 'No Transcript Captured',
        message: 'Cannot save an empty voice note. Please speak into your microphone.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'reminder',
        channel: 'push'
      });
      return;
    }

    const newNote: VoiceNote = {
      id: `vn-${Date.now()}`,
      title: noteTitle.trim() || `Voice Note #${activeVoiceNotes.length + 1}`,
      transcript: transcript.trim(),
      tag: selectedTag,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };

    const updatedNotes = [newNote, ...activeVoiceNotes];
    
    const updatedUser: UserAccount = {
      ...currentUser,
      voiceNotes: updatedNotes
    };

    onUpdateProfile(updatedUser);
    
    // Reset inputs
    setTranscript('');
    setNoteTitle('');
    setSelectedTag('General');
    
    onTriggerToast({
      id: `vn-saved-${Date.now()}`,
      title: 'Voice Note Saved',
      message: `"${newNote.title}" saved successfully to your student profile.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    });
  };

  const handleDeleteVoiceNote = (id: string) => {
    const updatedNotes = activeVoiceNotes.filter(n => n.id !== id);
    const updatedUser: UserAccount = {
      ...currentUser,
      voiceNotes: updatedNotes
    };
    onUpdateProfile(updatedUser);

    onTriggerToast({
      id: `vn-deleted-${Date.now()}`,
      title: 'Voice Note Deleted',
      message: 'The selected transcript has been discarded.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    });
  };

  const handleStartEditing = (note: VoiceNote) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
    setEditingTranscript(note.transcript);
    setEditingTag(note.tag || 'General');
  };

  const handleSaveEdit = () => {
    if (!editingNoteId) return;
    if (!editingTranscript.trim()) {
      onTriggerToast({
        id: `err-${Date.now()}`,
        title: 'Validation Error',
        message: 'Transcript text cannot be empty.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'reminder',
        channel: 'push'
      });
      return;
    }

    const updatedNotes = activeVoiceNotes.map(n => {
      if (n.id === editingNoteId) {
        return {
          ...n,
          title: editingTitle.trim() || n.title,
          transcript: editingTranscript.trim(),
          tag: editingTag
        };
      }
      return n;
    });

    const updatedUser: UserAccount = {
      ...currentUser,
      voiceNotes: updatedNotes
    };
    onUpdateProfile(updatedUser);

    setEditingNoteId(null);
    onTriggerToast({
      id: `vn-updated-${Date.now()}`,
      title: 'Note Updated',
      message: 'The transcription edits have been applied successfully.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'general',
      channel: 'push'
    });
  };

  const handleTogglePlayAloud = (note: VoiceNote) => {
    if (!('speechSynthesis' in window)) {
      onTriggerToast({
        id: `err-${Date.now()}`,
        title: 'TTS Unsupported',
        message: 'Speech synthesis is not supported on this browser.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'reminder',
        channel: 'push'
      });
      return;
    }

    if (isPlayingAloudId === note.id) {
      window.speechSynthesis.cancel();
      setIsPlayingAloudId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(note.transcript);
      utterance.onend = () => {
        setIsPlayingAloudId(null);
      };
      utterance.onerror = () => {
        setIsPlayingAloudId(null);
      };
      setIsPlayingAloudId(note.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyNote = (note: VoiceNote) => {
    navigator.clipboard.writeText(`${note.title}\nTag: ${note.tag || 'General'}\nDate: ${note.timestamp}\n\n${note.transcript}`)
      .then(() => {
        setCopiedNoteId(note.id);
        setTimeout(() => setCopiedNoteId(null), 2000);
      })
      .catch(err => {
        console.error('Clipboard copy failed', err);
      });
  };

  const handleDownloadNote = (note: VoiceNote) => {
    const element = document.createElement("a");
    const file = new Blob([`${note.title}\nTag: ${note.tag || 'General'}\nDate: ${note.timestamp}\n\n${note.transcript}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${note.title.toLowerCase().replace(/\s+/g, '_')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Name cannot be blank.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    const cleanedPhoneRaw = phoneRaw.replace(/\D/g, '');
    const finalPhone = cleanedPhoneRaw ? `${phonePrefix}${cleanedPhoneRaw}` : '';

    const cleanedFatherPhoneRaw = fatherPhoneRaw.replace(/\D/g, '');
    const finalFatherPhone = cleanedFatherPhoneRaw ? `${fatherPhonePrefix}${cleanedFatherPhoneRaw}` : '';

    const updatedUser: UserAccount = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      phone: finalPhone,
      gender,
      dob,
      address,
      avatarUrl,
      specialization: currentUser.role === 'instructor' ? specialization.trim() : currentUser.specialization,
      fatherName: currentUser.role === 'student' ? fatherName.trim() : currentUser.fatherName,
      fatherPhone: currentUser.role === 'student' ? finalFatherPhone : currentUser.fatherPhone,
      lastQualification: currentUser.role === 'student' ? lastQualification.trim() : currentUser.lastQualification,
    };

    setPendingProfileUpdate(updatedUser);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!oldPassword) {
      setPasswordError('Please input your current password.');
      return;
    }

    if (currentUser.password !== oldPassword) {
      setPasswordError('The current password provided is incorrect.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Confirm password does not match new password.');
      return;
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      password: newPassword
    };

    setPendingPasswordUpdate(updatedUser);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedUrl = await compressImage(file);
      setAvatarUrl(compressedUrl);
    } catch (err) {
      console.error(err);
      onTriggerToast({
        id: `notif-err-${Date.now()}`,
        title: 'Avatar Update Failed',
        message: 'Could not process the selected image.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'general',
        channel: 'push'
      });
    }
  };

  const selectedCountryConfig = COUNTRY_PHONE_CONFIGS.find(cfg => cfg.code === phonePrefix);
  const selectedFatherCountryConfig = COUNTRY_PHONE_CONFIGS.find(cfg => cfg.code === fatherPhonePrefix);

  const resetEditStates = () => {
    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setGender(currentUser.gender || '');
    setDob(currentUser.dob || '');
    setAddress(currentUser.address || '');
    setAvatarUrl(currentUser.avatarUrl || '');
    setSpecialization(currentUser.specialization || '');
    setFatherName(currentUser.fatherName || '');
    setLastQualification(currentUser.lastQualification || '');
    
    if (currentUser.phone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.phone?.startsWith(cfg.code));
      setPhonePrefix(match ? match.code : '+91');
      setPhoneRaw(match ? currentUser.phone.slice(match.code.length) : currentUser.phone);
    } else {
      setPhoneRaw('');
    }
    
    if (currentUser.fatherPhone) {
      const match = COUNTRY_PHONE_CONFIGS.find(cfg => currentUser.fatherPhone?.startsWith(cfg.code));
      setFatherPhonePrefix(match ? match.code : '+91');
      setFatherPhoneRaw(match ? currentUser.fatherPhone.slice(match.code.length) : currentUser.fatherPhone);
    } else {
      setFatherPhoneRaw('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Title Header matching Resend style */}
      <div className="mb-8">
        <h1 id="settings-heading" className="text-[28px] font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Manage your personal identifiers, contact profiles, and credential access keys.
        </p>
      </div>

      {/* Pill Switchers */}
      <div className="flex items-center justify-between mb-8 pb-1 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-1">
          <button 
            id="profile-tab-btn"
            onClick={() => {
              setActiveTab('profile');
              setProfileSuccess('');
              setProfileError('');
            }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition cursor-pointer select-none ${
              activeTab === 'profile' 
                ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Profile details
          </button>
          <button 
            id="security-tab-btn"
            onClick={() => {
              setActiveTab('security');
              setPasswordSuccess('');
              setPasswordError('');
            }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition cursor-pointer select-none ${
              activeTab === 'security' 
                ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Login & security
          </button>
          {isStudent && (
            <button 
              id="voice-notes-tab-btn"
              onClick={() => {
                setActiveTab('voiceNotes');
                setProfileSuccess('');
                setProfileError('');
              }}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition cursor-pointer select-none ${
                activeTab === 'voiceNotes' 
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Voice notes
            </button>
          )}
        </div>
        
        {/* Subtle role badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-350 border border-slate-200/50 dark:border-white/5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span className="uppercase tracking-wider font-semibold text-[10px]">{currentUser.role}</span>
        </span>
      </div>

      {/* Profile details tab content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[13px] flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Quick Header block */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#070708] shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group select-none">
                <img
                  id="profile-avatar-display"
                  src={avatarUrl || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  className="w-[72px] h-[72px] rounded-full object-cover border border-slate-200 dark:border-white/10"
                />
                {isEditing && (
                  <>
                    <input
                      type="file"
                      id="profile-avatar-input"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                    <label 
                      htmlFor="profile-avatar-input" 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-full text-white transition-opacity cursor-pointer"
                    >
                      <Camera className="w-[18px] h-[18px]" />
                    </label>
                  </>
                )}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                  {currentUser.name || 'User Profile'}
                </h2>
                <p className="text-xs text-slate-400">@{currentUser.username}</p>
                <p className="text-[11px] text-slate-400">Registered member since {currentUser.joinedDate ? new Date(currentUser.joinedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'n/a'}</p>
              </div>
            </div>

            {/* Editing Action Triggers */}
            <div>
              {!isEditing ? (
                <div className="flex flex-col sm:items-end gap-1.5">
                  <button
                    onClick={() => {
                      resetEditStates();
                      setIsEditing(true);
                      setProfileSuccess('');
                      setProfileError('');
                    }}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer select-none"
                  >
                    Edit profile
                  </button>
                  {isStudent && (
                    <span className="text-[10px] text-slate-400 block sm:text-right">Self-updating enabled</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      resetEditStates();
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1.5 bg-[#437bef] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                  >
                    Save changes
                  </button>
                </div>
              )}
            </div>

            {isStudent && !isEditing && (
              <div className="text-right hidden md:block">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 select-none">
                  <Lock className="w-3 h-3 text-slate-400" /> Partially managed account
                </span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">Course modifications must still be authorized by admin desks.</p>
              </div>
            )}
          </div>

          {/* Details Row layout like Resend table structure */}
          <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#070708]">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Account Information</h3>
            </div>

            {/* If viewed details */}
            {!isEditing ? (
              <div className="divide-y divide-slate-100 dark:divide-white/5 text-[13px]">
                
                {/* Full name */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Full name</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">{currentUser.name || 'Not provided'}</div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email address</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">{currentUser.email || 'Not provided'}</div>
                </div>

                {/* Phone */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Contact number</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">{currentUser.phone || 'Not provided'}</div>
                </div>

                {/* Gender */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>Gender</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200 capitalize">{currentUser.gender || 'Not provided'}</div>
                </div>

                {/* DOB */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Date of birth</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">
                    {currentUser.dob ? new Date(currentUser.dob).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not provided'}
                  </div>
                </div>

                {/* Postal Address */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                  <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5 flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Residency address</span>
                  </div>
                  <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200 truncate">{currentUser.address || 'Not provided'}</div>
                </div>

                {/* Role specific - specialization */}
                {currentUser.role === 'instructor' && (
                  <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                    <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>Academic specialization</span>
                    </div>
                    <div className="col-span-8 font-serif italic font-semibold text-blue-600 dark:text-blue-400">
                      {currentUser.specialization || 'General Academic Advisor'}
                    </div>
                  </div>
                )}

                {/* Role specific - student's advisor and guardian info */}
                {isStudent && (
                  <>
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Enrolled course</span>
                      </div>
                      <div className="col-span-8 font-semibold text-amber-600 dark:text-amber-400">
                        {currentUser.course || 'Not Enrolled'}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Assigned batch</span>
                      </div>
                      <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">
                        {currentUser.batch || 'Not Assigned'}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        <span>Last qualification</span>
                      </div>
                      <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">
                        {currentUser.lastQualification || 'Not provided'}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                        <LockKeyhole className="w-4 h-4 text-slate-400" />
                        <span>Assigned mentor</span>
                      </div>
                      <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">
                        {instructors.find(i => i.id === currentUser.assignedInstructorId)?.name || 'Unassigned Advisor'}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center">
                      <div className="col-span-4 text-slate-400 font-medium flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Father / Guardian name</span>
                      </div>
                      <div className="col-span-8 font-medium text-slate-700 dark:text-slate-200">{currentUser.fatherName || 'Not provided'}</div>
                    </div>
                  </>
                )}

              </div>
            ) : (
              /* Editable input rows with resend look inputs */
              <div className="p-6 space-y-5 text-[13px]">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  
                  {/* Name field */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Full Name</label>
                    <div className="col-span-8">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Email Address</label>
                    <div className="col-span-8">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Contact Number with selector */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Contact Number</label>
                    <div className="col-span-8 flex gap-2">
                      <select
                        value={phonePrefix}
                        onChange={e => setPhonePrefix(e.target.value)}
                        className="bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-2 py-2 text-[13px] text-slate-800 dark:text-white transition-all focus:outline-none select-none cursor-pointer"
                      >
                        {COUNTRY_PHONE_CONFIGS.map(cfg => (
                          <option key={`${cfg.name}-${cfg.code}`} value={cfg.code} className="text-slate-800 dark:text-black">
                            {cfg.flag} {cfg.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={selectedCountryConfig?.placeholder || '10-digit number'}
                        value={phoneRaw}
                        onChange={e => setPhoneRaw(e.target.value)}
                        className="flex-1 bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Gender Select */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Gender</label>
                    <div className="col-span-8">
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none select-none cursor-pointer"
                      >
                        <option value="" className="text-slate-800 dark:text-black">Choose...</option>
                        <option value="male" className="text-slate-800 dark:text-black">Male</option>
                        <option value="female" className="text-slate-800 dark:text-black">Female</option>
                        <option value="other" className="text-slate-800 dark:text-black">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* DOB field */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Date of Birth</label>
                    <div className="col-span-8">
                      <input
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none select-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Address field */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350 pt-1.5">Residency Address</label>
                    <div className="col-span-8">
                      <textarea
                        rows={2}
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Street details, state, postal code"
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Specialization field (for Instructors) */}
                  {currentUser.role === 'instructor' && (
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Specialization</label>
                      <div className="col-span-8">
                        <input
                          type="text"
                          value={specialization}
                          onChange={e => setSpecialization(e.target.value)}
                          placeholder="e.g. Higher Algebra, Creative Writing"
                          className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Student specific fields */}
                  {isStudent && (
                    <>
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Last Qualification</label>
                        <div className="col-span-8">
                          <input
                            type="text"
                            value={lastQualification}
                            onChange={e => setLastQualification(e.target.value)}
                            placeholder="e.g. High School Diploma, Bachelor Science"
                            className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4 items-center">
                        <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Father / Guardian Name</label>
                        <div className="col-span-8">
                          <input
                            type="text"
                            value={fatherName}
                            onChange={e => setFatherName(e.target.value)}
                            placeholder="Full name of guardian"
                            className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-white/20"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Save row */}
                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                    >
                      Process profile updates
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Security credentials settings tab content */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[13px] flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#070708]">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Credentials Configuration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Secure your authentication attributes.</p>
              </div>
              {!isEditingPassword ? (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                >
                  Change password
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingPassword(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditingPassword ? (
              <div className="p-5 text-[13px] divide-y divide-slate-150/80 dark:divide-white/5 space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 font-medium select-none">Auth status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                    Verified Secure
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="text-slate-400 font-medium select-none">Passkey code</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">••••••••••••</span>
                </div>
                
                <div className="pt-4 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.01]">
                  <p className="text-xs text-slate-400">Locked your key or forgot attributes?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail('');
                      setForgotSuccess('');
                      setForgotError('');
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold cursor-pointer select-none hover:underline"
                  >
                    Send password recovery email
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-[13px]">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  
                  {/* Current Password */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Current Password</label>
                    <div className="col-span-8 relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        required
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 pr-10 text-[13px] text-slate-800 dark:text-white transition focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350 pt-2">New password</label>
                    <div className="col-span-8 space-y-2">
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 pr-10 text-[13px] text-slate-800 dark:text-white transition focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Strength checker meter */}
                      {newPassword && (
                        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-150/80 dark:border-white/5 rounded-xl space-y-1.5 transition-all">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 block font-semibold text-slate-500 uppercase tracking-wider text-[9px] select-none">
                              Safety tier: <span className="font-bold text-slate-700 dark:text-slate-200">{strength.text}</span>
                            </span>
                            <span className="text-slate-400 text-[9px] select-none">{strength.score}/5 checkmarks</span>
                          </div>
                          
                          <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((idx) => (
                              <div 
                                key={idx} 
                                className={`h-full flex-1 transition-all ${
                                  idx <= strength.score ? strength.color : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400">Rule of thumb: use upper/lower blend, numbers and special keys.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <label className="col-span-4 font-semibold text-slate-700 dark:text-slate-350">Confirm password</label>
                    <div className="col-span-8 relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 pr-10 text-[13px] text-slate-800 dark:text-white transition focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password save actions */}
                  <div className="pt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPassword(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer select-none"
                    >
                      Process credentials change
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Notes settings tab content */}
      {activeTab === 'voiceNotes' && (
        <div className="space-y-6">
          <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#070708] space-y-6">
            
            {/* Header Description */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-500" /> Web Speech Voice Notes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record and transcribe your lectures, studies, and academic thoughts using the browser's native Web Speech API.
              </p>
            </div>

            {/* Recorder Section */}
            <div className="border border-slate-200 dark:border-white/5 rounded-2xl p-5 bg-slate-50/50 dark:bg-white/[0.01] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Note Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Note Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g., Physics Lecture Recap"
                    className="w-full bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Tag Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Category Tag
                  </label>
                  <div className="flex gap-2">
                    {(['General', 'Review', 'Exam Prep', 'Questions'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTag(t)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition cursor-pointer select-none border ${
                          selectedTag === t
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dictation Box */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    Live Transcript
                  </span>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 font-medium text-red-500 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Recording ({Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')})
                    </span>
                  )}
                </div>
                
                <textarea
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Click 'Start Recording' and begin speaking..."
                  className="w-full bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 leading-relaxed font-sans"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartSpeechRecording}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Mic className="w-4 h-4" /> Start Dictation
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopSpeechRecording}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 animate-pulse"
                    >
                      <MicOff className="w-4 h-4" /> Stop Dictation
                    </button>
                  )}

                  {transcript.trim() && (
                    <button
                      type="button"
                      onClick={() => setTranscript('')}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer font-medium"
                    >
                      Clear Draft
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveVoiceNote}
                  disabled={!transcript.trim()}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    transcript.trim()
                      ? 'bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-md'
                      : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Save Transcription
                </button>
              </div>
            </div>

            {/* Saved Notes Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
              
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Saved Transcripts ({activeVoiceNotes.length})
                </h4>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes..."
                      className="pl-8 pr-3 py-1.5 w-full sm:w-48 bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Tag Pill Filter */}
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(['All', 'General', 'Review', 'Exam Prep', 'Questions'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFilterTag(t)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer select-none border whitespace-nowrap ${
                          filterTag === t
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-slate-900 dark:border-white'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note Cards */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {activeVoiceNotes.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                    <Mic className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No voice notes saved yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Start dictating to create your first transcription note.</p>
                  </div>
                ) : (
                  (() => {
                    const filtered = activeVoiceNotes.filter((n) => {
                      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                           n.transcript.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesTag = filterTag === 'All' || n.tag === filterTag;
                      return matchesSearch && matchesTag;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                          <p className="text-xs text-slate-400">No notes match your search criteria.</p>
                        </div>
                      );
                    }

                    return filtered.map((note) => (
                      <div
                        key={note.id}
                        className="border border-slate-200 dark:border-white/5 rounded-2xl p-4 bg-slate-50/30 dark:bg-white/[0.005] hover:bg-slate-50/60 dark:hover:bg-white/[0.015] transition-all space-y-3"
                      >
                        {editingNoteId === note.id ? (
                          /* Inline Edit View */
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="w-full bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tag</label>
                                <select
                                  value={editingTag}
                                  onChange={(e) => setEditingTag(e.target.value as any)}
                                  className="w-full bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                                >
                                  {['General', 'Review', 'Exam Prep', 'Questions'].map(tg => (
                                    <option key={tg} value={tg}>{tg}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transcript</label>
                              <textarea
                                rows={3}
                                value={editingTranscript}
                                onChange={(e) => setEditingTranscript(e.target.value)}
                                className="w-full bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-xs text-slate-800 dark:text-white focus:outline-none leading-relaxed font-sans"
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition select-none"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-semibold cursor-pointer transition select-none"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Normal Display View */
                          <>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {note.title}
                                  </h5>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    note.tag === 'Exam Prep'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                      : note.tag === 'Review'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : note.tag === 'Questions'
                                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {note.tag || 'General'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  {note.timestamp}
                                </span>
                              </div>

                              {/* Transcription Action Row */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePlayAloud(note)}
                                  title="Read aloud"
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    isPlayingAloudId === note.id
                                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse'
                                      : 'border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {isPlayingAloudId === note.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyNote(note)}
                                  title="Copy text"
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    copiedNoteId === note.id
                                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                      : 'border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadNote(note)}
                                  title="Download txt file"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditing(note)}
                                  title="Edit note"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVoiceNote(note.id)}
                                  title="Delete note"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-500 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-white/40 dark:bg-white/[0.005] p-3 rounded-xl border border-slate-150 dark:border-white/5 whitespace-pre-wrap">
                              {note.transcript}
                            </p>
                          </>
                        )}
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" /> Retrieve Account Password
              </h3>
              <button 
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotEmail('');
                  setForgotSuccess('');
                  setForgotError('');
                }}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[13px]">
                  <p className="font-semibold block mb-1">Retrieval alert dispatched</p>
                  <p className="leading-relaxed font-sans">{forgotSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotEmail('');
                    setForgotSuccess('');
                    setForgotError('');
                  }}
                  className="w-full py-2 bg-slate-900 border hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition select-none cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotError('');
                  setForgotSuccess('');
                  const targetEmail = forgotEmail.trim().toLowerCase();
                  
                  const listToSearch = users || instructors || [];
                  const matchedUser = listToSearch.find(u => u.email?.toLowerCase() === targetEmail);
                  
                  if (matchedUser) {
                    const subject = `[SECURITY DISPATCH] Account credentials retrieval`;
                    const body = `Dear ${matchedUser.name || matchedUser.username},\n\nThis is a requested credential recovery lookup dispatched for your Learnora application profile.\n\nYour active system records are:\n\n-----------------------------\nUsername: ${matchedUser.username || 'n/a'}\nPassword: ${matchedUser.password || 'n/a'}\n-----------------------------\n\nKeep these details secure.\n\nWarm regards,\nLearnora Technical sandbox unit`;
                    
                    if (onSendEmail) {
                      onSendEmail(matchedUser.email, subject, body, 'anik.baidya@hotmail.com');
                    } else {
                      onTriggerToast({
                        id: `forgot-${Date.now()}`,
                        title: 'Recovery attributes dispatched',
                        message: `Account parameters exported for user @${matchedUser.username}.`,
                        timestamp: new Date().toISOString(),
                        read: false,
                        type: 'reminder',
                        channel: 'push'
                      });
                    }
                    
                    setForgotSuccess(`We have found username @${matchedUser.username} linked to this email address. A recovery email containing the user ID and password details has been sent to the simulated inbox.`);
                  } else {
                    setForgotError('We could not locate find any account referencing this registered email address.');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5 text-[13px]">
                  <label className="font-semibold text-slate-700 dark:text-slate-350">Registered email address</label>
                  <input
                    type="email"
                    required
                    placeholder="samantha_wilson@example.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 text-[13px] text-slate-800 dark:text-white transition focus:outline-none"
                  />
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[13px] flex gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition select-none flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" /> Dispatch Recovery Attributes
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Confirmation Profile Dialog */}
      <AnimatePresence>
        {pendingProfileUpdate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-2x font-sans"
            >
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Profile Synchronization
                </h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Are you ready to commit your updated directory properties? Changes synchronize immediately across active register databases.
              </p>

              <div className="flex justify-end gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPendingProfileUpdate(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProfile) {
                      onUpdateProfile(pendingProfileUpdate);
                      setProfileSuccess('Profile updated successfully.');
                      setIsEditing(false);

                      onTriggerToast({
                        id: `notif-prof-${Date.now()}`,
                        title: 'Profile Saved',
                        message: 'Custom personal coaching properties saved successfully.',
                        timestamp: new Date().toISOString(),
                        read: false,
                        type: 'general',
                        channel: 'push'
                      });
                    }
                    setPendingProfileUpdate(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                >
                  Synchronize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Password Dialog */}
      <AnimatePresence>
        {pendingPasswordUpdate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-sm bg-white dark:bg-[#070708] rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 shadow-2x font-sans"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Key Credentials Alignment
                </h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Are you ready to set up new security keys? You will need to type this password next time you establish a session.
              </p>

              <div className="flex justify-end gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPendingPasswordUpdate(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateProfile) {
                      onUpdateProfile(pendingPasswordUpdate);
                      setPasswordSuccess('Password saved securely.');
                      setIsEditingPassword(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');

                      onTriggerToast({
                        id: `notif-pass-${Date.now()}`,
                        title: 'Password Configuration Saved',
                        message: 'Security authorization credential updated.',
                        timestamp: new Date().toISOString(),
                        read: false,
                        type: 'general',
                        channel: 'push'
                      });
                    }
                    setPendingPasswordUpdate(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                >
                  Confirm password change
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
