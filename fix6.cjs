const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');

content = content.replace(/className="inline-flex items-center px-1\.5 py-0\.5 rounded-lg border text-xs/g, 'className="inline-flex items-center px-1.5 py-0.5 rounded-lg border text-[10px]');
content = content.replace(/className="inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-lg border text-xs/g, 'className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px]');
content = content.replace(/text-xs\s+text-slate-400\s+dark:text-gray-500\s+mt-0\.5/g, 'text-[10px] text-slate-400 dark:text-gray-500 mt-0.5');

fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

console.log('Fixed more badge sizes');
