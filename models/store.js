import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BedStatus, BedCapability, VisitStatus } from './enums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const INITIAL_BEDS = [
  // Emergency Unit
  { id: 'BED-ER-01', ward: 'ER', room: 'ER-Bay-1', capability: BedCapability.CRITICAL_CARE, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-ER-02', ward: 'ER', room: 'ER-Bay-2', capability: BedCapability.GENERAL_ACUTE, status: BedStatus.OCCUPIED, currentVisitId: 'VST-1002' },
  { id: 'BED-ER-03', ward: 'ER', room: 'ER-Bay-3', capability: BedCapability.GENERAL_ACUTE, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-ER-04', ward: 'ER', room: 'ER-Iso-1', capability: BedCapability.ISOLATION, status: BedStatus.AVAILABLE, currentVisitId: null },

  // Intensive Care Unit
  { id: 'BED-ICU-01', ward: 'ICU', room: 'ICU-Rm-1', capability: BedCapability.CRITICAL_CARE, status: BedStatus.OCCUPIED, currentVisitId: 'VST-1004' },
  { id: 'BED-ICU-02', ward: 'ICU', room: 'ICU-Rm-2', capability: BedCapability.CRITICAL_CARE, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-ICU-03', ward: 'ICU', room: 'ICU-Rm-3', capability: BedCapability.CRITICAL_CARE, status: BedStatus.AVAILABLE, currentVisitId: null },

  // Cardiac Telemetry Wing
  { id: 'BED-TEL-01', ward: 'TEL', room: 'TEL-Rm-1', capability: BedCapability.CARDIAC_TELEMETRY, status: BedStatus.OCCUPIED, currentVisitId: 'VST-1003' },
  { id: 'BED-TEL-02', ward: 'TEL', room: 'TEL-Rm-2', capability: BedCapability.CARDIAC_TELEMETRY, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-TEL-03', ward: 'TEL', room: 'TEL-Rm-3', capability: BedCapability.CARDIAC_TELEMETRY, status: BedStatus.AVAILABLE, currentVisitId: null },

  // General Medical Ward
  { id: 'BED-MED-01', ward: 'MED', room: 'MED-Rm-1', capability: BedCapability.GENERAL_ACUTE, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-MED-02', ward: 'MED', room: 'MED-Rm-2', capability: BedCapability.GENERAL_ACUTE, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-MED-03', ward: 'MED', room: 'MED-Iso-1', capability: BedCapability.ISOLATION, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-MED-04', ward: 'MED', room: 'MED-Rm-4', capability: BedCapability.GENERAL_ACUTE, status: BedStatus.AVAILABLE, currentVisitId: null },

  // Pediatric Ward
  { id: 'BED-PED-01', ward: 'PED', room: 'PED-Rm-1', capability: BedCapability.PEDIATRIC, status: BedStatus.AVAILABLE, currentVisitId: null },
  { id: 'BED-PED-02', ward: 'PED', room: 'PED-Rm-2', capability: BedCapability.PEDIATRIC, status: BedStatus.AVAILABLE, currentVisitId: null }
];

export const INITIAL_VISITS = [
  {
    id: 'VST-1001',
    patientId: 'PAT-001',
    patientName: 'Arthur Dent',
    age: 42,
    chiefComplaint: 'Acute chest pain radiating to left shoulder',
    triageCategory: 2,
    requiredCapability: BedCapability.CARDIAC_TELEMETRY,
    status: VisitStatus.WAITING,
    arrivalTime: '2026-10-21T09:30:00.000Z',
    assignedBedId: null
  },
  {
    id: 'VST-1002',
    patientId: 'PAT-002',
    patientName: 'Trillian Astra',
    age: 34,
    chiefComplaint: 'Severe abdominal trauma following fall',
    triageCategory: 2,
    requiredCapability: BedCapability.GENERAL_ACUTE,
    status: VisitStatus.ADMITTED,
    arrivalTime: '2026-10-21T08:15:00.000Z',
    assignedBedId: 'BED-ER-02',
    admittedAt: '2026-10-21T08:45:00.000Z'
  },
  {
    id: 'VST-1003',
    patientId: 'PAT-003',
    patientName: 'Ford Prefect',
    age: 45,
    chiefComplaint: 'Ventricular arrhythmia and palpitations',
    triageCategory: 3,
    requiredCapability: BedCapability.CARDIAC_TELEMETRY,
    status: VisitStatus.ADMITTED,
    arrivalTime: '2026-10-21T07:50:00.000Z',
    assignedBedId: 'BED-TEL-01',
    admittedAt: '2026-10-21T08:20:00.000Z'
  },
  {
    id: 'VST-1004',
    patientId: 'PAT-004',
    patientName: 'Tricia McMillan',
    age: 60,
    chiefComplaint: 'Respiratory failure with septic shock',
    triageCategory: 1,
    requiredCapability: BedCapability.CRITICAL_CARE,
    status: VisitStatus.ADMITTED,
    arrivalTime: '2026-10-21T06:40:00.000Z',
    assignedBedId: 'BED-ICU-01',
    admittedAt: '2026-10-21T07:10:00.000Z'
  },
  {
    id: 'VST-1005',
    patientId: 'PAT-005',
    patientName: 'Zaphod Beeblebrox',
    age: 52,
    chiefComplaint: 'Severe bilateral headache and blurred vision',
    triageCategory: 3,
    requiredCapability: BedCapability.GENERAL_ACUTE,
    status: VisitStatus.WAITING,
    arrivalTime: '2026-10-21T09:15:00.000Z',
    assignedBedId: null
  },
  {
    id: 'VST-1006',
    patientId: 'PAT-006',
    patientName: 'Marvin Android',
    age: 70,
    chiefComplaint: 'Chronic joint distress and mild hypoxemia',
    triageCategory: 3,
    requiredCapability: BedCapability.GENERAL_ACUTE,
    status: VisitStatus.WAITING,
    arrivalTime: '2026-10-21T09:45:00.000Z',
    assignedBedId: null
  },
  {
    id: 'VST-1007',
    patientId: 'PAT-007',
    patientName: 'Slartibartfast Fjords',
    age: 80,
    chiefComplaint: 'Suspected deep vein thrombosis in lower right extremity',
    triageCategory: 4,
    requiredCapability: BedCapability.GENERAL_ACUTE,
    status: VisitStatus.WAITING,
    arrivalTime: '2026-10-21T10:00:00.000Z',
    assignedBedId: null
  },
  {
    id: 'VST-1008',
    patientId: 'PAT-008',
    patientName: 'Fenny Church',
    age: 8,
    chiefComplaint: 'High febrile convulsions and respiratory wheezing',
    triageCategory: 2,
    requiredCapability: BedCapability.PEDIATRIC,
    status: VisitStatus.AWAITING_BED,
    arrivalTime: '2026-10-21T08:30:00.000Z',
    assignedBedId: null
  },
  {
    id: 'VST-1009',
    patientId: 'PAT-009',
    patientName: 'Gargravarr Mind',
    age: 29,
    chiefComplaint: 'Minor wrist laceration requiring sutures',
    triageCategory: 5,
    requiredCapability: BedCapability.GENERAL_ACUTE,
    status: VisitStatus.WAITING,
    arrivalTime: '2026-10-21T10:10:00.000Z',
    assignedBedId: null
  }
];

export const INITIAL_EVENTS = [
  { id: 'EVT-001', timestamp: '2026-10-21T07:10:00.000Z', type: 'ADMISSION', description: 'Patient Tricia McMillan admitted to BED-ICU-01' },
  { id: 'EVT-002', timestamp: '2026-10-21T08:20:00.000Z', type: 'ADMISSION', description: 'Patient Ford Prefect admitted to BED-TEL-01' },
  { id: 'EVT-003', timestamp: '2026-10-21T08:45:00.000Z', type: 'ADMISSION', description: 'Patient Trillian Astra admitted to BED-ER-02' }
];

class HospitalStore {
  constructor() {
    this.beds = [];
    this.visits = [];
    this.events = [];
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.beds = data.beds || [];
        this.visits = data.visits || [];
        this.events = data.events || [];
        return;
      } catch {
        // Fallback to initial if corrupted
      }
    }

    this.reset();
  }

  save() {
    try {
      const data = {
        beds: this.beds,
        visits: this.visits,
        events: this.events
      };
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist store state:', err);
    }
  }

  reset() {
    this.beds = JSON.parse(JSON.stringify(INITIAL_BEDS));
    this.visits = JSON.parse(JSON.stringify(INITIAL_VISITS));
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.save();
  }

  logEvent(type, description) {
    const event = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      type,
      description
    };
    this.events.unshift(event);
    if (this.events.length > 50) {
      this.events.pop();
    }
    this.save();
    return event;
  }
}

export const store = new HospitalStore();
