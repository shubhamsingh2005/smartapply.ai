import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we have a query parameter `token`, that means we completed Google OAuth
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      navigate('/dashboard');
    }
  }, [location, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Quick client validation
    if (!email || !password) {
      alert('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/api/v1/auth/login/email', { email, password });
      localStorage.setItem('access_token', data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/api/v1/auth/oauth/google/login`;
  };

  return (
    <div style={styles.container}>
      {/* Left Side: Professional Branding & Trust */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarContent}>
          <div style={styles.badge}>BETA ACCESS</div>
          <h1 style={styles.sidebarTitle}>SmartApply.AI</h1>
          <p style={styles.sidebarText}>
            The centralized Career Identity ERP.
            A single source of truth for your professional journey.
          </p>

          <div style={styles.features}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✦</div>
              <div>
                <div style={styles.featureTitle}>Unified Identity</div>
                <div style={styles.featureSub}>16+ ERP-style career sections.</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✦</div>
              <div>
                <div style={styles.featureTitle}>One-Click Apply</div>
                <div style={styles.featureSub}>Auto-fill applications instantly.</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>✦</div>
              <div>
                <div style={styles.featureTitle}>AI-Powered</div>
                <div style={styles.featureSub}>Smart resume parsing and optimization.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Clean GitHub-Inspired Login */}
      <div style={styles.formSection}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSubtitle}>Verify your identity to enter your workspace.</p>
          </div>

          <form onSubmit={handleEmailLogin} style={styles.form}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label htmlFor="password" style={styles.label}>Password</label>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={isLoading} style={styles.primaryButton}>
              {isLoading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or continue with</span>
          </div>

          <button onClick={handleGoogleLogin} style={styles.googleButton}>
            <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google" style={styles.googleIcon} />
            Sign in with Google
          </button>

          <div style={styles.footer}>
            New to SmartApply.AI? <Link to="/signup" style={styles.link}>Create an account</Link>
          </div>
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
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  sidebar: {
    flex: 1.2,
    backgroundColor: '#0d1117',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: 'radial-gradient(circle at 2px 2px, #30363d 1px, transparent 0)',
    backgroundSize: '40px 40px',
  },
  sidebarContent: { maxWidth: '460px', zIndex: 2 },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#1f883d20',
    color: '#3fb950',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '24px',
    border: '1px solid #3fb95030',
  },
  sidebarTitle: { fontSize: '56px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-2px', lineHeight: 1.1 },
  sidebarText: { fontSize: '20px', lineHeight: '1.6', color: '#8b949e', marginBottom: '48px' },
  features: { display: 'flex', flexDirection: 'column', gap: '32px' },
  featureItem: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  featureIcon: { color: '#3fb950', fontSize: '20px', marginTop: '2px' },
  featureTitle: { fontSize: '16px', fontWeight: 600, color: '#f0f6fc', marginBottom: '4px' },
  featureSub: { fontSize: '14px', color: '#8b949e' },
  formSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fa',
    padding: '40px',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(149,157,165,0.1)',
  },
  formHeader: { marginBottom: '32px' },
  formTitle: { fontSize: '24px', fontWeight: 600, color: '#1f2328', marginBottom: '8px' },
  formSubtitle: { fontSize: '14px', color: '#636c76' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#1f2328' },
  forgotLink: { fontSize: '12px', color: '#0969da', textDecoration: 'none' },
  input: {
    padding: '10px 14px',
    fontSize: '15px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    backgroundColor: '#f6f8fa',
    outline: 'none',
    transition: 'all 0.2s',
  },
  primaryButton: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#1f883d',
    color: '#ffffff',
    border: '1px solid rgba(27,31,36,0.15)',
    borderRadius: '6px',
    fontSize: '14px',
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
    padding: '0 12px',
    fontSize: '12px',
    color: '#636c76',
    textTransform: 'uppercase'
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#ffffff',
    color: '#1f2328',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
  googleIcon: { width: '18px', height: '18px' },
  footer: { marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#636c76' },
  link: { color: '#0969da', textDecoration: 'none', fontWeight: 600 },
};

export default Login;
