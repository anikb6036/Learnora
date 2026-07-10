const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/<Lock className="w-4 h-4 text-amber-500 flex-shrink-0" \/>/g, '<Lock className="w-4 h-4 text-rose-500 flex-shrink-0" />');
fs.writeFileSync('src/App.tsx', code);
console.log("Patched Lock");
