const fs = require('fs');
let code = fs.readFileSync('src/components/ReportingDashboard.tsx', 'utf8');

code = code.replace('const allBatches = new Set();', 'const allBatches = new Set<string>();');

fs.writeFileSync('src/components/ReportingDashboard.tsx', code);
console.log("Fixed type");
