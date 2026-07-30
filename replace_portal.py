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

# Let's also insert the import statement if it doesn't exist
import_str = "import zenMeditationImg from './assets/images/zen_meditation_illustration_1785131649076.jpg';\n"
insert_import_idx = -1
for i, line in enumerate(lines):
    if "import programmerBoyImg" in line:
        insert_import_idx = i + 1
        break

if start_idx != -1 and end_idx != -1:
    new_ui = """          <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] font-sans z-0 relative p-4 sm:p-6 lg:p-10 overflow-y-auto">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setShowPortal(false)}
              className="absolute top-6 left-6 inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-bold text-slate-700 transition-colors cursor-pointer shadow-xs z-10"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              Back
            </button>

            {/* Central Card */}
            <div className="w-full max-w-[1000px] min-h-[640px] bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/20 animate-scaleIn">
              
              {/* Left Side: Form */}
              <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-14 py-12">
                <div className="w-full max-w-sm mx-auto">
                  <div className="mb-8">
                    <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                      {onboardingTab === 'fastReg' ? 'Create an account' : 'Welcome back!'}
                    </h1>
                    <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
                      {onboardingTab === 'fastReg' 
                        ? 'Join Learnora to simplify your learning workflow and boost productivity. Get started for free.'
                        : 'Simplify your workflow and boost your productivity with Learnora. Log in to continue.'}
                    </p>
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
                          className="w-full px-5 py-3.5 text-[14px] bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400 transition-all font-sans font-medium"
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
                        className="w-full px-5 py-3.5 text-[14px] bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400 transition-all font-sans font-medium"
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full px-5 py-3.5 text-[14px] bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400 transition-all font-sans font-medium pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {onboardingTab === 'authLogin' && (
                      <div className="flex justify-end pt-1 pb-2">
                        <button
                          type="button"
                          className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    {(loginError || fastEmailError || googleError || githubError) && (
                      <div className="text-rose-500 text-xs font-semibold px-1 text-center pb-2">
                        {loginError || fastEmailError || googleError || githubError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#0F172A] hover:bg-black text-white font-bold rounded-full text-[14px] shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans mt-2"
                    >
                      {onboardingTab === 'fastReg' ? 'Register' : 'Login'}
                    </button>
                  </form>

                  <div className="w-full flex items-center justify-center gap-4 py-6">
                    <div className="h-[1px] flex-1 bg-slate-200"></div>
                    <span className="text-[12px] font-bold text-slate-400 font-sans lowercase tracking-wide">or continue with</span>
                    <div className="h-[1px] flex-1 bg-slate-200"></div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <GoogleIcon className="w-5 h-5 text-white filter brightness-0 invert" />
                    </button>

                    <button
                      type="button"
                      onClick={handleGithubSignIn}
                      className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Github className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center pt-10">
                    <p className="text-[14px] text-slate-500 font-medium">
                      {onboardingTab === 'fastReg' ? 'Already a member?' : 'Not a member?'}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (onboardingTab === 'fastReg') setOnboardingTab('authLogin');
                          else setOnboardingTab('fastReg');
                          setLoginError('');
                          setFastEmailError('');
                        }}
                        className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        {onboardingTab === 'fastReg' ? 'Login now' : 'Register now'}
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side: Illustration */}
              <div className="hidden md:flex md:w-1/2 p-4">
                <div className="w-full h-full bg-[#f4faee] rounded-[24px] relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute top-0 left-0 w-full h-full p-8 flex flex-col justify-end pb-12 z-20">
                     <h3 className="text-[22px] font-bold text-center text-slate-800 leading-tight">
                       Make your work easier and<br/>organized with <span className="font-extrabold">Learnora</span>
                     </h3>
                  </div>
                  <img 
                    src={zenMeditationImg} 
                    alt="Zen Meditation Illustration" 
                    className="w-[85%] h-auto object-contain z-10 -mt-10 mix-blend-darken"
                  />
                  {/* Custom Dot indicator at bottom */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <div className="w-3 h-1.5 rounded-full bg-slate-800"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
"""
    
    with open('src/App.tsx', 'w') as f:
        # Insert import
        if "zenMeditationImg" not in "".join(lines):
            f.writelines(lines[:insert_import_idx])
            f.write(import_str)
            f.writelines(lines[insert_import_idx:start_idx + 1])
        else:
            f.writelines(lines[:start_idx + 1])
            
        f.write(new_ui + "\n")
        f.writelines(lines[end_idx:])
    print("UI Replaced successfully")
else:
    print(f"Indices not found: start_idx={start_idx}, end_idx={end_idx}, insert_import_idx={insert_import_idx}")

