const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');
content = content.replace(/text-\[(11|10|10\.5|9|9\.5)px\]/g, 'text-sm mb-1');
fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
appContent = appContent.replace(/text-\[(11|10|10\.5|9|9\.5)px\]/g, 'text-sm mb-1');
fs.writeFileSync('./src/App.tsx', appContent);

console.log("Done");
