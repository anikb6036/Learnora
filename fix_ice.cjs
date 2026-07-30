const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

const regex = /if \(data\.calleeCandidates && Array\.isArray\(data\.calleeCandidates\)\) \{/g;
content = content.replace(regex, `if (pc.remoteDescription && data.calleeCandidates && Array.isArray(data.calleeCandidates)) {`);

const regex2 = /if \(data\.callerCandidates && Array\.isArray\(data\.callerCandidates\)\) \{/g;
content = content.replace(regex2, `if (pc.remoteDescription && data.callerCandidates && Array.isArray(data.callerCandidates)) {`);

fs.writeFileSync('src/components/Classroom.tsx', content);
