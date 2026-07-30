const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// Replace the signaling setup to include a joinTimestamp and only process messages after it
content = content.replace(/activePeers\.forEach\(p => \{/g, `const connectionStartTime = Date.now();\n    activePeers.forEach(p => {`);

fs.writeFileSync('src/components/Classroom.tsx', content);
