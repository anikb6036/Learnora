const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');

// The screenshot shows the tiny pill tags and names inside the student table are too big.
// At line ~1299 the name is "text-xs" which is fine maybe
// Let's replace some specific patterns in the pills to use text-[10px] since text-xs is too large for pills.

content = content.replace(/className="text-xs  font-medium px-2 py-0.5/g, 'className="text-[10px] px-2 py-0.5');
content = content.replace(/className="text-xs  font-bold px-1.5 py-0.5/g, 'className="text-[10px] font-bold px-1.5 py-0.5');
content = content.replace(/className="text-xs  font-semibold px-2 py-0.5/g, 'className="text-[10px] font-semibold px-2 py-0.5');
content = content.replace(/className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs/g, 'className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px]');
content = content.replace(/className="text-xs text-slate-400 dark:text-gray-500 truncate "/g, 'className="text-[11px] text-slate-400 dark:text-gray-500 truncate "');
content = content.replace(/className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate max-w-full "/g, 'className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate max-w-full "');
content = content.replace(/className="font-semibold text-slate-850 dark:text-zinc-150 text-xs/g, 'className="font-bold text-slate-850 dark:text-zinc-150 text-[13px]');

fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

console.log('Fixed sizes in tables');
