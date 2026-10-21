export const TriageCategory = Object.freeze({
  RESUSCITATION: 1, // Immediate life threat
  EMERGENT: 2,      // Imminently life-threatening
  URGENT: 3,        // Potentially life-threatening
  LESS_URGENT: 4,   // Potentially serious
  NON_URGENT: 5     // Less urgent / minor
});

export const TriageLabels = Object.freeze({
  1: 'Category 1 - Resuscitation',
  2: 'Category 2 - Emergent',
  3: 'Category 3 - Urgent',
  4: 'Category 4 - Less Urgent',
  5: 'Category 5 - Non-Urgent'
});

export const VisitStatus = Object.freeze({
  WAITING: 'WAITING',
  IN_ASSESSMENT: 'IN_ASSESSMENT',
  AWAITING_BED: 'AWAITING_BED',
  ADMITTED: 'ADMITTED',
  DISCHARGED: 'DISCHARGED'
});

export const BedStatus = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING'
});

export const BedCapability = Object.freeze({
  GENERAL_ACUTE: 'general_acute',
  CARDIAC_TELEMETRY: 'cardiac_telemetry',
  CRITICAL_CARE: 'critical_care',
  ISOLATION: 'isolation',
  PEDIATRIC: 'pediatric'
});

export const WardNames = Object.freeze({
  ER: 'Emergency Assessment Unit',
  ICU: 'Intensive Care Unit',
  TEL: 'Cardiac & Telemetry Wing',
  MED: 'General Medical Ward',
  PED: 'Pediatric Care Ward'
});
