import React, { useState } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedPriority, setCorrectedPriority] = useState('');
  const [correctedTeam, setCorrectedTeam] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const priorityOptions = [
    'HIGH PRIORITY URGENT TECHNICAL',
    'HIGH PRIORITY LONG TERM TECHNICAL',
    'LOW PRIORITY TECHNICAL',
    'AWARENESS',
  ];
  const teamOptions = [
    'TECH',
    'PRODUCT',
    'policy',
    ''
  ];

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('employeeId', employeeId);
      formData.append('query', query);
      files.forEach((file) => {
        formData.append('files', file);
      });
      const response = await fetch('http://127.0.0.1:5000/classify', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to classify SR. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://127.0.0.1:5000/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          employeeId,
          query: result.query,
          predictedPriority: result.priority,
          predictedTeam: result.team || '',
          correctedPriority,
          correctedTeam,
        }),
      });
      alert('Thank you for your feedback! The models will improve over time.');
    } catch (err) {
      alert('Failed to submit correction.');
    }
    setShowCorrection(false);
    setCorrectedPriority('');
    setCorrectedTeam('');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <button onClick={toggleTheme} className="theme-toggle">
        {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      
      <h1 className="header-title">SmartDesk Support Router</h1>
      <p className="header-subtitle">
        Intelligent portal to automatically classify Service Request (SR) priority and assign it to the appropriate team using NLP models.
      </p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Employee Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="e.g. EMP12345"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Service Request Query</label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Describe the issue in detail (e.g. The customer cannot access their online banking portal...)"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supporting Documents (Optional)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf,image/*"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            {files.length > 0 && (
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: '-15px', marginBottom: '15px' }}>
                {files.length} file(s) selected
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Analyzing Request...' : 'Classify SR'}
          </button>
        </form>

        {error && <div style={{ color: '#FF6B6B', marginTop: '15px', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

        {result && (
          <div className="result-container">
            <div className="result-item">
              <div className="result-label">Query Analyzed:</div>
              <div className="result-value" style={{ opacity: 0.8 }}>{result.query}</div>
            </div>
            <div className="result-item">
              <div className="result-label">Priority Level:</div>
              <div className="result-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>{result.priority}</div>
            </div>
            {result.priority.toLowerCase() !== 'awareness' ? (
              <div className="result-item">
                <div className="result-label">Assigned Team:</div>
                <div className="result-value">{result.team}</div>
              </div>
            ) : (
              <div className="result-item">
                <div className="result-label">Assigned Team:</div>
                <div className="result-value" style={{ fontStyle: 'italic', opacity: 0.7 }}>Skipped (Awareness Query)</div>
              </div>
            )}

            <div className="correction-section">
              <div style={{ fontWeight: '500', marginBottom: '10px' }}>Is this classification inaccurate?</div>
              <div className="correction-buttons">
                <button className="btn-primary" style={{ padding: '10px 20px', flex: '0 1 auto' }} onClick={() => setShowCorrection(true)}>
                  Yes, Correct It
                </button>
                <button className="btn-secondary" onClick={() => setShowCorrection(false)}>
                  No, It's Perfect
                </button>
              </div>

              {showCorrection && (
                <form onSubmit={handleCorrectionSubmit} style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                  <div className="form-group">
                    <label className="form-label">Corrected Priority</label>
                    <select
                      value={correctedPriority}
                      onChange={e => {
                        setCorrectedPriority(e.target.value);
                        if (e.target.value === 'AWARENESS') {
                          setCorrectedTeam('');
                        }
                      }}
                      className="input-field"
                      required
                    >
                      <option value="" disabled>Select correct priority</option>
                      {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Corrected Team</label>
                    <select
                      value={correctedTeam}
                      onChange={e => setCorrectedTeam(e.target.value)}
                      className="input-field"
                      required={correctedPriority !== 'AWARENESS'}
                    >
                      <option value="" disabled>Select correct team</option>
                      {teamOptions.map(opt => <option key={opt} value={opt}>{opt || 'None'}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: '12px' }}>
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="copyright">
        &copy; {new Date().getFullYear()} SmartDesk AI Project. All rights reserved. Built for accuracy and speed.
      </div>
    </div>
  );
}

export default App;