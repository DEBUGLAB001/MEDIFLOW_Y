import { store } from '../models/store.js';
import { bedService } from './bedService.js';
import { VisitStatus } from '../models/enums.js';

export class DischargeService {
  /**
   * Completes a patient's inpatient stay, releasing the occupied bed
   * and updating the visit record to DISCHARGED.
   */
  dischargeVisit(visitId) {
    const visit = store.visits.find(v => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} does not exist`);
    }

    if (visit.status !== VisitStatus.ADMITTED) {
      throw new Error(`Only currently admitted visits can be discharged (status: ${visit.status})`);
    }

    visit.status = VisitStatus.DISCHARGED;
    visit.dischargedAt = new Date().toISOString();

    const assignedBedId = visit.assignedBedId;
    visit.assignedBedId = null;

    bedService.releaseBed(visit.assignedBedId);

    store.logEvent('DISCHARGE', `Discharged patient ${visit.patientName} (${visit.id}) from bed ${assignedBedId}`);
    store.save();

    return {
      visit,
      releasedBedId: assignedBedId
    };
  }
}

export const dischargeService = new DischargeService();
