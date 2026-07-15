const fs = require('fs');

let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// Replace the WebRTC initialization block
content = content.replace(/\/\/ 1a\. Reconcile WebRTC peer connections[\s\S]*?\/\/ 1b\. Keep tracks on active connections/g, `// 1a. Reconcile WebRTC peer connections with current active classroom participants
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
        
        // Politeness: one peer is polite (yields on collision), the other is impolite
        const polite = currentUser.id === callerId; 

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        });

        let makingOffer = false;
        let ignoreOffer = false;
        const processedMessages = new Set<string>();

        // Add local tracks if stream is active
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            try {
              pc.addTrack(track, localStreamRef.current!);
            } catch (e) {
              console.warn("Failed to add track", e);
            }
          });
        }

        // On track event from remote peer
        pc.ontrack = (event) => {
          console.log(\`Received track from peer \${p.id}:\`, event.track.kind);
          setRemoteStreams(prev => {
            const existing = prev[p.id];
            if (existing) {
              // Only add the track if it doesn't already exist on the stream
              if (!existing.getTracks().find(t => t.id === event.track.id)) {
                existing.addTrack(event.track);
              }
              // Return a new object to force re-render
              return { ...prev, [p.id]: existing };
            }
            const remoteStream = event.streams[0] || new MediaStream([event.track]);
            return {
              ...prev,
              [p.id]: remoteStream
            };
          });
        };

        // Negotiation needed
        pc.onnegotiationneeded = async () => {
          try {
            makingOffer = true;
            await pc.setLocalDescription(); // Creates an offer automatically
            const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
            const msgId = Math.random().toString(36).substring(2, 15);
            await setDoc(docRef, {
              messages: arrayUnion({
                id: msgId,
                senderId: currentUser.id,
                type: 'description',
                description: { type: pc.localDescription?.type, sdp: pc.localDescription?.sdp },
                timestamp: Date.now()
              })
            }, { merge: true });
          } catch (err) {
            console.error("Failed to create offer", err);
          } finally {
            makingOffer = false;
          }
        };

        // Push local candidates to Firestore
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            try {
              const candidateData = event.candidate.toJSON();
              const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
              const msgId = Math.random().toString(36).substring(2, 15);
              await setDoc(docRef, {
                messages: arrayUnion({
                  id: msgId,
                  senderId: currentUser.id,
                  type: 'candidate',
                  candidate: candidateData,
                  timestamp: Date.now()
                })
              }, { merge: true });
            } catch (e) {
              console.warn("Error uploading local ICE candidate", e);
            }
          }
        };

        // Setup real-time listener for the peer's answers or offers
        const docRef = doc(db, "app_state", \`webrtc-\${activeClass.id}-\${connectionId}\`);
        const unsub = onSnapshot(docRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          
          if (data.messages && Array.isArray(data.messages)) {
            // Sort messages by timestamp just in case
            const sortedMessages = [...data.messages].sort((a, b) => a.timestamp - b.timestamp);
            
            for (const msg of sortedMessages) {
              if (processedMessages.has(msg.id)) continue;
              processedMessages.add(msg.id);
              
              if (msg.senderId === currentUser.id) continue;

              try {
                if (msg.type === 'description' && msg.description) {
                  const description = msg.description;
                  const offerCollision = description.type === "offer" && (makingOffer || pc.signalingState !== "stable");
                  
                  ignoreOffer = !polite && offerCollision;
                  if (ignoreOffer) {
                    console.log("Ignoring colliding offer from", p.id);
                    continue;
                  }

                  await pc.setRemoteDescription(new RTCSessionDescription(description));
                  if (description.type === "offer") {
                    await pc.setLocalDescription();
                    
                    const answerMsgId = Math.random().toString(36).substring(2, 15);
                    await setDoc(docRef, {
                      messages: arrayUnion({
                        id: answerMsgId,
                        senderId: currentUser.id,
                        type: 'description',
                        description: { type: pc.localDescription?.type, sdp: pc.localDescription?.sdp },
                        timestamp: Date.now()
                      })
                    }, { merge: true });
                  }
                } else if (msg.type === 'candidate' && msg.candidate) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                  } catch (err) {
                    if (!ignoreOffer) {
                      console.error("Error adding received ICE candidate", err);
                    }
                  }
                }
              } catch (err) {
                console.error("WebRTC: Error processing signaling message", err);
              }
            }
          }
        });

        peerConnectionsRef.current[p.id] = { pc, unsub };
      }
    });
  }, [participants]);

  // 1b. Keep tracks on active connections`);

fs.writeFileSync('src/components/Classroom.tsx', content);
console.log('Classroom.tsx WebRTC signaling updated');
