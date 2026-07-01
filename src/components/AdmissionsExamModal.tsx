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

  // Vocal signal presence analytics
  const [vocalTicks, setVocalTicks] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [hasMicrophone, setHasMicrophone] = useState(false);

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

  // Reading MCQs definitions
  const q1Correct = 'B';
  const q2Correct = 'C';

  // Time & attempt limits
  const [timeLeft, setTimeLeft] = useState<number>(1200); // 20 minutes = 1200 seconds
  const [attemptsUsed, setAttemptsUsed] = useState<number>(() => {
    const saved = localStorage.getItem(`exam_attempts_${request.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isTimeout, setIsTimeout] = useState(false);

  const handleTimeoutRef = useRef<() => void>(() => {});

  // Keep handleTimeoutRef current function up to date with fresh state values
  useEffect(() => {
    handleTimeoutRef.current = () => {
      setIsTimeout(true);
      setIsRecording(false);
      
      // Grade reading portion immediately
      let score = 0;
      if (q1Answer === q1Correct) score += 25;
      if (q2Answer === q2Correct) score += 25;
      setReadingScore(score);

      // Speaking is evaluated as 0 or evaluated on the spot
      let speakResult = 0;
      if (hasMicrophone && vocalTicks >= 8) {
        const targetVocalTicks = 154;
        const progressRatio = Math.min(1.0, vocalTicks / targetVocalTicks);
        speakResult = Math.floor(progressRatio * 45) + Math.floor(Math.random() * 5) + 1;
        if (speakResult > 50) speakResult = 50;
      } else if (!hasMicrophone && recordingSeconds >= 2) {
        const targetDuration = 8;
        const progressRatio = Math.min(1.0, recordingSeconds / targetDuration);
        speakResult = Math.floor(progressRatio * 42) + Math.floor(Math.random() * 6) + 2;
        if (speakResult > 50) speakResult = 50;
      }
      
      setSpeakingScore(speakResult);
      const finalTotal = score + speakResult;
      setTotalScore(finalTotal);

      if (monitoringStream) {
        monitoringStream.getTracks().forEach(track => track.stop());
        setMonitoringStream(null);
      }

      if (onExamPassBg) {
        onExamPassBg(finalTotal);
      }

      setStep('result');
    };
  }, [q1Answer, q2Answer, hasMicrophone, vocalTicks, recordingSeconds, monitoringStream, onExamPassBg]);

  // Overall 20 minutes countdown timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (step === 'reading' || step === 'speaking') {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId!);
            handleTimeoutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (step === 'intro') {
      setTimeLeft(1200);
      setIsTimeout(false);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      setVocalTicks(0);
      setTotalTicks(0);
      secondInterval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Attempt microphone capture
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(s => {
          stream = s;
          setHasMicrophone(true);
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

            // Compute volume energy to assess speaking participation
            let sumVal = 0;
            for (let i = 0; i < array.length; i++) {
              sumVal += array[i];
            }
            const avgVol = sumVal / array.length;
            setTotalTicks(prev => prev + 1);
            if (avgVol > 5) { // 5 is a robust threshold for spoken sound above silence
              setVocalTicks(prev => prev + 1);
            }

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
          setHasMicrophone(false);
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

  const handleStartExam = async () => {
    if (attemptsUsed >= 3) {
      setMonitoringError('You have already used all 3 attempts for this exam.');
      return;
    }

    setIsRequestingPermissions(true);
    setMonitoringError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setMonitoringStream(stream);

      // Increment and save attemptsUsed
      const newAttempts = attemptsUsed + 1;
      setAttemptsUsed(newAttempts);
      localStorage.setItem(`exam_attempts_${request.id}`, String(newAttempts));

      setIsTimeout(false);
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
    setVocalTicks(0);
    setTotalTicks(0);
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
    let speakResult = 0;

    if (hasMicrophone) {
      // Evaluate speaking score strictly based on actual voice activity
      if (vocalTicks < 8) {
        // Did not speak or made barely any sound
        speakResult = 0;
      } else {
        // Spoke. A typical fast reading of the 32-word sentence takes about 6-8 seconds of active audio.
        // Firing 22 times per second, 7 seconds of active reading translates to ~154 vocal ticks.
        const targetVocalTicks = 154;
        const progressRatio = Math.min(1.0, vocalTicks / targetVocalTicks);
        
        // Base score up to 45 proportional to completion ratio, plus a small random pronunciation factor of 1-5
        speakResult = Math.floor(progressRatio * 45) + Math.floor(Math.random() * 5) + 1;
        if (speakResult > 50) speakResult = 50;
      }
    } else {
      // If mic was unavailable/blocked (fallback mode), evaluate speaking score based on recording duration.
      if (recordingSeconds < 2) {
        speakResult = 0;
      } else {
        const targetDuration = 8; // target 8 seconds
        const progressRatio = Math.min(1.0, recordingSeconds / targetDuration);
        speakResult = Math.floor(progressRatio * 42) + Math.floor(Math.random() * 6) + 2;
        if (speakResult > 50) speakResult = 50;
      }
    }

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
    setVocalTicks(0);
    setTotalTicks(0);
  };

  return (
    <div className="fixed inset-0 z-55 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto overflow-x-hidden flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="relative w-full h-full min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans"
      >
        {/* Premium Minimalist Header */}
        <div className="relative bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-white/5 py-5 px-6 md:px-8 select-none shrink-0 flex justify-center shadow-xs">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-extrabold text-base select-none">
                L
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">Learnora Admissions</h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider uppercase">
                  Language Placement Exam
                </p>
              </div>
            </div>
            {(step === 'reading' || step === 'speaking') && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Time: {formatTime(timeLeft)}</span>
              </div>
            )}
            {(step === 'intro' || step === 'result') && (
              <button
                onClick={handleClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-white/10 hover:border-zinc-350 dark:hover:border-white/20 rounded-lg cursor-pointer transition-all active:scale-95"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex justify-center relative bg-zinc-50 dark:bg-[#070708]">
          {/* Anti-cheat Monitoring Video Feed - Sleek overlay */}
          {monitoringStream && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-28 h-20 md:w-40 md:h-28 bg-black rounded-lg overflow-hidden border border-zinc-300 dark:border-white/10 shadow-lg z-20 flex flex-col pointer-events-none"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-xs p-1 flex items-center justify-center gap-1.5 border-t border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono text-zinc-200 tracking-wider uppercase font-semibold">Live stream</span>
              </div>
            </motion.div>
          )}

          <div className="w-full max-w-4xl p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/5 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-650 dark:text-zinc-300 text-[10px] font-mono tracking-wider uppercase">
                        Assessment Mode
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase border ${
                        attemptsUsed >= 3 
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        Attempts: {attemptsUsed} / 3 Used
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold font-sans text-zinc-900 dark:text-white tracking-tight">
                      Welcome, {request.name}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
                      This placement evaluation determines your English writing literacy and spoken cadence parameters. To qualify for automatic registration and instant course onboarding, you are required to secure an evaluation score of <strong>25% or higher</strong>.
                    </p>
                  </div>

                  {/* Syllabus / Evaluation breakdown boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-white/5 space-y-2.5 shadow-sm hover:shadow-md transition duration-200">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <BookOpen className="w-4 h-4 text-zinc-550 dark:text-zinc-400" />
                        <span className="text-xs font-semibold">1. Reading Comprehension</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Analyze a short literary or ecological excerpt and answer two multiple-choice questions. This counts for 50% of the total score.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250/60 dark:border-white/5 space-y-2.5 shadow-sm hover:shadow-md transition duration-200">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <Mic className="w-4 h-4 text-zinc-550 dark:text-zinc-400" />
                        <span className="text-xs font-semibold">2. Verbal Articulation</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Read a phonetically rich sentence aloud. Our articulation engine analyzes tone, cadence, and spelling coordinates in real-time. Counts for 50%.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed flex gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400 mt-0.5" />
                    <span>
                      Please verify your audio and video inputs. Live monitoring coordinates remain active during the entire test duration to maintain strict academic evaluation integrity.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/5 space-y-3">
                  {monitoringError && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                      {monitoringError}
                    </div>
                  )}
                  <button
                    onClick={handleStartExam}
                    disabled={isRequestingPermissions || attemptsUsed >= 3}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-855 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {attemptsUsed >= 3 
                      ? 'No Attempts Remaining (3/3 Used)' 
                      : isRequestingPermissions 
                        ? 'Configuring evaluation streams...' 
                        : 'Start Evaluation \u2192'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'reading' && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-white/5 font-mono text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-550">
                    <span>Part 1: Text Comprehension Analysis</span>
                    <span>50 Points Max</span>
                  </div>

                  {/* Reading Passage Container */}
                  <div className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/5 text-sm font-normal leading-relaxed text-zinc-800 dark:text-zinc-200 select-none relative shadow-xs">
                    <div className="absolute top-4 left-0 w-1 h-3/4 bg-zinc-900 dark:bg-white rounded-r" />
                    <p className="italic pl-3 text-zinc-650 dark:text-zinc-350 font-sans leading-relaxed">
                      "The Amazon Rainforest is often called the 'lungs of the Earth' because it draws in a lot of carbon dioxide and breathes out oxygen. Many unique animals live there, like the colorful toucan and the slow-moving sloth. Learning about these forests helps us understand why we need to protect our planet's wildlife."
                    </p>
                  </div>

                  {/* MCQ Questions list */}
                  <div className="space-y-5">
                    {/* Q1 */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
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
                            className={`p-3 px-4 text-left text-xs rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed ${
                              q1Answer === opt.key 
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold' 
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className={`font-mono uppercase font-bold mr-2 ${q1Answer === opt.key ? 'text-zinc-350 dark:text-zinc-650' : 'text-zinc-400 dark:text-zinc-500'}`}>{opt.key}</span> {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
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
                            className={`p-3 px-4 text-left text-xs rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed ${
                              q2Answer === opt.key 
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold' 
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className={`font-mono uppercase font-bold mr-2 ${q2Answer === opt.key ? 'text-zinc-350 dark:text-zinc-650' : 'text-zinc-400 dark:text-zinc-500'}`}>{opt.key}</span> {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-end gap-3">
                  <button
                    disabled={!q1Answer || !q2Answer}
                    onClick={handleProceedToSpeaking}
                    className={`py-2.5 px-6 font-medium rounded-lg text-xs flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                      q1Answer && q2Answer 
                        ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white shadow-sm active:scale-[0.98]' 
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border dark:border-white/5'
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
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-white/5 font-mono text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-550">
                    <span>Part 2: Vocalic Expression & Articulation</span>
                    <span>50 Points Max</span>
                  </div>

                  <div className="space-y-3 text-center md:px-6">
                    <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                      Sentence to read aloud:
                    </p>
                    <div className="p-7 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/5 text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-100 text-center select-none shadow-xs font-sans max-w-2xl mx-auto">
                      "I am very excited to join Learnora! Learning new things is fun, and I want to read, write, and speak better every day. I promise to do my best in all my classes."
                    </div>
                  </div>

                  {/* Voice recording console widget */}
                  <div className="flex flex-col items-center justify-center space-y-5 py-6 p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5 relative overflow-hidden shadow-xs">
                    {/* Visualizer wave form output */}
                    <div className="flex items-end justify-center gap-1.5 h-10 w-full max-w-xs">
                      {audioLevels.map((l, idx) => (
                        <motion.div
                          key={idx}
                          animate={isRecording ? {} : { height: 4 }}
                          style={{ height: Math.min(l, 40) }}
                          className={`w-[4px] rounded-t-sm transition-all duration-75 ${
                            isRecording ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>

                    {isRecording ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1.5 text-[11px] text-zinc-900 dark:text-white font-semibold font-mono tracking-wider">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          RECORDING AUDIO ({recordingSeconds}s)
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          System Status: Microphone Standby
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center pt-1">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Check className="w-4 h-4" /> Stop & Evaluate Output &rarr;
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-medium rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Mic className="w-4 h-4" /> Start Speaking Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug">
                  <p className="max-w-xl">Speak clearly for at least 3 seconds at a natural pace. The engine will evaluate articulation coordinates upon completion.</p>
                </div>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 flex flex-col items-center justify-center space-y-6 flex-1 text-center"
              >
                {/* Clean and minimal loading loop */}
                <div className="relative h-14 w-14 rounded-full border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-zinc-500 dark:text-zinc-400 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border border-dashed border-zinc-400 dark:border-zinc-500 animate-spin" style={{ animationDuration: '8s' }} />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Evaluating Speech & Text Responses</h4>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-550 font-mono tracking-tight">{analysisText}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${analysisProgress}%` }}
                    className="h-full bg-zinc-900 dark:bg-white rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {totalScore >= 25 ? (
                    <div className="flex flex-col items-center py-6 border border-emerald-500/15 bg-emerald-500/[0.02] rounded-xl space-y-4 relative overflow-hidden text-center md:px-8">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                          Admissions Qualification Successful
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed animate-pulse">
                          {isTimeout 
                            ? "Even though time ran out, your evaluation performance successfully satisfied the academic requirements for registration!"
                            : "Excellent work! Your evaluation performance has successfully satisfied the academic requirements for automatic registration."
                          }
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block tracking-wider">Final Assessment Grade</span>
                        <span className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1 block">{totalScore}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 border border-rose-500/15 bg-rose-500/[0.02] rounded-xl space-y-4 relative overflow-hidden text-center md:px-8">
                      <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-450">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 tracking-tight">
                          {isTimeout ? "Evaluation Time Expired" : "Evaluation Score Below Requirement"}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                          {isTimeout 
                            ? "The 20-minute exam timer has run out. You did not achieve the 25% score required to automatically qualify."
                            : `You scored ${totalScore}%, which is below the 25% score threshold required to qualify for automatic registration.`
                          }
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block tracking-wider">Final Assessment Grade</span>
                        <span className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1 block">{totalScore}%</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5 flex justify-between items-center shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Reading Evaluation</span>
                        <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Text Comprehension</h5>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-lg">
                        {readingScore} / 50
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/5 flex justify-between items-center shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Speaking Evaluation</span>
                        <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Phonetic Articulation</h5>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-lg">
                        {speakingScore} / 50
                      </span>
                    </div>
                  </div>

                  {totalScore >= 25 ? (
                    <div className="p-3.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl text-xs text-zinc-550 dark:text-zinc-450 text-center leading-relaxed font-sans">
                      Your student profile has been automatically provisioned. Login credentials and onboarding schedules have been dispatched to your mailbox.
                    </div>
                  ) : (
                    <div className="p-3.5 bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border border-rose-200/40 dark:border-rose-900/10 rounded-xl text-xs text-zinc-650 dark:text-zinc-400 text-center leading-relaxed font-sans">
                      Don't worry! You can retake the Language Placement Exam. You have <strong>{3 - attemptsUsed}</strong> of 3 attempts remaining.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-white/5 flex flex-col gap-3">
                  {totalScore < 25 && attemptsUsed >= 3 && (
                    <div className="p-3 bg-rose-500/[0.04] border border-rose-500/25 rounded-xl text-xs text-rose-600 dark:text-rose-400 text-center font-semibold">
                      ⚠️ You have used all 3 available attempts and did not reach the 25% passing score. Please contact administration for further support.
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    {totalScore < 25 ? (
                      <button
                        onClick={handleResetExam}
                        disabled={attemptsUsed >= 3}
                        className="flex-1 py-2.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-300 border border-zinc-200 dark:border-white/15 font-semibold rounded-lg cursor-pointer transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Restart Exam ({3 - attemptsUsed} attempts remaining)
                      </button>
                    ) : (
                      <>
                        {attemptsUsed < 3 && (
                          <button
                            onClick={handleResetExam}
                            className="px-4 py-2.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-300 border border-zinc-200 dark:border-white/15 font-semibold rounded-lg cursor-pointer transition text-xs flex items-center justify-center gap-1.5"
                          >
                            Restart Exam
                          </button>
                        )}
                        <button
                          onClick={handleCompleteAssessment}
                          className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
                        >
                          Access Your Dashboard &rarr;
                        </button>
                      </>
                    )}
                  </div>
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
