import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

interface IdentitySyncModuleProps {
  theme: any;
}

export const IdentitySyncModule: React.FC<IdentitySyncModuleProps> = ({ theme }) => {
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
      navigate('/onboarding/review', { state: { parsedData: response.data, mode: activeMode } });
    } catch (err: any) {
      console.error("Parsing Error:", err);
      alert(err.response?.data?.detail || "Error parsing file.");
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
      id: 'linkedin',
      title: 'Sync via LinkedIn',
      description: 'Quickly refresh your identity from your latest LinkedIn PDF export.',
      icon: '📄',
      color: '#0077b5',
      action: () => triggerUpload('linkedin')
    },
    {
      id: 'resume',
      title: 'Sync via Resume',
      description: 'Upload a new resume version and let AI extract updated details.',
      icon: '🤖',
      color: '#2da44e',
      action: () => triggerUpload('resume')
    },
    {
      id: 'manual',
      title: 'Manual Overhaul',
      description: 'Start fresh with manual entry to fine-tune every section.',
      icon: '✍️',
      color: '#0969da',
      action: () => navigate('/onboarding/manual')
    }
  ];

  return (
    <div style={styles.grid}>
      {isParsing && (
        <div style={styles.overlay}>
          <div style={styles.loader}></div>
          <p style={{ ...styles.loaderText, color: theme.text }}>
            {activeMode === 'linkedin' ? 'Syncing LinkedIn Data...' : 'AI is extracting updates...'}
          </p>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="application/pdf"
        onChange={handleFileUpload}
      />

      {options.map(opt => (
        <div 
          key={opt.id} 
          style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}
          onClick={opt.action}
        >
          <div style={{ ...styles.iconWrapper, backgroundColor: opt.color + '15', color: opt.color }}>
            {opt.icon}
          </div>
          <h3 style={{ ...styles.cardTitle, color: theme.text }}>{opt.title}</h3>
          <p style={{ ...styles.cardDesc, color: theme.textSecondary }}>{opt.description}</p>
          <button style={{ ...styles.selectBtn, color: opt.color }}>
             Launch Refresh →
          </button>
        </div>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  grid: { display: 'flex', gap: '20px', width: '100%', position: 'relative' },
  card: {
    flex: 1, border: '1px solid', borderRadius: '12px', padding: '24px',
    cursor: 'pointer', transition: 'transform 0.2s ease', display: 'flex',
    flexDirection: 'column', alignItems: 'center', textAlign: 'center'
  },
  iconWrapper: {
    width: '60px', height: '60px', borderRadius: '15px', fontSize: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
  },
  cardTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '8px' },
  cardDesc: { fontSize: '14px', lineHeight: '1.5', marginBottom: '20px', flex: 1 },
  selectBtn: { background: 'none', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  overlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)', z_index: 100, display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
  },
  loader: {
    width: '40px', height: '40px', border: '4px solid #f3f3f3',
    borderTop: '4px solid #0969da', borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loaderText: { marginTop: '15px', fontSize: '16px', fontWeight: 500 }
};
