// Add these new functions to dataStore.js

// Delete scan by ID
export async function deleteScan(scanId) {
  const scans = await getScans();
  const initialLength = scans.length;
  const updatedScans = scans.filter(scan => scan.id !== scanId);
  
  if (updatedScans.length === initialLength) {
    return false; // No scan was deleted
  }
  
  return await writeData(SCANS_FILE, updatedScans);
}

// Update scan by ID
export async function updateScan(scanId, updatedData) {
  const scans = await getScans();
  const scanIndex = scans.findIndex(scan => scan.id === scanId);
  
  if (scanIndex === -1) {
    return false;
  }
  
  scans[scanIndex] = { ...scans[scanIndex], ...updatedData };
  return await writeData(SCANS_FILE, scans);
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// In addScan function, add ID
export async function addScan(scanData) {
  const scans = await getScans();
  const scanWithId = {
    id: generateId(),
    ...scanData,
    timestamp: new Date(scanData.timestamp || new Date())
  };
  scans.unshift(scanWithId);
  return await writeData(SCANS_FILE, scans);
}