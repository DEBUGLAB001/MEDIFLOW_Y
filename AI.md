# MediFlow

## Description

MediFlow is a hospital operations application built with Node.js and Express (ES modules) to manage emergency patient intake, clinical triage priority scheduling, ward bed allocation, transfers, and discharges. The application server is initialized in `server.js` and exposes REST endpoints via `routes/api.js`, serving a vanilla JavaScript command center interface in `public/app.js`. Emergency queue prioritization is powered by a binary min-heap in `algorithms/priorityQueue.js`, while bed lookups and capability matching are handled by an in-memory hash index in `algorithms/bedLookup.js`. Clinical workflows are coordinated across `services/queueService.js`, `services/bedService.js`, `services/dischargeService.js`, and `services/statsService.js`. Authoritative state is managed by `models/store.js` and persisted locally to `data/db.json` with deterministic demo seed data.

## Repository Structure

```
.
├── challenge.json              # Runtime configuration and topic metadata
├── package.json                # Project dependencies and operational scripts
├── server.js                   # Application entry point and static file server
├── start.sh                    # Container startup script
├── algorithms/
│   ├── bedLookup.js            # Hash-map indexing and bed filtering engine
│   └── priorityQueue.js        # Binary min-heap for triage priority scheduling
├── data/
│   └── db.json                 # Authoritative local JSON application state
├── models/
│   ├── enums.js                # Triage categories, visit statuses, and bed states
│   └── store.js                # State management and file persistence
├── public/
│   ├── app.js                  # Frontend client state and API integration
│   ├── index.html              # Command center layout and modal dialogs
│   └── styles.css              # Application design system and responsive styles
├── routes/
│   └── api.js                  # Express route handlers for intake, beds, and stats
└── services/
    ├── admissionService.js     # Unified patient lifecycle state transitions
    ├── bedService.js           # Bed availability, allocation, and transfer logic
    ├── dischargeService.js     # Patient discharge and bed release workflows
    ├── patientService.js       # Patient registration and demographic retrieval
    ├── queueService.js         # Operational queue construction and patient calling
    └── statsService.js         # Hospital dashboard metric calculations
```

## Bugs and Bug Locations

### 1. Priority Queue Arrival Tie-Breaker

- Bug location: `algorithms/priorityQueue.js`, within `PriorityQueue.defaultComparator(a, b)`.
- How to observe it: Register or observe two visits with identical triage categories but different arrival timestamps (such as `VST-1005` arriving at 09:15 and `VST-1006` arriving at 09:45). Inspect the queue table or call the next patient.
- Failure: The tie-breaker subtracts `timeB - timeA` instead of `timeA - timeB`, causing a later arrival to jump ahead of an earlier arrival of equal medical urgency.
- Expected: When triage categories are identical, visits must be ordered FIFO by earlier arrival time (`timeA - timeB`).

### 2. Intake Queue Visit Eligibility

- Bug location: `services/queueService.js`, within `QueueService.prototype.isVisitEligibleForQueue(visit)`.
- How to observe it: Call the next patient into clinical assessment (`IN_ASSESSMENT`), then inspect the queue table or query `GET /api/queue`.
- Failure: The eligibility condition checks `visit.status === VisitStatus.WAITING || visit.status === VisitStatus.IN_ASSESSMENT`, treating patients currently under assessment as still waiting in the intake queue.
- Expected: Only visits with status `VisitStatus.WAITING` should be eligible for the intake triage queue.

### 3. Bed Capability Compatibility Lookup

- Bug location: `services/bedService.js`, within `BedService.prototype.checkBedCompatibility(bed, requiredCapability)`.
- How to observe it: Attempt to allocate a patient requiring specialized care (such as `cardiac_telemetry` or `critical_care`) to an available compatible bed (such as `BED-TEL-02` or `BED-ICU-02`).
- Failure: The method evaluates `bed.capabilities` instead of the singular string attribute `bed.capability` stored on bed records, returning `false` and rejecting compatible beds.
- Expected: The compatibility check must evaluate `bed.capability === requiredCapability`, permitting allocation to compatible specialized beds.

### 4. Bed Release on Patient Discharge

- Bug location: `services/dischargeService.js`, within `DischargeService.prototype.dischargeVisit(visitId)`.
- How to observe it: Discharge an admitted patient (such as `VST-1002` occupying `BED-ER-02`). Query `GET /api/beds` or inspect `data/db.json`.
- Failure: `visit.assignedBedId` is reset to `null` before invoking `bedService.releaseBed(visit.assignedBedId)`, passing `null` and leaving the bed in `OCCUPIED` status.
- Expected: The assigned bed identifier must be captured and passed to `bedService.releaseBed(assignedBedId)` so the released bed transitions to `AVAILABLE` with `currentVisitId = null`.

### 5. Operational Statistics Awaiting Bed Calculation

- Bug location: `services/statsService.js`, within `StatsService.prototype.calculateOperationalStats(visits, beds)`.
- How to observe it: Inspect the "Awaiting Bed" card on the command center KPI strip or query `GET /api/stats`.
- Failure: The `awaitingBed` metric is computed by filtering visits with `v.status === VisitStatus.ADMITTED` instead of `VisitStatus.AWAITING_BED`, causing the card to report the count of admitted patients.
- Expected: `awaitingBed` must count visits with `status === VisitStatus.AWAITING_BED`.

### 6. Frontend Bed Board Synchronization After Discharge

- Bug location: `public/app.js`, within `window.handleDischarge(visitId)`.
- How to observe it: On the Bed Management Board, discharge an admitted patient.
- Failure: After a successful discharge API response, `handleDischarge` calls `loadVisits()`, `loadQueue()`, and `loadStats()`, but omits `loadBeds()`, leaving the bed card displaying stale `OCCUPIED` status until manual page reload.
- Expected: `handleDischarge` must call `loadBeds()` after a successful discharge mutation to refresh the bed board display immediately.
