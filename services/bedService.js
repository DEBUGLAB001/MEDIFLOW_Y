import { store } from '../models/store.js';
import { BedIndex } from '../algorithms/bedLookup.js';
import { BedStatus, VisitStatus } from '../models/enums.js';

export class BedService {
  constructor() {
    this.index = new BedIndex(store.beds);
  }

  _refreshIndex() {
    this.index.load(store.beds);
  }

  getAllBeds(filters = {}) {
    this._refreshIndex();
    const beds = this.index.filter(filters);

    // Hydrate bed with current patient visit details if occupied
    return beds.map(bed => {
      let occupant = null;
      if (bed.currentVisitId) {
        const visit = store.visits.find(v => v.id === bed.currentVisitId);
        if (visit) {
          occupant = {
            visitId: visit.id,
            patientId: visit.patientId,
            patientName: visit.patientName,
            age: visit.age,
            triageCategory: visit.triageCategory,
            chiefComplaint: visit.chiefComplaint,
            admittedAt: visit.admittedAt || null
          };
        }
      }
      return {
        ...bed,
        occupant
      };
    });
  }

  getBedById(bedId) {
    this._refreshIndex();
    return this.index.get(bedId);
  }

  checkBedCompatibility(bed, requiredCapability) {
    if (!bed) return false;
    if (!requiredCapability || requiredCapability === 'general_acute') {
      return true;
    }

    return Array.isArray(bed.capabilities)
      ? bed.capabilities.includes(requiredCapability)
      : bed.capabilities === requiredCapability;
  }

  allocateBed(bedId, visitId) {
    const bed = store.beds.find(b => b.id === bedId);
    if (!bed) {
      throw new Error(`Bed ${bedId} does not exist`);
    }

    if (bed.status !== BedStatus.AVAILABLE || bed.currentVisitId !== null) {
      throw new Error(`Bed ${bedId} is not available for allocation`);
    }

    const visit = store.visits.find(v => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} does not exist`);
    }

    if (visit.status === VisitStatus.ADMITTED) {
      throw new Error(`Patient visit ${visitId} is already admitted to bed ${visit.assignedBedId}`);
    }

    if (visit.status === VisitStatus.DISCHARGED) {
      throw new Error(`Discharged patient cannot be admitted`);
    }

    const isCompatible = this.checkBedCompatibility(bed, visit.requiredCapability);
    if (!isCompatible) {
      throw new Error(`Bed ${bed.id} (${bed.capability}) is incompatible with patient requirement (${visit.requiredCapability})`);
    }

    // Atomic allocation
    bed.status = BedStatus.OCCUPIED;
    bed.currentVisitId = visit.id;

    visit.status = VisitStatus.ADMITTED;
    visit.assignedBedId = bed.id;
    visit.admittedAt = new Date().toISOString();

    store.logEvent('BED_ALLOCATION', `Allocated bed ${bed.id} (${bed.ward}) to patient ${visit.patientName} (${visit.id})`);
    store.save();
    this._refreshIndex();

    return { bed, visit };
  }

  transferBed(visitId, targetBedId) {
    const visit = store.visits.find(v => v.id === visitId);
    if (!visit) {
      throw new Error(`Visit ${visitId} does not exist`);
    }

    if (visit.status !== VisitStatus.ADMITTED || !visit.assignedBedId) {
      throw new Error(`Patient visit ${visitId} is not currently admitted to a bed`);
    }

    const sourceBedId = visit.assignedBedId;
    if (sourceBedId === targetBedId) {
      throw new Error('Target bed must be different from current bed assignment');
    }

    const targetBed = store.beds.find(b => b.id === targetBedId);
    if (!targetBed) {
      throw new Error(`Destination bed ${targetBedId} does not exist`);
    }

    if (targetBed.status !== BedStatus.AVAILABLE || targetBed.currentVisitId !== null) {
      throw new Error(`Destination bed ${targetBedId} is not available`);
    }

    const isCompatible = this.checkBedCompatibility(targetBed, visit.requiredCapability);
    if (!isCompatible) {
      throw new Error(`Destination bed ${targetBed.id} is incompatible with patient requirement`);
    }

    const sourceBed = store.beds.find(b => b.id === sourceBedId);

    // Atomic transfer: release source, occupy target, update visit
    if (sourceBed) {
      sourceBed.status = BedStatus.AVAILABLE;
      sourceBed.currentVisitId = null;
    }

    targetBed.status = BedStatus.OCCUPIED;
    targetBed.currentVisitId = visit.id;
    visit.assignedBedId = targetBed.id;

    store.logEvent('BED_TRANSFER', `Transferred patient ${visit.patientName} from ${sourceBedId} to ${targetBedId}`);
    store.save();
    this._refreshIndex();

    return { sourceBedId, targetBed, visit };
  }

  releaseBed(bedId) {
    if (!bedId) return false;
    const bed = store.beds.find(b => b.id === bedId);
    if (!bed) return false;

    bed.status = BedStatus.AVAILABLE;
    bed.currentVisitId = null;
    store.save();
    this._refreshIndex();
    return true;
  }
}

export const bedService = new BedService();
