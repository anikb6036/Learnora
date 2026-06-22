export interface DSAProblem {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string;
  testCases: string;
  starterCode: string;
}

export const EASY_PROBLEMS: DSAProblem[] = [
  {
    title: "1. Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    testCases: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
    starterCode: "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}"
  },
  {
    title: "20. Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    testCases: "Input: s = \"()[]{}\"\nOutput: true\n\nInput: s = \"(]\"\nOutput: false",
    starterCode: "function isValid(s) {\n    const stack = [];\n    const pairs = { ')': '(', '}': '{', ']': '[' };\n    for (let char of s) {\n        if (char === '(' || char === '{' || char === '[') {\n            stack.push(char);\n        } else {\n            if (stack.pop() !== pairs[char]) return false;\n        }\n    }\n    return stack.length === 0;\n}"
  },
  {
    title: "121. Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.",
    constraints: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
    testCases: "Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
    starterCode: "function maxProfit(prices) {\n    let minPrice = Infinity;\n    let maxProfit = 0;\n    for (let price of prices) {\n        if (price < minPrice) {\n            minPrice = price;\n        } else if (price - minPrice > maxProfit) {\n            maxProfit = price - minPrice;\n        }\n    }\n    return maxProfit;\n}"
  }
];

export const MEDIUM_PROBLEMS: DSAProblem[] = [
  {
    title: "3. Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: "Given a string `s`, find the length of the **longest substring** without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
    testCases: "Input: s = \"abcabcbb\"\nOutput: 3\nExplanation: The answer is \"abc\", with the length of 3.",
    starterCode: "function lengthOfLongestSubstring(s) {\n    let maxLen = 0;\n    let start = 0;\n    const seen = new Map();\n    for (let end = 0; end < s.length; end++) {\n        if (seen.has(s[end])) {\n            start = Math.max(start, seen.get(s[end]) + 1);\n        }\n        seen.set(s[end], end);\n        maxLen = Math.max(maxLen, end - start + 1);\n    }\n    return maxLen;\n}"
  },
  {
    title: "11. Container With Most Water",
    difficulty: "Medium",
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn *the maximum amount of water a container can store*.",
    constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
    testCases: "Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\nExplanation: The max area is formed between 8 and 7, width is 7, height is 7, area = 49.",
    starterCode: "function maxArea(height) {\n    let maxVal = 0;\n    let left = 0, right = height.length - 1;\n    while (left < right) {\n        const currentHeight = Math.min(height[left], height[right]);\n        maxVal = Math.max(maxVal, currentHeight * (right - left));\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return maxVal;\n}"
  },
  {
    title: "15. 3Sum",
    difficulty: "Medium",
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] === 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    constraints: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
    testCases: "Input: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]",
    starterCode: "function threeSum(nums) {\n    nums.sort((a,b) => a - b);\n    const result = [];\n    for (let i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] === nums[i - 1]) continue;\n        let left = i + 1, right = nums.length - 1;\n        while (left < right) {\n            const sum = nums[i] + nums[left] + nums[right];\n            if (sum === 0) {\n                result.push([nums[i], nums[left], nums[right]]);\n                while (left < right && nums[left] === nums[left + 1]) left++;\n                while (left < right && nums[right] === nums[right - 1]) right--;\n                left++; right--;\n            } else if (sum < 0) left++;\n            else right--;\n        }\n    }\n    return result;\n}"
  }
];

export const HARD_PROBLEMS: DSAProblem[] = [
  {
    title: "42. Trapping Rain Water",
    difficulty: "Hard",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    constraints: "n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    testCases: "Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\nExplanation: 6 units of rain water are being trapped.",
    starterCode: "function trap(height) {\n    let left = 0, right = height.length - 1;\n    let leftMax = 0, rightMax = 0;\n    let ans = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            if (height[left] >= leftMax) leftMax = height[left];\n            else ans += leftMax - height[left];\n            left++;\n        } else {\n            if (height[right] >= rightMax) rightMax = height[right];\n            else ans += rightMax - height[right];\n            right--;\n        }\n    }\n    return ans;\n}"
  },
  {
    title: "4. Median of Two Sorted Arrays",
    difficulty: "Hard",
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return **the median** of the two sorted arrays.\n\nThe overall run time complexity should be `O(log (m+n))`.",
    constraints: "nums1.length == m, nums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000",
    testCases: "Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\nExplanation: merged array = [1,2,3] and median is 2.",
    starterCode: "function findMedianSortedArrays(nums1, nums2) {\n    const merged = [...nums1, ...nums2].sort((a,b) => a - b);\n    const len = merged.length;\n    if (len % 2 === 0) {\n        return (merged[len/2 - 1] + merged[len/2]) / 2;\n    } else {\n        return merged[Math.floor(len/2)];\n    }\n}"
  }
];
