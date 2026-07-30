const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/pc\.ontrack = \(event\) => \{[\s\S]*?\/\/ Negotiation needed/m, `pc.ontrack = (event) => {
          console.log(\`Received track from peer \${p.id}:\`, event.track.kind);
          setRemoteStreams(prev => {
            const existing = prev[p.id];
            if (existing) {
              if (!existing.getTracks().find(t => t.id === event.track.id)) {
                existing.addTrack(event.track);
              }
              // clone to trigger react render
              return { ...prev, [p.id]: new MediaStream(existing.getTracks()) };
            }
            const remoteStream = event.streams[0] ? new MediaStream(event.streams[0].getTracks()) : new MediaStream([event.track]);
            return {
              ...prev,
              [p.id]: remoteStream
            };
          });
        };

        // Negotiation needed`);

fs.writeFileSync('src/components/Classroom.tsx', content);
