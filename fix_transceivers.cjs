const fs = require('fs');

let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

const regex = /const senders = pc\.getSenders\(\);[\s\S]*?\} catch \(err\)/m;
const replacement = `const transceivers = pc.getTransceivers();
        const audioTransceiver = transceivers.find(t => t.receiver.track.kind === 'audio');
        const videoTransceiver = transceivers.find(t => t.receiver.track.kind === 'video');
        
        const audioTrack = stream?.getAudioTracks()[0] || null;
        const videoTrack = stream?.getVideoTracks()[0] || null;

        if (audioTransceiver) audioTransceiver.sender.replaceTrack(audioTrack).catch(e => console.warn("Audio replace failed", e));
        if (videoTransceiver) videoTransceiver.sender.replaceTrack(videoTrack).catch(e => console.warn("Video replace failed", e));
      } catch (err)`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/Classroom.tsx', content);
