import express from 'express';
import { patientService } from '../services/patientService.js';
import { queueService } from '../services/queueService.js';
import { bedService } from '../services/bedService.js';
import { admissionService } from '../services/admissionService.js';
import { statsService } from '../services/statsService.js';
import { store } from '../models/store.js';

const router = express.Router();

// Operational metrics and activity
router.get('/stats', (req, res) => {
  try {
    const summary = statsService.getDashboardSummary();
    res.json({ success: true, ...summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Emergency Triage Queue
router.get('/queue', (req, res) => {
  try {
    const queue = queueService.getQueueDetails();
    res.json({ success: true, count: queue.length, queue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/call-next', (req, res) => {
  try {
    const visit = queueService.callNextPatient();
    if (!visit) {
      return res.status(404).json({ success: false, message: 'No eligible patients currently in queue' });
    }
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient Visits
router.get('/visits', (req, res) => {
  try {
    const { status } = req.query;
    const visits = patientService.getAllVisits(status);
    res.json({ success: true, count: visits.length, visits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/visits/:id', (req, res) => {
  try {
    const visit = patientService.getVisitById(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }
    res.json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/visits/register', (req, res) => {
  try {
    const newVisit = patientService.registerPatient(req.body);
    res.status(201).json({ success: true, visit: newVisit });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/visits/:id/transition', (req, res) => {
  try {
    const { status, requiredCapability } = req.body;
    if (status === 'AWAITING_BED') {
      const visit = admissionService.requestBedAllocation(req.params.id, requiredCapability);
      return res.json({ success: true, visit });
    }
    const visit = patientService.updateVisitStatus(req.params.id, status);
    res.json({ success: true, visit });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Bed Management
router.get('/beds', (req, res) => {
  try {
    const { ward, capability, status } = req.query;
    const beds = bedService.getAllBeds({ ward, capability, status });
    res.json({ success: true, count: beds.length, beds });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/beds/:id', (req, res) => {
  try {
    const bed = bedService.getBedById(req.params.id);
    if (!bed) {
      return res.status(404).json({ success: false, error: 'Bed not found' });
    }
    res.json({ success: true, bed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/beds/allocate', (req, res) => {
  try {
    const { bedId, visitId } = req.body;
    if (!bedId || !visitId) {
      return res.status(400).json({ success: false, error: 'Both bedId and visitId are required' });
    }
    const result = admissionService.allocateBed(visitId, bedId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/beds/transfer', (req, res) => {
  try {
    const { visitId, targetBedId } = req.body;
    if (!visitId || !targetBedId) {
      return res.status(400).json({ success: false, error: 'Both visitId and targetBedId are required' });
    }
    const result = admissionService.transferPatient(visitId, targetBedId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admissions/discharge', (req, res) => {
  try {
    const { visitId } = req.body;
    if (!visitId) {
      return res.status(400).json({ success: false, error: 'visitId is required' });
    }
    const result = admissionService.dischargePatient(visitId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Demo Data Reset
router.post('/reset', (req, res) => {
  try {
    store.reset();
    res.json({ success: true, message: 'Deterministic demo data restored successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
