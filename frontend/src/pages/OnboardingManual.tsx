import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface ExperienceEntry {
  id: number;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface EducationEntry {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  gpa: string;
  startDate: string;
  endDate: string;
}

interface ProjectEntry {
  id: number;
  title: string;
  description: string;
  link: string;
  technologies: string; // Comma-separated
}

interface CertificationEntry {
  id: number;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
}

interface LanguageEntry {
  id: number;
  lang: string;
  level: string;
}

const OnboardingManual: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    personal: {
      fullName: '',
      headline: '',
      summary: '',
      phone: '',
      location: '',
      website: '',
    },
    experience: [] as ExperienceEntry[],
    education: [] as EducationEntry[],
    projects: [] as ProjectEntry[],
    skills: {
      technical: '', // Comma-separated string
      interpersonal: '', // Comma-separated string
      intrapersonal: '', // Comma-separated string
    },
    achievements: '', // Comma-separated string
    certifications: [] as CertificationEntry[],
    volunteerExperience: '', // Comma-separated string
    extracurricularActivities: '', // Comma-separated string
    interests: '', // Comma-separated string
    languages: [] as LanguageEntry[],
    socialLinks: {
      github: '',
      linkedin: '',
      leetcode: '',
      portfolio: '',
      other: '',
    },
    profilePhoto: null as File | null, // Placeholder for file
    recommendationLetters: [] as File[], // Placeholder for files
  });
  const [isSaving, setIsSaving] = useState(false);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personal: { ...prev.personal, [name]: value }
    }));
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: 'technical' | 'interpersonal' | 'intrapersonal') => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      skills: { ...prev.skills, [type]: value }
    }));
  };

  const handleGenericListChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof typeof formData) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Dynamic list handlers
  const addExperience = () => {
    setFormData(prev => ({ ...prev, experience: [...prev.experience, { id: Date.now(), company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }] }));
  };
  const updateExperience = (id: number, field: keyof ExperienceEntry, value: any) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp) }));
  };
  const removeExperience = (id: number) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
  };

  const addEducation = () => {
    setFormData(prev => ({ ...prev, education: [...prev.education, { id: Date.now(), institution: '', degree: '', fieldOfStudy: '', gpa: '', startDate: '', endDate: '' }] }));
  };
  const updateEducation = (id: number, field: keyof EducationEntry, value: any) => {
    setFormData(prev => ({ ...prev, education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu) }));
  };
  const removeEducation = (id: number) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
  };

  const addProject = () => {
    setFormData(prev => ({ ...prev, projects: [...prev.projects, { id: Date.now(), title: '', description: '', link: '', technologies: '' }] }));
  };
  const updateProject = (id: number, field: keyof ProjectEntry, value: any) => {
    setFormData(prev => ({ ...prev, projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj) }));
  };
  const removeProject = (id: number) => {
    setFormData(prev => ({ ...prev, projects: prev.projects.filter(proj => proj.id !== id) }));
  };

  const addCertification = () => {
    setFormData(prev => ({ ...prev, certifications: [...prev.certifications, { id: Date.now(), name: '', issuer: '', issueDate: '', expiryDate: '' }] }));
  };
  const updateCertification = (id: number, field: keyof CertificationEntry, value: any) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.map(cert => cert.id === id ? { ...cert, [field]: value } : cert) }));
  };
  const removeCertification = (id: number) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.filter(cert => cert.id !== id) }));
  };

  const addLanguage = () => {
    setFormData(prev => ({ ...prev, languages: [...prev.languages, { id: Date.now(), lang: '', level: '', }] }));
  };
  const updateLanguage = (id: number, field: keyof LanguageEntry, value: any) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.map(lang => lang.id === id ? { ...lang, [field]: value } : lang) }));
  };
  const removeLanguage = (id: number) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter(lang => lang.id !== id) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      personal: {
        headline: formData.personal.headline,
        summary: formData.personal.summary,
        phone: formData.personal.phone,
        location: formData.personal.location,
        website: formData.personal.website,
      },
      experience: formData.experience.map(({ id, ...rest }) => rest), // Remove 'id' before sending
      education: formData.education.map(({ id, ...rest }) => rest), // Remove 'id' before sending
      projects: formData.projects.map(({ id, technologies, ...rest }) => ({ ...rest, technologies: technologies.split(',').map(t => t.trim()).filter(t => t) })), // Split technologies
      skills: {
        technical: formData.skills.technical.split(',').map(s => s.trim()).filter(s => s),
        interpersonal: formData.skills.interpersonal.split(',').map(s => s.trim()).filter(s => s),
        intrapersonal: formData.skills.intrapersonal.split(',').map(s => s.trim()).filter(s => s),
      },
      achievements: formData.achievements.split(',').map(a => a.trim()).filter(a => a),
      certifications: formData.certifications.map(({ id, ...rest }) => rest), // Remove 'id' before sending
      interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
      languages: formData.languages.map(({ id, ...rest }) => rest), // Remove 'id' before sending
      socialLinks: formData.socialLinks,
    };

    try {
      await api.put('/api/v1/profile/me', payload);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save manual ERP data:', error);
      alert('Failed to save your data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Manual Career ERP Input</h1>
        <p style={styles.subtitle}>Fill in your professional details below to build your comprehensive career identity.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Mandatory Sections */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Personal & Contact Information</h2>
            <label htmlFor="fullName" style={styles.label}>Full Name</label>
            <input id="fullName" type="text" name="fullName" value={formData.personal.fullName} onChange={handlePersonalChange} style={styles.input} placeholder="Your Full Name" />
            <label htmlFor="headline" style={styles.label}>Headline</label>
            <input id="headline" type="text" name="headline" value={formData.personal.headline} onChange={handlePersonalChange} style={styles.input} placeholder="e.g., Software Engineer | AI Enthusiast" />
            <label htmlFor="summary" style={styles.label}>Summary</label>
            <textarea id="summary" name="summary" value={formData.personal.summary} onChange={handlePersonalChange} style={{ ...styles.input, height: '100px' }} placeholder="A brief professional summary" />
            <label htmlFor="phone" style={styles.label}>Phone</label>
            <input id="phone" type="text" name="phone" value={formData.personal.phone} onChange={handlePersonalChange} style={styles.input} placeholder="e.g., +1 (555) 123-4567" />
            <label htmlFor="location" style={styles.label}>Location</label>
            <input id="location" type="text" name="location" value={formData.personal.location} onChange={handlePersonalChange} style={styles.input} placeholder="e.g., San Francisco, CA" />
            <label htmlFor="website" style={styles.label}>Website</label>
            <input id="website" type="text" name="website" value={formData.personal.website} onChange={handlePersonalChange} style={styles.input} placeholder="e.g., https://yourportfolio.com" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Work Experience (including Internships/Training)</h2>
            {formData.experience.map(exp => (
              <div key={exp.id} style={styles.dynamicEntry}>
                <label style={styles.label}>Company</label>
                <input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} style={styles.input} />
                <label style={styles.label}>Role</label>
                <input type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} style={styles.input} />
                <label style={styles.label}>Location</label>
                <input type="text" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} style={styles.input} />
                <label style={styles.label}>Start Date</label>
                <input type="date" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} style={styles.input} />
                <label style={styles.label}>End Date</label>
                <input type="date" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} style={styles.input} />
                <label style={styles.label}>
                  <input type="checkbox" checked={exp.isCurrent} onChange={e => updateExperience(exp.id, 'isCurrent', e.target.checked)} /> Currently working here
                </label>
                <label style={styles.label}>Description</label>
                <textarea value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} style={{ ...styles.input, height: '80px' }} />
                <button type="button" onClick={() => removeExperience(exp.id)} style={styles.removeButton}>Remove Experience</button>
              </div>
            ))}
            <button type="button" onClick={addExperience} style={styles.addButton}>Add Experience</button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Education</h2>
            {formData.education.map(edu => (
              <div key={edu.id} style={styles.dynamicEntry}>
                <label style={styles.label}>Institution</label>
                <input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} style={styles.input} />
                <label style={styles.label}>Degree</label>
                <input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} style={styles.input} />
                <label style={styles.label}>Field of Study</label>
                <input type="text" value={edu.fieldOfStudy} onChange={e => updateEducation(edu.id, 'fieldOfStudy', e.target.value)} style={styles.input} />
                <label style={styles.label}>GPA</label>
                <input type="text" value={edu.gpa} onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} style={styles.input} />
                <label style={styles.label}>Start Date</label>
                <input type="date" value={edu.startDate} onChange={e => updateEducation(edu.id, 'startDate', e.target.value)} style={styles.input} />
                <label style={styles.label}>End Date</label>
                <input type="date" value={edu.endDate} onChange={e => updateEducation(edu.id, 'endDate', e.target.value)} style={styles.input} />
                <button type="button" onClick={() => removeEducation(edu.id)} style={styles.removeButton}>Remove Education</button>
              </div>
            ))}
            <button type="button" onClick={addEducation} style={styles.addButton}>Add Education</button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Projects</h2>
            {formData.projects.map(proj => (
              <div key={proj.id} style={styles.dynamicEntry}>
                <label style={styles.label}>Title</label>
                <input type="text" value={proj.title} onChange={e => updateProject(proj.id, 'title', e.target.value)} style={styles.input} />
                <label style={styles.label}>Description</label>
                <textarea value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} style={{ ...styles.input, height: '80px' }} />
                <label style={styles.label}>Link</label>
                <input type="text" value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} style={styles.input} />
                <label style={styles.label}>Technologies (comma-separated)</label>
                <input type="text" value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} style={styles.input} />
                <button type="button" onClick={() => removeProject(proj.id)} style={styles.removeButton}>Remove Project</button>
              </div>
            ))}
            <button type="button" onClick={addProject} style={styles.addButton}>Add Project</button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Skills</h2>
            <label style={styles.label}>Technical Skills (comma-separated)</label>
            <textarea value={formData.skills.technical} onChange={e => handleSkillChange(e, 'technical')} style={{ ...styles.input, height: '80px' }} placeholder="e.g., Python, React, AWS, Docker" />
            <label style={styles.label}>Interpersonal Skills (comma-separated)</label>
            <textarea value={formData.skills.interpersonal} onChange={e => handleSkillChange(e, 'interpersonal')} style={{ ...styles.input, height: '80px' }} placeholder="e.g., Communication, Teamwork, Leadership" />
            <label style={styles.label}>Intrapersonal Skills (comma-separated)</label>
            <textarea value={formData.skills.intrapersonal} onChange={e => handleSkillChange(e, 'intrapersonal')} style={{ ...styles.input, height: '80px' }} placeholder="e.g., Resilience, Adaptability, Self-motivation" />
          </div>

          {/* Optional Sections */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Achievements</h2>
            <textarea value={formData.achievements} onChange={e => handleGenericListChange(e, 'achievements')} style={{ ...styles.input, height: '80px' }} placeholder="List your achievements, comma-separated" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Certifications</h2>
            {formData.certifications.map(cert => (
              <div key={cert.id} style={styles.dynamicEntry}>
                <label style={styles.label}>Name</label>
                <input type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} style={styles.input} />
                <label style={styles.label}>Issuer</label>
                <input type="text" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} style={styles.input} />
                <label style={styles.label}>Issue Date</label>
                <input type="date" value={cert.issueDate} onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)} style={styles.input} />
                <label style={styles.label}>Expiry Date</label>
                <input type="date" value={cert.expiryDate} onChange={e => updateCertification(cert.id, 'expiryDate', e.target.value)} style={styles.input} />
                <button type="button" onClick={() => removeCertification(cert.id)} style={styles.removeButton}>Remove Certification</button>
              </div>
            ))}
            <button type="button" onClick={addCertification} style={styles.addButton}>Add Certification</button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Volunteer Experience</h2>
            <textarea value={formData.volunteerExperience} onChange={e => handleGenericListChange(e, 'volunteerExperience')} style={{ ...styles.input, height: '80px' }} placeholder="List your volunteer experiences, comma-separated" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Extracurricular Activities</h2>
            <textarea value={formData.extracurricularActivities} onChange={e => handleGenericListChange(e, 'extracurricularActivities')} style={{ ...styles.input, height: '80px' }} placeholder="List your extracurricular activities, comma-separated" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Hobbies & Interests</h2>
            <textarea value={formData.interests} onChange={e => handleGenericListChange(e, 'interests')} style={{ ...styles.input, height: '80px' }} placeholder="List your hobbies and interests, comma-separated" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Languages Known</h2>
            {formData.languages.map(lang => (
              <div key={lang.id} style={styles.dynamicEntry}>
                <label style={styles.label}>Language</label>
                <input type="text" value={lang.lang} onChange={e => updateLanguage(lang.id, 'lang', e.target.value)} style={styles.input} />
                <label style={styles.label}>Proficiency Level</label>
                <input type="text" value={lang.level} onChange={e => updateLanguage(lang.id, 'level', e.target.value)} style={styles.input} placeholder="e.g., Native, Fluent, Intermediate" />
                <button type="button" onClick={() => removeLanguage(lang.id)} style={styles.removeButton}>Remove Language</button>
              </div>
            ))}
            <button type="button" onClick={addLanguage} style={styles.addButton}>Add Language</button>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Social Links</h2>
            <label htmlFor="github" style={styles.label}>GitHub Profile URL</label>
            <input id="github" type="text" name="github" value={formData.socialLinks.github} onChange={handleSocialLinkChange} style={styles.input} placeholder="https://github.com/yourusername" />
            <label htmlFor="linkedin" style={styles.label}>LinkedIn Profile URL</label>
            <input id="linkedin" type="text" name="linkedin" value={formData.socialLinks.linkedin} onChange={handleSocialLinkChange} style={styles.input} placeholder="https://linkedin.com/in/yourusername" />
            <label htmlFor="leetcode" style={styles.label}>LeetCode Profile URL</label>
            <input id="leetcode" type="text" name="leetcode" value={formData.socialLinks.leetcode} onChange={handleSocialLinkChange} style={styles.input} placeholder="https://leetcode.com/yourusername" />
            <label htmlFor="portfolio" style={styles.label}>Portfolio Website URL</label>
            <input id="portfolio" type="text" name="portfolio" value={formData.socialLinks.portfolio} onChange={handleSocialLinkChange} style={styles.input} placeholder="https://yourportfolio.com" />
            <label htmlFor="other" style={styles.label}>Other Social Link</label>
            <input id="other" type="text" name="other" value={formData.socialLinks.other} onChange={handleSocialLinkChange} style={styles.input} placeholder="Any other relevant link" />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Profile Photo (Placeholder)</h2>
            <p style={styles.placeholderText}>File upload functionality for profile photo will be implemented later.</p>
            {/* <input type="file" onChange={handleProfilePhotoChange} style={styles.input} /> */}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Recommendation Letters (Placeholder)</h2>
            <p style={styles.placeholderText}>File upload functionality for recommendation letters will be implemented later.</p>
            {/* <input type="file" multiple onChange={handleRecommendationLettersChange} style={styles.input} /> */}
          </div>

          <div style={styles.buttonContainer}>
            <button type="submit" style={styles.submitButton} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Go to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f6f8fa',
    padding: '40px 20px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #d0d7de',
    boxShadow: '0 8px 24px rgba(149,157,165,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '800px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#1f2328',
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '-1px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#636c76',
    marginBottom: '40px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2328',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2328',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    fontSize: '15px',
    backgroundColor: '#f6f8fa',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
  },
  submitButton: {
    backgroundColor: '#1f883d',
    color: '#ffffff',
    padding: '12px 32px',
    border: '1px solid rgba(27,31,36,0.15)',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  addButton: {
    backgroundColor: '#ffffff',
    color: '#0969da',
    padding: '8px 16px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  removeButton: {
    backgroundColor: '#ffffff',
    color: '#cf222e',
    padding: '6px 12px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    alignSelf: 'flex-end',
  },
  dynamicEntry: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    backgroundColor: '#f6f8fa30',
    marginBottom: '16px',
  },
  placeholderText: {
    color: '#636c76',
    fontSize: '14px',
    fontStyle: 'italic',
  }
};

export default OnboardingManual;