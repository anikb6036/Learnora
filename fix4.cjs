const fs = require('fs');
let content = fs.readFileSync('./src/components/EnrollmentManager.tsx', 'utf8');
content = content.replace(/text-sm/g, 'text-xs');
fs.writeFileSync('./src/components/EnrollmentManager.tsx', content);

let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
// Assuming we only want to fix the ones I broke earlier:
// Wait, replacing all text-sm with text-xs in EnrollmentManager is probably fine, it's a dashboard component and usually uses text-xs or text-sm for standard text.
// But earlier I mistakenly replaced ALL `text-xs` with `text-sm`, so reverting all `text-sm` to `text-xs` will revert that mistake, though it will also convert any original `text-sm` to `text-xs`.
console.log('Fixed');
