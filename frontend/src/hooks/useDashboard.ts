import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useProfileStore } from '../stores/useProfileStore';

export const useDashboard = () => {
  const navigate = useNavigate();
  const { setProfile, setHistory, setLoading } = useProfileStore();
  
  const [activeSection, setActiveSection] = useState('Overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/v1/profile/versions');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/profile/me');
      setProfile(response.data);
      setEditData(response.data?.erp_data || {});
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return {
    navigate,
    activeSection,
    setActiveSection,
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    darkMode,
    toggleTheme,
    handleLogout,
    fetchProfile,
  };
};
