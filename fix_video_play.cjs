const fs = require('fs');
let content = fs.readFileSync('src/components/Classroom.tsx', 'utf-8');

content = content.replace(/className="w-full h-full object-cover animate-fade-in"\s*\/>/m, `className="w-full h-full object-cover animate-fade-in"
                              onLoadedMetadata={(e) => {
                                const video = e.target;
                                video.play().catch(err => console.warn("AutoPlay blocked", err));
                              }}
                            />`);

fs.writeFileSync('src/components/Classroom.tsx', content);
