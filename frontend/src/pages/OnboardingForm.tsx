import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const OnboardingForm: React.FC = () => {
  const { mode } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Personal');
  const [isSaving, setIsSaving] = useState(false);

  // Initial ERP State for all 16 sections
  const [formData, setFormData] = useState({
    personal: { fullName: '', headline: '', summary: '', phone: '', location: '', website: '' },
    education: [{ institution: '', degree: '', fieldOfStudy: '', gpa: '', startDate: '', endDate: '' }],
    experience: [{ company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }],
    projects: [{ title: '', description: '', link: '', technologies: '' }],
    skills: { technical: '', interpersonal: '', intrapersonal: '' },
    achievements: '',
    certifications: [{ name: '', issuer: '', date: '' }],
    volunteer: '',
    extracurricular: '',
    hobbies: '',
    languages: '',
    socialLinks: { github: '', linkedin: '', leetcode: '', portfolio: '' }
  });

  const tabs = [
    'Personal', 'Education', 'Experience', 'Projects', 'Skills', 
    'More (Achievements, Volunteer, etc.)', 'Social Links'
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real flow, we'd hit PUT /api/v1/profile/me
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      alert('Career Identity ERP Saved Successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert('Error saving data');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>ERP Data Entry</h2>
          <p style={styles.sidebarMode}>Mode: {mode?.toUpperCase()}</p>
        </div>
        <div style={styles.tabList}>
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tabItem,
                backgroundColor: activeTab === tab ? '#1f2328' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#8b949e'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={styles.completionCard}>
          <div style={styles.completionLabel}>Review Progress</div>
          <div style={styles.progressBar}><div style={{...styles.progress, width: '40%'}}></div></div>
          <p style={styles.completionText}>40% Complete</p>
        </div>
      </div>

      <div style={styles.main}>
        <header style={styles.mainHeader}>
          <h1 style={styles.sectionTitle}>{activeTab} Details</h1>
          <button onClick={handleSave} disabled={isSaving} style={styles.saveBtn}>
            {isSaving ? 'Saving...' : 'Finalize & Enter Dashboard →'}
          </button>
        </header>

        <div style={styles.formContent}>
          {/* Simple Dynamic rendering for Personal Section */}
          {activeTab === 'Personal' && (
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input style={styles.input} placeholder="John Doe" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Headline</label>
                <input style={styles.input} placeholder="Full Stack Engineer | AI Researcher" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} placeholder="+1 234 567 890" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Location</label>
                <input style={styles.input} placeholder="San Francisco, CA" />
              </div>
              <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                <label style={styles.label}>Professional Summary</label>
                <textarea style={{...styles.input, height: '120px', resize: 'none'}} placeholder="Briefly describe your career goals..." />
              </div>
            </div>
          )}

          {activeTab !== 'Personal' && (
            <div style={styles.placeholder}>
              <p>Form section for <strong>{activeTab}</strong> will appear here.</p>
              <p style={{fontSize: '14px', color: '#636c76'}}>You can add multiple entries for Experience, Education, and Projects.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f6f8fa', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '300px', backgroundColor: '#0d1117', padding: '32px', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { marginBottom: '32px' },
  sidebarTitle: { color: '#ffffff', fontSize: '24px', fontWeight: 800, marginBottom: '8px' },
  sidebarMode: { color: '#1f883d', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' },
  tabList: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  tabItem: { border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  completionCard: { backgroundColor: '#161b22', padding: '20px', borderRadius: '12px', marginTop: '20px' },
  completionLabel: { fontSize: '12px', color: '#8b949e', marginBottom: '8px', fontWeight: 600 },
  progressBar: { height: '6px', backgroundColor: '#30363d', borderRadius: '3px' },
  progress: { height: '100%', backgroundColor: '#2da44e', borderRadius: '3px' },
  completionText: { fontSize: '12px', color: '#c9d1d9', marginTop: '8px', textAlign: 'right' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  mainHeader: { padding: '32px 48px', backgroundColor: '#ffffff', borderBottom: '1px solid #d0d7de', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  sectionTitle: { fontSize: '28px', fontWeight: 700, color: '#1f2328' },
  saveBtn: { padding: '12px 24px', backgroundColor: '#1f883d', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  formContent: { padding: '48px', maxWidth: '900px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#1f2328' },
  input: { padding: '12px', border: '1px solid #d0d7de', borderRadius: '8px', fontSize: '15px', backgroundColor: '#ffffff' },
  placeholder: { textAlign: 'center', padding: '100px 0', border: '2px dashed #d0d7de', borderRadius: '12px', color: '#57606a' }
};

export default OnboardingForm;
