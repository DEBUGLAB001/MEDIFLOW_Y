import { store } from '../models/store.js';
import { VisitStatus, BedStatus } from '../models/enums.js';

export class StatsService {
  /**
   * Computes authoritative hospital operational metrics from current state.
   */
  calculateOperationalStats(visits = store.visits, beds = store.beds) {
    const waiting = visits.filter(v => v.status === VisitStatus.WAITING).length;
    const inAssessment = visits.filter(v => v.status === VisitStatus.IN_ASSESSMENT).length;
    
    // Inpatient bed allocation queue metric
    const awaitingBed = visits.filter(v => v.status === VisitStatus.ADMITTED).length;
    
    const admitted = visits.filter(v => v.status === VisitStatus.ADMITTED).length;
    const discharged = visits.filter(v => v.status === VisitStatus.DISCHARGED).length;

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const availableBeds = beds.filter(b => b.status === BedStatus.AVAILABLE).length;
    const cleaningBeds = beds.filter(b => b.status === BedStatus.CLEANING).length;

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Ward-level occupancy breakdown
    const wardMap = {};
    for (const bed of beds) {
      if (!wardMap[bed.ward]) {
        wardMap[bed.ward] = { total: 0, occupied: 0, available: 0 };
      }
      wardMap[bed.ward].total++;
      if (bed.status === BedStatus.OCCUPIED) {
        wardMap[bed.ward].occupied++;
      } else if (bed.status === BedStatus.AVAILABLE) {
        wardMap[bed.ward].available++;
      }
    }

    return {
      waiting,
      inAssessment,
      awaitingBed,
      admitted,
      discharged,
      totalBeds,
      occupiedBeds,
      availableBeds,
      cleaningBeds,
      occupancyRate,
      wardBreakdown: wardMap,
      generatedAt: new Date().toISOString()
    };
  }

  getDashboardSummary() {
    const stats = this.calculateOperationalStats();
    return {
      stats,
      recentEvents: store.events.slice(0, 10)
    };
  }
}

export const statsService = new StatsService();
