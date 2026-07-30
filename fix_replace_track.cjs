const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// replace syncWebRTCTracks
content = content.replace(/\/\/ 1b\. Sync tracks logic[\s\S]*?\]\); \/\/ also sync when participants change/m, `// 1b. Sync tracks logic
  const syncWebRTCTracks = () => {
    const stream = localStreamRef.current;
    
    Object.entries(peerConnectionsRef.current).forEach(([peerId, conn]) => {
      const { pc } = conn as { pc: RTCPeerConnection; unsub: () => void };
      try {
        const senders = pc.getSenders();
        if (senders.length >= 2) {
          const audioSender = senders[0];
          const videoSender = senders[1];
          
          const audioTrack = stream?.getAudioTracks()[0] || null;
          const videoTrack = stream?.getVideoTracks()[0] || null;

          audioSender.replaceTrack(audioTrack).catch(e => console.warn("Audio replace failed", e));
          videoSender.replaceTrack(videoTrack).catch(e => console.warn("Video replace failed", e));
        }
      } catch (err) {
        console.warn("Failed to synchronize tracks on connection with peer: " + peerId, err);
      }
    });
  };

  // Sync when dependencies change
  useEffect(() => {
    syncWebRTCTracks();
  }, [isCameraOn, isMicOn, participants]); // also sync when participants change`);

// replace PC setup
content = content.replace(/const polite = currentUser\.id === callerId;[\s\S]*?const pc = new RTCPeerConnection\(\{/m, `const polite = currentUser.id === callerId; 

        const pc = new RTCPeerConnection({`);

content = content.replace(/\/\/ Add local tracks if stream is active[\s\S]*?\/\/ On track event from remote peer/m, `// Add transceivers for audio and video to avoid renegotiation on track changes
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });

        // On track event from remote peer`);

content = content.replace(/const remoteStream = event\.streams\[0\] \? new MediaStream\(event\.streams\[0\]\.getTracks\(\)\) : new MediaStream\(\[event\.track\]\);\s*return \{\s*\.\.\.prev,\s*\[p\.id\]: remoteStream\s*\};\s*\}\);/m, `const remoteStream = new MediaStream([event.track]);
            return {
              ...prev,
              [p.id]: remoteStream
            };
          });`);

fs.writeFileSync('src/components/Classroom.tsx', content);
