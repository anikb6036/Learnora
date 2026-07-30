const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');

// Fix the typo text-xssssss
content = content.replace(/text-xs+/g, 'text-sm');
content = content.replace(/text-\[(11|10|10\.5|9|9\.5)px\]/g, 'text-sm');

// Form font to normal sans-serif text
content = content.replace(/font-mono/g, '');
content = content.replace(/uppercase/g, '');
content = content.replace(/tracking-wider/g, '');
content = content.replace(/tracking-widest/g, '');

fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
appContent = appContent.replace(/text-\[(11|10|10\.5|9|9\.5)px\]/g, 'text-sm');
fs.writeFileSync('./src/App.tsx', appContent);

console.log('Fixed styles.');
