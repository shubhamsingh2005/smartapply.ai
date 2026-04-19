import React, { useState } from 'react';
import api from '../utils/api';
import styles from './JobMatch.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RelevanceScore {
  relevance_score: number;
  level: string;
  color: string;
  breakdown: { skill_overlap: number; experience_alignment: number; contextual_fit: number };
}

interface Analysis {
  job_info?: { title?: string; company?: string; experience_level?: string };
  parsed_requirements?: { explicit_skills?: string[]; implied_skills?: string[] };
  analysis?: {
    fit_score: number;
    matches: { skill: string; match_type: string; evidence: string }[];
    gaps: { explicit: string[]; implied: string[] };
    explanation: string;
  };
  relevance?: RelevanceScore;
  error?: string;
}

interface Assets {
  resume_assets?: {
    tailored_summary: string;
    bullet_optimizations: { original: string; optimized: string; rationale: string }[];
  };
  cover_letter?: string;
  job_info?: { title?: string; company?: string };
  error?: string;
}

type Step = 'input' | 'analyzing' | 'results' | 'generating' | 'assets';

// ─── Component ────────────────────────────────────────────────────────────────
const JobMatch: React.FC = () => {
  const [jdText, setJdText] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadingCL, setDownloadingCL] = useState(false);
  const [error, setError] = useState('');

  // ── Step 1: Analyze JD ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!jdText.trim()) { setError('Please paste a job description first.'); return; }
    setError('');
    setStep('analyzing');
    try {
      const { data } = await api.post('/api/v1/ai/analyze-match', { jd_text: jdText });
      setAnalysis(data);
      setStep('results');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Analysis failed. Please try again.';
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || errorMessage);
      setStep('input');
    }
  };

  // ── Step 2: Generate Assets ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    setStep('generating');
    try {
      const { data } = await api.post('/api/v1/ai/generate-assets', {
        jd_text: jdText,
        analysis_results: analysis,
      });
      setAssets(data);
      setStep('assets');
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || 'Asset generation failed.');
      setStep('results');
    }
  };

  // ── Step 3a: Download Resume PDF ─────────────────────────────────────────────
  const handleDownloadResume = async () => {
    setDownloadingResume(true);
    try {
      const response = await api.post(
        '/api/v1/ai/generate-resume-pdf',
        { jd_text: jdText, assets },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored_resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Resume PDF generation failed. Please try again.');
    } finally {
      setDownloadingResume(false);
    }
  };

  // ── Step 3b: Download Cover Letter PDF ───────────────────────────────────────
  const handleDownloadCoverLetter = async () => {
    setDownloadingCL(true);
    try {
      const response = await api.post(
        '/api/v1/ai/generate-cover-letter-pdf',
        { assets },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover_letter.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Cover letter PDF generation failed. Please try again.');
    } finally {
      setDownloadingCL(false);
    }
  };

  const handleReset = () => {
    setStep('input'); setAnalysis(null); setAssets(null); setError(''); setJdText('');
  };

  const score = analysis?.relevance?.relevance_score ?? 0;
  const level = analysis?.relevance?.level ?? '';
  const scoreColor = analysis?.relevance?.color ?? '#888';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎯 Job Match & Resume Generator</h1>
        <p className={styles.subtitle}>
          Paste any job description — AI will score your fit and generate a tailored resume &amp; cover letter.
        </p>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── STEP: INPUT ─────────────────────────────────────────────────── */}
      {step === 'input' && (
        <div className={styles.card}>
          <label htmlFor="jdInput" className={styles.label}>Paste Job Description</label>
          <textarea
            id="jdInput"
            className={styles.textarea}
            rows={14}
            placeholder="Paste the full job description here (title, responsibilities, requirements, company info)..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <button className={styles.primaryBtn} onClick={handleAnalyze}>
            🔍 Analyze Job Match
          </button>
        </div>
      )}

      {/* ── STEP: ANALYZING ─────────────────────────────────────────────── */}
      {step === 'analyzing' && (
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <h3>Analyzing Job Description...</h3>
          <p>Gemini AI is cross-referencing your Career ERP with the JD requirements.</p>
        </div>
      )}

      {/* ── STEP: GENERATING ────────────────────────────────────────────── */}
      {step === 'generating' && (
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <h3>Generating Documents...</h3>
          <p>AI is crafting your tailored resume and cover letter.</p>
        </div>
      )}

      {/* ── STEP: RESULTS ───────────────────────────────────────────────── */}
      {step === 'results' && analysis && (
        <div className={styles.resultsGrid}>
          {/* Relevance Score Card */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreCircle} style={{ borderColor: scoreColor }}>
              <span className={styles.scoreNum} style={{ color: scoreColor }}>{score}</span>
              <span className={styles.scoreLabel}>/ 100</span>
            </div>
            <div className={styles.scoreLevel} style={{ color: scoreColor }}>{level} MATCH</div>
            <div className={styles.scoreBreakdown}>
              {analysis.relevance?.breakdown && Object.entries(analysis.relevance.breakdown).map(([k, v]) => (
                <div key={k} className={styles.breakdownRow}>
                  <span className={styles.breakdownKey}>{k.replace(/_/g, ' ')}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${v}%`, background: scoreColor }} />
                  </div>
                  <span className={styles.breakdownVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Info + Analysis */}
          <div className={styles.analysisPanel}>
            {analysis.job_info?.title && (
              <div className={styles.jobBadge}>
                <strong>{analysis.job_info.title}</strong>
                {analysis.job_info.company && <span> @ {analysis.job_info.company}</span>}
                {analysis.job_info.experience_level && <span className={styles.expTag}>{analysis.job_info.experience_level}</span>}
              </div>
            )}

            {analysis.analysis?.explanation && (
              <div className={styles.explanation}>{analysis.analysis.explanation}</div>
            )}

            {/* Matches */}
            {(analysis.analysis?.matches?.length ?? 0) > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>✅ Skill Matches</div>
                <div className={styles.tagCloud}>
                  {analysis.analysis!.matches.map((m, i) => (
                    <span key={i} className={styles.matchTag} title={m.evidence}>
                      {m.skill} <span className={styles.matchType}>({m.match_type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {(analysis.analysis?.gaps?.explicit?.length ?? 0) > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>⚠️ Skill Gaps</div>
                <div className={styles.tagCloud}>
                  {analysis.analysis!.gaps.explicit.map((g, i) => (
                    <span key={i} className={styles.gapTag}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            {(analysis.parsed_requirements?.explicit_skills?.length ?? 0) > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>📋 Required Skills</div>
                <div className={styles.tagCloud}>
                  {analysis.parsed_requirements!.explicit_skills!.map((s, i) => (
                    <span key={i} className={styles.reqTag}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actionRow}>
              <button className={styles.primaryBtn} onClick={handleGenerate}>
                ✨ Generate Tailored Resume &amp; Cover Letter
              </button>
              <button className={styles.ghostBtn} onClick={handleReset}>← New JD</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: ASSETS ────────────────────────────────────────────────── */}
      {step === 'assets' && assets && (
        <div className={styles.assetsGrid}>
          {/* Tailored Summary */}
          {assets.resume_assets?.tailored_summary && (
            <div className={styles.assetCard}>
              <div className={styles.assetTitle}>📝 Tailored Professional Summary</div>
              <div className={styles.assetBody}>{assets.resume_assets.tailored_summary}</div>
            </div>
          )}

          {/* Bullet Optimizations */}
          {(assets.resume_assets?.bullet_optimizations?.length ?? 0) > 0 && (
            <div className={styles.assetCard}>
              <div className={styles.assetTitle}>⚡ Optimized Bullet Points</div>
              {assets.resume_assets!.bullet_optimizations.map((b, i) => (
                <div key={i} className={styles.bulletCard}>
                  <div className={styles.bulletBefore}>
                    <span className={styles.bulletLabel}>Before</span>
                    <span>{b.original || '—'}</span>
                  </div>
                  <div className={styles.bulletAfter}>
                    <span className={styles.bulletLabel}>After</span>
                    <span>{b.optimized}</span>
                  </div>
                  {b.rationale && <div className={styles.rationale}>💡 {b.rationale}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Cover Letter Preview */}
          {assets.cover_letter && (
            <div className={`${styles.assetCard} ${styles.fullWidth}`}>
              <div className={styles.assetTitle}>✉️ Cover Letter</div>
              <div className={styles.coverLetterBody}>
                {assets.cover_letter.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className={`${styles.downloadRow} ${styles.fullWidth}`}>
            <button
              className={styles.downloadBtn}
              onClick={handleDownloadResume}
              disabled={downloadingResume}
            >
              {downloadingResume ? '⏳ Generating...' : '📄 Download Resume PDF'}
            </button>
            <button
              className={styles.downloadBtn}
              onClick={handleDownloadCoverLetter}
              disabled={downloadingCL}
            >
              {downloadingCL ? '⏳ Generating...' : '✉️ Download Cover Letter PDF'}
            </button>
            <button className={styles.ghostBtn} onClick={() => setStep('results')}>
              ← Back to Analysis
            </button>
            <button className={styles.ghostBtn} onClick={handleReset}>
              🔄 New JD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatch;
