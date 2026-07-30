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

if start_idx == -1 or end_idx == -1:
    print(f"Error finding indices: start_idx={start_idx}, end_idx={end_idx}")
    sys.exit(1)

new_code = """        showPortal ? (
          <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F4F6] font-sans z-0 relative p-4 sm:p-6 lg:p-10 overflow-y-auto">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setShowPortal(false);
                setAdmissionMethod('selection');
                setFastRegSuccess(null);
              }}
              className="absolute top-6 left-6 inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-bold text-slate-700 transition-colors cursor-pointer shadow-xs z-10"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              Back
            </button>

            {/* Central Card */}
            <div className="w-full max-w-[1000px] min-h-[640px] bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/20 animate-scaleIn my-auto">
              
              {/* Left Side: Form / Steps */}
              <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-10">
                <div className="w-full max-w-md mx-auto">

                  {/* CASE 1: REGISTRATION SUCCESSFUL */}
                  {fastRegSuccess ? (
                    <div className="space-y-6 text-center animate-fadeIn">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>

                      <div>
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2">
                          Application Submitted
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900">
                          Registration Successful!
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                          Welcome to Learnora, <span className="font-bold text-slate-800">{fastRegSuccess.name}</span>.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Selected Program:</span>
                          <span className="font-bold text-slate-800">{fastRegSuccess.course || 'General Admission'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Email:</span>
                          <span className="font-bold text-slate-800">{fastRegSuccess.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Application ID:</span>
                          <span className="font-mono font-bold text-indigo-600">{fastRegSuccess.id}</span>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-left space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          Mandatory Placement Exam Required
                        </div>
                        <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                          We sent an examination link to <strong className="text-amber-950">{fastRegSuccess.email}</strong>. Scoring 25%+ triggers instant automatic enrollment!
                        </p>
                        <a
                          href={`/?examemail=${encodeURIComponent(fastRegSuccess.email)}`}
                          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs mt-1"
                        >
                          Take Placement Exam Now
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFastRegSuccess(null);
                          setAdmissionMethod('selection');
                          setOnboardingTab('authLogin');
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-full text-xs transition-all cursor-pointer"
                      >
                        Go to Sign In
                      </button>
                    </div>

                  /* CASE 2: STEP 2 - COURSE SELECTION (SOCIAL OR FAST REG) */
                  ) : admissionMethod === 'social-course-select' ? (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                            Step 2 of 2
                          </span>
                          <span className="text-xs font-semibold text-slate-400">Course Choice</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          Choose Your Course
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Select your desired program to complete your Learnora registration.
                        </p>
                      </div>

                      {/* Connected Account Card */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={fastAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {fastFirstName} {fastLastName}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {fastEmail}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdmissionMethod('selection');
                              setSocialProvider(null);
                            }}
                            className="block text-[10px] text-slate-400 hover:text-slate-700 mt-1 cursor-pointer underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      {/* Course Selection Form */}
                      <form onSubmit={handleSocialStudentSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Select Course Program <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={fastCourse}
                            onChange={(e) => {
                              setFastCourse(e.target.value);
                              setFastCourseError('');
                            }}
                            className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium cursor-pointer"
                            required
                          >
                            <option value="">-- Choose a Course Program --</option>
                            {courses && courses.length > 0 ? (
                              courses.map((c) => (
                                <option key={c.id} value={`${c.name}::${c.batchNumber || ''}`}>
                                  {c.name} {c.batchNumber ? `(Batch ${c.batchNumber})` : ''} - ₹{c.fees?.toLocaleString('en-IN') || 'Included'}
                                </option>
                              ))
                            ) : masterCourses && masterCourses.length > 0 ? (
                              masterCourses.map((mc) => (
                                <option key={mc.id} value={mc.title}>
                                  {mc.title} ({mc.duration || 'Flexible'})
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Full Stack Web Development::Batch 2026-A">
                                  Full Stack Web Development (Batch 2026-A)
                                </option>
                                <option value="Data Science & Artificial Intelligence::Batch 2026-B">
                                  Data Science & AI Masterclass (Batch 2026-B)
                                </option>
                                <option value="Mobile App Development (React Native & Flutter)::Batch 2026-A">
                                  Mobile App Development (Batch 2026-A)
                                </option>
                                <option value="UI/UX Design & Product Design::Batch 2026-A">
                                  UI/UX Design Specialist (Batch 2026-A)
                                </option>
                              </>
                            )}
                          </select>
                          {fastCourseError && (
                            <p className="text-rose-500 text-[11px] font-semibold mt-1">
                              {fastCourseError}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={fastPhonePrefix}
                              onChange={(e) => setFastPhonePrefix(e.target.value)}
                              className="px-2 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
                            >
                              {COUNTRY_PHONE_CONFIGS.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.country})
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              placeholder="9876543210"
                              value={fastPhone}
                              onChange={(e) => setFastPhone(e.target.value.replace(/\\D/g, ''))}
                              className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
                        >
                          Complete Registration
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                  /* CASE 3: INITIAL STEP (LOGIN OR CREATE ACCOUNT) */
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight mb-1.5">
                          {onboardingTab === 'fastReg' ? 'Create an account' : 'Welcome back!'}
                        </h1>
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                          {onboardingTab === 'fastReg'
                            ? 'Join Learnora to start learning today. Sign up with Google, GitHub or Email.'
                            : 'Simplify your learning workflow with Learnora. Log in to continue.'}
                        </p>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (onboardingTab === 'fastReg') {
                            if (!fastEmail || !fastFirstName) {
                              setFastEmailError('Please enter your full name and email address.');
                              return;
                            }
                            // Proceed to course selection step
                            setAdmissionMethod('social-course-select');
                          } else {
                            handleCredentialsLogin(e);
                          }
                        }}
                        className="space-y-3.5"
                      >
                        {onboardingTab === 'fastReg' && (
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Full Name"
                              value={fastFirstName}
                              onChange={(e) => {
                                setFastFirstName(e.target.value);
                                if (e.target.value.includes(' ')) {
                                  const parts = e.target.value.trim().split(/\\s+/);
                                  setFastLastName(parts.slice(1).join(' ') || 'Student');
                                }
                              }}
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
                            onChange={(e) => {
                              if (onboardingTab === 'fastReg') setFastEmail(e.target.value);
                              else setLoginUsername(e.target.value);
                            }}
                            className="w-full px-5 py-3.5 text-[14px] bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder-slate-400 transition-all font-sans font-medium"
                          />
                        </div>

                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            required
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
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
                          <div className="flex justify-end pt-0.5">
                            <button
                              type="button"
                              className="text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              Forgot Password?
                            </button>
                          </div>
                        )}

                        {(loginError || fastEmailError || googleError || githubError) && (
                          <div className="text-rose-500 text-xs font-semibold px-1 text-center py-1">
                            {loginError || fastEmailError || googleError || githubError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3.5 bg-[#0F172A] hover:bg-black text-white font-bold rounded-full text-[14px] shadow-sm transition-all active:scale-[0.98] cursor-pointer font-sans mt-1"
                        >
                          {onboardingTab === 'fastReg' ? 'Continue to Course Selection' : 'Login'}
                        </button>
                      </form>

                      <div className="w-full flex items-center justify-center gap-4 py-3">
                        <div className="h-[1px] flex-1 bg-slate-200"></div>
                        <span className="text-[12px] font-bold text-slate-400 font-sans lowercase tracking-wide">
                          or continue with
                        </span>
                        <div className="h-[1px] flex-1 bg-slate-200"></div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          title="Sign in with Google"
                          className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <GoogleIcon className="w-5 h-5 text-white filter brightness-0 invert" />
                        </button>

                        <button
                          type="button"
                          onClick={handleGithubSignIn}
                          title="Sign in with GitHub"
                          className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Github className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="text-center pt-6">
                        <p className="text-[13px] text-slate-500 font-medium">
                          {onboardingTab === 'fastReg' ? 'Already a member?' : 'Not a member?'}{' '}
                          <button
                            type="button"
                            onClick={() => {
                              if (onboardingTab === 'fastReg') setOnboardingTab('authLogin');
                              else setOnboardingTab('fastReg');
                              setLoginError('');
                              setFastEmailError('');
                            }}
                            className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors cursor-pointer ml-1"
                          >
                            {onboardingTab === 'fastReg' ? 'Login now' : 'Register now'}
                          </button>
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Side: Visual Illustration Banner */}
              <div className="hidden md:flex md:w-1/2 p-4">
                <div className="w-full h-full bg-[#f4faee] rounded-[24px] relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute top-0 left-0 w-full h-full p-8 flex flex-col justify-end pb-12 z-20">
                    <h3 className="text-[22px] font-bold text-center text-slate-800 leading-tight">
                      Make your work easier and<br />organized with <span className="font-extrabold">Learnora</span>
                    </h3>
                  </div>
                  <img
                    src={zenMeditationImg}
                    alt="Zen Meditation Illustration"
                    className="w-[85%] h-auto object-contain z-10 -mt-10 mix-blend-darken"
                  />
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
    f.writelines(lines[:start_idx])
    f.write(new_code + "\n")
    f.writelines(lines[end_idx:])

print("Successfully replaced showPortal block")
