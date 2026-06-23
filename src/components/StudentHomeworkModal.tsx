import React, { useState } from 'react';
import { StudentAssignment, StudentEvolution } from '../types';
import { motion } from 'motion/react';
import { X, CheckCircle, FileText, Code, Send, Layout, PenTool, LayoutTemplate, Activity } from 'lucide-react';

interface StudentHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: StudentAssignment;
  evolution?: StudentEvolution;
  onSubmit: (assignmentId: string, submissionText: string, fileUrn?: string) => void;
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

  if (!isOpen || (!assignment && !evolution)) return null;

  const itemTitle = assignment?.title || 'Evolution Exam';
  const itemDesc = assignment?.description || '';
  const isDSA = assignment?.questionType === 'dsa';
  
  const dsaQuestion = assignment?.dsaQuestion || '';
  const dsaConstraints = assignment?.dsaConstraints || '';
  const dsaTestCases = assignment?.dsaTestCases || '';
  const defaultCode = assignment?.dsaTemplateCode || '';

  // Initialize workspace with template if empty and is DSA
  React.useEffect(() => {
    if (isDSA && !submissionText && defaultCode) {
      setSubmissionText(defaultCode);
    }
  }, [isDSA, defaultCode, submissionText]);

  const handleSubmit = () => {
    if (!submissionText.trim() && !fileUrn.trim()) {
      setErrorMessage('Please provide a submission text or attach a file.');
      return;
    }
    
    // We pass assignment ID. If it's an evolution we might need a different handling, but based on current types we might only pass assignment id.
    const idToSubmit = assignment?.id || (evolution as any)?.id;
    onSubmit(idToSubmit, submissionText, fileUrn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0c0d12]">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full flex flex-col"
      >
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
          <div className={`${isDSA ? 'md:w-1/2 lg:w-5/12 border-b md:border-b-0 md:border-r' : 'w-full max-w-4xl mx-auto border-x'} bg-white dark:bg-[#161618] border-slate-200 dark:border-white/10 flex flex-col h-full`}>
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

          {/* Right Pane: Code Editor / Submission */}
          <div className={`${isDSA ? 'md:w-1/2 lg:w-7/12' : 'hidden'} flex flex-col h-full bg-[#1e1e1e] border-l border-zinc-800`}>
            <div className="flex bg-[#252526] border-b border-[#303030]">
              <div className="px-4 py-2.5 text-xs font-bold flex items-center gap-2 bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-500">
                <Code className="w-4 h-4" /> Code Solution
              </div>
            </div>
            
            <div className="flex-1 p-0 relative">
              <textarea
                spellCheck="false"
                className="absolute inset-0 w-full h-full p-6 text-[13px] bg-transparent text-slate-300 focus:outline-none resize-none font-mono leading-relaxed custom-scrollbar selection:bg-indigo-500/30"
                value={submissionText}
                onChange={(e) => {
                  setSubmissionText(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </div>
            <div className="h-10 bg-[#007acc] flex items-center px-4 justify-between">
              <div className="text-[11px] text-white/80 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Environment Ready
              </div>
              <button 
                onClick={handleSubmit}
                className="text-white text-[11px] font-bold tracking-wider uppercase hover:text-emerald-100 transition"
              >
                Run & Submit
              </button>
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

        </div>
      </motion.div>
    </div>
  );
}
