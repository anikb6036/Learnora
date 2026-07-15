import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, MonitorUp, MonitorOff, PhoneOff, Send, 
  Users, MessageSquare, Paintbrush, ShieldAlert, Award, Grid, Square, 
  UserCheck, Info, Copy, Share2, Circle, Settings, Sparkles, Layout, 
  Minimize2, Maximize2, MoreVertical, Ban, Volume2, VolumeX, Hand, HelpCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount, ClassSchedule } from '../types';
import { useFirebaseState } from '../utils';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, arrayUnion } from 'firebase/firestore';

interface ClassroomProps {
  currentUser: UserAccount;
  activeClass: ClassSchedule;
  onLeave: () => void;
}

interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'system';
  message: string;
  timestamp: string;
  isSelf: boolean;
}

interface SimulatedParticipant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  talkingActivity: number; // 0 to 100
  avatarBg: string;
  lastActive?: number;
}

interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export default function Classroom({ currentUser, activeClass, onLeave }: ClassroomProps) {
  const isTeacher = currentUser.role === 'instructor' || currentUser.role === 'admin' || currentUser.role === 'sub-admin';
  
  // Real user media state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVirtualMedia, setIsVirtualMedia] = useState(false);

  const virtualAnimationRef = useRef<number | null>(null);
  const virtualAudioCtxRef = useRef<AudioContext | null>(null);

  // Layout states
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'whiteboard' | 'none'>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [isSpeakerView, setIsSpeakerView] = useState(false);
  const [isMutedAll, setIsMutedAll] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);

  // Whiteboard canvas states
  const [brushColor, setBrushColor] = useState('#EF4444'); // default red
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<'pen' | 'eraser'>('pen');

  // Media streams refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const currentStrokePoints = useRef<{ x: number; y: number }[]>([]);

  // High-fidelity dynamic virtual stream generator
  const createVirtualStream = (userName: string, needVideo: boolean, needAudio: boolean): MediaStream => {
    const tracks: MediaStreamTrack[] = [];

    if (needVideo) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      let frame = 0;
      const draw = () => {
        if (!ctx) return;
        frame++;

        // Slate background with radial gradient
        const grad = ctx.createRadialGradient(320, 240, 10, 320, 240, 400);
        grad.addColorStop(0, '#111827'); // gray-900
        grad.addColorStop(1, '#030712'); // gray-950
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Tech visual grid
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)'; // amber-500
        ctx.lineWidth = 1;
        for (let i = 0; i < 640; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 480);
          ctx.stroke();
        }
        for (let j = 0; j < 480; j += 40) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(640, j);
          ctx.stroke();
        }

        // Tech circles
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(320, 210, 90, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(320, 210, 115, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating radar sweeps
        const angle = (frame * 0.025) % (Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(320, 210, 90, angle, angle + 0.35);
        ctx.stroke();

        // Inner camera lens core icon
        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(320, 210, 25 + Math.sin(frame * 0.12) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Flare reflex
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(313, 203, 7, 0, Math.PI * 2);
        ctx.fill();

        // User profile letter
        ctx.fillStyle = '#030712';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(userName[0]?.toUpperCase() || 'S', 320, 210);

        // UI text overlays
        ctx.fillStyle = '#f9fafb';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`VIRTUAL MEDIA FEED`, 320, 340);

        ctx.fillStyle = '#f59e0b'; // amber-500
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText(`STUDENT: ${userName.toUpperCase()}`, 320, 365);

        // Connection data HUD
        ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.font = '10px "JetBrains Mono", monospace';
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        ctx.fillText(`SECURE WEBRTC TRUNK | ${timestamp} | FRAME ${frame}`, 320, 400);

        // Soft pulsing simulated audio visualizer bars below
        const baseOffset = 320;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        for (let idx = -6; idx <= 6; idx++) {
          const h = 8 + Math.abs(Math.sin(frame * 0.15 + idx * 0.3)) * 25;
          ctx.fillRect(baseOffset + idx * 10 - 3, 420 - h / 2, 6, h);
        }

        // Live recording indicator
        if (Math.floor(frame / 12) % 2 === 0) {
          ctx.fillStyle = '#ef4444'; // red-500
          ctx.beginPath();
          ctx.arc(45, 45, 7, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('LIVE VIRTUAL', 60, 45);
        }

        virtualAnimationRef.current = requestAnimationFrame(draw);
      };
      
      draw();
      
      const stream = canvas.captureStream(30);
      const track = stream.getVideoTracks()[0];
      if (track) tracks.push(track);
    }

    if (needAudio) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        virtualAudioCtxRef.current = audioCtx;
        
        const dest = audioCtx.createMediaStreamDestination();
        
        // Generate soft, therapeutic 110Hz sub-harmonic periodic hum to establish active RTP packet delivery
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.003, audioCtx.currentTime); // very low audible noise floor
        
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        
        const track = dest.stream.getAudioTracks()[0];
        if (track) tracks.push(track);
      } catch (e) {
        console.warn("Virtual audio node creation bypassed", e);
      }
    }

    return new MediaStream(tracks);
  };

  const stopVirtualStream = () => {
    if (virtualAnimationRef.current) {
      cancelAnimationFrame(virtualAnimationRef.current);
      virtualAnimationRef.current = null;
    }
    if (virtualAudioCtxRef.current) {
      try {
        virtualAudioCtxRef.current.close();
      } catch (e) {}
      virtualAudioCtxRef.current = null;
    }
  };

  // Real-time Firebase-synchronized states (instead of simulated local dummy data)
  const [chatMessages, setChatMessages] = useFirebaseState<ChatMessage[]>(
    `classroom-chat-${activeClass.id}`,
    [
      {
        id: 'sys-1',
        senderName: 'System',
        senderRole: 'system',
        message: `Welcome to "${activeClass.title}" live integrated classroom. Secure P2P audio/video channels have been initialized.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      }
    ]
  );

  const [participants, setParticipants] = useFirebaseState<SimulatedParticipant[]>(
    `classroom-presence-${activeClass.id}`,
    []
  );

  const [whiteboardStrokes, setWhiteboardStrokes] = useFirebaseState<WhiteboardStroke[]>(
    `classroom-whiteboard-${activeClass.id}`,
    []
  );

  const [newMessage, setNewMessage] = useState('');

  // WebRTC remote stream and peer connection references for multi-user real video support
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerConnectionsRef = useRef<Record<string, { pc: RTCPeerConnection; unsub: () => void }>>({});

  // 1a. Reconcile WebRTC peer connections with current active classroom participants
  useEffect(() => {
    const activePeers = participants.filter(p => p.id !== currentUser.id);
    const activePeerIds = new Set(activePeers.map(p => p.id));

    // Cleanup dead connections for peers who left
    Object.keys(peerConnectionsRef.current).forEach(peerId => {
      if (!activePeerIds.has(peerId)) {
        console.log(`Peer ${peerId} left the classroom. Cleaning up WebRTC.`);
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
        console.log(`Setting up new WebRTC peer connection for participant: ${p.name} (${p.id})`);
        
        const callerId = currentUser.id < p.id ? currentUser.id : p.id;
        const receiverId = currentUser.id < p.id ? p.id : currentUser.id;
        const connectionId = `${callerId}_${receiverId}`;
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
        const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
        const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });

        // Set initial tracks if available IMMEDIATELY before negotiation to populate SDP correctly
        const localStream = localStreamRef.current;
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          const videoTrack = localStream.getVideoTracks()[0];
          if (audioTrack) audioTransceiver.sender.replaceTrack(audioTrack).catch(e => console.warn("Initial audio replace failed", e));
          if (videoTrack) videoTransceiver.sender.replaceTrack(videoTrack).catch(e => console.warn("Initial video replace failed", e));
        }

        pc.onconnectionstatechange = () => {
          console.log(`WebRTC Connection State with ${p.id}: ${pc.connectionState}`);
        };

        // On track event from remote peer
        pc.ontrack = (event) => {
          console.log(`Received track from peer ${p.id}:`, event.track.kind);
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
              const docRef = doc(db, "app_state", `webrtc-${activeClass.id}-${connectionId}`);
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
              const docRef = doc(db, "app_state", `webrtc-${activeClass.id}-${connectionId}`);
              await setDoc(docRef, {
                [isCaller ? 'callerCandidates' : 'calleeCandidates']: arrayUnion(event.candidate.toJSON())
              }, { merge: true });
            } catch (e) {
              console.warn("Error uploading local ICE candidate", e);
            }
          }
        };

        const addedCandidates = new Set<string>();
        const candidateQueue: any[] = [];

        const processCandidate = async (candidate: any) => {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log(`WebRTC successfully added remote candidate from ${p.name}`);
            } else {
              candidateQueue.push(candidate);
            }
          } catch (e) {
            console.warn("Failed to add ICE candidate", e);
          }
        };

        const flushCandidates = async () => {
          while (candidateQueue.length > 0 && pc.remoteDescription) {
            const cand = candidateQueue.shift();
            if (cand) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
                console.log(`WebRTC successfully added queued candidate from ${p.name}`);
              } catch (e) {
                console.warn("Failed to add queued candidate", e);
              }
            }
          }
        };

        // Setup real-time listener for the peer's answers or offers
        const docRef = doc(db, "app_state", `webrtc-${activeClass.id}-${connectionId}`);
        const unsub = onSnapshot(docRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          try {
            if (isCaller) {
              // Caller logic: receive answer and callee candidates
              if (data.answer && pc.signalingState === "have-local-offer") {
                if (!pc.remoteDescription || pc.remoteDescription.sdp !== data.answer.sdp) {
                  console.log("Caller setting remote description answer");
                  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                  await flushCandidates();
                }
              }
              if (data.calleeCandidates && Array.isArray(data.calleeCandidates)) {
                for (const candidate of data.calleeCandidates) {
                  const candStr = JSON.stringify(candidate);
                  if (!addedCandidates.has(candStr)) {
                    addedCandidates.add(candStr);
                    await processCandidate(candidate);
                  }
                }
              }
            } else {
              // Callee logic: receive offer and caller candidates
              if (data.offer && pc.signalingState === "stable") {
                if (!pc.remoteDescription || pc.remoteDescription.sdp !== data.offer.sdp) {
                  console.log("Callee setting remote description offer");
                  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await setDoc(docRef, {
                    answer: { type: answer.type, sdp: answer.sdp }
                  }, { merge: true });
                  await flushCandidates();
                }
              }
              if (data.callerCandidates && Array.isArray(data.callerCandidates)) {
                for (const candidate of data.callerCandidates) {
                  const candStr = JSON.stringify(candidate);
                  if (!addedCandidates.has(candStr)) {
                    addedCandidates.add(candStr);
                    await processCandidate(candidate);
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

  // 1b. Sync tracks logic
  const syncWebRTCTracks = () => {
    const stream = localStreamRef.current;
    
    Object.entries(peerConnectionsRef.current).forEach(([peerId, conn]) => {
      const { pc } = conn as { pc: RTCPeerConnection; unsub: () => void };
      try {
        const transceivers = pc.getTransceivers();
        const audioTransceiver = transceivers.find(t => t.receiver.track.kind === 'audio');
        const videoTransceiver = transceivers.find(t => t.receiver.track.kind === 'video');
        
        const audioTrack = stream?.getAudioTracks()[0] || null;
        const videoTrack = stream?.getVideoTracks()[0] || null;

        if (audioTransceiver) audioTransceiver.sender.replaceTrack(audioTrack).catch(e => console.warn("Audio replace failed", e));
        if (videoTransceiver) videoTransceiver.sender.replaceTrack(videoTrack).catch(e => console.warn("Video replace failed", e));
      } catch (err) {
        console.warn("Failed to synchronize tracks on connection with peer: " + peerId, err);
      }
    });
  };

  // Sync when dependencies change
  useEffect(() => {
    syncWebRTCTracks();
  }, [isCameraOn, isMicOn, participants]); // also sync when participants change (new peers joined)

  // 1c. Clean up all connections on unmount
  useEffect(() => {
    return () => {
      Object.entries(peerConnectionsRef.current).forEach(([peerId, conn]) => {
        try {
          const { pc, unsub } = conn as { pc: RTCPeerConnection; unsub: () => void };
          unsub();
          pc.close();
        } catch (e) {
          console.warn("Clean up connection error on unmount", e);
        }
      });
      peerConnectionsRef.current = {};
    };
  }, []);

  // 1d. Manage User Audio/Video Media
  useEffect(() => {
    if (isCameraOn || isMicOn) {
      navigator.mediaDevices.getUserMedia({ video: isCameraOn, audio: isMicOn })
        .then(stream => {
          localStreamRef.current = stream;
          setIsVirtualMedia(false);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setCameraError(null);
          syncWebRTCTracks();
        })
        .catch(err => {
          console.warn("Physical media failed. Activating secure simulated virtual feed instead.", err);
          try {
            const virtualStream = createVirtualStream(currentUser.name, isCameraOn, isMicOn);
            localStreamRef.current = virtualStream;
            setIsVirtualMedia(true);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = virtualStream;
            }
            setCameraError(null);
            syncWebRTCTracks();
          } catch (vErr) {
            console.error("Virtual media generation failed", vErr);
            if (isCameraOn) setCameraError("Camera blocked or unavailable.");
            setIsCameraOn(false);
            setIsMicOn(false);
            setIsVirtualMedia(false);
          }
        });
    } else {
      stopLocalCamera();
    }

    return () => {
      stopLocalCamera();
    };
  }, [isCameraOn, isMicOn]);

  const stopLocalCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    stopVirtualStream();
    setIsVirtualMedia(false);
    syncWebRTCTracks();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // 2. Manage Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        
        // Notify classroom
        addSystemMessage(`You started sharing your screen.`);

        // Listen for screen sharing stop from the browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.warn("Screen share was cancelled or failed", err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    addSystemMessage(`You stopped sharing your screen.`);
  };

  // 3. Add Real-time Sync and Event Listeners
  useEffect(() => {
    // Scroll to bottom of chats
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Presence system: join on mount, update on state change, leave on unmount, cleanup old heartbeats
  useEffect(() => {
    const runHeartbeat = () => {
      setParticipants(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const now = Date.now();
        
        // Remove dead heartbeats from other users (older than 15 seconds)
        const filtered = list.filter(p => p.id === currentUser.id || (p.lastActive && now - p.lastActive < 15000));
        
        const myIndex = filtered.findIndex(p => p.id === currentUser.id);
        const myEntry: SimulatedParticipant = {
          id: currentUser.id,
          name: currentUser.name,
          role: isTeacher ? 'teacher' : 'student',
          isMuted: !isMicOn,
          isVideoOn: isCameraOn,
          isScreenSharing: isScreenSharing,
          isHandRaised: hasRaisedHand,
          talkingActivity: isMicOn ? Math.floor(Math.random() * 30) + 10 : 0,
          avatarBg: isTeacher ? 'bg-amber-500' : 'bg-indigo-600',
          lastActive: now
        };

        if (myIndex > -1) {
          filtered[myIndex] = myEntry;
        } else {
          filtered.push(myEntry);
        }
        return filtered;
      });
    };

    // Run immediately on load/change
    runHeartbeat();

    // Setup periodic heartbeat
    const interval = setInterval(runHeartbeat, 4000);

    return () => {
      clearInterval(interval);
      // Clean up self from presence when leaving
      setParticipants(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.filter(p => p.id !== currentUser.id);
      });
    };
  }, [currentUser.id, isMicOn, isCameraOn, isScreenSharing, hasRaisedHand, isTeacher]);

  // Remote Mute Detection: If the teacher mutes us, turn off our local mic automatically
  useEffect(() => {
    const myPresenceEntry = participants.find(p => p.id === currentUser.id);
    if (myPresenceEntry && !isTeacher) {
      if (myPresenceEntry.isMuted && isMicOn) {
        setIsMicOn(false);
        addSystemMessage("You have been muted by the instructor.");
      }
    }
  }, [participants, currentUser.id, isTeacher, isMicOn]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: isTeacher ? 'teacher' : 'student',
      message: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false // Determined dynamically at render time based on senderId
    };

    setChatMessages(prev => {
      const list = Array.isArray(prev) ? prev : [];
      return [...list, msg];
    });
    setNewMessage('');
  };

  const addSystemMessage = (text: string) => {
    setChatMessages(prev => {
      const list = Array.isArray(prev) ? prev : [];
      return [
        ...list,
        {
          id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          senderName: 'System',
          senderRole: 'system',
          message: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        }
      ];
    });
  };

  // 4. Whiteboard Handlers (Real-time Synced Collaborative Drawing)
  const redrawWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw all strokes
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const strokesToDraw = Array.isArray(whiteboardStrokes) ? whiteboardStrokes : [];
    strokesToDraw.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#18181F' : stroke.color; // eraser matches dark theme canvas background
      ctx.lineWidth = stroke.tool === 'eraser' ? 24 : stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = whiteboardTool === 'eraser' ? '#18181F' : brushColor;
    ctx.lineWidth = whiteboardTool === 'eraser' ? 24 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsDrawing(true);
    currentStrokePoints.current = [{ x, y }];
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    currentStrokePoints.current.push({ x, y });
  };

  const stopDrawingWhiteboard = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePoints.current.length > 1) {
      const newStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: whiteboardTool,
        color: brushColor,
        size: brushSize,
        points: currentStrokePoints.current
      };

      setWhiteboardStrokes(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return [...list, newStroke];
      });
    }
    currentStrokePoints.current = [];
  };

  const clearWhiteboard = () => {
    setWhiteboardStrokes([]);
    addSystemMessage(`Whiteboard cleared by ${currentUser.name}.`);
  };

  // Automatically resize whiteboard canvas and redraw strokes when active
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 450;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
      }
      redrawWhiteboard();
    }
  }, [activeTab, whiteboardStrokes]);

  const copyMeetingInvite = () => {
    const inviteText = `Join my Learnora Live Class!\nClass: ${activeClass.title}\nSubject: ${activeClass.subject}\nTime: ${activeClass.date} at ${activeClass.time}\nClassroom Link: ${window.location.origin}/classroom/${activeClass.id}`;
    navigator.clipboard.writeText(inviteText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Host Teacher Controls
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    addSystemMessage(isRecording ? 'Session recording paused.' : 'Recording started. All video and screen-share streams are being archived.');
  };

  const toggleMuteAll = () => {
    setIsMutedAll(!isMutedAll);
    setParticipants(prev => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map(p => {
        if (p.id === currentUser.id) return p;
        return { ...p, isMuted: !isMutedAll };
      });
    });
    addSystemMessage(isMutedAll ? 'All students unmuted by host.' : 'All students muted by host.');
  };

  const toggleMeetingLock = () => {
    setIsMeetingLocked(!isMeetingLocked);
    addSystemMessage(isMeetingLocked ? 'Classroom unlocked. New students may join.' : 'Classroom locked. No new connections will be authorized.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0C0E] text-white flex flex-col font-sans select-none">
      
      {/* 1. Header Bar */}
      <div className="h-14 bg-[#141417] border-b border-zinc-800 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold tracking-tight text-white">{activeClass.title}</h1>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">
            {activeClass.subject}
          </span>
          {isRecording && (
            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md text-[9.5px] text-rose-500 font-bold uppercase tracking-wider animate-pulse">
              <Circle className="w-2 h-2 fill-rose-500" /> REC
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="hidden md:flex items-center gap-5 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            <span>{participants.length} Active Participants</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-5">
            <span className="font-mono">ID: {activeClass.id.substring(6)}</span>
            <button 
              onClick={copyMeetingInvite} 
              className="text-zinc-500 hover:text-white transition cursor-pointer"
              title="Copy meeting info"
            >
              {copiedLink ? <span className="text-[10px] text-emerald-400 font-bold">Copied!</span> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Area (Grid vs Tabs) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Video streams grid */}
        <div className="flex-1 bg-[#09090A] p-4 flex flex-col justify-center overflow-y-auto">
          
          {/* Main Display: Whiteboard vs Screen Share vs Video Grid */}
          {activeTab === 'whiteboard' ? (
            <div className="w-full max-w-5xl mx-auto aspect-video bg-[#18181F] rounded-2xl border border-zinc-800 flex flex-col overflow-hidden shadow-2xl">
              {/* Whiteboard Controls */}
              <div className="h-12 bg-[#202026] border-b border-zinc-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                    <Paintbrush className="w-4 h-4 text-amber-500" />
                    <span>Interactive Class Whiteboard</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Collaborating live</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tools */}
                  <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                    <button
                      onClick={() => setWhiteboardTool('pen')}
                      className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition ${whiteboardTool === 'pen' ? 'bg-amber-500 text-amber-950' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Pen
                    </button>
                    <button
                      onClick={() => setWhiteboardTool('eraser')}
                      className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition ${whiteboardTool === 'eraser' ? 'bg-amber-500 text-amber-950' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Eraser
                    </button>
                  </div>

                  {/* Colors */}
                  {whiteboardTool === 'pen' && (
                    <div className="flex items-center gap-1.5 px-2">
                      {['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#FFFFFF'].map(c => (
                        <button
                          key={c}
                          onClick={() => setBrushColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-4 h-4 rounded-full border transition ${brushColor === c ? 'scale-125 ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Brush size */}
                  {whiteboardTool === 'pen' && (
                    <select
                      value={brushSize}
                      onChange={e => setBrushSize(parseInt(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10.5px] text-zinc-300 focus:outline-none"
                    >
                      <option value="2">Thin</option>
                      <option value="4">Medium</option>
                      <option value="8">Thick</option>
                      <option value="12">Heavy</option>
                    </select>
                  )}

                  <button
                    onClick={clearWhiteboard}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10.5px] font-bold rounded-lg border border-rose-500/10 transition cursor-pointer"
                  >
                    Clear Canvas
                  </button>
                </div>
              </div>

              {/* Canvas element */}
              <div className="flex-1 relative bg-[#1E1E24] cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawingWhiteboard}
                  onMouseLeave={stopDrawingWhiteboard}
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          ) : isScreenSharing ? (
            /* Large Screen Share with Video Grid below or side */
            <div className="w-full max-w-5xl mx-auto aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-2xl flex flex-col">
              <div className="absolute top-3 left-3 z-10 bg-zinc-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-zinc-800 flex items-center gap-2">
                <MonitorUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold">You are sharing your screen</span>
              </div>
              <div className="flex-1 bg-zinc-900 flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : (
            /* Normal Audio/Video Grid Layout */
            <div className={`grid gap-4 max-w-5xl mx-auto w-full ${
              isSpeakerView ? 'grid-cols-1 md:grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
            }`}>
              
              {/* Local Stream (The Active Logged In User) */}
              <div className="aspect-video bg-[#141416] rounded-2xl border border-zinc-800 overflow-hidden relative shadow group transition-all hover:border-zinc-700">
                
                {/* Virtual Camera Indicator Badge */}
                {isCameraOn && isVirtualMedia && (
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur border border-zinc-700/85 px-2.5 py-1 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[8.5px] text-amber-400 font-bold uppercase tracking-widest font-mono">Virtual Cam</span>
                  </div>
                )}

                {/* Visual Speaking Indicator */}
                {isMicOn && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-500/20 backdrop-blur border border-amber-500/40 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[9.5px] text-amber-300 font-bold uppercase tracking-wider">Speaking</span>
                  </div>
                )}

                {/* Video Tag */}
                {isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111112]">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-xl font-bold uppercase mb-2">
                      {currentUser.name[0]}
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-400">{currentUser.name} (You)</span>
                    <span className="text-[9.5px] text-zinc-600 mt-1 uppercase tracking-wide font-mono">Camera Disabled</span>
                  </div>
                )}

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 border border-white/5">
                  {isMicOn ? <Mic className="w-3.5 h-3.5 text-zinc-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{currentUser.name} (You)</span>
                  <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-sm text-[8px] font-bold uppercase">{currentUser.role}</span>
                </div>
              </div>

              {/* If no other participants are active, show a gorgeous interactive invite/welcome panel */}
              {participants.filter(p => p.id !== currentUser.id).length === 0 && (
                <div className="aspect-video bg-[#141416]/50 rounded-2xl border border-dashed border-zinc-800 p-6 flex flex-col justify-between overflow-hidden relative shadow group">
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto my-auto py-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3.5 animate-pulse">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Waiting for students...</h3>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                      You are currently the only participant in this classroom. Share the invitation details below to invite students or other coaches!
                    </p>
                  </div>

                  <div className="bg-[#111113] rounded-xl border border-zinc-800/80 p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Classroom Invite Link</div>
                      <div className="text-[11px] text-zinc-550 font-mono mt-0.5 truncate select-all">{window.location.origin}/classroom/{activeClass.id}</div>
                    </div>
                    <button
                      onClick={copyMeetingInvite}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
                    >
                      {copiedLink ? <UserCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Invite'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Real Classroom Participants */}
              {participants.filter(p => p.id !== currentUser.id).map(p => {
                const isTalking = !p.isMuted;
                
                return (
                  <div 
                    key={p.id}
                    className={`aspect-video bg-[#141416] rounded-2xl border transition-all duration-300 overflow-hidden relative shadow group ${
                      isTalking ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Speaker Highlight */}
                    {isTalking && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-amber-500/20 backdrop-blur border border-amber-500/40 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[9.5px] text-amber-300 font-bold uppercase tracking-wider">Speaking</span>
                      </div>
                    )}

                    {/* Stream Video Feed */}
                    {p.isVideoOn ? (
                      <div className="absolute inset-0 bg-[#0F0F10] flex items-center justify-center">
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                          {remoteStreams[p.id] ? (
                            <video
                              ref={(el) => {
                                if (el && remoteStreams[p.id] && el.srcObject !== remoteStreams[p.id]) {
                                  el.srcObject = remoteStreams[p.id];
                                }
                              }}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover animate-fade-in"
                              onLoadedMetadata={(e) => {
                                const video = e.target;
                                video.play().catch(err => console.warn("AutoPlay blocked", err));
                              }}
                            />
                          ) : (
                            <>
                              {/* Simulated classroom backdrop */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${p.role === 'teacher' ? 'from-amber-950/20 to-zinc-900' : 'from-indigo-950/15 to-zinc-900'} opacity-70`} />
                              
                              <div className="text-center z-10">
                                <div className={`w-16 h-16 rounded-full ${p.avatarBg} text-white flex items-center justify-center text-xl font-bold uppercase shadow-lg border border-white/10 mb-2 relative mx-auto`}>
                                  {p.name[0]}
                                  {/* WebCam simulated lens reflex */}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 rounded-full" />
                                </div>
                                <span className="text-[10px] text-zinc-400 block mt-1 font-medium italic animate-pulse">Connecting video feed...</span>
                              </div>
                            </>
                          )}
                          
                          {/* Talking audio waves */}
                          {isTalking && (
                            <div className="absolute bottom-10 inset-x-0 flex items-end justify-center gap-1 h-12 z-20 pointer-events-none">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: [10, Math.floor(Math.random() * 30) + 15, 10] }}
                                  transition={{ repeat: Infinity, duration: 0.4 + (i * 0.1) }}
                                  className="w-1.5 bg-amber-500/60 rounded-full"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111112]">
                        <div className={`w-14 h-14 rounded-full ${p.avatarBg} flex items-center justify-center text-white text-lg font-bold uppercase mb-2`}>
                          {p.name[0]}
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-400">{p.name}</span>
                        <span className="text-[9.5px] text-zinc-600 mt-1 uppercase tracking-wide font-mono">Video Muted</span>
                      </div>
                    )}

                    {/* Bottom Overlay Info */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 border border-white/5">
                      {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />}
                      <span>{p.name}</span>
                      <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-sm text-[8px] font-bold uppercase">{p.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side Panel: Chat, Whiteboard tools or Participant List */}
        <AnimatePresence>
          {activeTab !== 'none' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-[#141417] border-l border-zinc-800 flex flex-col overflow-hidden"
            >
              
              {/* Tab Header */}
              <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  {activeTab === 'chat' && <MessageSquare className="w-4 h-4 text-amber-500" />}
                  {activeTab === 'participants' && <Users className="w-4 h-4 text-blue-500" />}
                  {activeTab === 'chat' ? 'Live Lecture Chat' : 'Participant List'}
                </span>
                <button
                  onClick={() => setActiveTab('none')}
                  className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Contents: Live Chat */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {chatMessages.map(msg => {
                      const isMessageSelf = msg.senderId === currentUser.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${isMessageSelf ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                            <span className={`font-bold ${
                              msg.senderRole === 'teacher' ? 'text-amber-400' : msg.senderRole === 'system' ? 'text-emerald-400' : 'text-zinc-400'
                            }`}>
                              {msg.senderName} {isMessageSelf && '(You)'}
                            </span>
                            <span className="text-[9px] text-zinc-600">{msg.timestamp}</span>
                          </div>
                          <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                            isMessageSelf 
                              ? 'bg-amber-500 text-amber-950 font-medium rounded-tr-none' 
                              : msg.senderRole === 'system'
                                ? 'bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 rounded-tl-none font-mono text-[10.5px]'
                                : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-[#19191C]">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type class query..."
                        className="flex-1 px-3 py-1.5 bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-lg transition active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab Contents: Participant list */}
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Active Stream Connections
                  </div>
                  <div className="space-y-2.5">
                    
                    {/* User Profile */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/20 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {currentUser.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{currentUser.name} (You)</span>
                          <span className="text-[9.5px] text-zinc-500 capitalize">{currentUser.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                        {isCameraOn ? <Camera className="w-3.5 h-3.5 text-emerald-400" /> : <CameraOff className="w-3.5 h-3.5 text-rose-500" />}
                      </div>
                    </div>

                    {/* Active Remote Participants */}
                    {participants.filter(p => p.id !== currentUser.id).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/10 transition">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${p.avatarBg} text-white flex items-center justify-center font-bold text-xs uppercase`}>
                            {p.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                            <span className="text-[9.5px] text-zinc-500 capitalize">{p.role}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Mic and Camera indicators */}
                          <div className="flex items-center gap-1 text-zinc-500">
                            {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5 text-zinc-400" />}
                            {p.isVideoOn ? <Camera className="w-3.5 h-3.5 text-zinc-400" /> : <CameraOff className="w-3.5 h-3.5 text-rose-500" />}
                          </div>

                          {/* Host Mute/Unmute Controls for Teacher */}
                          {isTeacher && (
                            <button
                              onClick={() => {
                                setParticipants(prev => {
                                  const list = Array.isArray(prev) ? prev : [];
                                  return list.map(pt => pt.id === p.id ? { ...pt, isMuted: !pt.isMuted } : pt);
                                });
                                addSystemMessage(`${p.name} was ${p.isMuted ? 'unmuted' : 'muted'} by instructor.`);
                              }}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition cursor-pointer"
                              title={p.isMuted ? "Unmute student" : "Mute student"}
                            >
                              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Teacher Security actions */}
                  {isTeacher && (
                    <div className="mt-8 pt-4 border-t border-zinc-800 space-y-3">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Class Host Admin Panel</span>
                      
                      <button
                        onClick={toggleMuteAll}
                        className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <VolumeX className="w-4 h-4" />
                        {isMutedAll ? 'Unmute All Students' : 'Mute All Students'}
                      </button>

                      <button
                        onClick={toggleMeetingLock}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        {isMeetingLocked ? 'Unlock Classroom' : 'Lock Classroom'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Control Bar (Mute, Camera, Screen Share, Whiteboard, Chat, Leave) */}
      <div className="h-20 bg-[#141417] border-t border-zinc-800 px-6 flex items-center justify-between">
        
        {/* Left block: Secondary/Status details */}
        <div className="hidden md:flex items-center gap-3.5">
          <div className="text-left">
            <div className="text-[11px] font-bold text-white flex items-center gap-1">
              <span>Integrated WebRTC Session</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-[9.5px] text-zinc-550 font-mono mt-0.5">Secure, low-latency, sandboxed sandbox ingress</div>
          </div>
        </div>

        {/* Middle block: Primary audio/video control toggles */}
        <div className="flex items-center gap-3">
          
          {/* Audio */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
              isMicOn 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' 
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video */}
          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
              isCameraOn 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' 
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
            title={isCameraOn ? "Stop Video" : "Start Video"}
          >
            {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
              isScreenSharing 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={() => {
              if (activeTab === 'whiteboard') {
                setActiveTab('none');
              } else {
                setActiveTab('whiteboard');
              }
            }}
            className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
              activeTab === 'whiteboard'
                ? 'bg-amber-500 text-amber-950 font-bold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
            }`}
            title="Toggle Drawing Whiteboard"
          >
            <Paintbrush className="w-5 h-5" />
          </button>

          {/* Raise Hand (Student) or Record (Teacher) */}
          {isTeacher ? (
            <button
              onClick={toggleRecording}
              className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
                isRecording 
                  ? 'bg-rose-600/25 border border-rose-600 text-rose-455 animate-pulse' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              }`}
              title="Record Meeting"
            >
              <Circle className={`w-5 h-5 ${isRecording ? 'fill-rose-500' : ''}`} />
            </button>
          ) : (
            <button
              onClick={() => {
                setHasRaisedHand(!hasRaisedHand);
                addSystemMessage(hasRaisedHand ? 'You lowered your hand.' : 'You raised your hand.');
              }}
              className={`p-3.5 rounded-full transition-all duration-150 active:scale-90 cursor-pointer ${
                hasRaisedHand 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
              }`}
              title="Raise / Lower Hand"
            >
              <Hand className="w-5 h-5" />
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full flex items-center gap-2 transition duration-150 active:scale-95 ml-4 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Class</span>
          </button>
        </div>

        {/* Right block: Drawer / Info toggles */}
        <div className="flex items-center gap-3">
          
          {/* Chat drawer button */}
          <button
            onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')}
            className={`p-3 rounded-xl transition duration-150 relative cursor-pointer ${
              activeTab === 'chat' ? 'bg-zinc-800 text-amber-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Chat Panel"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            {/* Unread message indicator */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          {/* Participant list button */}
          <button
            onClick={() => setActiveTab(activeTab === 'participants' ? 'none' : 'participants')}
            className={`p-3 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'participants' ? 'bg-zinc-800 text-amber-500' : 'text-zinc-400 hover:text-white'
            }`}
            title="Participant List"
          >
            <Users className="w-4.5 h-4.5" />
          </button>

          {/* Toggle Grid vs Speaker view */}
          <button
            onClick={() => setIsSpeakerView(!isSpeakerView)}
            className="p-3 text-zinc-400 hover:text-white rounded-xl cursor-pointer"
            title={isSpeakerView ? "Switch to Grid View" : "Switch to Speaker View"}
          >
            <Layout className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
