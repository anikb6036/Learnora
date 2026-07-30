const fs = require('fs');
let code = fs.readFileSync('src/components/EnrollmentManager.tsx', 'utf8');

const targetStr = `                })
              )}
            </div>
            </div>
            </div>
          </div>
            </div>
            </div>
        )}`;
const replacementStr = `                })
              )}
            </div>
            </div>
            </div>
          </div>
        )}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/EnrollmentManager.tsx', code);
