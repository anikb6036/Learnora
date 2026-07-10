const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace role badge
code = code.replace(/text-amber-500 border border-slate-200 dark:border-white\/10 shadow-sm bg-amber-500\/10/g, 
  "text-blue-600 border border-blue-200/50 dark:border-blue-500/20 shadow-sm bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400");

// Replace fee settle required
code = code.replace(/bg-amber-500\/10 border border-amber-500\/20 text-amber-500 font-bold/g, 
  "bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 font-bold");
code = code.replace(/text-amber-500 flex-shrink-0 animate-pulse/g, "text-rose-500 flex-shrink-0 animate-pulse");

// Replace notification badge
code = code.replace(/bg-amber-500 text-amber-950/g, "bg-blue-500 text-white");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched additional amber colors");
