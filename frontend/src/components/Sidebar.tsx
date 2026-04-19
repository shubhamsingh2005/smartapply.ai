import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  cssStyles: any;
  sections: any[];
  activeSection: str;
  setActiveSection: (s: str) => void;
  isEditing: boolean;
  setIsEditing: (b: boolean) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cssStyles, sections, activeSection, setActiveSection,
  isEditing, setIsEditing, darkMode, toggleTheme, handleLogout
}) => {
  const navigate = useNavigate();

  return (
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

        <div className={cssStyles.sectionHeader} style={{ marginTop: '24px' }}>AI Tools</div>
        <button
          onClick={() => navigate('/job-match')}
          className={cssStyles.navItem}
          style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '8px' }}
        >
          <span style={{ marginRight: '10px' }}>🎯</span> Job Match <span style={{ marginLeft: 'auto', fontSize: '10px', backgroundColor: '#6366f1', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>PHASE 4</span>
        </button>
        <button
          onClick={() => navigate('/auto-apply')}
          className={cssStyles.navItem}
          style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
          <span style={{ marginRight: '10px' }}>🤖</span> Auto Apply <span style={{ marginLeft: 'auto', fontSize: '10px', backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>PHASE 7</span>
        </button>

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
  );
};
