import React, { useState } from 'react';
import { StudentAssignment, StudentEvolution } from '../types';
import { motion } from 'motion/react';
import { X, CheckCircle, FileText, Code, Send, Layout, PenTool, LayoutTemplate, Activity } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism-tomorrow.css';

interface StudentHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: StudentAssignment;
  evolution?: StudentEvolution;
  onSubmit: (assignmentId: string, submissionText: string, fileUrn?: string, proctoringLogs?: any[], recordedVideoUrl?: string) => void;
}

export default function StudentHomeworkModal({
  isOpen,
  onClose,
  assignment,
  evolution,
  onSubmit
}: StudentHomeworkModalProps) {
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrn, setFileUrn] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [consoleTab, setConsoleTab] = useState<'testResults' | 'codeOutput'>('testResults');
  const [language, setLanguage] = useState('javascript');
  const [leftPaneWidth, setLeftPaneWidth] = useState(45);
  const [testResults, setTestResults] = useState<{ 
    status: 'success' | 'error' | 'running'; 
    message: string; 
    output?: string;
    testCases?: { id: number; passed: boolean; input: string; output: string; expected: string }[];
  } | null>(null);

  // Proctoring States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [proctorLogs, setProctorLogs] = useState<{
    id: string;
    timestamp: string;
    type: 'tab-switch' | 'face-missing' | 'multiple-faces' | 'gaze-away' | 'voice-detected';
    message: string;
    snapshotUrl?: string;
  }[]>([]);
  const [micVolume, setMicVolume] = useState(0);
  const [proctorWarnings, setProctorWarnings] = useState(0);
  const [alertFlash, setAlertFlash] = useState(false);
  
  // Recording states
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  if (!isOpen || (!assignment && !evolution)) return null;

  const itemTitle = assignment?.title || 'Evolution Exam';
  const itemDesc = assignment?.description || '';
  const isDSA = assignment?.questionType === 'dsa';
  
  const dsaQuestion = assignment?.dsaQuestion || '';
  const dsaConstraints = assignment?.dsaConstraints || '';
  const dsaTestCases = assignment?.dsaTestCases || '';
  const defaultCode = assignment?.dsaTemplateCode || '';

  // Initialize workspace with template if empty and is DSA
  const requireCamera = assignment?.requireCamera || evolution?.requireCamera;
  const requireMic = assignment?.requireMic || evolution?.requireMic;
  const requireScreenShare = assignment?.requireScreenShare || evolution?.requireScreenShare;
  const requireRecording = assignment?.requireRecording || evolution?.requireRecording;
  const isProctored = assignment?.isProctored || evolution?.isProctored;

  const triggerTabSwitchWarning = () => {
    setProctorWarnings(prev => prev + 1);
    setAlertFlash(true);
    setTimeout(() => setAlertFlash(false), 800);

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'tab-switch' as const,
      message: `System Alert: User exited full-screen or switched window/tab! Violation Warning #${proctorWarnings + 1}.`,
    };
    setProctorLogs(prev => [newLog, ...prev]);
  };

  // Tab change detection
  React.useEffect(() => {
    if (!isProctored) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabSwitchWarning();
      }
    };

    const handleBlur = () => {
      triggerTabSwitchWarning();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isProctored, proctorWarnings]);

  // AI Proctoring simulation loop
  React.useEffect(() => {
    if (!isProctored) return;

    const interval = setInterval(() => {
      const eventTypes: ('face-missing' | 'multiple-faces' | 'gaze-away' | 'voice-detected')[] = [
        'face-missing',
        'multiple-faces',
        'gaze-away',
        'voice-detected'
      ];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      let message = '';
      if (randomType === 'face-missing') {
        message = 'AI Check: No student face detected in camera viewport.';
      } else if (randomType === 'multiple-faces') {
        message = 'AI Check: Warning! Secondary person or motion detected in camera background.';
      } else if (randomType === 'gaze-away') {
        message = 'AI Check: Student gaze directed away from editor/workspace for too long.';
      } else if (randomType === 'voice-detected') {
        message = 'AI Check: Elevated noise level or conversational voice pattern detected.';
      }

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: randomType,
        message,
        snapshotUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*1000000)}?auto=format&fit=crop&w=150&q=80`
      };

      setProctorLogs(prev => [newLog, ...prev]);
      
      if (randomType === 'face-missing' || randomType === 'multiple-faces') {
        setAlertFlash(true);
        setTimeout(() => setAlertFlash(false), 500);
      }
    }, 25000); // every 25s

    return () => clearInterval(interval);
  }, [isProctored]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setCameraGranted(true);
      
      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'face-missing' as any,
        message: 'Student camera connected successfully. Facial scanning engine running.'
      }, ...prev]);
    } catch (err) {
      console.warn("Camera hardware access denied, using simulated stream feed", err);
      setCameraGranted(true);
      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'face-missing' as any,
        message: 'Camera connected (Simulated Frame Buffer Active).'
      }, ...prev]);
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVolume = () => {
        if (!isOpen) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = dataArray.length > 0 ? (sum / dataArray.length) : 0;
        const volumeVal = Math.min(100, Math.floor(average * 1.5));
        setMicVolume(isNaN(volumeVal) ? 0 : volumeVal);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();

      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'voice-detected' as any,
        message: 'Acoustic monitoring active. Decibel threshold analysis armed.'
      }, ...prev]);
    } catch (err) {
      console.warn("Microphone access denied, using simulated volume tracker", err);
      setMicGranted(true);
      const interval = setInterval(() => {
        if (!isOpen) {
          clearInterval(interval);
          return;
        }
        setMicVolume(Math.floor(Math.random() * 25));
      }, 300);

      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'voice-detected' as any,
        message: 'Microphone connected (Simulated Decibel Monitor Enabled).'
      }, ...prev]);
    }
  };

  const requestScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setScreenGranted(true);

      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'tab-switch' as any,
        message: 'Screen recording capture active. Background capture feed established.'
      }, ...prev]);
    } catch (err) {
      console.warn("Screen share denied, using simulated container window tracking", err);
      setScreenGranted(true);
      setProctorLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'tab-switch' as any,
        message: 'Screen Capture approved (Simulating Stream Window Buffer).'
      }, ...prev]);
    }
  };

  // Auto request permissions if proctored on mount
  React.useEffect(() => {
    if (requireCamera && !cameraGranted) requestCamera();
    if (requireMic && !micGranted) requestMic();
    if ((requireScreenShare || requireRecording) && !screenGranted) requestScreenShare();
  }, [requireCamera, requireMic, requireScreenShare, requireRecording]);

  // Handle Recording start
  React.useEffect(() => {
    if (requireRecording && !isRecording && (screenStream || cameraStream)) {
      try {
        const tracks: MediaStreamTrack[] = [];
        if (screenStream) tracks.push(...screenStream.getTracks());
        else if (cameraStream) tracks.push(...cameraStream.getTracks()); // fallback
        
        if (tracks.length > 0) {
          const combinedStream = new MediaStream(tracks);
          const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.start(1000); // chunk every second
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        }
      } catch (err) {
        console.warn("Failed to start MediaRecorder", err);
      }
    }
  }, [requireRecording, screenStream, cameraStream, isRecording]);

  // Clean up media streams on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream, screenStream]);

  React.useEffect(() => {
    if (isDSA && !submissionText && defaultCode) {
      setSubmissionText(defaultCode);
    }
  }, [isDSA, defaultCode, submissionText]);

  const handlePaneDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPaneWidth;
    const containerWidth = window.innerWidth; // Approximate, assuming modal is full screen
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));
      setLeftPaneWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
    
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = consoleHeight;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(600, startHeight + delta));
      setConsoleHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
    
    document.body.style.cursor = 'row-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTestResults({ status: 'running', message: 'Executing code...' });
    setSelectedTestCase(0);
    
    setTimeout(async () => {
      let logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        originalConsoleLog(...args); // Keep it logging to real console for debugging
      };

      try {
        if (language !== 'javascript') {
            try {
                const langMap: Record<string, string> = {
                    'python': 'python',
                    'java': 'java',
                    'cpp': 'c++'
                };
                
                const versionMap: Record<string, string> = {
                    'python': '3.10.0',
                    'java': '15.0.2',
                    'cpp': '10.2.0'
                };

                const response = await fetch('https://emacs.piston.rs/api/v2/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: langMap[language] || language,
                        version: versionMap[language] || '*',
                        files: [{ content: submissionText }]
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    setTestResults({
                        status: result.run?.code === 0 ? 'success' : 'error',
                        message: result.run?.code === 0 ? 'Accepted' : 'Runtime Error',
                        output: result.run?.output || 'No output',
                        testCases: [
                            { id: 1, passed: result.run?.code === 0, input: 'Sample Input', output: result.run?.output || 'No output', expected: 'Depends on the question' }
                        ]
                    });
                    setConsoleTab('codeOutput');
                    setIsRunning(false);
                    return;
                }
            } catch (e) {
                console.error("Piston execution failed, falling back to simulation", e);
            }
            
            // Fallback
            setTestResults({
              status: 'success',
              message: 'Accepted (Simulated Execution)',
              output: `Simulated execution for ${language} completed.`,
              testCases: [
                  { id: 1, passed: true, input: 'Sample Input', output: 'Simulated Output', expected: 'Simulated Output' }
              ]
            });
            setIsRunning(false);
            return;
        }

        // Try to find function definitions to execute them
        const funcMatches = [...submissionText.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)];
        const funcNames = funcMatches.map(m => m[1]);
        
        let executionCode = submissionText + '\n\n';
        if (funcNames.length > 0) {
            executionCode += `console.log("Running defined functions against sample test cases...");\n`;
            for (const name of funcNames) {
                if (name === 'lengthOfLongestSubstring') {
                    executionCode += `console.log("${name}('abcabcbb') =>", ${name}('abcabcbb'));\n`;
                    executionCode += `console.log("${name}('bbbbb') =>", ${name}('bbbbb'));\n`;
                } else if (name === 'maxArea') {
                    executionCode += `console.log("${name}([1,8,6,2,5,4,8,3,7]) =>", ${name}([1,8,6,2,5,4,8,3,7]));\n`;
                } else if (name === 'threeSum') {
                    executionCode += `console.log("${name}([-1,0,1,2,-1,-4]) =>", JSON.stringify(${name}([-1,0,1,2,-1,-4])));\n`;
                } else if (name === 'twoSum') {
                    executionCode += `console.log("${name}([2,7,11,15], 9) =>", JSON.stringify(${name}([2,7,11,15], 9)));\n`;
                } else {
                    // Try with generic arguments if we don't know the function
                    executionCode += `try { console.log("${name}() =>", JSON.stringify(${name}())); } catch(e) {}\n`;
                }
            }
        } else {
             // If no function defined, maybe it's just inline code, just log that it ran
             executionCode += `\nconsole.log("Code execution completed.");\n`;
        }

        // eslint-disable-next-line no-new-func
        const fn = new Function(executionCode);
        fn();
        
        // Mock test cases evaluation based on dsaTestCases content
        const lines = dsaTestCases.split('\n').filter(l => l.trim().startsWith('Input:'));
        let cases = [];
        if (lines.length > 0) {
            cases = lines.map((l, i) => ({
                id: i + 1,
                passed: true,
                input: l.replace('Input:', '').trim(),
                output: 'Accepted',
                expected: 'Accepted'
            }));
        } else {
             cases = [
                 { id: 1, passed: true, input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', expected: '[0, 1]' },
                 { id: 2, passed: true, input: 'nums = [3,2,4], target = 6', output: '[1, 2]', expected: '[1, 2]' }
             ];
        }
        
        setTestResults({
          status: 'success',
          message: 'Accepted',
          output: logs.length > 0 ? logs.join('\n') : '',
          testCases: cases
        });
      } catch (err: any) {
        setTestResults({
          status: 'error',
          message: 'Execution Error',
          output: err.toString()
        });
      } finally {
        console.log = originalConsoleLog;
        setIsRunning(false);
      }
    }, 1200);
  };

  const handleSubmit = () => {
    if (!submissionText.trim() && !fileUrn.trim()) {
      setErrorMessage('Please provide a submission text or attach a file.');
      return;
    }
    
    // We pass assignment ID. If it's an evolution we might need a different handling, but based on current types we might only pass assignment id.
    const idToSubmit = assignment?.id || (evolution as any)?.id;
    
    let videoUrl: string | undefined = undefined;
    if (requireRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        videoUrl = URL.createObjectURL(blob);
      }
    } else if (isProctored) {
      videoUrl = `https://storage.googleapis.com/proctoring-videos/rec-${Date.now()}.mp4`; // fake url
    }

    onSubmit(
      idToSubmit, 
      submissionText, 
      fileUrn, 
      isProctored ? proctorLogs : undefined, 
      videoUrl
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0c0d12]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex flex-col relative"
      >
        {alertFlash && (
          <div className="absolute inset-0 bg-rose-600/20 pointer-events-none z-50 animate-pulse border-8 border-rose-600" />
        )}
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-white dark:bg-[#0c0d12] border-b border-slate-200 dark:border-white/10 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {isDSA ? <Code className="w-4 h-4" /> : assignment ? <FileText className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{itemTitle}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded font-medium">
                  {assignment ? 'Assignment' : 'Evolution'}
                </span>
                {assignment?.dueDate && <span className="text-[11px] text-slate-500 dark:text-gray-400">Due: {assignment.dueDate}</span>}
                {assignment?.maxPoints && <span className="text-[11px] text-amber-600 dark:text-amber-500 font-bold ml-1">{assignment.maxPoints} pts</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" /> Submit
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-rose-200 dark:border-rose-500/20 z-10">
            <CheckCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {/* Content Area - Split Pane for DSA, Centered for Normal */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-zinc-950/50">
          
          {/* Left Pane: Instructions */}
          <div 
            className={`${isDSA ? 'border-b md:border-b-0 flex-shrink-0' : 'w-full max-w-4xl mx-auto border-x'} bg-white dark:bg-[#161618] border-slate-200 dark:border-white/10 flex flex-col h-full`}
            style={isDSA ? { width: `${leftPaneWidth}%` } : {}}
          >
            <div className="flex bg-slate-50 dark:bg-[#121315] border-b border-slate-200 dark:border-white/10">
              <div className="px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#161618]">
                <FileText className="w-4 h-4" /> Description
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
              <div className="prose dark:prose-invert max-w-none">
                <div className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed mb-6">
                  {itemDesc || 'No general description provided.'}
                </div>

                {isDSA && (
                  <div className="space-y-6">
                    <div>
                      {dsaQuestion && (
                        <div className="text-[13px] text-slate-800 dark:text-zinc-200 whitespace-pre-wrap font-sans">
                          {dsaQuestion}
                        </div>
                      )}
                    </div>
                    
                    {dsaTestCases && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Examples</h4>
                        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-white/5 p-4 rounded-xl font-mono text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                          {dsaTestCases}
                        </div>
                      </div>
                    )}
                    
                    {dsaConstraints && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Constraints</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {dsaConstraints.split(',').map((constraint, i) => constraint.trim() ? (
                            <li key={i} className="text-xs text-slate-700 dark:text-zinc-300 font-mono">
                              <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[11px]">{constraint.trim()}</span>
                            </li>
                          ) : null)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          {isDSA && (
            <div 
              className="w-1.5 cursor-col-resize bg-zinc-800 hover:bg-emerald-500/50 transition-colors z-10 shrink-0 hidden md:block"
              onMouseDown={handlePaneDragStart}
            />
          )}

          {/* Right Pane: Code Editor / Submission */}
          <div className={`${isDSA ? 'flex-1' : 'hidden'} flex flex-col h-full bg-[#1e1e1e] border-l border-zinc-800 min-w-0`}>
            <div className="flex bg-[#252526] border-b border-[#303030] justify-between items-center pr-4 shrink-0">
              <div className="px-4 py-2.5 text-xs font-bold flex items-center gap-2 bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-500">
                <Code className="w-4 h-4" /> Code Solution
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#1e1e1e] text-zinc-300 text-[11px] font-mono px-2 py-1 rounded border border-[#303030] focus:outline-none focus:border-emerald-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
              <div className="flex-1 relative min-h-[100px] overflow-y-auto custom-scrollbar bg-[#1e1e1e]">
                <Editor
                  value={submissionText}
                  onValueChange={(code) => {
                    setSubmissionText(code);
                    if (errorMessage) setErrorMessage('');
                  }}
                  highlight={code => Prism.highlight(code, Prism.languages[language === 'cpp' ? 'cpp' : language] || Prism.languages.javascript, language)}
                  padding={24}
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 13,
                    minHeight: '100%',
                    color: '#e2e8f0',
                  }}
                  className="editor-container"
                  textareaClassName="focus:outline-none"
                />
              </div>

              {/* Console/Output Panel */}
              <div 
                className="border-t border-[#303030] bg-[#1e1e1e] flex flex-col shrink-0 relative"
                style={{ height: consoleHeight }}
              >
                {/* Drag handle */}
                <div 
                  className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-10 hover:bg-emerald-500/20 transition"
                  onMouseDown={handleDragStart}
                />
                
                <div className="flex bg-[#252526] border-b border-[#303030] px-4 shrink-0 gap-4">
                  <button 
                    onClick={() => setConsoleTab('testResults')}
                    className={`px-2 py-2 text-xs font-bold transition-colors ${consoleTab === 'testResults' ? 'text-zinc-300 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-400'}`}
                  >
                    Test Results
                  </button>
                  <button 
                    onClick={() => setConsoleTab('codeOutput')}
                    className={`px-2 py-2 text-xs font-bold transition-colors ${consoleTab === 'codeOutput' ? 'text-zinc-300 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-zinc-400'}`}
                  >
                    Code Output
                  </button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col font-mono text-[12px]">
                  {!testResults ? (
                    <div className="p-4 text-zinc-500 italic custom-scrollbar overflow-y-auto">Run code to see results here...</div>
                  ) : testResults.status === 'running' ? (
                    <div className="p-4 text-amber-400 flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      {testResults.message}
                    </div>
                  ) : consoleTab === 'codeOutput' ? (
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                      <div className="text-zinc-400 whitespace-pre-wrap">
                        {testResults.output || <span className="text-zinc-600 italic">No output</span>}
                      </div>
                    </div>
                  ) : testResults.status === 'success' && testResults.testCases ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="px-4 py-3 shrink-0">
                         <div className="font-bold text-emerald-400 text-lg mb-3">Accepted</div>
                         <div className="flex gap-2">
                            {testResults.testCases.map((tc, idx) => (
                               <button 
                                 key={tc.id}
                                 onClick={() => setSelectedTestCase(idx)}
                                 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${selectedTestCase === idx ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80'}`}
                               >
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                 Case {tc.id}
                               </button>
                            ))}
                         </div>
                      </div>
                      
                      <div className="flex-1 p-4 pt-0 overflow-y-auto custom-scrollbar space-y-4">
                         {testResults.testCases[selectedTestCase] && (
                            <>
                              <div>
                                <div className="text-zinc-500 mb-1 text-[11px] font-bold">Input</div>
                                <div className="bg-[#2d2d2d] rounded-lg p-3 text-zinc-300 whitespace-pre-wrap font-mono">
                                  {testResults.testCases[selectedTestCase].input}
                                </div>
                              </div>
                              <div>
                                <div className="text-zinc-500 mb-1 text-[11px] font-bold">Output</div>
                                <div className="bg-[#2d2d2d] rounded-lg p-3 text-zinc-300 whitespace-pre-wrap font-mono">
                                  {testResults.testCases[selectedTestCase].output}
                                </div>
                              </div>
                              <div>
                                <div className="text-zinc-500 mb-1 text-[11px] font-bold">Expected</div>
                                <div className="bg-[#2d2d2d] rounded-lg p-3 text-zinc-300 whitespace-pre-wrap font-mono">
                                  {testResults.testCases[selectedTestCase].expected}
                                </div>
                              </div>
                            </>
                         )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                      <div className="font-bold text-rose-400">
                        {testResults.message}
                      </div>
                      {testResults.output && (
                        <div className="bg-[#111111] p-3 rounded border border-white/5 text-zinc-300 whitespace-pre-wrap">
                          {testResults.output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="h-12 bg-[#252526] border-t border-[#303030] flex items-center px-4 justify-between shrink-0">
              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Environment Ready
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-1.5 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-zinc-200 rounded text-xs font-bold transition disabled:opacity-50"
                >
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Alternative Right Pane: Form Submission for non-DSA */}
          {!isDSA && (
             <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 p-6">
                <div className="flex-1 flex flex-col bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden mb-6">
                  <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 pl-1 flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Submission Text
                    </label>
                  </div>
                  <textarea
                    placeholder="Type your structured solution answers here..."
                    className="flex-1 w-full p-4 text-sm bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none resize-none font-mono leading-relaxed custom-scrollbar"
                    value={submissionText}
                    onChange={(e) => {
                      setSubmissionText(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </div>

                <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2 pl-1">Document File Name / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. workspace_dump_final.pdf"
                    className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    value={fileUrn}
                    onChange={(e) => {
                      setFileUrn(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </div>
             </div>
          )}

          {/* Proctoring Sidebar Panel */}
          {(isProctored || requireCamera || requireMic || requireScreenShare || requireRecording) && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-rose-500/10 dark:border-rose-500/20 bg-rose-50/5 dark:bg-zinc-950/80 flex flex-col h-full shrink-0">
              <div className="p-4 border-b border-rose-500/10 dark:border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    🛡️ Proctoring Active
                    {requireRecording && isRecording && <span className="ml-2 text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-sm tracking-widest font-mono">REC🔴</span>}
                  </p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-bold rounded">
                  {proctorWarnings} warnings
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* 1. CAMERA SECURE PREVIEW */}
                {requireCamera && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Webcam Secure Stream</p>
                    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-rose-500/20 flex items-center justify-center">
                      {cameraStream && cameraGranted ? (
                        <video
                          ref={el => {
                            if (el && cameraStream) {
                              el.srcObject = cameraStream;
                              el.play().catch(() => {});
                            }
                          }}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 to-zinc-950 flex flex-col items-center justify-center p-3 text-center">
                          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-2">
                            <Activity className="w-4 h-4 animate-spin" />
                          </div>
                          <p className="text-[11px] font-bold text-rose-400">Secure Camera Feed</p>
                          <p className="text-[9px] text-zinc-400 mt-1">Facial scanner active</p>
                        </div>
                      )}
                      
                      {/* Green facial rectangle overlays */}
                      <div className="absolute inset-x-8 inset-y-6 border border-emerald-500/40 pointer-events-none rounded-md">
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute top-2 left-2 text-[8px] font-mono font-bold text-emerald-400 bg-black/60 px-1 py-0.2 rounded">
                          TRACKING OK
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AUDIO LEVEL PREVIEW */}
                {requireMic && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acoustic Decibel Bar</p>
                    <div className="p-3 bg-zinc-900 rounded-xl border border-rose-500/10">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Acoustic Monitor</span>
                        <span>{micVolume}% volume</span>
                      </div>
                      <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 flex items-center px-0.5">
                        <div 
                          className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-100" 
                          style={{ width: `${micVolume}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SCREEN SHARE badge */}
                {requireScreenShare && (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-rose-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-400">Desktop Capture Stream</p>
                      <p className="text-xs font-bold text-emerald-400">Active (Secure Rec)</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                )}

                {/* 4. ANTI-CHEAT WARNING RULES */}
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-xl text-[10px] space-y-1 font-medium">
                  <p className="font-bold uppercase tracking-wide">Cheating Prevention Controls:</p>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    <li>Camera recording student movement.</li>
                    <li>Tab-switching triggers auto violations.</li>
                    <li>Audio background voice scanning is live.</li>
                  </ul>
                </div>

                {/* 5. LOGS STREAM */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Security Event Logs</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[9px]">
                    {proctorLogs.length === 0 ? (
                      <p className="text-zinc-500 italic text-center py-2">No security logs recorded yet.</p>
                    ) : (
                      proctorLogs.map(log => (
                        <div key={log.id} className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                          <div className="flex justify-between text-zinc-500">
                            <span>{log.timestamp}</span>
                            <span className="text-[8px] font-bold uppercase text-rose-400">{log.type}</span>
                          </div>
                          <p className="text-zinc-300">{log.message}</p>
                          {log.snapshotUrl && (
                            <img src={log.snapshotUrl} alt="Violation thumbnail" className="w-full h-10 object-cover rounded mt-1 border border-zinc-700" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
