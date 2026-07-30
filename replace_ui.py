import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "/* Dynamic Role-Based Sandbox Access & Create Account Page */" in line:
        start_idx = i
        break

# The block ends before the `) : (` for the `showPortal` ternary.
# We'll look for `        ) : (` around line 4895
for i in range(start_idx, len(lines)):
    if "        ) : (" in lines[i] and "HomePage" in lines[i+1]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_ui = """          <div className="min-h-screen w-full flex items-center justify-center bg-[#07090e] animate-fadeIn font-sans z-0 relative p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto">
            {/* Ambient Blurred Background */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none transition-all duration-500 overflow-hidden">
              <img
                src={programmerBoyImg}
                alt="Ambient Background"
                className="w-full h-full object-cover scale-110 blur-3xl opacity-35 dark:opacity-20 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-[#0a0c10]/80 dark:bg-[#07090c]/90" />
            </div>

            {/* Central Card */}
            <div className="relative z-10 w-full max-w-[960px] h-[640px] bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-white/5 animate-scaleIn">
              
              {/* Left Side */}
              <div className="hidden md:block w-[45%] relative h-full shrink-0 bg-slate-900">
                <img src={programmerBoyImg} className="w-full h-full object-cover rounded-l-[32px]" alt="Freelancer Programmer" />
                <div className="absolute top-8 left-8">
                  <span className="text-white text-[22px] font-black uppercase tracking-widest font-sans drop-shadow-md">
                    FREELANCER
                  </span>
                </div>
              </div>

              {/* Right Side */}
              <div className="w-full md:w-[55%] h-full flex flex-col items-center justify-center py-10 px-8 sm:px-14 bg-white overflow-y-auto relative">
                
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setShowPortal(false)}
                  className="absolute top-6 left-6 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  &larr; Back
                </button>

                <div className="w-full max-w-sm space-y-6">
                  <h1 className="text-[26px] font-extrabold text-slate-900 text-center font-sans tracking-tight">
                    {onboardingTab === 'fastReg' ? 'Create Account' : 'Log In'}
                  </h1>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <GoogleIcon className="w-[18px] h-[18px]" />
                    <span className="text-sm font-bold text-slate-700">
                      {onboardingTab === 'fastReg' ? 'Sign up with Google' : 'Sign in with Google'}
                    </span>
                  </button>

                  <div className="w-full flex items-center justify-center gap-4">
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                    <span className="text-[13px] font-medium text-slate-400 font-sans lowercase">or</span>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (onboardingTab === 'fastReg') {
                        try {
                           await createUserWithEmailAndPassword(auth, fastEmail, loginPassword);
                        } catch (err: any) {
                           setFastEmailError(err.message);
                        }
                      } else {
                        handleCredentialsLogin(e);
                      }
                    }} 
                    className="space-y-4"
                  >
                    {onboardingTab === 'fastReg' && (
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={fastFirstName}
                          onChange={e => setFastFirstName(e.target.value)}
                          className="w-full px-5 py-3.5 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-1 focus:ring-[#ff6200] focus:border-[#ff6200] text-slate-900 placeholder-slate-400 transition-all font-sans"
                        />
                      </div>
                    )}
                    
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={onboardingTab === 'fastReg' ? fastEmail : loginUsername}
                        onChange={e => {
                          if (onboardingTab === 'fastReg') setFastEmail(e.target.value);
                          else setLoginUsername(e.target.value);
                        }}
                        className="w-full px-5 py-3.5 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-1 focus:ring-[#ff6200] focus:border-[#ff6200] text-slate-900 placeholder-slate-400 transition-all font-sans"
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full px-5 py-3.5 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-1 focus:ring-[#ff6200] focus:border-[#ff6200] text-slate-900 placeholder-slate-400 transition-all font-sans pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {(loginError || fastEmailError) && (
                      <div className="text-rose-500 text-xs font-semibold px-1">
                        {loginError || fastEmailError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#ff6200] hover:bg-[#e55800] text-white font-bold rounded-[14px] text-[15px] shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans mt-2"
                    >
                      {onboardingTab === 'fastReg' ? 'Create Account' : 'Log In'}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-[13px] text-slate-500 font-medium">
                      {onboardingTab === 'fastReg' ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (onboardingTab === 'fastReg') setOnboardingTab('authLogin');
                          else setOnboardingTab('fastReg');
                          setLoginError('');
                          setFastEmailError('');
                        }}
                        className="text-[#ff6200] font-bold hover:underline ml-1 cursor-pointer"
                      >
                        {onboardingTab === 'fastReg' ? 'Log in' : 'Create Account'}
                      </button>
                    </p>
                  </div>
                  
                  <div className="flex justify-center items-center gap-5 pt-6">
                    <button type="button" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"><Facebook className="w-[18px] h-[18px]" /></button>
                    <button type="button" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"><Twitter className="w-[18px] h-[18px]" /></button>
                    <button type="button" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"><Linkedin className="w-[18px] h-[18px]" /></button>
                    <button type="button" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"><Instagram className="w-[18px] h-[18px]" /></button>
                  </div>

                </div>
              </div>
            </div>
          </div>
"""
    
    with open('src/App.tsx', 'w') as f:
        f.writelines(lines[:start_idx])
        f.write(new_ui + "\n")
        f.writelines(lines[end_idx:])
    print("UI Replaced successfully")
else:
    print(f"Indices not found: start_idx={start_idx}, end_idx={end_idx}")

