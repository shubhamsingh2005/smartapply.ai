import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import cssStyles from './OnboardingManual.module.css';

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
    <div className={cssStyles.container}>
      <div className={cssStyles.card}>
        <h1 className={cssStyles.title}>Manual Career ERP Input</h1>
        <p className={cssStyles.subtitle}>Fill in your professional details below to build your comprehensive career identity.</p>
        <form onSubmit={handleSubmit} className={cssStyles.form}>
          {/* Mandatory Sections */}
          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Personal & Contact Information</h2>
            <label htmlFor="fullName" className={cssStyles.label}>Full Name</label>
            <input id="fullName" type="text" name="fullName" value={formData.personal.fullName} onChange={handlePersonalChange} className={cssStyles.input} placeholder="Your Full Name" />
            <label htmlFor="headline" className={cssStyles.label}>Headline</label>
            <input id="headline" type="text" name="headline" value={formData.personal.headline} onChange={handlePersonalChange} className={cssStyles.input} placeholder="e.g., Software Engineer | AI Enthusiast" />
            <label htmlFor="summary" className={cssStyles.label}>Summary</label>
            <textarea id="summary" name="summary" value={formData.personal.summary} onChange={handlePersonalChange} className={cssStyles.input} style={{ height: '100px' }} placeholder="A brief professional summary" />
            <label htmlFor="phone" className={cssStyles.label}>Phone</label>
            <input id="phone" type="text" name="phone" value={formData.personal.phone} onChange={handlePersonalChange} className={cssStyles.input} placeholder="e.g., +1 (555) 123-4567" />
            <label htmlFor="location" className={cssStyles.label}>Location</label>
            <input id="location" type="text" name="location" value={formData.personal.location} onChange={handlePersonalChange} className={cssStyles.input} placeholder="e.g., San Francisco, CA" />
            <label htmlFor="website" className={cssStyles.label}>Website</label>
            <input id="website" type="text" name="website" value={formData.personal.website} onChange={handlePersonalChange} className={cssStyles.input} placeholder="e.g., https://yourportfolio.com" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Work Experience (including Internships/Training)</h2>
            {formData.experience.map((exp, index) => (
              <div key={exp.id} className={cssStyles.dynamicEntry}>
                <label htmlFor={`exp-company-${index}`} className={cssStyles.label}>Company</label>
                <input id={`exp-company-${index}`} type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className={cssStyles.input} placeholder="Company Name" title="Company" />
                <label htmlFor={`exp-role-${index}`} className={cssStyles.label}>Role</label>
                <input id={`exp-role-${index}`} type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} className={cssStyles.input} placeholder="Job Title" title="Role" />
                <label htmlFor={`exp-location-${index}`} className={cssStyles.label}>Location</label>
                <input id={`exp-location-${index}`} type="text" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} className={cssStyles.input} placeholder="City, Country" title="Location" />
                <label htmlFor={`exp-start-${index}`} className={cssStyles.label}>Start Date</label>
                <input id={`exp-start-${index}`} type="date" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} className={cssStyles.input} title="Start Date" />
                <label htmlFor={`exp-end-${index}`} className={cssStyles.label}>End Date</label>
                <input id={`exp-end-${index}`} type="date" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} className={cssStyles.input} title="End Date" />
                <label className={cssStyles.label}>
                  <input type="checkbox" checked={exp.isCurrent} onChange={e => updateExperience(exp.id, 'isCurrent', e.target.checked)} title="Current Job" /> Currently working here
                </label>
                <label htmlFor={`exp-desc-${index}`} className={cssStyles.label}>Description</label>
                <textarea id={`exp-desc-${index}`} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} className={cssStyles.input} style={{ height: '80px' }} placeholder="Job description and achievements" title="Work Description" />
                <button type="button" onClick={() => removeExperience(exp.id)} className={cssStyles.removeButton}>Remove Experience</button>
              </div>
            ))}
            <button type="button" onClick={addExperience} className={cssStyles.addButton}>Add Experience</button>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Education</h2>
            {formData.education.map((edu, index) => (
              <div key={edu.id} className={cssStyles.dynamicEntry}>
                <label htmlFor={`edu-inst-${index}`} className={cssStyles.label}>Institution</label>
                <input id={`edu-inst-${index}`} type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className={cssStyles.input} placeholder="University Name" title="Institution" />
                <label htmlFor={`edu-deg-${index}`} className={cssStyles.label}>Degree</label>
                <input id={`edu-deg-${index}`} type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className={cssStyles.input} placeholder="e.g. Bachelor of Science" title="Degree" />
                <label htmlFor={`edu-field-${index}`} className={cssStyles.label}>Field of Study</label>
                <input id={`edu-field-${index}`} type="text" value={edu.fieldOfStudy} onChange={e => updateEducation(edu.id, 'fieldOfStudy', e.target.value)} className={cssStyles.input} placeholder="e.g. Computer Science" title="Field of Study" />
                <label htmlFor={`edu-gpa-${index}`} className={cssStyles.label}>GPA</label>
                <input id={`edu-gpa-${index}`} type="text" value={edu.gpa} onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} className={cssStyles.input} placeholder="e.g. 3.8/4.0" title="GPA" />
                <label htmlFor={`edu-start-${index}`} className={cssStyles.label}>Start Date</label>
                <input id={`edu-start-${index}`} type="date" value={edu.startDate} onChange={e => updateEducation(edu.id, 'startDate', e.target.value)} className={cssStyles.input} title="Education Start Date" />
                <label htmlFor={`edu-end-${index}`} className={cssStyles.label}>End Date</label>
                <input id={`edu-end-${index}`} type="date" value={edu.endDate} onChange={e => updateEducation(edu.id, 'endDate', e.target.value)} className={cssStyles.input} title="Education End Date" />
                <button type="button" onClick={() => removeEducation(edu.id)} className={cssStyles.removeButton}>Remove Education</button>
              </div>
            ))}
            <button type="button" onClick={addEducation} className={cssStyles.addButton}>Add Education</button>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Projects</h2>
            {formData.projects.map((proj, index) => (
              <div key={proj.id} className={cssStyles.dynamicEntry}>
                <label htmlFor={`proj-title-${index}`} className={cssStyles.label}>Title</label>
                <input id={`proj-title-${index}`} type="text" value={proj.title} onChange={e => updateProject(proj.id, 'title', e.target.value)} className={cssStyles.input} placeholder="Project Name" title="Project Title" />
                <label htmlFor={`proj-desc-${index}`} className={cssStyles.label}>Description</label>
                <textarea id={`proj-desc-${index}`} value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} className={cssStyles.input} style={{ height: '80px' }} placeholder="What did you build?" title="Project Description" />
                <label htmlFor={`proj-link-${index}`} className={cssStyles.label}>Link</label>
                <input id={`proj-link-${index}`} type="text" value={proj.link} onChange={e => updateProject(proj.id, 'link', e.target.value)} className={cssStyles.input} placeholder="https://github.com/..." title="Project Link" />
                <label htmlFor={`proj-tech-${index}`} className={cssStyles.label}>Technologies (comma-separated)</label>
                <input id={`proj-tech-${index}`} type="text" value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} className={cssStyles.input} placeholder="React, Node.js, etc." title="Project Technologies" />
                <button type="button" onClick={() => removeProject(proj.id)} className={cssStyles.removeButton}>Remove Project</button>
              </div>
            ))}
            <button type="button" onClick={addProject} className={cssStyles.addButton}>Add Project</button>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Skills</h2>
            <label htmlFor="tech-skills" className={cssStyles.label}>Technical Skills (comma-separated)</label>
            <textarea id="tech-skills" value={formData.skills.technical} onChange={e => handleSkillChange(e, 'technical')} className={cssStyles.input} style={{ height: '80px' }} placeholder="e.g., Python, React, AWS, Docker" title="Technical Skills" />
            <label htmlFor="inter-skills" className={cssStyles.label}>Interpersonal Skills (comma-separated)</label>
            <textarea id="inter-skills" value={formData.skills.interpersonal} onChange={e => handleSkillChange(e, 'interpersonal')} className={cssStyles.input} style={{ height: '80px' }} placeholder="e.g., Communication, Teamwork, Leadership" title="Interpersonal Skills" />
            <label htmlFor="intra-skills" className={cssStyles.label}>Intrapersonal Skills (comma-separated)</label>
            <textarea id="intra-skills" value={formData.skills.intrapersonal} onChange={e => handleSkillChange(e, 'intrapersonal')} className={cssStyles.input} style={{ height: '80px' }} placeholder="e.g., Resilience, Adaptability, Self-motivation" title="Intrapersonal Skills" />
          </div>

          {/* Optional Sections */}
          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Achievements</h2>
            <label htmlFor="achievements" className={cssStyles.label}>List your Achievements</label>
            <textarea id="achievements" value={formData.achievements} onChange={e => handleGenericListChange(e, 'achievements')} className={cssStyles.input} style={{ height: '80px' }} placeholder="List your achievements, comma-separated" title="Achievements" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Certifications</h2>
            {formData.certifications.map((cert, index) => (
              <div key={cert.id} className={cssStyles.dynamicEntry}>
                <label htmlFor={`cert-name-${index}`} className={cssStyles.label}>Name</label>
                <input id={`cert-name-${index}`} type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} className={cssStyles.input} placeholder="Certification Name" title="Certification Name" />
                <label htmlFor={`cert-issuer-${index}`} className={cssStyles.label}>Issuer</label>
                <input id={`cert-issuer-${index}`} type="text" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)} className={cssStyles.input} placeholder="e.g. Google, AWS" title="Issuer" />
                <label htmlFor={`cert-issue-${index}`} className={cssStyles.label}>Issue Date</label>
                <input id={`cert-issue-${index}`} type="date" value={cert.issueDate} onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)} className={cssStyles.input} title="Certification Issue Date" />
                <label htmlFor={`cert-expiry-${index}`} className={cssStyles.label}>Expiry Date</label>
                <input id={`cert-expiry-${index}`} type="date" value={cert.expiryDate} onChange={e => updateCertification(cert.id, 'expiryDate', e.target.value)} className={cssStyles.input} title="Certification Expiry Date" />
                <button type="button" onClick={() => removeCertification(cert.id)} className={cssStyles.removeButton}>Remove Certification</button>
              </div>
            ))}
            <button type="button" onClick={addCertification} className={cssStyles.addButton}>Add Certification</button>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Volunteer Experience</h2>
            <label htmlFor="volunteer" className={cssStyles.label}>Volunteer Experience</label>
            <textarea id="volunteer" value={formData.volunteerExperience} onChange={e => handleGenericListChange(e, 'volunteerExperience')} className={cssStyles.input} style={{ height: '80px' }} placeholder="List your volunteer experiences, comma-separated" title="Volunteer Experience" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Extracurricular Activities</h2>
            <label htmlFor="extracurricular" className={cssStyles.label}>Extracurricular Activities</label>
            <textarea id="extracurricular" value={formData.extracurricularActivities} onChange={e => handleGenericListChange(e, 'extracurricularActivities')} className={cssStyles.input} style={{ height: '80px' }} placeholder="List your extracurricular activities, comma-separated" title="Extracurricular Activities" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Hobbies & Interests</h2>
            <label htmlFor="interests" className={cssStyles.label}>Hobbies & Interests</label>
            <textarea id="interests" value={formData.interests} onChange={e => handleGenericListChange(e, 'interests')} className={cssStyles.input} style={{ height: '80px' }} placeholder="List your hobbies and interests, comma-separated" title="Hobbies & Interests" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Languages Known</h2>
            {formData.languages.map((lang, index) => (
              <div key={lang.id} className={cssStyles.dynamicEntry}>
                <label htmlFor={`lang-name-${index}`} className={cssStyles.label}>Language</label>
                <input id={`lang-name-${index}`} type="text" value={lang.lang} onChange={e => updateLanguage(lang.id, 'lang', e.target.value)} className={cssStyles.input} placeholder="Language Name" title="Language" />
                <label htmlFor={`lang-level-${index}`} className={cssStyles.label}>Proficiency Level</label>
                <input id={`lang-level-${index}`} type="text" value={lang.level} onChange={e => updateLanguage(lang.id, 'level', e.target.value)} className={cssStyles.input} placeholder="e.g., Native, Fluent, Intermediate" title="Proficiency Level" />
                <button type="button" onClick={() => removeLanguage(lang.id)} className={cssStyles.removeButton}>Remove Language</button>
              </div>
            ))}
            <button type="button" onClick={addLanguage} className={cssStyles.addButton}>Add Language</button>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Social Links</h2>
            <label htmlFor="github" className={cssStyles.label}>GitHub Profile URL</label>
            <input id="github" type="text" name="github" value={formData.socialLinks.github} onChange={handleSocialLinkChange} className={cssStyles.input} placeholder="https://github.com/yourusername" />
            <label htmlFor="linkedin" className={cssStyles.label}>LinkedIn Profile URL</label>
            <input id="linkedin" type="text" name="linkedin" value={formData.socialLinks.linkedin} onChange={handleSocialLinkChange} className={cssStyles.input} placeholder="https://linkedin.com/in/yourusername" />
            <label htmlFor="leetcode" className={cssStyles.label}>LeetCode Profile URL</label>
            <input id="leetcode" type="text" name="leetcode" value={formData.socialLinks.leetcode} onChange={handleSocialLinkChange} className={cssStyles.input} placeholder="https://leetcode.com/yourusername" />
            <label htmlFor="portfolio" className={cssStyles.label}>Portfolio Website URL</label>
            <input id="portfolio" type="text" name="portfolio" value={formData.socialLinks.portfolio} onChange={handleSocialLinkChange} className={cssStyles.input} placeholder="https://yourportfolio.com" />
            <label htmlFor="other" className={cssStyles.label}>Other Social Link</label>
            <input id="other" type="text" name="other" value={formData.socialLinks.other} onChange={handleSocialLinkChange} className={cssStyles.input} placeholder="Any other relevant link" />
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Profile Photo (Placeholder)</h2>
            <p className={cssStyles.placeholderText}>File upload functionality for profile photo will be implemented later.</p>
          </div>

          <div className={cssStyles.section}>
            <h2 className={cssStyles.sectionTitle}>Recommendation Letters (Placeholder)</h2>
            <p className={cssStyles.placeholderText}>File upload functionality for recommendation letters will be implemented later.</p>
          </div>

          <div className={cssStyles.buttonContainer}>
            <button type="submit" className={cssStyles.submitButton} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Go to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingManual;