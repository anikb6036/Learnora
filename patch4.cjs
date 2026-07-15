const fs = require('fs');
let code = fs.readFileSync('src/components/ProgressTracker.tsx', 'utf8');

const targetStr = `                      const currentEvo = studentEvolutions.find(
                        ev => ev.studentId === selectedEvolutionStudentId && ev.month === selectedEvolutionMonth && ev.status !== 'draft'
                      );
                      return (`;

const replacementStr = `                      const currentEvo = studentEvolutions.find(
                        ev => ev.studentId === selectedEvolutionStudentId && ev.month === selectedEvolutionMonth && ev.status !== 'draft'
                      );
                      const isWeeksForAdmin = COURSES.find(c => c.title === selectedEvolutionCourse)?.durationUnit === 'weeks';
                      const subUnitLabel = isWeeksForAdmin ? 'Day' : 'Week';
                      return (`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/ProgressTracker.tsx', code);
