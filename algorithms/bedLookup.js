/**
 * Bed Indexing and Lookup Engine.
 * Implements hash-map based indexing for fast bed retrieval and filtering.
 */
export class BedIndex {
  constructor(beds = []) {
    this.bedMap = new Map();
    this.wardIndex = new Map();
    this.load(beds);
  }

  load(beds) {
    this.bedMap.clear();
    this.wardIndex.clear();

    for (const bed of beds) {
      this.add(bed);
    }
  }

  add(bed) {
    this.bedMap.set(bed.id, { ...bed });

    if (!this.wardIndex.has(bed.ward)) {
      this.wardIndex.set(bed.ward, new Set());
    }
    this.wardIndex.get(bed.ward).add(bed.id);
  }

  get(bedId) {
    return this.bedMap.get(bedId) || null;
  }

  has(bedId) {
    return this.bedMap.has(bedId);
  }

  update(bed) {
    if (this.bedMap.has(bed.id)) {
      this.bedMap.set(bed.id, { ...bed });
      return true;
    }
    return false;
  }

  getAll() {
    return Array.from(this.bedMap.values());
  }

  getByWard(ward) {
    const ids = this.wardIndex.get(ward);
    if (!ids) return [];
    return Array.from(ids).map(id => this.bedMap.get(id));
  }

  filter({ ward, capability, status }) {
    let result = Array.from(this.bedMap.values());

    if (ward && ward !== 'ALL') {
      result = result.filter(bed => bed.ward === ward);
    }

    if (capability && capability !== 'ALL') {
      result = result.filter(bed => bed.capability === capability);
    }

    if (status && status !== 'ALL') {
      result = result.filter(bed => bed.status === status);
    }

    return result;
  }
}
