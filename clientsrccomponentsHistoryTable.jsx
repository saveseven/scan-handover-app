import React, { useState } from 'react';
import { scanService } from '../services/scanService';

const HistoryTable = ({ scans, onRefresh, onDeleteScan }) => {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    statusFilter: 'ALL',
    searchTerm: ''
  });
  const [filteredScans, setFilteredScans] = useState([]);

  // Apply filters whenever scans or filters change
  React.useEffect(() => {
    applyFilters();
  }, [scans, filters]);

  const applyFilters = () => {
    let filtered = [...scans];

    // Date filter
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(scan => new Date(scan.timestamp) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(scan => new Date(scan.timestamp) <= end);
    }

    // Status filter
    if (filters.statusFilter !== 'ALL') {
      filtered = filtered.filter(scan => {
        const status = scan.finalStatus?.toUpperCase() || '';
        switch (filters.statusFilter.toUpperCase()) {
          case 'TRUE': return status === 'TRUE';
          case 'PENDING': return status.startsWith('PENDING');
          case 'OVERSCANNED': return status.startsWith('OVERSCANNED');
          case 'DUPLICATE': return scan.isDuplicate;
          default: return true;
        }
      });
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(scan => 
        scan.boxId?.toLowerCase().includes(term) ||
        scan.consignment?.toLowerCase().includes(term) ||
        scan.destination?.toLowerCase().includes(term)
      );
    }

    setFilteredScans(filtered);
  };

  const handleExport = async (format) => {
    try {
      const blob = await scanService.exportScans(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `scan-data.${format === 'excel' ? 'xlsx' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error exporting data: ' + error.message);
    }
  };

  const getDestinationColor = (destination) => {
    // Generate consistent color based on destination
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = destination.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="history-section">
      <div className="section-header">
        <h3>Scan History & Filtering</h3>
        <div className="action-buttons">
          <button onClick={onRefresh} className="btn-refresh">
            🔄 Refresh
          </button>
          <button onClick={() => handleExport('excel')} className="btn-export">
            📊 Export Excel
          </button>
          <button onClick={() => handleExport('json')} className="btn-export">
            📁 Export JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-area">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="search"
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({...prev, searchTerm: e.target.value}))}
            placeholder="Box ID, Consignment, Destination"
          />
        </div>

        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.statusFilter}
            onChange={(e) => setFilters(prev => ({...prev, statusFilter: e.target.value}))}
          >
            <option value="ALL">ALL</option>
            <option value="TRUE">TRUE (Completed)</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERSCANNED">OVERSCANNED</option>
            <option value="DUPLICATE">DUPLICATE</option>
          </select>
        </div>

        <button onClick={applyFilters} className="btn-apply">
          Apply Filters
        </button>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredScans.length} of {scans.length} records
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="scan-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Box ID</th>
              <th>Consignment</th>
              <th>DB Status</th>
              <th>Verified Time</th>
              <th>Final Status</th>
              <th>Scan Count</th>
              <th>QTY</th>
              <th>Total Box</th>
              <th>Destination</th>
              <th>Scanner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredScans.map((scan) => (
              <tr 
                key={scan.id} 
                className={`
                  scan-row 
                  ${scan.isDuplicate ? 'duplicate-row' : ''}
                  ${scan.finalStatus === 'TRUE' ? 'success-row' : ''}
                `}
              >
                <td>{new Date(scan.timestamp).toLocaleString()}</td>
                <td>{scan.shift}</td>
                <td className="box-id-cell">
                  {scan.boxId}
                  {scan.isDuplicate && (
                    <span className="duplicate-badge" title={`Duplicate count: ${scan.duplicateCount || 1}`}>
                      🔄 {scan.duplicateCount || 1}
                    </span>
                  )}
                </td>
                <td>{scan.consignment}</td>
                <td>{scan.dbStatus}</td>
                <td>{scan.verified}</td>
                <td className={`status-cell final-status-${scan.finalStatus?.toLowerCase()}`}>
                  {scan.finalStatus}
                </td>
                <td>{scan.scanCount}</td>
                <td>{scan.qty}</td>
                <td>{scan.totalBox}</td>
                <td 
                  className="destination-cell"
                  style={{ 
                    backgroundColor: getDestinationColor(scan.destination),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {scan.destination}
                </td>
                <td>{scan.scanner?.split('@')[0]}</td>
                <td>
                  <button 
                    onClick={() => onDeleteScan(scan.id)}
                    className="btn-delete"
                    title="Delete this scan"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredScans.length === 0 && (
              <tr>
                <td colSpan="13" className="no-data">
                  No scans found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;