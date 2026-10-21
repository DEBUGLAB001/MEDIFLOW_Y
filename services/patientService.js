import { store } from '../models/store.js';
import { VisitStatus, TriageCategory } from '../models/enums.js';

export class PatientService {
  getAllVisits(statusFilter = null) {
    if (statusFilter && statusFilter !== 'ALL') {
      return store.visits.filter(v => v.status === statusFilter);
    }
    return [...store.visits];
  }

  getVisitById(visitId) {
    return store.visits.find(v => v.id === visitId) || null;
  }

  registerPatient({ patientName, age, chiefComplaint, triageCategory, requiredCapability }) {
    if (!patientName || !patientName.trim()) {
      throw new Error('Patient name is required');
    }

    const numericAge = parseInt(age, 10);
    if (isNaN(numericAge) || numericAge < 0 || numericAge > 130) {
      throw new Error('Valid patient age is required');
    }

    const categoryNum = parseInt(triageCategory, 10);
    if (isNaN(categoryNum) || categoryNum < 1 || categoryNum > 5) {
      throw new Error('Simulated triage category must be between 1 and 5');
    }

    const nextNum = store.visits.length + 1;
    const patientId = `PAT-${String(nextNum).padStart(3, '0')}`;
    const visitId = `VST-${1000 + nextNum}`;

    const newVisit = {
      id: visitId,
      patientId,
      patientName: patientName.trim(),
      age: numericAge,
      chiefComplaint: (chiefComplaint || 'Unspecified emergency evaluation').trim(),
      triageCategory: categoryNum,
      requiredCapability: requiredCapability || 'general_acute',
      status: VisitStatus.WAITING,
      arrivalTime: new Date().toISOString(),
      assignedBedId: null
    };

    store.visits.push(newVisit);
    store.logEvent('REGISTRATION', `Registered arriving patient ${newVisit.patientName} (${newVisit.id}) - Category ${newVisit.triageCategory}`);
    store.save();

    return newVisit;
  }

  updateVisitStatus(visitId, newStatus) {
    const visit = this.getVisitById(visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} not found`);
    }

    if (!Object.values(VisitStatus).includes(newStatus)) {
      throw new Error(`Invalid visit status: ${newStatus}`);
    }

    visit.status = newStatus;
    store.save();
    return visit;
  }
}

export const patientService = new PatientService();
