import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Send,
  AlertCircle,
  Clock,
  Filter,
  X,
  Database,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Course, StudentBatch, EvolutionBankItem, StudentEvolution, UserAccount, AppNotification } from '../types';

interface DSAProblem {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string;
  testCases: string;
  starterCode: string;
}

const EASY_PROBLEMS: DSAProblem[] = [
  {
    title: "1. Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    testCases: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
    starterCode: "function twoSum(nums, target) {\n    // Write your JavaScript solution here\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}"
  },
  {
    title: "20. Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    testCases: "Input: s = \"()[]{}\"\nOutput: true\n\nInput: s = \"(]\"\nOutput: false",
    starterCode: "function isValid(s) {\n    // Write your JavaScript solution here\n    const stack = [];\n    const pairs = { ')': '(', '}': '{', ']': '[' };\n    for (let char of s) {\n        if (char === '(' || char === '{' || char === '[') {\n            stack.push(char);\n        } else {\n            if (stack.pop() !== pairs[char]) return false;\n        }\n    }\n    return stack.length === 0;\n}"
  },
  {
    title: "121. Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.",
    constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    testCases: "Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
    starterCode: "function maxProfit(prices) {\n    // Write your JavaScript solution here\n    let minPrice = Infinity;\n    let maxProfit = 0;\n    for (let price of prices) {\n        if (price < minPrice) {\n            minPrice = price;\n        } else if (price - minPrice > maxProfit) {\n            maxProfit = price - minPrice;\n        }\n    }\n    return maxProfit;\n}"
  }
];

const MEDIUM_PROBLEMS: DSAProblem[] = [
  {
    title: "3. Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: "Given a string `s`, find the length of the **longest substring** without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    testCases: "Input: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
    starterCode: "function lengthOfLongestSubstring(s) {\n    // Write your JavaScript solution here\n    let maxLen = 0;\n    let start = 0;\n    const seen = new Map();\n    for (let end = 0; end < s.length; end++) {\n        if (seen.has(s[end])) {\n            start = Math.max(start, seen.get(s[end]) + 1);\n        }\n        seen.set(s[end], end);\n        maxLen = Math.max(maxLen, end - start + 1);\n    }\n    return maxLen;\n}"
  },
  {
    title: "11. Container With Most Water",
    difficulty: "Medium",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn *the maximum amount of water a container can store*.",
    constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    testCases: "Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: The max area is formed between 8 and 7, width is 7, height is 7, area = 49.",
    starterCode: "function maxArea(height) {\n    // Write your JavaScript solution here\n    let maxVal = 0;\n    let left = 0, right = height.length - 1;\n    while (left < right) {\n        const currentHeight = Math.min(height[left], height[right]);\n        maxVal = Math.max(maxVal, currentHeight * (right - left));\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return maxVal;\n}"
  },
  {
    title: "15. 3Sum",
    difficulty: "Medium",
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] === 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    testCases: "Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]",
    starterCode: "function threeSum(nums) {\n    // Write your JavaScript solution here\n    nums.sort((a,b) => a - b);\n    const result = [];\n    for (let i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] === nums[i - 1]) continue;\n        let left = i + 1, right = nums.length - 1;\n        while (left < right) {\n            const sum = nums[i] + nums[left] + nums[right];\n            if (sum === 0) {\n                result.push([nums[i], nums[left], nums[right]]);\n                while (left < right && nums[left] === nums[left + 1]) left++;\n                while (left < right && nums[right] === nums[right - 1]) right--;\n                left++; right--;\n            } else if (sum < 0) left++;\n            else right--;\n        }\n    }\n    return result;\n}"
  }
];

const HARD_PROBLEMS: DSAProblem[] = [
  {
    title: "42. Trapping Rain Water",
    difficulty: "Hard",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    testCases: "Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\nExplanation: 6 units of rain water are being trapped.",
    starterCode: "function trap(height) {\n    // Write your JavaScript solution here\n    let left = 0, right = height.length - 1;\n    let leftMax = 0, rightMax = 0;\n    let ans = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            if (height[left] >= leftMax) leftMax = height[left];\n            else ans += leftMax - height[left];\n            left++;\n        } else {\n            if (height[right] >= rightMax) rightMax = height[right];\n            else ans += rightMax - height[right];\n            right--;\n        }\n    }\n    return ans;\n}"
  },
  {
    title: "4. Median of Two Sorted Arrays",
    difficulty: "Hard",
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return **the median** of the two sorted arrays.\n\nThe overall run time complexity should be `O(log (m+n))`.",
    constraints: "nums1.length == m, nums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000",
    testCases: "Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.",
    starterCode: "function findMedianSortedArrays(nums1, nums2) {\n    // Write your JavaScript solution here\n    const merged = [...nums1, ...nums2].sort((a,b) => a - b);\n    const len = merged.length;\n    if (len % 2 === 0) {\n        return (merged[len/2 - 1] + merged[len/2]) / 2;\n    } else {\n        return merged[Math.floor(len/2)];\n    }\n}"
  }
];

