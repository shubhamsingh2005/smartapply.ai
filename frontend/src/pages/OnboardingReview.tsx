import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const OnboardingReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [erpData, setErpData] = useState<any>(location.state?.parsedData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!location.state?.parsedData);

  useEffect(() => {
    if (!erpData || Object.keys(erpData).length === 0) {
      const fetchData = async () => {
        try {
          const res = await api.get('/api/v1/profile/me');
          if (res.data?.erp_data) {
            setErpData(res.data.erp_data);
          }
        } catch (err) {
          console.error("Failed to load profile for editing", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, []);

  const sections = [
    { id: 'personal', title: 'Personal Info', icon: '👤' },
    { id: 'experience', title: 'Experience', icon: '💼' },
    { id: 'education', title: 'Education', icon: '🎓' },
    { id: 'skills', title: 'Skills', icon: '🛠️' },
    { id: 'projects', title: 'Projects', icon: '🚀' },
    { id: 'achievements', title: 'Achievements', icon: '🏆' },
    { id: 'certifications', title: 'Certifications', icon: '📜' },
    { id: 'socialLinks', title: 'Social Links', icon: '🌐' }
  ];

  const [activeSection, setActiveSection] = useState('personal');

  const handleInputChange = (section: string, field: string, value: any) => {
    setErpData({
      ...erpData,
      [section]: {
        ...erpData[section],
        [field]: value
      }
    });
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/v1/profile/me', erpData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Save failed", error);
      const errorDetail = error.response?.data?.detail || "Please check your data.";
      alert(`Failed to save profile: ${errorDetail}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading editor...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>ERP Review</h2>
          <p style={styles.sidebarSubtitle}>Verify your extracted identity</p>
        </div>
        <nav style={styles.nav}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                ...styles.navItem,
                backgroundColor: activeSection === s.id ? '#f0f7ff' : 'transparent',
                color: activeSection === s.id ? '#0969da' : '#1f2328',
                borderLeft: activeSection === s.id ? '4px solid #0969da' : '4px solid transparent'
              }}
            >
              <span style={{ marginRight: '10px' }}>{s.icon}</span> {s.title}
            </button>
          ))}
        </nav>
        <button
          style={styles.finalizeBtn}
          onClick={handleFinalize}
          disabled={isSaving}
        >
          {isSaving ? 'Finalizing...' : 'Finalize Identity →'}
        </button>
      </div>

      <main style={styles.content}>
        <div style={styles.formCard}>
          <h1 style={styles.sectionTitle}>{sections.find(s => s.id === activeSection)?.title}</h1>
          <hr style={styles.divider} />

          {/* Dynamic Form Rendering based on activeSection */}
          <div style={styles.fieldsGrid}>
            {activeSection === 'personal' && (
              <>
                <div style={styles.fieldGroup}>
                  <label htmlFor="fullName" style={styles.label}>Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    style={styles.input}
                    value={erpData.personal?.fullName || ''}
                    onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label htmlFor="headline" style={styles.label}>Headline</label>
                  <input
                    id="headline"
                    name="headline"
                    style={styles.input}
                    value={erpData.personal?.headline || ''}
                    onChange={(e) => handleInputChange('personal', 'headline', e.target.value)}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label htmlFor="summary" style={styles.label}>Summary</label>
                  <textarea
                    id="summary"
                    name="summary"
                    style={{ ...styles.input, height: '100px' }}
                    value={erpData.personal?.summary || ''}
                    onChange={(e) => handleInputChange('personal', 'summary', e.target.value)}
                  />
                </div>
              </>
            )}

            {activeSection === 'experience' && (
              <div style={styles.listContainer}>
                {erpData.experience?.length > 0 ? (
                  erpData.experience.map((exp: any, index: number) => (
                    <div key={index} style={styles.listItem}>
                      <div style={styles.itemTitle}>{exp.role} at {exp.company}</div>
                      <div style={styles.itemSub}>{exp.startDate} - {exp.endDate || 'Present'}</div>
                      <p style={styles.itemDesc}>{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No experience data found.</p>
                )}
              </div>
            )}

            {activeSection === 'education' && (
              <div style={styles.listContainer}>
                {erpData.education?.length > 0 ? (
                  erpData.education.map((edu: any, index: number) => (
                    <div key={index} style={styles.listItem}>
                      <div style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</div>
                      <div style={styles.itemSub}>{edu.institution}</div>
                      <div style={styles.itemSub}>{edu.startDate} - {edu.endDate}</div>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No education data found.</p>
                )}
              </div>
            )}

            {activeSection === 'skills' && (
              <div style={styles.skillsGrid}>
                <div style={styles.skillSection}>
                  <h3 style={styles.skillHeader}>Technical Skills</h3>
                  <div style={styles.tagCloud}>
                    {erpData.skills?.technical?.map((s: string, i: number) => (
                      <span key={i} style={styles.tag}>{s}</span>
                    )) || <span style={styles.emptyText}>None detected</span>}
                  </div>
                </div>
                <div style={styles.skillSection}>
                  <h3 style={styles.skillHeader}>Interpersonal Skills</h3>
                  <div style={styles.tagCloud}>
                    {erpData.skills?.interpersonal?.map((s: string, i: number) => (
                      <span key={i} style={styles.tag}>{s}</span>
                    )) || <span style={styles.emptyText}>None detected</span>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'projects' && (
              <div style={styles.listContainer}>
                {erpData.projects?.length > 0 ? (
                  erpData.projects.map((p: any, index: number) => (
                    <div key={index} style={styles.listItem}>
                      <div style={styles.itemTitle}>{p.title}</div>
                      <p style={styles.itemDesc}>{p.description}</p>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={styles.itemLink}>{p.link}</a>}
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No projects found.</p>
                )}
              </div>
            )}

            {activeSection === 'achievements' && (
              <div style={styles.listContainer}>
                {erpData.achievements?.length > 0 ? (
                  erpData.achievements.map((a: string, index: number) => (
                    <div key={index} style={styles.listItem}>
                      <div style={styles.itemTitle}>🏆 {a}</div>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No achievements detected.</p>
                )}
              </div>
            )}

            {activeSection === 'certifications' && (
              <div style={styles.listContainer}>
                {erpData.certifications?.length > 0 ? (
                  erpData.certifications.map((c: any, index: number) => (
                    <div key={index} style={styles.listItem}>
                      <div style={styles.itemTitle}>{c.name}</div>
                      <div style={styles.itemSub}>{c.issuer} ({c.date})</div>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No certifications detected.</p>
                )}
              </div>
            )}

            {activeSection === 'socialLinks' && (
              <div style={styles.fieldsGrid}>
                {Object.entries(erpData.socialLinks || {}).map(([key, value]: [string, any]) => (
                  <div key={key} style={styles.fieldGroup}>
                    <label style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                      style={styles.input}
                      value={value || ''}
                      onChange={(e) => handleInputChange('socialLinks', key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f6f8fa' },
  sidebar: {
    width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #d0d7de',
    display: 'flex', flexDirection: 'column', padding: '30px'
  },
  sidebarHeader: { marginBottom: '40px' },
  sidebarTitle: { fontSize: '24px', fontWeight: 800, color: '#1f2328' },
  sidebarSubtitle: { fontSize: '14px', color: '#57606a', marginTop: '4px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: {
    padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    textAlign: 'left', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center',
    transition: 'all 0.2s'
  },
  content: { flex: 1, padding: '60px', overflowY: 'auto' },
  formCard: {
    maxWidth: '800px', backgroundColor: '#ffffff', border: '1px solid #d0d7de',
    borderRadius: '16px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  sectionTitle: { fontSize: '28px', fontWeight: 700, color: '#1f2328' },
  divider: { margin: '24px 0', border: 'none', borderTop: '1px solid #d0d7de' },
  fieldsGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#1f2328' },
  input: {
    padding: '10px 14px', borderRadius: '6px', border: '1px solid #d0d7de',
    fontSize: '15px', outline: 'none'
  },
  finalizeBtn: {
    marginTop: '30px', padding: '16px', backgroundColor: '#1f883d', color: '#ffffff',
    border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '16px', cursor: 'pointer'
  },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  listItem: { padding: '16px', border: '1px solid #d0d7de', borderRadius: '8px' },
  itemTitle: { fontSize: '16px', fontWeight: 700, color: '#1f2328' },
  itemSub: { fontSize: '14px', color: '#57606a' },
  itemDesc: { fontSize: '14px', color: '#1f2328', marginTop: '8px', lineHeight: '1.5' },
  itemLink: { fontSize: '13px', color: '#0969da', textDecoration: 'none', display: 'block', marginTop: '4px' },
  emptyText: { color: '#8b949e', fontStyle: 'italic' },
  skillsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  skillSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  skillHeader: { fontSize: '14px', fontWeight: 600, color: '#57606a', textTransform: 'uppercase' },
  tagCloud: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: {
    padding: '4px 10px', backgroundColor: '#f0f7ff', border: '1px solid #0969da30',
    borderRadius: '12px', fontSize: '13px', color: '#0969da', fontWeight: 500
  }
};

export default OnboardingReview;
