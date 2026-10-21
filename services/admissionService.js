import { store } from '../models/store.js';
import { bedService } from './bedService.js';
import { dischargeService } from './dischargeService.js';
import { VisitStatus } from '../models/enums.js';

export class AdmissionService {
  requestBedAllocation(visitId, requiredCapability = null) {
    const visit = store.visits.find(v => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    if (visit.status !== VisitStatus.IN_ASSESSMENT && visit.status !== VisitStatus.WAITING) {
      throw new Error(`Cannot request bed allocation for visit in ${visit.status} state`);
    }

    visit.status = VisitStatus.AWAITING_BED;
    if (requiredCapability) {
      visit.requiredCapability = requiredCapability;
    }

    store.logEvent('ADMISSION_REQUEST', `Bed allocation requested for ${visit.patientName} (${visit.id})`);
    store.save();

    return visit;
  }

  allocateBed(visitId, bedId) {
    return bedService.allocateBed(bedId, visitId);
  }

  transferPatient(visitId, targetBedId) {
    return bedService.transferBed(visitId, targetBedId);
  }

  dischargePatient(visitId) {
    const visit = store.visits.find(v => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    // If patient is in ED assessment and does not occupy a bed, direct release
    if (visit.status === VisitStatus.IN_ASSESSMENT || visit.status === VisitStatus.WAITING) {
      visit.status = VisitStatus.DISCHARGED;
      visit.dischargedAt = new Date().toISOString();
      store.logEvent('DIRECT_DISCHARGE', `Discharged patient ${visit.patientName} directly from ED assessment`);
      store.save();
      return { visit, releasedBedId: null };
    }

    // Inpatient discharge
    return dischargeService.dischargeVisit(visitId);
  }
}

export const admissionService = new AdmissionService();
