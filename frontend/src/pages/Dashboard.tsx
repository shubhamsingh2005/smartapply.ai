import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({}); // Temp state for editing
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'linkedin' | 'resume' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [diffData, setDiffData] = useState<any>(null); // To store proposed changes for review
  const [showDiffModal, setShowDiffModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/v1/profile/me');
      setProfile(response.data);
      // Initialize editData with existing structure or defaults
      setEditData(response.data?.erp_data || {});
    } catch (error) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!profile?.erp_data) return 0;
    const data = profile.erp_data;
    let score = 0;

    // Weights (Total 100)
    const weights: any = {
      personal: 15, // Name, Headline, Summary
      experience: 25, // At least one job
      education: 15, // At least one degree
      skills: 15, // At least 3 technical skills
      projects: 15, // At least one project
      basicExtras: 15 // Languages, Hobbies, Certs (5 each)
    };

    // Personal Logic
    if (data.personal?.fullName && data.personal?.headline) score += weights.personal;

    // Core Sections logic
    if (data.experience?.length > 0) score += weights.experience;
    if (data.education?.length > 0) score += weights.education;
    if (data.projects?.length > 0) score += weights.projects;

    // Skills logic
    if (data.skills?.technical?.length >= 3) score += weights.skills;

    // Extras logic
    let extraScore = 0;
    if (data.languages?.length > 0) extraScore += 5;
    if (data.hobbies?.length > 0) extraScore += 5;
    if (data.certifications?.length > 0) extraScore += 5;
    score += Math.min(extraScore, weights.basicExtras);

    return score;
  };

  const completionPercentage = calculateCompletion();

  const sections = [
    { name: 'Overview', icon: '🏠' },
    { name: 'Personal Info', icon: '👤', key: 'personal' },
    { name: 'Education', icon: '🎓', key: 'education' },
    { name: 'Work Experience', icon: '💼', key: 'experience' },
    { name: 'Internships', icon: '💡', key: 'internships' },
    { name: 'Projects', icon: '🚀', key: 'projects' },
    { name: 'Technical Skills', icon: '🛠️', key: 'technical' },
    { name: 'Interpersonal Skills', icon: '🤝', key: 'interpersonal' },
    { name: 'Intrapersonal Skills', icon: '🧠', key: 'intrapersonal' },
    { name: 'Achievements', icon: '🏆', key: 'achievements' },
    { name: 'Certifications', icon: '📜', key: 'certifications' },
    { name: 'Volunteer Experience', icon: '🎗️', key: 'volunteer' },
    { name: 'Extracurricular', icon: '🎭', key: 'extracurricular' },
    { name: 'Hobbies & Interests', icon: '🎨', key: 'hobbies' },
    { name: 'Languages', icon: '🗣️', key: 'languages' },
    { name: 'Recommendation Letters', icon: '📝', key: 'recommendations' },
    { name: 'Social Links', icon: '🌐', key: 'socialLinks' }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const startEditing = () => {
    const currentData = JSON.parse(JSON.stringify(profile?.erp_data || {}));

    // Pre-fill Personal Info from User Account if missing in ERP Data
    if (!currentData.personal) currentData.personal = {};
    if (!currentData.personal.fullName && profile?.user_info?.full_name) {
      currentData.personal.fullName = profile.user_info.full_name;
    }

    // Ensure arrays exist to prevent map errors
    if (!currentData.experience) currentData.experience = [];
    if (!currentData.internships) currentData.internships = [];
    if (!currentData.education) currentData.education = [];
    if (!currentData.projects) currentData.projects = [];
    if (!currentData.skills) currentData.skills = { technical: [], interpersonal: [], intrapersonal: [] };
    if (!currentData.skills.intrapersonal) currentData.skills.intrapersonal = [];
    if (!currentData.certifications) currentData.certifications = [];
    if (!currentData.achievements) currentData.achievements = [];
    if (!currentData.volunteer) currentData.volunteer = [];
    if (!currentData.extracurricular) currentData.extracurricular = [];
    if (!currentData.hobbies) currentData.hobbies = [];
    if (!currentData.languages) currentData.languages = [];
    if (!currentData.recommendations) currentData.recommendations = [];
    if (!currentData.socialLinks) currentData.socialLinks = {};
    if (!currentData.personal.phone) currentData.personal.phone = '';
    if (!currentData.personal.location) currentData.personal.location = '';

    // Sync root level fields to personal if missing
    if (!currentData.personal.headline && currentData.headline) currentData.personal.headline = currentData.headline;
    if (!currentData.personal.summary && currentData.summary) currentData.personal.summary = currentData.summary;

    setEditData(currentData);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(profile?.erp_data || {});
  };

  const handleSave = async () => {
    try {
      // Sync back personal fields to root if needed by backend (optional, but keeps consistency)
      if (editData.personal) {
        if (editData.personal.headline) editData.headline = editData.personal.headline;
        if (editData.personal.summary) editData.summary = editData.personal.summary;
      }

      const updatedProfile = { ...profile, erp_data: editData };
      await api.put('/api/v1/profile/me', editData);
      setProfile(updatedProfile);
      setIsEditing(false);
      alert('Changes saved successfully!');
    } catch (error: any) {
      alert('Failed to save changes: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Helper to handle nested changes
  const updateEditData = (section: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [section]: value }));
  };

  // Helper for deeply nested updates (e.g., arrays)
  const updateArrayItem = (section: string, index: number, field: string, value: any) => {
    const list = [...(editData[section] || [])];
    if (!list[index]) list[index] = {};
    list[index][field] = value;
    updateEditData(section, list);
  };

  const handleImportClick = (type: 'linkedin' | 'resume') => {
    setImportType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importType) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = importType === 'linkedin' ? '/api/v1/profile/parse/linkedin' : '/api/v1/profile/parse/resume';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const parsedData = res.data;
      prepareDiff(parsedData);

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Import failed", error);
      alert("Failed to import data. Please ensure it is a valid PDF.");
    } finally {
      setUploading(false);
      setImportType(null);
    }
  };

  const prepareDiff = (newData: any) => {
    // Generate a simple diff object for visualization
    // We compare non-empty fields from newData against current editData
    const diff: any = {};

    // Personal Changes
    if (newData.personal) {
      const personalDiff: any = {};
      Object.entries(newData.personal).forEach(([k, v]) => {
        if (v && v !== editData.personal?.[k]) {
          personalDiff[k] = { old: editData.personal?.[k] || '(empty)', new: v };
        }
      });
      if (Object.keys(personalDiff).length > 0) diff.personal = personalDiff;
    }

    // Array Changes (Just show count/replacement notice)
    const arraySections = ['experience', 'education', 'projects', 'certifications', 'internships', 'volunteer', 'extracurricular', 'languages', 'recommendations'];
    arraySections.forEach(key => {
      if (newData[key] && Array.isArray(newData[key]) && newData[key].length > 0) {
        diff[key] = {
          countOld: editData[key]?.length || 0,
          countNew: newData[key].length,
          status: 'Replace'
        };
      }
    });

    // Skills
    if (newData.skills) {
      diff.skills = {};
      ['technical', 'interpersonal', 'intrapersonal'].forEach(cat => {
        if (newData.skills[cat]?.length > 0) {
          diff.skills[cat] = {
            countOld: editData.skills?.[cat]?.length || 0,
            countNew: newData.skills[cat].length,
            status: 'Replace'
          };
        }
      });
      if (Object.keys(diff.skills).length === 0) delete diff.skills;
    }

    if (Object.keys(diff).length === 0) {
      alert("No new data found to merge.");
      return;
    }

    setDiffData({ diff, rawNew: newData });
    setShowDiffModal(true);
  };

  const confirmMerge = () => {
    if (diffData?.rawNew) {
      mergeData(diffData.rawNew);
    }
    setShowDiffModal(false);
    setDiffData(null);
  };

  const mergeData = (newData: any) => {
    setEditData((prev: any) => {
      // Create a copy of current data, but we will overwrite sections present in newData
      const merged = JSON.parse(JSON.stringify(prev));

      // Personal - Overwrite with new fields if they exist
      if (newData.personal) {
        merged.personal = {
          ...merged.personal,
          ...Object.fromEntries(Object.entries(newData.personal).filter(([_, v]) => v))
        };
      }

      // Arrays - REPLACE (Overwrite entire list with new data if present)
      const arraySections = ['experience', 'education', 'projects', 'certifications', 'internships', 'volunteer', 'extracurricular', 'languages', 'recommendations'];
      arraySections.forEach(key => {
        if (newData[key] && Array.isArray(newData[key]) && newData[key].length > 0) {
          merged[key] = [...newData[key]]; // Completely replace existing list with new list
        }
      });

      // Skills - REPLACE
      if (newData.skills) {
        // Overwrite skill categories if new data has them
        const newSkills = newData.skills;
        if (!merged.skills) merged.skills = { technical: [], interpersonal: [], intrapersonal: [] };

        if (newSkills.technical && newSkills.technical.length > 0) merged.skills.technical = newSkills.technical;
        if (newSkills.interpersonal && newSkills.interpersonal.length > 0) merged.skills.interpersonal = newSkills.interpersonal;
        if (newSkills.intrapersonal && newSkills.intrapersonal.length > 0) merged.skills.intrapersonal = newSkills.intrapersonal;
      }

      // Social - Merge (Overwrite conflicting keys)
      if (newData.socialLinks) {
        if (!merged.socialLinks) merged.socialLinks = {};
        merged.socialLinks = { ...merged.socialLinks, ...newData.socialLinks };
      }

      // Hobbies - REPLACE
      if (newData.hobbies && newData.hobbies.length > 0) {
        merged.hobbies = newData.hobbies;
      }

      return merged;
    });
    setIsEditing(true);
  };

  const addNewItem = (section: string, template: any) => {
    const list = [...(editData[section] || [])];
    list.unshift(template);
    updateEditData(section, list);
  };

  const removeArrayItem = (section: string, index: number) => {
    const list = [...(editData[section] || [])];
    list.splice(index, 1);
    updateEditData(section, list);
  };

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) return (
    <div style={{ ...styles.loading, backgroundColor: theme.bg, color: theme.text }}>
      Loading your Career ERP...
    </div>
  );

  const renderEditContent = () => {
    switch (activeSection) {

      case 'Overview':
        return (
          <div style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
            Use the sidebar sections to edit specific details.
            <strong>Personal Info</strong> controls your Headline and Summary.
          </div>
        );

      case 'Personal Info':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.grid2}>
              <div style={styles.formGroup}>
                <label style={{ ...styles.labelBlock, color: theme.text }}>Full Name</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.fullName || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, fullName: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.labelBlock, color: theme.text }}>Contact Email (Display)</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.email || profile?.user_info?.email || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, email: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.formGroup}>
                <label style={{ ...styles.labelBlock, color: theme.text }}>Phone</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.phone || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={{ ...styles.labelBlock, color: theme.text }}>Location</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.location || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={{ ...styles.labelBlock, color: theme.text }}>Headline</label>
              <input
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                value={editData.personal?.headline || ''}
                onChange={(e) => updateEditData('personal', { ...editData.personal, headline: e.target.value })}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{ ...styles.labelBlock, color: theme.text }}>Professional Summary</label>
              <textarea
                style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                value={editData.personal?.summary || ''}
                onChange={(e) => updateEditData('personal', { ...editData.personal, summary: e.target.value })}
                rows={6}
              />
            </div>
          </div>
        );

      case 'Work Experience':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('experience', { role: '', company: '', startDate: '', endDate: '', description: '' })}
              style={styles.addBtn}
            >
              + Add Position
            </button>
            {(editData.experience || []).map((exp: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Position #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('experience', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Role / Job Title"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={exp.role || ''}
                    onChange={(e) => updateArrayItem('experience', i, 'role', e.target.value)}
                  />
                  <input
                    placeholder="Company"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={exp.company || ''}
                    onChange={(e) => updateArrayItem('experience', i, 'company', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Start Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={exp.startDate || ''}
                    onChange={(e) => updateArrayItem('experience', i, 'startDate', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="End Date (or Present)"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={exp.endDate || ''}
                    onChange={(e) => updateArrayItem('experience', i, 'endDate', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Description (Key achievements, responsibilities)"
                  style={{ ...styles.textarea, marginTop: '10px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={exp.description || ''}
                  onChange={(e) => updateArrayItem('experience', i, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case 'Education':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('education', { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' })}
              style={styles.addBtn}
            >
              + Add Education
            </button>
            {(editData.education || []).map((edu: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Education #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('education', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Institution / School"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={edu.institution || ''}
                    onChange={(e) => updateArrayItem('education', i, 'institution', e.target.value)}
                  />
                  <input
                    placeholder="Degree"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={edu.degree || ''}
                    onChange={(e) => updateArrayItem('education', i, 'degree', e.target.value)}
                  />
                  <input
                    placeholder="Field of Study"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => updateArrayItem('education', i, 'fieldOfStudy', e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Start Year"
                      style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                      value={edu.startDate || ''}
                      onChange={(e) => updateArrayItem('education', i, 'startDate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="End Year"
                      style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                      value={edu.endDate || ''}
                      onChange={(e) => updateArrayItem('education', i, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'Technical Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label style={{ ...styles.labelBlock, color: theme.text }}>Technical Skills (Comma separated)</label>
            <textarea
              style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              value={(editData.skills?.technical || []).join(', ')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                updateEditData('skills', { ...(editData.skills || {}), technical: skills });
              }}
              rows={4}
              placeholder="Java, React, Python, ..."
            />
          </div>
        );

      case 'Interpersonal Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label style={{ ...styles.labelBlock, color: theme.text }}>Interpersonal Skills (Comma separated)</label>
            <textarea
              style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              value={(editData.skills?.interpersonal || []).join(', ')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                updateEditData('skills', { ...(editData.skills || {}), interpersonal: skills });
              }}
              rows={4}
              placeholder="Communication, Leadership, ..."
            />
          </div>
        );

      case 'Intrapersonal Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label style={{ ...styles.labelBlock, color: theme.text }}>Intrapersonal Skills (Comma separated)</label>
            <textarea
              style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              value={(editData.skills?.intrapersonal || []).join(', ')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                updateEditData('skills', { ...(editData.skills || {}), intrapersonal: skills });
              }}
              rows={4}
              placeholder="Self-discipline, Adaptability, ..."
            />
          </div>
        );

      case 'Projects':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('projects', { title: '', description: '', link: '' })}
              style={styles.addBtn}
            >
              + Add Project
            </button>
            {(editData.projects || []).map((proj: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Project #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('projects', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <input
                  placeholder="Project Title"
                  style={{ ...styles.input, marginBottom: '8px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={proj.title || ''}
                  onChange={(e) => updateArrayItem('projects', i, 'title', e.target.value)}
                />
                <input
                  placeholder="Link (URL)"
                  style={{ ...styles.input, marginBottom: '8px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={proj.link || ''}
                  onChange={(e) => updateArrayItem('projects', i, 'link', e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={proj.description || ''}
                  onChange={(e) => updateArrayItem('projects', i, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case 'Achievements':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label style={{ ...styles.labelBlock, color: theme.text }}>Achievements (One per line)</label>
            <textarea
              style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              value={(editData.achievements || []).join('\n')}
              onChange={(e) => {
                const items = e.target.value.split('\n').filter(s => s.trim());
                updateEditData('achievements', items);
              }}
              rows={6}
              placeholder="Won 1st prize in Hackathon&#10;Dean's List 2024"
            />
          </div>
        );

      case 'Certifications':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('certifications', { name: '', issuer: '', date: '' })}
              style={styles.addBtn}
            >
              + Add Certification
            </button>
            {(editData.certifications || []).map((cert: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Cert #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('certifications', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <input
                  placeholder="Certification Name"
                  style={{ ...styles.input, marginBottom: '8px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={cert.name || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'name', e.target.value)}
                />
                <div style={styles.grid2}>
                  <input
                    placeholder="Issuer"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.issuer || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'issuer', e.target.value)}
                  />
                  <input
                    placeholder="Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.date || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'date', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'Internships':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('internships', { role: '', company: '', startDate: '', endDate: '', description: '' })}
              style={styles.addBtn}
            >
              + Add Internship
            </button>
            {(editData.internships || []).map((intern: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Internship #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('internships', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Role"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={intern.role || ''}
                    onChange={(e) => updateArrayItem('internships', i, 'role', e.target.value)}
                  />
                  <input
                    placeholder="Company"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={intern.company || ''}
                    onChange={(e) => updateArrayItem('internships', i, 'company', e.target.value)}
                  />
                  <input
                    placeholder="Start Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={intern.startDate || ''}
                    onChange={(e) => updateArrayItem('internships', i, 'startDate', e.target.value)}
                  />
                  <input
                    placeholder="End Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={intern.endDate || ''}
                    onChange={(e) => updateArrayItem('internships', i, 'endDate', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  style={{ ...styles.textarea, marginTop: '10px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={intern.description || ''}
                  onChange={(e) => updateArrayItem('internships', i, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case 'Volunteer Experience':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('volunteer', { role: '', organization: '', startDate: '', endDate: '', description: '' })}
              style={styles.addBtn}
            >
              + Add Volunteer Work
            </button>
            {(editData.volunteer || []).map((vol: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Volunteer #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('volunteer', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Role"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={vol.role || ''}
                    onChange={(e) => updateArrayItem('volunteer', i, 'role', e.target.value)}
                  />
                  <input
                    placeholder="Organization"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={vol.organization || ''}
                    onChange={(e) => updateArrayItem('volunteer', i, 'organization', e.target.value)}
                  />
                  <input
                    placeholder="Start Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={vol.startDate || ''}
                    onChange={(e) => updateArrayItem('volunteer', i, 'startDate', e.target.value)}
                  />
                  <input
                    placeholder="End Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={vol.endDate || ''}
                    onChange={(e) => updateArrayItem('volunteer', i, 'endDate', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Description"
                  style={{ ...styles.textarea, marginTop: '10px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={vol.description || ''}
                  onChange={(e) => updateArrayItem('volunteer', i, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case 'Extracurricular':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('extracurricular', { title: '', description: '' })}
              style={styles.addBtn}
            >
              + Add Activity
            </button>
            {(editData.extracurricular || []).map((act: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Activity #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('extracurricular', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <input
                  placeholder="Activity Title"
                  style={{ ...styles.input, marginBottom: '10px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={act.title || ''}
                  onChange={(e) => updateArrayItem('extracurricular', i, 'title', e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={act.description || ''}
                  onChange={(e) => updateArrayItem('extracurricular', i, 'description', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case 'Hobbies & Interests':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <label style={{ ...styles.labelBlock, color: theme.text }}>Hobbies (Comma separated)</label>
            <textarea
              style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
              value={(editData.hobbies || []).join(', ')}
              onChange={(e) => {
                const hobbies = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                updateEditData('hobbies', hobbies);
              }}
              rows={4}
              placeholder="Reading, Chess, Traveling"
            />
          </div>
        );

      case 'Languages':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('languages', { language: '', proficiency: '' })}
              style={styles.addBtn}
            >
              + Add Language
            </button>
            {(editData.languages || []).map((lang: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Language #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('languages', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Language"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={lang.language || ''}
                    onChange={(e) => updateArrayItem('languages', i, 'language', e.target.value)}
                  />
                  <select
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={lang.proficiency || ''}
                    onChange={(e) => updateArrayItem('languages', i, 'proficiency', e.target.value)}
                  >
                    <option value="">Select Proficiency</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Beginner">Beginner</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        );

      case 'Recommendation Letters':
        return (
          <div style={styles.listContainer}>
            <button
              onClick={() => addNewItem('recommendations', { name: '', relation: '', contact: '', link: '' })}
              style={styles.addBtn}
            >
              + Add Recommendation
            </button>
            {(editData.recommendations || []).map((rec: any, i: number) => (
              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Recommendation #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('recommendations', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Recommender Name"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.name || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'name', e.target.value)}
                  />
                  <input
                    placeholder="Relation (e.g., Manager)"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.relation || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'relation', e.target.value)}
                  />
                  <input
                    placeholder="Contact Info"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.contact || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'contact', e.target.value)}
                  />
                  <input
                    placeholder="Link to Letter (if applicable)"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.link || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'link', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'Social Links':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {Object.keys(editData.socialLinks || { linkedin: '', github: '', portfolio: '' }).map((key) => (
              <div key={key} style={styles.formGroup}>
                <label style={{ ...styles.labelBlock, color: theme.text, textTransform: 'capitalize' }}>{key}</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.socialLinks?.[key] || ''}
                  onChange={(e) => updateEditData('socialLinks', { ...(editData.socialLinks || {}), [key]: e.target.value })}
                  placeholder={`https://${key}.com/...`}
                />
              </div>
            ))}
            {/* Fallback add key if empty */}
            <button
              onClick={() => updateEditData('socialLinks', { ...editData.socialLinks, ['new_link_' + Date.now()]: '' })}
              style={{ marginTop: '10px', fontSize: '12px', background: 'none', border: 'none', color: '#0969da', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              + Add Custom Link
            </button>
          </div>
        );

      default:
        return <div>Edit mode not supported for this section yet.</div>;
    }
  };

  const renderContent = () => {
    // If editing, hijack the view
    if (isEditing) {
      return renderEditContent();
    }

    const erpData = profile?.erp_data || {};

    switch (activeSection) {
      case 'Overview':
        return (
          <div style={styles.dashboardGrid}>
            <div style={{ ...styles.statsCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Extracted Role</h3>
              <p style={styles.highlightText}>{erpData?.personal?.headline || erpData?.headline || 'Not set'}</p>
            </div>
            <div style={{ ...styles.statsCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Experience</h3>
              <p style={styles.highlightText}>{erpData?.experience?.length || 0} Positions</p>
            </div>
            <div style={{ ...styles.statsCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Skills</h3>
              <p style={styles.highlightText}>
                {(erpData?.skills?.technical?.length || 0) + (erpData?.skills?.interpersonal?.length || 0) + (erpData?.skills?.intrapersonal?.length || 0)} Parsed
              </p>
            </div>

            <div style={{ ...styles.wideCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Professional Summary</h3>
              <p style={{ ...styles.summaryText, color: theme.text }}>{erpData?.personal?.summary || erpData?.summary || 'No summary available.'}</p>
            </div>
          </div>
        );

      case 'Personal Info':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Full Name</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.fullName || profile?.user_info?.full_name}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Headline</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.headline || '-'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Email</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.email || profile?.user_info?.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Phone</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.phone || '-'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Location</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.location || '-'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={{ ...styles.label, color: theme.textSecondary }}>Summary</span>
              <span style={{ ...styles.value, color: theme.text }}>{erpData?.personal?.summary || '-'}</span>
            </div>
          </div>
        );

      case 'Work Experience':
        return (
          <div style={styles.listContainer}>
            {erpData?.experience?.length > 0 ? (
              erpData.experience.map((exp: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.companyLogoFallback}>🏢</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{exp.role}</h3>
                      <div style={{ ...styles.itemSubtitle, color: theme.textSecondary }}>{exp.company}</div>
                      <div style={{ ...styles.itemDate, color: theme.textSecondary }}>
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </div>
                    </div>
                  </div>
                  <p style={{ ...styles.itemDescription, color: theme.text }}>{exp.description}</p>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No work experience found." />}
          </div>
        );

      case 'Education':
        return (
          <div style={styles.listContainer}>
            {erpData?.education?.length > 0 ? (
              erpData.education.map((edu: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.schoolLogoFallback}>🎓</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{edu.institution}</h3>
                      <div style={{ ...styles.itemSubtitle, color: theme.textSecondary }}>{edu.degree}, {edu.fieldOfStudy}</div>
                      <div style={{ ...styles.itemDate, color: theme.textSecondary }}>
                        {edu.startDate} - {edu.endDate}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No education found." />}
          </div>
        );

      case 'Technical Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 style={{ ...styles.cardTitle, color: theme.text }}>Technical Skills</h3>
            <div style={styles.tagCloud}>
              {erpData?.skills?.technical?.map((s: string, i: number) => (
                <span key={i} style={{ ...styles.tag, backgroundColor: theme.tagBg, color: theme.tagText, borderColor: theme.tagBorder }}>
                  {s}
                </span>
              )) || <EmptyState theme={theme} text="No technical skills." />}
            </div>
          </div>
        );

      case 'Interpersonal Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 style={{ ...styles.cardTitle, color: theme.text }}>Interpersonal Skills</h3>
            <div style={styles.tagCloud}>
              {erpData?.skills?.interpersonal?.map((s: string, i: number) => (
                <span key={i} style={{ ...styles.tag, backgroundColor: theme.tagBg, color: theme.tagText, borderColor: theme.tagBorder }}>
                  {s}
                </span>
              )) || <EmptyState theme={theme} text="No interpersonal skills." />}
            </div>
          </div>
        );

      case 'Intrapersonal Skills':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 style={{ ...styles.cardTitle, color: theme.text }}>Intrapersonal Skills</h3>
            <div style={styles.tagCloud}>
              {erpData?.skills?.intrapersonal?.map((s: string, i: number) => (
                <span key={i} style={{ ...styles.tag, backgroundColor: theme.tagBg, color: theme.tagText, borderColor: theme.tagBorder }}>
                  {s}
                </span>
              )) || <EmptyState theme={theme} text="No intrapersonal skills." />}
            </div>
          </div>
        );

      case 'Projects':
        return (
          <div style={styles.listContainer}>
            {erpData?.projects?.length > 0 ? (
              erpData.projects.map((p: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.projectLogoFallback}>🚀</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{p.title}</h3>
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer" style={styles.link}>
                          View Project ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <p style={{ ...styles.itemDescription, color: theme.text }}>{p.description}</p>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No projects found." />}
          </div>
        );

      case 'Achievements':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <ul style={{ ...styles.ul, color: theme.text }}>
              {erpData?.achievements?.map((a: string, i: number) => (
                <li key={i} style={styles.li}>{a}</li>
              )) || <li style={styles.li}>No achievements listed.</li>}
            </ul>
          </div>
        );

      case 'Certifications':
        return (
          <div style={styles.listContainer}>
            {erpData?.certifications?.length > 0 ? (
              erpData.certifications.map((c: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.certLogoFallback}>📜</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{c.name}</h3>
                      <div style={{ ...styles.itemSubtitle, color: theme.textSecondary }}>{c.issuer} • {c.date}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No certifications found." />}
          </div>
        );


      case 'Internships':
        return (
          <div style={styles.listContainer}>
            {erpData?.internships?.length > 0 ? (
              erpData.internships.map((intern: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.companyLogoFallback}>💡</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{intern.role}</h3>
                      <div style={{ ...styles.itemSubtitle, color: theme.textSecondary }}>{intern.company}</div>
                      <div style={{ ...styles.itemDate, color: theme.textSecondary }}>
                        {intern.startDate} - {intern.endDate}
                      </div>
                    </div>
                  </div>
                  <p style={{ ...styles.itemDescription, color: theme.text }}>{intern.description}</p>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No internships found." />}
          </div>
        );

      case 'Volunteer Experience':
        return (
          <div style={styles.listContainer}>
            {erpData?.volunteer?.length > 0 ? (
              erpData.volunteer.map((vol: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.itemHeader}>
                    <div style={styles.companyLogoFallback}>🎗️</div>
                    <div>
                      <h3 style={{ ...styles.itemTitle, color: theme.text }}>{vol.role}</h3>
                      <div style={{ ...styles.itemSubtitle, color: theme.textSecondary }}>{vol.organization}</div>
                      <div style={{ ...styles.itemDate, color: theme.textSecondary }}>
                        {vol.startDate} - {vol.endDate}
                      </div>
                    </div>
                  </div>
                  <p style={{ ...styles.itemDescription, color: theme.text }}>{vol.description}</p>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No volunteer experience found." />}
          </div>
        );

      case 'Extracurricular':
        return (
          <div style={styles.listContainer}>
            {erpData?.extracurricular?.length > 0 ? (
              erpData.extracurricular.map((act: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <h3 style={{ ...styles.itemTitle, color: theme.text }}>{act.title}</h3>
                  <p style={{ ...styles.itemDescription, color: theme.text }}>{act.description}</p>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No extracurricular activities found." />}
          </div>
        );

      case 'Hobbies & Interests':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.tagCloud}>
              {erpData?.hobbies?.map((s: string, i: number) => (
                <span key={i} style={{ ...styles.tag, backgroundColor: theme.tagBg, color: theme.tagText, borderColor: theme.tagBorder }}>
                  {s}
                </span>
              )) || <EmptyState theme={theme} text="No hobbies listed." />}
            </div>
          </div>
        );

      case 'Languages':
        return (
          <div style={styles.listContainer}>
            {erpData?.languages?.length > 0 ? (
              erpData.languages.map((lang: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <span style={{ fontWeight: 600, color: theme.text }}>{lang.language}</span>
                  <span style={{ color: theme.textSecondary, fontSize: '14px' }}>{lang.proficiency}</span>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No languages listed." />}
          </div>
        );

      case 'Recommendation Letters':
        return (
          <div style={styles.listContainer}>
            {erpData?.recommendations?.length > 0 ? (
              erpData.recommendations.map((rec: any, i: number) => (
                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ ...styles.itemTitle, color: theme.text }}>{rec.name}</h3>
                    {rec.url && <a href={rec.url} target="_blank" rel="noreferrer" style={styles.link}>View Document ↗</a>}
                  </div>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No recommendations uploaded." />}
          </div>
        );

      case 'Social Links':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {Object.entries(erpData?.socialLinks || {}).length > 0 ? (
              Object.entries(erpData.socialLinks).map(([k, v]: [string, any]) => (
                <div key={k} style={styles.infoRow}>
                  <span style={{ ...styles.label, textTransform: 'capitalize', color: theme.textSecondary }}>{k}</span>
                  <a href={v} target="_blank" rel="noreferrer" style={{ ...styles.link, marginTop: 0 }}>{v}</a>
                </div>
              ))
            ) : <EmptyState theme={theme} text="No social links found." />}
          </div>
        );

      default:
        return <div style={{ color: theme.text }}>Section not implemented yet.</div>;
    }
  };

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg }}>
      <nav style={{ ...styles.sidebar, backgroundColor: theme.sidebarBg, borderColor: theme.sidebarBorder }}>
        <div style={styles.brand}>SmartApply.AI</div>
        <div style={styles.navLinks}>
          {sections.map(s => (
            <button
              key={s.name}
              onClick={() => {
                if (isEditing && !window.confirm("Switching sections will lose unsaved changes. Continue?")) return;
                setIsEditing(false); // Reset edit on switch
                setActiveSection(s.name);
              }}
              style={{
                ...styles.navItem,
                backgroundColor: activeSection === s.name ? theme.activeNavBg : 'transparent',
                color: activeSection === s.name ? theme.activeNavText : theme.navText
              }}
            >
              <span style={{ marginRight: '10px' }}>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.themeToggle}>
            <span style={{ color: theme.navText, fontSize: '14px' }}>Dark Mode</span>
            <button
              onClick={toggleTheme}
              style={{
                ...styles.toggleBtn,
                backgroundColor: darkMode ? '#2da44e' : '#d0d7de',
                justifyContent: darkMode ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={styles.toggleKnob} />
            </button>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </nav>

      <main style={styles.main}>
        <header style={{ ...styles.header, backgroundColor: theme.headerBg, borderColor: theme.border }}>
          <div style={styles.userInfo}>
            {profile?.user_info?.profile_image ? (
              <img src={profile.user_info.profile_image} alt="User" style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>{profile?.user_info?.full_name?.charAt(0) || 'U'}</div>
            )}
            <div>
              <h2 style={{ ...styles.userName, color: theme.text }}>{profile?.user_info?.full_name || 'Professional'}</h2>
              <p style={{ ...styles.userEmail, color: theme.textSecondary }}>{profile?.user_info?.email}</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.completionCard}>
              <div style={{ ...styles.completionLabel, color: theme.textSecondary }}>
                ERP Readiness <span style={{ marginLeft: 'auto', color: '#2da44e' }}>{completionPercentage}%</span>
              </div>
              <div style={styles.progressBar}><div style={{ ...styles.progress, width: `${completionPercentage}%` }}></div></div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleImportClick('linkedin')}
                disabled={uploading}
                style={{ ...styles.generateBtn, backgroundColor: '#0077b5', opacity: uploading ? 0.7 : 1 }}>
                {uploading && importType === 'linkedin' ? '...' : '📥 LinkedIn PDF'}
              </button>
              <button
                onClick={() => handleImportClick('resume')}
                disabled={uploading}
                style={{ ...styles.generateBtn, backgroundColor: '#ea4335', opacity: uploading ? 0.7 : 1 }}>
                {uploading && importType === 'resume' ? '...' : '📄 Resume PDF'}
              </button>
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>
        </header>

        <section style={styles.content}>
          <div style={styles.topRow}>
            <h1 style={{ ...styles.sectionTitle, color: theme.text }}>
              {isEditing ? `Editing ${activeSection}` : activeSection}
            </h1>
            {!isEditing ? (
              <button
                onClick={startEditing}
                disabled={activeSection === 'Overview'}
                style={{ ...styles.editBtn, backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border, opacity: activeSection === 'Overview' ? 0.5 : 1 }}>
                ✏️ Edit Section
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={cancelEditing} style={{ ...styles.editBtn, backgroundColor: 'transparent', color: theme.textSecondary, borderColor: 'transparent' }}>
                  Cancel
                </button>
                <button onClick={handleSave} style={{ ...styles.editBtn, backgroundColor: '#1f883d', color: 'white', borderColor: 'transparent' }}>
                  Save Changes
                </button>
              </div>
            )}

          </div>

          {renderContent()}
        </section>
      </main>

      {/* Diff Review Modal */}
      {showDiffModal && diffData && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, backgroundColor: theme.cardBg, color: theme.text }}>
            <h2 style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '10px' }}>Review Imports</h2>
            <p style={{ fontSize: '14px', color: theme.textSecondary }}>The following changes will be applied to your profile. Sections not listed here remain unchanged.</p>

            <div style={styles.diffContainer}>
              {Object.entries(diffData.diff).map(([key, changes]: [string, any]) => (
                <div key={key} style={{ marginBottom: '15px' }}>
                  <h3 style={{ textTransform: 'capitalize', color: '#0969da', fontSize: '16px', margin: '0 0 5px 0' }}>{key} Changes</h3>

                  {/* Personal Field Diffs */}
                  {key === 'personal' && Object.entries(changes).map(([field, val]: [string, any]) => (
                    <div key={field} style={{ display: 'flex', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, width: '100px' }}>{field}:</span>
                      <span style={{ color: '#f85149', textDecoration: 'line-through', marginRight: '10px' }}>{val.old}</span>
                      →
                      <span style={{ color: '#2da44e', marginLeft: '10px', fontWeight: 600 }}>{val.new}</span>
                    </div>
                  ))}

                  {/* Array/List Diffs */}
                  {['experience', 'education', 'projects', 'certifications', 'internships', 'volunteer', 'extracurricular', 'languages', 'recommendations'].includes(key) && (
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ marginBottom: '4px' }}>Status: <span style={{ color: '#d29922', fontWeight: 600 }}>REPLACE ENTIRE LIST</span></div>
                      <div>Old items: {changes.countOld}</div>
                      <div>New items: <span style={{ color: '#2da44e', fontWeight: 600 }}>{changes.countNew}</span></div>
                    </div>
                  )}

                  {/* Skill Diffs */}
                  {key === 'skills' && Object.entries(changes).map(([cat, val]: [string, any]) => (
                    <div key={cat} style={{ fontSize: '13px', marginLeft: '10px', marginTop: '5px' }}>
                      <strong>{cat} Skills:</strong> Replace {val.countOld} items with <span style={{ color: '#2da44e' }}>{val.countNew} items</span>.
                    </div>
                  ))}

                  {/* Hobbies Diffs */}
                  {key === 'hobbies' && (
                    <div style={{ fontSize: '13px' }}>
                      <div>Old: {changes.countOld} tags</div>
                      <div>New: <span style={{ color: '#2da44e' }}>{changes.countNew} tags</span> (Replaced)</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowDiffModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={confirmMerge} style={styles.saveBtn}>Confirm Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ theme, text }: { theme: any, text: string }) => (
  <div style={{ padding: '20px', textAlign: 'center', color: theme.textSecondary, fontStyle: 'italic' }}>
    {text}
  </div>
);

// Theme Definitions
const lightTheme = {
  bg: '#f6f8fa',
  sidebarBg: '#0d1117',
  sidebarBorder: '#30363d',
  headerBg: '#ffffff',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
  border: '#d0d7de',
  text: '#1f2328',
  textSecondary: '#636c76',
  navText: '#8b949e',
  activeNavBg: '#1f2328',
  activeNavText: '#ffffff',
  tagBg: '#f0f7ff',
  tagText: '#0969da',
  tagBorder: 'rgba(9, 105, 218, 0.2)'
};

const darkTheme = {
  bg: '#0d1117',
  sidebarBg: '#161b22',
  sidebarBorder: '#30363d',
  headerBg: '#010409',
  cardBg: '#161b22',
  inputBg: '#0d1117',
  border: '#30363d',
  text: '#ffffff',
  textSecondary: '#8b949e',
  navText: '#8b949e',
  activeNavBg: '#30363d',
  activeNavText: '#ffffff',
  tagBg: 'rgba(56, 139, 253, 0.1)',
  tagText: '#58a6ff',
  tagBorder: 'rgba(56, 139, 253, 0.4)'
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' },
  loading: { height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600 },
  sidebar: { width: '280px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid', flexShrink: 0 },
  brand: { color: '#ffffff', fontSize: '22px', fontWeight: 800, marginBottom: '32px', letterSpacing: '-0.5px' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' },
  navItem: { border: 'none', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', transition: '0.2s', fontWeight: 500, display: 'flex', alignItems: 'center' },
  sidebarFooter: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  logoutBtn: { backgroundColor: 'transparent', color: '#f85149', border: '1px solid #f85149', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%' },
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' },
  toggleBtn: { width: '40px', height: '22px', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', transition: 'background-color 0.3s' },
  toggleKnob: { width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  header: { padding: '20px 40px', borderBottom: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', border: '1px solid #d0d7de' },
  avatarPlaceholder: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#0969da', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px' },
  userName: { margin: 0, fontSize: '18px', fontWeight: 700 },
  userEmail: { margin: 0, fontSize: '13px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '24px' },
  completionCard: { width: '150px' },
  completionLabel: { fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' },
  progressBar: { height: '6px', backgroundColor: '#ebedf0', borderRadius: '3px' },
  progress: { height: '100%', backgroundColor: '#2da44e', borderRadius: '3px' },
  generateBtn: { backgroundColor: '#0969da', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
  content: { padding: '40px', maxWidth: '1000px', margin: '0 auto', width: '100%' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  sectionTitle: { fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-1px' },
  editBtn: { padding: '10px 20px', border: '1px solid', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  statsCard: { border: '1px solid', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', textTransform: 'uppercase' },
  highlightText: { fontSize: '24px', fontWeight: 700, color: '#0969da', margin: '0' },
  wideCard: { gridColumn: 'span 3', border: '1px solid', borderRadius: '12px', padding: '24px' },
  summaryText: { lineHeight: '1.6', fontSize: '16px' },
  card: { border: '1px solid', borderRadius: '12px', padding: '24px', marginBottom: '16px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700 },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(130,130,130,0.1)' },
  label: { fontWeight: 600, width: '200px' },
  labelBlock: { display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' },
  value: { flex: 1 },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  listItem: { padding: '24px', border: '1px solid', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  itemHeader: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  companyLogoFallback: { width: '48px', height: '48px', backgroundColor: '#f0f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  schoolLogoFallback: { width: '48px', height: '48px', backgroundColor: '#fff8c5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  projectLogoFallback: { width: '48px', height: '48px', backgroundColor: '#ffebe9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  certLogoFallback: { width: '48px', height: '48px', backgroundColor: '#dafbe1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  itemTitle: { margin: 0, fontSize: '18px', fontWeight: 700 },
  itemSubtitle: { margin: '4px 0 0 0', fontSize: '15px' },
  itemDate: { fontSize: '13px', marginTop: '4px' },
  itemDescription: { margin: '8px 0 0 0', fontSize: '14px', lineHeight: '1.5' },
  tagCloud: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { padding: '6px 14px', border: '1px solid', borderRadius: '20px', fontSize: '14px', fontWeight: 500 },
  link: { color: '#0969da', textDecoration: 'none', fontSize: '14px', fontWeight: 600, marginTop: '8px', display: 'inline-block' },
  ul: { paddingLeft: '20px', margin: 0 },
  li: { marginBottom: '8px', fontSize: '15px' },
  // Edit Specific Styles
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid', fontSize: '14px', outline: 'none' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid', fontSize: '14px', outline: 'none', resize: 'vertical' as 'vertical' },
  formGroup: { marginBottom: '20px' },
  editCard: { padding: '20px', border: '1px solid', borderRadius: '12px', marginBottom: '16px' },
  editCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '10px' },
  removeBtn: { fontSize: '13px', color: '#f85149', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 },
  addBtn: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed #d0d7de', backgroundColor: 'transparent', color: '#0969da', cursor: 'pointer', fontWeight: 600, marginBottom: '20px' },

  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '500px', maxHeight: '80vh', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
  diffContainer: { flex: 1, overflowY: 'auto', margin: '20px 0', paddingRight: '10px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(100,100,100,0.1)' }
};

export default Dashboard;
