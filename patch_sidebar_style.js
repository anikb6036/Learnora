const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace active button classes
code = code.replace(/\? 'bg-amber-500\/10 border border-amber-500\/20 text-amber-500 font-bold'/g, 
  "? 'bg-slate-50 border border-slate-100 text-slate-900 dark:bg-white/[0.03] dark:border-white/10 dark:text-white font-semibold'");

// Replace inactive button classes
code = code.replace(/: 'text-slate-550 dark:text-gray-400 hover:text-amber-500 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-\[#161618\] border border-transparent'/g,
  ": 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50/50 dark:hover:bg-[#161618] border border-transparent'");

// Remove text-amber-500 from icons inside the nav
code = code.replace(/<([A-Z][a-zA-Z0-9_]*) className="w-4 h-4 flex-shrink-0 text-amber-500" \/>/g, '<$1 className="w-4 h-4 flex-shrink-0" />');
// Some might be text-amber-500 in other places, but we only want to target the ones inside the sidebar. Wait, all text-amber-500 icons in the file?
// Actually let's just do it for sidebar ones, which are w-4 h-4 flex-shrink-0 text-amber-500.

// Update "Change Simulator Role" button hover
code = code.replace(/hover:bg-amber-500\/10 dark:hover:bg-amber-500\/10 hover:text-amber-500 dark:hover:text-amber-500/g, 
  "hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white");

// Update section headers
code = code.replace(/group-hover\/header:text-amber-500/g, "group-hover/header:text-slate-900 dark:group-hover/header:text-white");

// Update Lock icon for fee settle
code = code.replace(/text-amber-500 flex-shrink-0 animate-pulse/g, "text-amber-500 flex-shrink-0");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched sidebar styles");
