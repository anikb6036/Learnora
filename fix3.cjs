const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');
content = content.replace(/text-sm mb-1/g, 'text-sm');
fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
appContent = appContent.replace(/text-sm mb-1/g, 'text-sm');
fs.writeFileSync('./src/App.tsx', appContent);

console.log('Fixed styles.');
