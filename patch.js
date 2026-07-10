const fs = require('fs');
let code = fs.readFileSync('src/components/EnrollmentManager.tsx', 'utf8');

// Replace the buggy closing tags for sub-admins
code = code.replace(/}\)\s*\n\s*\)}\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*}/, `})
              )}
            </div>
            </div>
            </div>
          </div>
        }`);

fs.writeFileSync('src/components/EnrollmentManager.tsx', code);
