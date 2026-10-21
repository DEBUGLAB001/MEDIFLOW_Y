import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PriorityQueue } from '../algorithms/priorityQueue.js';
import { queueService } from '../services/queueService.js';
import { bedService } from '../services/bedService.js';
import { dischargeService } from '../services/dischargeService.js';
import { statsService } from '../services/statsService.js';
import { store } from '../models/store.js';
import { BedStatus, VisitStatus, BedCapability } from '../models/enums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testResults = {};
let passedCount = 0;
let failedCount = 0;
const suiteStartTime = Date.now();

function formatErrorMessage(err) {
  if (!err) return 'Assertion failed';
  const raw = typeof err === 'string' ? err : (err.message || 'Assertion failed');
  // Strip ANSI color codes and take clean single-line summary
  return raw
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .split('\n')[0]
    .trim();
}

async function runTest(testName, testFn) {
  const start = Date.now();
  try {
    store.reset();
    await testFn();
    const duration = Date.now() - start;
    testResults[testName] = {
      Status: 'passed',
      'Execution time': `${duration}ms`
    };
    passedCount++;
  } catch (err) {
    const duration = Date.now() - start;
    testResults[testName] = {
      Status: 'failed',
      'Execution time': `${duration}ms`,
      Error: formatErrorMessage(err)
    };
    failedCount++;
  }
}

// -------------------------------------------------------------
// Test 1: Priority Queue Arrival Tie-Breaker
// -------------------------------------------------------------
await runTest('test_priority_queue_arrival_tie_breaker', async () => {
  const pq = new PriorityQueue();
  const earlierPatient = {
    id: 'VST-EARLY',
    triageCategory: 3,
    arrivalTime: '2026-10-21T09:00:00Z'
  };
  const laterPatient = {
    id: 'VST-LATER',
    triageCategory: 3,
    arrivalTime: '2026-10-21T09:30:00Z'
  };

  pq.insert(laterPatient);
  pq.insert(earlierPatient);

  const firstOut = pq.extractMin();
  assert.strictEqual(
    firstOut.id,
    'VST-EARLY',
    'Patients with equal triage category must be served FIFO based on earlier arrival time'
  );
});

// -------------------------------------------------------------
// Test 2: Intake Queue Visit Eligibility Verification
// -------------------------------------------------------------
await runTest('test_queue_visit_eligibility', async () => {
  const waitingVisit = { id: 'V-WAIT', status: VisitStatus.WAITING };
  const inAssessmentVisit = { id: 'V-ASSESS', status: VisitStatus.IN_ASSESSMENT };

  assert.strictEqual(
    queueService.isVisitEligibleForQueue(waitingVisit),
    true,
    'Waiting visits must be eligible for queue'
  );
  assert.strictEqual(
    queueService.isVisitEligibleForQueue(inAssessmentVisit),
    false,
    'Visits already in clinical assessment must be excluded from waiting queue'
  );
});

// -------------------------------------------------------------
// Test 3: Bed Capability Compatibility Lookup
// -------------------------------------------------------------
await runTest('test_bed_capability_compatibility', async () => {
  const telemetryBed = {
    id: 'BED-TEL-02',
    ward: 'TEL',
    capability: BedCapability.CARDIAC_TELEMETRY,
    status: BedStatus.AVAILABLE
  };

  const isTelemetryCompatible = bedService.checkBedCompatibility(telemetryBed, BedCapability.CARDIAC_TELEMETRY);
  assert.strictEqual(
    isTelemetryCompatible,
    true,
    'Bed with cardiac telemetry capability must be recognized as compatible for cardiac telemetry patient'
  );
});

// -------------------------------------------------------------
// Test 4: Bed Release on Patient Discharge
// -------------------------------------------------------------
await runTest('test_discharge_releases_occupied_bed', async () => {
  const initialBed = store.beds.find(b => b.id === 'BED-ER-02');
  assert.strictEqual(initialBed.status, BedStatus.OCCUPIED);

  const result = dischargeService.dischargeVisit('VST-1002');
  assert.strictEqual(result.visit.status, VisitStatus.DISCHARGED);

  const releasedBed = store.beds.find(b => b.id === 'BED-ER-02');
  assert.strictEqual(
    releasedBed.status,
    BedStatus.AVAILABLE,
    'Discharged patient bed must be marked AVAILABLE in store'
  );
  assert.strictEqual(
    releasedBed.currentVisitId,
    null,
    'Discharged patient bed currentVisitId must be reset to null'
  );
});

// -------------------------------------------------------------
// Test 5: Operational Statistics Awaiting Bed Calculation
// -------------------------------------------------------------
await runTest('test_operational_statistics_calculation', async () => {
  const stats = statsService.calculateOperationalStats(store.visits, store.beds);

  const expectedAwaitingBed = store.visits.filter(v => v.status === VisitStatus.AWAITING_BED).length;
  assert.strictEqual(
    stats.awaitingBed,
    expectedAwaitingBed,
    'Awaiting bed metric must reflect visits in AWAITING_BED status'
  );
});

// -------------------------------------------------------------
// Test 6: Frontend State Synchronization After Discharge
// -------------------------------------------------------------
await runTest('test_frontend_state_synchronization', async () => {
  const appJsPath = path.resolve(__dirname, '../public/app.js');
  const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

  const match = appJsContent.match(/window\.handleDischarge\s*=\s*async\s*function[^{]*\{([\s\S]*?)\n\};/);
  assert.ok(match, 'window.handleDischarge must be defined in app.js');

  const handlerBody = match[1];
  assert.ok(
    handlerBody.includes('loadBeds()'),
    'Frontend handleDischarge must synchronize bed board state by calling loadBeds() upon discharge'
  );
});

// -------------------------------------------------------------
// Final Report Output
// -------------------------------------------------------------
const totalDuration = Date.now() - suiteStartTime;

const output = {
  ...testResults,
  Passed: passedCount,
  Failed: failedCount,
  'Total bugs': 6,
  'Total Execution time': `${totalDuration}ms`
};

// Stdout must contain valid JSON only
process.stdout.write(JSON.stringify(output, null, 2) + '\n');

// Exit 0 if all tests passed, 1 if any failed
if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