interface EvolutionPipelineProps {
  currentUser: UserAccount;
  courses: Course[];
  batches: StudentBatch[];
  evolutionBank: EvolutionBankItem[];
  setEvolutionBank: React.Dispatch<React.SetStateAction<EvolutionBankItem[]>>;
  studentEvolutions: StudentEvolution[];
  setStudentEvolutions: React.Dispatch<React.SetStateAction<StudentEvolution[]>>;
  users: UserAccount[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onSendEmail?: (to: string, subject: string, body: string, fromOverride?: string) => void;
}

export const EvolutionPipeline: React.FC<EvolutionPipelineProps> = ({
  currentUser,
  courses,
  batches,
  evolutionBank,
  setEvolutionBank,
  studentEvolutions,
  setStudentEvolutions,
  users,
  setNotifications,
  onSendEmail
}) => {
  // Tab control: 'bank' | 'pipeline' | 'template-form'
  const [pipelineTab, setPipelineTab] = useState<'bank' | 'pipeline' | 'template-form'>('bank');

  // Bank search/filters
  const [bankSearch, setBankSearch] = useState('');
  const [bankCourseFilter, setBankCourseFilter] = useState('all');

  // Parameters for Auto Building DSA Questions
  const [w1Diff, setW1Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w1Count, setW1Count] = useState<number>(1);
  const [w2Diff, setW2Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w2Count, setW2Count] = useState<number>(1);
  const [w3Diff, setW3Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w3Count, setW3Count] = useState<number>(1);
  const [w4Diff, setW4Diff] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [w4Count, setW4Count] = useState<number>(1);

  const handleAutoGenerateDSA = (weekNum: number, diff: 'Easy' | 'Medium' | 'Hard', count: number) => {
    const pool = diff === 'Easy' ? EASY_PROBLEMS : diff === 'Medium' ? MEDIUM_PROBLEMS : HARD_PROBLEMS;
    const selected: DSAProblem[] = [];
    for (let i = 0; i < count; i++) {
      const problem = pool[i % pool.length];
      selected.push(problem);
    }

    const titles = selected.map(p => p.title.replace(/^\d+\.\s*/, '')).join(' & ');
    let combinedQuestion = `### Coding Challenge: ${titles}\n\n`;
    combinedQuestion += `Difficulty: **${diff}** | Target Problems: ${count}\n\n`;
    
    if (selected.length === 1) {
      combinedQuestion += `\n${selected[0].description}`;
    } else {
      selected.forEach((p, idx) => {
        combinedQuestion += `#### Problem ${idx + 1}: ${p.title}\n${p.description}\n\n---\n\n`;
      });
    }

    let combinedConstraints = '';
    if (selected.length === 1) {
      combinedConstraints = selected[0].constraints;
    } else {
      selected.forEach((p, idx) => {
        combinedConstraints += `[Problem ${idx + 1}]\n${p.constraints}\n\n`;
      });
    }

    let combinedTestCases = '';
    if (selected.length === 1) {
      combinedTestCases = selected[0].testCases;
    } else {
      selected.forEach((p, idx) => {
        combinedTestCases += `[Problem ${idx + 1}]\n${p.testCases}\n\n`;
      });
    }

    let combinedTemplate = '';
    if (selected.length === 1) {
      combinedTemplate = selected[0].starterCode;
    } else {
      combinedTemplate = `// Multi-problem Workspace: ${titles}\n\n`;
      selected.forEach((p, idx) => {
        combinedTemplate += `// --- PROBLEM ${idx + 1}: ${p.title} ---\n${p.starterCode}\n\n`;
      });
    }

    const firstTitleToken = selected[0].title.replace(/^\d+\.\s*/, '');
    const titleVal = `DSA Milestone - ${diff} Set (${firstTitleToken}${count > 1 ? ' + ' + (count - 1) + ' more' : ''})`;
    const descVal = `Solve ${count} ${diff} challenge${count > 1 ? 's' : ''} covering classic DSA patterns: ${titles}. Prove implementation correctness, efficiency, and pass constraints.`;

    if (weekNum === 1) {
      setCWeek1Title(titleVal);
      setCWeek1Desc(descVal);
      setCWeek1Question(combinedQuestion);
      setCWeek1Constraints(combinedConstraints.trim());
      setCWeek1TestCases(combinedTestCases.trim());
      setCWeek1TemplateCode(combinedTemplate);
    } else if (weekNum === 2) {
      setCWeek2Title(titleVal);
      setCWeek2Desc(descVal);
      setCWeek2Question(combinedQuestion);
      setCWeek2Constraints(combinedConstraints.trim());
      setCWeek2TestCases(combinedTestCases.trim());
      setCWeek2TemplateCode(combinedTemplate);
    } else if (weekNum === 3) {
      setCWeek3Title(titleVal);
      setCWeek3Desc(descVal);
      setCWeek3Question(combinedQuestion);
      setCWeek3Constraints(combinedConstraints.trim());
      setCWeek3TestCases(combinedTestCases.trim());
      setCWeek3TemplateCode(combinedTemplate);
    } else if (weekNum === 4) {
      setCWeek4Title(titleVal);
      setCWeek4Desc(descVal);
      setCWeek4Question(combinedQuestion);
      setCWeek4Constraints(combinedConstraints.trim());
      setCWeek4TestCases(combinedTestCases.trim());
      setCWeek4TemplateCode(combinedTemplate);
    }
  };

  const renderDSAGenerator = (weekNum: number, formType: 'template' | 'custom') => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-slate-100/60 dark:bg-zinc-950/60 rounded-xl border border-slate-200/40 dark:border-white/5 mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Auto-Create Question:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
            const pool = diff === 'Easy' ? EASY_PROBLEMS : diff === 'Medium' ? MEDIUM_PROBLEMS : HARD_PROBLEMS;
            return (
              <div key={diff} className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200/65 dark:border-white/5 pl-2 pr-1 py-0.5 rounded-lg shadow-2xs">
                <button
                  type="button"
                  title={`Load a random ${diff} question`}
                  onClick={() => {
                    const prob = pool[Math.floor(Math.random() * pool.length)];
                    if (formType === 'template') {
                      if (weekNum === 1) {
                        setTWeek1Question(prob.description);
                        setTWeek1Constraints(prob.constraints);
                        setTWeek1TestCases(prob.testCases);
                        setTWeek1TemplateCode(prob.starterCode);
                        setTWeek1Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek1Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 2) {
                        setTWeek2Question(prob.description);
                        setTWeek2Constraints(prob.constraints);
                        setTWeek2TestCases(prob.testCases);
                        setTWeek2TemplateCode(prob.starterCode);
                        setTWeek2Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek2Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 3) {
                        setTWeek3Question(prob.description);
                        setTWeek3Constraints(prob.constraints);
                        setTWeek3TestCases(prob.testCases);
                        setTWeek3TemplateCode(prob.starterCode);
                        setTWeek3Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek3Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 4) {
                        setTWeek4Question(prob.description);
                        setTWeek4Constraints(prob.constraints);
                        setTWeek4TestCases(prob.testCases);
                        setTWeek4TemplateCode(prob.starterCode);
                        setTWeek4Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek4Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      }
                    } else {
                      if (weekNum === 1) {
                        setCWeek1Question(prob.description);
                        setCWeek1Constraints(prob.constraints);
                        setCWeek1TestCases(prob.testCases);
                        setCWeek1TemplateCode(prob.starterCode);
                        setCWeek1Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek1Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 2) {
                        setCWeek2Question(prob.description);
                        setCWeek2Constraints(prob.constraints);
                        setCWeek2TestCases(prob.testCases);
                        setCWeek2TemplateCode(prob.starterCode);
                        setCWeek2Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek2Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 3) {
                        setCWeek3Question(prob.description);
                        setCWeek3Constraints(prob.constraints);
                        setCWeek3TestCases(prob.testCases);
                        setCWeek3TemplateCode(prob.starterCode);
                        setCWeek3Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek3Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 4) {
                        setCWeek4Question(prob.description);
                        setCWeek4Constraints(prob.constraints);
                        setCWeek4TestCases(prob.testCases);
                        setCWeek4TemplateCode(prob.starterCode);
                        setCWeek4Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek4Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      }
                    }
                  }}
                  className={`text-[9.5px] font-bold cursor-pointer hover:underline ${
                    diff === 'Easy' ? 'text-emerald-600 dark:text-emerald-400' :
                    diff === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                    'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {diff === 'Easy' ? 'Simple' : diff}
                </button>
                <div className="w-[1px] h-2.5 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <select
                  className="bg-transparent border-0 text-[9.5px] p-0 focus:ring-0 cursor-pointer max-w-[110px] text-slate-650 dark:text-zinc-400 font-medium"
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    if (isNaN(idx)) return;
                    const prob = pool[idx];
                    if (formType === 'template') {
                      if (weekNum === 1) {
                        setTWeek1Question(prob.description);
                        setTWeek1Constraints(prob.constraints);
                        setTWeek1TestCases(prob.testCases);
                        setTWeek1TemplateCode(prob.starterCode);
                        setTWeek1Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek1Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 2) {
                        setTWeek2Question(prob.description);
                        setTWeek2Constraints(prob.constraints);
                        setTWeek2TestCases(prob.testCases);
                        setTWeek2TemplateCode(prob.starterCode);
                        setTWeek2Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek2Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 3) {
                        setTWeek3Question(prob.description);
                        setTWeek3Constraints(prob.constraints);
                        setTWeek3TestCases(prob.testCases);
                        setTWeek3TemplateCode(prob.starterCode);
                        setTWeek3Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek3Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 4) {
                        setTWeek4Question(prob.description);
                        setTWeek4Constraints(prob.constraints);
                        setTWeek4TestCases(prob.testCases);
                        setTWeek4TemplateCode(prob.starterCode);
                        setTWeek4Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setTWeek4Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      }
                    } else {
                      if (weekNum === 1) {
                        setCWeek1Question(prob.description);
                        setCWeek1Constraints(prob.constraints);
                        setCWeek1TestCases(prob.testCases);
                        setCWeek1TemplateCode(prob.starterCode);
                        setCWeek1Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek1Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 2) {
                        setCWeek2Question(prob.description);
                        setCWeek2Constraints(prob.constraints);
                        setCWeek2TestCases(prob.testCases);
                        setCWeek2TemplateCode(prob.starterCode);
                        setCWeek2Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek2Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 3) {
                        setCWeek3Question(prob.description);
                        setCWeek3Constraints(prob.constraints);
                        setCWeek3TestCases(prob.testCases);
                        setCWeek3TemplateCode(prob.starterCode);
                        setCWeek3Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek3Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      } else if (weekNum === 4) {
                        setCWeek4Question(prob.description);
                        setCWeek4Constraints(prob.constraints);
                        setCWeek4TestCases(prob.testCases);
                        setCWeek4TemplateCode(prob.starterCode);
                        setCWeek4Title(`DSA Milestone: ${prob.title.replace(/^\d+\.\s*/, '')}`);
                        setCWeek4Desc(`Solve ${prob.title} challenge covering classic DSA patterns.`);
                      }
                    }
                    // Reset selection
                    e.target.value = "";
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Choose...</option>
                  {pool.map((prob, index) => (
                    <option key={prob.title} value={index}>
                      {prob.title}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Multi-step Pipeline (Deploy evolution) states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedBankTemplateId, setSelectedBankTemplateId] = useState('');
  
  // Custom 4 Weeks Fields
  const [useCustomWeeks, setUseCustomWeeks] = useState(false);
  const [cWeek1Title, setCWeek1Title] = useState('Evolution 1 (Week 1)');
  const [cWeek1Desc, setCWeek1Desc] = useState('');
  const [cWeek2Title, setCWeek2Title] = useState('Evolution 2 (Week 2)');
  const [cWeek2Desc, setCWeek2Desc] = useState('');
  const [cWeek3Title, setCWeek3Title] = useState('Evolution 3 (Week 3)');
  const [cWeek3Desc, setCWeek3Desc] = useState('');
  const [cWeek4Title, setCWeek4Title] = useState('Evolution 4 (Week 4)');
  const [cWeek4Desc, setCWeek4Desc] = useState('');

  // Custom 4 Weeks weekly evaluation type details
  const [cWeek1Type, setCWeek1Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek1Question, setCWeek1Question] = useState('');
  const [cWeek1Constraints, setCWeek1Constraints] = useState('');
  const [cWeek1TestCases, setCWeek1TestCases] = useState('');
  const [cWeek1TemplateCode, setCWeek1TemplateCode] = useState('');

  const [cWeek2Type, setCWeek2Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek2Question, setCWeek2Question] = useState('');
  const [cWeek2Constraints, setCWeek2Constraints] = useState('');
  const [cWeek2TestCases, setCWeek2TestCases] = useState('');
  const [cWeek2TemplateCode, setCWeek2TemplateCode] = useState('');

  const [cWeek3Type, setCWeek3Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek3Question, setCWeek3Question] = useState('');
  const [cWeek3Constraints, setCWeek3Constraints] = useState('');
  const [cWeek3TestCases, setCWeek3TestCases] = useState('');
  const [cWeek3TemplateCode, setCWeek3TemplateCode] = useState('');

  const [cWeek4Type, setCWeek4Type] = useState<'dsa' | 'instruction'>('instruction');
  const [cWeek4Question, setCWeek4Question] = useState('');
  const [cWeek4Constraints, setCWeek4Constraints] = useState('');
  const [cWeek4TestCases, setCWeek4TestCases] = useState('');
  const [cWeek4TemplateCode, setCWeek4TemplateCode] = useState('');

  const [pipelineSuccessMsg, setPipelineSuccessMsg] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Add/Edit Bank Template modal states
  const [editingTemplate, setEditingTemplate] = useState<EvolutionBankItem | null>(null);
  
  // Template Form Fields
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCourse, setTemplateCourse] = useState('');
  const [templateMonth, setTemplateMonth] = useState<number>(1);
  const [tWeek1Title, setTWeek1Title] = useState('Evolution 1 (Week 1)');
  const [tWeek1Desc, setTWeek1Desc] = useState('');
  const [tWeek2Title, setTWeek2Title] = useState('Evolution 2 (Week 2)');
  const [tWeek2Desc, setTWeek2Desc] = useState('');
  const [tWeek3Title, setTWeek3Title] = useState('Evolution 3 (Week 3)');
  const [tWeek3Desc, setTWeek3Desc] = useState('');
  const [tWeek4Title, setTWeek4Title] = useState('Evolution 4 (Week 4)');
  const [tWeek4Desc, setTWeek4Desc] = useState('');

  // Weekly evaluation type states
  const [tWeek1Type, setTWeek1Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek1Question, setTWeek1Question] = useState('');
  const [tWeek1Constraints, setTWeek1Constraints] = useState('');
  const [tWeek1TestCases, setTWeek1TestCases] = useState('');
  const [tWeek1TemplateCode, setTWeek1TemplateCode] = useState('');

  const [tWeek2Type, setTWeek2Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek2Question, setTWeek2Question] = useState('');
  const [tWeek2Constraints, setTWeek2Constraints] = useState('');
  const [tWeek2TestCases, setTWeek2TestCases] = useState('');
  const [tWeek2TemplateCode, setTWeek2TemplateCode] = useState('');

  const [tWeek3Type, setTWeek3Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek3Question, setTWeek3Question] = useState('');
  const [tWeek3Constraints, setTWeek3Constraints] = useState('');
  const [tWeek3TestCases, setTWeek3TestCases] = useState('');
  const [tWeek3TemplateCode, setTWeek3TemplateCode] = useState('');

  const [tWeek4Type, setTWeek4Type] = useState<'dsa' | 'instruction'>('instruction');
  const [tWeek4Question, setTWeek4Question] = useState('');
  const [tWeek4Constraints, setTWeek4Constraints] = useState('');
  const [tWeek4TestCases, setTWeek4TestCases] = useState('');
  const [tWeek4TemplateCode, setTWeek4TemplateCode] = useState('');

  const [validationError, setValidationError] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [publishTargetBatch, setPublishTargetBatch] = useState('All');

  const areBatchesEquivalent = (batchA: string | undefined, batchB: string | undefined): boolean => {
    if (!batchA || !batchB) return false;
    const a = batchA.toLowerCase().trim();
    const b = batchB.toLowerCase().trim();
    if (a === b) return true;
    
    const map: Record<string, string[]> = {
      'stb_001': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'stb_002': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'stb_003': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'stb_004': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
      'stb_005': ['stb_005', 'batch e', 'batch-5', 'batch_e'],
      'stb_006': ['stb_006', 'batch f', 'batch-6', 'batch_f'],
      'batch a': ['stb_001', 'batch a', 'batch-1', 'batch_a'],
      'batch b': ['stb_002', 'batch b', 'batch-2', 'batch_b'],
      'batch c': ['stb_003', 'batch c', 'batch-3', 'batch_c'],
      'batch d': ['stb_004', 'batch d', 'batch-4', 'batch_d'],
      'batch e': ['stb_005', 'batch e', 'batch-5', 'batch_e'],
      'batch f': ['stb_006', 'batch f', 'batch-6', 'batch_f'],
    };
    
    return !!(map[a] && map[a].includes(b));
  };

  const getBatchesForCourse = (courseName: string): StudentBatch[] => {
    if (!courseName) return [];
    const courseObj = courses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
    const courseBatchNumber = courseObj?.batchNumber;

    const enrolledStudentBatches = new Set<string>(
      users
        .filter(u => u.role === 'student' && u.course && u.course.toLowerCase() === courseName.toLowerCase() && u.batch)
        .map(u => u.batch as string)
    );

    const filtered = batches.filter(b => {
      if (b.status === 'completed') return false;
      const bNameLower = b.name.toLowerCase();
      const bIdLower = b.id.toLowerCase();

      // Explicitly ignore completed placeholder batch-3 / stb_003 / Batch C
      if (bIdLower === 'batch-3' || bNameLower === 'stb_003' || bNameLower === 'batch c') {
        return false;
      }

      const matchesCourseBatch = courseBatchNumber && (
        bNameLower === courseBatchNumber.toLowerCase() ||
        bIdLower === courseBatchNumber.toLowerCase() ||
        areBatchesEquivalent(b.name, courseBatchNumber) ||
        areBatchesEquivalent(b.id, courseBatchNumber)
      );

      const matchesStudentEnrollment = (Array.from(enrolledStudentBatches) as string[]).some(studentBatchName => 
        bNameLower === studentBatchName.toLowerCase() ||
        bIdLower === studentBatchName.toLowerCase() ||
        areBatchesEquivalent(b.name, studentBatchName) ||
        areBatchesEquivalent(b.id, studentBatchName)
      );

      return matchesCourseBatch || matchesStudentEnrollment;
    });

    if (filtered.length > 0) return filtered;

    // Fallback: Return all non-completed/active batches so that it is never empty and the user can select/publish!
    return batches.filter(b => {
      if (b.status === 'completed') return false;
      const bNameLower = b.name.toLowerCase();
      const bIdLower = b.id.toLowerCase();
      if (bIdLower === 'batch-3' || bNameLower === 'stb_003' || bNameLower === 'batch c') {
        return false;
      }
      return true;
    });
  };

  // Open modal for editing or adding template
  const openBankModal = (template: EvolutionBankItem | null = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateTitle(template.title);
      setTemplateDesc(template.description);
      setTemplateCourse(template.course);
      setTemplateMonth(template.month);
      setTWeek1Title(template.week1Title);
      setTWeek1Desc(template.week1Desc);
      setTWeek2Title(template.week2Title);
      setTWeek2Desc(template.week2Desc);
      setTWeek3Title(template.week3Title);
      setTWeek3Desc(template.week3Desc);
      setTWeek4Title(template.week4Title);
      setTWeek4Desc(template.week4Desc);

      setTWeek1Type(template.week1Type || 'instruction');
      setTWeek1Question(template.week1Question || '');
      setTWeek1Constraints(template.week1Constraints || '');
      setTWeek1TestCases(template.week1TestCases || '');
      setTWeek1TemplateCode(template.week1TemplateCode || '');

      setTWeek2Type(template.week2Type || 'instruction');
      setTWeek2Question(template.week2Question || '');
      setTWeek2Constraints(template.week2Constraints || '');
      setTWeek2TestCases(template.week2TestCases || '');
      setTWeek2TemplateCode(template.week2TemplateCode || '');

      setTWeek3Type(template.week3Type || 'instruction');
      setTWeek3Question(template.week3Question || '');
      setTWeek3Constraints(template.week3Constraints || '');
      setTWeek3TestCases(template.week3TestCases || '');
      setTWeek3TemplateCode(template.week3TemplateCode || '');

      setTWeek4Type(template.week4Type || 'instruction');
      setTWeek4Question(template.week4Question || '');
      setTWeek4Constraints(template.week4Constraints || '');
      setTWeek4TestCases(template.week4TestCases || '');
      setTWeek4TemplateCode(template.week4TemplateCode || '');
    } else {
      setEditingTemplate(null);
      setTemplateTitle('');
      setTemplateDesc('');
      const defaultCourse = courses[0]?.name || '';
      setTemplateCourse(defaultCourse);
      setPublishTargetBatch('All');
      setTemplateMonth(1);
      setTWeek1Title('Evolution 1 (Week 1)');
      setTWeek1Desc('');
      setTWeek2Title('Evolution 2 (Week 2)');
      setTWeek2Desc('');
      setTWeek3Title('Evolution 3 (Week 3)');
      setTWeek3Desc('');
      setTWeek4Title('Evolution 4 (Week 4)');
      setTWeek4Desc('');

      setTWeek1Type('instruction');
      setTWeek1Question('');
      setTWeek1Constraints('');
      setTWeek1TestCases('');
      setTWeek1TemplateCode('');

      setTWeek2Type('instruction');
      setTWeek2Question('');
      setTWeek2Constraints('');
      setTWeek2TestCases('');
      setTWeek2TemplateCode('');

      setTWeek3Type('instruction');
      setTWeek3Question('');
      setTWeek3Constraints('');
      setTWeek3TestCases('');
      setTWeek3TemplateCode('');

      setTWeek4Type('instruction');
      setTWeek4Question('');
      setTWeek4Constraints('');
      setTWeek4TestCases('');
      setTWeek4TemplateCode('');
    }
    setPublishImmediately(false);
    setPublishTargetBatch('All');
    setValidationError('');
    setPipelineTab('template-form');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateTitle.trim() || !templateDesc.trim() || !templateCourse) {
      setValidationError('Please fill out all required fields.');
      return;
    }

    if (editingTemplate) {
      // Edit
      setEvolutionBank(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        month: templateMonth,
        week1Title: tWeek1Title,
        week1Desc: tWeek1Desc,
        week2Title: tWeek2Title,
        week2Desc: tWeek2Desc,
        week3Title: tWeek3Title,
        week3Desc: tWeek3Desc,
        week4Title: tWeek4Title,
        week4Desc: tWeek4Desc,

        week1Type: tWeek1Type,
        week1Question: tWeek1Type === 'dsa' ? tWeek1Question : undefined,
        week1Constraints: tWeek1Type === 'dsa' ? tWeek1Constraints : undefined,
        week1TestCases: tWeek1Type === 'dsa' ? tWeek1TestCases : undefined,
        week1TemplateCode: tWeek1Type === 'dsa' ? tWeek1TemplateCode : undefined,

        week2Type: tWeek2Type,
        week2Question: tWeek2Type === 'dsa' ? tWeek2Question : undefined,
        week2Constraints: tWeek2Type === 'dsa' ? tWeek2Constraints : undefined,
        week2TestCases: tWeek2Type === 'dsa' ? tWeek2TestCases : undefined,
        week2TemplateCode: tWeek2Type === 'dsa' ? tWeek2TemplateCode : undefined,

        week3Type: tWeek3Type,
        week3Question: tWeek3Type === 'dsa' ? tWeek3Question : undefined,
        week3Constraints: tWeek3Type === 'dsa' ? tWeek3Constraints : undefined,
        week3TestCases: tWeek3Type === 'dsa' ? tWeek3TestCases : undefined,
        week3TemplateCode: tWeek3Type === 'dsa' ? tWeek3TemplateCode : undefined,

        week4Type: tWeek4Type,
        week4Question: tWeek4Type === 'dsa' ? tWeek4Question : undefined,
        week4Constraints: tWeek4Type === 'dsa' ? tWeek4Constraints : undefined,
        week4TestCases: tWeek4Type === 'dsa' ? tWeek4TestCases : undefined,
        week4TemplateCode: tWeek4Type === 'dsa' ? tWeek4TemplateCode : undefined
      } : t));
    } else {
      // Add
      const newItem: EvolutionBankItem = {
        id: `evo-bank-${Date.now()}`,
        title: templateTitle,
        description: templateDesc,
        course: templateCourse,
        month: templateMonth,
        week1Title: tWeek1Title,
        week1Desc: tWeek1Desc,
        week2Title: tWeek2Title,
        week2Desc: tWeek2Desc,
        week3Title: tWeek3Title,
        week3Desc: tWeek3Desc,
        week4Title: tWeek4Title,
        week4Desc: tWeek4Desc,
        createdDate: new Date().toISOString().split('T')[0],

        week1Type: tWeek1Type,
        week1Question: tWeek1Type === 'dsa' ? tWeek1Question : undefined,
        week1Constraints: tWeek1Type === 'dsa' ? tWeek1Constraints : undefined,
        week1TestCases: tWeek1Type === 'dsa' ? tWeek1TestCases : undefined,
        week1TemplateCode: tWeek1Type === 'dsa' ? tWeek1TemplateCode : undefined,

        week2Type: tWeek2Type,
        week2Question: tWeek2Type === 'dsa' ? tWeek2Question : undefined,
        week2Constraints: tWeek2Type === 'dsa' ? tWeek2Constraints : undefined,
        week2TestCases: tWeek2Type === 'dsa' ? tWeek2TestCases : undefined,
        week2TemplateCode: tWeek2Type === 'dsa' ? tWeek2TemplateCode : undefined,

        week3Type: tWeek3Type,
        week3Question: tWeek3Type === 'dsa' ? tWeek3Question : undefined,
        week3Constraints: tWeek3Type === 'dsa' ? tWeek3Constraints : undefined,
        week3TestCases: tWeek3Type === 'dsa' ? tWeek3TestCases : undefined,
        week3TemplateCode: tWeek3Type === 'dsa' ? tWeek3TemplateCode : undefined,

        week4Type: tWeek4Type,
        week4Question: tWeek4Type === 'dsa' ? tWeek4Question : undefined,
        week4Constraints: tWeek4Type === 'dsa' ? tWeek4Constraints : undefined,
        week4TestCases: tWeek4Type === 'dsa' ? tWeek4TestCases : undefined,
        week4TemplateCode: tWeek4Type === 'dsa' ? tWeek4TemplateCode : undefined
      };
      setEvolutionBank(prev => [newItem, ...prev]);
    }

    // Handle immediate weekly publishing and deployment to students if checked
    if (publishImmediately) {
      const targetStudents = users.filter(u => 
        u.role === 'student' && 
        u.course?.toLowerCase() === templateCourse.toLowerCase() && 
        (publishTargetBatch === 'All' || !u.batch || u.batch.toLowerCase() === publishTargetBatch.toLowerCase() || areBatchesEquivalent(u.batch, publishTargetBatch))
      );

      if (targetStudents.length === 0) {
        alert(`No active students found in course "${templateCourse}" inside batch "${publishTargetBatch}". The blueprint template was successfully saved to your bank, but no student records were updated.`);
      } else {
        setStudentEvolutions(prev => {
          const updatedList = [...prev];

          targetStudents.forEach(st => {
            const existingIdx = updatedList.findIndex(ev => ev.studentId === st.id && ev.month === templateMonth && ev.course === templateCourse);

            const finalWeeks = {
              w1T: tWeek1Title || 'Week 1', w1D: tWeek1Desc || 'Syllabus Details',
              w2T: tWeek2Title || 'Week 2', w2D: tWeek2Desc || 'Syllabus Details',
              w3T: tWeek3Title || 'Week 3', w3D: tWeek3Desc || 'Syllabus Details',
              w4T: tWeek4Title || 'Week 4', w4D: tWeek4Desc || 'Syllabus Details'
            };

            if (existingIdx > -1) {
              updatedList[existingIdx] = {
                ...updatedList[existingIdx],
                title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
                title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
                title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
                title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
                batch: st.batch || 'Batch A',
                lastUpdated: new Date().toISOString(),

                week1Type: tWeek1Type,
                week1Question: tWeek1Type === 'dsa' ? tWeek1Question : undefined,
                week1Constraints: tWeek1Type === 'dsa' ? tWeek1Constraints : undefined,
                week1TestCases: tWeek1Type === 'dsa' ? tWeek1TestCases : undefined,
                week1TemplateCode: tWeek1Type === 'dsa' ? tWeek1TemplateCode : undefined,

                week2Type: tWeek2Type,
                week2Question: tWeek2Type === 'dsa' ? tWeek2Question : undefined,
                week2Constraints: tWeek2Type === 'dsa' ? tWeek2Constraints : undefined,
                week2TestCases: tWeek2Type === 'dsa' ? tWeek2TestCases : undefined,
                week2TemplateCode: tWeek2Type === 'dsa' ? tWeek2TemplateCode : undefined,

                week3Type: tWeek3Type,
                week3Question: tWeek3Type === 'dsa' ? tWeek3Question : undefined,
                week3Constraints: tWeek3Type === 'dsa' ? tWeek3Constraints : undefined,
                week3TestCases: tWeek3Type === 'dsa' ? tWeek3TestCases : undefined,
                week3TemplateCode: tWeek3Type === 'dsa' ? tWeek3TemplateCode : undefined,

                week4Type: tWeek4Type,
                week4Question: tWeek4Type === 'dsa' ? tWeek4Question : undefined,
                week4Constraints: tWeek4Type === 'dsa' ? tWeek4Constraints : undefined,
                week4TestCases: tWeek4Type === 'dsa' ? tWeek4TestCases : undefined,
                week4TemplateCode: tWeek4Type === 'dsa' ? tWeek4TemplateCode : undefined
              };
            } else {
              updatedList.push({
                id: `evol-${Date.now()}-${st.id.substring(0, 4)}`,
                studentId: st.id,
                studentName: st.name,
                course: templateCourse,
                batch: st.batch || 'Batch A',
                month: templateMonth,
                promoted: false,
                title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
                title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
                title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
                title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
                lastUpdated: new Date().toISOString(),

                week1Type: tWeek1Type,
                week1Question: tWeek1Type === 'dsa' ? tWeek1Question : undefined,
                week1Constraints: tWeek1Type === 'dsa' ? tWeek1Constraints : undefined,
                week1TestCases: tWeek1Type === 'dsa' ? tWeek1TestCases : undefined,
                week1TemplateCode: tWeek1Type === 'dsa' ? tWeek1TemplateCode : undefined,

                week2Type: tWeek2Type,
                week2Question: tWeek2Type === 'dsa' ? tWeek2Question : undefined,
                week2Constraints: tWeek2Type === 'dsa' ? tWeek2Constraints : undefined,
                week2TestCases: tWeek2Type === 'dsa' ? tWeek2TestCases : undefined,
                week2TemplateCode: tWeek2Type === 'dsa' ? tWeek2TemplateCode : undefined,

                week3Type: tWeek3Type,
                week3Question: tWeek3Type === 'dsa' ? tWeek3Question : undefined,
                week3Constraints: tWeek3Type === 'dsa' ? tWeek3Constraints : undefined,
                week3TestCases: tWeek3Type === 'dsa' ? tWeek3TestCases : undefined,
                week3TemplateCode: tWeek3Type === 'dsa' ? tWeek3TemplateCode : undefined,

                week4Type: tWeek4Type,
                week4Question: tWeek4Type === 'dsa' ? tWeek4Question : undefined,
                week4Constraints: tWeek4Type === 'dsa' ? tWeek4Constraints : undefined,
                week4TestCases: tWeek4Type === 'dsa' ? tWeek4TestCases : undefined,
                week4TemplateCode: tWeek4Type === 'dsa' ? tWeek4TemplateCode : undefined
              });
            }

            // Publish Notification
            const notif: AppNotification = {
              id: `notif-evo-pipeline-${Date.now()}-${st.id.substring(0, 4)}`,
              title: `📈 Weekly Evolution Milestone Published: Month ${templateMonth}!`,
              message: `Your class-wide weekly syllabus targets and continuous evolution tracker for Month ${templateMonth} are now active.`,
              timestamp: new Date().toISOString(),
              read: false,
              type: 'general',
              channel: 'system'
            };
            setNotifications(prevNotif => [notif, ...prevNotif]);

            // Dispatch Email if integration is active
            if (onSendEmail && st.email) {
              const emailSubject = `🎓 Weekly Syllabus Evolution Blueprint Published: Month ${templateMonth}`;
              const emailBody = `Dear ${st.name},\n\nWe are pleased to inform you that the official week-by-week Continuous weekly Evolution checkpoints for Study Month ${templateMonth} under course: ${templateCourse} have been published.\n\nHere are your active benchmarks:\n\n- ${finalWeeks.w1T}: ${finalWeeks.w1D}\n- ${finalWeeks.w2T}: ${finalWeeks.w2D}\n- ${finalWeeks.w3T}: ${finalWeeks.w3D}\n- ${finalWeeks.w4T}: ${finalWeeks.w4D}\n\nClear all 4 weekly checkpoints with an overall average of 80% to trigger level promotion.\n\nBest regards,\nLearnora Academic Team\nsupport@learnora.in`;
              onSendEmail(st.email, emailSubject, emailBody, 'academic-office@learnora.in');
            }
          });

          return updatedList;
        });

        alert(`Successfully saved blueprint template AND immediately published these weekly evolution milestones to ${targetStudents.length} active students in "${templateCourse}" [Batch: ${publishTargetBatch}]!`);
      }
    }

    setPipelineTab('bank');
  };

  const handleDeleteTemplate = (id: string) => {
    setEvolutionBank(prev => prev.filter(t => t.id !== id));
    setDeletingTemplateId(null);
  };

  // Deploy evolution pipeline publisher
  const handleDeployPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch) {
      alert('Please select target Course and Batch.');
      return;
    }

    let finalWeeks = {
      w1T: 'Evolution 1 (Week 1)', w1D: 'Kinematics & Base theory',
      w2T: 'Evolution 2 (Week 2)', w2D: 'Applied Practical Problems',
      w3T: 'Evolution 3 (Week 3)', w3D: 'Analytical Problem Resolution',
      w4T: 'Evolution 4 (Week 4)', w4D: 'Integrated Examination'
    };

    let sourceTitle = 'Custom Monthly Evaluation Grid';
    let w1Type: 'dsa' | 'instruction' = 'instruction';
    let w1Question = ''; let w1Constraints = ''; let w1TestCases = ''; let w1TemplateCode = '';
    let w2Type: 'dsa' | 'instruction' = 'instruction';
    let w2Question = ''; let w2Constraints = ''; let w2TestCases = ''; let w2TemplateCode = '';
    let w3Type: 'dsa' | 'instruction' = 'instruction';
    let w3Question = ''; let w3Constraints = ''; let w3TestCases = ''; let w3TemplateCode = '';
    let w4Type: 'dsa' | 'instruction' = 'instruction';
    let w4Question = ''; let w4Constraints = ''; let w4TestCases = ''; let w4TemplateCode = '';

    if (useCustomWeeks) {
      finalWeeks = {
        w1T: cWeek1Title, w1D: cWeek1Desc || 'Week 1 Continuous Syllabus',
        w2T: cWeek2Title, w2D: cWeek2Desc || 'Week 2 Continuous Syllabus',
        w3T: cWeek3Title, w3D: cWeek3Desc || 'Week 3 Continuous Syllabus',
        w4T: cWeek4Title, w4D: cWeek4Desc || 'Week 4 Continuous Syllabus'
      };

      w1Type = cWeek1Type;
      w1Question = cWeek1Question; w1Constraints = cWeek1Constraints; w1TestCases = cWeek1TestCases; w1TemplateCode = cWeek1TemplateCode;
      w2Type = cWeek2Type;
      w2Question = cWeek2Question; w2Constraints = cWeek2Constraints; w2TestCases = cWeek2TestCases; w2TemplateCode = cWeek2TemplateCode;
      w3Type = cWeek3Type;
      w3Question = cWeek3Question; w3Constraints = cWeek3Constraints; w3TestCases = cWeek3TestCases; w3TemplateCode = cWeek3TemplateCode;
      w4Type = cWeek4Type;
      w4Question = cWeek4Question; w4Constraints = cWeek4Constraints; w4TestCases = cWeek4TestCases; w4TemplateCode = cWeek4TemplateCode;
    } else {
      const template = evolutionBank.find(t => t.id === selectedBankTemplateId);
      if (!template) {
        alert('Please select an evolution blueprint template from the bank.');
        return;
      }
      sourceTitle = template.title;
      finalWeeks = {
        w1T: template.week1Title, w1D: template.week1Desc,
        w2T: template.week2Title, w2D: template.week2Desc,
        w3T: template.week3Title, w3D: template.week3Desc,
        w4T: template.week4Title, w4D: template.week4Desc
      };

      w1Type = template.week1Type || 'instruction';
      w1Question = template.week1Question || ''; w1Constraints = template.week1Constraints || ''; w1TestCases = template.week1TestCases || ''; w1TemplateCode = template.week1TemplateCode || '';
      w2Type = template.week2Type || 'instruction';
      w2Question = template.week2Question || ''; w2Constraints = template.week2Constraints || ''; w2TestCases = template.week2TestCases || ''; w2TemplateCode = template.week2TemplateCode || '';
      w3Type = template.week3Type || 'instruction';
      w3Question = template.week3Question || ''; w3Constraints = template.week3Constraints || ''; w3TestCases = template.week3TestCases || ''; w3TemplateCode = template.week3TemplateCode || '';
      w4Type = template.week4Type || 'instruction';
      w4Question = template.week4Question || ''; w4Constraints = template.week4Constraints || ''; w4TestCases = template.week4TestCases || ''; w4TemplateCode = template.week4TemplateCode || '';
    }

    // Find enrolled students in the target Batch and Course
    const targetStudents = users.filter(u => 
      u.role === 'student' && 
      (selectedBatch === 'All' || !u.batch || u.batch.toLowerCase() === selectedBatch.toLowerCase() || areBatchesEquivalent(u.batch, selectedBatch)) &&
      (selectedCourse === 'All' || u.course?.toLowerCase() === selectedCourse.toLowerCase())
    );

    if (targetStudents.length === 0) {
      alert(`There are currently no active students matched to ${selectedCourse} inside batch "${selectedBatch}". Check student records first.`);
      return;
    }

    // Upsert student evolution tracker entries
    setStudentEvolutions(prev => {
      const updatedList = [...prev];

      targetStudents.forEach(st => {
        const existingIdx = updatedList.findIndex(ev => ev.studentId === st.id && ev.month === selectedMonth && ev.course === selectedCourse);

        if (existingIdx > -1) {
          // Update existing with the newly deployed syllabus structures
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
            title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
            title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
            title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
            batch: selectedBatch,
            lastUpdated: new Date().toISOString(),

            week1Type: w1Type,
            week1Question: w1Type === 'dsa' ? w1Question : undefined,
            week1Constraints: w1Type === 'dsa' ? w1Constraints : undefined,
            week1TestCases: w1Type === 'dsa' ? w1TestCases : undefined,
            week1TemplateCode: w1Type === 'dsa' ? w1TemplateCode : undefined,

            week2Type: w2Type,
            week2Question: w2Type === 'dsa' ? w2Question : undefined,
            week2Constraints: w2Type === 'dsa' ? w2Constraints : undefined,
            week2TestCases: w2Type === 'dsa' ? w2TestCases : undefined,
            week2TemplateCode: w2Type === 'dsa' ? w2TemplateCode : undefined,

            week3Type: w3Type,
            week3Question: w3Type === 'dsa' ? w3Question : undefined,
            week3Constraints: w3Type === 'dsa' ? w3Constraints : undefined,
            week3TestCases: w3Type === 'dsa' ? w3TestCases : undefined,
            week3TemplateCode: w3Type === 'dsa' ? w3TemplateCode : undefined,

            week4Type: w4Type,
            week4Question: w4Type === 'dsa' ? w4Question : undefined,
            week4Constraints: w4Type === 'dsa' ? w4Constraints : undefined,
            week4TestCases: w4Type === 'dsa' ? w4TestCases : undefined,
            week4TemplateCode: w4Type === 'dsa' ? w4TemplateCode : undefined
          };
        } else {
          // Insert fresh record
          updatedList.push({
            id: `evol-${Date.now()}-${st.id.substring(0, 4)}`,
            studentId: st.id,
            studentName: st.name,
            course: selectedCourse,
            batch: selectedBatch,
            month: selectedMonth,
            promoted: false,
            title1: finalWeeks.w1T, desc1: finalWeeks.w1D,
            title2: finalWeeks.w2T, desc2: finalWeeks.w2D,
            title3: finalWeeks.w3T, desc3: finalWeeks.w3D,
            title4: finalWeeks.w4T, desc4: finalWeeks.w4D,
            lastUpdated: new Date().toISOString(),

            week1Type: w1Type,
            week1Question: w1Type === 'dsa' ? w1Question : undefined,
            week1Constraints: w1Type === 'dsa' ? w1Constraints : undefined,
            week1TestCases: w1Type === 'dsa' ? w1TestCases : undefined,
            week1TemplateCode: w1Type === 'dsa' ? w1TemplateCode : undefined,

            week2Type: w2Type,
            week2Question: w2Type === 'dsa' ? w2Question : undefined,
            week2Constraints: w2Type === 'dsa' ? w2Constraints : undefined,
            week2TestCases: w2Type === 'dsa' ? w2TestCases : undefined,
            week2TemplateCode: w2Type === 'dsa' ? w2TemplateCode : undefined,

            week3Type: w3Type,
            week3Question: w3Type === 'dsa' ? w3Question : undefined,
            week3Constraints: w3Type === 'dsa' ? w3Constraints : undefined,
            week3TestCases: w3Type === 'dsa' ? w3TestCases : undefined,
            week3TemplateCode: w3Type === 'dsa' ? w3TemplateCode : undefined,

            week4Type: w4Type,
            week4Question: w4Type === 'dsa' ? w4Question : undefined,
            week4Constraints: w4Type === 'dsa' ? w4Constraints : undefined,
            week4TestCases: w4Type === 'dsa' ? w4TestCases : undefined,
            week4TemplateCode: w4Type === 'dsa' ? w4TemplateCode : undefined
          });
        }

        // Notify Student
        const notif: AppNotification = {
          id: `notif-evo-pipeline-${Date.now()}-${st.id.substring(0, 4)}`,
          title: `📈 Continuous Evolution Month ${selectedMonth} Initialized!`,
          message: `Your syllabus milestones for Study Month ${selectedMonth} have been deployed. View evaluation blocks.`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'general',
          channel: 'system'
        };
        setNotifications(prevNotif => [notif, ...prevNotif]);

        // Send Email
        if (onSendEmail && st.email) {
          const emailSubject = `🎓 Continuous Evolution Milestones Deployed: Month ${selectedMonth}`;
          const emailBody = `Dear ${st.name},\n\nWe pleased to inform you that your authorized subject instructors have deployed the official Monthly Continuous Evolution syllabus guidelines for Study Month ${selectedMonth} under: ${selectedCourse}.\n\nHere are your upcoming academic checkpoints:\n\n- Week 1 Checkpoint: ${finalWeeks.w1T} (${finalWeeks.w1D})\n- Week 2 Checkpoint: ${finalWeeks.w2T} (${finalWeeks.w2D})\n- Week 3 Checkpoint: ${finalWeeks.w3T} (${finalWeeks.w3D})\n- Week 4 Checkpoint: ${finalWeeks.w4T} (${finalWeeks.w4D})\n\nGrade Criteria:\nOnce all four checkpoints are evaluated by your assigned professor, an overall aggregate average of 80% or greater will trigger immediate Automatic Level Promotion.\n\nKeep up the extraordinary efforts!\n\nBest regards,\nLearnora Academic Pipeline Office\nsupport@learnora.in`;
          onSendEmail(st.email, emailSubject, emailBody, 'academic-office@learnora.in');
        }
      });

      return updatedList;
    });

    setPipelineSuccessMsg(`Successfully deployed Month ${selectedMonth} Evolution Grid "${sourceTitle}" to ${targetStudents.length} active students in course "${selectedCourse}" [Batch: ${selectedBatch}]!`);
    
    // Clear field states
    if (useCustomWeeks) {
      setCWeek1Desc('');
      setCWeek2Desc('');
      setCWeek3Desc('');
      setCWeek4Desc('');
    }
    setSelectedBankTemplateId('');
    setTimeout(() => setPipelineSuccessMsg(''), 6000);
  };

  // Filter templates matching current pipeline selections
  const matchingTemplates = evolutionBank.filter(t => {
    const matchesCourse = !selectedCourse || t.course.toLowerCase() === selectedCourse.toLowerCase();
    const matchesMonth = !selectedMonth || t.month === selectedMonth;
    return matchesCourse && matchesMonth;
  });

  // Filter bank view
  const filteredBank = evolutionBank.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(bankSearch.toLowerCase()) || 
                          t.description.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesCourse = bankCourseFilter === 'all' || t.course.toLowerCase() === bankCourseFilter.toLowerCase();
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn font-sans">
      {/* Premium Header Decoration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Monthly Evolution Pipeline & Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Build reusable curriculum continuous-evaluation blueprints, configure custom weekly checkpoints, and broadcast standard 4-week grade cards.
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-1 bg-slate-50 dark:bg-[#070708] border border-slate-205 dark:border-white/5 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setPipelineTab('bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'bank'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Blueprint Bank
          </button>
          <button
            type="button"
            onClick={() => {
              setPipelineTab('pipeline');
              if (courses.length > 0 && !selectedCourse) {
                setSelectedCourse(courses[0].name);
                setSelectedBatch(courses[0].batchNumber || 'Batch A');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              pipelineTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Deploy Evolution
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {pipelineTab === 'bank' && (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-zinc-900/10 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blueprints..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <select
                  value={bankCourseFilter}
                  onChange={(e) => setBankCourseFilter(e.target.value)}
                  className="bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-zinc-300"
                >
                  <option value="all">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => openBankModal(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Blueprint
                </button>
              </div>
            </div>

            {/* Blueprints Display list */}
            {filteredBank.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
                <Database className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No Evolution Blueprints Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Create syllabus blueprints detailing month-by-month and week-by-week benchmarks for active class evaluations.
                </p>
                <button
                  type="button"
                  onClick={() => openBankModal(null)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Create First Blueprint
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBank.map(tmp => (
                  <div 
                    key={tmp.id} 
                    className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xs relative hover:border-slate-300 dark:hover:border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md uppercase tracking-wider">
                            Month {tmp.month}
                          </span>
                          <span className="text-[10px] font-mono text-slate-450 dark:text-zinc-500 ml-2">
                            Created: {tmp.createdDate}
                          </span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openBankModal(tmp)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                            title="Edit structural template"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTemplateId(tmp.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{tmp.title}</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed border-b border-dashed border-slate-100 dark:border-white/5 pb-4">
                        {tmp.description}
                      </p>

                      {/* 4 continuous weeks mini timeline breakdown */}
                      <div className="mt-4 space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Weekly Milestones</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week1Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week1Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week2Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week2Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week3Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week3Desc}</p>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/40 dark:border-white/5 rounded-xl">
                            <p className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">{tmp.week4Title}</p>
                            <p className="text-[10px] text-slate-450 dark:text-zinc-500 truncate">{tmp.week4Desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[11px] text-slate-500">
                      <span className="font-medium truncate max-w-xs block">Course: {tmp.course}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourse(tmp.course);
                          setSelectedMonth(tmp.month);
                          setSelectedBankTemplateId(tmp.id);
                          setUseCustomWeeks(false);
                          setPipelineTab('pipeline');
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Send className="w-3 h-3" />
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {pipelineTab === 'pipeline' && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-500" />
                  Deploy Continuous Evolution Track
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  Deploy a Month's evaluation structure. This will instantly push individual weekly syllabus parameters onto the grading profiles of every student currently in the targeted course and batch.
                </p>
              </div>

              {pipelineSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{pipelineSuccessMsg}</p>
                </div>
              )}

              <form onSubmit={handleDeployPipeline} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Select Course */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Course</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedBatch('');
                        setSelectedBankTemplateId('');
                      }}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Batch */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Batch</label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                      disabled={!selectedCourse}
                    >
                      {!selectedCourse ? (
                        <option value="">-- Choose Course First --</option>
                      ) : (
                        <>
                          <option value="">-- Choose Batch --</option>
                          <option value="All">All Batches</option>
                          {getBatchesForCourse(selectedCourse).map(b => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Active Month */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-550 dark:text-zinc-400 tracking-wider">Target Month</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value));
                        setSelectedBankTemplateId('');
                      }}
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      required
                    >
                      <option value={1}>Month 1</option>
                      <option value={2}>Month 2</option>
                      <option value={3}>Month 3</option>
                      <option value={4}>Month 4</option>
                      <option value={5}>Month 5</option>
                      <option value={6}>Month 6</option>
                    </select>
                  </div>
                </div>

                {/* Switch between pre-existing templates or manually typing */}
                <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/60 dark:border-white/5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Syllabus Template Source</p>
                    <div className="flex bg-slate-200/50 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setUseCustomWeeks(false)}
                        className={`px-3 py-1.5 rounded-md transition ${!useCustomWeeks ? 'bg-white dark:bg-[#1a1b1e] text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                      >
                        From Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomWeeks(true)}
                        className={`px-3 py-1.5 rounded-md transition ${useCustomWeeks ? 'bg-white dark:bg-[#1a1b1e] text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                      >
                        Custom Setup
                      </button>
                    </div>
                  </div>

                  {!useCustomWeeks ? (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Select Template Blueprint</label>
                      <select
                        value={selectedBankTemplateId}
                        onChange={(e) => setSelectedBankTemplateId(e.target.value)}
                        className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      >
                        <option value="">-- Click to choose template blueprint --</option>
                        {matchingTemplates.map(tmp => (
                          <option key={tmp.id} value={tmp.id}>
                            {tmp.title} (Month {tmp.month})
                          </option>
                        ))}
                      </select>
                      
                      {matchingTemplates.length === 0 && selectedCourse && (
                        <p className="text-[10px] text-amber-500 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No bank blueprints match your chosen course and study month. Try "Custom Setup" or create a new Blueprint.
                        </p>
                      )}

                      {/* Template Preview Panel */}
                      {selectedBankTemplateId && (() => {
                        const activeTmp = evolutionBank.find(t => t.id === selectedBankTemplateId);
                        if (!activeTmp) return null;
                        return (
                          <div className="p-3 bg-white dark:bg-black border border-slate-200 dark:border-white/5 rounded-xl mt-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syllabus Overview</p>
                            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{activeTmp.title}</h4>
                            <p className="text-[10px] text-slate-550 leading-relaxed italic">{activeTmp.description}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px]">
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week1Title}:</span> {activeTmp.week1Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week2Title}:</span> {activeTmp.week2Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week3Title}:</span> {activeTmp.week3Desc}</div>
                              <div><span className="font-extrabold text-slate-700 dark:text-zinc-300">{activeTmp.week4Title}:</span> {activeTmp.week4Desc}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Configure Custom Weekly Syllabus Targets</p>
                      
                      <div className="space-y-4">
                        {/* Custom Week 1 */}
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={cWeek1Title}
                              onChange={(e) => setCWeek1Title(e.target.value)}
                              className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                              placeholder="Week 1 Title"
                            />
                            <div className="flex items-center gap-3 justify-end">
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week1_type"
                                  checked={cWeek1Type === 'instruction'}
                                  onChange={() => setCWeek1Type('instruction')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>Instructional</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week1_type"
                                  checked={cWeek1Type === 'dsa'}
                                  onChange={() => setCWeek1Type('dsa')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>DSA</span>
                              </label>
                            </div>
                          </div>
                          <textarea
                            value={cWeek1Desc}
                            onChange={(e) => setCWeek1Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200/50 dark:border-white/10 text-[10px] p-2 rounded"
                          />
                          {cWeek1Type === 'dsa' && (
                            <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200/50 dark:border-white/5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Difficulty:</span>
                                  {['Easy', 'Medium', 'Hard'].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setW1Diff(d as any)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center ${
                                        w1Diff === d
                                          ? d === 'Easy'
                                            ? 'bg-emerald-500 text-white'
                                            : d === 'Medium'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-rose-500 text-white'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {d === 'Easy' ? 'Simple' : d}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Solve Count:</span>
                                  {[1, 2, 3].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setW1Count(num)}
                                      className={`w-5 h-5 rounded-full text-[9px] font-extrabold transition flex items-center justify-center ${
                                        w1Count === num
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-355 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateDSA(1, w1Diff, w1Count)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-semibold rounded flex items-center gap-1 transition shadow-xs cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-200 animate-pulse" />
                                  <span>Generate</span>
                                </button>
                              </div>
                              {renderDSAGenerator(1, 'custom')}
                              <textarea
                                value={cWeek1Question}
                                onChange={e => setCWeek1Question(e.target.value)}
                                placeholder="DSA problem statement..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={cWeek1Constraints}
                                  onChange={e => setCWeek1Constraints(e.target.value)}
                                  placeholder="Constraints..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                                <input
                                  type="text"
                                  value={cWeek1TestCases}
                                  onChange={e => setCWeek1TestCases(e.target.value)}
                                  placeholder="Sample test cases..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                              </div>
                              <textarea
                                value={cWeek1TemplateCode}
                                onChange={e => setCWeek1TemplateCode(e.target.value)}
                                placeholder="Starter code..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>

                        {/* Custom Week 2 */}
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={cWeek2Title}
                              onChange={(e) => setCWeek2Title(e.target.value)}
                              className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                              placeholder="Week 2 Title"
                            />
                            <div className="flex items-center gap-3 justify-end">
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week2_type"
                                  checked={cWeek2Type === 'instruction'}
                                  onChange={() => setCWeek2Type('instruction')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>Instructional</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week2_type"
                                  checked={cWeek2Type === 'dsa'}
                                  onChange={() => setCWeek2Type('dsa')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>DSA</span>
                              </label>
                            </div>
                          </div>
                          <textarea
                            value={cWeek2Desc}
                            onChange={(e) => setCWeek2Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200/50 dark:border-white/10 text-[10px] p-2 rounded"
                          />
                          {cWeek2Type === 'dsa' && (
                            <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200/50 dark:border-white/5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Difficulty:</span>
                                  {['Easy', 'Medium', 'Hard'].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setW2Diff(d as any)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center ${
                                        w2Diff === d
                                          ? d === 'Easy'
                                            ? 'bg-emerald-500 text-white'
                                            : d === 'Medium'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-rose-500 text-white'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {d === 'Easy' ? 'Simple' : d}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Solve Count:</span>
                                  {[1, 2, 3].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setW2Count(num)}
                                      className={`w-5 h-5 rounded-full text-[9px] font-extrabold transition flex items-center justify-center ${
                                        w2Count === num
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-355 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateDSA(2, w2Diff, w2Count)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-semibold rounded flex items-center gap-1 transition shadow-xs cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-200 animate-pulse" />
                                  <span>Generate</span>
                                </button>
                              </div>
                              {renderDSAGenerator(2, 'custom')}
                              <textarea
                                value={cWeek2Question}
                                onChange={e => setCWeek2Question(e.target.value)}
                                placeholder="DSA problem statement..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={cWeek2Constraints}
                                  onChange={e => setCWeek2Constraints(e.target.value)}
                                  placeholder="Constraints..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                                <input
                                  type="text"
                                  value={cWeek2TestCases}
                                  onChange={e => setCWeek2TestCases(e.target.value)}
                                  placeholder="Sample test cases..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                              </div>
                              <textarea
                                value={cWeek2TemplateCode}
                                onChange={e => setCWeek2TemplateCode(e.target.value)}
                                placeholder="Starter code..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>

                        {/* Custom Week 3 */}
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={cWeek3Title}
                              onChange={(e) => setCWeek3Title(e.target.value)}
                              className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                              placeholder="Week 3 Title"
                            />
                            <div className="flex items-center gap-3 justify-end">
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week3_type"
                                  checked={cWeek3Type === 'instruction'}
                                  onChange={() => setCWeek3Type('instruction')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>Instructional</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week3_type"
                                  checked={cWeek3Type === 'dsa'}
                                  onChange={() => setCWeek3Type('dsa')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>DSA</span>
                              </label>
                            </div>
                          </div>
                          <textarea
                            value={cWeek3Desc}
                            onChange={(e) => setCWeek3Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200/50 dark:border-white/10 text-[10px] p-2 rounded"
                          />
                          {cWeek3Type === 'dsa' && (
                            <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200/50 dark:border-white/5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Difficulty:</span>
                                  {['Easy', 'Medium', 'Hard'].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setW3Diff(d as any)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center ${
                                        w3Diff === d
                                          ? d === 'Easy'
                                            ? 'bg-emerald-500 text-white'
                                            : d === 'Medium'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-rose-500 text-white'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {d === 'Easy' ? 'Simple' : d}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Solve Count:</span>
                                  {[1, 2, 3].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setW3Count(num)}
                                      className={`w-5 h-5 rounded-full text-[9px] font-extrabold transition flex items-center justify-center ${
                                        w3Count === num
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-355 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateDSA(3, w3Diff, w3Count)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-semibold rounded flex items-center gap-1 transition shadow-xs cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-200 animate-pulse" />
                                  <span>Generate</span>
                                </button>
                              </div>
                              {renderDSAGenerator(3, 'custom')}
                              <textarea
                                value={cWeek3Question}
                                onChange={e => setCWeek3Question(e.target.value)}
                                placeholder="DSA problem statement..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={cWeek3Constraints}
                                  onChange={e => setCWeek3Constraints(e.target.value)}
                                  placeholder="Constraints..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                                <input
                                  type="text"
                                  value={cWeek3TestCases}
                                  onChange={e => setCWeek3TestCases(e.target.value)}
                                  placeholder="Sample test cases..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                              </div>
                              <textarea
                                value={cWeek3TemplateCode}
                                onChange={e => setCWeek3TemplateCode(e.target.value)}
                                placeholder="Starter code..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>

                        {/* Custom Week 4 */}
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-200/60 dark:border-white/5 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={cWeek4Title}
                              onChange={(e) => setCWeek4Title(e.target.value)}
                              className="text-xs font-extrabold bg-transparent border-0 focus:ring-0 p-0 text-indigo-600 dark:text-indigo-400 w-full"
                              placeholder="Week 4 Title"
                            />
                            <div className="flex items-center gap-3 justify-end">
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week4_type"
                                  checked={cWeek4Type === 'instruction'}
                                  onChange={() => setCWeek4Type('instruction')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>Instructional</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 font-medium">
                                <input
                                  type="radio"
                                  name="c_week4_type"
                                  checked={cWeek4Type === 'dsa'}
                                  onChange={() => setCWeek4Type('dsa')}
                                  className="w-2.5 h-2.5"
                                />
                                <span>DSA</span>
                              </label>
                            </div>
                          </div>
                          <textarea
                            value={cWeek4Desc}
                            onChange={(e) => setCWeek4Desc(e.target.value)}
                            placeholder="Syllabus/evaluation details..."
                            rows={1.5}
                            className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-100 dark:border-white/10 text-[10px] p-2 rounded"
                          />
                          {cWeek4Type === 'dsa' && (
                            <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200/50 dark:border-white/5 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-zinc-950 rounded-lg border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Difficulty:</span>
                                  {['Easy', 'Medium', 'Hard'].map((d) => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => setW4Diff(d as any)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition flex items-center ${
                                        w4Diff === d
                                          ? d === 'Easy'
                                            ? 'bg-emerald-500 text-white'
                                            : d === 'Medium'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-rose-500 text-white'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {d === 'Easy' ? 'Simple' : d}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Solve Count:</span>
                                  {[1, 2, 3].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => setW4Count(num)}
                                      className={`w-5 h-5 rounded-full text-[9px] font-extrabold transition flex items-center justify-center ${
                                        w4Count === num
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-slate-200/40 dark:bg-white/5 text-slate-600 dark:text-zinc-355 hover:bg-slate-200 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAutoGenerateDSA(4, w4Diff, w4Count)}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-750 text-white text-[9px] font-semibold rounded flex items-center gap-1 transition shadow-xs cursor-pointer"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-200 animate-pulse" />
                                  <span>Generate</span>
                                </button>
                              </div>
                              {renderDSAGenerator(4, 'custom')}
                              <textarea
                                value={cWeek4Question}
                                onChange={e => setCWeek4Question(e.target.value)}
                                placeholder="DSA problem statement..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={cWeek4Constraints}
                                  onChange={e => setCWeek4Constraints(e.target.value)}
                                  placeholder="Constraints..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                                <input
                                  type="text"
                                  value={cWeek4TestCases}
                                  onChange={e => setCWeek4TestCases(e.target.value)}
                                  placeholder="Sample test cases..."
                                  className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40"
                                />
                              </div>
                              <textarea
                                value={cWeek4TemplateCode}
                                onChange={e => setCWeek4TemplateCode(e.target.value)}
                                placeholder="Starter code..."
                                className="w-full bg-white dark:bg-black text-[10px] p-1.5 rounded border border-slate-200/40 font-mono"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Deploy Monthly Evolution Pipeline
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {pipelineTab === 'template-form' && (
          <motion.div
            key="template-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-[#070708] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingTemplate ? 'Edit Blueprint Blueprint' : 'Build Brand New Evolution Blueprint'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPipelineTab('bank')}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg text-slate-550 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationError}</span>
                </div>
              )}

              <form onSubmit={handleSaveTemplate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blueprint Title */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Blueprint Title *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      placeholder="e.g. Month 1 Advanced Kinematics & Applied Motion Vector"
                      required
                    />
                  </div>

                  {/* Course mapping */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Map Course *</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateCourse}
                      onChange={(e) => {
                        setTemplateCourse(e.target.value);
                        setPublishTargetBatch('All');
                      }}
                      required
                    >
                      <option value="">-- Choose Target Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month mapping */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Map Month *</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                      value={templateMonth}
                      onChange={(e) => setTemplateMonth(parseInt(e.target.value))}
                      required
                    >
                      <option value={1}>Month 1</option>
                      <option value={2}>Month 2</option>
                      <option value={3}>Month 3</option>
                      <option value={4}>Month 4</option>
                      <option value={5}>Month 5</option>
                      <option value={6}>Month 6</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-zinc-400">Description / Guidelines *</label>
                    <textarea
                      className="w-full bg-slate-50 dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/15 px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-zinc-200"
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                      rows={3}
                      placeholder="Detail the active monthly review, learning expectations, and focus goals."
                      required
                    />
                  </div>
                </div>

                {/* 4 continuous weeks structure builders */}
                <div className="pt-4 border-t border-slate-150 dark:border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Configure Week-by-Week syllabus Checkpoint Guidelines
                  </h4>

                  <div className="space-y-4">
                    {/* Week 1 */}
                    <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 1 Title</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek1Title}
                            onChange={(e) => setTWeek1Title(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 1 Checkpoint Syllabus</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek1Desc}
                            onChange={(e) => setTWeek1Desc(e.target.value)}
                            placeholder="e.g. Vector operations, speed curves and relative drift offsets."
                          />
                        </div>
                      </div>

                      {/* Week 1 Evaluation Type */}
                      <div className="border-t border-slate-200/40 dark:border-white/5 pt-2 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Week 1 Evaluation Type:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week1_type"
                              checked={tWeek1Type === 'instruction'}
                              onChange={() => setTWeek1Type('instruction')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>Instructional</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week1_type"
                              checked={tWeek1Type === 'dsa'}
                              onChange={() => setTWeek1Type('dsa')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>DSA Coding Challenge</span>
                          </label>
                        </div>

                        {tWeek1Type === 'dsa' && (
                          <div className="space-y-3 bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                            {renderDSAGenerator(1, 'template')}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">DSA Challenge Prompt *</label>
                              <textarea
                                rows={2}
                                required={tWeek1Type === 'dsa'}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek1Question}
                                onChange={e => setTWeek1Question(e.target.value)}
                                placeholder="e.g. Write a function solve(n) returning Fibonacci numbers."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Constraints</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek1Constraints}
                                  onChange={e => setTWeek1Constraints(e.target.value)}
                                  placeholder="e.g. 0 <= n <= 30"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Sample Test Cases</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek1TestCases}
                                  onChange={e => setTWeek1TestCases(e.target.value)}
                                  placeholder="solve(4) -> 3"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">Starter Template Code</label>
                              <textarea
                                rows={3}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek1TemplateCode}
                                onChange={e => setTWeek1TemplateCode(e.target.value)}
                                placeholder="function solve(n) {\n  \n}"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Week 2 */}
                    <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 2 Title</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek2Title}
                            onChange={(e) => setTWeek2Title(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 2 Checkpoint Syllabus</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek2Desc}
                            onChange={(e) => setTWeek2Desc(e.target.value)}
                            placeholder="e.g. Free-body dynamics diagram, pulleys and surface Normal."
                          />
                        </div>
                      </div>

                      {/* Week 2 Evaluation Type */}
                      <div className="border-t border-slate-200/40 dark:border-white/5 pt-2 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Week 2 Evaluation Type:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week2_type"
                              checked={tWeek2Type === 'instruction'}
                              onChange={() => setTWeek2Type('instruction')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>Instructional</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week2_type"
                              checked={tWeek2Type === 'dsa'}
                              onChange={() => setTWeek2Type('dsa')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>DSA Coding Challenge</span>
                          </label>
                        </div>

                        {tWeek2Type === 'dsa' && (
                          <div className="space-y-3 bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                            {renderDSAGenerator(2, 'template')}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">DSA Challenge Prompt *</label>
                              <textarea
                                rows={2}
                                required={tWeek2Type === 'dsa'}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek2Question}
                                onChange={e => setTWeek2Question(e.target.value)}
                                placeholder="e.g. Reverse a singly linked list in-place."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Constraints</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek2Constraints}
                                  onChange={e => setTWeek2Constraints(e.target.value)}
                                  placeholder="0 <= list.length <= 5000"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Sample Test Cases</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek2TestCases}
                                  onChange={e => setTWeek2TestCases(e.target.value)}
                                  placeholder="[1,2,3] -> [3,2,1]"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">Starter Template Code</label>
                              <textarea
                                rows={3}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek2TemplateCode}
                                onChange={e => setTWeek2TemplateCode(e.target.value)}
                                placeholder="function solve(head) {\n  \n}"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Week 3 */}
                    <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 3 Title</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek3Title}
                            onChange={(e) => setTWeek3Title(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 3 Checkpoint Syllabus</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek3Desc}
                            onChange={(e) => setTWeek3Desc(e.target.value)}
                            placeholder="e.g. Kinetic and static friction, threshold angle and normal slippage."
                          />
                        </div>
                      </div>

                      {/* Week 3 Evaluation Type */}
                      <div className="border-t border-slate-200/40 dark:border-white/5 pt-2 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Week 3 Evaluation Type:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week3_type"
                              checked={tWeek3Type === 'instruction'}
                              onChange={() => setTWeek3Type('instruction')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>Instructional</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week3_type"
                              checked={tWeek3Type === 'dsa'}
                              onChange={() => setTWeek3Type('dsa')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>DSA Coding Challenge</span>
                          </label>
                        </div>

                        {tWeek3Type === 'dsa' && (
                          <div className="space-y-3 bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                            {renderDSAGenerator(3, 'template')}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">DSA Challenge Prompt *</label>
                              <textarea
                                rows={2}
                                required={tWeek3Type === 'dsa'}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek3Question}
                                onChange={e => setTWeek3Question(e.target.value)}
                                placeholder="e.g. Check if brackets are balanced in text."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Constraints</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek3Constraints}
                                  onChange={e => setTWeek3Constraints(e.target.value)}
                                  placeholder="string length <= 1000"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Sample Test Cases</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek3TestCases}
                                  onChange={e => setTWeek3TestCases(e.target.value)}
                                  placeholder="'([{}])' -> true"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">Starter Template Code</label>
                              <textarea
                                rows={3}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek3TemplateCode}
                                onChange={e => setTWeek3TemplateCode(e.target.value)}
                                placeholder="function solve(s) {\n  \n}"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Week 4 */}
                    <div className="p-4 bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 4 Title</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek4Title}
                            onChange={(e) => setTWeek4Title(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Week 4 Checkpoint Syllabus</label>
                          <input
                            type="text"
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg text-xs"
                            value={tWeek4Desc}
                            onChange={(e) => setTWeek4Desc(e.target.value)}
                            placeholder="e.g. Energy conservation calculations, heat dissipation and circular inertia."
                          />
                        </div>
                      </div>

                      {/* Week 4 Evaluation Type */}
                      <div className="border-t border-slate-200/40 dark:border-white/5 pt-2 space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Week 4 Evaluation Type:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week4_type"
                              checked={tWeek4Type === 'instruction'}
                              onChange={() => setTWeek4Type('instruction')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>Instructional</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-650 dark:text-zinc-300">
                            <input
                              type="radio"
                              name="t_week4_type"
                              checked={tWeek4Type === 'dsa'}
                              onChange={() => setTWeek4Type('dsa')}
                              className="text-amber-550 focus:ring-amber-550 w-3 h-3"
                            />
                            <span>DSA Coding Challenge</span>
                          </label>
                        </div>

                        {tWeek4Type === 'dsa' && (
                          <div className="space-y-3 bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                            {renderDSAGenerator(4, 'template')}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">DSA Challenge Prompt *</label>
                              <textarea
                                rows={2}
                                required={tWeek4Type === 'dsa'}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek4Question}
                                onChange={e => setTWeek4Question(e.target.value)}
                                placeholder="e.g. Find the maximum depth of a binary tree."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Constraints</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek4Constraints}
                                  onChange={e => setTWeek4Constraints(e.target.value)}
                                  placeholder="number of nodes <= 10^4"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold uppercase text-slate-400">Sample Test Cases</label>
                                <textarea
                                  rows={1.5}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                  value={tWeek4TestCases}
                                  onChange={e => setTWeek4TestCases(e.target.value)}
                                  placeholder="[3,9,20,null,null,15,7] -> 3"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400">Starter Template Code</label>
                              <textarea
                                rows={3}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                                value={tWeek4TemplateCode}
                                onChange={e => setTWeek4TemplateCode(e.target.value)}
                                placeholder="function solve(root) {\n  \n}"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Publishing Toggle option */}
                <div className="pt-5 mt-4 border-t border-slate-150 dark:border-white/5 space-y-4">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200/40 dark:border-indigo-500/15 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="publishImmediatelyCheckbox"
                        checked={publishImmediately}
                        onChange={(e) => setPublishImmediately(e.target.checked)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                      <div className="space-y-1">
                        <label htmlFor="publishImmediatelyCheckbox" className="text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer block select-none">
                          🚀 Publish & Deploy Weekly Evolution Milestones Immediately
                        </label>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Checking this will instantly publish active continuous weekly evaluation tracks to all targeted students mapped to this course and batch.
                        </p>
                      </div>
                    </div>

                    {publishImmediately && (
                      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-500/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Student Course (Mapped)</label>
                          <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {templateCourse || "No course mapped yet"}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Target Student Batch</label>
                          <select
                            value={publishTargetBatch}
                            onChange={(e) => setPublishTargetBatch(e.target.value)}
                            className="w-full bg-white dark:bg-[#1a1b1e] border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-800 dark:text-zinc-200"
                            disabled={!templateCourse}
                          >
                            {!templateCourse ? (
                              <option value="">-- Choose Course First --</option>
                            ) : (
                              <>
                                <option value="All">All Batches</option>
                                {getBatchesForCourse(templateCourse).map(b => (
                                  <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-150 dark:border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPipelineTab('bank')}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#1a1b1e] dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Blueprint Template
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation of deletion popup */}
      {deletingTemplateId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#070708] border border-slate-200 dark:border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Evolution Blueprint?</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you absolutely sure you want to remove this monthly evolution blueprint template from the bank? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplateId(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Keep Template
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(deletingTemplateId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
