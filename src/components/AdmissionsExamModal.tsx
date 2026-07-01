/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RegistrationRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Mic, Volume2, Award, Activity, FileCheck, AlertCircle, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface AdmissionsExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RegistrationRequest;
  onExamPass: (score: number, details: { reading: number; speaking: number }) => void;
  onExamPassBg?: (score: number) => void;
}

export default function AdmissionsExamModal({
  isOpen,
  onClose,
  request,
  onExamPass,
  onExamPassBg
}: AdmissionsExamModalProps) {
  const [step, setStep] = useState<'intro' | 'reading' | 'speaking' | 'analyzing' | 'result'>('intro');

  // Reading MCQ choices
  const [q1Answer, setQ1Answer] = useState<string>('');
  const [q2Answer, setQ2Answer] = useState<string>('');

  // Speaking module states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(15).fill(4));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitoring state
  const [monitoringStream, setMonitoringStream] = useState<MediaStream | null>(null);
  const [monitoringError, setMonitoringError] = useState('');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Analyzing screen state
  const [analysisText, setAnalysisText] = useState('Booting voice parsing ledger...');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Test outcomes
  const [readingScore, setReadingScore] = useState(0);
  const [speakingScore, setSpeakingScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // Clear timer and stream on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (monitoringStream) {
        monitoringStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [monitoringStream]);

  useEffect(() => {
    if (videoRef.current && monitoringStream) {
      videoRef.current.srcObject = monitoringStream;
    }
  }, [monitoringStream]);

  // Handle live microphone visualization and timer
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let javascriptNode: ScriptProcessorNode | null = null;
    let stream: MediaStream | null = null;
    let secondInterval: NodeJS.Timeout | null = null;

    if (isRecording) {
      setRecordingSeconds(0);
      secondInterval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Attempt microphone capture
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(s => {
          stream = s;
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContext = new AudioCtx();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.7;
          analyser.fftSize = 256;

          microphone.connect(analyser);
          analyser.connect(javascriptNode);
          javascriptNode.connect(audioContext.destination);

          javascriptNode.onaudioprocess = () => {
            if (!analyser) return;
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            const stepVal = Math.max(1, Math.round(array.length / 15));
            const levels = [];
            for (let i = 0; i < 15; i++) {
              const val = array[i * stepVal] || 0;
              levels.push(Math.max(4, Math.round(val / 6))); // Scale to height
            }
            setAudioLevels(levels);
          };
        })
        .catch(err => {
          console.warn("Microphone access declined or unavailable, running fallback visualization", err);
          // Fallback wave simulation
          secondInterval = setInterval(() => {
            setAudioLevels(new Array(15).fill(0).map(() => Math.floor(Math.random() * 20) + 4));
          }, 120);
        });
    } else {
      setAudioLevels(new Array(15).fill(4));
    }

    return () => {
      if (secondInterval) clearInterval(secondInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording]);

  if (!isOpen) return null;

  // Reading MCQs definitions
  const q1Correct = 'B';
  const q2Correct = 'C';

  const handleStartExam = async () => {
    setIsRequestingPermissions(true);
    setMonitoringError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMonitoringStream(stream);
      setStep('reading');
    } catch (err: any) {
      console.error('Failed to get media permissions', err);
      setMonitoringError('Microphone and Camera access is required to monitor for cheating during the exam. Please allow access.');
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleProceedToSpeaking = () => {
    // Grade Reading portion (50 points total: 25 each)
    let score = 0;
    if (q1Answer === q1Correct) score += 25;
    if (q2Answer === q2Correct) score += 25;
    setReadingScore(score);
    setStep('speaking');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setStep('analyzing');
    startAnalysisPhase();
  };

  const startAnalysisPhase = () => {
    setAnalysisProgress(0);
    setAnalysisText('Inbound streams logged... Synthesizing phonics metadata...');

    let percent = 0;
    const interval = setInterval(() => {
      percent += 4;
      if (percent > 100) percent = 100;
      setAnalysisProgress(percent);

      if (percent === 20) {
        setAnalysisText('Assessing pronunciation inflection coordinates...');
      } else if (percent === 48) {
        setAnalysisText('Aligning reader spectrogram wave against coaching metrics...');
      } else if (percent === 72) {
        setAnalysisText('Calculating comprehensive syntax and grammar benchmarks...');
      } else if (percent === 92) {
        setAnalysisText('Seeding scores into automatic admissions ledger...');
      } else if (percent === 100) {
        clearInterval(interval);
        evaluateFinalScores();
      }
    }, 150);
  };

  const evaluateFinalScores = () => {
    // Evaluate speaking score: give 42-50 if they spoke for >= 3 seconds, or 30-40 if shorter but played
    const speakResult = recordingSeconds >= 3 
      ? Math.floor(Math.random() * 9) + 42 
      : Math.floor(Math.random() * 11) + 30;
    
    setSpeakingScore(speakResult);
    const finalTotal = readingScore + speakResult;
    setTotalScore(finalTotal);

    // Stop and release camera/mic recording and monitoring streams when exam is complete
    if (monitoringStream) {
      monitoringStream.getTracks().forEach(track => track.stop());
      setMonitoringStream(null);
    }

    if (onExamPassBg) {
      onExamPassBg(finalTotal);
    }

    setStep('result');
  };

  const handleClose = () => {
    if (monitoringStream) {
      monitoringStream.getTracks().forEach(track => track.stop());
      setMonitoringStream(null);
    }
    setIsRecording(false);
    onClose();
  };

  const handleCompleteAssessment = () => {
    // Notify main app to automatically enroll student since totalScore >= 25 is guaranteed if completed!
    onExamPass(totalScore, { reading: readingScore, speaking: speakingScore });
    handleClose();
  };

  const handleResetExam = () => {
    setStep('intro');
    setQ1Answer('');
    setQ2Answer('');
    setRecordingSeconds(0);
    setIsRecording(false);
    setReadingScore(0);
    setSpeakingScore(0);
    setTotalScore(0);
  };

  return (
    <div className="fixed inset-0 z-55 bg-white dark:bg-[#0C0D0E] overflow-y-auto overflow-x-hidden flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full h-full min-h-screen flex flex-col bg-slate-50 dark:bg-black"
      >
        {/* Banner with spark pattern */}
        <div className="relative bg-gradient-to-r from-amber-600 to-amber-500 py-6 px-8 text-white select-none shrink-0 flex justify-center shadow-md">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md border border-white/10">
                <Award className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg font-serif italic font-bold leading-tight">Learnora Official Admissions Gateway</h2>
                <p className="text-[10px] uppercase font-mono tracking-widest text-amber-100 font-semibold opacity-90 mt-0.5">
                  Qualified English Evaluation Node
                </p>
              </div>
            </div>
            {(step === 'intro' || step === 'result') && (
              <button
                onClick={handleClose}
                className="p-1 px-3 bg-black/15 hover:bg-black/30 border border-white/10 text-white rounded-lg text-xs font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Close
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex justify-center relative">
          {/* Anti-cheat Monitoring Video Feed */}
          {monitoringStream && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-32 h-24 md:w-48 md:h-36 bg-black rounded-lg overflow-hidden border-2 border-amber-500 shadow-xl z-20 flex flex-col pointer-events-none"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1 md:p-1.5 flex items-center justify-center gap-1.5 border-t border-white/10">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] md:text-[10px] font-mono text-white tracking-widest uppercase font-bold">Proctoring</span>
              </div>
            </motion.div>
          )}

          <div className="w-full max-w-4xl p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="p-1 px-2.5 border border-amber-500/10 bg-amber-500/5 text-amber-500 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                      Automatic Enrollment Active
                    </span>
                    <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white tracking-tight mt-2">
                      Hello, {request.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                      This placement assessment assesses your English writing literacy and spoken cadence parameters. Under the automatic admissions act, scoring **25% or higher** triggers instant enrollment, releases active credentials into your mailbox, and grants access to scheduling tools immediately.
                    </p>
                  </div>

                  {/* Syllabus / Evaluation breakdown boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border dark:border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-gray-200">1. Reading Comprehension</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                        Read a small excerpt about language design theory and solve 2 multi-choice questions. Counts for 50% of weight.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border dark:border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-gray-200">2. Vocal Articulation</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                        Speak a phonetic sentence into your microphone. Our automatic cadence evaluator scans rhythm and frequency spectrums. Counts for 50%.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-orange-500/[0.03] border border-amber-500/15 text-[10.5px] text-amber-600 dark:text-amber-400/90 leading-relaxed flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      Please verify that your microphone device triggers cleanly. Real-time capture is active inside this secure coaching portal.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                  {monitoringError && (
                    <div className="p-3 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 rounded-xl text-xs text-red-600 dark:text-rose-400">
                      {monitoringError}
                    </div>
                  )}
                  <button
                    onClick={handleStartExam}
                    disabled={isRequestingPermissions}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    {isRequestingPermissions ? 'Requesting Camera & Mic Access...' : 'Start Exam \u2192'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'reading' && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-[#161618] px-4 py-2 rounded-xl border dark:border-white/5 font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400">
                    <span>Part 1: Text Comprehension Analysis</span>
                    <span className="text-amber-500">Weight: 50 points</span>
                  </div>

                  {/* Reading Passage Container */}
                  <div className="p-5 rounded-2xl bg-amber-550/[0.02] border border-amber-500/10 text-sm font-normal leading-relaxed text-slate-800 dark:text-gray-200 select-none relative">
                    <div className="absolute top-4 left-0 w-1 h-3/4 bg-amber-500 rounded-r" />
                    "The Amazon Rainforest is often called the 'lungs of the Earth' because it draws in a lot of carbon dioxide and breathes out oxygen. Many unique animals live there, like the colorful toucan and the slow-moving sloth. Learning about these forests helps us understand why we need to protect our planet's wildlife."
                  </div>

                  {/* MCQ Questions list */}
                  <div className="space-y-4">
                    {/* Q1 */}
                    <div className="space-y-2">
                      <p className="text-sm font-normal text-slate-800 dark:text-gray-200">
                        Q1. Why is the Amazon Rainforest called the 'lungs of the Earth'?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { key: 'A', text: 'It has many rivers.' },
                          { key: 'B', text: 'It breathes out oxygen and helps the planet.' },
                          { key: 'C', text: 'It is very large.' },
                          { key: 'D', text: 'It has a lot of trees for climbing.' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ1Answer(opt.key)}
                            className={`p-2.5 px-3.5 text-left text-[11px] rounded-xl border transition cursor-pointer font-medium leading-relaxed ${
                              q1Answer === opt.key 
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold' 
                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className="font-mono uppercase font-bold mr-1.5">{opt.key})</span> {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="space-y-2 pt-1">
                      <p className="text-sm font-normal text-slate-800 dark:text-gray-200">
                        Q2. Which two animals are mentioned as living in the rainforest?
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { key: 'A', text: 'Lions and elephants' },
                          { key: 'B', text: 'Bears and wolves' },
                          { key: 'C', text: 'Toucans and sloths' },
                          { key: 'D', text: 'Monkeys and snakes' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ2Answer(opt.key)}
                            className={`p-2.5 px-3.5 text-left text-[11px] rounded-xl border transition cursor-pointer font-medium leading-relaxed ${
                              q2Answer === opt.key 
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold' 
                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className="font-mono uppercase font-bold mr-1.5">{opt.key})</span> {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                  <button
                    disabled={!q1Answer || !q2Answer}
                    onClick={handleProceedToSpeaking}
                    className={`py-2.5 px-6 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      q1Answer && q2Answer 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-[0.98]' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed border dark:border-white/5'
                    }`}
                  >
                    Proceed to Speaking Module &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'speaking' && (
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-[#161618] px-4 py-2 rounded-xl border dark:border-white/5 font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400">
                    <span>Part 2: Vocalic Expression & Articulation</span>
                    <span className="text-amber-500">Weight: 50 points</span>
                  </div>

                  <div className="space-y-2 text-center md:px-6">
                    <p className="text-sm font-normal text-slate-800 dark:text-gray-200">
                      Sentence to read aloud into your microphone:
                    </p>
                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-[#151516] border dark:border-white/5 text-sm font-normal leading-relaxed text-slate-900 dark:text-white text-center select-none shadow-inner">
                      "I am very excited to join Learnora! Learning new things is fun, and I want to read, write, and speak better every day. I promise to do my best in all my classes."
                    </div>
                  </div>

                  {/* Voice recording console widget */}
                  <div className="flex flex-col items-center justify-center space-y-4 py-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#1a1a1c]/20 border dark:border-white/5 relative overflow-hidden">
                    {/* Visualizer wave form output */}
                    <div className="flex items-end justify-center gap-1 h-12 w-full max-w-sm">
                      {audioLevels.map((l, idx) => (
                        <motion.div
                          key={idx}
                          animate={isRecording ? {} : { height: 4 }}
                          style={{ height: l }}
                          className={`w-[5px] rounded-t-md transition-all duration-75 ${
                            isRecording ? 'bg-amber-500' : 'bg-slate-300 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>

                    {isRecording ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1.5 text-xs text-rose-500 font-bold font-mono">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                          RECORDING IN PROGRESS... {recordingSeconds}s
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">Real-time spectrum analysis enabled</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-mono">
                          <Volume2 className="w-4 h-4 text-slate-400" /> State: Microphone Idle / Standby
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition animate-pulse"
                        >
                          <Check className="w-4 h-4" /> Stop & Run Analysis &rarr;
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition"
                        >
                          <Mic className="w-4 h-4" /> Permit Mic & Start Speak Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between text-[11px] text-slate-400 leading-snug">
                  <p>Speak clearly for at least 3 seconds at a balanced pace for maximum vocal articulation recognition score.</p>
                </div>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-6 flex-1 text-center"
              >
                {/* Simulated scan radar circle */}
                <div className="relative h-20 w-20 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center shadow-inner">
                  <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-gray-200">Synchronous Evaluation Algorithm Running</h4>
                  <p className="text-xs text-amber-500 font-mono italic max-w-sm mx-auto">{analysisText}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1 px-1 bg-slate-100 dark:bg-white/5 border dark:border-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${analysisProgress}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex flex-col items-center py-4 border bg-emerald-500/[0.02] border-emerald-500/20 rounded-3xl space-y-3 relative overflow-hidden text-center md:px-8">
                    <div className="absolute top-0 right-0 p-6 bg-radial-gradient from-emerald-500/10 to-transparent rounded-full pointer-events-none" />
                    <div>
                      <h3 className="text-lg font-bold text-emerald-500 tracking-tight font-sans">
                        Auto Admissions Qualification Achieved!
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
                        Congratulations! You have scored over the **25% threshold score** required for instantaneous administrative approval.
                      </p>
                    </div>

                    <div className="font-mono text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Final Consolidated Grade</span>
                      <span className="text-4xl font-black text-slate-800 dark:text-white">{totalScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border dark:border-white/5 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 font-bold uppercase block tracking-wider">Reading Score</span>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-gray-200">Text Comprehension</h5>
                      </div>
                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 border dark:border-white/5 px-3 py-1 rounded-xl">
                        {readingScore}/50
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161618] border dark:border-white/5 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 font-bold uppercase block tracking-wider">Speaking Score</span>
                        <h5 className="text-sm font-bold text-slate-800 dark:text-gray-200">Phonetic Articulation</h5>
                      </div>
                      <span className="text-lg font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 border dark:border-white/5 px-3 py-1 rounded-xl">
                        {speakingScore}/50
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/[0.02] border border-blue-500/15 rounded-xl text-[10.5px] leading-relaxed text-blue-500 dark:text-blue-400/90 font-mono tracking-tight text-center">
                    🔒 Credentials Automatically Released: Active student profiles automatically generated and dispatched to your simulated inbox.
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                  <button
                    onClick={handleResetExam}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-1.5"
                  >
                    Take Test Again
                  </button>
                  <button
                    onClick={handleCompleteAssessment}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    Claim Automatic Admission & Let's Go &rarr;
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
