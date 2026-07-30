const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/for \(const msg of sortedMessages\) \{/g, `for (const msg of sortedMessages) {
              if (msg.timestamp < connectionStartTime - 10000) continue; // ignore old messages`);

fs.writeFileSync('src/components/Classroom.tsx', content);
