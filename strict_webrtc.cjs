const fs = require('fs');

let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// Replace the entire Reconcile WebRTC block
const startStr = '// 1a. Reconcile WebRTC peer connections';
const endStr = '// 1b. Sync tracks logic';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

const replacement = `// 1a. Reconcile WebRTC peer connections with current active classroom participants
  useEffect(() => {
    const activePeers = participants.filter(p => p.id !== currentUser.id);
    const activePeerIds = new Set(activePeers.map(p => p.id));

    // Cleanup dead connections for peers who left
    Object.keys(peerConnectionsRef.current).forEach(peerId => {
      if (!activePeerIds.has(peerId)) {
        console.log(\`Peer \${peerId} left the classroom. Cleaning up WebRTC.\`);
        const conn = peerConnectionsRef.current[peerId];
        if (conn) {
          try {
            conn.unsub();
            conn.pc.close();
          } catch (e) {
            console.warn("Error closing peer connection", e);
          }
          delete peerConnectionsRef.current[peerId];
        }
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    });

    // Setup new connections for newly joined peers
    activePeers.forEach(p => {
      if (!peerConnectionsRef.current[p.id]) {
        console.log(\`Setting up new WebRTC peer connection for participant: \${p.name} (\${p.id})\`);
        
        const callerId = currentUser.id < p.id ? currentUser.id : p.id;
        const receiverId = currentUser.id < p.id ? p.id : currentUser.id;
        const connectionId = \`\${callerId}_\${receiverId}\`;
        const isCaller = currentUser.id === callerId;

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        });

        // Add transceivers for audio and video to avoid renegotiation on track changes
        pc.addTransceiver('audio', { direction: 'sendrecv' });
        pc.addTransceiver('video', { direction: 'sendrecv' });

        pc.onconnectionstatechange = () => {
          console.log(\`WebRTC Connection State with \${p.id}: \${pc.connectionState}\`);
        };

        // On track event from remote peer
        pc.ontrack = (event) => {
          console.log(\`Received track from peer \${p.id}:\`, event.track.kind);
          setRemoteStreams(prev => {
            const existing = prev[p.id];
            if (existing) {
              if (!existing.getTracks().find(t => t.id === event.track.id)) {
                existing.addTrack(event.track);
              }
              return { ...prev, [p.id]: new MediaStream(existing.getTracks()) };
            }
            const remoteStream = new MediaStream([event.track]);
            return {
              ...prev,
              [p.id]: remoteStream
            };
          });
        };

        // Negotiation needed
        pc.onnegotiationneeded = async () => {
          if (isCaller) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
              await setDoc(docRef, {
                offer: { type: offer.type, sdp: offer.sdp },
                callerId
              }, { merge: true });
            } catch (err) {
              console.error("Failed to create offer", err);
            }
          }
        };

        // Push local candidates to Firestore
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            try {
              const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
              await setDoc(docRef, {
                [isCaller ? 'callerCandidates' : 'calleeCandidates']: arrayUnion(event.candidate.toJSON())
              }, { merge: true });
            } catch (e) {
              console.warn("Error uploading local ICE candidate", e);
            }
          }
        };

        const addedCandidates = new Set<string>();

        // Setup real-time listener for the peer's answers or offers
        const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
        const unsub = onSnapshot(docRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          try {
            if (isCaller) {
              // Caller logic: receive answer and callee candidates
              if (data.answer && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              }
              if (data.calleeCandidates && Array.isArray(data.calleeCandidates)) {
                for (const candidate of data.calleeCandidates) {
                  const candStr = JSON.stringify(candidate);
                  if (!addedCandidates.has(candStr)) {
                    addedCandidates.add(candStr);
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                  }
                }
              }
            } else {
              // Callee logic: receive offer and caller candidates
              if (data.offer && !pc.remoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await setDoc(docRef, {
                  answer: { type: answer.type, sdp: answer.sdp }
                }, { merge: true });
              }
              if (data.callerCandidates && Array.isArray(data.callerCandidates)) {
                for (const candidate of data.callerCandidates) {
                  const candStr = JSON.stringify(candidate);
                  if (!addedCandidates.has(candStr)) {
                    addedCandidates.add(candStr);
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                  }
                }
              }
            }
          } catch (err) {
            console.error("WebRTC Signaling Error", err);
          }
        });

        peerConnectionsRef.current[p.id] = { pc, unsub };
      }
    });
  }, [participants]);

  `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync('src/components/Classroom.tsx', newContent);
console.log("Done");
