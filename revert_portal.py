import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "showPortal ? (" in line:
        start_idx = i
        break

for i in range(start_idx + 1, len(lines)):
    if "        ) : (" in lines[i] and "HomePage" in lines[i+1]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_ui = """          <div className="min-h-screen w-full flex flex-col bg-[#FAFAFA] font-sans z-0 relative overflow-y-auto pt-8">
            {/* Back Button */}
            <div className="w-full max-w-7xl mx-auto px-6 mb-8 md:mb-12">
              <button
                type="button"
                onClick={() => setShowPortal(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1.5 text-slate-500" />
                Back to Home
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start mt-4 px-4 w-full max-w-[440px] mx-auto animate-scaleIn pb-20">
              
              <div className="mb-6 flex justify-center">
                <Logo size="lg" withStrapline={false} />
              </div>

              <div className="w-full text-center mb-10 space-y-4">
                <h1 className="text-[38px] md:text-[42px] leading-tight font-extrabold text-slate-900 tracking-tight">
                  Knowledge Starts Here
                </h1>
                <p className="text-base text-slate-500 font-medium max-w-[340px] mx-auto leading-relaxed">
                  We suggest using the email address you use at school or work.
                </p>
              </div>

              <div className="w-full space-y-6">
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
                        className="w-full px-5 py-4 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder-slate-400 transition-all font-sans text-center shadow-xs"
                      />
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="name@work-email.com"
                      value={onboardingTab === 'fastReg' ? fastEmail : loginUsername}
                      onChange={e => {
                        if (onboardingTab === 'fastReg') setFastEmail(e.target.value);
                        else setLoginUsername(e.target.value);
                      }}
                      className="w-full px-5 py-4 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder-slate-400 transition-all font-sans text-center shadow-xs"
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full px-5 py-4 text-[15px] bg-white border border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder-slate-400 transition-all font-sans text-center shadow-xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {(loginError || fastEmailError || googleError || githubError) && (
                    <div className="text-rose-500 text-xs font-semibold px-1 text-center">
                      {loginError || fastEmailError || googleError || githubError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#4A154B] hover:bg-[#3F103F] text-white font-bold rounded-[14px] text-[15px] shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans mt-2"
                  >
                    {onboardingTab === 'fastReg' ? 'Create Account' : 'Continue'}
                  </button>
                </form>

                <div className="w-full flex items-center justify-center gap-4 py-2">
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                  <span className="text-[13px] font-bold text-slate-600 font-sans uppercase tracking-widest">OR</span>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-4 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <GoogleIcon className="w-[20px] h-[20px]" />
                    <span className="text-[15px] font-bold text-slate-800">
                      Continue with Google
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGithubSignIn}
                    className="w-full py-4 px-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[14px] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <Github className="w-[20px] h-[20px] text-[#24292e]" />
                    <span className="text-[15px] font-bold text-slate-800">
                      Continue with GitHub
                    </span>
                  </button>
                </div>

                <div className="text-center pt-4">
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
                      className="text-[#4A154B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                      {onboardingTab === 'fastReg' ? 'Log in' : 'Create Account'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
"""
    
    with open('src/App.tsx', 'w') as f:
        f.writelines(lines[:start_idx + 1])
        f.write(new_ui + "\n")
        f.writelines(lines[end_idx:])
    print("UI Replaced successfully")
else:
    print(f"Indices not found: start_idx={start_idx}, end_idx={end_idx}")

