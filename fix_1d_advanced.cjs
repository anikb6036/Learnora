const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

const regex = /\/\/ 1d\. Manage User Audio\/Video Media[\s\S]*?const stopLocalCamera = \(\) => \{[\s\S]*?\};\n/m;
const replacement = `// 1d. Manage User Audio/Video Media
  useEffect(() => {
    if (isCameraOn || isMicOn) {
      navigator.mediaDevices.getUserMedia({ video: isCameraOn, audio: isMicOn })
        .then(stream => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setCameraError(null);
          syncWebRTCTracks();
        })
        .catch(err => {
          console.error("Media access failed", err);
          if (isCameraOn) setCameraError("Camera blocked or unavailable.");
          setIsCameraOn(false);
          setIsMicOn(false);
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
      syncWebRTCTracks();
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };
`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/Classroom.tsx', content);
