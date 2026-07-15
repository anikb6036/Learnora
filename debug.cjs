const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/pc\.onconnectionstatechange = \(\) => \{/g, `pc.onconnectionstatechange = () => {
          console.log(\`WebRTC Connection State with \${p.id}: \${pc.connectionState}\`);
          if (pc.connectionState === 'connected') {
            console.log(\`Successfully connected to \${p.id}\`);
          }`);

fs.writeFileSync('src/components/Classroom.tsx', content);
