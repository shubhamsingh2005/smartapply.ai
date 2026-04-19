import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/api/v1/auth/signup/email', { email, password });
      alert('Account created! Please check your email for the OTP verification code.');
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      console.error('Signup error:', err);
      const msg = err.response?.data?.detail || 'Signup failed. Please try again.';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${api.defaults.baseURL}/api/v1/auth/oauth/google/login`;
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.brandingContent}>
          <h1 style={styles.brandTitle}>SmartApply.AI</h1>
          <p style={styles.brandSubtitle}>
            The centralized Career Identity ERP. A single source of truth for your professional journey.
          </p>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <div style={styles.featureTitle}>Unified Identity</div>
                <div style={styles.featureDesc}>16+ ERP-style career sections.</div>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <div style={styles.featureTitle}>One-Click Apply</div>
                <div style={styles.featureDesc}>Auto-fill applications instantly.</div>
              </div>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <div>
                <div style={styles.featureTitle}>AI-Powered</div>
                <div style={styles.featureDesc}>Smart resume parsing and optimization.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Create account</h2>
          <p style={styles.formSubtitle}>Start building your professional identity today.</p>

          <form onSubmit={handleSignup}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="name@example.com"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <div style={styles.hint}>Must be at least 6 characters</div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" style={styles.signUpBtn} disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>OR CONTINUE WITH</span>
          </div>

          <button onClick={handleGoogleSignup} style={styles.googleBtn}>
            <svg style={styles.googleIcon} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <p style={styles.loginPrompt}>
            Already have an account? <Link to="/login" style={styles.loginLink}>Sign in</Link>
          </p>

          <p style={styles.terms}>
            By creating an account, you agree to our{' '}
            <a href="#" style={styles.termsLink}>Terms of Service</a> and{' '}
            <a href="#" style={styles.termsLink}>Privacy Policy</a>
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
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: 'white',
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingContent: {
    maxWidth: '450px',
  },
  brandTitle: {
    fontSize: '36px',
    fontWeight: 700,
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
  },
  brandSubtitle: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#94a3b8',
    margin: '0 0 32px 0',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  feature: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '2px',
  },
  featureDesc: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  rightPanel: {
    flex: 1,
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px',
  },
  formCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 6px 0',
    color: '#0f172a',
  },
  formSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 24px 0',
  },
  inputGroup: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    background: '#f8fafc',
  },
  hint: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  signUpBtn: {
    width: '100%',
    padding: '11px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '6px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '18px 0',
    position: 'relative',
  },
  dividerText: {
    fontSize: '11px',
    color: '#94a3b8',
    background: 'white',
    padding: '0 10px',
    position: 'relative',
    zIndex: 1,
    margin: '0 auto',
  },
  googleBtn: {
    width: '100%',
    padding: '10px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    color: '#0f172a',
    transition: 'all 0.2s',
  },
  googleIcon: {
    width: '18px',
    height: '18px',
  },
  loginPrompt: {
    textAlign: 'center',
    marginTop: '18px',
    fontSize: '13px',
    color: '#64748b',
  },
  loginLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: 600,
  },
  terms: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  termsLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
};

export default Signup;
