import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export const AutoApply: React.FC = () => {
  const [jobUrl, setJobUrl] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [logs, setLogs] = useState<{ timestamp: string; message: string; level: string }[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [interactionRequired, setInteractionRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(status) && !interactionRequired) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/v1/automation/status/${taskId}`);
          setStatus(res.data.status);
          setLogs(res.data.logs || []);
          setInteractionRequired(res.data.interaction_required);
          if (res.data.screenshot) {
            setScreenshot(`http://localhost:8000${res.data.screenshot}`);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, status, interactionRequired]);

  const startAutomation = async () => {
    if (!jobUrl) return;
    setLoading(true);
    setLogs([]);
    setScreenshot(null);
    setInteractionRequired(false);
    
    try {
      // We pass an empty erp_data for now since the backend will likely use the profile of the current user
      // OR we just fetch the user's active profile. For simplicity, we assume the backend defaults or uses what we send.
      // We fetch the profile first.
      const profileRes = await api.get('/api/v1/profile/active');
      const erpData = profileRes.data.data;
      
      const res = await api.post('/api/v1/automation/start', {
        job_url: jobUrl,
        erp_data: erpData,
        assets: {}
      });
      setTaskId(res.data.task_id);
      setStatus('INITIALIZING');
    } catch (error) {
      console.error(error);
      alert('Failed to start automation');
    } finally {
      setLoading(false);
    }
  };

  const handleInteract = async (command: 'SUBMIT' | 'CANCEL') => {
    if (!taskId) return;
    try {
      setInteractionRequired(false);
      await api.post(`/api/v1/automation/interact/${taskId}`, { command });
      // Polling will naturally resume
    } catch (e) {
      console.error(e);
      alert('Interaction failed');
    }
  };

  const isDarkMode = localStorage.getItem('theme') === 'dark';

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: isDarkMode ? '#f8fafc' : '#1e293b'
    }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
        Human-in-the-Loop Browser Automation (Phase 7)
      </h2>
      <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px' }}>
        This engine securely launches an AI-powered headless browser to auto-fill applications, taking a screenshot for your final approval.
      </p>

      {/* Input Section */}
      <div style={{
        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Job Posting URL</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="url" 
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="e.g., https://greenhouse.io/company/jobs/12345"
            disabled={status !== 'IDLE' && status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELLED'}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
              background: isDarkMode ? '#0f172a' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#0f172a',
              outline: 'none'
            }}
          />
          <button 
            onClick={startAutomation}
            disabled={loading || !jobUrl || (status !== 'IDLE' && status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELLED')}
            style={{
              padding: '0 24px', background: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none',
              borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Starting...' : 'Auto-Fill Application'}
          </button>
        </div>
      </div>

      {/* Execution Interface */}
      {taskId && (
        <div style={{ display: 'flex', gap: '24px', height: '600px' }}>
          
          {/* Terminal / Logs */}
          <div style={{
            flex: 1,
            background: '#020617',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ background: '#0f172a', padding: '12px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', gap: '6px', marginRight: '16px' }}>
                <div style={{ background: '#ef4444', width: '12px', height: '12px', borderRadius: '50%' }}></div>
                <div style={{ background: '#eab308', width: '12px', height: '12px', borderRadius: '50%' }}></div>
                <div style={{ background: '#22c55e', width: '12px', height: '12px', borderRadius: '50%' }}></div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>
                Automation Terminal [{status}]
              </span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: '13px' }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '8px', 
                  color: log.level === 'ERROR' ? '#ef4444' : log.level === 'WARNING' ? '#eab308' : log.level === 'SUCCESS' ? '#22c55e' : '#94a3b8' 
                }}>
                  <span style={{ color: '#475569', marginRight: '10px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
              {status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELLED' && !interactionRequired && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#3b82f6' }}>
                  <span>Executing Playwright Driver...</span>
                </div>
              )}
            </div>
          </div>

          {/* Browser Viewer */}
          <div style={{
            flex: 1,
            background: isDarkMode ? '#0f172a' : '#f8fafc',
            borderRadius: '12px',
            border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ 
              background: isDarkMode ? '#1e293b' : '#e2e8f0', 
              padding: '12px', 
              textAlign: 'center', 
              fontWeight: '600', 
              fontSize: '14px',
              borderBottom: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}` 
            }}>
              Live Execution Preview
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '10px' }}>
              {screenshot ? (
                <img src={screenshot} alt="Browser screenshot" style={{ maxWidth: '100%', border: '1px solid #334155', borderRadius: '4px' }} />
              ) : (
                <span style={{ color: '#64748b' }}>No preview available yet...</span>
              )}
            </div>
            
            {interactionRequired && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                borderTop: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '16px',
              }}>
                <div style={{ color: '#ca8a04', fontWeight: 'bold', marginBottom: '12px' }}>
                  ⚠️ User Verification Required
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleInteract('SUBMIT')}
                    style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Confirm & Submit
                  </button>
                  <button 
                    onClick={() => handleInteract('CANCEL')}
                    style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Abort Automation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoApply;
