const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="h-full w-full flex items-center px-5 py-4 bg-white border border-slate-200 rounded-\[10px\] text-\[13px\] text-slate-500 dark:bg-\[#161618\] dark:border-white\/10 dark:text-slate-400">[\s\S]*?No sessions scheduled for the day[\s\S]*?<\/div>/;
const replacement = `<div className="h-full w-full flex items-center px-5 py-4 bg-slate-50 border border-slate-200/50 rounded-2xl text-[13px] text-slate-400 dark:bg-white/[0.02] dark:border-white/5 dark:text-slate-500 font-medium italic shadow-sm">
                                          No sessions scheduled for the day
                                        </div>`;

if (regex.test(code)) {
  fs.writeFileSync('src/App.tsx', code.replace(regex, replacement));
  console.log("Empty schedule UI patched!");
} else {
  console.log("Empty schedule regex not matched!");
}
