/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, AppNotification, VoiceNote } from '../types';
import { 
  Mic, 
  MicOff, 
  Copy, 
  Download, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Search, 
  FileText, 
  Edit,
  Check,
  AlertCircle
} from 'lucide-react';

interface VoiceNotesProps {
  currentUser: UserAccount;
  onUpdateProfile: (updatedUser: UserAccount) => void;
  onTriggerToast: (notif: AppNotification) => void;
}

export default function VoiceNotes({
  currentUser,
  onUpdateProfile,
  onTriggerToast
}: VoiceNotesProps) {
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
      message: 'Transcription changes saved successfully.',
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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Visual Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Mic className="w-6 h-6 text-amber-500 animate-pulse" /> Voice Notes & Transcriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture lectures, spoken reviews, study thoughts, and sync voice transcripts directly.
          </p>
        </div>
      </div>

      <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-[#070708] space-y-6 shadow-sm">
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
  );
}
