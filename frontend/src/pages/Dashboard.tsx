import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import cssStyles from './Dashboard.module.css';

interface PersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  about?: string;
  headline?: string;
  summary?: string;
  [key: string]: any;
}


interface Experience {
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  rationale?: string; // Phase 5 rationale
}

interface Education {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}


interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
  credentialId?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationUrl?: string;
  description?: string;
}

interface Project {
  title?: string;
  role?: string;
  technologies?: string[];
  description?: string;
  link?: string;
}


interface Internship {
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Volunteer {
  role?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ExtraCurricular {
  role?: string;
  title?: string; // Some parts of code use title
  organization?: string;
  description?: string;
}


interface Language {
  language?: string;
  proficiency?: string;
}

interface Recommendation {
  name?: string;
  relation?: string;
  organization?: string;
  position?: string;
  contact?: string;
  dateIssued?: string;
  description?: string;
  link?: string;
}

interface SkillSet {
  technical: string[];
  interpersonal: string[];
  intrapersonal: string[];
  [key: string]: string[] | undefined;
}


interface ERPData {
  personal?: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  skills?: SkillSet;
  certifications?: Certification[];
  internships?: Internship[];
  volunteer?: Volunteer[];
  extracurricular?: ExtraCurricular[];
  languages?: Language[];
  recommendations?: Recommendation[];
  socialLinks?: Record<string, string>;
  [key: string]: any;
}



interface ProfileMetadata {
  completeness?: {
    overall: number;
    sections: Record<string, number>;
  };
  last_updated?: string;
  version_count?: number;
}


interface Profile {
  user_info?: {
    full_name: string;
    email: string;
    profile_image?: string;
  };
  erp_data?: ERPData;
  meta?: ProfileMetadata;
}

interface AutomationLog {
  timestamp: string;
  level: string;
  message: string;
}

interface AssetBullet {
  original: string;
  optimized: string;
  rationale: string;
}

interface Assets {
  resume_assets?: {
    tailored_summary?: string;
    bullet_optimizations?: AssetBullet[];
  };
  cover_letter: string;
}

interface Analysis {
  job_info?: {
    title: string;
    company: string;
  };
  relevance?: {
    relevance_score: number;
    color: string;
    level: string;
    explanation: string;
    breakdown?: {
      skill_overlap: number;
      experience_alignment: number;
      contextual_fit: number;
    };
  };
  match_score?: number;
  skills_analysis?: {
    matching_skills: string[];
    missing_skills: { skill: string; rationale: string }[];
  };
  experience_alignment?: {
    score: number;
    feedback: string;
  };
  fit_analysis?: {
    strengths: string[];
    weaknesses: string[];
    risk_factors: string[];
    overall_sentiment: string;
    explicit_matches?: { skill: string; evidence: string; confidence: string }[];
    explicit_gaps?: string[];
    implied_gaps?: string[];
    explanation?: string;
  };

  improvement_plan?: {
    action_items: string[];
    recommended_reading: string[];
  };
}


interface Version {
  id: string;
  version_number: number;
  is_active: boolean;
  created_at: string;
  label?: string;
}


const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ERPData>({}); // Temp state for editing
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'linkedin' | 'resume' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [diffData, setDiffData] = useState<any>(null); // To store proposed changes for review
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [jdText, setJdText] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<Version[]>([]);
  const [assets, setAssets] = useState<Assets | null>(null);

  const [generatingAssets, setGeneratingAssets] = useState(false);
  const [automationTaskId, setAutomationTaskId] = useState<string | null>(null);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [automationStatus, setAutomationStatus] = useState<string>('');
  const [interactionRequired, setInteractionRequired] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/v1/profile/history');
      setHistory(response.data);
    } catch {
      console.error("Failed to fetch history");
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/v1/profile/me');
      setProfile(response.data);
      // Initialize editData with existing structure or defaults
      setEditData(response.data?.erp_data || {});
    } catch {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };
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
    { name: 'Social Links', icon: '🌐', key: 'socialLinks' },
    { name: 'Job Intelligence', icon: '🧠', key: 'jobAnalysis' },
    { name: 'Version History', icon: '📜', key: 'history' }
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
    setEditData(profile?.erp_data || {});
  };

  const handleAnalyzeJob = async () => {
    if (!jdText.trim()) return;
    setAnalyzing(true);
    try {
      const response = await api.post('/api/v1/ai/analyze-match', { jd_text: jdText });
      setAnalysis(response.data);
    } catch (error) {
      console.error("Match Analysis failed");
      alert("Analysis failed. Check your API key or JD text.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateAssets = async () => {
    if (!analysis) return;
    setGeneratingAssets(true);
    try {
      const response = await api.post('/api/v1/ai/generate-assets', { 
        jd_text: jdText,
        analysis_results: analysis
      });
      setAssets(response.data);
    } catch {
      console.error("Asset generation failed");
      alert("Failed to generate application assets. Check API key.");
    } finally {
      setGeneratingAssets(false);
    }
  };

  const handleStartAutomation = async (jobUrl: string) => {
    if (!jobUrl) return;
    try {
      const response = await api.post('/api/v1/automation/start', {
        job_url: jobUrl,
        erp_data: profile?.erp_data || {},
        assets: assets
      });
      setAutomationTaskId(response.data.task_id);
    } catch {
      console.error("Failed to start automation");
    }
  };

  const handleProvideInteraction = async (input: string) => {
    if (!automationTaskId) return;
    try {
      await api.post(`/api/v1/automation/interact/${automationTaskId}`, { response: input });
      setInteractionRequired(false);
    } catch {
      console.error("Failed to provide interaction");
    }
  };

  // Status Polling Effect
  useEffect(() => {
    let interval: any;
    if (automationTaskId && automationStatus !== 'COMPLETED' && automationStatus !== 'FAILED') {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/v1/automation/status/${automationTaskId}`);
          setAutomationStatus(res.data.status);
          setAutomationLogs(res.data.logs);
          setInteractionRequired(res.data.interaction_required);
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
          console.error("Status check failed");
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [automationTaskId, automationStatus]);

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
      alert('Profile updated successfully. Your changes have been saved.');
    } catch (error: any) {
      alert('Unable to save changes: ' + (error.response?.data?.detail || error.message));
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

  // Helper function to detect platform from URL
  const detectPlatform = (url: string): { name: string; icon: string } => {
    if (!url) return { name: 'Custom Link', icon: '🔗' };

    const urlLower = url.toLowerCase();

    // Social Media Platforms
    if (urlLower.includes('linkedin.com')) return { name: 'LinkedIn', icon: '💼' };
    if (urlLower.includes('github.com')) return { name: 'GitHub', icon: '🐙' };
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return { name: 'Twitter/X', icon: '🐦' };
    if (urlLower.includes('facebook.com')) return { name: 'Facebook', icon: '📘' };
    if (urlLower.includes('instagram.com')) return { name: 'Instagram', icon: '📷' };
    if (urlLower.includes('youtube.com')) return { name: 'YouTube', icon: '📺' };
    if (urlLower.includes('tiktok.com')) return { name: 'TikTok', icon: '🎵' };
    if (urlLower.includes('medium.com')) return { name: 'Medium', icon: '📝' };
    if (urlLower.includes('dev.to')) return { name: 'Dev.to', icon: '👨‍💻' };
    if (urlLower.includes('stackoverflow.com')) return { name: 'Stack Overflow', icon: '📚' };
    if (urlLower.includes('behance.net')) return { name: 'Behance', icon: '🎨' };
    if (urlLower.includes('dribbble.com')) return { name: 'Dribbble', icon: '🏀' };
    if (urlLower.includes('pinterest.com')) return { name: 'Pinterest', icon: '📌' };
    if (urlLower.includes('reddit.com')) return { name: 'Reddit', icon: '🤖' };
    if (urlLower.includes('discord.gg') || urlLower.includes('discord.com')) return { name: 'Discord', icon: '💬' };
    if (urlLower.includes('telegram.')) return { name: 'Telegram', icon: '✈️' };
    if (urlLower.includes('whatsapp.com')) return { name: 'WhatsApp', icon: '💚' };
    if (urlLower.includes('slack.com')) return { name: 'Slack', icon: '💼' };

    // Professional/Portfolio
    if (urlLower.includes('gitlab.com')) return { name: 'GitLab', icon: '🦊' };
    if (urlLower.includes('bitbucket.org')) return { name: 'Bitbucket', icon: '🪣' };
    if (urlLower.includes('codepen.io')) return { name: 'CodePen', icon: '✒️' };
    if (urlLower.includes('kaggle.com')) return { name: 'Kaggle', icon: '📊' };
    if (urlLower.includes('leetcode.com')) return { name: 'LeetCode', icon: '💻' };
    if (urlLower.includes('hackerrank.com')) return { name: 'HackerRank', icon: '🏆' };
    if (urlLower.includes('codeforces.com')) return { name: 'Codeforces', icon: '⚔️' };

    // Personal Website/Portfolio
    if (urlLower.includes('portfolio') || urlLower.includes('personal')) return { name: 'Portfolio', icon: '🌐' };
    if (urlLower.includes('blog')) return { name: 'Blog', icon: '✍️' };

    // Default
    return { name: 'Website', icon: '🔗' };
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
                <label htmlFor="fullName" style={{ ...styles.labelBlock, color: theme.text }}>Full Name</label>
                <input
                  id="fullName"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.fullName || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, fullName: e.target.value })}
                  title="Full Name"
                  placeholder="Enter your full name"
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="emailDisplay" style={{ ...styles.labelBlock, color: theme.text }}>Contact Email (Display)</label>
                <input
                  id="emailDisplay"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.email || profile?.user_info?.email || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, email: e.target.value })}
                  title="Contact Email"
                  placeholder="Enter contact email"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div style={styles.formGroup}>
                <label htmlFor="phone" style={{ ...styles.labelBlock, color: theme.text }}>Phone</label>
                <input
                  id="phone"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.phone || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  title="Phone Number"
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="location" style={{ ...styles.labelBlock, color: theme.text }}>Location</label>
                <input
                  id="location"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.location || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, location: e.target.value })}
                  placeholder="City, Country"
                  title="Location"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="headline" style={{ ...styles.labelBlock, color: theme.text }}>Headline</label>
              <input
                id="headline"
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                value={editData.personal?.headline || ''}
                onChange={(e) => updateEditData('personal', { ...editData.personal, headline: e.target.value })}
                title="Professional Headline"
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="summary" style={{ ...styles.labelBlock, color: theme.text }}>Professional Summary</label>
              <textarea
                id="summary"
                style={{ ...styles.textarea, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                value={editData.personal?.summary || ''}
                onChange={(e) => updateEditData('personal', { ...editData.personal, summary: e.target.value })}
                rows={6}
                title="Professional Summary"
                placeholder="Write a brief overview of your career..."
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
            {(editData.experience || []).map((exp: Experience, i: number) => (

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
            {(editData.education || []).map((edu: Education, i: number) => (

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
            {(editData.projects || []).map((proj: Project, i: number) => (

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
              onClick={() => addNewItem('certifications', { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', verificationUrl: '', description: '' })}
              style={styles.addBtn}
            >
              + Add Certification
            </button>
            {(editData.certifications || []).map((cert: Certification, i: number) => (

              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Cert #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('certifications', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <input
                  placeholder="Certification Name *"
                  style={{ ...styles.input, marginBottom: '8px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={cert.name || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'name', e.target.value)}
                />
                <div style={styles.grid2}>
                  <input
                    placeholder="Issuing Organization *"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.issuer || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'issuer', e.target.value)}
                  />
                  <input
                    placeholder="Credential ID"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.credentialId || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'credentialId', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Issue Date"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.issueDate || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'issueDate', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Expiry Date (if applicable)"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={cert.expiryDate || ''}
                    onChange={(e) => updateArrayItem('certifications', i, 'expiryDate', e.target.value)}
                  />
                </div>
                <input
                  placeholder="Verification URL (e.g., Credly, Coursera certificate link)"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={cert.verificationUrl || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'verificationUrl', e.target.value)}
                />
                <textarea
                  placeholder="Description/Skills Covered (Optional)"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={cert.description || ''}
                  onChange={(e) => updateArrayItem('certifications', i, 'description', e.target.value)}
                />
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
            {(editData.internships || []).map((intern: Internship, i: number) => (

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
            {(editData.volunteer || []).map((vol: Volunteer, i: number) => (

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
            {(editData.extracurricular || []).map((act: ExtraCurricular, i: number) => (

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
            {(editData.languages || []).map((lang: Language, i: number) => (

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
                    id={`proficiency-${i}`}
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={lang.proficiency || ''}
                    onChange={(e) => updateArrayItem('languages', i, 'proficiency', e.target.value)}
                    title="Language Proficiency"
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
              onClick={() => addNewItem('recommendations', { name: '', relation: '', organization: '', position: '', contact: '', dateIssued: '', description: '', link: '' })}
              style={styles.addBtn}
            >
              + Add Recommendation
            </button>
            {(editData.recommendations || []).map((rec: Recommendation, i: number) => (

              <div key={i} style={{ ...styles.editCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.editCardHeader}>
                  <h4 style={{ margin: 0, color: theme.textSecondary }}>Recommendation #{i + 1}</h4>
                  <button onClick={() => removeArrayItem('recommendations', i)} style={styles.removeBtn}>Remove</button>
                </div>
                <div style={styles.grid2}>
                  <input
                    placeholder="Recommender Name *"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.name || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'name', e.target.value)}
                  />
                  <input
                    placeholder="Relation (e.g., Professor, Manager) *"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.relation || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'relation', e.target.value)}
                  />
                  <input
                    placeholder="Organization/Institution *"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.organization || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'organization', e.target.value)}
                  />
                  <input
                    placeholder="Their Position/Title"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.position || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'position', e.target.value)}
                  />
                  <input
                    placeholder="Contact Info (Email/Phone)"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.contact || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'contact', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Date of Issue"
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                    value={rec.dateIssued || ''}
                    onChange={(e) => updateArrayItem('recommendations', i, 'dateIssued', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Description/Context (Optional - e.g., what they recommended you for)"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={rec.description || ''}
                  onChange={(e) => updateArrayItem('recommendations', i, 'description', e.target.value)}
                />
                <input
                  placeholder="Link to Letter (if available)"
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={rec.link || ''}
                  onChange={(e) => updateArrayItem('recommendations', i, 'link', e.target.value)}
                />
              </div>
            ))}
          </div>
        );

      case 'Social Links':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {Object.entries(editData.socialLinks || {}).map(([key, url]: [string, any]) => {
              const platform = detectPlatform(url);
              return (
                <div key={key} style={{ ...styles.formGroup, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{platform.icon}</span>
                    <label style={{ ...styles.labelBlock, color: theme.text, margin: 0, fontWeight: 600 }}>
                      {platform.name}
                    </label>
                    <button
                      onClick={() => {
                        const newLinks = { ...editData.socialLinks };
                        delete newLinks[key];
                        updateEditData('socialLinks', newLinks);
                      }}
                      style={{ marginLeft: 'auto', fontSize: '12px', background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, paddingLeft: '12px' }}
                    value={url || ''}
                    onChange={(e) => updateEditData('socialLinks', { ...(editData.socialLinks || {}), [key]: e.target.value })}
                    placeholder="Enter URL (e.g., https://linkedin.com/in/username)"
                  />
                </div>
              );
            })}
            <button
              onClick={() => updateEditData('socialLinks', { ...editData.socialLinks, ['link_' + Date.now()]: '' })}
              style={{ marginTop: '10px', fontSize: '14px', background: 'none', border: '1px dashed #d0d7de', color: '#0969da', cursor: 'pointer', padding: '10px', borderRadius: '6px', width: '100%', fontWeight: 600 }}
            >
              + Add Social Link
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
      case 'Overview': {
        const completeness = profile?.meta?.completeness || { overall: 0, sections: {} };
        const lastUpdated = profile?.meta?.last_updated ? new Date(profile.meta.last_updated).toLocaleString() : 'Never';
        
        return (
          <div style={styles.dashboardGrid}>
            {/* Completion Progress Card */}
            <div style={{ ...styles.wideCard, backgroundColor: theme.cardBg, borderColor: theme.border, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ ...styles.cardHeader, color: theme.textSecondary, margin: 0 }}>Career Identity Completion</h3>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#2da44e' }}>{completeness.overall}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: theme.bg, borderRadius: '6px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                <div style={{ width: `${completeness.overall}%`, height: '100%', backgroundColor: '#2da44e', transition: 'width 0.5s ease-out' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {Object.entries(completeness.sections).map(([name, val]: [string, number]) => (
                  <div key={name} style={{ fontSize: '12px' }}>
                    <div style={{ color: theme.textSecondary, textTransform: 'capitalize', marginBottom: '4px' }}>{name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ flex: 1, height: '4px', backgroundColor: theme.bg, borderRadius: '2px' }}>
                         <div style={{ width: `${val}%`, height: '100%', backgroundColor: val === 100 ? '#2da44e' : '#0969da', borderRadius: '2px' }} />
                       </div>
                       <span style={{ color: theme.text, fontWeight: 600 }}>{val}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...styles.statsCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>System Status</h3>
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '5px' }}>Last Audited:</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text }}>{lastUpdated}</div>
                <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '15px', marginBottom: '5px' }}>Version History:</div>
                <div style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#0969da1a', color: '#0969da', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                  {profile?.meta?.version_count || 0} Snapshot(s)
                </div>
              </div>
            </div>

            <div style={{ ...styles.statsCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Extracted Role</h3>
              <p style={styles.highlightText}>{erpData?.personal?.headline || erpData?.headline || 'Not set'}</p>
            </div>

            <div style={{ ...styles.wideCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary }}>Professional Summary</h3>
              <p style={{ ...styles.summaryText, color: theme.text }}>{erpData?.personal?.summary || erpData?.summary || 'No summary available.'}</p>
            </div>
          </div>
        );
      }

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
            {erpData?.experience && erpData.experience.length > 0 ? (
              erpData.experience.map((exp: Experience, i: number) => (

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
            {erpData?.education && erpData.education.length > 0 ? (

              erpData.education.map((edu: Education, i: number) => (
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
            {erpData?.projects && erpData.projects.length > 0 ? (

              erpData.projects.map((p: Project, i: number) => (

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
            {erpData?.certifications && erpData.certifications.length > 0 ? (

              erpData.certifications.map((c: Certification, i: number) => {

                const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                const isExpiringSoon = c.expiryDate && !isExpired && new Date(c.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <div style={styles.certLogoFallback}>📜</div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ ...styles.itemTitle, color: theme.text, margin: 0, marginBottom: '4px' }}>{c.name || 'Unnamed Certification'}</h3>
                            <div style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 500 }}>{c.issuer || 'Unknown Issuer'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
                          {c.credentialId && (
                            <div style={{ fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🆔</span> <strong>ID:</strong> {c.credentialId}
                            </div>
                          )}
                          {c.issueDate && (
                            <div style={{ fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>📅</span> <strong>Issued:</strong> {new Date(c.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            </div>
                          )}
                          {c.expiryDate && (
                            <div style={{
                              fontSize: '13px',
                              color: isExpired ? '#f85149' : isExpiringSoon ? '#d29922' : theme.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: isExpired || isExpiringSoon ? 600 : 400
                            }}>
                              <span>{isExpired ? '⚠️' : '⏰'}</span> <strong>Expires:</strong> {new Date(c.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                              {isExpired && <span style={{ marginLeft: '4px', fontSize: '11px', backgroundColor: '#f851491a', padding: '2px 6px', borderRadius: '4px' }}>EXPIRED</span>}
                              {isExpiringSoon && <span style={{ marginLeft: '4px', fontSize: '11px', backgroundColor: '#d299221a', padding: '2px 6px', borderRadius: '4px' }}>EXPIRING SOON</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {c.verificationUrl && (
                        <a href={c.verificationUrl} target="_blank" rel="noreferrer" style={{ ...styles.link, whiteSpace: 'nowrap', fontSize: '13px' }}>
                          Verify ↗
                        </a>
                      )}
                    </div>

                    {c.description && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: theme.bg, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills & Description</div>
                        <p style={{ fontSize: '13px', color: theme.text, margin: 0, lineHeight: '1.6' }}>{c.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : <EmptyState theme={theme} text="No certifications found." />}
          </div>
        );


      case 'Internships':
        return (
          <div style={styles.listContainer}>
            {erpData?.internships && erpData.internships.length > 0 ? (

              erpData.internships.map((intern: Internship, i: number) => (

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
            {erpData?.volunteer && erpData.volunteer.length > 0 ? (

              erpData.volunteer.map((vol: Volunteer, i: number) => (

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
            {erpData?.extracurricular && erpData.extracurricular.length > 0 ? (

              erpData.extracurricular.map((act: ExtraCurricular, i: number) => (

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
            {erpData?.languages && erpData.languages.length > 0 ? (

              erpData.languages.map((lang: Language, i: number) => (

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
            {erpData?.recommendations && erpData.recommendations.length > 0 ? (

              erpData.recommendations.map((rec: Recommendation, i: number) => (

                <div key={i} style={{ ...styles.listItem, backgroundColor: theme.cardBg, borderColor: theme.border, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ ...styles.itemTitle, color: theme.text, marginBottom: '8px' }}>{rec.name || 'Unnamed Recommender'}</h3>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {rec.relation && (
                          <span style={{ fontSize: '14px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>👤</span> {rec.relation}
                          </span>
                        )}
                        {rec.organization && (
                          <span style={{ fontSize: '14px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🏢</span> {rec.organization}
                          </span>
                        )}
                        {rec.position && (
                          <span style={{ fontSize: '14px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>💼</span> {rec.position}
                          </span>
                        )}
                      </div>
                      {rec.dateIssued && (
                        <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📅</span> Issued: {new Date(rec.dateIssued).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    {rec.link && (
                      <a href={rec.link} target="_blank" rel="noreferrer" style={{ ...styles.link, whiteSpace: 'nowrap' }}>
                        View Letter ↗
                      </a>
                    )}
                  </div>
                  {rec.description && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: theme.bg, borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>Description</div>
                      <p style={{ fontSize: '14px', color: theme.text, margin: 0, lineHeight: '1.6' }}>{rec.description}</p>
                    </div>
                  )}
                  {rec.contact && (
                    <div style={{ marginTop: '12px', fontSize: '13px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📧</span> Contact: {rec.contact}
                    </div>
                  )}
                </div>
              ))
            ) : <EmptyState theme={theme} text="No recommendations uploaded." />}
          </div>
        );

      case 'Social Links':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            {Object.entries(erpData?.socialLinks || {}).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(erpData.socialLinks)
                  .filter(([_, url]) => url) // Filter out empty URLs
                  .map(([k, v]: [string, any]) => {
                    const platform = detectPlatform(v);
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                        <span style={{ fontSize: '24px', flexShrink: 0 }}>{platform.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: theme.text, marginBottom: '4px' }}>
                            {platform.name}
                          </div>
                          <a
                            href={v}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              ...styles.link,
                              marginTop: 0,
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block'
                            }}
                          >
                            {v}
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : <EmptyState theme={theme} text="No social links found." />}
          </div>
        );

      case 'Job Intelligence':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
              <h3 style={{ ...styles.cardTitle, color: theme.text }}>Analyze Target Job</h3>
              <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '15px' }}>
                Paste a Job Description below to see how your career profile matches. We'll identify skills you have and gaps you need to fill.
              </p>
              <textarea 
                value={jdText}
                id="jdTextarea"
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description here..."
                title="Job Description Input"
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <button 
                onClick={handleAnalyzeJob}
                id="analyzeBtn"
                disabled={analyzing || !jdText.trim()}
                className={cssStyles.generateBtn}
                style={{ marginTop: '15px', width: '100%', opacity: analyzing ? 0.7 : 1 }}
              >
                {analyzing ? 'Analyzing semantic fit...' : '🔍 Perform Phase 4 Analysis'}
              </button>
            </div>

            {analysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Phase 5: Executive Relevance Scorecard */}
                <div style={{ 
                  ...styles.card, 
                  backgroundColor: theme.cardBg, 
                  borderColor: analysis.relevance?.color || theme.border,
                  borderWidth: '2px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: theme.textSecondary, fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Executive Relevance Score</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                        <div style={{ fontSize: '42px', fontWeight: 900, color: analysis.relevance?.color || '#2da44e' }}>
                          {analysis.relevance?.relevance_score ?? analysis.match_score}%
                        </div>
                        <div style={{ 
                          padding: '4px 12px', 
                          backgroundColor: (analysis.relevance?.color || '#2da44e') + '15', 
                          color: analysis.relevance?.color || '#2da44e', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          border: `1px solid ${(analysis.relevance?.color || '#2da44e')}33` 
                        }}>
                          {analysis.relevance?.level || 'ANALYZED'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: theme.text, fontWeight: 700, fontSize: '18px' }}>{analysis.job_info?.title}</div>
                      <div style={{ color: theme.textSecondary, fontSize: '14px' }}>{analysis.job_info?.company}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '25px', padding: '15px', backgroundColor: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: '5px', fontWeight: 600 }}>Skill Overlap</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: theme.text }}>{analysis.relevance?.breakdown?.skill_overlap ?? analysis.match_score}%</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: '10px', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: '5px', fontWeight: 600 }}>Exp Alignment</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: theme.text }}>{analysis.relevance?.breakdown?.experience_alignment ?? analysis.match_score}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: '5px', fontWeight: 600 }}>Contextual Fit</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: theme.text }}>{analysis.relevance?.breakdown?.contextual_fit ?? '100'}%</div>
                    </div>
                  </div>
                </div>

                {/* Fit Analysis */}
                <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                  <h3 style={{ ...styles.cardTitle, color: theme.text }}>Semantic Fit Analysis</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     <div>
                        <h4 style={{ color: '#2da44e', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span style={{ fontSize: '18px' }}>✅</span> Explicit Matches
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                           {analysis.fit_analysis?.explicit_matches?.map((m: any, i: number) => (
                             <div key={i} title={m.evidence} style={{ ...styles.tag, backgroundColor: '#2da44e1a', color: '#2da44e', borderColor: '#2da44e33', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {m.skill} <span style={{ fontSize: '10px', opacity: 0.7 }}>[{m.confidence}]</span>
                             </div>
                           )) || <span>No clear matches found.</span>}
                        </div>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                           <h4 style={{ color: '#cf222e', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '18px' }}>❌</span> Explicit Gaps
                           </h4>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {analysis.fit_analysis?.explicit_gaps?.map((g: string, i: number) => (
                                <span key={i} style={{ ...styles.tag, backgroundColor: '#cf222e1a', color: '#cf222e', borderColor: '#cf222e33' }}>{g}</span>
                              )) || <span>None identified.</span>}
                           </div>
                        </div>
                        <div>
                           <h4 style={{ color: '#d29922', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '18px' }}>🕵️</span> Implied Gaps
                           </h4>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {analysis.fit_analysis?.implied_gaps?.map((g: string, i: number) => (
                                <span key={i} style={{ ...styles.tag, backgroundColor: '#d299221a', color: '#d29922', borderColor: '#d2992233' }}>{g}</span>
                              ))}
                           </div>
                        </div>
                     </div>

                      <div style={{ marginTop: '10px', padding: '15px', backgroundColor: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}`, position: 'relative' }}>
                         <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: theme.cardBg, padding: '0 8px', fontSize: '11px', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase' }}>AI Explanation</div>
                         <p style={{ color: theme.text, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{analysis.fit_analysis?.explanation}</p>
                      </div>

                      {analysis.improvement_plan?.action_items && analysis.improvement_plan.action_items.length > 0 && (
                         <div style={{ marginTop: '5px' }}>
                            <h4 style={{ color: theme.text, fontSize: '14px', marginBottom: '10px' }}>🚀 Strategic Improvement Plan</h4>
                            <ul style={{ ...styles.ul, margin: 0, paddingLeft: '20px' }}>
                               {analysis.improvement_plan.action_items.map((item: string, i: number) => (
                                  <li key={i} style={{ ...styles.li, fontSize: '13px', color: theme.textSecondary, marginBottom: '6px' }}>{item}</li>
                               ))}
                            </ul>
                         </div>
                      )}
                   </div>
                </div>

                {/* Phase 6: Tailored Assets Section */}
                {!assets ? (
                   <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: '#0969da33', textAlign: 'center', padding: '30px' }}>
                      <h4 style={{ color: theme.text, marginBottom: '10px' }}>Ready to Apply?</h4>
                      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '20px' }}>
                         Based on your {analysis.relevance?.relevance_score}% match, we can generate a tailored resume summary and cover letter optimized for this role.
                      </p>
                      <button 
                        onClick={handleGenerateAssets}
                        className={cssStyles.generateBtn}
                        disabled={generatingAssets}
                        style={{ width: 'auto', padding: '12px 25px', backgroundColor: '#0969da' }}
                      >
                        {generatingAssets ? '✨ Engineering your documents...' : '✨ Generate Tailored Assets (Phase 6)'}
                      </button>
                   </div>
                ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Resume Optimizations */}
                      <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                         <h3 style={{ ...styles.cardTitle, color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>📄</span> Tailored Resume Assets
                         </h3>
                         
                         <div style={{ marginBottom: '25px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0969da', textTransform: 'uppercase', marginBottom: '8px' }}>Recommended Summary</div>
                            <div style={{ padding: '15px', backgroundColor: theme.bg, borderRadius: '8px', border: `1px dashed #0969da44`, color: theme.text, fontSize: '14px', lineHeight: '1.6' }}>
                               {(assets as Assets).resume_assets?.tailored_summary}
                            </div>
                         </div>

                         <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0969da', textTransform: 'uppercase', marginBottom: '8px' }}>Bullet Point Optimizations</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                               {(assets as Assets).resume_assets?.bullet_optimizations?.map((b: AssetBullet, i: number) => (
                                  <div key={i} style={{ padding: '15px', backgroundColor: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                                     <div style={{ fontSize: '11px', color: '#cf222e', textDecoration: 'line-through', marginBottom: '5px' }}>{b.original}</div>
                                     <div style={{ fontSize: '14px', color: '#2da44e', fontWeight: 500, marginBottom: '8px' }}>{b.optimized}</div>
                                     <div style={{ fontSize: '12px', color: theme.textSecondary, fontStyle: 'italic' }}>Reason: {b.rationale}</div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* Cover Letter */}
                      <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ ...styles.cardTitle, color: theme.text, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                               <span>✉️</span> Personalized Cover Letter
                            </h3>
                            <button 
                               onClick={() => navigator.clipboard.writeText(assets.cover_letter)}
                               style={{ ...styles.editBtn, width: 'auto', padding: '5px 12px', fontSize: '12px' }}
                            >
                               Copy to Clipboard
                            </button>
                         </div>
                         <textarea 
                            value={assets.cover_letter}
                            onChange={(e) => setAssets({...assets, cover_letter: e.target.value})}
                            style={{
                               width: '100%',
                               height: '400px',
                               padding: '20px',
                               backgroundColor: theme.bg,
                               color: theme.text,
                               border: `1px solid ${theme.border}`,
                               borderRadius: '8px',
                               fontSize: '14px',
                               lineHeight: '1.7',
                               fontFamily: 'serif',
                               resize: 'vertical'
                            }}
                         />
                         <div style={{ marginTop: '10px', fontSize: '12px', color: theme.textSecondary, textAlign: 'center' }}>
                            (You have full control to edit the letter above before using it in Phase 7)
                         </div>
                      </div>
                   </div>
                )}

                {assets && !automationTaskId && (
                    <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: '#2da44e33', textAlign: 'center', padding: '30px' }}>
                        <h4 style={{ color: theme.text, marginBottom: '10px' }}>Phase 7 & 8: Responsible Automation</h4>
                        <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '20px' }}>
                            Ready to submit? This system provides <strong>Human-in-the-Loop</strong> assistance to fill forms.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
                           <input 
                              type="text" 
                              placeholder="Direct Job Application URL..." 
                              title="Application URL"
                              aria-label="Application URL"
                              id="jobAppUrl"
                              style={{ padding: '10px', borderRadius: '5px', border: `1px solid ${theme.border}`, width: '300px', backgroundColor: theme.bg, color: theme.text }}
                           />
                           <button 
                              onClick={() => {
                                 const url = (document.getElementById('jobAppUrl') as HTMLInputElement).value;
                                 const consent = (document.getElementById('ethicsConsent') as HTMLInputElement).checked;
                                 if (!consent) {
                                    alert("Please accept the Automation Disclosure to proceed.");
                                    return;
                                 }
                                 if (url) handleStartAutomation(url);
                              }}
                              className={cssStyles.generateBtn}
                              style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#2da44e' }}
                           >
                              🚀 Start Assisted Submission
                           </button>
                        </div>

                        <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', fontSize: '12px', border: `1px solid ${theme.border}`, textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                           <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                              <input type="checkbox" id="ethicsConsent" style={{ marginTop: '3px' }} />
                              <span style={{ color: theme.textSecondary, lineHeight: '1.4' }}>
                                 <strong>Automation Disclosure:</strong> I acknowledge that this tool automates form-filling tasks on my behalf. I agree to monitor the "Automation Console" in real-time, handle manual interventions, and verify all data before final submission.
                              </span>
                           </label>
                        </div>
                    </div>
                )}

                {automationTaskId && (
                    <div style={{ ...styles.card, backgroundColor: '#0d1117', borderColor: '#30363d', padding: '0', overflow: 'hidden' }}>
                        {/* Terminal Header */}
                        <div style={{ backgroundColor: '#161b22', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d' }}>
                           <div style={{ display: 'flex', gap: '6px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                           </div>
                           <div style={{ fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>
                              {automationStatus === 'COMPLETED' ? 'SUCCESS: APPLICATION_SENT' : 
                               automationStatus === 'FAILED' ? 'CRITICAL: ENGINE_STOPPED' : 
                               'automation_engine_v1.sh — ACTIVE'}
                           </div>
                        </div>
                        
                        {/* Terminal Body */}
                        <div style={{ padding: '15px', height: '350px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', color: '#c9d1d9', lineHeight: '1.5' }}>
                           {automationLogs.map((log: any, i: number) => (
                              <div key={i} style={{ marginBottom: '4px' }}>
                                 <span style={{ color: '#8b949e' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                                 <span style={{ color: log.level === 'ERROR' ? '#ff7b72' : log.level === 'WARNING' ? '#d29922' : '#79c0ff' }}>{log.level}:</span>{' '}
                                 {log.message}
                              </div>
                           ))}
                           
                           {interactionRequired && (
                              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#d299221a', border: '1px solid #d2992233', borderRadius: '6px' }}>
                                 <div style={{ color: '#d29922', fontWeight: 600, marginBottom: '10px' }}>⚠️ ACTION REQUIRED: Manual Response Needed</div>
                                 <p style={{ fontSize: '12px', color: '#c9d1d9', marginBottom: '10px' }}>
                                    The automation engine encountered a custom field or unexpected interaction. Please enter the value below:
                                 </p>
                                 <input 
                                    type="text" 
                                    id="manualResponse"
                                    placeholder="Enter response..." 
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', marginBottom: '10px', borderRadius: '4px' }}
                                 />
                                 <button 
                                    onClick={() => {
                                       const val = (document.getElementById('manualResponse') as HTMLInputElement).value;
                                       handleProvideInteraction(val);
                                    }}
                                    style={{ padding: '8px 18px', backgroundColor: '#2da44e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                 >
                                    Submit & Continue
                                 </button>
                              </div>
                           )}
                           
                           <div ref={logsEndRef} />
                        </div>

                        {automationStatus === 'COMPLETED' && (
                           <div style={{ backgroundColor: '#23863622', padding: '15px', borderTop: '1px solid #23863644', textAlign: 'center' }}>
                              <span style={{ color: '#2da44e', fontWeight: 700 }}>✅ Application Process Finished Successfully!</span>
                              <button 
                                 onClick={() => { setAutomationTaskId(null); setAutomationLogs([]); setAutomationStatus(''); }}
                                 style={{ marginLeft: '15px', backgroundColor: 'transparent', border: '1px solid #2da44e', color: '#2da44e', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                 Dismiss Terminal
                              </button>
                           </div>
                        )}
                    </div>
                )}
              </div>
            )}


          </div>
        );

      case 'Version History':
        return (
          <div style={{ ...styles.card, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <h3 style={{ ...styles.cardTitle, color: theme.text }}>Profile Snapshots</h3>
            <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '15px' }}>
              Every time you finalize your profile, a permanent version is archived. You can review your career progression below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length > 0 ? history.map((v: Version) => (
                <div key={v.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px', 
                  backgroundColor: theme.bg, 
                  borderRadius: '10px', 
                  border: `1px solid ${v.is_active ? '#2da44e' : theme.border}`,
                  boxShadow: v.is_active ? '0 0 10px #2da44e1a' : 'none'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: theme.text }}>Version {v.version_number}</span>
                      {v.is_active && <span style={{ fontSize: '10px', backgroundColor: '#2da44e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '4px' }}>{new Date(v.created_at).toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary, fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.label}</div>
                  </div>
                  <button 
                    onClick={() => {
                        window.alert("Snapshot Details: Version " + v.version_number + " created on " + new Date(v.created_at).toLocaleDateString() + ". Full rollback and side-by-side diff will be active in the next production release.");
                    }}
                    className={cssStyles.editBtn}
                    style={{ width: 'auto', padding: '6px 15px', fontSize: '12px', height: 'auto' }}
                  >
                    View Details
                  </button>
                </div>
              )) : <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>No history found yet.</div>}
            </div>
          </div>
        );

      default:
        return <div style={{ color: theme.text }}>Section not implemented yet.</div>;
    }
  };

  return (
    <>
      <style>
        {`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .navLinks::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div
        className={cssStyles.container}
        style={{
          '--bg': theme.bg,
          '--sidebar-bg': theme.sidebarBg,
          '--sidebar-border': theme.sidebarBorder,
          '--header-bg': theme.headerBg,
          '--card-bg': theme.cardBg,
          '--input-bg': theme.inputBg,
          '--border': theme.border,
          '--text': theme.text,
          '--text-secondary': theme.textSecondary,
          '--tag-bg': theme.tagBg,
          '--tag-text': theme.tagText,
          '--tag-border': theme.tagBorder,
          '--nav-text': theme.navText,
          '--active-nav-bg': theme.activeNavBg,
          '--active-nav-text': theme.activeNavText,
        } as React.CSSProperties}
      >
        <nav className={cssStyles.sidebar}>
          <div className={cssStyles.brand}>SmartApply.AI</div>
          <div className={`${cssStyles.navLinks} navLinks`}>

            <div className={cssStyles.sectionHeader}>Profile</div>

            {sections.map(s => (
              <button
                key={s.name}
                onClick={() => {
                  if (isEditing && !window.confirm("You have unsaved changes. Switching sections will discard them. Continue?")) return;
                  setIsEditing(false); // Reset edit on switch
                  setActiveSection(s.name);
                }}
                className={`${cssStyles.navItem} ${activeSection === s.name ? cssStyles.navItemActive : ''}`}
              >
                <span style={{ marginRight: '10px' }}>{s.icon}</span> {s.name}
              </button>
            ))}

            <div className={cssStyles.sectionHeader} style={{ marginTop: '24px' }}>Settings</div>

            {/* Dark Mode Toggle */}
            <div className={cssStyles.navItem} style={{ justifyContent: 'space-between', cursor: 'default' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>🌙</span> Dark Mode
              </span>
              <button
                onClick={toggleTheme}
                title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={cssStyles.toggleBtn}
                style={{
                  backgroundColor: darkMode ? '#2da44e' : '#d0d7de',
                  justifyContent: darkMode ? 'flex-end' : 'flex-start'
                }}
              >
                <div className={cssStyles.toggleKnob} />
              </button>
            </div>

            <button
              onClick={() => alert("Password management will be available soon. Please contact support if you need immediate assistance.")}
              className={cssStyles.navItem}
            >
              <span style={{ marginRight: '10px' }}>🔒</span> Change Password
            </button>

            <button
              onClick={() => alert("Our support team is here to help. This feature will be available shortly.")}
              className={cssStyles.navItem}
            >
              <span style={{ marginRight: '10px' }}>❓</span> Help & Support
            </button>

          </div>

          <div className={cssStyles.sidebarFooter}>
            <button onClick={handleLogout} className={cssStyles.logoutBtn}>Logout</button>
          </div>
        </nav>

        <main className={cssStyles.main}>
          <header className={cssStyles.header}>
            <div className={cssStyles.userInfo}>
              {profile?.user_info?.profile_image ? (
                <img src={profile.user_info.profile_image} alt="User" className={cssStyles.avatar} />
              ) : (
                <div className={cssStyles.avatarPlaceholder}>{profile?.user_info?.full_name?.charAt(0) || 'U'}</div>
              )}
              <div>
                <h2 className={cssStyles.userName}>{profile?.user_info?.full_name || 'Professional'}</h2>
                <p className={cssStyles.userEmail}>{profile?.user_info?.email}</p>
              </div>
            </div>
            <div className={cssStyles.headerActions}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleImportClick('linkedin')}
                  disabled={uploading}
                  className={cssStyles.generateBtn} style={{ backgroundColor: '#0077b5', opacity: uploading ? 0.7 : 1 }}>
                  {uploading && importType === 'linkedin' ? '...' : '📥 LinkedIn PDF'}
                </button>
                <button
                  onClick={() => handleImportClick('resume')}
                  disabled={uploading}
                  className={cssStyles.generateBtn} style={{ backgroundColor: '#ea4335', opacity: uploading ? 0.7 : 1 }}>
                  {uploading && importType === 'resume' ? '...' : '📄 Resume PDF'}
                </button>
                <input
                  id="resumeImportFile"
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  title="Upload PDF"
                />
              </div>
            </div>
          </header>

          <section className={cssStyles.content}>
            <div className={cssStyles.topRow}>
              <h1 className={cssStyles.sectionTitle}>
                {isEditing ? `Editing ${activeSection}` : activeSection}
              </h1>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  disabled={activeSection === 'Overview'}
                  className={cssStyles.editBtn} style={{ opacity: activeSection === 'Overview' ? 0.5 : 1 }}>
                  ✏️ Edit Section
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={cancelEditing} className={cssStyles.editBtn} style={{ backgroundColor: 'transparent', borderColor: 'transparent', opacity: 0.7 }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} className={cssStyles.editBtn} style={{ backgroundColor: '#1f883d', color: 'white', borderColor: 'transparent' }}>
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
          <div className={cssStyles.modalOverlay}>
            <div className={cssStyles.modalContent}>
              <h2 style={{ borderBottom: `1px solid var(--border)`, paddingBottom: '10px' }}>Review Imports</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>The following changes will be applied to your profile. Sections not listed here remain unchanged.</p>

              <div className={cssStyles.diffContainer}>
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

              <div className={cssStyles.modalActions}>
                <button onClick={() => setShowDiffModal(false)} className={cssStyles.logoutBtn} style={{ width: 'auto', padding: '10px 20px', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={confirmMerge} className={cssStyles.generateBtn} style={{ backgroundColor: '#2da44e' }}>Confirm Update</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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
  sectionHeader: { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', padding: '0 12px' },
  navLinks: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE and Edge
    WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
  } as React.CSSProperties,
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
