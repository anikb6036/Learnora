const fs = require('fs');

let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// We will extract the sync logic into a ref/function so it can be called after stream updates
content = content.replace(/\/\/ 1b\. Keep tracks on active connections in sync[\s\S]*?\/\/ 1c\. Clean up all connections on unmount/g, `// 1b. Sync tracks logic
  const syncWebRTCTracks = () => {
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
  };

  // Sync when dependencies change
  useEffect(() => {
    syncWebRTCTracks();
  }, [isCameraOn, isMicOn, participants]); // also sync when participants change (new peers joined)

  // 1c. Clean up all connections on unmount`);

content = content.replace(/\/\/ 1d\. Manage User Audio\/Video Media[\s\S]*?updatePresence\(\{ isVideoOn: true, isAudioOn: isMicOn \}\);/g, `// 1d. Manage User Audio/Video Media
  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
        .then(stream => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          syncWebRTCTracks(); // Explicitly sync tracks after acquiring media
          updatePresence({ isVideoOn: true, isAudioOn: isMicOn });`);

content = content.replace(/navigator\.mediaDevices\.getUserMedia\(\{ video: false, audio: true \}\)\s*\.then\(stream => \{\s*localStreamRef\.current = stream;\s*updatePresence\(\{ isVideoOn: false, isAudioOn: true \}\);/g, `navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then(stream => {
          localStreamRef.current = stream;
          syncWebRTCTracks();
          updatePresence({ isVideoOn: false, isAudioOn: true });`);

content = content.replace(/if \(localStreamRef\.current\) \{\s*localStreamRef\.current\.getTracks\(\)\.forEach\(t => t\.stop\(\)\);\s*localStreamRef\.current = null;\s*if \(localVideoRef\.current\) localVideoRef\.current\.srcObject = null;\s*\}/g, `if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        syncWebRTCTracks();
      }`);

fs.writeFileSync('src/components/Classroom.tsx', content);
console.log('Classroom.tsx track sync explicitly updated');
