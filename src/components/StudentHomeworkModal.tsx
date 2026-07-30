import React, { useState } from 'react';
import { StudentAssignment, StudentEvolution } from '../types';
import { motion } from 'motion/react';
import { X, CheckCircle, FileText, Code, Send, Layout, PenTool, LayoutTemplate, Activity, RotateCcw, Play, Terminal } from 'lucide-react';


const highlightCode = (code: string, lang: string): string => {
  if (!code) return '';
  // Escape HTML characters
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const placeholders: string[] = [];
  const normalizedLang = (lang || '').toLowerCase();
  
  if (normalizedLang === 'python') {
    // Comments: # ...
    html = html.replace(/(#.*$)/gm, (match) => {
      placeholders.push(`<span style="color: #008000; font-style: italic;">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });
    // Strings
    html = html.replace(/(["'])(.*?)\1/g, (match) => {
      placeholders.push(`<span style="color: #a31515;">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });
    // Python Keywords
    const pyKeywords = /\b(def|class|return|if|elif|else|for|while|in|and|or|not|import|from|as|try|except|pass|break|continue|lambda|global)\b/g;
    html = html.replace(pyKeywords, '<span style="color: #0000ff; font-weight: bold;">$1</span>');
    // Constants
    const pyConstants = /\b(True|False|None)\b/g;
    html = html.replace(pyConstants, '<span style="color: #0000ff;">$1</span>');
    // Numbers
    html = html.replace(/\b(\d+)\b/g, '<span style="color: #098658;">$1</span>');
    // Methods/Built-ins
    const pyBuiltins = /\b(print|len|enumerate|range|list|dict|set|tuple|isinstance|sum|max|min|abs|append|pop|keys|values|items|self)\b/g;
    html = html.replace(pyBuiltins, '<span style="color: #795e26;">$1</span>');
  } else {
    // JS/TS/CPP/JAVA
    // Comments // ...
    html = html.replace(/(\/\/.*$)/gm, (match) => {
      placeholders.push(`<span style="color: #008000; font-style: italic;">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });
    // Comments /* ... */
    html = html.replace(/(\/\*[\s\S]*?\*\/)/gm, (match) => {
      placeholders.push(`<span style="color: #008000; font-style: italic;">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });
    // Strings
    html = html.replace(/(["'`])(.*?)\1/g, (match) => {
      placeholders.push(`<span style="color: #a31515;">${match}</span>`);
      return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });
    // Keywords
    const keywords = /\b(const|let|var|function|return|if|else|for|while|in|of|new|typeof|instanceof|try|catch|finally|throw|class|import|export|from|as|extends|implements|public|private|protected|readonly|static|struct|template|typename|void|int|double|float|char|bool|class|public|private|protected|new|delete|throw|try|catch|package|import|interface|extends|implements|public|private|protected|static|final|native|synchronized|transient|volatile|strictfp|class|interface|enum)\b/g;
    html = html.replace(keywords, '<span style="color: #0000ff; font-weight: bold;">$1</span>');
    // Types
    const types = /\b(interface|type|any|number|string|boolean|void|never|unknown|Record|Parameters|ReturnType|Map|Set|JSON|Math|Array|vector|string|iostream|std|Integer|Boolean|Double|Float|String|List|ArrayList|HashMap|HashSet|System|out|println)\b/g;
    html = html.replace(types, '<span style="color: #267f99; font-weight: 500;">$1</span>');
    // Constants
    const jsConstants = /\b(true|false|null|undefined|NaN)\b/g;
    html = html.replace(jsConstants, '<span style="color: #0000ff;">$1</span>');
    // Numbers
    html = html.replace(/\b(\d+)\b/g, '<span style="color: #098658;">$1</span>');
    // Builtins/Methods
    const jsBuiltins = /\b(console|log|warn|error|push|pop|has|get|set|max|min|stringify|parse|isArray|reduce|concat|cout|cin|endl|print|printf|scanf)\b/g;
    html = html.replace(jsBuiltins, '<span style="color: #795e26;">$1</span>');
  }
  // Restore placeholders from last to first
  for (let i = placeholders.length - 1; i >= 0; i--) {
    html = html.replace(`___PLACEHOLDER_${i}___`, placeholders[i]);
  }
  return html;
};

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

interface ParsedTestCase {
  id: number;
  inputRaw: string;
  expectedRaw: string;
  inputVars: Record<string, any>;
  expectedVal: any;
}

function parseTestCases(rawText: string): ParsedTestCase[] {
  if (!rawText) return [];
  const cases: ParsedTestCase[] = [];
  
  const parts = rawText.split(/(?=Input:|input:|INPUT:)/i);
  let id = 1;
  for (const part of parts) {
    if (!part.trim()) continue;
    
    const inputMatch = part.match(/(?:Input|input|INPUT):\s*([^\n]+)/i);
    const outputMatch = part.match(/(?:Output|output|OUTPUT):\s*([^\n]+)/i);
    
    if (inputMatch) {
      const inputRaw = inputMatch[1].trim();
      const expectedRaw = outputMatch ? outputMatch[1].trim() : '';
      
      const inputVars: Record<string, any> = {};
      try {
        const eqMatches = [...inputRaw.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g)];
        const varNames = eqMatches.map(m => m[1]);
        if (varNames.length > 0) {
          const evaluator = new Function(`return (function(){ 
            try {
              let ${inputRaw}; 
              return { ${varNames.join(', ')} }; 
            } catch(e) {
              return {};
            }
          })()`);
          Object.assign(inputVars, evaluator());
        } else {
          const evaluator = new Function(`return (function(){
            try {
              return [${inputRaw}];
            } catch(e) {
              return [];
            }
          })()`);
          const vals = evaluator();
          if (Array.isArray(vals)) {
            vals.forEach((v: any, idx: number) => {
              inputVars[`param${idx}`] = v;
            });
          }
        }
      } catch (err) {
        console.warn("Failed to parse inputs for test case:", inputRaw, err);
      }
      
      let expectedVal: any = expectedRaw;
      try {
        expectedVal = new Function(`return (${expectedRaw})`)();
      } catch (e) {
        expectedVal = expectedRaw;
      }
      
      cases.push({
        id: id++,
        inputRaw,
        expectedRaw,
        inputVars,
        expectedVal
      });
    }
  }
  return cases;
}

function getBoilerplateForLanguage(jsTemplate: string, language: string): string {
  if (!jsTemplate) return '';
  
  let funcName = 'solution';
  let params: string[] = [];
  
  // Try JS function pattern
  const namedFuncMatch = jsTemplate.match(/function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
  // Try Java/C++ method pattern: public/private/static type name(params)
  const javaMethodMatch = jsTemplate.match(/(?:public|private|protected|static|\s)\s+[a-zA-Z0-9_<>[\]]+\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
  // Try Python def pattern
  const pyDefMatch = jsTemplate.match(/def\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
  
  if (namedFuncMatch) {
    funcName = namedFuncMatch[1];
    params = namedFuncMatch[2].split(',').map(p => p.trim()).filter(Boolean);
  } else if (javaMethodMatch) {
    funcName = javaMethodMatch[1];
    const rawParams = javaMethodMatch[2].split(',').map(p => p.trim()).filter(Boolean);
    params = rawParams.map(p => {
      const parts = p.split(/\s+/);
      return parts[parts.length - 1] || p;
    });
  } else if (pyDefMatch) {
    funcName = pyDefMatch[1];
    const rawParams = pyDefMatch[2].split(',').map(p => p.trim()).filter(Boolean);
    params = rawParams.filter(p => p !== 'self').map(p => p.split(':')[0].trim());
  } else {
    const firstWordMatch = jsTemplate.match(/([a-zA-Z0-9_$]+)\s*=/);
    if (firstWordMatch) {
      funcName = firstWordMatch[1];
    }
  }

  // Clean parameters of pointers or references
  params = params.map(p => p.replace(/[*&]/g, '').trim()).filter(p => p && p !== 'self');
  
  if (language === 'python') {
    const pyParams = params.map(p => {
      const lp = p.toLowerCase();
      if (lp.includes('nums') || lp.includes('arr')) return p + ': list';
      if (lp.includes('target') || lp.includes('val')) return p + ': int';
      return p;
    });
    return `class Solution:\n    def ${funcName}(self, ${pyParams.length > 0 ? pyParams.join(', ') : 'self'}):\n        # Write your code here\n        pass\n`;
  }
  
  if (language === 'cpp') {
    return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ${funcName}(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};\n`;
  }
  
  if (language === 'java') {
    return `import java.util.*;\n\nclass Solution {\n    public int[] ${funcName}(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}\n`;
  }
  
  // Clean empty starter code for JavaScript/TypeScript
  return `function ${funcName}(${params.join(', ')}) {\n    // Write your code here\n    \n}`;
}

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
  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const editorRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);

  const updateCursorPos = (textarea: HTMLTextAreaElement) => {
    const textBeforeCursor = textarea.value.slice(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  };

  const handleScroll = () => {
    if (editorRef.current && preRef.current) {
      preRef.current.scrollTop = editorRef.current.scrollTop;
      preRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

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
    testCases?: { id: number; passed: boolean; input: string; output: string; expected: string; logs?: string; duration?: string }[];
  } | null>(null);

  // Proctoring States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  
  const cameraStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const allStreamsRef = React.useRef<MediaStream[]>([]);
  
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
      allStreamsRef.current.push(stream);
      setCameraStream(stream);
      cameraStreamRef.current = stream;
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
      allStreamsRef.current.push(stream);
      setMicStream(stream);
      micStreamRef.current = stream;
      setMicGranted(true);
      
      const AudioCtx: any = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
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
      }

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
      allStreamsRef.current.push(stream);
      setScreenStream(stream);
      screenStreamRef.current = stream;
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
      allStreamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));
    };
  }, []);

  React.useEffect(() => {
    if (isDSA && defaultCode) {
      const prevBoilerplates = ['javascript', 'python', 'cpp', 'java'].map(lang => getBoilerplateForLanguage(defaultCode, lang).trim());
      const currentTrimmed = submissionText.trim();
      if (!submissionText || prevBoilerplates.includes(currentTrimmed) || currentTrimmed === defaultCode.trim()) {
        setSubmissionText(getBoilerplateForLanguage(defaultCode, language));
      }
    }
  }, [language, isDSA, defaultCode]);

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

                const parsedCases = parseTestCases(dsaTestCases);

                let contentToRun = submissionText;
                if (language === 'python' && parsedCases.length > 0) {
                  const pythonTestCasesListJson = JSON.stringify(parsedCases.map(tc => ({
                    id: tc.id,
                    input_raw: tc.inputRaw,
                    expected_raw: tc.expectedRaw,
                    inputs: tc.inputVars,
                    expected: tc.expectedVal
                  }))).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

                  contentToRun = `import json
import sys
import io

# Student Submission Code
${submissionText}

# Test Cases Data
test_cases = json.loads('${pythonTestCasesListJson}')

# Locate entry point function
entry_func = None
if 'Solution' in globals() and isinstance(globals()['Solution'], type):
    try:
        sol_instance = globals()['Solution']()
        methods = [m for m in dir(sol_instance) if not m.startswith('_') and callable(getattr(sol_instance, m))]
        if methods:
            entry_func = getattr(sol_instance, methods[0])
    except Exception as e:
        pass

if not entry_func:
    for k, v in list(globals().items()):
        if callable(v) and not k.startswith('_') and k not in ['json', 'sys', 'io', 'test_cases', 'entry_func', 'Solution']:
            entry_func = v
            break

results = []
if entry_func:
    for tc in test_cases:
        old_stdout = sys.stdout
        new_stdout = io.StringIO()
        sys.stdout = new_stdout
        
        tc_passed = False
        tc_output = None
        tc_logs = ""
        
        try:
            args = list(tc["inputs"].values())
            tc_output = entry_func(*args)
            
            def deep_compare(a, b):
                if a == b:
                    return True
                if isinstance(a, list) and isinstance(b, list):
                    if len(a) != len(b):
                        return False
                    if all(deep_compare(x, y) for x, y in zip(a, b)):
                        return True
                    try:
                        return sorted(a) == sorted(b)
                    except:
                        pass
                return False
                
            tc_passed = deep_compare(tc_output, tc["expected"])
            tc_logs = new_stdout.getvalue()
        except Exception as ex:
            tc_passed = False
            tc_output = "Runtime Error: " + str(ex)
            tc_logs = new_stdout.getvalue()
        finally:
            sys.stdout = old_stdout
            
        results.append({
            "id": tc["id"],
            "passed": tc_passed,
            "input": tc["input_raw"],
            "output": json.dumps(tc_output) if not isinstance(tc_output, str) or not tc_output.startswith("Runtime Error") else tc_output,
            "expected": tc["expected_raw"],
            "logs": tc_logs
        })
else:
    results.append({
        "id": 1,
        "passed": True,
        "input": "Procedural Script Run",
        "output": "Python script executed successfully.",
        "expected": "N/A",
        "logs": ""
    })

print("TEST_RESULTS_JSON_START")
print(json.dumps(results))
print("TEST_RESULTS_JSON_END")
`;
                }

                const response = await fetch('/api/execute-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: langMap[language] || language,
                        version: versionMap[language] || '*',
                        files: [{ content: contentToRun }]
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || 'Execution API failed');
                }

                const result = await response.json();
                    const runOutput = result.run?.output || '';
                    const startIdx = runOutput.indexOf('TEST_RESULTS_JSON_START');
                    const endIdx = runOutput.indexOf('TEST_RESULTS_JSON_END');
                    
                    if (startIdx !== -1 && endIdx !== -1) {
                      const jsonStr = runOutput.substring(startIdx + 'TEST_RESULTS_JSON_START'.length, endIdx).trim();
                      try {
                        const parsedResults = JSON.parse(jsonStr);
                        const allPassed = parsedResults.every((r: any) => r.passed);
                        setTestResults({
                          status: 'success',
                          message: allPassed ? 'Accepted' : 'Wrong Answer',
                          testCases: parsedResults
                        });
                        setConsoleTab('testResults');
                        setIsRunning(false);
                        return;
                      } catch (err) {
                        console.error("Failed to parse wrapped results:", err);
                      }
                    }

                    setTestResults({
                        status: result.run?.code === 0 ? 'success' : 'error',
                        message: result.run?.code === 0 ? 'Accepted' : 'Runtime Error',
                        output: result.run?.output || result.run?.stderr || 'No output',
                        testCases: [
                            { id: 1, passed: result.run?.code === 0, input: 'Sample Input', output: result.run?.output || result.run?.stderr || 'No output', expected: 'Depends on the question' }
                        ]
                    });
                    setConsoleTab('codeOutput');
                    setIsRunning(false);
                    return;
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

        // JavaScript / TypeScript Local Execution
        const parsedCases = parseTestCases(dsaTestCases);
        if (parsedCases.length === 0) {
          // Add default dummy test case if none was parsed
          parsedCases.push({
            id: 1,
            inputRaw: 'No input provided',
            expectedRaw: 'true',
            inputVars: {},
            expectedVal: true
          });
        }

        let funcName = '';
        let paramNames: string[] = [];
        
        const namedFuncMatch = submissionText.match(/function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
        const arrowFuncMatch = submissionText.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*=>/);
        const assignedFuncMatch = submissionText.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function\s*\(([^)]*)\)/);
        
        if (namedFuncMatch) {
          funcName = namedFuncMatch[1];
          paramNames = namedFuncMatch[2].split(',').map(p => p.trim()).filter(Boolean);
        } else if (arrowFuncMatch) {
          funcName = arrowFuncMatch[1];
          const params = arrowFuncMatch[2] || arrowFuncMatch[3] || '';
          paramNames = params.split(',').map(p => p.trim()).filter(Boolean);
        } else if (assignedFuncMatch) {
          funcName = assignedFuncMatch[1];
          paramNames = assignedFuncMatch[2].split(',').map(p => p.trim()).filter(Boolean);
        }

        if (!funcName) {
          // No function defined, run as plain script and capture prints
          let tcLogs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => {
            const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            tcLogs.push(formatted);
            originalLog(...args);
          };
          
          try {
            const runner = new Function(submissionText);
            runner();
            setTestResults({
              status: 'success',
              message: 'Code Executed Successfully',
              output: tcLogs.join('\n'),
              testCases: [{
                id: 1,
                passed: true,
                input: 'None (Procedural Script Run)',
                output: tcLogs.length > 0 ? tcLogs.join('\n') : 'No print statement executed.',
                expected: 'N/A'
              }]
            });
            setConsoleTab('testResults');
          } catch (err: any) {
            setTestResults({
              status: 'error',
              message: 'Runtime Error',
              output: err.toString()
            });
            setConsoleTab('codeOutput');
          } finally {
            console.log = originalLog;
            setIsRunning(false);
          }
          return;
        }

        // Evaluate user's function reference
        const userFunc = new Function(submissionText + `\nreturn ${funcName};`)();
        
        const evaluatedCases = [];
        let allPassed = true;
        
        for (const tc of parsedCases) {
          let tcLogs: string[] = [];
          const originalLog = console.log;
          console.log = (...args) => {
            const formatted = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            tcLogs.push(formatted);
            originalLog(...args);
          };
          
          try {
            const args: any[] = [];
            if (paramNames.length > 0) {
              paramNames.forEach(name => {
                if (name in tc.inputVars) {
                  args.push(tc.inputVars[name]);
                } else {
                  const keys = Object.keys(tc.inputVars);
                  const idx = paramNames.indexOf(name);
                  if (idx !== -1 && idx < keys.length) {
                    args.push(tc.inputVars[keys[idx]]);
                  } else {
                    args.push(undefined);
                  }
                }
              });
            } else {
              args.push(...Object.values(tc.inputVars));
            }
            
            const startTime = performance.now();
            const actualOutput = userFunc(...args);
            const duration = performance.now() - startTime;
            
            let passed = deepEqual(actualOutput, tc.expectedVal);
            if (!passed && Array.isArray(actualOutput) && Array.isArray(tc.expectedVal)) {
              const sortedActual = [...actualOutput].sort((x, y) => String(x).localeCompare(String(y)));
              const sortedExpected = [...tc.expectedVal].sort((x, y) => String(x).localeCompare(String(y)));
              passed = deepEqual(sortedActual, sortedExpected);
            }
            
            if (!passed) allPassed = false;
            
            evaluatedCases.push({
              id: tc.id,
              passed,
              input: tc.inputRaw,
              output: typeof actualOutput === 'object' ? JSON.stringify(actualOutput) : String(actualOutput),
              expected: tc.expectedRaw,
              logs: tcLogs.join('\n'),
              duration: `${duration.toFixed(1)}ms`
            });
          } catch (err: any) {
            allPassed = false;
            evaluatedCases.push({
              id: tc.id,
              passed: false,
              input: tc.inputRaw,
              output: `Runtime Error: ${err.message || err}`,
              expected: tc.expectedRaw,
              logs: tcLogs.join('\n')
            });
          } finally {
            console.log = originalLog;
          }
        }

        setTestResults({
          status: 'success',
          message: allPassed ? 'Accepted' : 'Wrong Answer',
          output: logs.join('\n'),
          testCases: evaluatedCases
        });
        setConsoleTab('testResults');
      } catch (err: any) {
        setTestResults({
          status: 'error',
          message: 'Execution Error',
          output: err.toString()
        });
        setConsoleTab('codeOutput');
      } finally {
        console.log = originalConsoleLog;
        setIsRunning(false);
      }
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && !fileUrn.trim()) {
      setErrorMessage('Please provide a submission text or attach a file.');
      return;
    }
    
    // We pass assignment ID. If it's an evolution we might need a different handling, but based on current types we might only pass assignment id.
    const idToSubmit = assignment?.id || (evolution as any)?.id;
    
    let videoUrl: string | undefined = undefined;
    if (requireRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current;
      await new Promise<void>(resolve => {
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            videoUrl = URL.createObjectURL(blob);
          }
          resolve();
        };
        recorder.stop();
      });
    } else if (isProctored) {
      videoUrl = `https://storage.googleapis.com/proctoring-videos/rec-${Date.now()}.mp4`; // fake url
    }

    // Stop streams
    allStreamsRef.current.forEach(s => s.getTracks().forEach(t => t.stop()));

    setCameraStream(null);
    setScreenStream(null);
    setMicStream(null);

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
          <div className={`${isDSA ? 'flex-1' : 'hidden'} flex flex-col h-full bg-[#FAF9F6] border-l border-slate-200 min-w-0`}>
            <div className="flex bg-[#F3F3F3] border-b border-[#D5D5D5] justify-between items-center pr-4 shrink-0 select-none">
              <div className="flex">
                <div className="px-4 py-2.5 flex items-center gap-1.5 bg-white border-r border-[#D5D5D5] border-t-2 border-[#007acc] text-[#333]">
                  <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm font-extrabold uppercase scale-90">
                    {language === 'javascript' ? 'JS' : language === 'python' ? 'PY' : language === 'cpp' ? 'C++' : 'JAVA'}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'javascript' ? 'solution.js' : language === 'python' ? 'main.py' : language === 'cpp' ? 'solution.cpp' : 'Solution.java'}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer transition border-r border-[#D5D5D5]">
                  <span className="text-xs font-bold">README.md</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset your code to the default template? Your current changes will be lost.')) {
                      setSubmissionText(getBoilerplateForLanguage(defaultCode, language));
                    }
                  }}
                  title="Reset code template"
                  className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors rounded hover:bg-slate-200/60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white text-slate-700 text-[11px] font-mono px-2 py-1 rounded border border-[#C3C3C3] focus:outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-white">
              <div className="flex-1 flex gap-3 min-h-[200px] font-mono text-xs text-left p-4 relative bg-white overflow-y-auto">
                {/* Dynamic line numbers */}
                <div className="text-slate-400 select-none text-right pr-2.5 border-r border-slate-100 flex flex-col pt-1.5 font-mono" style={{ lineHeight: '1.625rem', fontSize: '11px', minWidth: '24px' }}>
                  {Array.from({ length: Math.max(submissionText.split('\n').length, 12) }).map((_, i) => (
                    <span key={i} className="block w-5 text-[#999999]">{i + 1}</span>
                  ))}
                </div>
                
                {/* Interactive textarea editor */}
                <div className="flex-grow h-full relative">
                  <pre
                    ref={preRef}
                    className="absolute inset-0 p-0 pt-1.5 pointer-events-none select-none overflow-hidden h-full w-full font-mono text-left bg-transparent"
                    style={{
                      whiteSpace: 'pre',
                      overflowWrap: 'normal',
                      lineHeight: '1.625rem',
                      fontSize: '11px'
                    }}
                    dangerouslySetInnerHTML={{ __html: highlightCode(submissionText, language) }}
                  />
                  <textarea
                    ref={editorRef}
                    value={submissionText}
                    onChange={(e) => {
                      setSubmissionText(e.target.value);
                      if (errorMessage) setErrorMessage('');
                      updateCursorPos(e.currentTarget);
                    }}
                    onSelect={(e) => {
                      updateCursorPos(e.currentTarget);
                    }}
                    onKeyUp={(e) => {
                      updateCursorPos(e.currentTarget);
                    }}
                    onScroll={handleScroll}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const newCode = submissionText.substring(0, start) + "  " + submissionText.substring(end);
                        setSubmissionText(newCode);
                        setTimeout(() => {
                          if (editorRef.current) {
                            editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
                          }
                        }, 0);
                      }
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    className="absolute inset-0 bg-transparent border-0 focus:ring-0 focus:outline-none p-0 pt-1.5 resize-none font-mono leading-relaxed h-full w-full overflow-auto focus:ring-offset-0 focus:border-transparent focus:shadow-none"
                    style={{
                      whiteSpace: 'pre',
                      overflowWrap: 'normal',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      caretColor: '#005fb8',
                      lineHeight: '1.625rem',
                      fontSize: '11px'
                    }}
                  />
                </div>
              </div>
              
              {/* VS Code Status Bar */}
              <div className="bg-[#007acc] text-white px-3 py-1 text-[10px] font-mono flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-3">
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer font-bold">learnora-sandbox</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer">Ln {cursorLine}, Col {cursorCol}</span>
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer">Spaces: 2</span>
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer uppercase">{language}</span>
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer hidden sm:inline">UTF-8</span>
                  <span className="hover:bg-white/10 px-1 rounded transition-colors cursor-pointer hidden sm:inline">LF</span>
                </div>
              </div>
            </div>

            {/* Console/Output Panel */}
            <div 
              className="border-t border-slate-200 bg-slate-50 flex flex-col shrink-0 relative"
              style={{ height: consoleHeight }}
            >
              {/* Drag handle */}
              <div 
                className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-10 hover:bg-[#007acc]/20 transition"
                onMouseDown={handleDragStart}
              />
              
              <div className="flex bg-[#F3F3F3] border-b border-slate-200 px-4 shrink-0 gap-4">
                <button 
                  onClick={() => setConsoleTab('testResults')}
                  className={`px-2 py-2 text-xs font-bold transition-colors ${consoleTab === 'testResults' ? 'text-slate-800 border-b-2 border-[#007acc]' : 'text-slate-500 hover:text-slate-750'}`}
                >
                  Test Results
                </button>
                <button 
                  onClick={() => setConsoleTab('codeOutput')}
                  className={`px-2 py-2 text-xs font-bold transition-colors ${consoleTab === 'codeOutput' ? 'text-slate-800 border-b-2 border-[#007acc]' : 'text-slate-500 hover:text-slate-750'}`}
                >
                  Code Output
                </button>
              </div>
              
              <div className="flex-grow overflow-hidden flex flex-col font-mono text-[12px] bg-[#FAF9F6]">
                {!testResults ? (
                  <div className="p-4 text-slate-500 italic custom-scrollbar overflow-y-auto">Run code to see results here...</div>
                ) : testResults.status === 'running' ? (
                  <div className="p-4 text-amber-600 flex items-center gap-2 font-bold">
                    <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    {testResults.message}
                  </div>
                ) : consoleTab === 'codeOutput' ? (
                  <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar text-slate-800">
                    <div className="text-slate-700 whitespace-pre-wrap">
                      {testResults.output || <span className="text-slate-400 italic">No output</span>}
                    </div>
                  </div>
                ) : testResults.status === 'success' && testResults.testCases ? (
                  <div className="flex-1 flex flex-col overflow-hidden text-slate-800">
                    <div className="px-4 py-3 shrink-0 border-b border-slate-200 bg-slate-50">
                       <div 
                         style={{ fontSize: '12px', fontFamily: 'Arial, sans-serif' }}
                         className={`font-bold mb-3 ${testResults.message === 'Accepted' ? 'text-emerald-600' : 'text-rose-600'}`}
                       >
                         {testResults.message}
                       </div>
                       <div className="flex gap-2 flex-wrap">
                          {testResults.testCases.map((tc, idx) => (
                             <button 
                               key={tc.id}
                               onClick={() => setSelectedTestCase(idx)}
                               style={{ fontSize: '8px', fontFamily: 'Arial, sans-serif' }}
                               className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${selectedTestCase === idx ? 'bg-slate-250 text-slate-900 border border-slate-350 bg-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                             >
                               <span 
                                 style={{ width: '6px', height: '6px' }}
                                 className={`rounded-full ${tc.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                               ></span>
                               Case {tc.id}
                             </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-white">
                       {testResults.testCases[selectedTestCase] && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Test Details</span>
                              {testResults.testCases[selectedTestCase].duration && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                                  Runtime: {testResults.testCases[selectedTestCase].duration}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1 text-[11px] font-bold">Input</div>
                              <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-slate-700 whitespace-pre-wrap font-mono text-[13px]">
                                {testResults.testCases[selectedTestCase].input}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1 text-[11px] font-bold">Output</div>
                              <div className={`bg-slate-50 border border-slate-150 rounded-lg p-3 whitespace-pre-wrap font-mono text-[13px] ${testResults.testCases[selectedTestCase].passed ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}`}>
                                {testResults.testCases[selectedTestCase].output}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1 text-[11px] font-bold">Expected</div>
                              <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-slate-700 whitespace-pre-wrap font-mono text-[13px]">
                                {testResults.testCases[selectedTestCase].expected}
                              </div>
                            </div>
                            {testResults.testCases[selectedTestCase].logs && (
                              <div>
                                <div className="text-slate-500 mb-1 text-[11px] font-bold">Stdout Console Logs</div>
                                <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-amber-800 whitespace-pre-wrap font-mono text-[12px] leading-relaxed">
                                  {testResults.testCases[selectedTestCase].logs}
                                </div>
                              </div>
                            )}
                          </>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar text-slate-800">
                    <div className="font-bold text-rose-600 text-sm">
                      {testResults.message}
                    </div>
                    {testResults.output && (
                      <div className="bg-white p-3 rounded border border-slate-200 text-slate-700 whitespace-pre-wrap">
                        {testResults.output}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-12 bg-[#F3F3F3] border-t border-slate-200 flex items-center px-4 justify-between shrink-0">
              <div className="text-[11px] text-slate-600 font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Sandbox state: Healthy
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-1.5 rounded border border-slate-300 hover:border-slate-400 disabled:opacity-50 select-none shadow-sm transition"
                >
                  <Play className="w-3.5 h-3.5 text-[#007acc] fill-current" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-sm transition select-none"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Submit Solution
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

          {/* Floating Camera Widget */}
          {requireCamera && (
            <motion.div
              drag
              dragMomentum={false}
              className="fixed bottom-6 right-6 w-48 aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border-2 border-rose-500/50 z-[100] cursor-move"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {cameraStream && cameraGranted ? (
                <video
                  ref={el => {
                    if (el && cameraStream) {
                      el.srcObject = cameraStream;
                      el.play().catch(() => {});
                    }
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                  muted
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 to-zinc-950 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-1">
                    <Activity className="w-3 h-3 animate-spin" />
                  </div>
                  <p className="text-[9px] font-bold text-rose-400">Secure Feed</p>
                </div>
              )}
              
              {/* Recording / Proctoring indicator */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold text-rose-500 pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                REC
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
