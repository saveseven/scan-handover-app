import express from 'express';
import {
  scanBox,
  getScans,
  getFilteredScans,
  getDestinationCounts,
  getPendingScans,
  processPendingScans,
  exportScans,
  uploadDispatchData,
  deleteScan,
  getScansWithDuplicates
} from '../controllers/scanController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/scan', scanBox);
router.get('/history', getScansWithDuplicates); // Updated to include duplicates
router.get('/filtered', getFilteredScans);
router.get('/counts', getDestinationCounts);
router.get('/pending', getPendingScans);
router.post('/process-pending', processPendingScans);
router.get('/export', exportScans);
router.post('/upload-dispatch', upload.single('file'), uploadDispatchData);
router.delete('/:scanId', deleteScan); // New delete endpoint

export default router;