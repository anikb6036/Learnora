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
  const [activeTab, setActiveTab] = useState<'instruction' | 'workspace'>('instruction');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-[#0c0d12] w-full h-full shadow-2xl overflow-hidden flex flex-col border-none"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {isDSA ? <Code className="w-5 h-5" /> : assignment ? <FileText className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{itemTitle}</h2>
              <div className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                {assignment ? `Due Date: ${assignment.dueDate} | Max Points: ${assignment.maxPoints}` : 'Continuous Evolution Evaluation'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-200 dark:bg-zinc-800 rounded-lg mr-2 border border-slate-300 dark:border-white/5">
              <button 
                onClick={() => setActiveTab('instruction')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'instruction' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" /> Instructions
              </button>
              <button 
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'workspace' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-zinc-300'}`}
              >
                <PenTool className="w-3.5 h-3.5" /> Workspace Base
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-zinc-950">
          {activeTab === 'instruction' && (
            <div className="absolute inset-0 overflow-y-auto outline-none p-6 md:p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-indigo-500">Task Overview</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {itemDesc || 'No general description provided.'}
                  </div>
                </div>

                {isDSA && (
                  <>
                    <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-indigo-500">Problem Statement</h3>
                      <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-line font-mono bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        {dsaQuestion || 'No specific problem statement provided.'}
                      </div>
                    </div>
                    
                    {(dsaConstraints || dsaTestCases) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dsaConstraints && (
                          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-amber-500">Constraints</h3>
                            <div className="text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-line font-mono bg-amber-50 dark:bg-amber-500/5 p-3 rounded-lg border border-amber-100 dark:border-amber-500/10">
                              {dsaConstraints}
                            </div>
                          </div>
                        )}
                        {dsaTestCases && (
                          <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-emerald-500">Test Cases</h3>
                            <div className="text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-line font-mono bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/10">
                              {dsaTestCases}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setActiveTab('workspace')}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    Proceed to Workspace <Layout className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="absolute inset-0 flex flex-col p-4 md:p-6 pb-20">
              <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    {errorMessage}
                  </div>
                )}
                
                <div className="flex-1 flex flex-col bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden mb-4">
                  <div className="p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900 flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 pl-1 flex items-center gap-2">
                      <Code className="w-4 h-4" /> {isDSA ? 'Code Editor' : 'Submission Text'}
                    </label>
                  </div>
                  <textarea
                    placeholder={isDSA ? "// Write your code implementation here..." : "Type your structured solution answers here..."}
                    className="flex-1 w-full p-4 text-sm bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none resize-none font-mono leading-relaxed"
                    value={submissionText}
                    onChange={(e) => {
                      setSubmissionText(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                  />
                </div>

                <div className="bg-white dark:bg-[#161618] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
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
            </div>
          )}
        </div>
        
        {/* Footer */}
        {activeTab === 'workspace' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c0d12] flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" /> Submit Processing
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
