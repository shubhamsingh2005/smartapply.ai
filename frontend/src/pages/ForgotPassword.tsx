import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post('/api/v1/auth/forgot-password', { email });
            alert(response.data.message);
            navigate('/reset-password', { state: { email } });
        } catch (error: any) {
            alert(error.response?.data?.detail || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.logo}>SmartApply.AI</h1>
            </div>

            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Reset Your Password</h2>
                <p style={styles.infoText}>Enter your email address and we'll send you a verification code to reset your password.</p>

                <form onSubmit={handleForgot} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="you@example.com"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={styles.primaryButton}>
                        {isLoading ? 'Sending...' : 'Send reset code'}
                    </button>
                </form>

                <div style={styles.footer}>
                    Remembered your password? <Link to="/login" style={styles.link}>Sign in</Link>
                </div>
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
        padding: '10px 14px',
        fontSize: '15px',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        backgroundColor: '#f6f8fa',
        outline: 'none',
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
    },
    footer: { marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#636c76' },
    link: { color: '#0969da', textDecoration: 'none', fontWeight: 600 },
};

export default ForgotPassword;
