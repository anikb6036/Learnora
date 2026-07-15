const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/\/\/ 1b\. Keep tracks on active connections in sync[\s\S]*?\/\/ 1c\. Clean up all connections on unmount/g, `// 1b. Keep tracks on active connections in sync with local stream toggle transitions
  useEffect(() => {
    const stream = localStreamRef.current;
    
    Object.entries(peerConnectionsRef.current).forEach(([peerId, conn]) => {
      const { pc } = conn as { pc: RTCPeerConnection; unsub: () => void };
      try {
        const senders = pc.getSenders();
        const existingTrackIds = new Set(senders.map(s => s.track?.id).filter(Boolean));
        const newTrackIds = new Set(stream ? stream.getTracks().map(t => t.id) : []);

        // Remove tracks that are no longer in the local stream
        senders.forEach(sender => {
          if (sender.track && !newTrackIds.has(sender.track.id)) {
            try {
              pc.removeTrack(sender);
            } catch (e) {
              console.warn("Track removal non-fatal error", e);
            }
          }
        });

        // Add tracks that are in the local stream but not in the senders
        if (stream) {
          stream.getTracks().forEach(track => {
            if (!existingTrackIds.has(track.id)) {
              try {
                pc.addTrack(track, stream);
              } catch (e) {
                console.warn("Track addition non-fatal error", e);
              }
            }
          });
        }
      } catch (err) {
        console.warn("Failed to synchronize tracks on connection with peer: " + peerId, err);
      }
    });
  }, [localStreamRef.current, isCameraOn, isMicOn]);

  // 1c. Clean up all connections on unmount`);

fs.writeFileSync('src/components/Classroom.tsx', content);
console.log('Classroom.tsx track sync updated');
