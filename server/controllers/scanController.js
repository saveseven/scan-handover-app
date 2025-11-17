import { 
  getScans, 
  addScan, 
  getDispatchData, 
  getPendingScans, 
  addPendingScan, 
  removePendingScan,
  updateDispatchData,
  deleteScan,
  updateScan
} from '../models/dataStore.js';

// Updated scan function with duplicate handling
export const scanBox = async (req, res) => {
  try {
    const { boxId, userEmail, allowDuplicate = false } = req.body;
    const boxIdTrimmed = boxId.toString().trim();

    // Get existing scans
    const scans = await getScans();
    const today = new Date().toDateString();
    
    // Check for duplicate scan today
    const todayScans = scans.filter(scan => 
      new Date(scan.timestamp).toDateString() === today
    );

    const existingScan = todayScans.find(scan => scan.boxId === boxIdTrimmed);
    
    if (existingScan && !allowDuplicate) {
      return res.json({
        success: false,
        isDuplicate: true,
        message: `⚠️ Duplicate Scan! Box ID **${boxIdTrimmed}** has already been scanned today.`,
        duplicateData: existingScan
      });
    }

    // If duplicate is allowed, mark it as duplicate
    if (existingScan && allowDuplicate) {
      // Update existing scan as duplicate
      const updatedScan = {
        ...existingScan,
        isDuplicate: true,
        duplicateCount: (existingScan.duplicateCount || 1) + 1,
        lastScanned: new Date()
      };
      
      await updateScan(existingScan.id, updatedScan);
      
      return res.json({
        success: true,
        isDuplicate: true,
        message: `🔄 Duplicate Box ID **${boxIdTrimmed}** recorded. (Count: ${updatedScan.duplicateCount})`,
        row: updatedScan
      });
    }

    // Rest of the scan logic remains same...
    // [Previous scan logic here...]

  } catch (error) {
    console.error('Error in scanBox:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete scan endpoint
export const deleteScan = async (req, res) => {
  try {
    const { scanId } = req.params;
    const success = await deleteScan(scanId);
    
    if (success) {
      res.json({ success: true, message: 'Scan deleted successfully' });
    } else {
      res.status(404).json({ error: 'Scan not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scan' });
  }
};

// Get scans with duplicates highlighted
export const getScansWithDuplicates = async (req, res) => {
  try {
    const scans = await getScans();
    
    // Mark duplicates
    const scansWithDuplicates = scans.map(scan => {
      const sameDayScans = scans.filter(s => 
        s.boxId === scan.boxId && 
        new Date(s.timestamp).toDateString() === new Date(scan.timestamp).toDateString()
      );
      
      return {
        ...scan,
        isDuplicate: sameDayScans.length > 1,
        duplicateCount: sameDayScans.length
      };
    });

    res.json(scansWithDuplicates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
};
