import React from 'react';
import { useProfileStore } from '../../stores/useProfileStore';

interface ProfileModuleProps {
  activeSection: string;
  isEditing: boolean;
  editData: any;
  updateEditData: (field: string, value: any) => void;
  updateArrayItem: (field: string, index: number, subfield: string, value: any) => void;
  removeArrayItem: (field: string, index: number) => void;
  addNewItem: (field: string, template: any) => void;
  theme: any;
  styles: any;
  cssStyles: any;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  activeSection, isEditing, editData, updateEditData, 
  updateArrayItem, removeArrayItem, addNewItem, theme, styles, cssStyles
}) => {
  const { profile } = useProfileStore();

  if (isEditing) {
    // Render Edit Content
    switch (activeSection) {
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
                <label style={{ ...styles.labelBlock, color: theme.text }}>Headline</label>
                <input
                  style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }}
                  value={editData.personal?.headline || ''}
                  onChange={(e) => updateEditData('personal', { ...editData.personal, headline: e.target.value })}
                />
              </div>
            </div>
            {/* Add more Personal Info fields as needed */}
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

      // Other cases follow similar logic moved from Dashboard.tsx
      default:
        return <div style={{ color: theme.text }}>Edit mode for {activeSection} coming soon to this module.</div>;
    }
  }

  // Render View Content
  const erpData = profile?.erp_data || {};
  switch (activeSection) {
    case 'Overview':
      const completeness = profile?.meta?.completeness || { overall: 0, sections: {} };
      return (
        <div style={styles.dashboardGrid}>
          <div style={{ ...styles.wideCard, backgroundColor: theme.cardBg, borderColor: theme.border, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ ...styles.cardHeader, color: theme.textSecondary, margin: 0 }}>Career Identity Completion</h3>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#2da44e' }}>{completeness.overall}%</span>
            </div>
            {/* Progress bar and sections logic */}
          </div>
        </div>
      );
    default:
      return <div style={{ color: theme.text }}>View for {activeSection} not yet extracted.</div>;
  }
};
