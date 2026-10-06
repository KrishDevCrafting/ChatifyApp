import { useRef, useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./config";

function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Sign Up User
        const signupRes = await fetch(`${API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const signupData = await signupRes.json();

        if (!signupRes.ok) {
          alert(signupData.message || "Registration failed");
          setLoading(false);
          return;
        }

        // 2. Automatically Log In after successful sign up
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          alert("Account created successfully! Please sign in.");
          setIsSignUp(false);
          setLoading(false);
          return;
        }

        localStorage.setItem("token", loginData.token);
        navigate("/home");
      } else {
        // Regular Sign In
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Login failed");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        navigate("/home");
      }
    } catch (error) {
      alert("server error, please check if backend is working!");
    } finally {
      setLoading(false);
    }
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
            <h1>{isSignUp ? "Create an account" : "Welcome back"}</h1>
            <p>
              {isSignUp
                ? "Join Chatify and start real-time messaging today"
                : "Enter your credentials or continue with single sign-on"}
            </p>
          </div>

          {/* Auth Mode Toggle Pill */}
          <div className="auth-toggle">
            <button
              type="button"
              className={`auth-toggle-btn ${!isSignUp ? "active" : ""}`}
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${isSignUp ? "active" : ""}`}
              onClick={() => setIsSignUp(true)}
            >
              Create Account
            </button>
          </div>

          {/* Social Login */}
          <div className="social-buttons">
            <button type="button" aria-label="Sign in with Google">
              <span className="google-icon">G</span>
            </button>
            <button type="button" aria-label="Sign in with GitHub">
              <span className="github-icon">●</span>
            </button>
            <button type="button" aria-label="Sign in with Apple">
              <span className="apple-icon">●</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>{isSignUp ? "or register with email" : "or continue with email"}</span>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username (Only for Sign Up) */}
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="login-username">Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    placeholder="e.g. krish_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="name@work-email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="password-label">
                <label htmlFor="login-password">Password</label>
                {!isSignUp && <a href="/forgot-password">Forgot password?</a>}
              </div>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {/* Remember Device (Only for Sign In) */}
            {!isSignUp && (
              <label className="remember">
                <input type="checkbox" defaultChecked />
                <span>Remember this device for 30 days</span>
              </label>
            )}

            {/* Submit */}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? (
                <span className="button-content">
                  <span className="spinner" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                <span className="button-content">
                  {isSignUp ? "Create Account" : "Sign In to Workspace"}
                  <span className="arrow">→</span>
                </span>
              )}
            </button>
          </form>

          {/* Toggle link in footer */}
          <div className="signup">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                className="signup-toggle-link"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign In →" : "Create an account →"}
              </button>
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
