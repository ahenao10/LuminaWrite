import React, { useState } from "react";
import { API_BASE_URL } from "../data/initialData";

export default function LoginView({ onSignIn }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setIsLoading(true);

    const endpoint =
      mode === "signup" ? "/api/auth/signup" : "/api/auth/login";

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          display_name: mode === "signup" ? displayName.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      if (data.requires_email_confirmation || !data.access_token) {
        setInfoMsg(
          "Account created! Please check your email inbox to confirm your address before signing in."
        );
        setMode("login");
        return;
      }

      onSignIn({
        accessToken: data.access_token,
        user: data.user,
        profile: data.profile,
        rememberMe,
      });
    } catch (err) {
      setErrorMsg(
        err.message ||
          `Could not connect to backend at ${API_BASE_URL}.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Header */}
      <header className="w-full bg-surface/80 backdrop-blur-xl z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-[0_2px_12px_rgba(96,99,238,0.25)]">
              <span className="material-symbols-outlined text-[20px]">
                edit_note
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-medium leading-none tracking-tight">
                Lumina Write
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-wider uppercase mt-0.5">
                Editorial AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-label-lg text-label-lg text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">
                help_outline
              </span>
              <span>CEFR A1 – C2 Writing Lab</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Dual Panel Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 relative">
        <div className="relative w-full max-w-6xl mx-auto my-auto">
          {/* Ambient Atmospheric Glows */}
          <div className="absolute -top-16 -left-20 w-96 h-96 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute -bottom-16 -right-20 w-96 h-96 bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-xl bg-surface-container-lowest shadow-[0_20px_50px_rgba(70,72,212,0.07)] overflow-hidden">
            {/* Left Panel: Editorial Showcase (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-surface-container-low via-surface-container to-surface-variant p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#4648d4_1px,transparent_1px)] [background-size:16px_16px]"></div>

              {/* Header / Stage Identifier */}
              <div className="relative z-10 flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[14px]">
                    auto_awesome
                  </span>
                  <span>Scholarly Intelligence</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
                  Refining thought into{" "}
                  <span className="italic font-display-lg text-primary">
                    masterful
                  </span>{" "}
                  prose.
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Elevate your English writing with rigorous AI coaching tailored for daily practice, essays, and CEFR certifications.
                </p>
              </div>

              {/* Interactive Vocabulary Diff Preview Card */}
              <div className="relative z-10 my-8 flex flex-col gap-4">
                <div className="bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">
                        check_circle
                      </span>
                      Side-by-Side Precision
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary bg-tertiary-fixed/30 px-1.5 py-0.5 rounded">
                      CEFR A1–C2
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">
                    The findings{" "}
                    <span className="line-through text-error opacity-70 decoration-1">
                      show that
                    </span>{" "}
                    <span className="bg-tertiary-container/15 text-tertiary font-medium px-1 rounded">
                      corroborate that
                    </span>{" "}
                    consistent practice improves fluency.
                  </p>
                </div>

                {/* Micro Rubric Preview */}
                <div className="bg-surface-container-lowest/80 backdrop-blur-sm px-4 py-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        insights
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        4-Dimension Rubric
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Grammar • Lexis • Cohesion
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="relative z-10 bg-surface-container-highest/40 rounded-lg p-4">
                <blockquote className="font-body-md text-body-md text-on-surface italic leading-snug">
                  “Clear feedback on every sentence helps you spot patterns, fix recurring grammar slips, and write with confidence.”
                </blockquote>
                <div className="mt-2 flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">
                    Lumina Write Pedagogical Engine
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Powered by Supabase &amp; Gemini
                  </span>
                </div>
              </div>
            </div>

            {/* Right Panel: Sign-In / Sign-Up Form (7 cols) */}
            <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-surface-container-lowest">
              <div className="max-w-md w-full mx-auto flex flex-col gap-5">
                {/* Heading */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                      Scholarly Workspace
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-medium tracking-tight">
                    {mode === "signup" ? "Create your account" : "Welcome back"}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {mode === "signup"
                      ? "Register to save your writing progress, journal entries, and AI evaluations."
                      : "Sign in to enter your Writing Lab & AI evaluation dashboard."}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error">
                      error
                    </span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {infoMsg && (
                  <div className="p-3 rounded-lg bg-tertiary-container/15 text-tertiary font-body-sm text-body-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      mark_email_read
                    </span>
                    <span>{infoMsg}</span>
                  </div>
                )}

                {/* Form */}
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  {mode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="font-label-md text-label-md text-on-surface font-semibold"
                        htmlFor="display-name"
                      >
                        Full Name
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                          person
                        </span>
                        <input
                          id="display-name"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between"
                      htmlFor="email"
                    >
                      <span>Email Address</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
                        Supabase Auth
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        mail
                      </span>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@university.edu"
                        className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        className="font-label-md text-label-md text-on-surface font-semibold"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      {mode === "signup" && (
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Min 6 characters
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        lock
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-2.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-outline hover:text-on-surface p-1 rounded transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary focus:ring-offset-0 bg-surface-container cursor-pointer accent-primary"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Keep me signed in
                      </span>
                    </label>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">
                        shield
                      </span>
                      <span>RLS Protected</span>
                    </div>
                  </div>

                  {/* Primary Submit Action */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-6 rounded-lg bg-primary hover:bg-secondary disabled:opacity-60 text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>
                      {isLoading
                        ? "Authenticating..."
                        : mode === "signup"
                        ? "Create Account & Enter Lab"
                        : "Sign In to Writing Lab"}
                    </span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </form>

                {/* Toggle Sign In / Sign Up */}
                <div className="text-center pt-1">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {mode === "signup"
                      ? "Already have an account? "
                      : "Don't have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode((prev) =>
                          prev === "login" ? "signup" : "login"
                        );
                        setErrorMsg("");
                        setInfoMsg("");
                      }}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      {mode === "signup" ? "Sign in" : "Create an account"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-on-surface-variant font-label-md text-label-md">
          <p>© 2026 Lumina Write. Crafted for English writing mastery.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
