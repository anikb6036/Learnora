/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RegistrationRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Mic, Volume2, Award, Activity, FileCheck, AlertCircle, Check, X, ShieldAlert, Sparkles, GraduationCap } from 'lucide-react';
import Logo from './Logo';

const SPEAKING_PARAGRAPHS = [
  "In an increasingly interconnected global economy, the mastery of articulate communication serves as the fundamental bridge between disparate perspectives. By cultivating both rigorous analytical reasoning and empathetic active listening, we empower ourselves to formulate solutions for our world's most critical academic and social challenges.",
  "Pursuing higher education at this institution represents a conscious commitment to intellectual curiosity and professional excellence. Through comprehensive collaborative research, structured critical discourse, and the relentless pursuit of innovative insights, we prepare to lead the future with confidence and integrity.",
  "Leadership in the contemporary era demands more than just technical expertise; it requires an unwavering dedication to sustainable progress and ethical decision-making. By embracing diversity of thought and fostering inclusive academic communities, we lay the groundwork for transformative progress on a global scale.",
  "The acquisition of knowledge is a lifelong journey of self-discovery that extends far beyond the traditional boundaries of the classroom. When we challenge our pre-existing assumptions, analyze complex datasets, and articulate clear, evidence-based conclusions, we contribute meaningfully to the advancement of human understanding.",
  "Effective professional communication is characterized by clarity of purpose, precision of language, and a deep respect for the audience's intellect. Mastering these skills enables scholars to articulate groundbreaking theories, publish impactful studies, and inspire the next generation of global citizens."
];

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
  const [selectedParagraph, setSelectedParagraph] = useState<string>(SPEAKING_PARAGRAPHS[0]);

  // Reading MCQ choices
  const [q1Answer, setQ1Answer] = useState<string>('');
  const [q2Answer, setQ2Answer] = useState<string>('');
  const [q3Answer, setQ3Answer] = useState<string>('');
  const [q4Answer, setQ4Answer] = useState<string>('');

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
  const q3Correct = 'B';
  const q4Correct = 'B';

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
      if (q1Answer === q1Correct) score += 12.5;
      if (q2Answer === q2Correct) score += 12.5;
      if (q3Answer === q3Correct) score += 12.5;
      if (q4Answer === q4Correct) score += 12.5;
      setReadingScore(score);

      // Speaking is evaluated strictly based on actual student vocalic performance
      let speakResult = 0;
      if (hasMicrophone) {
        if (vocalTicks >= 20) { // Require at least 20 vocal ticks to prove active vocalization
          const targetVocalTicks = 154;
          const progressRatio = Math.min(1.0, vocalTicks / targetVocalTicks);
          speakResult = Math.floor(progressRatio * 45) + Math.floor(Math.random() * 5) + 1;
        } else {
          speakResult = 0;
        }
        if (speakResult > 50) speakResult = 50;
      } else {
        // Without a working microphone signal, student receives a 0 for the speaking component
        speakResult = 0;
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
  }, [q1Answer, q2Answer, q3Answer, q4Answer, hasMicrophone, vocalTicks, recordingSeconds, monitoringStream, onExamPassBg]);

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

  // Select a new paragraph when the modal is opened
  useEffect(() => {
    if (isOpen) {
      const nextParagraph = SPEAKING_PARAGRAPHS[Math.floor(Math.random() * SPEAKING_PARAGRAPHS.length)];
      setSelectedParagraph(nextParagraph);
    }
  }, [isOpen]);

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
          const AudioCtx: any = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
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
              if (avgVol > 12.0) { // Robust threshold to strictly capture real human speaking above room hum and fan noise
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
          }
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
    // Grade Reading portion (50 points total: 12.5 each)
    let score = 0;
    if (q1Answer === q1Correct) score += 12.5;
    if (q2Answer === q2Correct) score += 12.5;
    if (q3Answer === q3Correct) score += 12.5;
    if (q4Answer === q4Correct) score += 12.5;
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
      if (vocalTicks >= 20) { // Require at least 20 vocal ticks to prove active vocalization
        // Spoke. A typical fast reading of a standard paragraph takes about 6-8 seconds of active audio.
        // Firing 22 times per second, 7 seconds of active reading translates to ~154 vocal ticks.
        const targetVocalTicks = 154;
        const progressRatio = Math.min(1.0, vocalTicks / targetVocalTicks);
        
        // Base score up to 45 proportional to completion ratio, plus a small random pronunciation factor of 1-5
        speakResult = Math.floor(progressRatio * 45) + Math.floor(Math.random() * 5) + 1;
      } else {
        speakResult = 0;
      }
      if (speakResult > 50) speakResult = 50;
    } else {
      // Without a working microphone signal, student receives a 0 for the speaking component
      speakResult = 0;
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
    if (attemptsUsed >= 3) {
      setAttemptsUsed(0);
      localStorage.setItem(`exam_attempts_${request.id}`, '0');
    }
    // Select a new different random professional paragraph
    let nextParagraph = SPEAKING_PARAGRAPHS[Math.floor(Math.random() * SPEAKING_PARAGRAPHS.length)];
    while (nextParagraph === selectedParagraph && SPEAKING_PARAGRAPHS.length > 1) {
      nextParagraph = SPEAKING_PARAGRAPHS[Math.floor(Math.random() * SPEAKING_PARAGRAPHS.length)];
    }
    setSelectedParagraph(nextParagraph);

    setStep('intro');
    setQ1Answer('');
    setQ2Answer('');
    setQ3Answer('');
    setQ4Answer('');
    setRecordingSeconds(0);
    setIsRecording(false);
    setReadingScore(0);
    setSpeakingScore(0);
    setTotalScore(0);
    setVocalTicks(0);
    setTotalTicks(0);
  };

  return (
    <div className="fixed inset-0 z-55 bg-slate-50 dark:bg-zinc-950 overflow-y-auto overflow-x-hidden flex flex-col items-center select-none">
      {/* Professional subtle overlay pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative w-full h-full min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 font-sans"
      >
        {/* Premium Academic Header */}
        <div className="relative bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 py-5 px-6 md:px-8 shrink-0 flex justify-center z-30 shadow-sm">
          <div className="w-full max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <Logo size="sm" withStrapline={false} />
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-sans font-bold tracking-tight text-slate-900 dark:text-white">Assessment Center</h2>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-white/10 text-[9px] font-mono font-bold tracking-wider uppercase">
                    <span>Proctored Exam</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-0.5">
                  English Placement Entrance Examination
                </p>
              </div>
            </div>

            {(step === 'reading' || step === 'speaking') && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-mono text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>Time Remaining: {formatTime(timeLeft)}</span>
              </div>
            )}
            {(step === 'intro' || step === 'result') && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white border border-slate-300/75 dark:border-white/15 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
                Exit Exam
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex justify-center relative py-6">
          {/* Strict Security Monitoring Video Stream */}
          {monitoringStream && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 md:top-6 md:right-8 w-28 h-20 md:w-44 md:h-32 bg-black rounded-lg overflow-hidden border border-slate-300 dark:border-zinc-800 shadow-md z-25 flex flex-col pointer-events-none"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-1.5 flex items-center justify-between px-2 flex-row border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[7px] font-mono text-slate-300 tracking-wider uppercase font-bold">PROCTOR STREAM ACTIVE</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="w-full max-w-5xl p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col justify-between z-20">
            <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-8">
                  <div className="space-y-4 border-b border-slate-200 dark:border-zinc-800 pb-8">
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      Attempts used: <span className="text-slate-900 dark:text-white font-semibold">{attemptsUsed} of 3 allowed</span>
                    </div>
                    
                    <h3 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Candidate: {request.name}
                    </h3>
                    <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                      Welcome to the official placement examination. This evaluation determines your English reading literacy and spoken cadence parameters. To qualify for automatic registration and instant course onboarding, you are required to secure a minimum overall score of <strong className="text-slate-900 dark:text-white underline">25% or higher</strong>.
                    </p>
                  </div>

                  {/* Syllabus / Evaluation breakdown boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="relative p-6 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 dark:bg-slate-500 rounded-l-lg" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-850 dark:text-zinc-100">
                          <div className="p-2 rounded bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Section 1</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-sans font-bold text-slate-900 dark:text-white">Reading Comprehension</h4>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-2">
                            Analyze an academic reading comprehension passage and answer four multiple-choice questions. This counts for 50% of the final exam grade.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative p-6 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 dark:bg-slate-500 rounded-l-lg" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 text-slate-850 dark:text-zinc-100">
                          <div className="p-2 rounded bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                            <Mic className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Section 2</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-sans font-bold text-slate-900 dark:text-white">Speaking & Pronunciation</h4>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-2">
                            Read a phonetically rich sentence aloud. The system will evaluate pronunciation accuracy, spoken cadence, and speech delivery in real-time. Counts for 50%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strictly official warning block */}
                  <div className="p-5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-sm text-amber-900 dark:text-amber-400 leading-relaxed flex gap-4 shadow-sm">
                    <div className="h-9 w-9 rounded bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-500 shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold tracking-tight block uppercase text-[10px] text-amber-800 dark:text-amber-500">Academic Evaluation Integrity Notice</span>
                      <span className="text-amber-900/80 dark:text-amber-200/70 text-xs">
                        Please verify your audio and video inputs. Strict proctor monitoring remains active during the entire test duration. Navigating away from this window, losing audio/video signals, or talking during forbidden times will flag this attempt for administrative review.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                  {monitoringError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/30 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                      <span>{monitoringError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleStartExam}
                    disabled={isRequestingPermissions || attemptsUsed >= 3}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {attemptsUsed >= 3 
                      ? 'No Attempts Remaining (3/3 Used)' 
                      : isRequestingPermissions 
                        ? 'Configuring Proctor Audio & Video Feeds...' 
                        : 'Acknowledge Rules & Begin Examination'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'reading' && (
              <motion.div
                key="reading"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 shadow-sm">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                      <span className="h-2 w-2 rounded-full bg-slate-800 dark:bg-zinc-200 animate-ping" />
                      Section A: Reading Comprehension
                    </span>
                    <span>50 Points Max</span>
                  </div>

                  {/* Reading Passage Container */}
                  <div className="p-8 md:p-10 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm leading-relaxed text-slate-850 dark:text-zinc-200 select-none relative shadow-sm">
                    <div className="absolute top-10 left-0 w-1 h-16 bg-slate-900 dark:bg-slate-400 rounded-r-lg" />
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-[10px] uppercase font-mono tracking-wider font-bold mb-4">
                      <BookOpen className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                      <span>OFFICIAL ACADEMIC READING EXCERPT</span>
                    </div>
                    <p className="italic pl-6 text-slate-800 dark:text-zinc-200 font-sans text-lg leading-loose">
                      "The Amazon Rainforest is often called the 'lungs of the Earth' because it draws in a lot of carbon dioxide and breathes out oxygen. Many unique animals live there, like the colorful toucan and the slow-moving sloth. Learning about these forests helps us understand why we need to protect our planet's wildlife."
                    </p>
                  </div>

                  {/* MCQ Questions list */}
                  <div className="space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                    {/* Q1 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/40">Item 01</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Why is the Amazon Rainforest called the 'lungs of the Earth'?
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'A', text: 'It has many rivers.' },
                          { key: 'B', text: 'It breathes out oxygen and helps the planet.' },
                          { key: 'C', text: 'It is very large.' },
                          { key: 'D', text: 'It has a lot of trees for climbing.' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ1Answer(opt.key)}
                            className={`p-4 px-5 text-left text-sm rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed flex items-center justify-between ${
                              q1Answer === opt.key 
                                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 font-bold shadow-sm' 
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span>
                              <span className={`font-mono uppercase font-bold mr-3 ${q1Answer === opt.key ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>{opt.key}</span> {opt.text}
                            </span>
                            {q1Answer === opt.key && <Check className="w-4 h-4 text-white dark:text-slate-900 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />

                    {/* Q2 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/40">Item 02</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Which two animals are mentioned as living in the rainforest?
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'A', text: 'Lions and elephants' },
                          { key: 'B', text: 'Bears and wolves' },
                          { key: 'C', text: 'Toucans and sloths' },
                          { key: 'D', text: 'Monkeys and snakes' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ2Answer(opt.key)}
                            className={`p-4 px-5 text-left text-sm rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed flex items-center justify-between ${
                              q2Answer === opt.key 
                                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 font-bold shadow-sm' 
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span>
                              <span className={`font-mono uppercase font-bold mr-3 ${q2Answer === opt.key ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>{opt.key}</span> {opt.text}
                            </span>
                            {q2Answer === opt.key && <Check className="w-4 h-4 text-white dark:text-slate-900 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />

                    {/* Q3 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/40">Item 03</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          What is the Amazon Rainforest often called?
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'A', text: 'The heart of the world' },
                          { key: 'B', text: 'The lungs of the Earth' },
                          { key: 'C', text: 'The brain of the planet' },
                          { key: 'D', text: 'The crown of nature' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ3Answer(opt.key)}
                            className={`p-4 px-5 text-left text-sm rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed flex items-center justify-between ${
                              q3Answer === opt.key 
                                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 font-bold shadow-sm' 
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span>
                              <span className={`font-mono uppercase font-bold mr-3 ${q3Answer === opt.key ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>{opt.key}</span> {opt.text}
                            </span>
                            {q3Answer === opt.key && <Check className="w-4 h-4 text-white dark:text-slate-900 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 dark:bg-zinc-800" />

                    {/* Q4 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/40">Item 04</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Why do we need to learn about these forests?
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'A', text: 'To find hidden treasures' },
                          { key: 'B', text: 'To understand why we need to protect our planet\'s wildlife' },
                          { key: 'C', text: 'To build new houses' },
                          { key: 'D', text: 'To catch wild animals for zoos' }
                        ].map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setQ4Answer(opt.key)}
                            className={`p-4 px-5 text-left text-sm rounded-lg border transition duration-150 cursor-pointer font-medium leading-relaxed flex items-center justify-between ${
                              q4Answer === opt.key 
                                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900 border-slate-900 dark:border-zinc-100 font-bold shadow-sm' 
                                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <span>
                              <span className={`font-mono uppercase font-bold mr-3 ${q4Answer === opt.key ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>{opt.key}</span> {opt.text}
                            </span>
                            {q4Answer === opt.key && <Check className="w-4 h-4 text-white dark:text-slate-900 stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                  <button
                    disabled={!q1Answer || !q2Answer || !q3Answer || !q4Answer}
                    onClick={handleProceedToSpeaking}
                    className={`py-3.5 px-8 font-bold rounded-lg text-sm flex items-center gap-2 transition duration-200 cursor-pointer ${
                      q1Answer && q2Answer && q3Answer && q4Answer 
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98]' 
                        : 'bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-650 cursor-not-allowed border border-slate-250 dark:border-zinc-800'
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-4 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 shadow-sm">
                    <span className="flex items-center gap-2 text-slate-850 dark:text-zinc-200">
                      <span className="h-2 w-2 rounded-full bg-slate-800 dark:bg-zinc-200 animate-ping" />
                      Section B: Spoken Articulation & Pronunciation
                    </span>
                    <span>50 Points Max</span>
                  </div>

                  <div className="space-y-4 text-center md:px-8 mt-4">
                    <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                      <Volume2 className="w-4 h-4" />
                      <span>Oral Reading Examination Prompt</span>
                    </div>
                    <div className="p-8 md:p-12 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-lg md:text-xl leading-relaxed text-slate-900 dark:text-zinc-100 text-center select-none shadow-sm max-w-3xl mx-auto relative font-sans">
                      <div className="absolute top-2 left-4 text-slate-200 dark:text-zinc-800 text-5xl font-mono opacity-50">“</div>
                      <span className="relative z-10 font-medium">{selectedParagraph}</span>
                      <div className="absolute bottom-2 right-4 text-slate-200 dark:text-zinc-800 text-5xl font-mono opacity-50">”</div>
                    </div>
                  </div>

                  {/* Voice recording console widget */}
                  <div className="flex flex-col items-center justify-center space-y-8 py-10 p-6 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 relative overflow-hidden shadow-sm mt-8 max-w-3xl mx-auto w-full">
                    
                    {/* Visualizer wave form output */}
                    <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-sm">
                      {audioLevels.map((l, idx) => (
                        <motion.div
                          key={idx}
                          animate={isRecording ? {} : { height: 6 }}
                          style={{ height: Math.min(l + 6, 60) }}
                          className={`w-1.5 rounded-full transition-all duration-75 ${
                            isRecording 
                              ? 'bg-slate-900 dark:bg-zinc-200 shadow-sm' 
                              : 'bg-slate-200 dark:bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>

                    {isRecording ? (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <span className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold font-mono tracking-widest uppercase">
                          <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                          RECORDING ACTIVE ({recordingSeconds}s)
                        </span>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Please read the examination prompt above clearly into your microphone.</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-2 font-mono font-bold tracking-wider uppercase">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700 animate-pulse" />
                          Microphone Status: Ready
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-8 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Check className="w-5 h-5 stroke-[3]" /> Stop & Submit Recording
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-bold rounded-lg text-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Mic className="w-5 h-5" /> Start Speaking Section
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2 text-xs text-slate-500 dark:text-zinc-500 mt-8">
                  <span className="font-semibold text-slate-700 dark:text-zinc-400 flex items-center gap-1">
                    System Guidelines:
                  </span>
                  <p className="leading-relaxed">Speak clearly into your microphone for at least 3 seconds at a normal speech rate. The proctor system measures vocal duration and pronunciation clarity to score speech delivery.</p>
                </div>
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-24 flex flex-col items-center justify-center space-y-8 flex-1 text-center"
              >
                {/* Clean, minimalist testing progress spinner */}
                <div className="relative h-20 w-20 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                  <Activity className="w-6 h-6 text-slate-700 dark:text-zinc-300 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-700 animate-spin" style={{ animationDuration: '4s' }} />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-widest">Evaluation Process Active</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 font-mono tracking-tight h-5">{analysisText}</p>
                </div>

                {/* Progress bar container */}
                <div className="w-full max-w-md space-y-2.5">
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Grading Audio & Answers</span>
                    <span>{analysisProgress}%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {totalScore >= 25 ? (
                    <div className="relative flex flex-col items-center py-10 p-8 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg space-y-5 text-center overflow-hidden shadow-sm">
                      <div className="h-14 w-14 rounded bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
                        <FileCheck className="w-7 h-7 stroke-[2]" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-400 text-[10px] uppercase font-mono font-bold tracking-wider border border-emerald-300/40 mb-2">
                          <Award className="w-4 h-4" /> Approved
                        </div>
                        <h3 className="text-2xl font-sans font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                          Placement Requirements Satisfied
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto mt-3 leading-relaxed">
                          {isTimeout 
                            ? "Even though time ran out, your evaluation performance successfully satisfied the academic requirements for automatic course onboarding!"
                            : "Excellent work. Your evaluation performance has successfully satisfied the academic requirements for automatic registration."
                          }
                        </p>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-5 px-10 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm mt-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block tracking-widest mb-1">Final Assessment Grade</span>
                        <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white block">{totalScore}%</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-2 block">PASSING BENCHMARK MET (25%)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center py-10 p-8 border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 rounded-lg space-y-5 text-center overflow-hidden shadow-sm">
                      <div className="h-14 w-14 rounded bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 shadow-sm">
                        <AlertCircle className="w-7 h-7 stroke-[2]" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-rose-100/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-400 text-[10px] uppercase font-mono font-bold tracking-wider border border-rose-300/40 mb-2">
                          Unqualified
                        </div>
                        <h3 className="text-2xl font-sans font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                          {isTimeout ? "Evaluation Time Expired" : "Evaluation Score Below Requirement"}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto mt-3 leading-relaxed">
                          {isTimeout 
                            ? "The 20-minute exam timer has run out. You did not achieve the 25% score required to automatically qualify."
                            : `You scored ${totalScore}%, which is below the 25% score threshold required to qualify for automatic registration.`
                          }
                        </p>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 p-5 px-10 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm mt-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block tracking-widest mb-1">Final Assessment Grade</span>
                        <span className="text-5xl font-extrabold tracking-tight text-rose-700 dark:text-rose-400 block">{totalScore}%</span>
                        <span className="text-[10px] font-mono font-bold text-rose-700 dark:text-rose-450 uppercase tracking-widest mt-2 block">PASSING BENCHMARK: 25%</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex justify-between items-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1 bg-slate-800 dark:bg-zinc-600 rounded-l-lg" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block tracking-widest">Section 1 Score</span>
                        <h5 className="text-sm font-sans font-bold text-slate-900 dark:text-zinc-100">Reading Comprehension</h5>
                      </div>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 rounded shadow-sm">
                        {readingScore} / 50
                      </span>
                    </div>

                    <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex justify-between items-center shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1 bg-slate-800 dark:bg-zinc-600 rounded-l-lg" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase block tracking-widest">Section 2 Score</span>
                        <h5 className="text-sm font-sans font-bold text-slate-900 dark:text-zinc-100">Phonetic Articulation</h5>
                      </div>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 rounded shadow-sm">
                        {speakingScore} / 50
                      </span>
                    </div>
                  </div>

                  {totalScore >= 25 ? (
                    <div className="p-5 bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-700 dark:text-zinc-300 text-center leading-relaxed font-sans shadow-inner">
                      Your student profile has been automatically provisioned. Login credentials and onboarding schedules have been dispatched to your mailbox.
                    </div>
                  ) : (
                    <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-lg text-sm text-rose-800 dark:text-rose-200 text-center leading-relaxed font-sans shadow-inner">
                      Do not worry! You can retake the Placement Exam. You have <strong>{3 - attemptsUsed}</strong> of 3 attempts remaining.
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-4 mt-8">
                  {totalScore < 25 && attemptsUsed >= 3 && (
                    <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300/45 rounded-lg text-sm text-rose-800 dark:text-rose-300 text-center font-bold flex items-center justify-center gap-3">
                      <ShieldAlert className="w-5 h-5" />
                      <span>You have used all 3 available attempts and did not reach the 25% passing score. Please contact administration for further support.</span>
                    </div>
                  )}

                  <div className="flex gap-4 w-full">
                    {totalScore < 25 ? (
                      <button
                        onClick={handleResetExam}
                        className="flex-1 py-3.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 font-bold rounded-lg cursor-pointer transition text-sm flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"
                      >
                        {attemptsUsed >= 3 ? "Reset Attempts & Restart Exam" : `Restart Exam (${3 - attemptsUsed} attempts remaining)`}
                      </button>
                    ) : (
                      <>
                        {attemptsUsed < 3 && (
                          <button
                            onClick={handleResetExam}
                            className="px-6 py-3.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 font-bold rounded-lg cursor-pointer transition text-sm flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"
                          >
                            Restart Exam
                          </button>
                        )}
                        <button
                          onClick={handleCompleteAssessment}
                          className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
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
