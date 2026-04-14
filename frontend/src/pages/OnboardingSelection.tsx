import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const OnboardingSelection: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeMode, setActiveMode] = useState<'linkedin' | 'resume' | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeMode) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append('file', file);

    const endpoint = activeMode === 'linkedin'
      ? '/api/v1/profile/parse/linkedin'
      : '/api/v1/profile/parse/resume';

    try {
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Navigate to the onboarding form with the parsed data
      navigate('/onboarding/review', { state: { parsedData: response.data, mode: activeMode } });
    } catch (err) {
      const error = err as any;
      console.error("Parsing Error:", error);
      const errorMsg = error.response?.data?.detail || `Error parsing ${activeMode === 'linkedin' ? 'LinkedIn PDF' : 'Resume'}. Please try again or use Manual Entry.`;
      alert(errorMsg);
    } finally {
      setIsParsing(false);
      setActiveMode(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (mode: 'linkedin' | 'resume') => {
    setActiveMode(mode);
    fileInputRef.current?.click();
  };

  const options = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Hand-craft your professional identity from scratch. Best for total control.',
      icon: '✍️',
      color: '#0969da',
      action: () => navigate('/onboarding/manual')
    },
    {
      id: 'linkedin',
      title: 'LinkedIn PDF Import',
      description: 'Export your LinkedIn profile as a PDF and we will magically extract all 16+ sections.',
      icon: '📄',
      color: '#0077b5',
      action: () => triggerUpload('linkedin')
    },
    {
      id: 'resume',
      title: 'Resume AI Parsing',
      description: 'Upload your current resume. Our Gemini AI will map it to the ERP schema for review.',
      icon: '🤖',
      color: '#2da44e',
      action: () => triggerUpload('resume')
    }
  ];

  return (
    <div style={styles.container}>
      {isParsing && (
        <div style={styles.overlay}>
          <div style={styles.loader}></div>
          <p style={styles.loaderText}>
            {activeMode === 'linkedin'
              ? 'Analyzing your LinkedIn profile...'
              : 'Our AI is extracting your career identity...'}
          </p>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="application/pdf"
        onChange={handleFileUpload}
        title="Upload PDF Profile"
        aria-label="Upload PDF Profile"
      />

      <div style={styles.header}>
        <h1 style={styles.title}>Welcome to SmartApply.AI</h1>
        <p style={styles.subtitle}>How would you like to build your Career Identity ERP?</p>
      </div>

      <div style={styles.grid}>
        {options.map(opt => (
          <div key={opt.id} style={styles.card} onClick={opt.action}>
            <div style={{ ...styles.iconWrapper, backgroundColor: opt.color + '15', color: opt.color }}>
              {opt.icon}
            </div>
            <h3 style={styles.cardTitle}>{opt.title}</h3>
            <p style={styles.cardDesc}>{opt.description}</p>
            <button style={{ ...styles.selectBtn, color: opt.color }}>
              {isParsing && activeMode === opt.id ? 'Processing...' : 'Get Started →'}
            </button>
          </div>
        ))}
      </div>

      <p style={styles.footerNote}>This is a one-time setup to build your single source of truth.</p>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8fa',
    fontFamily: '"Inter", sans-serif', padding: '40px', position: 'relative'
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 100, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  loader: {
    width: '50px', height: '50px', border: '5px solid #f3f3f3',
    borderTop: '5px solid #1f883d', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loaderText: { marginTop: '20px', fontSize: '18px', fontWeight: 600, color: '#1f2328' },
  header: { textAlign: 'center', marginBottom: '60px' },
  title: { fontSize: '40px', fontWeight: 800, color: '#1f2328', marginBottom: '12px', letterSpacing: '-1px' },
  subtitle: { fontSize: '18px', color: '#57606a' },
  grid: { display: 'flex', gap: '30px', maxWidth: '1100px', width: '100%' },
  card: {
    flex: 1, backgroundColor: '#ffffff', border: '1px solid #d0d7de',
    borderRadius: '16px', padding: '40px', cursor: 'pointer',
    transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  iconWrapper: {
    width: '80px', height: '80px', borderRadius: '20px', fontSize: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
  },
  cardTitle: { fontSize: '22px', fontWeight: 700, color: '#1f2328', marginBottom: '16px' },
  cardDesc: { fontSize: '15px', color: '#57606a', lineHeight: '1.6', marginBottom: '30px', flex: 1 },
  selectBtn: { background: 'none', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer' },
  footerNote: { marginTop: '60px', fontSize: '14px', color: '#8b949e' }
};

export default OnboardingSelection;
