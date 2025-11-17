import React, { useState, useEffect, useRef } from 'react';
import ScanInterface from './components/ScanInterface';
import HistoryTable from './components/HistoryTable';
import Dashboard from './components/Dashboard';
import PendingNotification from './components/PendingNotification';
import { scanService } from './services/scanService';
import './styles/App.css';

function App() {
  const [scans, setScans] = useState([]);
  const [destinationCounts, setDestinationCounts] = useState({});
  const [pendingCount, setPendingCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    setUserEmail('user@example.com');
    // Auto-focus input field
    inputRef.current?.focus();
  }, []);

  // Always keep input focused
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus();
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadInitialData = async () => {
    try {
      const [scansData, countsData, pendingData] = await Promise.all([
        scanService.getScans(),
        scanService.getDestinationCounts(),
        scanService.getPendingScans()
      ]);
      
      setScans(scansData);
      setDestinationCounts(countsData);
      setPendingCount(pendingData.count);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleScan = async (boxId) => {
    const result = await scanService.scanBox(boxId, userEmail, allowDuplicate);
    
    if (result.success) {
      if (result.isDuplicate) {
        // Update existing scan in the list
        setScans(prev => prev.map(scan => 
          scan.id === result.row.id ? result.row : scan
        ));
      } else {
        // Add new scan
        setScans(prev => [result.row, ...prev]);
      }
      
      if (result.counts) {
        setDestinationCounts(result.counts);
      }
    }
    
    if (result.isPending) {
      setPendingCount(prev => prev + 1);
    }

    // Re-focus input after scan
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    return result;
  };

  const handleDeleteScan = async (scanId) => {
    if (window.confirm('Are you sure you want to delete this scan?')) {
      try {
        await scanService.deleteScan(scanId);
        setScans(prev => prev.filter(scan => scan.id !== scanId));
        await loadInitialData(); // Refresh counts
      } catch (error) {
        alert('Error deleting scan: ' + error.message);
      }
    }
  };

  const handleProcessPending = async () => {
    const result = await scanService.processPendingScans();
    setPendingCount(result.pendingCount);
    await loadInitialData();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📦 Box Scanning System</h1>
        <div className="user-info">
          Logged in as: <strong>{userEmail}</strong>
        </div>
      </header>

      <div className="app-container">
        <div className="dashboard-section">
          <Dashboard counts={destinationCounts} />
          <div className="scan-section">
            <ScanInterface 
              onScan={handleScan} 
              inputRef={inputRef}
              allowDuplicate={allowDuplicate}
              onToggleDuplicate={() => setAllowDuplicate(!allowDuplicate)}
            />
            <PendingNotification 
              count={pendingCount} 
              onProcess={handleProcessPending} 
            />
          </div>
        </div>

        <HistoryTable 
          scans={scans} 
          onRefresh={loadInitialData} 
          onDeleteScan={handleDeleteScan}
        />
      </div>
    </div>
  );
}

export default App;
