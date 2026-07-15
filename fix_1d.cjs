const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

// The original stopLocalCamera doesn't trigger syncWebRTCTracks. 
// Also, getUserMedia doesn't trigger syncWebRTCTracks.

content = content.replace(/setCameraError\(null\);/g, `setCameraError(null);\n          syncWebRTCTracks();`);
content = content.replace(/localStreamRef\.current = null;/g, `localStreamRef.current = null;\n      syncWebRTCTracks();`);

fs.writeFileSync('src/components/Classroom.tsx', content);
