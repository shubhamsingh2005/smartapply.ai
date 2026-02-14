import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/signup/email', { email, password });
      navigate('/otp-verify', { state: { email, fromSignup: true } });
    } catch (error: any) {
      alert(error.response?.data?.detail || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${api.defaults.baseURL}/api/v1/auth/oauth/google/login`;
  };

  return (
    <div style={styles.container}>
      {/* Left Side: Illustration / Value Prop */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <h1 style={styles.sidebarTitle}>SmartApply.AI</h1>
          <p style={styles.sidebarText}>
            The ERP for your career. Manage every professional detail, generate AI-powered resumes, and track your applications in one unified workspace.
          </p>
          <div style={styles.featureList}>
            <div style={styles.featureItem}>✓ 16+ ERP-style career sections</div>
            <div style={styles.featureItem}>✓ AI Resume & Cover Letter tailoring</div>
            <div style={styles.featureItem}>✓ Real-time Application Tracking</div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div style={styles.formSection}>
        <div style={styles.formWrapper}>
          <h2 style={styles.formTitle}>Create your account</h2>
          <p style={styles.formSubtitle}>Start building your professional identity today.</p>

          <form onSubmit={handleEmailSignup} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} style={styles.primaryButton}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or continue with</span>
          </div>

          <button onClick={handleGoogleSignup} style={styles.googleButton}>
            <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="G" style={styles.googleIcon} />
            Sign up with Google
          </button>

          <p style={styles.footerText}>
            Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#ffffff',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#0d1117',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    backgroundImage: 'radial-gradient(circle at 2px 2px, #30363d 1px, transparent 0)',
    backgroundSize: '40px 40px',
  },
  sidebarContent: { maxWidth: '500px' },
  sidebarTitle: { fontSize: '48px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' },
  sidebarText: { fontSize: '18px', lineHeight: '1.6', color: '#8b949e', marginBottom: '40px' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  featureItem: { fontSize: '16px', color: '#c9d1d9', fontWeight: 500 },
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#f6f8fa',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
    borderRadius: '12px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
  },
  formTitle: { fontSize: '28px', fontWeight: 700, color: '#1f2328', marginBottom: '8px' },
  formSubtitle: { fontSize: '15px', color: '#636c76', marginBottom: '32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#1f2328' },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    backgroundColor: '#f6f8fa',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    marginTop: '10px',
    padding: '12px',
    backgroundColor: '#1f883d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  divider: {
    margin: '32px 0',
    borderTop: '1px solid #d0d7de',
    textAlign: 'center',
    position: 'relative',
  },
  dividerText: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    padding: '0 15px',
    fontSize: '13px',
    color: '#636c76'
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#ffffff',
    color: '#1f2328',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  googleIcon: { width: '20px', height: '20px' },
  footerText: { marginTop: '32px', fontSize: '14px', textAlign: 'center', color: '#636c76' },
  link: { color: '#0969da', textDecoration: 'none', fontWeight: 600 },
};

export default Signup;
