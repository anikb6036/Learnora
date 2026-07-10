import fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div key=\{dateStr\} className="flex flex-col md:flex-row gap-4">[\s\S]*?<div className=\{`w-14 h-14 shrink-0 flex flex-col items-center justify-center rounded-xl text-center border \$\{[\s\S]*?i === 0[\s\S]*?\? 'bg-\[#437bef\] border-\[#437bef\] text-white'[\s\S]*?: 'bg-white border-transparent text-slate-700 dark:bg-transparent dark:text-slate-300'[\s\S]*?\}`\}>[\s\S]*?<span className="text-xs font-bold tracking-tight">\{dayAbbr\}<\/span>[\s\S]*?<span className="text-sm font-bold leading-none mt-0\.5">\{dayNum\}<\/span>[\s\S]*?<\/div>[\s\S]*?<div className="flex-1 min-w-0">[\s\S]*?\{daySchedules\.length === 0 && dayEvolutions\.length === 0 \? \([\s\S]*?<div className="h-full w-full flex items-center px-5 py-4 bg-white border border-slate-200 rounded-\[10px\] text-\[13px\] text-slate-500 dark:bg-\[#161618\] dark:border-white\/10 dark:text-slate-400">[\s\S]*?No sessions scheduled for the day[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<div className="space-y-2">/m;

const replacementStr = `<div key={dateStr} className="flex gap-4 relative group">
                                    {/* Timeline connector (except last item) */}
                                    {i !== 13 && (
                                      <div className="absolute left-[1.375rem] top-10 bottom-[-1rem] w-px bg-slate-200 dark:bg-white/10" />
                                    )}
                                    <div className="w-11 shrink-0 flex flex-col items-center pt-2 relative z-10">
                                      {i === 0 ? (
                                         <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow-md shadow-blue-600/20">
                                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{dayAbbr}</span>
                                            <span className="text-[14px] font-black leading-none mt-0.5">{dayNum}</span>
                                         </div>
                                      ) : (
                                         <div className="w-10 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                            <span className="text-[10px] font-semibold uppercase tracking-widest leading-none">{dayAbbr}</span>
                                            <span className="text-[15px] font-bold leading-none mt-1 text-slate-700 dark:text-slate-200">{dayNum}</span>
                                         </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 pb-6 pt-1.5">
                                      {daySchedules.length === 0 && dayEvolutions.length === 0 ? (
                                        <div className="flex items-center px-4 py-3 bg-slate-50/50 border border-slate-100/50 rounded-xl text-xs text-slate-400 dark:bg-white/[0.02] dark:border-white/5 dark:text-slate-500 font-medium italic">
                                          No sessions scheduled for this day
                                        </div>
                                      ) : (
                                        <div className="space-y-3">`;

if (regex.test(code)) {
  fs.writeFileSync('src/App.tsx', code.replace(regex, replacementStr));
  console.log("Patched successfully!");
} else {
  console.log("Could not find regex match!");
}
