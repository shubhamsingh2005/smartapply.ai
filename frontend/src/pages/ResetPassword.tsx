import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ResetPassword: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match. Please ensure both entries are identical.");
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/api/v1/auth/reset-password', { email, otp, new_password: newPassword });
            alert("Your password has been reset successfully. You can now sign in with your new password.");
            navigate('/login');
        } catch (error: any) {
            alert(error.response?.data?.detail || "Unable to reset password. Please verify your code and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!email) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <p>Your session has expired. Please request a new password reset code.</p>
                    <button onClick={() => navigate('/forgot-password')} style={styles.primaryButton}>Request New Code</button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.logo}>SmartApply.AI</h1>
            </div>

            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Set New Password</h2>
                <p style={styles.infoText}>Enter the verification code sent to <strong>{email}</strong> and choose a new password for your account.</p>

                <form onSubmit={handleReset} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="otp" style={styles.label}>Reset code</label>
                        <input
                            id="otp"
                            type="text"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            style={styles.input}
                            placeholder="000000"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="newPassword" style={styles.label}>New password</label>
                        <input
                            id="newPassword"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="confirmPassword" style={styles.label}>Confirm new password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={styles.primaryButton}>
                        {isLoading ? 'Resetting...' : 'Reset password'}
                    </button>
                </form>
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
};

export default ResetPassword;
