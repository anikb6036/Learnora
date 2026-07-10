const fs = require('fs');
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
const textSmCount = (appContent.match(/text-sm/g) || []).length;
console.log('text-sm count:', textSmCount);

const textXsCount = (appContent.match(/text-xs/g) || []).length;
console.log('text-xs count:', textXsCount);
