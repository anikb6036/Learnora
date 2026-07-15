const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/pc\.onnegotiationneeded = async \(\) => \{/g, `pc.onconnectionstatechange = () => {
          console.log(\`WebRTC Connection State with \${p.id}: \${pc.connectionState}\`);
        };
        pc.oniceconnectionstatechange = () => {
          console.log(\`WebRTC ICE State with \${p.id}: \${pc.iceConnectionState}\`);
        };

        pc.onnegotiationneeded = async () => {`);

fs.writeFileSync('src/components/Classroom.tsx', content);
