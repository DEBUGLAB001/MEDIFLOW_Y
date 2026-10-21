# MediFlow — Hospital Emergency & Bed Allocation System

MediFlow is a hospital operations workspace designed for emergency department staff to manage arriving patients, clinical triage priorities, and inpatient bed availability. The system enables hospital personnel to track emergency waitlists, admit eligible patients to matching ward beds, coordinate bed transfers, and manage discharges in real time.

---

## 1. Application Overview

### Core Functionality

- Emergency Intake Registration: Register newly arriving patients with generated identifiers, clinical triage urgency, and specific care requirements.
- Priority Triage Queue: View queued patients scheduled transparently by clinical urgency and arrival time, advancing eligible individuals into assessment rooms.
- Bed Management Board: Monitor hospital bed occupancy across multiple specialized wards, with filters for department, care capability, and availability.
- Bed Allocation & Transfers: Assign compatible available beds to patients requiring inpatient admission, and safely transfer patients between units when medical needs change.
- Patient Discharge & Bed Release: Discharge treated patients to release occupied beds immediately for incoming emergency arrivals.
- Live Operations Command Center: Review real-time operational statistics, including queue lengths, active bay assessments, awaiting bed counts, and overall bed occupancy rates.

---

## 2. Debugging Challenge

While MediFlow provides the workflows necessary for hospital operations, several operational defects prevent patients from being scheduled accurately, beds from being allocated correctly, and dashboard indicators from staying synchronized.

### Reported Issues & Tasks:

Issue 1: Priority Queue Arrival Tie-Breaker

- User Symptom: When two patients arrive with the same triage urgency category, the patient who arrived later is placed ahead in the queue and called into assessment first.
- Task: Ensure that patients with identical triage urgency are scheduled strictly in order of their arrival time, giving priority to whoever has been waiting longer.

Issue 2: Intake Queue Visit Eligibility

- User Symptom: Patients who have already been called into assessment bays continue to appear in the emergency intake queue and can be called repeatedly.
- Task: Ensure that only patients currently waiting for initial clinical triage appear in the intake queue.

Issue 3: Bed Capability Compatibility Lookup

- User Symptom: Staff cannot allocate available beds in specialized units (such as Cardiac Telemetry or Intensive Care) to patients who specifically require those care capabilities, as the system falsely rejects them as incompatible.
- Task: Ensure the bed allocation check recognizes matching bed capabilities so that eligible patients can be assigned to compatible specialized beds.

Issue 4: Bed Release on Patient Discharge

- User Symptom: When an admitted patient is discharged, the hospital database continues to record their assigned bed as occupied, preventing newly arrived patients from being placed in the released bed.
- Task: Ensure that completing a patient discharge properly updates the bed record back to available with no active occupant.

Issue 5: Operational Statistics Awaiting Bed Calculation

- User Symptom: The command center overview card for "Awaiting Bed" displays the number of patients already admitted to hospital wards rather than the count of patients actively waiting for bed allocation.
- Task: Correct the metric calculation so that it accurately displays only the count of patients waiting for an inpatient bed.

Issue 6: Frontend Bed Board Synchronization After Discharge

- User Symptom: Discharging a patient from the bed management screen releases the patient in the records, but the visual bed card continues to show as occupied with the discharged patient's name until the entire browser page is refreshed manually.
- Task: Update the frontend discharge workflow so that the bed management board automatically re-renders bed availability immediately after discharge.

---

## 3. Expected Behavior After Fixing Bugs

1. Patients with the same triage urgency are ordered by arrival time, ensuring the longest-waiting patient is called first.
2. Patients currently undergoing clinical assessment are removed from the waiting intake queue.
3. Available beds in specialized units (Telemetry, ICU, Isolation, Pediatrics) are successfully allocated to patients with matching care requirements.
4. Discharging an admitted patient releases the bed in system records, restoring its available status.
5. The "Awaiting Bed" dashboard metric correctly reflects the number of patients awaiting inpatient bed placement.
6. Discharging a patient from the bed board immediately updates the bed card to available without requiring a page reload.

Automated verification can be executed by running `npm test`. Once all issues are resolved, MediFlow operates as a reliable, consistent hospital operations command center.
