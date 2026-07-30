const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace active button classes to be a bit darker grey
code = code.replace(/\? 'bg-slate-50 border border-slate-200\/60 text-slate-900 dark:bg-white\/\[0\.03\] dark:border-white\/10 dark:text-white font-semibold shadow-sm'/g, 
  "? 'bg-slate-200/50 border border-slate-300/50 text-slate-900 dark:bg-white/[0.05] dark:border-white/10 dark:text-white font-bold shadow-sm'");

// Replace font-bold to font-semibold for regular text if needed, actually "My Schedule" in screenshot is bold.

fs.writeFileSync('src/App.tsx', code);
console.log("Patched sidebar active background");
