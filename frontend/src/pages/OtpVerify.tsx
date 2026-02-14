import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const OtpVerify: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  if (!email) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Session expired. Please signup again.</p>
          <button onClick={() => navigate('/signup')} style={styles.primaryButton}>Go to Signup</button>
        </div>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/verify-otp', { email, otp });
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        alert('Email verified successfully! proceeding to onboarding...');
        navigate('/onboarding');
      } else {
        alert('Email verified successfully! Please login.');
        navigate('/login');
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/api/v1/auth/resend-otp', { email });
      alert('OTP resent to your email!');
    } catch (error: any) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SmartApply.AI</h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Verify your email</h2>
        <p style={styles.infoText}>We've sent a 6-digit code to <strong>{email}</strong></p>

        <form onSubmit={handleVerify} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="otp" style={styles.label}>Verification code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={styles.input}
              placeholder="000000"
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.primaryButton}>
            {isLoading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <p style={styles.footerText}>
          Didn't receive the code? <button onClick={handleResend} style={styles.resendBtn}>Resend code</button>
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8fa',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '36px', fontWeight: 800, color: '#1f2328', marginBottom: '8px', letterSpacing: '-1.5px' },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 8px 24px rgba(149,157,165,0.1)',
  },
  cardTitle: { fontSize: '24px', fontWeight: 600, color: '#1f2328', marginBottom: '12px', textAlign: 'center' },
  infoText: { fontSize: '14px', color: '#636c76', textAlign: 'center', marginBottom: '32px', lineHeight: '1.6' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#1f2328' },
  input: {
    padding: '12px',
    fontSize: '24px',
    letterSpacing: '8px',
    textAlign: 'center',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    backgroundColor: '#f6f8fa',
    outline: 'none',
    fontWeight: 700,
    color: '#1f2328',
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
  footerText: { marginTop: '32px', fontSize: '14px', textAlign: 'center', color: '#636c76' },
  resendBtn: { background: 'none', border: 'none', color: '#0969da', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: 600 },
};

export default OtpVerify;
