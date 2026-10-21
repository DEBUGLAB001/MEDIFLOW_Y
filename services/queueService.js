import { store } from '../models/store.js';
import { PriorityQueue } from '../algorithms/priorityQueue.js';
import { VisitStatus } from '../models/enums.js';

export class QueueService {
  /**
   * Evaluates if a patient visit is currently eligible for the emergency intake queue.
   */
  isVisitEligibleForQueue(visit) {
    if (!visit) return false;
    return visit.status === VisitStatus.WAITING || visit.status === VisitStatus.IN_ASSESSMENT;
  }

  /**
   * Builds the current operational priority queue from authoritative visits.
   */
  buildQueue() {
    const pq = new PriorityQueue();
    const eligibleVisits = store.visits.filter(v => this.isVisitEligibleForQueue(v));

    for (const visit of eligibleVisits) {
      pq.insert(visit);
    }

    return pq;
  }

  /**
   * Retrieves the ordered queue with calculated wait times and operational ranks.
   */
  getQueueDetails() {
    const pq = this.buildQueue();
    const sortedVisits = pq.toArray();
    const now = Date.now();

    return sortedVisits.map((visit, index) => {
      const arrival = new Date(visit.arrivalTime).getTime();
      const waitingMinutes = Math.max(0, Math.floor((now - arrival) / (1000 * 60)));

      return {
        ...visit,
        queuePosition: index + 1,
        waitingMinutes
      };
    });
  }

  /**
   * Selects and advances the next highest-priority eligible patient into assessment.
   */
  callNextPatient() {
    const pq = this.buildQueue();
    const nextVisit = pq.peek();

    if (!nextVisit) {
      return null;
    }

    // Update the authoritative record
    const visitRecord = store.visits.find(v => v.id === nextVisit.id);
    if (!visitRecord) {
      return null;
    }

    visitRecord.status = VisitStatus.IN_ASSESSMENT;
    visitRecord.assessmentStartedAt = new Date().toISOString();

    store.logEvent('TRIAGE_ADVANCE', `Patient ${visitRecord.patientName} (${visitRecord.id}) advanced to clinical assessment`);
    store.save();

    return visitRecord;
  }
}

export const queueService = new QueueService();
