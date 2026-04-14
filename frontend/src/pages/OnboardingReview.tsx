import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import cssStyles from './OnboardingReview.module.css';

interface Experience {
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface Project {
  title?: string;
  description?: string;
  link?: string;
}

interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
}

interface ERPData {
  personal?: {
    fullName?: string;
    headline?: string;
    summary?: string;
  };
  experience?: Experience[];
  education?: Education[];
  skills?: {
    technical: string[];
    interpersonal: string[];
  };
  projects?: Project[];
  achievements?: string[];
  certifications?: Certification[];
  socialLinks?: Record<string, string>;
  [key: string]: any;
}

const OnboardingReview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [erpData, setErpData] = useState<ERPData>(location.state?.parsedData || {});
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
  }, [erpData]);

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

  const handleInputChange = (section: string, field: string, value: string | string[]) => {
    setErpData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof ERPData] || {}),
        [field]: value
      }
    }));
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/v1/profile/me', erpData);
      navigate('/dashboard');
    } catch (err) {
      const error = err as any;
      console.error("Save failed", error);
      const errorDetail = error.response?.data?.detail || "Please check your data.";
      alert(`Failed to save profile: ${errorDetail}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className={cssStyles.loading}>Loading editor...</div>;

  return (
    <div className={cssStyles.container}>
      <aside className={cssStyles.sidebar}>
        <div className={cssStyles.sidebarHeader}>
          <h1 className={cssStyles.sidebarTitle}>Review Identity</h1>
          <p className={cssStyles.sidebarSubtitle}>Verify your details before finalizing.</p>
        </div>
        <nav className={cssStyles.nav}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`${cssStyles.navItem} ${activeSection === s.id ? cssStyles.navItemActive : ''}`}
            >
              <span style={{ marginRight: '12px', fontSize: '18px' }}>{s.icon}</span>
              {s.title}
            </button>
          ))}
        </nav>
        <button
          className={cssStyles.finalizeBtn}
          onClick={handleFinalize}
          disabled={isSaving}
        >
          {isSaving ? 'Finalizing...' : 'Finalize Identity →'}
        </button>
      </aside>

      <main className={cssStyles.content}>
        <div className={cssStyles.formCard}>
          <h2 className={cssStyles.sectionTitle}>{sections.find(s => s.id === activeSection)?.title}</h2>
          <hr className={cssStyles.divider} />

          <div className={cssStyles.fieldsGrid}>
            {activeSection === 'personal' && (
              <>
                <div className={cssStyles.fieldGroup}>
                  <label htmlFor="fullName" className={cssStyles.label}>Full Name</label>
                  <input
                    id="fullName"
                    className={cssStyles.input}
                    value={erpData.personal?.fullName || ''}
                    onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                  />
                </div>
                <div className={cssStyles.fieldGroup}>
                  <label htmlFor="headline" className={cssStyles.label}>Headline</label>
                  <input
                    id="headline"
                    className={cssStyles.input}
                    value={erpData.personal?.headline || ''}
                    onChange={(e) => handleInputChange('personal', 'headline', e.target.value)}
                  />
                </div>
                <div className={cssStyles.fieldGroup}>
                  <label htmlFor="summary" className={cssStyles.label}>Summary</label>
                  <textarea
                    id="summary"
                    className={cssStyles.input}
                    style={{ height: '120px' }}
                    value={erpData.personal?.summary || ''}
                    onChange={(e) => handleInputChange('personal', 'summary', e.target.value)}
                  />
                </div>
              </>
            )}

            {activeSection === 'experience' && (
              <div className={cssStyles.listContainer}>
                {erpData.experience && erpData.experience.length > 0 ? (
                  erpData.experience.map((exp: Experience, index: number) => (
                    <div key={index} className={cssStyles.listItem}>
                      <div className={cssStyles.itemTitle}>{exp.role} at {exp.company}</div>
                      <div className={cssStyles.itemSub}>{exp.startDate} - {exp.endDate || 'Present'}</div>
                      <p className={cssStyles.itemDesc}>{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <p className={cssStyles.emptyText}>No experience data found.</p>
                )}
              </div>
            )}

            {activeSection === 'education' && (
              <div className={cssStyles.listContainer}>
                {erpData.education && erpData.education.length > 0 ? (
                  erpData.education.map((edu: Education, index: number) => (
                    <div key={index} className={cssStyles.listItem}>
                      <div className={cssStyles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</div>
                      <div className={cssStyles.itemSub}>{edu.institution}</div>
                      <div className={cssStyles.itemSub}>{edu.startDate} - {edu.endDate}</div>
                    </div>
                  ))
                ) : (
                  <p className={cssStyles.emptyText}>No education data found.</p>
                )}
              </div>
            )}

            {activeSection === 'skills' && (
              <div className={cssStyles.skillsGrid}>
                <div className={cssStyles.skillSection}>
                  <h3 className={cssStyles.skillHeader}>Technical Skills</h3>
                  <div className={cssStyles.tagCloud}>
                    {erpData.skills?.technical?.map((s: string, i: number) => (
                      <span key={i} className={cssStyles.tag}>{s}</span>
                    )) || <span className={cssStyles.emptyText}>None detected</span>}
                  </div>
                </div>
                <div className={cssStyles.skillSection}>
                  <h3 className={cssStyles.skillHeader}>Interpersonal Skills</h3>
                  <div className={cssStyles.tagCloud}>
                    {erpData.skills?.interpersonal?.map((s: string, i: number) => (
                      <span key={i} className={cssStyles.tag}>{s}</span>
                    )) || <span className={cssStyles.emptyText}>None detected</span>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'projects' && (
              <div className={cssStyles.listContainer}>
                {erpData.projects && erpData.projects.length > 0 ? (
                  erpData.projects.map((p: Project, index: number) => (
                    <div key={index} className={cssStyles.listItem}>
                      <div className={cssStyles.itemTitle}>{p.title}</div>
                      <p className={cssStyles.itemDesc}>{p.description}</p>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className={cssStyles.itemLink}>{p.link}</a>}
                    </div>
                  ))
                ) : (
                  <p className={cssStyles.emptyText}>No projects found.</p>
                )}
              </div>
            )}

            {activeSection === 'achievements' && (
              <div className={cssStyles.listContainer}>
                {erpData.achievements && erpData.achievements.length > 0 ? (
                  erpData.achievements.map((a: string, index: number) => (
                    <div key={index} className={cssStyles.listItem}>
                      <div className={cssStyles.itemTitle}>🏆 {a}</div>
                    </div>
                  ))
                ) : (
                  <p className={cssStyles.emptyText}>No achievements detected.</p>
                )}
              </div>
            )}

            {activeSection === 'certifications' && (
              <div className={cssStyles.listContainer}>
                {erpData.certifications && erpData.certifications.length > 0 ? (
                  erpData.certifications.map((c: Certification, index: number) => (
                    <div key={index} className={cssStyles.listItem}>
                      <div className={cssStyles.itemTitle}>{c.name}</div>
                      <div className={cssStyles.itemSub}>{c.issuer} ({c.date})</div>
                    </div>
                  ))
                ) : (
                  <p className={cssStyles.emptyText}>No certifications detected.</p>
                )}
              </div>
            )}

            {activeSection === 'socialLinks' && (
              <div className={cssStyles.fieldsGrid}>
                {Object.entries(erpData.socialLinks || {}).map(([key, value]) => (
                  <div key={key} className={cssStyles.fieldGroup}>
                    <label htmlFor={`social-${key}`} className={cssStyles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                      id={`social-${key}`}
                      className={cssStyles.input}
                      value={value || ''}
                      onChange={(e) => handleInputChange('socialLinks', key, e.target.value)}
                      title={`${key} link`}
                      placeholder={`Enter your ${key} profile URL`}
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

export default OnboardingReview;
