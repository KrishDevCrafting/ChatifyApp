import { useRef, useState } from "react";
import "./Login.css";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--glare-opacity", "1");

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -3.5;
    const rotateY = ((x - centerX) / centerX) * 3.5;

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX.toFixed(2)}deg)
      rotateY(${rotateY.toFixed(2)}deg)
    `;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--glare-opacity", "0");

    card.style.transform = `
      perspective(1000px)
      rotateX(0deg)
      rotateY(0deg)
    `;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);

    // Temporary loading simulation.
    // Later replace this with your API call.
    setTimeout(() => {
      setLoading(false);
    }, 1400);
  };

  return (
    <main className="login-page">

      {/* Ambient Background */}
      <div className="ambient-orbs">

        <div className="orb orb-1" />

        <div className="orb orb-2" />

        <div className="orb orb-3" />

      </div>

      {/* Login Container */}
      <div className="login-container">

        {/* Outer Glow */}
        <div className="card-glow" />

        {/* Glass Card */}
        <div
          ref={cardRef}
          className="glass-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >

          {/* Top Shimmer */}
          <div className="glass-shimmer">
            <div />
          </div>

          {/* Logo */}
          <div className="logo-wrapper">

            <div className="logo-glow" />

            <div className="logo">
              <span>💬</span>
            </div>

          </div>

          {/* Header */}
          <div className="login-header">

            <h1>Welcome back</h1>

            <p>
              Enter your credentials or continue with single sign-on
            </p>

          </div>

          {/* Social Login */}
          <div className="social-buttons">

            <button
              type="button"
              aria-label="Sign in with Google"
            >
              <span className="google-icon">G</span>
            </button>

            <button
              type="button"
              aria-label="Sign in with GitHub"
            >
              <span className="github-icon">●</span>
            </button>

            <button
              type="button"
              aria-label="Sign in with Apple"
            >
              <span className="apple-icon">●</span>
            </button>

          </div>

          {/* Divider */}
          <div className="divider">

            <span>or continue with email</span>

          </div>

          {/* Login Form */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* Email */}
            <div className="form-group">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="name@work-email.com"
                  required
                />

              </div>

            </div>

            {/* Password */}
            <div className="form-group">

              <div className="password-label">

                <label htmlFor="login-password">
                  Password
                </label>

                <a href="/forgot-password">
                  Forgot password?
                </a>

              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>

            {/* Remember Device */}
            <label className="remember">

              <input
                type="checkbox"
                defaultChecked
              />

              <span>
                Remember this device for 30 days
              </span>

            </label>

            {/* Submit */}
            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >

              {loading ? (
                <span className="button-content">
                  <span className="spinner" />
                  Signing in...
                </span>
              ) : (
                <span className="button-content">
                  Sign In to Workspace
                  <span className="arrow">→</span>
                </span>
              )}

            </button>

          </form>

          {/* Signup */}
          <div className="signup">

            <p>
              Don't have an account?

              <a href="/register">
                Create an account →
              </a>
            </p>

          </div>

        </div>

        {/* Security Footer */}
        <div className="security-footer">

          <span>✓</span>

          <span>256-bit SSL encrypted</span>

          <span>•</span>

          <span>SOC2 Type II Certified</span>

        </div>

      </div>

    </main>
  );
}

export default Login;

