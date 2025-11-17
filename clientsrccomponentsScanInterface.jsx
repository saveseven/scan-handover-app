import React, { useState } from 'react';

const ScanInterface = ({ onScan, inputRef, allowDuplicate, onToggleDuplicate }) => {
  const [boxId, setBoxId] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });

  const handleScan = async () => {
    if (!boxId.trim()) {
      showStatus('Please scan or enter a Box ID.', 'error');
      return;
    }

    showStatus(`Processing Box ID: ${boxId}...`, 'warning');
    
    try {
      const result = await onScan(boxId);
      
      if (result.success) {
        if (result.isPending) {
          showStatus(result.message, 'warning');
        } else if (result.isDuplicate) {
          showStatus(result.message, 'duplicate');
        } else {
          showStatus(`✅ Success! Box ID: ${boxId} recorded.`, 'success');
        }
      } else {
        showStatus(result.message, result.isDuplicate ? 'duplicate' : 'error');
      }
    } catch (error) {
      showStatus('Error processing scan. Please try again.', 'error');
    }

    setBoxId('');
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 5000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  return (
    <div className="scan-interface">
      <h3>Scan Box</h3>
      
      {/* Duplicate Toggle */}
      <div className="duplicate-toggle">
        <label>
          <input
            type="checkbox"
            checked={allowDuplicate}
            onChange={onToggleDuplicate}
          />
          Allow Duplicate Scans
        </label>
        {allowDuplicate && (
          <span className="toggle-badge">DUPLICATES ALLOWED</span>
        )}
      </div>

      <div className="scan-area">
        <input
          ref={inputRef}
          type="text"
          value={boxId}
          onChange={(e) => setBoxId(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Scan or Enter Box ID"
          autoFocus
          className="force-focus"
        />
        <button onClick={handleScan}>Scan</button>
      </div>
      
      {status.message && (
        <div className={`status-message status-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default ScanInterface;