import React from 'react';
import cssStyles from './Dashboard.module.css';
import { Sidebar } from '../components/Sidebar';
import { ProfileModule } from '../components/Profile/ProfileModule';
import { AnalyticsModule } from '../components/Analytics/AnalyticsModule';
import { useDashboard } from '../hooks/useDashboard';
import { useProfileStore } from '../stores/useProfileStore';

const Dashboard: React.FC = () => {
  const {
    activeSection, setActiveSection, isEditing, setIsEditing,
    editData, setEditData, darkMode, toggleTheme, handleLogout
  } = useDashboard();
  
  const { profile, isLoading } = useProfileStore();

  const theme = {
    bg: darkMode ? '#0d1117' : '#f6f8fa',
    sidebarBg: darkMode ? '#161b22' : '#ffffff',
    cardBg: darkMode ? '#161b22' : '#ffffff',
    text: darkMode ? '#c9d1d9' : '#1f2328',
    textSecondary: darkMode ? '#8b949e' : '#656d76',
    border: darkMode ? '#30363d' : '#d0d7de',
    inputBg: darkMode ? '#0d1117' : '#ffffff',
    // ... other theme tokens
  };

  const sections = [
    { name: 'Overview', icon: '🏠' },
    { name: 'Personal Info', icon: '👤' },
    { name: 'Work Experience', icon: '💼' },
    { name: 'Projects', icon: '🚀' },
    { name: 'Analytics', icon: '📊' },
  ];

  if (isLoading) return <div className={cssStyles.loading}>Loading Production Environment...</div>;

  return (
    <div className={cssStyles.container} style={{ backgroundColor: theme.bg, color: theme.text }}>
      <Sidebar 
        cssStyles={cssStyles}
        sections={sections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
      />
      
      <main className={cssStyles.main}>
        <header className={cssStyles.header} style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h2>{activeSection}</h2>
          <div className={cssStyles.headerActions}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className={cssStyles.editBtn}>Edit Section</button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setIsEditing(false)} className={cssStyles.cancelBtn}>Cancel</button>
                <button onClick={() => {/* handleSave */}} className={cssStyles.saveBtn}>Save Changes</button>
              </div>
            )}
          </div>
        </header>

        <section className={cssStyles.content}>
          {activeSection === 'Analytics' ? (
            <AnalyticsModule theme={theme} styles={{}} />
          ) : (
            <ProfileModule 
              activeSection={activeSection}
              isEditing={isEditing}
              editData={editData}
              updateEditData={(f, v) => setEditData({ ...editData, [f]: v })}
              updateArrayItem={() => {}} 
              removeArrayItem={() => {}}
              addNewItem={() => {}}
              theme={theme}
              styles={{}} 
              cssStyles={cssStyles}
            />
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
